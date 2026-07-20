import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse

logger = logging.getLogger("scopebase")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, error: RequestValidationError
    ) -> ORJSONResponse:
        issues = [
            {
                "field": ".".join(str(part) for part in issue["loc"] if part != "body"),
                "message": issue["msg"],
            }
            for issue in error.errors()
        ]
        return ORJSONResponse(
            status_code=422,
            content={"detail": "Validation failed", "issues": issues},
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, error: Exception) -> ORJSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.exception("Unhandled request error", extra={"request_id": request_id})
        return ORJSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
        )
