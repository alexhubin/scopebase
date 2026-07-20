import uuid
from datetime import datetime
from typing import Any

from app.common.schemas import APIModel


class ActivityResponse(APIModel):
    id: uuid.UUID
    project_id: uuid.UUID | None
    actor_name: str
    event_type: str
    event_metadata: dict[str, Any]
    created_at: datetime
