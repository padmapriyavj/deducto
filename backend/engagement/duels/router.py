"""Duel HTTP API (PRD §9 ``duel_rooms`` + PERSON_B §6)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from engagement.duels.schemas import (
    DuelAttemptResponse,
    DuelCreateBody,
    DuelCreateResponse,
    DuelJoinResponse,
    DuelRoomInfoResponse,
    DuelSettleBody,
    DuelSettleResponse,
)
from engagement.duels import repository as duel_repo
from engagement.duels import service as duel_service
from intelligence.betcha.deps import get_current_user_id

router = APIRouter(prefix="/duels", tags=["Duels"])


@router.post("", response_model=DuelCreateResponse)
async def post_create_duel(
    body: DuelCreateBody,
    user_id: int = Depends(get_current_user_id),
) -> DuelCreateResponse:
    try:
        out = duel_service.create_duel(quiz_id=body.quiz_id, host_user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return DuelCreateResponse(room_id=out["room_id"], quiz_id=out["quiz_id"], status=out["status"])


@router.get("/{room_id}", response_model=DuelRoomInfoResponse)
async def get_duel_room(room_id: str, user_id: int = Depends(get_current_user_id)) -> DuelRoomInfoResponse:
    """Return quiz id + status so invite links can hydrate the quiz runner without React location state."""
    _ = user_id
    row = duel_repo.get_duel_room(room_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duel room not found")
    return DuelRoomInfoResponse(
        room_id=room_id,
        quiz_id=int(row["quiz_id"]),
        status=str(row.get("status") or "waiting"),
    )


@router.post("/{room_id}/join", response_model=DuelJoinResponse)
async def post_join_duel(
    room_id: str,
    user_id: int = Depends(get_current_user_id),
) -> DuelJoinResponse:
    try:
        out = duel_service.join_duel(room_id=room_id, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return DuelJoinResponse(room_id=out["room_id"], quiz_id=out["quiz_id"], ok=out["ok"])


@router.post("/{room_id}/attempts", response_model=DuelAttemptResponse)
async def post_duel_attempt(
    room_id: str,
    user_id: int = Depends(get_current_user_id),
) -> DuelAttemptResponse:
    try:
        aid, qid = duel_service.create_duel_attempt(room_id=room_id, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return DuelAttemptResponse(attempt_id=aid, room_id=room_id, quiz_id=qid)


@router.post("/{room_id}/mark-active", status_code=status.HTTP_204_NO_CONTENT)
async def post_mark_active(room_id: str) -> None:
    try:
        duel_service.mark_duel_active(room_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/{room_id}/settle", response_model=DuelSettleResponse)
async def post_settle_duel(
    room_id: str,
    body: DuelSettleBody,
    user_id: int = Depends(get_current_user_id),
) -> DuelSettleResponse:
    try:
        out = duel_service.settle_duel(
            room_id=room_id,
            attempt_a=body.attempt_a,
            attempt_b=body.attempt_b,
            opponent_ante=body.opponent_ante,
            acting_user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return DuelSettleResponse(
        winner_user_id=out["winner_user_id"],
        loser_user_id=out["loser_user_id"],
        winner_duel_coins=out["winner_duel_coins"],
        loser_duel_coins=out["loser_duel_coins"],
    )
