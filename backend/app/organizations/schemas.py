import uuid

from pydantic import EmailStr, Field

from app.common.enums import OrganizationRole, SubscriptionPlan
from app.common.schemas import APIModel


class OrganizationResponse(APIModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: SubscriptionPlan
    subscription_status: str | None


class OrganizationUpdate(APIModel):
    name: str = Field(min_length=2, max_length=120)


class ProfileUpdate(APIModel):
    full_name: str = Field(min_length=2, max_length=120)


class MemberResponse(APIModel):
    user_id: uuid.UUID
    email: EmailStr
    full_name: str
    role: OrganizationRole
