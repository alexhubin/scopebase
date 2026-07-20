import httpx

from tests.helpers import sign_up


async def test_sign_up_current_user_and_refresh_rotation(client: httpx.AsyncClient) -> None:
    session = await sign_up(client)
    current = await client.get("/auth/me")
    assert current.status_code == 200
    assert current.json()["user"]["email"] == "owner@example.com"

    original_refresh = client.cookies.get("scopebase_refresh")
    assert original_refresh
    refreshed = await client.post("/auth/refresh")
    assert refreshed.status_code == 200
    replacement_refresh = client.cookies.get("scopebase_refresh")
    assert replacement_refresh and replacement_refresh != original_refresh
    assert refreshed.json()["access_token"] != session["access_token"]

    transport = httpx.ASGITransport(app=client._transport.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as replay:
        replay.cookies.set("scopebase_refresh", original_refresh)
        reused = await replay.post("/auth/refresh")
        assert reused.status_code == 401

        replay.cookies.set("scopebase_refresh", replacement_refresh)
        family_revoked = await replay.post("/auth/refresh")
        assert family_revoked.status_code == 401


async def test_password_policy_is_enforced(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/auth/sign-up",
        json={
            "email": "owner@example.com",
            "password": "onlyletters",
            "full_name": "Test Owner",
            "organization_name": "Test Studio",
        },
    )
    assert response.status_code == 422
