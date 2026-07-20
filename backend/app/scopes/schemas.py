import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.common.enums import ApprovalDecision, ScopeStatus
from app.common.schemas import APIModel


class Deliverable(APIModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=3000)


class ScopeCreate(APIModel):
    title: str = Field(min_length=2, max_length=180)
    summary: str = Field(min_length=10, max_length=10000)
    deliverables: list[Deliverable] = Field(min_length=1, max_length=100)
    included_items: list[str] = Field(default_factory=list, max_length=100)
    excluded_items: list[str] = Field(default_factory=list, max_length=100)
    assumptions: list[str] = Field(default_factory=list, max_length=100)
    revision_limit: int = Field(default=2, ge=0, le=100)
    price: Decimal = Field(ge=0, decimal_places=2)
    delivery_date: date | None = None


class ScopeResponse(APIModel):
    id: uuid.UUID
    project_id: uuid.UUID
    version_number: int
    title: str
    summary: str
    deliverables: list[Deliverable]
    included_items: list[str]
    excluded_items: list[str]
    assumptions: list[str]
    revision_limit: int
    price: Decimal
    delivery_date: date | None
    status: ScopeStatus
    created_by: uuid.UUID
    created_at: datetime


class ApprovalResponse(APIModel):
    client_name: str
    client_email: str
    decision: ApprovalDecision
    optional_comment: str | None
    approved_at: datetime


class PublicScopeResponse(APIModel):
    project_name: str
    client_name: str
    currency: str
    scope: ScopeResponse
    approval: ApprovalResponse | None


class ScopeDecision(APIModel):
    decision: ApprovalDecision
    client_name: str = Field(min_length=2, max_length=120)
    client_email: str = Field(min_length=3, max_length=320)
    comment: str | None = Field(default=None, max_length=5000)
