"""Unit tests for engagement scoring rules (PRD §7.9)."""

from engagement.scoring.rules import (
    PRACTICE_COINS_PER_CORRECT,
    TEMPO_BASE_PER_CORRECT,
    compute_base_coins,
    duel_outcome_coins,
    tempo_time_bonus_coins,
)


def test_practice_base_coins() -> None:
    graded = [(True, 0), (True, 0), (False, 0)]
    q = {"config": {"time_per_question": 60}, "duration_sec": 120}
    assert compute_base_coins(quiz_type="practice", quiz=q, graded=graded) == 2 * PRACTICE_COINS_PER_CORRECT


def test_tempo_includes_time_bonus() -> None:
    budget_ms = 60_000
    fast_bonus = tempo_time_bonus_coins(0, budget_ms)
    slow_bonus = tempo_time_bonus_coins(59_999, budget_ms)
    assert fast_bonus == 50
    assert slow_bonus == 0

    graded = [(True, 0), (True, 30_000)]
    q = {"config": {"time_per_question": 60}}
    total = compute_base_coins(quiz_type="tempo", quiz=q, graded=graded)
    b0 = TEMPO_BASE_PER_CORRECT + fast_bonus
    b1 = TEMPO_BASE_PER_CORRECT + tempo_time_bonus_coins(30_000, budget_ms)
    assert total == b0 + b1


def test_tempo_wrong_zero() -> None:
    graded = [(False, 0), (False, 0)]
    q = {"config": {"time_per_question": 60}}
    assert compute_base_coins(quiz_type="tempo", quiz=q, graded=graded) == 0


def test_duel_outcome() -> None:
    assert duel_outcome_coins(won=True, opponent_ante=50) == 150
    assert duel_outcome_coins(won=False) == 20


def test_graded_order_matches_questions_in_compute() -> None:
    """Sanity: two correct practice answers."""
    graded = [(True, 100), (True, 200)]
    q = {"config": {}}
    assert compute_base_coins(quiz_type="practice", quiz=q, graded=graded) == 20
