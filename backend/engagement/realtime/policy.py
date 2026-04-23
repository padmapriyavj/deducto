"""Mode-specific rules: who can join, when to advance, peer signals (PRD §8.4)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

RoomModeLiteral = Literal["practice", "tempo", "duel"]


@dataclass(frozen=True)
class ModePolicy:
    """Behavior for practice vs tempo vs duel."""

    attempt_mode_db: str
    max_participants: int
    auto_start_on_join: bool
    emit_peer_answered: bool
    use_question_timer: bool


def policy_for_mode(mode: RoomModeLiteral) -> ModePolicy:
    if mode == "practice":
        return ModePolicy(
            attempt_mode_db="solo",
            max_participants=1,
            auto_start_on_join=True,
            emit_peer_answered=False,
            use_question_timer=False,
        )
    if mode == "tempo":
        return ModePolicy(
            attempt_mode_db="tempo",
            max_participants=64,
            auto_start_on_join=True,
            emit_peer_answered=False,
            use_question_timer=True,
        )
    if mode == "duel":
        return ModePolicy(
            attempt_mode_db="duel",
            max_participants=2,
            auto_start_on_join=False,
            emit_peer_answered=True,
            use_question_timer=False,
        )
    raise ValueError(f"Unknown mode {mode!r}")


def time_limit_sec_for_question(quiz_config: dict | None, fallback: int = 60) -> int:
    """Seconds per question from quiz generation snapshot."""
    if not isinstance(quiz_config, dict):
        return fallback
    tpq = quiz_config.get("time_per_question")
    if isinstance(tpq, (int, float)) and 5 <= tpq <= 600:
        return int(tpq)
    return fallback
