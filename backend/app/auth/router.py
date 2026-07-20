import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import CurrentUser, PrincipalDependency, SessionDependency
from app.auth.models import PasswordResetToken, RefreshToken
from app.auth.schemas import (
    ForgotPasswordRequest,
    OrganizationSummary,
    ResetPasswordRequest,
    SessionResponse,
    SignInRequest,
    SignUpRequest,
    UserResponse,
)
from app.common.config import settings
from app.common.enums import OrganizationRole
from app.common.rate_limit import auth_rate_limit
from app.common.schemas import Message
from app.common.security import (
    create_jwt,
    decode_jwt,
    generate_public_token,
    hash_password,
    normalize_email,
    token_digest,
    verify_password,
)
from app.common.slug import slugify
from app.common.time import as_utc
from app.email.provider import TransactionalEmail, email_provider
from app.organizations.models import Organization, OrganizationMember
from app.users.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
RateLimited = Annotated[None, Depends(auth_rate_limit)]


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="scopebase_refresh",
        value=token,
        max_age=settings.refresh_token_ttl_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key="scopebase_refresh",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def make_session(user: User, organization: Organization, role: OrganizationRole) -> SessionResponse:
    token = create_jwt(
        str(user.id),
        "access",
        timedelta(minutes=settings.access_token_ttl_minutes),
    )
    return SessionResponse(
        access_token=token,
        expires_in=settings.access_token_ttl_minutes * 60,
        user=UserResponse.model_validate(user),
        organization=OrganizationSummary(
            id=organization.id,
            name=organization.name,
            slug=organization.slug,
            role=role.value,
            plan=organization.plan.value,
        ),
    )


def issue_refresh(
    user_id: uuid.UUID, family_id: uuid.UUID | None = None
) -> tuple[str, RefreshToken]:
    raw = create_jwt(
        str(user_id),
        "refresh",
        timedelta(days=settings.refresh_token_ttl_days),
    )
    record = RefreshToken(
        user_id=user_id,
        token_hash=token_digest(raw),
        family_id=family_id or uuid.uuid4(),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
    )
    return raw, record


async def first_membership(
    session: SessionDependency, user: User
) -> tuple[OrganizationMember, Organization]:
    result = await session.execute(
        select(OrganizationMember, Organization)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user.id)
        .order_by(Organization.created_at)
        .limit(1)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=403, detail="Organization required")
    return row[0], row[1]


@router.post("/sign-up", response_model=SessionResponse, status_code=201)
async def sign_up(
    payload: SignUpRequest,
    response: Response,
    session: SessionDependency,
    rate_limit: RateLimited,
) -> SessionResponse:
    email = normalize_email(str(payload.email))
    existing = await session.scalar(select(User.id).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        email=email, password_hash=hash_password(payload.password), full_name=payload.full_name
    )
    session.add(user)
    await session.flush()
    base_slug = slugify(payload.organization_name)
    organization = Organization(
        name=payload.organization_name,
        slug=f"{base_slug}-{str(user.id)[:8]}",
        owner_id=user.id,
    )
    session.add(organization)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=organization.id,
            user_id=user.id,
            role=OrganizationRole.owner,
        )
    )
    raw_refresh, refresh_record = issue_refresh(user.id)
    session.add(refresh_record)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Unable to create account") from error
    set_refresh_cookie(response, raw_refresh)
    return make_session(user, organization, OrganizationRole.owner)


@router.post("/sign-in", response_model=SessionResponse)
async def sign_in(
    payload: SignInRequest,
    response: Response,
    session: SessionDependency,
    rate_limit: RateLimited,
) -> SessionResponse:
    user = await session.scalar(
        select(User).where(User.email == normalize_email(str(payload.email)))
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    membership, organization = await first_membership(session, user)
    raw_refresh, refresh_record = issue_refresh(user.id)
    session.add(refresh_record)
    await session.commit()
    set_refresh_cookie(response, raw_refresh)
    return make_session(user, organization, membership.role)


@router.post("/refresh", response_model=SessionResponse)
async def refresh_session(
    response: Response,
    session: SessionDependency,
    rate_limit: RateLimited,
    scopebase_refresh: Annotated[str | None, Cookie()] = None,
) -> SessionResponse:
    if scopebase_refresh is None:
        raise HTTPException(status_code=401, detail="Refresh token required")
    payload = decode_jwt(scopebase_refresh, "refresh")
    digest = token_digest(scopebase_refresh)
    record = await session.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest))
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if record.revoked_at is not None:
        await session.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == record.family_id)
            .values(revoked_at=datetime.now(UTC))
        )
        await session.commit()
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")
    if as_utc(record.expires_at) <= datetime.now(UTC):
        record.revoked_at = datetime.now(UTC)
        await session.commit()
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Refresh token expired")
    if payload.get("sub") != str(record.user_id):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await session.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    membership, organization = await first_membership(session, user)
    replacement, replacement_record = issue_refresh(user.id, record.family_id)
    record.revoked_at = datetime.now(UTC)
    record.replaced_by_hash = replacement_record.token_hash
    session.add(replacement_record)
    await session.commit()
    set_refresh_cookie(response, replacement)
    return make_session(user, organization, membership.role)


@router.post("/sign-out", response_model=Message)
async def sign_out(
    response: Response,
    session: SessionDependency,
    scopebase_refresh: Annotated[str | None, Cookie()] = None,
) -> Message:
    if scopebase_refresh:
        record = await session.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_digest(scopebase_refresh))
        )
        if record and record.revoked_at is None:
            record.revoked_at = datetime.now(UTC)
            await session.commit()
    clear_refresh_cookie(response)
    return Message(message="Signed out")


@router.get("/me", response_model=SessionResponse)
async def current_session(
    user: CurrentUser,
    principal: PrincipalDependency,
) -> SessionResponse:
    return make_session(user, principal.organization, principal.role)


@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: SessionDependency,
    rate_limit: RateLimited,
) -> Message:
    user = await session.scalar(
        select(User).where(User.email == normalize_email(str(payload.email)))
    )
    if user:
        raw_token = generate_public_token()
        session.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_digest(raw_token),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        await session.commit()
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
        background_tasks.add_task(
            email_provider.send,
            TransactionalEmail(
                recipient=user.email,
                subject="Reset your ScopeBase password",
                heading="Reset your password",
                body="Use the secure link below within one hour to choose a new password.",
                action_label="Reset password",
                action_url=reset_url,
            ),
        )
    return Message(message="If the account exists, password reset instructions have been sent")


@router.post("/reset-password", response_model=Message)
async def reset_password(
    payload: ResetPasswordRequest,
    session: SessionDependency,
    rate_limit: RateLimited,
) -> Message:
    record = await session.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_digest(payload.token)
        )
    )
    if (
        record is None
        or record.used_at is not None
        or as_utc(record.expires_at) <= datetime.now(UTC)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = await session.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user.password_hash = hash_password(payload.password)
    record.used_at = datetime.now(UTC)
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await session.commit()
    return Message(message="Password updated")
