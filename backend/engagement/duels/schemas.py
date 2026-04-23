from __future__ import annotations

from pydantic import BaseModel, Field


class DuelCreateBody(BaseModel):
    """Create a duel lobby for a published quiz (typically ``type=practice``)."""

    quiz_id: int


class DuelCreateResponse(BaseModel):
    room_id: str
    quiz_id: int
    status: str
    realtime: dict = Field(
        default_factory=lambda: {
            "namespace": "/quiz-room",
            "mode": "duel",
            "instructions": "Emit room:join with room_id, quiz_id, mode=duel; then quiz:start when 2 players ready.",
        }
    )


class DuelRoomInfoResponse(BaseModel):
    """Public metadata for a duel lobby (for invite-link hydration)."""

    room_id: str
    quiz_id: int
    status: str


class DuelJoinResponse(BaseModel):
    room_id: str
    quiz_id: int
    ok: bool = True


class DuelAttemptResponse(BaseModel):
    attempt_id: int
    room_id: str
    quiz_id: int


class DuelSettleBody(BaseModel):
    attempt_a: int
    attempt_b: int
    opponent_ante: int = Field(default=0, ge=0, le=10_000)


class DuelSettleResponse(BaseModel):
    winner_user_id: int
    loser_user_id: int
    winner_duel_coins: int
    loser_duel_coins: int
    settled: bool = True
