from app.common.enums import SubscriptionPlan
from app.common.schemas import APIModel


class BillingURL(APIModel):
    url: str


class BillingStatus(APIModel):
    plan: SubscriptionPlan
    subscription_status: str | None
