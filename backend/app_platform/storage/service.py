"""S3 storage operations for file upload, download URLs, and deletion."""

from app_platform.storage.client import get_s3_client, get_bucket_name


def upload_file(key: str, file_bytes: bytes, content_type: str) -> str:
    """
    Upload file to S3 bucket.

    Args:
        key: S3 object key (e.g., "materials/{course_id}/{filename}")
        file_bytes: File content as bytes
        content_type: MIME type (e.g., "application/pdf")

    Returns:
        The S3 key of the uploaded file
    """
    client = get_s3_client()
    client.put_object(
        Bucket=get_bucket_name(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return key


def get_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned download URL for an S3 object.

    Args:
        key: S3 object key
        expires_in: URL expiration time in seconds (default 1 hour)

    Returns:
        Presigned URL string
    """
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": get_bucket_name(), "Key": key},
        ExpiresIn=expires_in,
    )


def delete_file(key: str) -> None:
    """
    Delete a file from S3 bucket.

    Args:
        key: S3 object key to delete
    """
    client = get_s3_client()
    client.delete_object(Bucket=get_bucket_name(), Key=key)
