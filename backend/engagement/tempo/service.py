"""Tempo scheduling + join hints (PRD §8.5, quizzes.scheduled_at)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from engagement.tempo.schedule_validate import assert_schedule_allows_tempo
from intelligence.betcha.client import get_supabase
from intelligence.quiz.repository import (
    get_quiz_row,
    list_due_tempos,
    list_joinable_tempos,
    list_upcoming_tempos,
    update_quiz_scheduled_at,
)

_fired_quiz_ids: set[str] = set()


def _course_schedule(course_id: int | None) -> dict[str, Any] | None:
    if course_id is None:
        return None
    sb = get_supabase()
    try:
        res = sb.table("courses").select("schedule").eq("id", int(course_id)).single().execute()
    except Exception:
        return None
    row = res.data
    if not row:
        return None
    s = row.get("schedule")
    return dict(s) if isinstance(s, dict) else None


def schedule_tempo(*, quiz_id: int, scheduled_at: datetime) -> None:
    quiz = get_quiz_row(quiz_id)
    qtype = str(quiz.get("type") or "")
    if qtype not in ("tempo", "practice"):
        raise ValueError("Quiz must be type practice or tempo to schedule")
    if str(quiz.get("status") or "") != "published":
        raise ValueError("Quiz must be published to schedule")

    course_id = quiz.get("course_id")
    cid = int(course_id) if course_id is not None else None
    assert_schedule_allows_tempo(scheduled_at, _course_schedule(cid))

    iso = scheduled_at.astimezone(timezone.utc).isoformat()
    update_quiz_scheduled_at(quiz_id, iso, promote_practice_to_tempo=(qtype == "practice"))


def upcoming_for_student(*, limit: int = 30) -> list[dict]:
    return list_upcoming_tempos(limit=limit)


def joinable_for_student(*, limit: int = 30) -> list[dict]:
    """Tempos whose scheduled start is in the past or unset — safe to open join / quiz room."""
    return list_joinable_tempos(limit=limit)


def assert_tempo_join_allowed(*, quiz_id: int) -> None:
    """Raise ``ValueError`` if the quiz is not yet within its scheduled live window."""
    quiz = get_quiz_row(quiz_id)
    if str(quiz.get("type") or "") not in ("tempo", "practice"):
        raise ValueError("Not a tempo quiz")
    if str(quiz.get("status") or "") != "published":
        raise ValueError("Quiz is not published")
    sat = quiz.get("scheduled_at")
    if sat is None or str(sat).strip() == "":
        return
    raw = str(sat).strip().replace("Z", "+00:00")
    try:
        start = datetime.fromisoformat(raw)
    except ValueError:
        return
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    start = start.astimezone(timezone.utc)
    now = datetime.now(timezone.utc)
    if start > now:
        raise ValueError(
            "This Tempo has not started yet. Come back at or after the scheduled time shown on your course page."
        )


async def fire_due_tempos() -> int:
    """Emit ``tempo:fire`` for due quizzes once each (process memory). Returns emit count."""
    from engagement.tempo.broadcast import emit_tempo_fire

    due = list_due_tempos()
    n = 0
    for row in due:
        qid = str(row["id"])
        if qid in _fired_quiz_ids:
            continue
        _fired_quiz_ids.add(qid)
        await emit_tempo_fire(
            quiz_id=qid,
            course_id=str(row.get("course_id") or ""),
            scheduled_at=str(row.get("scheduled_at") or ""),
        )
        n += 1
    return n


def dev_fire_quiz(*, quiz_id: int) -> None:
    """Mark quiz as fired in-memory and emit (caller awaits broadcast)."""
    _fired_quiz_ids.add(str(quiz_id))


def join_hints(*, quiz_id: int) -> dict:
    """Stable socket room id for a class Tempo (aligns UI + server)."""
    rid = f"tempo:{quiz_id}"
    return {"quiz_id": quiz_id, "realtime_room_id": rid, "mode": "tempo"}
