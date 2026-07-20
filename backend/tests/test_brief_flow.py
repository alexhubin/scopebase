import httpx

from tests.helpers import create_project, make_pro, sign_up


async def test_public_brief_submission_is_validated_and_single_use(client, database) -> None:
    auth = await sign_up(client)
    await make_pro(database, auth["organization"]["id"])
    project = await create_project(client)
    configured = await client.put(
        f"/projects/{project['id']}/brief",
        json={
            "name": "Discovery",
            "description": "Project discovery",
            "category": "Web",
            "questions": [
                {
                    "id": "goal",
                    "label": "What is the main goal?",
                    "description": "",
                    "required": True,
                    "type": "long_text",
                    "options": [],
                    "order": 0,
                }
            ],
        },
    )
    assert configured.status_code == 200, configured.text
    published = await client.post(
        f"/projects/{project['id']}/brief/publish",
        json={"expires_in_days": 7},
    )
    assert published.status_code == 200, published.text
    token = published.json()["url"].rsplit("/", 1)[-1]

    wrong_resource = await client.get(f"/public/scopes/{token}")
    assert wrong_resource.status_code == 404
    missing = await client.post(f"/public/briefs/{token}/submit", json={"answers": {}})
    assert missing.status_code == 422
    submitted = await client.post(
        f"/public/briefs/{token}/submit",
        json={"answers": {"goal": "Generate more qualified leads"}},
    )
    assert submitted.status_code == 200, submitted.text
    reused = await client.get(f"/public/briefs/{token}")
    assert reused.status_code == 404


async def test_free_plan_cannot_create_custom_brief(client: httpx.AsyncClient) -> None:
    await sign_up(client)
    project = await create_project(client)
    response = await client.put(
        f"/projects/{project['id']}/brief",
        json={
            "name": "Custom",
            "questions": [
                {
                    "id": "goal",
                    "label": "Project goal",
                    "required": True,
                    "type": "short_text",
                    "order": 0,
                }
            ],
        },
    )
    assert response.status_code == 403
