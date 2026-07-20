from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.database import Base
from app.common.enums import ProjectStatus
from app.common.models import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.activity.models import ActivityEvent
    from app.briefs.models import ProjectBrief
    from app.change_requests.models import ChangeRequest
    from app.files.models import FileAttachment
    from app.organizations.models import Organization
    from app.scopes.models import ScopeDocument


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (UniqueConstraint("organization_id", "slug"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    client_name: Mapped[str] = mapped_column(String(120), nullable=False)
    client_email: Mapped[str] = mapped_column(String(320), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    target_delivery_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, native_enum=False), default=ProjectStatus.draft, index=True
    )

    organization: Mapped[Organization] = relationship(back_populates="projects")
    brief: Mapped[ProjectBrief | None] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )
    scopes: Mapped[list[ScopeDocument]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    change_requests: Mapped[list[ChangeRequest]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    attachments: Mapped[list[FileAttachment]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    activity_events: Mapped[list[ActivityEvent]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

