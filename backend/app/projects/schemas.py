import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import EmailStr, Field, field_validator

from app.common.enums import ProjectStatus
from app.common.schemas import APIModel


class ProjectCreate(APIModel):
    name: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=5000)
    client_name: str = Field(min_length=2, max_length=120)
    client_email: EmailStr
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    base_price: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    target_delivery_date: date | None = None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class ProjectUpdate(APIModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    client_name: str | None = Field(default=None, min_length=2, max_length=120)
    client_email: EmailStr | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    base_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    target_delivery_date: date | None = None
    status: ProjectStatus | None = None


class ProjectResponse(APIModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str
    client_name: str
    client_email: EmailStr
    currency: str
    base_price: Decimal
    target_delivery_date: date | None
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime


class DashboardResponse(APIModel):
    active_projects: int
    briefs_waiting: int
    scopes_waiting: int
    pending_change_requests: int
