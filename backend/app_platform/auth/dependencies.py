from datetime import date, datetime

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from postgrest.exceptions import APIError

from database import get_supabase
from models.user import User

from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

_USER_ROW_COLUMNS = (
    "id,email,password_hash,role,display_name,avatar_config,coins,"
    "current_streak,longest_streak,last_activity_date,streak_freezes,created_at,updated_at"
)


def _parse_datetime(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value
    s = str(value)
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


def _parse_optional_date(value: date | datetime | str | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = str(value)
    return date.fromisoformat(s[:10])


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    sb = get_supabase()
    try:
        res = (
            sb.table("users")
            .select(_USER_ROW_COLUMNS)
            .eq("id", user_id)
            .single()
            .execute()
        )
    except APIError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    row = res.data
    return User(
        id=int(row["id"]),
        email=row["email"],
        password_hash=row["password_hash"],
        role=row["role"],
        display_name=row["display_name"],
        avatar_config=row["avatar_config"],
        coins=int(row["coins"]),
        current_streak=int(row["current_streak"]),
        longest_streak=int(row["longest_streak"]),
        last_activity_date=_parse_optional_date(row.get("last_activity_date")),
        streak_freezes=int(row["streak_freezes"]),
        created_at=_parse_datetime(row["created_at"]),
        updated_at=_parse_datetime(row["updated_at"]),
    )
