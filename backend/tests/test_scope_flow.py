import httpx

from tests.helpers import create_project, make_pro, scope_payload, sign_up


async def test_published_scope_is_immutable_and_approval_targets_version(
    client: httpx.AsyncClient,
    database,
) -> None:
    auth = await sign_up(client)
    await make_pro(database, auth["organization"]["id"])
    project = await create_project(client)
    created = await client.post(
        f"/projects/{project['id']}/scopes",
        json=scope_payload(),
    )
    assert created.status_code == 201, created.text
    scope = created.json()
    published = await client.post(
        f"/projects/{project['id']}/scopes/{scope['id']}/publish",
        json={"expires_in_days": 14},
    )
    assert published.status_code == 200, published.text
    token = published.json()["url"].rsplit("/", 1)[-1]

    edit = await client.patch(
        f"/projects/{project['id']}/scopes/{scope['id']}",
        json=scope_payload(),
    )
    assert edit.status_code == 409
    decision = await client.post(
        f"/public/scopes/{token}/decision",
        json={
            "decision": "approved",
            "client_name": "Jordan Client",
            "client_email": "jordan@example.com",
            "comment": "Approved as written",
        },
    )
    assert decision.status_code == 200, decision.text
    scopes = await client.get(f"/projects/{project['id']}/scopes")
    assert scopes.json()[0]["id"] == scope["id"]
    assert scopes.json()[0]["status"] == "approved"
    replay = await client.post(
        f"/public/scopes/{token}/decision",
        json={
            "decision": "approved",
            "client_name": "Jordan Client",
            "client_email": "jordan@example.com",
        },
    )
    assert replay.status_code == 404
    pdf = await client.get(f"/projects/{project['id']}/scopes/{scope['id']}/pdf")
    assert pdf.status_code == 200
    assert pdf.content.startswith(b"%PDF")
