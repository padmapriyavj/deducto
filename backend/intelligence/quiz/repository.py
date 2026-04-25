"""Supabase persistence for quizzes and questions.

All primary and foreign keys here are stored as ``bigint`` / ``int`` in Postgres.
Use Python ``int`` in JSON bodies and ``.eq()`` filters — never UUID-shaped strings.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from intelligence.betcha.client import get_supabase


def insert_quiz(
    *,
    course_id: int,
    created_by: int,
    config: dict[str, Any],
    quiz_type: str,
    lesson_id: int | None,
    status: str,
    duration_sec: int | None,
    scheduled_at: str | None = None,
) -> int:
    sb = get_supabase()
    row = {
        "type": quiz_type,
        "course_id": int(course_id),
        "created_by": int(created_by),
        "config": config,
        "status": status,
        "duration_sec": duration_sec,
    }
    if lesson_id is not None:
        row["lesson_id"] = int(lesson_id)
    if scheduled_at is not None:
        row["scheduled_at"] = scheduled_at
    res = sb.table("quizzes").insert(row).execute()
    if not res.data:
        raise RuntimeError("Failed to insert quiz")
    return int(res.data[0]["id"])


def insert_questions(quiz_id: int, rows: list[dict[str, Any]]) -> list[int]:
    sb = get_supabase()
    payload: list[dict[str, Any]] = []
    for r in rows:
        row = {**r, "quiz_id": int(quiz_id)}
        cid = row.get("concept_id")
        if cid is not None:
            row["concept_id"] = int(cid)
        payload.append(row)
    res = sb.table("questions").insert(payload).execute()
    return [int(r["id"]) for r in (res.data or [])]


def get_quiz_row(quiz_id: int) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("quizzes").select("*").eq("id", int(quiz_id)).single().execute()
    return dict(res.data)


def list_questions(quiz_id: int) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("questions")
        .select("*")
        .eq("quiz_id", int(quiz_id))
        .order("question_order")
        .execute()
    )
    return list(res.data or [])


def get_question_row(question_id: int) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("questions").select("*").eq("id", int(question_id)).single().execute()
    return dict(res.data)


def update_question_row(question_id: int, fields: dict[str, Any]) -> None:
    sb = get_supabase()
    payload = dict(fields)
    if "concept_id" in payload and payload["concept_id"] is not None:
        payload["concept_id"] = int(payload["concept_id"])
    sb.table("questions").update(payload).eq("id", int(question_id)).execute()


def update_quiz_status(quiz_id: int, status: str) -> None:
    sb = get_supabase()
    sb.table("quizzes").update({"status": status}).eq("id", int(quiz_id)).execute()


def fetch_concepts_for_lessons(lesson_ids: list[int]) -> list[dict[str, Any]]:
    sb = get_supabase()
    out: list[dict[str, Any]] = []
    for lid in lesson_ids:
        res = sb.table("concepts").select("id,lesson_id,name,description").eq("lesson_id", lid).execute()
        for r in res.data or []:
            out.append(dict(r))
    return out


def insert_quiz_attempt_stub(
    *,
    quiz_id: int,
    user_id: int,
    mode: str = "solo",
    room_id: str | None = None,
) -> int:
    """Create an attempt row for scoring (minimal fields)."""
    sb = get_supabase()
    from datetime import datetime, timezone

    row = {
        "quiz_id": int(quiz_id),
        "user_id": int(user_id),
        "mode": mode,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    if room_id is not None:
        row["room_id"] = room_id
    res = sb.table("quiz_attempts").insert(row).execute()
    if not res.data:
        raise RuntimeError("Failed to insert quiz_attempt")
    return int(res.data[0]["id"])


def insert_answers(attempt_id: int, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    sb = get_supabase()
    payload = []
    for r in rows:
        item = {**r, "attempt_id": int(attempt_id)}
        if "question_id" in item and item["question_id"] is not None:
            item["question_id"] = int(item["question_id"])
        payload.append(item)
    sb.table("answers").insert(payload).execute()


def update_attempt_scores(
    attempt_id: int,
    *,
    score_pct: Decimal,
    coins_earned: int,
    completed: bool = True,
) -> None:
    sb = get_supabase()
    from datetime import datetime, timezone

    fields: dict[str, Any] = {
        "score_pct": float(score_pct),
        "coins_earned": coins_earned,
    }
    if completed:
        fields["completed_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("quiz_attempts").update(fields).eq("id", int(attempt_id)).execute()


def mark_attempt_completed(attempt_id: int) -> None:
    from datetime import datetime, timezone

    sb = get_supabase()
    sb.table("quiz_attempts").update(
        {"completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", int(attempt_id)).execute()


def get_attempt_row(attempt_id: int) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("quiz_attempts").select("*").eq("id", int(attempt_id)).single().execute()
    return dict(res.data)


def attempt_has_answers(attempt_id: int) -> bool:
    sb = get_supabase()
    res = (
        sb.table("answers")
        .select("id")
        .eq("attempt_id", int(attempt_id))
        .limit(1)
        .execute()
    )
    return bool(res.data and len(res.data) > 0)


def list_answers_for_attempt(attempt_id: int) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("answers")
        .select("question_id,selected_choice,is_correct,time_taken_ms")
        .eq("attempt_id", int(attempt_id))
        .execute()
    )
    return list(res.data or [])


def update_user_coins(user_id: int, new_balance: int) -> None:
    sb = get_supabase()
    sb.table("users").update({"coins": new_balance}).eq("id", int(user_id)).execute()


def get_user_coins(user_id: int) -> int:
    sb = get_supabase()
    res = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    return int(res.data["coins"])


def list_upcoming_tempos(*, limit: int = 50) -> list[dict[str, Any]]:
    """Published tempo quizzes with ``scheduled_at`` in the future (UTC)."""
    from datetime import datetime, timezone

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("quizzes")
        .select("id,course_id,type,status,scheduled_at,lesson_id,created_by,duration_sec,config")
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows = [r for r in (res.data or []) if r.get("scheduled_at") and str(r["scheduled_at"]) > now]
    rows.sort(key=lambda x: str(x.get("scheduled_at") or ""))
    return rows[:limit]


def list_due_tempos(*, limit: int = 100) -> list[dict[str, Any]]:
    """Published tempo quizzes that should fire (``scheduled_at`` <= now)."""
    from datetime import datetime, timezone

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("quizzes")
        .select("id,course_id,type,status,scheduled_at,lesson_id,created_by,duration_sec,config")
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows = [r for r in (res.data or []) if r.get("scheduled_at") and str(r["scheduled_at"]) <= now]
    return rows[:limit]


def list_joinable_tempos(*, limit: int = 50) -> list[dict[str, Any]]:
    """Published tempo quizzes students may join: no ``scheduled_at``, or start time has passed (UTC)."""
    from datetime import datetime, timezone

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("quizzes")
        .select("id,course_id,type,status,scheduled_at,lesson_id,created_by,duration_sec,config")
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows: list[dict[str, Any]] = []
    for r in res.data or []:
        sat = r.get("scheduled_at")
        if sat is None or str(sat).strip() == "":
            rows.append(r)
        elif str(sat) <= now:
            rows.append(r)
    rows.sort(key=lambda x: str(x.get("scheduled_at") or ""), reverse=True)
    return rows[:limit]


def update_quiz_scheduled_at(
    quiz_id: int,
    scheduled_at: str | None,
    *,
    promote_practice_to_tempo: bool = False,
) -> None:
    sb = get_supabase()
    payload: dict[str, Any] = {"scheduled_at": scheduled_at}
    if promote_practice_to_tempo:
        payload["type"] = "tempo"
    sb.table("quizzes").update(payload).eq("id", int(quiz_id)).execute()


def update_attempt_room_id(attempt_id: int, room_id: str) -> None:
    sb = get_supabase()
    sb.table("quiz_attempts").update({"room_id": room_id}).eq("id", int(attempt_id)).execute()
