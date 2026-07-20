import uuid
from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy import select

from app.auth.dependencies import SessionDependency as DatabaseSession
from app.auth.dependencies import StaffPrincipal
from app.projects.models import Project


async def get_staff_project(
    project_id: uuid.UUID,
    session: DatabaseSession,
    principal: StaffPrincipal,
) -> Project:
    project = await session.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.organization_id == principal.organization.id,
        )
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


StaffProject = Annotated[Project, Depends(get_staff_project)]
