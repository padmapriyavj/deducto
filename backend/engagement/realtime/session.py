"""In-memory quiz room session (Redis-ready shape; dev uses process-local dict)."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from engagement.realtime.policy import ModePolicy, policy_for_mode, time_limit_sec_for_question
from engagement.realtime.protocol import (
    ParticipantView,
    QuestionPublic,
    QuizCompletePayload,
    QuizCompleteSummary,
    QuizNextPayload,
    QuizPeerAnsweredPayload,
    QuizQuestionPayload,
    RoomMode,
    RoomStatePayload,
    RoomStatus,
)


def strip_question_for_client(q: dict[str, Any], index: int, total: int) -> QuestionPublic:
    return QuestionPublic(
        question_id=str(q["id"]),
        question_index=index,
        total_questions=total,
        text=str(q.get("text") or ""),
        choices=list(q.get("choices") or []),
        question_order=int(q.get("question_order") or index),
    )


@dataclass
class Participant:
    user_id: str
    display_name: str
    sid: str


@dataclass
class QuizRoomSession:
    room_id: str
    quiz_id: str
    mode: RoomMode
    policy: ModePolicy
    quiz_row: dict[str, Any]
    questions: list[dict[str, Any]]
    participants: dict[str, Participant] = field(default_factory=dict)
    attempt_by_user: dict[str, str] = field(default_factory=dict)
    status: RoomStatus = "waiting"
    current_index: int | None = None
    started_at: str | None = None
    # user_id -> question_id -> {selected_choice, time_taken_ms}
    answers: dict[str, dict[str, dict[str, Any]]] = field(default_factory=dict)
    answered_current: set[str] = field(default_factory=set)
    timer_deadline_ts: float | None = None
    _timer_task: asyncio.Task[None] | None = field(default=None, repr=False)

    @classmethod
    def build(
        cls,
        *,
        room_id: str,
        quiz_id: str,
        mode: RoomMode,
        quiz_row: dict[str, Any],
        questions: list[dict[str, Any]],
    ) -> QuizRoomSession:
        pol = policy_for_mode(mode)
        return cls(
            room_id=room_id,
            quiz_id=quiz_id,
            mode=mode,
            policy=pol,
            quiz_row=quiz_row,
            questions=questions,
        )

    def participant_views(self) -> list[ParticipantView]:
        return [
            ParticipantView(user_id=p.user_id, display_name=p.display_name)
            for p in self.participants.values()
        ]

    def time_limit_sec(self) -> int | None:
        if not self.policy.use_question_timer:
            return None
        cfg = self.quiz_row.get("config")
        return time_limit_sec_for_question(cfg if isinstance(cfg, dict) else None)

    def time_remaining_ms(self) -> int | None:
        if self.timer_deadline_ts is None:
            return None
        import time

        left = self.timer_deadline_ts - time.monotonic()
        return max(0, int(left * 1000))

    def question_public_at(self, index: int) -> QuestionPublic:
        return strip_question_for_client(
            self.questions[index], index, len(self.questions)
        )

    def room_state_payload(self) -> RoomStatePayload:
        return RoomStatePayload(
            room_id=self.room_id,
            quiz_id=self.quiz_id,
            mode=self.mode,
            status=self.status,
            participants=self.participant_views(),
            current_question_index=self.current_index,
            total_questions=len(self.questions),
            started_at=self.started_at,
            time_limit_sec=self.time_limit_sec(),
            time_remaining_ms=self.time_remaining_ms(),
        )

    def cancel_timer(self) -> None:
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
        self._timer_task = None
        self.timer_deadline_ts = None

    def compute_summary_for_user(self, user_id: str) -> QuizCompleteSummary:
        total = len(self.questions)
        by_q = self.answers.get(user_id, {})
        correct = 0
        for q in self.questions:
            qid = str(q["id"])
            ans = by_q.get(qid)
            if not ans:
                continue
            if str(ans.get("selected_choice") or "").upper() == str(q.get("correct_choice") or "").upper():
                correct += 1
        score_pct = (
            float((Decimal(correct) / Decimal(total) * Decimal("100")).quantize(Decimal("0.01")))
            if total
            else 0.0
        )
        return QuizCompleteSummary(
            correct_count=correct,
            total_questions=total,
            score_pct=score_pct,
        )

    def complete_payload_for_user(self, user_id: str) -> QuizCompletePayload:
        return QuizCompletePayload(
            room_id=self.room_id,
            quiz_id=self.quiz_id,
            attempt_id=self.attempt_by_user.get(user_id),
            mode=self.mode,
            summary=self.compute_summary_for_user(user_id),
        )


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_attempt_stub(
    *,
    quiz_id: int,
    user_id: int,
    mode: RoomMode,
    room_id: str | None = None,
) -> int:
    from intelligence.quiz.repository import insert_quiz_attempt_stub

    return insert_quiz_attempt_stub(
        quiz_id=quiz_id,
        user_id=user_id,
        mode=policy_for_mode(mode).attempt_mode_db,
        room_id=room_id,
    )
