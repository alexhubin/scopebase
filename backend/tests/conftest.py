import os
from collections.abc import AsyncIterator

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////private/tmp/scopebase_pytest.db"
os.environ["SECRET_KEY"] = "scopebase-test-secret-key-with-at-least-32-characters"

import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import Base, SessionLocal, engine, get_session
from app.common.rate_limit import limiter
from app.email.provider import email_provider
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def database(monkeypatch) -> AsyncIterator[AsyncSession]:
    limiter.reset()
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:

        async def override_session() -> AsyncIterator[AsyncSession]:
            yield session

        async def ignore_email(email) -> None:
            return None

        app.dependency_overrides[get_session] = override_session
        monkeypatch.setattr(email_provider, "send", ignore_email)
        yield session
        app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
