"""Manual test script for S3 storage wrapper.

Usage:
    cd backend && python -m scripts.test_s3

Requires env vars:
    S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
"""

from app_platform.storage import upload_file, get_url, delete_file


def main():
    test_key = "test/hello.txt"
    test_content = b"Hello, S3!"
    content_type = "text/plain"

    print(f"Uploading test file to key: {test_key}")
    result_key = upload_file(test_key, test_content, content_type)
    print(f"Upload successful. Key: {result_key}")

    print("\nGenerating presigned URL...")
    url = get_url(test_key)
    print(f"Presigned URL (valid for 1 hour):\n{url}")

    print("\nTo delete the test file, uncomment the delete call below and re-run.")
    #delete_file(test_key)
    #print(f"Deleted: {test_key}")


if __name__ == "__main__":
    main()
