"""Tempo HTTP API (PERSON_B §6)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from engagement.tempo.schemas import ScheduleTempoBody, TempoFireResponse, TempoJoinResponse
from engagement.tempo import service as tempo_service
from engagement.tempo.broadcast import emit_tempo_fire
from intelligence.betcha.deps import get_current_user_id
from intelligence.quiz.repository import get_quiz_row

router = APIRouter(prefix="/tempos", tags=["Tempo"])


@router.post("/schedule", status_code=status.HTTP_204_NO_CONTENT)
async def post_schedule_tempo(
    body: ScheduleTempoBody,
    _user_id: int = Depends(get_current_user_id),
) -> None:
    try:
        tempo_service.schedule_tempo(quiz_id=body.quiz_id, scheduled_at=body.scheduled_at)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get("/upcoming")
async def get_upcoming_tempos(
    _user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    return tempo_service.upcoming_for_student()


@router.get("/joinable")
async def get_joinable_tempos(
    _user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    """Published tempos the student may join now (scheduled start in the past or unset)."""
    return tempo_service.joinable_for_student()


@router.post("/{quiz_id}/join", response_model=TempoJoinResponse)
async def post_tempo_join(
    quiz_id: int,
    _user_id: int = Depends(get_current_user_id),
) -> TempoJoinResponse:
    try:
        q = get_quiz_row(quiz_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found") from None
    if str(q.get("type") or "") not in ("tempo", "practice"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not a tempo or practice quiz")
    try:
        tempo_service.assert_tempo_join_allowed(quiz_id=quiz_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    h = tempo_service.join_hints(quiz_id=quiz_id)
    return TempoJoinResponse(
        quiz_id=h["quiz_id"],
        realtime_room_id=h["realtime_room_id"],
    )


@router.post("/{quiz_id}/fire", response_model=TempoFireResponse)
async def post_dev_fire_tempo(quiz_id: int) -> TempoFireResponse:
    """Dev/demo: emit ``tempo:fire`` immediately."""
    try:
        q = get_quiz_row(quiz_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found") from None
    if str(q.get("type") or "") not in ("tempo", "practice"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not a tempo or practice quiz")
    tempo_service.dev_fire_quiz(quiz_id=quiz_id)
    await emit_tempo_fire(
        quiz_id=str(quiz_id),
        course_id=str(q.get("course_id") or ""),
        scheduled_at=str(q.get("scheduled_at") or ""),
    )
    return TempoFireResponse(quiz_id=quiz_id, fired=True, message="Broadcast tempo:fire to all /quiz-room clients")
