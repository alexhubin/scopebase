import uuid
from datetime import date, datetime
from enum import StrEnum
from typing import Any

from pydantic import Field, model_validator

from app.common.enums import BriefStatus
from app.common.schemas import APIModel


class QuestionType(StrEnum):
    short_text = "short_text"
    long_text = "long_text"
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"
    yes_no = "yes_no"
    number = "number"
    date = "date"
    file_upload = "file_upload"


class BriefQuestion(APIModel):
    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    label: str = Field(min_length=2, max_length=240)
    description: str = Field(default="", max_length=1000)
    required: bool = False
    type: QuestionType
    options: list[str] = Field(default_factory=list, max_length=50)
    order: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_options(self) -> "BriefQuestion":
        choice_types = {QuestionType.single_choice, QuestionType.multiple_choice}
        if self.type in choice_types and len(self.options) < 2:
            raise ValueError("Choice questions require at least two options")
        if self.type not in choice_types and self.options:
            raise ValueError("Options are only allowed for choice questions")
        return self


class BriefTemplateCreate(APIModel):
    name: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=2000)
    category: str = Field(min_length=2, max_length=80)
    questions: list[BriefQuestion] = Field(min_length=1, max_length=50)


class BriefTemplateResponse(BriefTemplateCreate):
    id: uuid.UUID
    organization_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class BriefConfigure(APIModel):
    template_id: uuid.UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="Custom", min_length=2, max_length=80)
    questions: list[BriefQuestion] | None = Field(default=None, min_length=1, max_length=50)

    @model_validator(mode="after")
    def require_source(self) -> "BriefConfigure":
        if self.template_id is None and (self.name is None or self.questions is None):
            raise ValueError("Provide a template or custom brief questions")
        return self


class ProjectBriefResponse(APIModel):
    id: uuid.UUID
    project_id: uuid.UUID
    template_snapshot: dict[str, Any]
    answers: dict[str, Any]
    status: BriefStatus
    submitted_at: datetime | None
    updated_at: datetime


class PublicBriefResponse(APIModel):
    project_name: str
    client_name: str
    target_delivery_date: date | None
    brief_name: str
    brief_description: str
    questions: list[BriefQuestion]
    answers: dict[str, Any]
    submitted: bool


class BriefSubmission(APIModel):
    answers: dict[str, Any]
