import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.common.enums import ChangeRequestStatus
from app.common.schemas import APIModel


class ChangeRequestCreate(APIModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(min_length=5, max_length=10000)
    reason: str = Field(min_length=5, max_length=5000)
    additional_price: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    additional_days: int = Field(default=0, ge=0, le=365)


class ChangeRequestResponse(ChangeRequestCreate):
    id: uuid.UUID
    project_id: uuid.UUID
    status: ChangeRequestStatus
    created_by: uuid.UUID
    client_comment: str | None
    decided_at: datetime | None
    created_at: datetime


class PublicChangeRequestResponse(APIModel):
    project_name: str
    client_name: str
    currency: str
    change_request: ChangeRequestResponse


class ChangeRequestDecision(APIModel):
    accepted: bool
    client_name: str = Field(min_length=2, max_length=120)
    comment: str | None = Field(default=None, max_length=5000)
