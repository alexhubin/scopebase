from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.activity.router import router as activity_router
from app.auth.router import router as auth_router
from app.billing.router import router as billing_router
from app.briefs.router import public_router as public_briefs_router
from app.briefs.router import router as briefs_router
from app.change_requests.router import public_router as public_change_requests_router
from app.change_requests.router import router as change_requests_router
from app.common.config import settings
from app.common.database import SessionLocal
from app.common.exceptions import register_exception_handlers
from app.common.middleware import RequestIDMiddleware
from app.common.schemas import HealthResponse
from app.files.router import public_router as public_files_router
from app.files.router import router as files_router
from app.files.storage import storage
from app.organizations.router import router as organization_router
from app.projects.router import dashboard_router
from app.projects.router import router as projects_router
from app.scopes.router import public_router as public_scopes_router
from app.scopes.router import router as scopes_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.app_env != "test":
        await storage.ensure_bucket()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
register_exception_handlers(app)
app.include_router(auth_router)
app.include_router(organization_router)
app.include_router(dashboard_router)
app.include_router(projects_router)
app.include_router(activity_router)
app.include_router(briefs_router)
app.include_router(scopes_router)
app.include_router(change_requests_router)
app.include_router(files_router)
app.include_router(billing_router)
app.include_router(public_briefs_router)
app.include_router(public_scopes_router)
app.include_router(public_change_requests_router)
app.include_router(public_files_router)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", timestamp=datetime.now(UTC))


@app.get("/ready", response_model=HealthResponse, tags=["System"])
async def readiness() -> HealthResponse:
    async with SessionLocal() as session:
        await session.execute(text("SELECT 1"))
    if not await storage.is_ready():
        raise HTTPException(status_code=503, detail="Object storage unavailable")
    return HealthResponse(
        status="ready",
        timestamp=datetime.now(UTC),
        details={"database": "ok", "object_storage": "ok"},
    )
