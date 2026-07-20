from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Message(APIModel):
    message: str


class ValidationIssue(APIModel):
    field: str
    message: str


class Page[T](APIModel):
    items: list[T]
    total: int
    page: int
    page_size: int


class HealthResponse(APIModel):
    status: str
    timestamp: datetime
    details: dict[str, Any] | None = None
