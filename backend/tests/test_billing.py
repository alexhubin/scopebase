import hashlib
import hmac
import json
import time
import uuid

from sqlalchemy import func, select

from app.billing.models import BillingWebhookEvent
from app.common.config import settings
from app.common.enums import SubscriptionPlan
from app.organizations.models import Organization
from tests.helpers import sign_up


async def test_stripe_webhook_is_verified_and_idempotent(
    client,
    database,
    monkeypatch,
) -> None:
    auth = await sign_up(client)
    organization = await database.get(
        Organization,
        uuid.UUID(auth["organization"]["id"]),
    )
    assert organization is not None
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_scopebase_test")
    event = {
        "id": "evt_scopebase_1",
        "object": "event",
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_scopebase_1",
                "object": "subscription",
                "customer": "cus_scopebase_1",
                "status": "active",
                "metadata": {"organization_id": str(organization.id)},
            }
        },
    }
    body = json.dumps(event, separators=(",", ":")).encode()
    timestamp = int(time.time())
    signature = hmac.new(
        settings.stripe_webhook_secret.encode(),
        f"{timestamp}.{body.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()
    headers = {
        "Stripe-Signature": f"t={timestamp},v1={signature}",
        "Content-Type": "application/json",
    }
    first = await client.post("/billing/webhooks/stripe", content=body, headers=headers)
    second = await client.post("/billing/webhooks/stripe", content=body, headers=headers)
    assert first.status_code == 200, first.text
    assert second.json()["message"] == "Already processed"
    await database.refresh(organization)
    assert organization.plan == SubscriptionPlan.pro
    event_count = await database.scalar(select(func.count(BillingWebhookEvent.id)))
    assert event_count == 1
