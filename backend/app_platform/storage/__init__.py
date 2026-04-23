"""S3 storage wrapper for file operations."""

from app_platform.storage.service import upload_file, get_url, delete_file

__all__ = ["upload_file", "get_url", "delete_file"]
