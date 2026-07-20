import asyncio
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[datetime]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str, limit: int, window_seconds: int) -> None:
        cutoff = datetime.now(UTC) - timedelta(seconds=window_seconds)
        async with self._lock:
            records = self._requests[key]
            while records and records[0] < cutoff:
                records.popleft()
            if len(records) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests",
                )
            records.append(datetime.now(UTC))

    def reset(self) -> None:
        self._requests.clear()


limiter = InMemoryRateLimiter()


async def auth_rate_limit(request: Request) -> None:
    host = request.client.host if request.client else "unknown"
    await limiter.check(f"auth:{host}", 10, 60)


async def public_rate_limit(request: Request) -> None:
    host = request.client.host if request.client else "unknown"
    await limiter.check(f"public:{host}", 60, 60)
