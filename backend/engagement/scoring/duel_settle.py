"""PRD §7.9 duel coin payout after both attempts are scored (base quiz coins = 0 for duel mode)."""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from engagement.scoring.rules import duel_outcome_coins
from intelligence.betcha.client import get_supabase


def _add_coins_cas(user_id: int, delta: int) -> None:
    if delta == 0:
        return
    sb = get_supabase()
    try:
        usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e
    old = int(usr.data["coins"])
    new = old + delta
    cas = sb.table("users").update({"coins": new}).eq("id", int(user_id)).eq("coins", old).execute()
    if not cas.data:
        raise ValueError("Coin update failed (retry)")


def apply_duel_settlement(
    *,
    winner_user_id: int,
    loser_user_id: int,
    opponent_ante: int = 0,
) -> dict[str, Any]:
    """
    Credit winner ``100 + opponent_ante`` and loser ``20`` consolation (PRD §7.9).
    Call only after both duel attempts have been finalized via ``score_attempt``.
    """
    w = duel_outcome_coins(won=True, opponent_ante=opponent_ante)
    l = duel_outcome_coins(won=False)
    _add_coins_cas(winner_user_id, w)
    _add_coins_cas(loser_user_id, l)
    return {
        "winner_coins": w,
        "loser_coins": l,
        "winner_user_id": int(winner_user_id),
        "loser_user_id": int(loser_user_id),
    }
