import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response
from sqlalchemy import func, select, update

from app.activity.service import add_activity
from app.approvals.models import Approval
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.common.config import settings
from app.common.enums import (
    ApprovalDecision,
    ProjectStatus,
    PublicLinkKind,
    ScopeStatus,
    SubscriptionPlan,
)
from app.common.link_schemas import LinkOptions, PublicLinkResponse
from app.common.public_link_service import create_public_link, public_url, resolve_public_link
from app.common.rate_limit import public_rate_limit
from app.common.schemas import Message
from app.email.provider import TransactionalEmail, email_provider
from app.organizations.models import Organization
from app.projects.dependencies import StaffProject
from app.projects.models import Project
from app.scopes.models import ScopeDocument
from app.scopes.pdf import build_scope_pdf
from app.scopes.schemas import (
    ApprovalResponse,
    PublicScopeResponse,
    ScopeCreate,
    ScopeDecision,
    ScopeResponse,
)
from app.users.models import User

router = APIRouter(tags=["Scopes"])
public_router = APIRouter(prefix="/public/scopes", tags=["Client portal"])
PublicRateLimited = Annotated[None, Depends(public_rate_limit)]


def scope_values(payload: ScopeCreate) -> dict[str, object]:
    values = payload.model_dump()
    values["deliverables"] = [deliverable.model_dump() for deliverable in payload.deliverables]
    return values


async def load_scope_for_project(
    scope_id: uuid.UUID,
    project: Project,
    session: SessionDependency,
) -> ScopeDocument:
    scope = await session.scalar(
        select(ScopeDocument).where(
            ScopeDocument.id == scope_id,
            ScopeDocument.project_id == project.id,
        )
    )
    if scope is None:
        raise HTTPException(status_code=404, detail="Scope version not found")
    return scope


@router.get("/projects/{project_id}/scopes", response_model=list[ScopeResponse])
async def list_scopes(
    project: StaffProject,
    session: SessionDependency,
) -> list[ScopeResponse]:
    scopes = await session.scalars(
        select(ScopeDocument)
        .where(ScopeDocument.project_id == project.id)
        .order_by(ScopeDocument.version_number.desc())
    )
    return [ScopeResponse.model_validate(scope) for scope in scopes.all()]


@router.post("/projects/{project_id}/scopes", response_model=ScopeResponse, status_code=201)
async def create_scope(
    payload: ScopeCreate,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> ScopeResponse:
    draft_exists = await session.scalar(
        select(ScopeDocument.id).where(
            ScopeDocument.project_id == project.id,
            ScopeDocument.status == ScopeStatus.draft,
        )
    )
    if draft_exists:
        raise HTTPException(status_code=409, detail="Finish the existing draft first")
    latest = await session.scalar(
        select(func.max(ScopeDocument.version_number)).where(ScopeDocument.project_id == project.id)
    )
    if latest and principal.organization.plan == SubscriptionPlan.free:
        raise HTTPException(status_code=403, detail="Scope version history requires the Pro plan")
    scope = ScopeDocument(
        project_id=project.id,
        version_number=(latest or 0) + 1,
        created_by=principal.user.id,
        status=ScopeStatus.draft,
        **scope_values(payload),
    )
    session.add(scope)
    project.status = ProjectStatus.scope_draft
    await session.flush()
    add_activity(
        session,
        principal.organization.id,
        project.id,
        principal.user.id,
        principal.user.full_name,
        "scope_version_created",
        {"version": scope.version_number},
    )
    await session.commit()
    await session.refresh(scope)
    return ScopeResponse.model_validate(scope)


@router.patch("/projects/{project_id}/scopes/{scope_id}", response_model=ScopeResponse)
async def update_scope(
    scope_id: uuid.UUID,
    payload: ScopeCreate,
    project: StaffProject,
    session: SessionDependency,
) -> ScopeResponse:
    scope = await load_scope_for_project(scope_id, project, session)
    if scope.status != ScopeStatus.draft:
        raise HTTPException(status_code=409, detail="Published scope versions are immutable")
    for field, value in scope_values(payload).items():
        setattr(scope, field, value)
    await session.commit()
    await session.refresh(scope)
    return ScopeResponse.model_validate(scope)


@router.post(
    "/projects/{project_id}/scopes/{scope_id}/publish",
    response_model=PublicLinkResponse,
)
async def publish_scope(
    scope_id: uuid.UUID,
    options: LinkOptions,
    background_tasks: BackgroundTasks,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> PublicLinkResponse:
    scope = await load_scope_for_project(scope_id, project, session)
    if scope.status not in {ScopeStatus.draft, ScopeStatus.sent}:
        raise HTTPException(status_code=409, detail="This scope cannot be shared")
    if scope.status == ScopeStatus.draft:
        await session.execute(
            update(ScopeDocument)
            .where(
                ScopeDocument.project_id == project.id,
                ScopeDocument.id != scope.id,
                ScopeDocument.status == ScopeStatus.sent,
            )
            .values(status=ScopeStatus.superseded)
        )
    raw_token, link = await create_public_link(
        session,
        principal.organization.id,
        project.id,
        scope.id,
        PublicLinkKind.scope,
        options.expires_in_days,
    )
    if scope.status == ScopeStatus.draft:
        scope.status = ScopeStatus.sent
        project.status = ProjectStatus.waiting_for_approval
        add_activity(
            session,
            principal.organization.id,
            project.id,
            principal.user.id,
            principal.user.full_name,
            "scope_sent",
            {"version": scope.version_number},
        )
    await session.commit()
    url = public_url(PublicLinkKind.scope, raw_token)
    background_tasks.add_task(
        email_provider.send,
        TransactionalEmail(
            recipient=project.client_email,
            subject=f"Scope ready for {project.name}",
            heading="Your project scope is ready",
            body=f"Review scope version {scope.version_number} and record your decision.",
            action_label="Review scope",
            action_url=url,
        ),
    )
    return PublicLinkResponse(url=url, expires_at=link.expires_at)


@router.get("/projects/{project_id}/scopes/{scope_id}/pdf")
async def export_scope_pdf(
    scope_id: uuid.UUID,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> Response:
    if principal.organization.plan == SubscriptionPlan.free:
        raise HTTPException(status_code=403, detail="PDF export requires the Pro plan")
    scope = await load_scope_for_project(scope_id, project, session)
    if scope.status != ScopeStatus.approved:
        raise HTTPException(status_code=409, detail="Only approved scopes can be exported")
    approval = await session.scalar(select(Approval).where(Approval.scope_document_id == scope.id))
    content = build_scope_pdf(project, scope, approval)
    filename = f"{project.slug}-scope-v{scope.version_number}.pdf"
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@public_router.get("/{token}", response_model=PublicScopeResponse)
async def public_scope(
    token: str,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> PublicScopeResponse:
    link = await resolve_public_link(session, token, PublicLinkKind.scope)
    scope = await session.get(ScopeDocument, link.resource_id)
    project = await session.get(Project, link.project_id)
    if scope is None or project is None or scope.project_id != project.id:
        raise HTTPException(status_code=404, detail="Scope not found")
    approval = await session.scalar(select(Approval).where(Approval.scope_document_id == scope.id))
    return PublicScopeResponse(
        project_name=project.name,
        client_name=project.client_name,
        currency=project.currency,
        scope=ScopeResponse.model_validate(scope),
        approval=ApprovalResponse.model_validate(approval) if approval else None,
    )


@public_router.post("/{token}/decision", response_model=Message)
async def decide_scope(
    token: str,
    payload: ScopeDecision,
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> Message:
    link = await resolve_public_link(session, token, PublicLinkKind.scope)
    scope = await session.get(ScopeDocument, link.resource_id)
    project = await session.get(Project, link.project_id)
    if scope is None or project is None or scope.project_id != project.id:
        raise HTTPException(status_code=404, detail="Scope not found")
    if scope.status != ScopeStatus.sent:
        raise HTTPException(status_code=409, detail="This scope is no longer awaiting a decision")
    prior = await session.scalar(select(Approval.id).where(Approval.scope_document_id == scope.id))
    if prior:
        raise HTTPException(status_code=409, detail="A decision has already been recorded")
    approval = Approval(
        scope_document_id=scope.id,
        client_name=payload.client_name,
        client_email=payload.client_email.strip().lower(),
        decision=payload.decision,
        optional_comment=payload.comment,
        approved_at=datetime.now(UTC),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent", "")[:512] or None,
    )
    session.add(approval)
    link.revoked_at = datetime.now(UTC)
    if payload.decision == ApprovalDecision.approved:
        scope.status = ScopeStatus.approved
        project.status = ProjectStatus.approved
        event_type = "scope_approved"
    else:
        project.status = ProjectStatus.scope_draft
        event_type = "scope_changes_requested"
    add_activity(
        session,
        link.organization_id,
        project.id,
        None,
        payload.client_name,
        event_type,
        {"version": scope.version_number, "comment": payload.comment},
    )
    await session.commit()
    organization = await session.get(Organization, link.organization_id)
    owner = await session.get(User, organization.owner_id) if organization else None
    if owner:
        decision_label = payload.decision.value.replace("_", " ")
        background_tasks.add_task(
            email_provider.send,
            TransactionalEmail(
                recipient=owner.email,
                subject=f"Scope {decision_label}: {project.name}",
                heading=f"Scope {decision_label}",
                body=(
                    f"{payload.client_name} recorded a decision on "
                    f"scope version {scope.version_number}."
                ),
                action_label="Open project",
                action_url=f"{settings.frontend_url.rstrip('/')}/projects/{project.id}/scope",
            ),
        )
    return Message(message="Decision recorded")
