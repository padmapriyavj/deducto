"""Finalize quiz attempts: coins, Betcha, streak (UTC), optional concept mastery (PRD §7.9–§7.10)."""

from __future__ import annotations

from intelligence.quiz.schemas import AnswerInput, ScoreAttemptResult
from intelligence.quiz.score_attempt import score_attempt


def finalize_quiz_attempt(
    *,
    quiz_id: int,
    attempt_id: int,
    user_id: int,
    answers: list[AnswerInput],
) -> ScoreAttemptResult:
    """Single entrypoint aligned with product copy: attempt finished → balances and streak."""
    return score_attempt(
        quiz_id=quiz_id,
        attempt_id=attempt_id,
        user_id=user_id,
        answers=answers,
    )
