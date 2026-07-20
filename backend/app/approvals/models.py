from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.database import Base
from app.common.enums import ApprovalDecision
from app.common.models import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.scopes.models import ScopeDocument


class Approval(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "approvals"

    scope_document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("scope_documents.id", ondelete="CASCADE"), unique=True, index=True
    )
    client_name: Mapped[str] = mapped_column(String(120), nullable=False)
    client_email: Mapped[str] = mapped_column(String(320), nullable=False)
    decision: Mapped[ApprovalDecision] = mapped_column(
        Enum(ApprovalDecision, native_enum=False), nullable=False
    )
    optional_comment: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(512))

    scope_document: Mapped[ScopeDocument] = relationship(back_populates="approval")
