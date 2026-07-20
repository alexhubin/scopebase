from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

import aioboto3
from botocore.exceptions import ClientError

from app.common.config import settings


class ObjectStorage:
    def __init__(self) -> None:
        self.session = aioboto3.Session()

    @asynccontextmanager
    async def client(self, public: bool = False) -> AsyncIterator[Any]:
        endpoint = settings.s3_public_endpoint_url if public else settings.s3_endpoint_url
        async with self.session.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        ) as client:
            yield client

    async def ensure_bucket(self) -> None:
        async with self.client() as client:
            try:
                await client.head_bucket(Bucket=settings.s3_bucket)
            except ClientError as error:
                if not settings.s3_auto_create_bucket:
                    raise
                code = str(error.response.get("Error", {}).get("Code", ""))
                if code not in {"404", "NoSuchBucket", "NotFound"}:
                    raise
                await client.create_bucket(Bucket=settings.s3_bucket)

    async def is_ready(self) -> bool:
        async with self.client() as client:
            try:
                await client.head_bucket(Bucket=settings.s3_bucket)
            except ClientError:
                return False
        return True

    async def presigned_upload(
        self,
        storage_key: str,
        content_type: str,
    ) -> str:
        async with self.client(public=True) as client:
            return cast(
                str,
                await client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": settings.s3_bucket,
                        "Key": storage_key,
                        "ContentType": content_type,
                    },
                    ExpiresIn=900,
                ),
            )

    async def presigned_download(self, storage_key: str, filename: str) -> str:
        async with self.client(public=True) as client:
            return cast(
                str,
                await client.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": settings.s3_bucket,
                        "Key": storage_key,
                        "ResponseContentDisposition": f'attachment; filename="{filename}"',
                    },
                    ExpiresIn=900,
                ),
            )

    async def metadata(self, storage_key: str) -> dict[str, Any]:
        async with self.client() as client:
            try:
                return cast(
                    dict[str, Any],
                    await client.head_object(Bucket=settings.s3_bucket, Key=storage_key),
                )
            except ClientError as error:
                raise FileNotFoundError(storage_key) from error

    async def delete(self, storage_key: str) -> None:
        async with self.client() as client:
            await client.delete_object(Bucket=settings.s3_bucket, Key=storage_key)


storage = ObjectStorage()
