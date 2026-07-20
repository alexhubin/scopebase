import uuid

import httpx


async def sign_up(
    client: httpx.AsyncClient,
    email: str = "owner@example.com",
    organization_name: str = "Test Studio",
) -> dict[str, object]:
    response = await client.post(
        "/auth/sign-up",
        json={
            "email": email,
            "password": "SecurePass123!",
            "full_name": "Test Owner",
            "organization_name": organization_name,
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    client.headers["Authorization"] = f"Bearer {data['access_token']}"
    return data


async def make_pro(session, organization_id: str) -> None:
    from app.common.enums import SubscriptionPlan
    from app.organizations.models import Organization

    organization = await session.get(Organization, uuid.UUID(organization_id))
    assert organization is not None
    organization.plan = SubscriptionPlan.pro
    organization.subscription_status = "active"
    await session.commit()


async def create_project(
    client: httpx.AsyncClient, name: str = "Client website"
) -> dict[str, object]:
    response = await client.post(
        "/projects",
        json={
            "name": name,
            "description": "A focused website project",
            "client_name": "Jordan Client",
            "client_email": "jordan@example.com",
            "currency": "EUR",
            "base_price": "1000.00",
            "target_delivery_date": "2026-09-01",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def scope_payload() -> dict[str, object]:
    return {
        "title": "Website delivery scope",
        "summary": "Design and build a focused website for the client business.",
        "deliverables": [
            {"title": "Website", "description": "Responsive design and implementation."}
        ],
        "included_items": ["Discovery", "Design", "Development"],
        "excluded_items": ["Copywriting"],
        "assumptions": ["Client provides approved content"],
        "revision_limit": 2,
        "price": "1000.00",
        "delivery_date": "2026-09-01",
    }
