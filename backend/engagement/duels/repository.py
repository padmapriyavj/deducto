"""``duel_rooms`` (PRD §9) via Supabase."""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


def insert_duel_room(*, room_id: str, quiz_id: int, host_user_id: int) -> None:
    sb = get_supabase()
    row = {
        "id": room_id,
        "quiz_id": int(quiz_id),
        "host_user_id": int(host_user_id),
        "status": "waiting",
    }
    sb.table("duel_rooms").insert(row).execute()


def get_duel_room(room_id: str) -> dict[str, Any] | None:
    sb = get_supabase()
    try:
        res = sb.table("duel_rooms").select("*").eq("id", room_id).single().execute()
    except APIError:
        return None
    return dict(res.data) if res.data else None


def update_duel_room_status(room_id: str, status: str) -> None:
    sb = get_supabase()
    sb.table("duel_rooms").update({"status": status}).eq("id", room_id).execute()
