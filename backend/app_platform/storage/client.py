"""S3 client for the storage module (AWS credentials from env)."""

import os
from functools import lru_cache

from dotenv import load_dotenv
import boto3

load_dotenv()


@lru_cache
def get_s3_client():
    """Cached S3 client using env vars."""
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION"),
    )


def get_bucket_name() -> str:
    """Get S3 bucket name from env var."""
    bucket = os.environ.get("S3_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("S3_BUCKET_NAME must be set")
    return bucket


__all__ = ["get_s3_client", "get_bucket_name"]
