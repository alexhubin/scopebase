from datetime import datetime

from pydantic import Field

from app.common.schemas import APIModel


class LinkOptions(APIModel):
    expires_in_days: int | None = Field(default=30, ge=1, le=365)


class PublicLinkResponse(APIModel):
    url: str
    expires_at: datetime | None
