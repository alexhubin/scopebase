import json
from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    app_env: str = "development"
    app_name: str = "ScopeBase API"
    secret_key: str = "development-only-secret-key-change-me"
    database_url: str = "postgresql+asyncpg://scopebase:scopebase@localhost:5432/scopebase"
    frontend_url: str = "http://localhost:3000"
    public_app_url: str = "http://localhost:3000"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    public_link_ttl_days: int = 30
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    cookie_secure: bool = False
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_from: str = "ScopeBase <noreply@scopebase.local>"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "scopebase"
    s3_secret_key: str = "scopebase-secret"
    s3_bucket: str = "scopebase"
    s3_region: str = "us-east-1"
    max_upload_bytes: int = 10 * 1024 * 1024
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro: str = ""
    billing_adapter: str = "local"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            if value.lstrip().startswith("["):
                return json.loads(value)
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_secret(self) -> "Settings":
        invalid_secret = len(self.secret_key) < 32 or "development" in self.secret_key.lower()
        if self.app_env == "production" and invalid_secret:
            raise ValueError("Production requires a strong SECRET_KEY")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
