from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import or_, select, update

from app.activity.service import add_activity
from app.auth.dependencies import SessionDependency, StaffPrincipal
from app.briefs.models import BriefTemplate, ProjectBrief
from app.briefs.schemas import (
    BriefConfigure,
    BriefQuestion,
    BriefSubmission,
    BriefTemplateCreate,
    BriefTemplateResponse,
    ProjectBriefResponse,
    PublicBriefResponse,
    QuestionType,
)
from app.common.config import settings
from app.common.enums import BriefStatus, ProjectStatus, PublicLinkKind, SubscriptionPlan
from app.common.link_schemas import LinkOptions, PublicLinkResponse
from app.common.public_link_service import create_public_link, public_url, resolve_public_link
from app.common.public_links import PublicLink
from app.common.rate_limit import public_rate_limit
from app.common.schemas import Message
from app.email.provider import TransactionalEmail, email_provider
from app.organizations.models import Organization
from app.projects.dependencies import StaffProject
from app.projects.models import Project
from app.users.models import User

router = APIRouter(tags=["Briefs"])
public_router = APIRouter(prefix="/public/briefs", tags=["Client portal"])
PublicRateLimited = Annotated[None, Depends(public_rate_limit)]


def serialize_questions(questions: list[BriefQuestion]) -> list[dict[str, Any]]:
    ordered = sorted(questions, key=lambda question: question.order)
    ids = [question.id for question in ordered]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Question IDs must be unique")
    return [question.model_dump(mode="json") for question in ordered]


def validate_answers(questions: list[BriefQuestion], answers: dict[str, Any]) -> None:
    for question in questions:
        value = answers.get(question.id)
        if question.required and (value is None or value == "" or value == []):
            raise HTTPException(status_code=422, detail=f"Answer required: {question.label}")
        if value is None or value == "":
            continue
        if question.type in {QuestionType.short_text, QuestionType.long_text, QuestionType.date}:
            if not isinstance(value, str):
                raise HTTPException(status_code=422, detail=f"Invalid answer: {question.label}")
        elif question.type == QuestionType.number and not isinstance(value, (int, float)):
            raise HTTPException(status_code=422, detail=f"Invalid answer: {question.label}")
        elif question.type == QuestionType.yes_no and not isinstance(value, bool):
            raise HTTPException(status_code=422, detail=f"Invalid answer: {question.label}")
        elif question.type == QuestionType.single_choice and value not in question.options:
            raise HTTPException(status_code=422, detail=f"Invalid choice: {question.label}")
        elif question.type == QuestionType.multiple_choice:
            if not isinstance(value, list) or not set(value).issubset(set(question.options)):
                raise HTTPException(status_code=422, detail=f"Invalid choices: {question.label}")
        elif question.type == QuestionType.file_upload and not isinstance(value, list):
            raise HTTPException(status_code=422, detail=f"Invalid files: {question.label}")


@router.get("/brief-templates", response_model=list[BriefTemplateResponse])
async def list_templates(
    principal: StaffPrincipal,
    session: SessionDependency,
) -> list[BriefTemplateResponse]:
    templates = await session.scalars(
        select(BriefTemplate)
        .where(
            or_(
                BriefTemplate.organization_id.is_(None),
                BriefTemplate.organization_id == principal.organization.id,
            )
        )
        .order_by(BriefTemplate.organization_id.nullsfirst(), BriefTemplate.name)
    )
    return [BriefTemplateResponse.model_validate(template) for template in templates.all()]


@router.post("/brief-templates", response_model=BriefTemplateResponse, status_code=201)
async def create_template(
    payload: BriefTemplateCreate,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> BriefTemplateResponse:
    if principal.organization.plan != SubscriptionPlan.pro:
        raise HTTPException(status_code=403, detail="Custom templates require the Pro plan")
    template = BriefTemplate(
        organization_id=principal.organization.id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        questions=serialize_questions(payload.questions),
    )
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return BriefTemplateResponse.model_validate(template)


@router.put("/projects/{project_id}/brief", response_model=ProjectBriefResponse)
async def configure_brief(
    payload: BriefConfigure,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> ProjectBriefResponse:
    existing = await session.scalar(
        select(ProjectBrief).where(ProjectBrief.project_id == project.id)
    )
    if existing and existing.status != BriefStatus.draft:
        raise HTTPException(status_code=409, detail="A sent brief cannot be edited")
    snapshot: dict[str, Any]
    if payload.template_id:
        template = await session.scalar(
            select(BriefTemplate).where(
                BriefTemplate.id == payload.template_id,
                or_(
                    BriefTemplate.organization_id.is_(None),
                    BriefTemplate.organization_id == principal.organization.id,
                ),
            )
        )
        if template is None:
            raise HTTPException(status_code=404, detail="Template not found")
        snapshot = {
            "name": template.name,
            "description": template.description,
            "category": template.category,
            "questions": template.questions,
        }
    else:
        if principal.organization.plan != SubscriptionPlan.pro:
            raise HTTPException(status_code=403, detail="Custom briefs require the Pro plan")
        snapshot = {
            "name": payload.name,
            "description": payload.description,
            "category": payload.category,
            "questions": serialize_questions(payload.questions or []),
        }
    if existing:
        existing.template_snapshot = snapshot
        brief = existing
    else:
        brief = ProjectBrief(
            project_id=project.id,
            template_snapshot=snapshot,
            answers={},
            status=BriefStatus.draft,
        )
        session.add(brief)
    await session.commit()
    await session.refresh(brief)
    return ProjectBriefResponse.model_validate(brief)


@router.get("/projects/{project_id}/brief", response_model=ProjectBriefResponse)
async def get_brief(project: StaffProject, session: SessionDependency) -> ProjectBriefResponse:
    brief = await session.scalar(select(ProjectBrief).where(ProjectBrief.project_id == project.id))
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not configured")
    return ProjectBriefResponse.model_validate(brief)


@router.post("/projects/{project_id}/brief/publish", response_model=PublicLinkResponse)
async def publish_brief(
    options: LinkOptions,
    background_tasks: BackgroundTasks,
    project: StaffProject,
    principal: StaffPrincipal,
    session: SessionDependency,
) -> PublicLinkResponse:
    brief = await session.scalar(select(ProjectBrief).where(ProjectBrief.project_id == project.id))
    if brief is None:
        raise HTTPException(status_code=400, detail="Configure the brief before publishing")
    if brief.status == BriefStatus.submitted:
        raise HTTPException(status_code=409, detail="The brief has already been submitted")
    raw_token, link = await create_public_link(
        session,
        principal.organization.id,
        project.id,
        brief.id,
        PublicLinkKind.brief,
        options.expires_in_days,
    )
    brief.status = BriefStatus.sent
    project.status = ProjectStatus.waiting_for_brief
    add_activity(
        session,
        principal.organization.id,
        project.id,
        principal.user.id,
        principal.user.full_name,
        "brief_link_created",
    )
    await session.commit()
    url = public_url(PublicLinkKind.brief, raw_token)
    background_tasks.add_task(
        email_provider.send,
        TransactionalEmail(
            recipient=project.client_email,
            subject=f"Project brief for {project.name}",
            heading="Tell us about your project",
            body=f"{principal.organization.name} invited you to complete a project brief.",
            action_label="Complete brief",
            action_url=url,
        ),
    )
    return PublicLinkResponse(url=url, expires_at=link.expires_at)


@router.delete("/projects/{project_id}/brief/link", response_model=Message)
async def revoke_brief_link(project: StaffProject, session: SessionDependency) -> Message:
    brief = await session.scalar(select(ProjectBrief).where(ProjectBrief.project_id == project.id))
    if brief:
        await session.execute(
            update(PublicLink)
            .where(
                PublicLink.resource_id == brief.id,
                PublicLink.kind == PublicLinkKind.brief,
                PublicLink.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await session.commit()
    return Message(message="Brief link revoked")


@public_router.get("/{token}", response_model=PublicBriefResponse)
async def public_brief(
    token: str,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> PublicBriefResponse:
    link = await resolve_public_link(session, token, PublicLinkKind.brief)
    brief = await session.get(ProjectBrief, link.resource_id)
    project = await session.get(Project, link.project_id)
    if brief is None or project is None or brief.project_id != project.id:
        raise HTTPException(status_code=404, detail="Brief not found")
    snapshot = brief.template_snapshot
    return PublicBriefResponse(
        project_name=project.name,
        client_name=project.client_name,
        target_delivery_date=project.target_delivery_date,
        brief_name=snapshot["name"],
        brief_description=snapshot.get("description", ""),
        questions=[BriefQuestion.model_validate(item) for item in snapshot["questions"]],
        answers=brief.answers,
        submitted=brief.status == BriefStatus.submitted,
    )


@public_router.post("/{token}/submit", response_model=Message)
async def submit_brief(
    token: str,
    payload: BriefSubmission,
    background_tasks: BackgroundTasks,
    session: SessionDependency,
    rate_limit: PublicRateLimited,
) -> Message:
    link = await resolve_public_link(session, token, PublicLinkKind.brief)
    brief = await session.get(ProjectBrief, link.resource_id)
    project = await session.get(Project, link.project_id)
    if brief is None or project is None or brief.project_id != project.id:
        raise HTTPException(status_code=404, detail="Brief not found")
    if brief.status == BriefStatus.submitted:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Brief already submitted")
    questions = [
        BriefQuestion.model_validate(question)
        for question in brief.template_snapshot.get("questions", [])
    ]
    validate_answers(questions, payload.answers)
    brief.answers = payload.answers
    brief.status = BriefStatus.submitted
    brief.submitted_at = datetime.now(UTC)
    project.status = ProjectStatus.brief_submitted
    link.revoked_at = datetime.now(UTC)
    add_activity(
        session,
        link.organization_id,
        project.id,
        None,
        project.client_name,
        "brief_submitted",
    )
    await session.commit()
    organization = await session.get(Organization, link.organization_id)
    owner = await session.get(User, organization.owner_id) if organization else None
    if owner:
        background_tasks.add_task(
            email_provider.send,
            TransactionalEmail(
                recipient=owner.email,
                subject=f"Brief submitted for {project.name}",
                heading="The client brief is ready",
                body=f"{project.client_name} submitted the project brief for {project.name}.",
                action_label="Review project",
                action_url=f"{settings.frontend_url.rstrip('/')}/projects/{project.id}/brief",
            ),
        )
    return Message(message="Brief submitted")
