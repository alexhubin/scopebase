import json
import uuid
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, cast

import stripe
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import OwnerPrincipal, SessionDependency
from app.billing.models import BillingWebhookEvent
from app.billing.provider import LocalBillingProvider, get_billing_provider
from app.billing.schemas import BillingStatus, BillingURL
from app.common.config import settings
from app.common.enums import SubscriptionPlan
from app.common.schemas import Message
from app.organizations.models import Organization

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("", response_model=BillingStatus)
async def billing_status(principal: OwnerPrincipal) -> BillingStatus:
    return BillingStatus(
        plan=principal.organization.plan,
        subscription_status=principal.organization.subscription_status,
    )


@router.post("/checkout", response_model=BillingURL)
async def create_checkout(
    principal: OwnerPrincipal,
    session: SessionDependency,
) -> BillingURL:
    provider = get_billing_provider()
    result = await provider.checkout(principal.organization, principal.user)
    if result.customer_id and not principal.organization.stripe_customer_id:
        principal.organization.stripe_customer_id = result.customer_id
    if isinstance(provider, LocalBillingProvider):
        principal.organization.plan = SubscriptionPlan.pro
        principal.organization.subscription_status = "active"
    await session.commit()
    return BillingURL(url=result.url)


@router.post("/portal", response_model=BillingURL)
async def create_portal(principal: OwnerPrincipal) -> BillingURL:
    provider = get_billing_provider()
    try:
        url = await provider.portal(principal.organization)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return BillingURL(url=url)


@router.post("/webhooks/stripe", response_model=Message)
async def stripe_webhook(request: Request, session: SessionDependency) -> Message:
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhooks are not configured")
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    try:
        construct_event = cast(
            Callable[[bytes, str, str], Any],
            stripe.Webhook.construct_event,
        )
        event = construct_event(payload, signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError) as error:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook") from error
    event_id = str(event["id"])
    existing = await session.scalar(
        select(BillingWebhookEvent.id).where(BillingWebhookEvent.provider_event_id == event_id)
    )
    if existing:
        return Message(message="Already processed")
    event_type = str(event["type"])
    data = event["data"]["object"]
    organization = None
    customer_id = data.get("customer")
    metadata = data.get("metadata", {})
    organization_id = metadata.get("organization_id")
    if organization_id:
        try:
            organization = await session.get(Organization, uuid.UUID(organization_id))
        except ValueError:
            organization = None
    if organization is None and customer_id:
        organization = await session.scalar(
            select(Organization).where(Organization.stripe_customer_id == customer_id)
        )
    if organization and event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        subscription_status = str(data.get("status", ""))
        organization.stripe_customer_id = str(customer_id) if customer_id else None
        organization.stripe_subscription_id = str(data.get("id"))
        organization.subscription_status = subscription_status
        organization.plan = (
            SubscriptionPlan.pro
            if subscription_status in {"active", "trialing"}
            else SubscriptionPlan.free
        )
    record = BillingWebhookEvent(
        provider_event_id=event_id,
        event_type=event_type,
        payload=json.loads(payload),
        processed_at=datetime.now(UTC),
    )
    session.add(record)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        return Message(message="Already processed")
    return Message(message="Processed")
