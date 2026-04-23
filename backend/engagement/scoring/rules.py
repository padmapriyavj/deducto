"""PRD §7.9 base coin rules: Tempo (50 + time bonus) vs Practice (10 per correct); duel hooks."""

from __future__ import annotations

from typing import Any

# PRD §7.9
TEMPO_BASE_PER_CORRECT = 50
TEMPO_TIME_BONUS_MAX = 50
PRACTICE_COINS_PER_CORRECT = 10

# Duel (finalize from duel module later)
DUEL_WIN_BASE = 100
DUEL_LOSS_CONSOLATION = 20


def _time_budget_ms_from_quiz(quiz: dict[str, Any]) -> int:
    """Prefer config.time_per_question (seconds); else duration_sec / max(n,1)."""
    cfg = quiz.get("config") or {}
    if isinstance(cfg, dict):
        tpq = cfg.get("time_per_question")
        if isinstance(tpq, (int, float)) and tpq > 0:
            return int(tpq * 1000)
    dur = quiz.get("duration_sec")
    # fallback 60s per question if we cannot infer
    if isinstance(dur, (int, float)) and dur > 0:
        # without question count here, use duration as total session cap is weak; use 60s
        return 60_000
    return 60_000


def tempo_time_bonus_coins(time_taken_ms: int, time_budget_ms: int) -> int:
    """
    0–50 coins per PRD: faster answers within the budget earn more.
    Linear decay: full bonus at 0ms, zero at or beyond budget.
    """
    if time_budget_ms <= 0:
        return 0
    t = max(0, int(time_taken_ms))
    if t >= time_budget_ms:
        return 0
    ratio = 1.0 - (t / float(time_budget_ms))
    return int(TEMPO_TIME_BONUS_MAX * ratio)


def compute_base_coins(
    *,
    quiz_type: str,
    quiz: dict[str, Any],
    graded: list[tuple[bool, int]],
) -> int:
    """
    ``graded`` is (is_correct, time_taken_ms) per question in submission order.

    Tempo wrong: 0 for that item. Practice wrong: 0.
    """
    qtype = (quiz_type or "practice").lower()
    budget_ms = _time_budget_ms_from_quiz(quiz)

    if qtype == "tempo":
        total = 0
        for ok, t_ms in graded:
            if not ok:
                continue
            total += TEMPO_BASE_PER_CORRECT + tempo_time_bonus_coins(t_ms, budget_ms)
        return total

    if qtype == "practice":
        return sum(PRACTICE_COINS_PER_CORRECT for ok, _ in graded if ok)

    # unknown type: treat as practice
    return sum(PRACTICE_COINS_PER_CORRECT for ok, _ in graded if ok)


def duel_outcome_coins(*, won: bool, opponent_ante: int = 0) -> int:
    """PRD §7.9 duel win / loss (called from duel finalize, not standard quiz score)."""
    if won:
        return DUEL_WIN_BASE + max(0, opponent_ante)
    return DUEL_LOSS_CONSOLATION
