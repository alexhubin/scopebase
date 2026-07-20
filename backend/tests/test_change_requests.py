from decimal import Decimal

from tests.helpers import create_project, make_pro, sign_up


async def test_accepting_change_request_updates_project_impact(client, database) -> None:
    auth = await sign_up(client)
    await make_pro(database, auth["organization"]["id"])
    project = await create_project(client)
    created = await client.post(
        f"/projects/{project['id']}/change-requests",
        json={
            "title": "Add booking integration",
            "description": "Connect and style the external booking flow.",
            "reason": "The booking provider was selected after discovery.",
            "additional_price": "250.00",
            "additional_days": 3,
        },
    )
    assert created.status_code == 201, created.text
    change_request = created.json()
    published = await client.post(
        f"/projects/{project['id']}/change-requests/{change_request['id']}/publish",
        json={"expires_in_days": 7},
    )
    token = published.json()["url"].rsplit("/", 1)[-1]
    decision = await client.post(
        f"/public/change-requests/{token}/decision",
        json={"accepted": True, "client_name": "Jordan Client", "comment": "Proceed"},
    )
    assert decision.status_code == 200, decision.text
    updated_project = await client.get(f"/projects/{project['id']}")
    assert Decimal(updated_project.json()["base_price"]) == Decimal("1250.00")
    assert updated_project.json()["target_delivery_date"] == "2026-09-04"

    rejected = await client.post(
        f"/projects/{project['id']}/change-requests",
        json={
            "title": "Add a second language",
            "description": "Translate and configure every public website page.",
            "reason": "The new market was added after scope approval.",
            "additional_price": "400.00",
            "additional_days": 5,
        },
    )
    rejected_id = rejected.json()["id"]
    rejected_link = await client.post(
        f"/projects/{project['id']}/change-requests/{rejected_id}/publish",
        json={"expires_in_days": 7},
    )
    rejected_token = rejected_link.json()["url"].rsplit("/", 1)[-1]
    rejected_decision = await client.post(
        f"/public/change-requests/{rejected_token}/decision",
        json={"accepted": False, "client_name": "Jordan Client", "comment": "Later"},
    )
    assert rejected_decision.status_code == 200
    requests = await client.get(f"/projects/{project['id']}/change-requests")
    statuses = {item["id"]: item["status"] for item in requests.json()}
    assert statuses[rejected_id] == "rejected"
