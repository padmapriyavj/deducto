"""Duel room lifecycle + settlement (uses realtime room_id = ``duel_rooms.id``)."""

from __future__ import annotations

import secrets
from decimal import Decimal

from engagement.duels import repository as duel_repo
from engagement.scoring.duel_settle import apply_duel_settlement
from intelligence.quiz.repository import get_attempt_row, get_quiz_row, insert_quiz_attempt_stub


def _room_id() -> str:
    return secrets.token_urlsafe(12)[:50]


def create_duel(*, quiz_id: int, host_user_id: int) -> dict:
    quiz = get_quiz_row(quiz_id)
    if str(quiz.get("status") or "") != "published":
        raise ValueError("Quiz must be published")
    room = _room_id()
    duel_repo.insert_duel_room(room_id=room, quiz_id=quiz_id, host_user_id=host_user_id)
    return {"room_id": room, "quiz_id": quiz_id, "status": "waiting"}


def join_duel(*, room_id: str, user_id: int) -> dict:
    row = duel_repo.get_duel_room(room_id)
    if not row:
        raise ValueError("Duel room not found")
    if str(row.get("status") or "") == "completed":
        raise ValueError("Duel already completed")
    qid = int(row["quiz_id"])
    if int(row.get("host_user_id")) == int(user_id):
        return {"room_id": room_id, "quiz_id": qid, "ok": True}
    return {"room_id": room_id, "quiz_id": qid, "ok": True}


def create_duel_attempt(*, room_id: str, user_id: int) -> tuple[int, int]:
    row = duel_repo.get_duel_room(room_id)
    if not row:
        raise ValueError("Duel room not found")
    if str(row.get("status") or "") == "completed":
        raise ValueError("Duel already completed")
    qid = int(row["quiz_id"])
    aid = insert_quiz_attempt_stub(quiz_id=qid, user_id=user_id, mode="duel", room_id=room_id)
    return aid, qid


def mark_duel_active(room_id: str) -> None:
    row = duel_repo.get_duel_room(room_id)
    if not row:
        raise ValueError("Duel room not found")
    if str(row.get("status") or "") == "waiting":
        duel_repo.update_duel_room_status(room_id, "active")


def settle_duel(
    *,
    room_id: str,
    attempt_a: int,
    attempt_b: int,
    opponent_ante: int = 0,
    acting_user_id: int | None = None,
) -> dict:
    d = duel_repo.get_duel_room(room_id)
    if not d:
        raise ValueError("Duel room not found")
    if str(d.get("status") or "") == "completed":
        raise ValueError("Duel already settled")
    quiz_id = int(d["quiz_id"])

    aa = get_attempt_row(attempt_a)
    bb = get_attempt_row(attempt_b)
    for att, label in ((aa, "a"), (bb, "b")):
        if int(att.get("quiz_id")) != quiz_id:
            raise ValueError(f"attempt_{label} does not match duel quiz")
        if str(att.get("mode") or "") != "duel":
            raise ValueError(f"attempt_{label} is not a duel attempt")
        if not att.get("completed_at"):
            raise ValueError(f"attempt_{label} is not finalized (score first)")

    ua = int(aa["user_id"])
    ub = int(bb["user_id"])
    if ua == ub:
        raise ValueError("Attempts must be from two different users")
    if acting_user_id is not None and int(acting_user_id) not in (ua, ub):
        raise ValueError("Caller must be one of the duel participants")

    sa = Decimal(str(aa.get("score_pct") or "0"))
    sb_ = Decimal(str(bb.get("score_pct") or "0"))
    if sa > sb_:
        winner, loser = ua, ub
    elif sb_ > sa:
        winner, loser = ub, ua
    else:
        # tie-break: higher correct count from answers — approximate via score only; use coins_earned tie-break
        ca = int(aa.get("coins_earned") or 0)
        cb = int(bb.get("coins_earned") or 0)
        if ca > cb:
            winner, loser = ua, ub
        elif cb > ca:
            winner, loser = ub, ua
        else:
            host = int(d["host_user_id"])
            winner, loser = (host, ub if host == ua else ua)

    out = apply_duel_settlement(
        winner_user_id=winner,
        loser_user_id=loser,
        opponent_ante=opponent_ante,
    )
    duel_repo.update_duel_room_status(room_id, "completed")
    return {
        "winner_user_id": winner,
        "loser_user_id": loser,
        "winner_duel_coins": out["winner_coins"],
        "loser_duel_coins": out["loser_coins"],
    }
