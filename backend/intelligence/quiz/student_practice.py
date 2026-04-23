"""Student-owned practice quiz: publish without professor review + create attempt stub."""

from __future__ import annotations

from typing import Any

from intelligence.betcha.client import get_supabase
from intelligence.quiz.repository import (
    get_quiz_row,
    insert_quiz_attempt_stub,
    list_questions,
    update_question_row,
    update_quiz_status,
)
from intelligence.quiz.validate import validate_quiz


def user_enrolled_in_course(*, user_id: int, course_id: int) -> bool:
    sb = get_supabase()
    r = (
        sb.table("enrollments")
        .select("id")
        .eq("user_id", int(user_id))
        .eq("course_id", int(course_id))
        .limit(1)
        .execute()
    )
    return bool(r.data)


def start_student_practice_quiz(quiz_id: int, user_id: int) -> dict[str, Any]:
    """
    Approve all questions, publish, and create a solo attempt for a **draft** practice quiz
    owned by ``user_id``.
    """
    quiz = get_quiz_row(quiz_id)
    if int(quiz.get("created_by") or 0) != int(user_id):
        raise ValueError("Only the quiz author can start this practice session")
    if str(quiz.get("type") or "") != "practice":
        raise ValueError("Quiz must be type practice")
    if str(quiz.get("status") or "") != "draft":
        raise ValueError("Quiz must be in draft status to start practice")

    questions = list_questions(quiz_id)
    if not questions:
        raise ValueError("Quiz has no questions")

    errs = validate_quiz(quiz_id)
    if errs:
        raise ValueError("; ".join(errs))

    for q in questions:
        qid = int(q["id"])
        update_question_row(qid, {"approved": True})

    update_quiz_status(quiz_id, "published")

    attempt_id = insert_quiz_attempt_stub(
        quiz_id=quiz_id,
        user_id=user_id,
        mode="solo",
        room_id=f"practice:{quiz_id}",
    )
    return {"quiz_id": quiz_id, "attempt_id": attempt_id}
