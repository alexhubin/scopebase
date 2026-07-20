import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.config import settings
from app.common.enums import PublicLinkKind
from app.common.public_links import PublicLink
from app.common.security import generate_public_token, token_digest
from app.common.time import as_utc


async def create_public_link(
    session: AsyncSession,
    organization_id: uuid.UUID,
    project_id: uuid.UUID,
    resource_id: uuid.UUID,
    kind: PublicLinkKind,
    expires_in_days: int | None,
) -> tuple[str, PublicLink]:
    await session.execute(
        update(PublicLink)
        .where(
            PublicLink.resource_id == resource_id,
            PublicLink.kind == kind,
            PublicLink.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(UTC))
    )
    raw_token = generate_public_token()
    expires_at = None
    if expires_in_days is not None:
        expires_at = datetime.now(UTC) + timedelta(days=expires_in_days)
    link = PublicLink(
        organization_id=organization_id,
        project_id=project_id,
        resource_id=resource_id,
        kind=kind,
        token_hash=token_digest(raw_token),
        expires_at=expires_at,
    )
    session.add(link)
    return raw_token, link


async def resolve_public_link(
    session: AsyncSession,
    raw_token: str,
    kind: PublicLinkKind,
) -> PublicLink:
    link = await session.scalar(
        select(PublicLink).where(
            PublicLink.token_hash == token_digest(raw_token),
            PublicLink.kind == kind,
        )
    )
    if link is None or link.revoked_at is not None:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.expires_at is not None and as_utc(link.expires_at) <= datetime.now(UTC):
        raise HTTPException(status_code=410, detail="Link expired")
    return link


def public_url(kind: PublicLinkKind, raw_token: str) -> str:
    segment = {
        PublicLinkKind.brief: "brief",
        PublicLinkKind.scope: "scope",
        PublicLinkKind.change_request: "change-request",
    }[kind]
    return f"{settings.public_app_url.rstrip('/')}/client/{segment}/{raw_token}"
