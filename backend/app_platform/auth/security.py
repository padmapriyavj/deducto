import hashlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext

# app_platform/auth/ → two parents up to ``backend/``; cwd-independent so JWT matches Spring.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# Spring's JwtService uses JJWT Keys.hmacShaKeyFor(sha256(UTF-8 bytes of the secret));
# the raw string must not be used as the HS256 key or Spring-issued tokens fail here.
def _jwt_hmac_key() -> bytes:
    secret = os.getenv("JWT_SECRET_KEY", "deductible-dev-secret")
    return hashlib.sha256(secret.encode("utf-8")).digest()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, role: str) -> str:
    key = _jwt_hmac_key()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _jwt_hmac_key(), algorithms=["HS256"])
