import pytest

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
