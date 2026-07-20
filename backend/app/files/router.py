import uuid
from pathlib import PurePath
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from app.activity.service import add_activity
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.common.config import settings
from app.common.enums import PublicLinkKind, SubscriptionPlan
from app.common.public_link_service import resolve_public_link
from app.common.rate_limit import public_rate_limit
from app.common.schemas import Message
from app.files.models import FileAttachment
from app.files.schemas import (
    DownloadResponse,
    FileResponse,
    UploadConfirmation,
    UploadRequest,
    UploadResponse,
)
from app.files.storage import storage
from app.organizations.models import Organization
from app.projects.dependencies import StaffProject
from app.projects.models import Project

router = APIRouter(tags=["Files"])
public_router = APIRouter(prefix="/public/briefs", tags=["Client portal"])
PublicRateLimited = Annotated[None, Depends(public_rate_limit)]
allowed_content_types = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/csv",
    "text/plain",
}


def validate_upload(payload: UploadRequest) -> None:
    if payload.content_type not in allowed_content_types:
        raise HTTPException(status_code=422, detail="File type is not allowed")
    if payload.size > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File exceeds the maximum size")
    if PurePath(payload.filename).name != payload.filename:
        raise HTTPException(status_code=422, detail="Invalid filename")


async def enforce_storage_limit(
    session: SessionDependency,
    organization_id: uuid.UUID,
    plan: SubscriptionPlan,
    requested_size: int,
) -> None:
    current = await session.scalar(
        select(func.coalesce(func.sum(FileAttachment.size), 0))
        .join(Project, Project.id == FileAttachment.project_id)
        .where(Project.organization_id == organization_id)
    )
    limit = 25 * 1024 * 1024 if plan == SubscriptionPlan.free else 1024 * 1024 * 1024
    if (current or 0) + requested_size > limit:
        raise HTTPException(status_code=403, detail="Organization storage limit exceeded")


async def make_presign(project: Project, payload: UploadRequest) -> UploadResponse:
    validate_upload(payload)
    suffix = PurePath(payload.filename).suffix.lower()[:20]
    storage_key = (
        f"organizations/{project.organization_id}/projects/{project.id}/{uuid.uuid4()}{suffix}"
    )
    url = await storage.presigned_upload(storage_key, payload.content_type, payload.size)
    return UploadResponse(
        upload_url=url,
        storage_key=storage_key,
        headers={"Content-Type": payload.content_type, "Content-Length": str(payload.size)},
    )


async def confirm_upload(
    project: Project,
    payload: UploadConfirmation,
    session: SessionDependency,
    uploaded_by: uuid.UUID | None,
) -> FileAttachment:
    validate_upload(payload)
    expected_prefix = f"organizations/{project.organization_id}/projects/{project.id}/"
    if not payload.storage_key.startswith(expected_prefix):
        raise HTTPException(status_code=422, detail="Invalid storage key")
    existing = await session.scalar(
        select(FileAttachment.id).where(FileAttachment.storage_key == payload.storage_key)
    )
    if existing:
        raise HTTPException(status_code=409, detail="File already confirmed")
    try:
        metadata = await storage.metadata(payload.storage_key)
    except FileNotFoundError as error:
        raise HTTPException(status_code=400, detail="Uploaded object not found") from error
    actual_size = int(metadata.get("ContentLength", 0))
    actual_type = str(metadata.get("ContentType", ""))
    if actual_size != payload.size or actual_type != payload.content_type:
        await storage.delete(payload.storage_key)
        raise HTTPException(status_code=422, detail="Uploaded object metadata does not match")
    attachment = FileAttachment(
        project_id=project.id,
        uploaded_by=uploaded_by,
        storage_key=payload.storage_key,
        original_filename=payload.filename,
        content_type=payload.content_type,
        size=payload.size,
    )
    session.add(attachment)
    return attachment


@router.get("/projects/{project_id}/files", response_model=list[FileResponse])
async def list_files(project: StaffProject, session: SessionDependency) -> list[FileResponse]:
    files = await session.scalars(
        select(FileAttachment)
        .where(FileAttachment.project_id == project.id)
        .order_by(FileAttachment.created_at.desc())
    )
    return [FileResponse.model_validate(file) for file in files.all()]


@router.post("/projects/{project_id}/files/presign", response_model=UploadResponse)
async def presign_upload(
    payload: UploadRequest,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> UploadResponse:
    await enforce_storage_limit(
        session,
        principal.organization.id,
        principal.organization.plan,
        payload.size,
    )
    return await make_presign(project, payload)


@router.post("/projects/{project_id}/files/confirm", response_model=FileResponse, status_code=201)
async def confirm_staff_upload(
    payload: UploadConfirmation,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> FileResponse:
    attachment = await confirm_upload(project, payload, session, principal.user.id)
    await session.flush()
    add_activity(
        session,
        principal.organization.id,
        project.id,
        principal.user.id,
        principal.user.full_name,
        "file_uploaded",
        {"filename": payload.filename, "size": payload.size},
    )
    await session.commit()
    await session.refresh(attachment)
    return FileResponse.model_validate(attachment)


@router.get("/projects/{project_id}/files/{file_id}/download", response_model=DownloadResponse)
async def download_file(
    file_id: uuid.UUID,
    project: StaffProject,
    session: SessionDependency,
) -> DownloadResponse:
    attachment = await session.scalar(
        select(FileAttachment).where(
            FileAttachment.id == file_id,
            FileAttachment.project_id == project.id,
        )
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="File not found")
    url = await storage.presigned_download(attachment.storage_key, attachment.original_filename)
    return DownloadResponse(url=url)


@router.delete("/projects/{project_id}/files/{file_id}", response_model=Message)
async def delete_file(
    file_id: uuid.UUID,
    project: StaffProject,
    session: SessionDependency,
) -> Message:
    attachment = await session.scalar(
        select(FileAttachment).where(
            FileAttachment.id == file_id,
            FileAttachment.project_id == project.id,
        )
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="File not found")
    await storage.delete(attachment.storage_key)
    await session.delete(attachment)
    await session.commit()
    return Message(message="File deleted")


@public_router.post("/{token}/files/presign", response_model=UploadResponse)
async def public_presign_upload(
    token: str,
    payload: UploadRequest,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> UploadResponse:
    link = await resolve_public_link(session, token, PublicLinkKind.brief)
    project = await session.get(Project, link.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    organization = await session.get(Organization, link.organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    await enforce_storage_limit(session, link.organization_id, organization.plan, payload.size)
    return await make_presign(project, payload)


@public_router.post("/{token}/files/confirm", response_model=FileResponse, status_code=201)
async def public_confirm_upload(
    token: str,
    payload: UploadConfirmation,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> FileResponse:
    link = await resolve_public_link(session, token, PublicLinkKind.brief)
    project = await session.get(Project, link.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    attachment = await confirm_upload(project, payload, session, None)
    await session.flush()
    add_activity(
        session,
        link.organization_id,
        project.id,
        None,
        project.client_name,
        "file_uploaded",
        {"filename": payload.filename, "size": payload.size},
    )
    await session.commit()
    await session.refresh(attachment)
    return FileResponse.model_validate(attachment)
