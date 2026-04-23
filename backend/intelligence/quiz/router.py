"""Quiz Module HTTP API (PRD §10; PERSON_B §6)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from app_platform.auth.dependencies import get_current_user
from intelligence.betcha.deps import get_current_user_id
from intelligence.quiz.generate import generate_quiz
from models.user import User
from intelligence.quiz.regenerate import regenerate_question
from intelligence.quiz.repository import (
    get_attempt_row,
    get_question_row,
    get_quiz_row,
    list_questions,
    update_question_row,
    update_quiz_status,
)
from intelligence.quiz.schemas import (
    QuestionEditBody,
    QuestionRegenerateRequest,
    QuizGenerateRequest,
    QuizGenerateResponse,
    PublishResponse,
    ScoreAttemptInput,
    ScoreAttemptResult,
    StudentPracticeStartResponse,
)
from intelligence.quiz.score_attempt import score_attempt
from intelligence.quiz.student_practice import start_student_practice_quiz, user_enrolled_in_course
from intelligence.quiz.validate import validate_quiz

router = APIRouter(prefix="/api/v1", tags=["Quizzes"])


@router.post("/quizzes/generate", response_model=QuizGenerateResponse)
async def post_generate_quiz(
    body: QuizGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> QuizGenerateResponse:
    if current_user.role == "student":
        if not user_enrolled_in_course(user_id=int(current_user.id), course_id=int(body.course_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to generate a practice quiz",
            )
    try:
        out = generate_quiz(body, created_by=int(current_user.id))
        return QuizGenerateResponse(
            quiz_id=int(out["quiz_id"]),
            status=out["status"],  # type: ignore[arg-type]
            questions=out["questions"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e


@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: int) -> dict:
    try:
        quiz = get_quiz_row(quiz_id)
        questions = list_questions(quiz_id)
        return {**quiz, "questions": questions}
    except APIError as e:
        # PGRST116: `.single()` with zero rows — true missing quiz.
        if e.code == "PGRST116" or (
            e.message and ("0 rows" in e.message or "multiple (or no) rows" in e.message.lower())
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found") from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=e.message or "Database error while loading quiz",
        ) from e


@router.post("/questions/{question_id}/regenerate")
async def post_regenerate_question(
    question_id: int,
    body: QuestionRegenerateRequest | None = None,
) -> dict:
    override = body.config if body else None
    try:
        return regenerate_question(question_id, config_override=override)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e


@router.patch("/questions/{question_id}")
async def patch_question(question_id: int, body: QuestionEditBody) -> dict:
    fields: dict = {}
    if body.text is not None:
        fields["text"] = body.text
    if body.choices is not None:
        fields["choices"] = [c.model_dump() for c in body.choices]
    if body.correct_choice is not None:
        fields["correct_choice"] = body.correct_choice
    if not fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    try:
        update_question_row(question_id, fields)
        return get_question_row(question_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/questions/{question_id}/approve")
async def post_approve_question(question_id: int) -> dict:
    update_question_row(question_id, {"approved": True})
    return get_question_row(question_id)


@router.post(
    "/quizzes/{quiz_id}/student-practice/start",
    response_model=StudentPracticeStartResponse,
)
async def post_start_student_practice(
    quiz_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> StudentPracticeStartResponse:
    """Auto-approve all questions, publish, and create a solo attempt (quiz author only)."""
    try:
        out = start_student_practice_quiz(quiz_id, int(current_user.id))
        return StudentPracticeStartResponse(
            quiz_id=int(out["quiz_id"]),
            attempt_id=int(out["attempt_id"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/quizzes/{quiz_id}/publish", response_model=PublishResponse)
async def post_publish_quiz(quiz_id: int) -> PublishResponse:
    questions = list_questions(quiz_id)
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no questions")
    if any(not q.get("approved") for q in questions):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All questions must be approved")
    errs = validate_quiz(quiz_id)
    if errs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": errs})
    update_quiz_status(quiz_id, "published")
    return PublishResponse(quiz_id=quiz_id, status="published")


@router.post("/quiz-attempts/{attempt_id}/score", response_model=ScoreAttemptResult)
async def post_score_attempt(
    attempt_id: int,
    body: ScoreAttemptInput,
    user_id: int = Depends(get_current_user_id),
) -> ScoreAttemptResult:
    try:
        att = get_attempt_row(attempt_id)
        qid = int(att["quiz_id"])
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found") from e

    try:
        return score_attempt(
            quiz_id=qid,
            attempt_id=attempt_id,
            user_id=user_id,
            answers=body.answers,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
