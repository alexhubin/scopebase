from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.database import Base
from app.common.enums import ScopeStatus
from app.common.models import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.approvals.models import Approval
    from app.projects.models import Project


class ScopeDocument(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "scope_documents"
    __table_args__ = (UniqueConstraint("project_id", "version_number"),)

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    version_number: Mapped[int] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    deliverables: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    included_items: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    excluded_items: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    assumptions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    revision_limit: Mapped[int] = mapped_column(default=2, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ScopeStatus] = mapped_column(
        Enum(ScopeStatus, native_enum=False), default=ScopeStatus.draft, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped[Project] = relationship(back_populates="scopes")
    approval: Mapped[Approval | None] = relationship(
        back_populates="scope_document", cascade="all, delete-orphan", uselist=False
    )
