"""Betcha persistence (PRD §9 ``quiz_attempts``: ``betcha_multiplier``, ``betcha_resolved`` only)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase
from intelligence.betcha.resolve import BetchaResolution, parse_multiplier, resolve_betcha_payout

# Columns we read/write — match Deductible-PRD.md §9 ``quiz_attempts`` only
_ATTEMPT_SELECT = (
    "id,user_id,quiz_id,completed_at,betcha_multiplier,betcha_resolved,coins_earned,score_pct"
)


def _wager_recorded(row: dict[str, Any]) -> bool:
    m = row.get("betcha_multiplier")
    return m is not None and str(m).strip() != ""


def place_betcha_wager(
    *,
    user_id: int,
    quiz_id: int,
    attempt_id: int,
    multiplier: str,
) -> int:
    """
    Record confidence multiplier on the attempt. **No upfront coin deduction** — everyone can play.

    Persist only ``betcha_multiplier`` (PRD §9). Payout is computed at finalize time.
    Returns current ``users.coins`` (unchanged).
    """
    parse_multiplier(multiplier)
    sb = get_supabase()

    try:
        att = (
            sb.table("quiz_attempts")
            .select(_ATTEMPT_SELECT)
            .eq("id", attempt_id)
            .single()
            .execute()
        )
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if int(row["user_id"]) != int(user_id):
        raise ValueError("Attempt does not belong to the current user")
    if int(row["quiz_id"]) != int(quiz_id):
        raise ValueError("Attempt does not match this quiz")
    if row.get("completed_at") is not None:
        raise ValueError("Attempt is already completed")
    if row.get("betcha_resolved"):
        raise ValueError("Betcha is locked for this attempt")

    has_ans = (
        sb.table("answers")
        .select("id")
        .eq("attempt_id", int(attempt_id))
        .limit(1)
        .execute()
    )
    if has_ans.data and len(has_ans.data) > 0:
        raise ValueError("Betcha cannot be changed after answers exist")

    sb.table("quiz_attempts").update({"betcha_multiplier": multiplier}).eq("id", int(attempt_id)).execute()

    usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    return int(usr.data["coins"])


def apply_betcha_resolution_to_attempt(
    *,
    user_id: int,
    attempt_id: int,
    score_percent: Decimal,
    base_coins: int,
) -> BetchaResolution | None:
    """
    If ``betcha_multiplier`` is set: credit payout, set ``betcha_resolved``, ``coins_earned``, ``score_pct``.

    If no wager: returns ``None``.
    """
    sb = get_supabase()

    try:
        att = (
            sb.table("quiz_attempts")
            .select(_ATTEMPT_SELECT)
            .eq("id", int(attempt_id))
            .single()
            .execute()
        )
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if int(row["user_id"]) != int(user_id):
        raise ValueError("Attempt does not belong to the current user")
    if not _wager_recorded(row):
        return None
    if row.get("betcha_resolved"):
        raise ValueError("Betcha already resolved for this attempt")

    mult = parse_multiplier(str(row["betcha_multiplier"]))
    resolution = resolve_betcha_payout(score_percent, base_coins, mult)
    payout = resolution.payout_coins

    try:
        usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    new_coins = old_coins + payout
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", int(user_id))
        .eq("coins", old_coins)
        .execute()
    )
    if not cas.data:
        raise ValueError("Could not credit coins (try again)")

    score_val = float(score_percent)
    try:
        sb.table("quiz_attempts").update(
            {
                "betcha_resolved": True,
                "coins_earned": payout,
                "score_pct": score_val,
            }
        ).eq("id", int(attempt_id)).execute()
    except APIError:
        sb.table("users").update({"coins": old_coins}).eq("id", int(user_id)).eq("coins", new_coins).execute()
        raise

    return resolution
