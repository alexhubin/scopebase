from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import pytest

from app.files.storage import ObjectStorage


class PresignClient:
    def __init__(self) -> None:
        self.params: dict[str, Any] = {}

    async def generate_presigned_url(
        self, operation: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        self.params = Params
        return "https://example.com/upload"


@pytest.mark.asyncio
async def test_presigned_upload_only_signs_browser_controlled_headers(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    storage = ObjectStorage()
    client = PresignClient()

    @asynccontextmanager
    async def fake_client(public: bool = False) -> AsyncIterator[PresignClient]:
        yield client

    monkeypatch.setattr(storage, "client", fake_client)

    url = await storage.presigned_upload("projects/file.png", "image/png")

    assert url == "https://example.com/upload"
    assert client.params == {
        "Bucket": "scopebase",
        "Key": "projects/file.png",
        "ContentType": "image/png",
    }
