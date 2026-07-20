from fastapi import APIRouter
from sqlalchemy import select

from app.auth.dependencies import (
    CurrentUser,
    OwnerPrincipal,
    PrincipalDependency,
    SessionDependency,
)
from app.common.schemas import Message
from app.common.slug import slugify
from app.organizations.models import OrganizationMember
from app.organizations.schemas import (
    MemberResponse,
    OrganizationResponse,
    OrganizationUpdate,
    ProfileUpdate,
)
from app.users.models import User

router = APIRouter(prefix="/organization", tags=["Organization"])


@router.get("", response_model=OrganizationResponse)
async def get_organization(principal: PrincipalDependency) -> OrganizationResponse:
    return OrganizationResponse.model_validate(principal.organization)


@router.patch("", response_model=OrganizationResponse)
async def update_organization(
    payload: OrganizationUpdate,
    principal: OwnerPrincipal,
    session: SessionDependency,
) -> OrganizationResponse:
    principal.organization.name = payload.name
    principal.organization.slug = f"{slugify(payload.name)}-{str(principal.organization.id)[:8]}"
    await session.commit()
    return OrganizationResponse.model_validate(principal.organization)


@router.patch("/profile", response_model=Message)
async def update_profile(
    payload: ProfileUpdate,
    user: CurrentUser,
    session: SessionDependency,
) -> Message:
    user.full_name = payload.full_name
    await session.commit()
    return Message(message="Profile updated")


@router.get("/members", response_model=list[MemberResponse])
async def list_members(
    principal: OwnerPrincipal,
    session: SessionDependency,
) -> list[MemberResponse]:
    result = await session.execute(
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == principal.organization.id)
        .order_by(User.full_name)
    )
    return [
        MemberResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=membership.role,
        )
        for membership, user in result.all()
    ]
