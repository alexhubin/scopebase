import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import get_session
from app.common.enums import OrganizationRole
from app.common.security import decode_jwt
from app.organizations.models import Organization, OrganizationMember
from app.users.models import User

bearer = HTTPBearer(auto_error=False)
SessionDependency = Annotated[AsyncSession, Depends(get_session)]


@dataclass
class Principal:
    user: User
    organization: Organization
    role: OrganizationRole


async def get_current_user(
    session: SessionDependency,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )
    payload = decode_jwt(credentials.credentials, "access")
    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from error
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_principal(session: SessionDependency, user: CurrentUser) -> Principal:
    result = await session.execute(
        select(OrganizationMember, Organization)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user.id)
        .order_by(Organization.created_at)
        .limit(1)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization required")
    membership, organization = row
    return Principal(user=user, organization=organization, role=membership.role)


PrincipalDependency = Annotated[Principal, Depends(get_principal)]


def require_staff(principal: PrincipalDependency) -> Principal:
    if principal.role not in {OrganizationRole.owner, OrganizationRole.member}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return principal


StaffPrincipal = Annotated[Principal, Depends(require_staff)]


def require_owner(principal: PrincipalDependency) -> Principal:
    if principal.role != OrganizationRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return principal


OwnerPrincipal = Annotated[Principal, Depends(require_owner)]
