import uuid
from datetime import datetime

from pydantic import Field

from app.common.schemas import APIModel


class UploadRequest(APIModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    size: int = Field(gt=0)


class UploadResponse(APIModel):
    upload_url: str
    storage_key: str
    headers: dict[str, str]
    expires_in: int = 900


class UploadConfirmation(UploadRequest):
    storage_key: str = Field(min_length=10, max_length=512)


class FileResponse(APIModel):
    id: uuid.UUID
    project_id: uuid.UUID
    uploaded_by: uuid.UUID | None
    original_filename: str
    content_type: str
    size: int
    created_at: datetime


class DownloadResponse(APIModel):
    url: str
    expires_in: int = 900
