import pytest
from pydantic import ValidationError

from app.common.config import Settings


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (
            "https://scopebase.example.com, https://app.scopebase.example.com",
            ["https://scopebase.example.com", "https://app.scopebase.example.com"],
        ),
        (
            '["https://scopebase.example.com", "https://app.scopebase.example.com"]',
            ["https://scopebase.example.com", "https://app.scopebase.example.com"],
        ),
    ],
)
def test_cors_origins_supports_csv_and_json(
    monkeypatch: pytest.MonkeyPatch, value: str, expected: list[str]
) -> None:
    monkeypatch.setenv("CORS_ORIGINS", value)

    settings = Settings(_env_file=None)

    assert settings.cors_origins == expected


def test_r2_storage_accepts_s3_api_endpoint() -> None:
    endpoint = f"https://{'a' * 32}.r2.cloudflarestorage.com"

    settings = Settings(
        storage_provider="r2",
        s3_endpoint_url=endpoint,
        s3_public_endpoint_url=endpoint,
        s3_region="auto",
        s3_auto_create_bucket=False,
        _env_file=None,
    )

    assert settings.storage_provider == "r2"


def test_r2_storage_rejects_bucket_path_in_endpoint() -> None:
    endpoint = f"https://{'a' * 32}.r2.cloudflarestorage.com/scopebase"

    with pytest.raises(ValidationError, match="must not include a bucket path"):
        Settings(
            storage_provider="r2",
            s3_endpoint_url=endpoint,
            s3_public_endpoint_url=endpoint,
            s3_region="auto",
            s3_auto_create_bucket=False,
            _env_file=None,
        )
