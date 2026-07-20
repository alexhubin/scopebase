import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent


def add_activity(
    session: AsyncSession,
    organization_id: uuid.UUID,
    project_id: uuid.UUID | None,
    actor_id: uuid.UUID | None,
    actor_name: str,
    event_type: str,
    metadata: dict[str, Any] | None = None,
) -> ActivityEvent:
    event = ActivityEvent(
        organization_id=organization_id,
        project_id=project_id,
        actor_id=actor_id,
        actor_name=actor_name,
        event_type=event_type,
        event_metadata=metadata or {},
    )
    session.add(event)
    return event
