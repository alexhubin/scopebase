from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.database import Base
from app.common.enums import BriefStatus
from app.common.models import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.projects.models import Project


class BriefTemplate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "brief_templates"

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)


class ProjectBrief(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "project_briefs"

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True
    )
    template_snapshot: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    answers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[BriefStatus] = mapped_column(
        Enum(BriefStatus, native_enum=False), default=BriefStatus.draft, nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    project: Mapped[Project] = relationship(back_populates="brief")

