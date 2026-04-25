from __future__ import annotations

import logging
from datetime import date, datetime, timezone

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


def _is_supabase_no_rows_error(exc: APIError) -> bool:
    if exc.code == "PGRST116":
        return True
    msg = (exc.message or "").lower()
    return "0 rows" in msg or "no rows" in msg or "multiple (or no) rows" in msg


def _user_from_hybrid_jwt_payload(payload: dict, user_id: int) -> User:
    """Nginx routes auth to Spring; user may exist only in Spring DB, not Supabase."""
    now = datetime.now(timezone.utc)
    role = str(payload.get("role") or "student")
    if role not in ("student", "professor"):
        role = "student"
    return User(
        id=user_id,
        email=f"spring-user-{user_id}@local.invalid",
        password_hash="",
        role=role,
        display_name="",
        avatar_config={},
        coins=0,
        current_streak=0,
        longest_streak=0,
        last_activity_date=None,
        streak_freezes=2,
        created_at=now,
        updated_at=now,
    )


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
    except APIError as e:
        if _is_supabase_no_rows_error(e):
            return _user_from_hybrid_jwt_payload(payload, user_id)
        # RLS, permission, or other PostgREST errors: still trust a valid Spring-issued JWT.
        logging.getLogger(__name__).warning(
            "Supabase users lookup failed (using JWT claims): %s", e
        )
        return _user_from_hybrid_jwt_payload(payload, user_id)

    row = res.data
    if not row or not isinstance(row, dict):
        return _user_from_hybrid_jwt_payload(payload, user_id)

    def _i(key: str, default: int = 0) -> int:
        v = row.get(key)
        if v is None:
            return default
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    ac = row.get("avatar_config")
    try:
        return User(
            id=int(row["id"]),
            email=str(row.get("email") or ""),
            password_hash=str(row.get("password_hash") or ""),
            role=str(row.get("role") or "student"),
            display_name=str(row.get("display_name") or ""),
            avatar_config=ac if isinstance(ac, dict) else {},
            coins=_i("coins", 0),
            current_streak=_i("current_streak", 0),
            longest_streak=_i("longest_streak", 0),
            last_activity_date=_parse_optional_date(row.get("last_activity_date")),
            streak_freezes=_i("streak_freezes", 2),
            created_at=_parse_datetime(row["created_at"]),
            updated_at=_parse_datetime(row["updated_at"]),
        )
    except (KeyError, TypeError, ValueError) as e:
        logging.getLogger(__name__).warning("Supabase user row parse failed: %s", e)
        return _user_from_hybrid_jwt_payload(payload, user_id)
