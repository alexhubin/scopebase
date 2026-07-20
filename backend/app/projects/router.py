from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.activity.service import add_activity
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.change_requests.models import ChangeRequest
from app.common.enums import ChangeRequestStatus, ProjectStatus, ScopeStatus, SubscriptionPlan
from app.common.schemas import Message, Page
from app.common.slug import slugify
from app.projects.dependencies import StaffProject
from app.projects.models import Project
from app.projects.schemas import DashboardResponse, ProjectCreate, ProjectResponse, ProjectUpdate
from app.scopes.models import ScopeDocument

router = APIRouter(prefix="/projects", tags=["Projects"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
active_statuses = {
    ProjectStatus.waiting_for_brief,
    ProjectStatus.brief_submitted,
    ProjectStatus.scope_draft,
    ProjectStatus.waiting_for_approval,
    ProjectStatus.approved,
}


@router.get("", response_model=Page[ProjectResponse])
async def list_projects(
    principal: StaffPrincipal,
    session: SessionDependency,
    search: str | None = None,
    project_status: Annotated[ProjectStatus | None, Query(alias="status")] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[ProjectResponse]:
    conditions = [Project.organization_id == principal.organization.id]
    if search:
        term = f"%{search.strip()}%"
        conditions.append(or_(Project.name.ilike(term), Project.client_name.ilike(term)))
    if project_status:
        conditions.append(Project.status == project_status)
    total = await session.scalar(select(func.count(Project.id)).where(*conditions)) or 0
    result = await session.scalars(
        select(Project)
        .where(*conditions)
        .order_by(Project.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return Page(
        items=[ProjectResponse.model_validate(project) for project in result.all()],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> ProjectResponse:
    if principal.organization.plan == SubscriptionPlan.free:
        active_count = await session.scalar(
            select(func.count(Project.id)).where(
                Project.organization_id == principal.organization.id,
                Project.status.in_(active_statuses),
            )
        )
        if active_count and active_count >= 1:
            raise HTTPException(status_code=403, detail="The Free plan allows one active project")
    base_slug = slugify(payload.name)
    matching = await session.scalar(
        select(func.count(Project.id)).where(
            Project.organization_id == principal.organization.id,
            Project.slug.like(f"{base_slug}%"),
        )
    )
    slug = base_slug if not matching else f"{base_slug}-{matching + 1}"
    project = Project(
        organization_id=principal.organization.id,
        slug=slug,
        status=ProjectStatus.draft,
        **payload.model_dump(),
    )
    session.add(project)
    await session.flush()
    add_activity(
        session,
        principal.organization.id,
        project.id,
        principal.user.id,
        principal.user.full_name,
        "project_created",
        {"project_name": project.name},
    )
    await session.commit()
    await session.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project: StaffProject) -> ProjectResponse:
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    payload: ProjectUpdate,
    project: StaffProject,
    session: SessionDependency,
) -> ProjectResponse:
    updates = payload.model_dump(exclude_unset=True)
    if "currency" in updates and updates["currency"]:
        updates["currency"] = updates["currency"].upper()
    for field, value in updates.items():
        setattr(project, field, value)
    await session.commit()
    await session.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", response_model=Message)
async def archive_project(project: StaffProject, session: SessionDependency) -> Message:
    project.status = ProjectStatus.archived
    await session.commit()
    return Message(message="Project archived")


@dashboard_router.get("", response_model=DashboardResponse)
async def dashboard_summary(
    principal: StaffPrincipal,
    session: SessionDependency,
) -> DashboardResponse:
    organization_id = principal.organization.id
    active = await session.scalar(
        select(func.count(Project.id)).where(
            Project.organization_id == organization_id,
            Project.status.in_(active_statuses),
        )
    )
    briefs = await session.scalar(
        select(func.count(Project.id)).where(
            Project.organization_id == organization_id,
            Project.status == ProjectStatus.waiting_for_brief,
        )
    )
    scopes = await session.scalar(
        select(func.count(ScopeDocument.id))
        .join(Project, Project.id == ScopeDocument.project_id)
        .where(
            Project.organization_id == organization_id,
            ScopeDocument.status == ScopeStatus.sent,
        )
    )
    changes = await session.scalar(
        select(func.count(ChangeRequest.id))
        .join(Project, Project.id == ChangeRequest.project_id)
        .where(
            Project.organization_id == organization_id,
            ChangeRequest.status == ChangeRequestStatus.pending,
        )
    )
    return DashboardResponse(
        active_projects=active or 0,
        briefs_waiting=briefs or 0,
        scopes_waiting=scopes or 0,
        pending_change_requests=changes or 0,
    )
