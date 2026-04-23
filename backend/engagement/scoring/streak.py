"""PRD §7.10 streak: UTC calendar day activity; milestone coin grants."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


# PRD §7.9 streak milestones (one-time bonus when streak *reaches* that day count)
STREAK_MILESTONE_BONUS: dict[int, int] = {
    7: 200,
    14: 500,
    30: 1000,
}


@dataclass
class StreakUpdateResult:
    current_streak: int
    longest_streak: int
    milestone_bonus_coins: int
    last_activity_date: date
    already_active_today: bool


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


def _add_coins_cas(user_id: int, delta: int) -> int:
    """Add coins with compare-and-swap on balance."""
    if delta == 0:
        sb = get_supabase()
        res = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
        return int(res.data["coins"])

    sb = get_supabase()
    try:
        usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    new_coins = old_coins + delta
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", int(user_id))
        .eq("coins", old_coins)
        .execute()
    )
    if not cas.data:
        raise ValueError("Could not apply streak bonus (try again)")
    return new_coins


def apply_streak_after_quiz_completion(user_id: int, *, today: date | None = None) -> StreakUpdateResult:
    """
    Qualifying quiz completion (UTC day). First completion of the day advances streak;
    same-day subsequent completions do not double-count the streak.
    Milestone bonuses are credited when the new streak equals 7, 14, or 30.
    """
    today_d = today or _utc_today()
    sb = get_supabase()

    try:
        row = (
            sb.table("users")
            .select("current_streak,longest_streak,last_activity_date")
            .eq("id", int(user_id))
            .single()
            .execute()
        )
    except APIError as e:
        raise ValueError("User not found") from e

    data: dict[str, Any] = dict(row.data)
    current = int(data.get("current_streak") or 0)
    longest = int(data.get("longest_streak") or 0)
    raw_last = data.get("last_activity_date")

    last_d: date | None = None
    if raw_last:
        if isinstance(raw_last, str):
            last_d = date.fromisoformat(raw_last[:10])
        elif isinstance(raw_last, date):
            last_d = raw_last

    if last_d == today_d:
        return StreakUpdateResult(
            current_streak=current,
            longest_streak=longest,
            milestone_bonus_coins=0,
            last_activity_date=today_d,
            already_active_today=True,
        )

    yesterday = today_d - timedelta(days=1)

    if last_d is None:
        new_streak = 1
    elif last_d == yesterday:
        new_streak = current + 1
    else:
        # missed at least one full UTC day — reset (freeze consumption: future nightly job)
        new_streak = 1

    milestone_bonus = STREAK_MILESTONE_BONUS.get(new_streak, 0)
    new_longest = max(longest, new_streak)

    update_payload: dict[str, Any] = {
        "current_streak": new_streak,
        "longest_streak": new_longest,
        "last_activity_date": today_d.isoformat(),
    }

    sb.table("users").update(update_payload).eq("id", int(user_id)).execute()

    if milestone_bonus > 0:
        _add_coins_cas(user_id, milestone_bonus)

    return StreakUpdateResult(
        current_streak=new_streak,
        longest_streak=new_longest,
        milestone_bonus_coins=milestone_bonus,
        last_activity_date=today_d,
        already_active_today=False,
    )
