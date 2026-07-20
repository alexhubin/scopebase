import httpx

from tests.helpers import create_project, sign_up


async def test_project_access_is_scoped_to_organization(client: httpx.AsyncClient) -> None:
    await sign_up(client, "first@example.com", "First Studio")
    project = await create_project(client, "Private project")

    transport = httpx.ASGITransport(app=client._transport.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as other:
        await sign_up(other, "second@example.com", "Second Studio")
        response = await other.get(f"/projects/{project['id']}")
        assert response.status_code == 404
