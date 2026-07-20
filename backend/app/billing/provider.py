import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import stripe

from app.common.config import settings
from app.organizations.models import Organization
from app.users.models import User


@dataclass
class CheckoutResult:
    url: str
    customer_id: str | None = None


class BillingProvider(ABC):
    @abstractmethod
    async def checkout(self, organization: Organization, user: User) -> CheckoutResult:
        raise NotImplementedError

    @abstractmethod
    async def portal(self, organization: Organization) -> str:
        raise NotImplementedError


class LocalBillingProvider(BillingProvider):
    async def checkout(self, organization: Organization, user: User) -> CheckoutResult:
        url = f"{settings.frontend_url.rstrip('/')}/settings?billing=local-pro"
        return CheckoutResult(url=url, customer_id=f"local_{organization.id}")

    async def portal(self, organization: Organization) -> str:
        return f"{settings.frontend_url.rstrip('/')}/settings?billing=local"


class StripeBillingProvider(BillingProvider):
    def __init__(self) -> None:
        stripe.api_key = settings.stripe_secret_key

    async def checkout(self, organization: Organization, user: User) -> CheckoutResult:
        checkout_options: dict[str, Any] = {
            "mode": "subscription",
            "line_items": [{"price": settings.stripe_price_pro, "quantity": 1}],
            "client_reference_id": str(organization.id),
            "metadata": {"organization_id": str(organization.id)},
            "success_url": f"{settings.frontend_url.rstrip('/')}/settings?billing=success",
            "cancel_url": f"{settings.frontend_url.rstrip('/')}/settings?billing=cancelled",
        }
        if organization.stripe_customer_id:
            checkout_options["customer"] = organization.stripe_customer_id
        else:
            checkout_options["customer_email"] = user.email
        session = await asyncio.to_thread(stripe.checkout.Session.create, **checkout_options)
        if not session.url:
            raise RuntimeError("Stripe checkout did not return a URL")
        customer_id = str(session.customer) if session.customer else None
        return CheckoutResult(url=session.url, customer_id=customer_id)

    async def portal(self, organization: Organization) -> str:
        if not organization.stripe_customer_id:
            raise ValueError("Stripe customer is not configured")
        session = await asyncio.to_thread(
            stripe.billing_portal.Session.create,
            customer=organization.stripe_customer_id,
            return_url=f"{settings.frontend_url.rstrip('/')}/settings",
        )
        return session.url


def get_billing_provider() -> BillingProvider:
    if settings.billing_adapter == "stripe":
        return StripeBillingProvider()
    return LocalBillingProvider()
