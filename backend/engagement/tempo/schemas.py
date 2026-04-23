from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleTempoBody(BaseModel):
    """Set or update fire time for an existing tempo quiz (professor)."""

    quiz_id: int
    scheduled_at: datetime = Field(description="UTC instant when the Tempo should go live.")


class TempoJoinResponse(BaseModel):
    quiz_id: int
    realtime_room_id: str
    mode: str = "tempo"
    hint: str = "Join Socket.IO namespace /quiz-room with room:join using realtime_room_id."


class TempoFireResponse(BaseModel):
    quiz_id: int
    fired: bool
    message: str = ""
