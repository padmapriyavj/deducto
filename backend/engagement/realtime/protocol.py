"""
Socket.IO contract for namespace ``/quiz-room`` (PRD §8.4).

All payloads are JSON-serializable objects. Event names use ``colon`` namespacing
for clarity in client code (``room:join``, ``quiz:answer``, …).
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

# --- Namespace & event names (single source of truth for UI + docs) ---

NAMESPACE = "/quiz-room"

SOCKETIO_PATH = "socket.io"


class ClientEvent(str, Enum):
    """Client → server (emit)."""

    ROOM_JOIN = "room:join"
    QUIZ_START = "quiz:start"
    QUIZ_ANSWER = "quiz:answer"
    ROOM_LEAVE = "room:leave"


class ServerEvent(str, Enum):
    """Server → client (on / emit)."""

    ROOM_STATE = "room:state"
    ROOM_ERROR = "room:error"
    QUIZ_QUESTION = "quiz:question"
    QUIZ_PEER_ANSWERED = "quiz:peer_answered"
    QUIZ_NEXT = "quiz:next"
    QUIZ_COMPLETE = "quiz:complete"
    TEMPO_FIRE = "tempo:fire"


RoomStatus = Literal["waiting", "active", "completed"]
"""waiting: lobby; active: questions in progress; completed: quiz finished."""

RoomMode = Literal["practice", "tempo", "duel"]
"""
practice — solo study (maps to DB attempt mode ``solo``).
tempo — timed class/session quiz.
duel — head-to-head (2 players).
"""


class RoomJoinPayload(BaseModel):
    """``room:join`` — ``user_id`` comes from the Socket.IO connection ``auth`` only (not this body)."""

    room_id: str = Field(min_length=1, max_length=128)
    quiz_id: str
    mode: RoomMode
    attempt_id: str | None = None
    display_name: str | None = Field(default=None, max_length=100)


class QuizStartPayload(BaseModel):
    """``quiz:start`` — host starts the run (practice may auto-start on join)."""

    room_id: str = Field(min_length=1, max_length=128)


class QuizAnswerPayload(BaseModel):
    """``quiz:answer`` — one submission per question per user."""

    question_id: str
    selected_choice: str = Field(min_length=1, max_length=16)
    time_taken_ms: int = Field(ge=0, le=3_600_000)


class RoomLeavePayload(BaseModel):
    room_id: str = Field(min_length=1, max_length=128)


# --- Server payloads ---


class ParticipantView(BaseModel):
    user_id: str
    display_name: str


class RoomStatePayload(BaseModel):
    """``room:state`` — full lobby / run snapshot for UI."""

    room_id: str
    quiz_id: str
    mode: RoomMode
    status: RoomStatus
    participants: list[ParticipantView]
    current_question_index: int | None = Field(
        description="0-based; null until first question is shown."
    )
    total_questions: int
    started_at: str | None = None
    time_limit_sec: int | None = Field(
        default=None,
        description="Per-question budget for tempo; null for practice/duel if untimed.",
    )
    time_remaining_ms: int | None = Field(
        default=None,
        description="Server hint for countdown UI; may be null between questions.",
    )


class RoomErrorPayload(BaseModel):
    """``room:error`` — recoverable protocol errors."""

    code: str
    message: str
    detail: dict[str, Any] | None = None


class QuestionPublic(BaseModel):
    """Question shown to clients — never includes ``correct_choice``."""

    question_id: str
    question_index: int
    total_questions: int
    text: str
    choices: list[dict[str, Any]]
    question_order: int


class QuizQuestionPayload(BaseModel):
    """``quiz:question`` — current question body."""

    room_id: str
    question: QuestionPublic


class QuizPeerAnsweredPayload(BaseModel):
    """``quiz:peer_answered`` — opponent activity (duel); no choice leaked."""

    room_id: str
    question_index: int
    peer_user_id: str


class QuizNextPayload(BaseModel):
    """``quiz:next`` — lightweight transition tick for animations."""

    room_id: str
    previous_index: int | None
    next_index: int


class QuizCompleteSummary(BaseModel):
    correct_count: int
    total_questions: int
    score_pct: float


class QuizCompletePayload(BaseModel):
    """``quiz:complete`` — run ended; persist score via REST ``POST .../quiz-attempts/{id}/score``."""

    room_id: str
    quiz_id: str
    attempt_id: str | None
    mode: RoomMode
    summary: QuizCompleteSummary
    hint: str = Field(
        default="Finalize coins with POST /api/v1/quiz-attempts/{attempt_id}/score",
    )


class TempoFirePayload(BaseModel):
    """``tempo:fire`` — scheduled Tempo went live; join with ``room:join`` using ``realtime_room_id`` = ``tempo:{quiz_id}``."""

    quiz_id: str
    course_id: str
    scheduled_at: str | None = None


def protocol_contract() -> dict[str, Any]:
    """Machine-readable API description for frontend code generation and docs."""

    return {
        "namespace": NAMESPACE,
        "socketio_path": f"/{SOCKETIO_PATH}/",
        "connection": {
            "auth": {
                "token": "JWT access token (preferred); validated server-side.",
                "user_id": "Fallback identity string for dev only (not validated).",
            },
            "query": {
                "user_id": "Fallback for clients that cannot set auth (dev only).",
            },
        },
        "client_events": {e.name: e.value for e in ClientEvent},
        "server_events": {e.name: e.value for e in ServerEvent},
        "models": {
            "RoomJoinPayload": RoomJoinPayload.model_json_schema(),
            "QuizStartPayload": QuizStartPayload.model_json_schema(),
            "QuizAnswerPayload": QuizAnswerPayload.model_json_schema(),
            "RoomStatePayload": RoomStatePayload.model_json_schema(),
            "RoomErrorPayload": RoomErrorPayload.model_json_schema(),
            "QuizQuestionPayload": QuizQuestionPayload.model_json_schema(),
            "QuizPeerAnsweredPayload": QuizPeerAnsweredPayload.model_json_schema(),
            "QuizNextPayload": QuizNextPayload.model_json_schema(),
            "QuizCompletePayload": QuizCompletePayload.model_json_schema(),
            "TempoFirePayload": TempoFirePayload.model_json_schema(),
        },
    }
