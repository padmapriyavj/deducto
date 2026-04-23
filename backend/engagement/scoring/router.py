"""Engagement scoring HTTP API (streak read; quiz score lives under ``intelligence.quiz``)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase
from intelligence.betcha.deps import get_current_user_id

router = APIRouter(prefix="/scoring", tags=["Scoring"])


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: str | None
    coins: int


@router.get("/me", response_model=StreakResponse)
async def get_my_streak_and_coins(user_id: int = Depends(get_current_user_id)) -> StreakResponse:
    """Current user's streak fields and coin balance (PRD dashboard)."""
    sb = get_supabase()
    try:
        row = (
            sb.table("users")
            .select("current_streak,longest_streak,last_activity_date,coins")
            .eq("id", int(user_id))
            .single()
            .execute()
        )
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found") from e

    d = row.data
    raw = d.get("last_activity_date")
    last_s: str | None
    if raw is None:
        last_s = None
    elif hasattr(raw, "isoformat"):
        last_s = raw.isoformat()
    else:
        last_s = str(raw)[:10]

    return StreakResponse(
        current_streak=int(d.get("current_streak") or 0),
        longest_streak=int(d.get("longest_streak") or 0),
        last_activity_date=last_s,
        coins=int(d.get("coins") or 0),
    )
