import uuid

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.activity.models import ActivityEvent
from app.activity.schemas import ActivityResponse
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.common.schemas import Page

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=Page[ActivityResponse])
async def list_activity(
    principal: StaffPrincipal,
    session: SessionDependency,
    project_id: uuid.UUID | None = None,
    event_type: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
) -> Page[ActivityResponse]:
    conditions = [ActivityEvent.organization_id == principal.organization.id]
    if project_id:
        conditions.append(ActivityEvent.project_id == project_id)
    if event_type:
        conditions.append(ActivityEvent.event_type == event_type)
    total = await session.scalar(select(func.count(ActivityEvent.id)).where(*conditions)) or 0
    events = await session.scalars(
        select(ActivityEvent)
        .where(*conditions)
        .order_by(ActivityEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return Page(
        items=[ActivityResponse.model_validate(event) for event in events.all()],
        total=total,
        page=page,
        page_size=page_size,
    )
