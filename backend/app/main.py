from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.common.config import settings
from app.common.database import SessionLocal
from app.common.exceptions import register_exception_handlers
from app.common.middleware import RequestIDMiddleware
from app.common.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
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


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", timestamp=datetime.now(UTC))


@app.get("/ready", response_model=HealthResponse, tags=["System"])
async def readiness() -> HealthResponse:
    async with SessionLocal() as session:
        await session.execute(text("SELECT 1"))
    return HealthResponse(status="ready", timestamp=datetime.now(UTC), details={"database": "ok"})
