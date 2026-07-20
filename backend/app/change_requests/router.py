import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select

from app.activity.service import add_activity
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.change_requests.models import ChangeRequest
from app.change_requests.schemas import (
    ChangeRequestCreate,
    ChangeRequestDecision,
    ChangeRequestResponse,
    PublicChangeRequestResponse,
)
from app.common.config import settings
from app.common.enums import ChangeRequestStatus, PublicLinkKind, SubscriptionPlan
from app.common.link_schemas import LinkOptions, PublicLinkResponse
from app.common.public_link_service import create_public_link, public_url, resolve_public_link
from app.common.rate_limit import public_rate_limit
from app.common.schemas import Message
from app.email.provider import TransactionalEmail, email_provider
from app.organizations.models import Organization
from app.projects.dependencies import StaffProject
from app.projects.models import Project
from app.users.models import User

router = APIRouter(tags=["Change requests"])
public_router = APIRouter(prefix="/public/change-requests", tags=["Client portal"])
PublicRateLimited = Annotated[None, Depends(public_rate_limit)]


async def load_change_request(
    change_request_id: uuid.UUID,
    project: Project,
    session: SessionDependency,
) -> ChangeRequest:
    change_request = await session.scalar(
        select(ChangeRequest).where(
            ChangeRequest.id == change_request_id,
            ChangeRequest.project_id == project.id,
        )
    )
    if change_request is None:
        raise HTTPException(status_code=404, detail="Change request not found")
    return change_request


@router.get(
    "/projects/{project_id}/change-requests",
    response_model=list[ChangeRequestResponse],
)
async def list_change_requests(
    project: StaffProject,
    session: SessionDependency,
) -> list[ChangeRequestResponse]:
    requests = await session.scalars(
        select(ChangeRequest)
        .where(ChangeRequest.project_id == project.id)
        .order_by(ChangeRequest.created_at.desc())
    )
    return [ChangeRequestResponse.model_validate(item) for item in requests.all()]


@router.post(
    "/projects/{project_id}/change-requests",
    response_model=ChangeRequestResponse,
    status_code=201,
)
async def create_change_request(
    payload: ChangeRequestCreate,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> ChangeRequestResponse:
    if principal.organization.plan != SubscriptionPlan.pro:
        raise HTTPException(status_code=403, detail="Change requests require the Pro plan")
    change_request = ChangeRequest(
        project_id=project.id,
        created_by=principal.user.id,
        status=ChangeRequestStatus.draft,
        **payload.model_dump(),
    )
    session.add(change_request)
    await session.flush()
    add_activity(
        session,
        principal.organization.id,
        project.id,
        principal.user.id,
        principal.user.full_name,
        "change_request_created",
        {"title": change_request.title},
    )
    await session.commit()
    await session.refresh(change_request)
    return ChangeRequestResponse.model_validate(change_request)


@router.patch(
    "/projects/{project_id}/change-requests/{change_request_id}",
    response_model=ChangeRequestResponse,
)
async def update_change_request(
    change_request_id: uuid.UUID,
    payload: ChangeRequestCreate,
    project: StaffProject,
    session: SessionDependency,
) -> ChangeRequestResponse:
    change_request = await load_change_request(change_request_id, project, session)
    if change_request.status != ChangeRequestStatus.draft:
        raise HTTPException(status_code=409, detail="Only draft change requests can be edited")
    for field, value in payload.model_dump().items():
        setattr(change_request, field, value)
    await session.commit()
    await session.refresh(change_request)
    return ChangeRequestResponse.model_validate(change_request)


@router.post(
    "/projects/{project_id}/change-requests/{change_request_id}/publish",
    response_model=PublicLinkResponse,
)
async def publish_change_request(
    change_request_id: uuid.UUID,
    options: LinkOptions,
    background_tasks: BackgroundTasks,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> PublicLinkResponse:
    change_request = await load_change_request(change_request_id, project, session)
    if change_request.status not in {
        ChangeRequestStatus.draft,
        ChangeRequestStatus.pending,
    }:
        raise HTTPException(status_code=409, detail="This change request cannot be shared")
    raw_token, link = await create_public_link(
        session,
        principal.organization.id,
        project.id,
        change_request.id,
        PublicLinkKind.change_request,
        options.expires_in_days,
    )
    if change_request.status == ChangeRequestStatus.draft:
        change_request.status = ChangeRequestStatus.pending
    await session.commit()
    url = public_url(PublicLinkKind.change_request, raw_token)
    background_tasks.add_task(
        email_provider.send,
        TransactionalEmail(
            recipient=project.client_email,
            subject=f"Change request for {project.name}",
            heading="A project change needs your decision",
            body=f"Review {change_request.title} and its price and delivery impact.",
            action_label="Review change request",
            action_url=url,
        ),
    )
    return PublicLinkResponse(
        url=url,
        expires_at=link.expires_at,
    )


@router.post(
    "/projects/{project_id}/change-requests/{change_request_id}/cancel",
    response_model=Message,
)
async def cancel_change_request(
    change_request_id: uuid.UUID,
    project: StaffProject,
    session: SessionDependency,
) -> Message:
    change_request = await load_change_request(change_request_id, project, session)
    if change_request.status not in {ChangeRequestStatus.draft, ChangeRequestStatus.pending}:
        raise HTTPException(status_code=409, detail="This change request cannot be cancelled")
    change_request.status = ChangeRequestStatus.cancelled
    await session.commit()
    return Message(message="Change request cancelled")


@public_router.get("/{token}", response_model=PublicChangeRequestResponse)
async def public_change_request(
    token: str,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> PublicChangeRequestResponse:
    link = await resolve_public_link(session, token, PublicLinkKind.change_request)
    change_request = await session.get(ChangeRequest, link.resource_id)
    project = await session.get(Project, link.project_id)
    if change_request is None or project is None or change_request.project_id != project.id:
        raise HTTPException(status_code=404, detail="Change request not found")
    return PublicChangeRequestResponse(
        project_name=project.name,
        client_name=project.client_name,
        currency=project.currency,
        change_request=ChangeRequestResponse.model_validate(change_request),
    )


@public_router.post("/{token}/decision", response_model=Message)
async def decide_change_request(
    token: str,
    payload: ChangeRequestDecision,
    background_tasks: BackgroundTasks,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> Message:
    link = await resolve_public_link(session, token, PublicLinkKind.change_request)
    change_request = await session.get(ChangeRequest, link.resource_id)
    project = await session.get(Project, link.project_id)
    if change_request is None or project is None or change_request.project_id != project.id:
        raise HTTPException(status_code=404, detail="Change request not found")
    if change_request.status != ChangeRequestStatus.pending:
        raise HTTPException(status_code=409, detail="This change request is no longer pending")
    change_request.status = (
        ChangeRequestStatus.accepted if payload.accepted else ChangeRequestStatus.rejected
    )
    change_request.client_comment = payload.comment
    change_request.decided_at = datetime.now(UTC)
    link.revoked_at = datetime.now(UTC)
    if payload.accepted:
        project.base_price += change_request.additional_price
        if project.target_delivery_date:
            project.target_delivery_date += timedelta(days=change_request.additional_days)
        event_type = "change_request_accepted"
    else:
        event_type = "change_request_rejected"
    add_activity(
        session,
        link.organization_id,
        project.id,
        None,
        payload.client_name,
        event_type,
        {"title": change_request.title, "comment": payload.comment},
    )
    await session.commit()
    organization = await session.get(Organization, link.organization_id)
    owner = await session.get(User, organization.owner_id) if organization else None
    if owner:
        decision_label = "accepted" if payload.accepted else "rejected"
        background_tasks.add_task(
            email_provider.send,
            TransactionalEmail(
                recipient=owner.email,
                subject=f"Change request {decision_label}: {project.name}",
                heading=f"Change request {decision_label}",
                body=f"{payload.client_name} {decision_label} {change_request.title}.",
                action_label="Open project",
                action_url=f"{settings.frontend_url.rstrip('/')}/projects/{project.id}/changes",
            ),
        )
    return Message(message="Decision recorded")
