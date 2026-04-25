"""score_attempt — grade answers, coins, Betcha (PRD §7.6–§7.7), streak (§7.10), mastery."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from engagement.scoring.mastery import apply_mastery_for_attempt
from engagement.scoring.rules import compute_base_coins
from engagement.scoring.streak import apply_streak_after_quiz_completion, read_streak_snapshot
from intelligence.betcha.service import apply_betcha_resolution_to_attempt
from intelligence.quiz.repository import (
    attempt_has_answers,
    get_attempt_row,
    get_quiz_row,
    get_user_coins,
    insert_answers,
    list_answers_for_attempt,
    list_questions,
    mark_attempt_completed,
    update_attempt_scores,
    update_user_coins,
)
from intelligence.quiz.schemas import AnswerInput, ScoreAttemptResult


def _score_result_from_completed_attempt(
    *,
    quiz_id: int,
    attempt_id: int,
    user_id: int,
    attempt: dict[str, Any],
) -> ScoreAttemptResult:
    """Idempotent: attempt already has ``completed_at``; return stored score without double-applying."""
    questions = list_questions(quiz_id)
    answers = list_answers_for_attempt(attempt_id)
    correct = sum(1 for a in answers if a.get("is_correct"))
    total = len(questions) if questions else max(len(answers), 1)
    if total < 1:
        total = 1
    if answers or questions:
        score_pct = (Decimal(correct) / Decimal(total) * Decimal("100")).quantize(Decimal("0.01"))
    else:
        score_pct = Decimal(str(attempt.get("score_pct") or "0"))
    coins_earned = int(attempt.get("coins_earned") or 0)
    try:
        streak = read_streak_snapshot(user_id)
    except ValueError:
        streak = None
    return ScoreAttemptResult(
        quiz_id=quiz_id,
        attempt_id=attempt_id,
        score_pct=score_pct,
        correct_count=correct,
        total_questions=total,
        base_coins=coins_earned,
        payout_coins=coins_earned,
        betcha_effective_factor=None,
        betcha_applied=False,
        current_streak=streak.current_streak if streak is not None else None,
        streak_milestone_bonus_coins=0,
        streak_already_active_today=streak.already_active_today if streak is not None else False,
    )


def score_attempt(
    *,
    quiz_id: int,
    attempt_id: int,
    user_id: int,
    answers: list[AnswerInput],
) -> ScoreAttemptResult:
    """
    Persist answers, compute score, apply Betcha payout when a wager exists.
    Updates streak (UTC) and optional ``user_concept_mastery`` once per successful finalize.
    """
    quiz = get_quiz_row(quiz_id)
    attempt = get_attempt_row(attempt_id)

    att_uid = attempt.get("user_id")
    if att_uid is None or int(att_uid) != int(user_id):
        raise ValueError("Attempt does not belong to user")
    if int(attempt.get("quiz_id")) != int(quiz_id):
        raise ValueError("Attempt does not match quiz")
    if attempt.get("completed_at"):
        return _score_result_from_completed_attempt(
            quiz_id=quiz_id, attempt_id=attempt_id, user_id=user_id, attempt=attempt
        )
    if attempt_has_answers(attempt_id):
        raise ValueError("Attempt already has submitted answers")

    questions = list_questions(quiz_id)
    qmap: dict[str, dict[str, Any]] = {str(q["id"]): q for q in questions}
    total = len(questions)
    if total == 0:
        raise ValueError("Quiz has no questions")
    if {str(a.question_id) for a in answers} != set(qmap.keys()):
        raise ValueError("Must submit exactly one answer per question")

    ordered = sorted(questions, key=lambda q: int(q.get("question_order") or 0))
    rows: list[dict[str, Any]] = []
    graded: list[tuple[bool, int]] = []
    concept_results: list[tuple[int, bool]] = []

    for q in ordered:
        qid = str(q["id"])
        a = next((x for x in answers if str(x.question_id) == qid), None)
        if a is None:
            raise ValueError(f"Missing answer for question {qid}")
        ok = str(q.get("correct_choice") or "").upper() == str(a.selected_choice).upper()
        graded.append((ok, a.time_taken_ms))
        cid_raw = q.get("concept_id")
        if cid_raw is not None and cid_raw != "":
            concept_results.append((int(cid_raw), ok))
        rows.append(
            {
                "question_id": int(q["id"]),
                "selected_choice": a.selected_choice,
                "is_correct": ok,
                "time_taken_ms": a.time_taken_ms,
            }
        )

    insert_answers(attempt_id, rows)

    correct = sum(1 for ok, _ in graded if ok)
    score_pct = (Decimal(correct) / Decimal(total) * Decimal("100")).quantize(Decimal("0.01"))
    qtype = str(quiz.get("type") or "practice")
    attempt_mode = str(attempt.get("mode") or "solo")
    # Duel: per-question practice/tempo coins are replaced by win/loss settlement (engagement.duels).
    if attempt_mode == "duel":
        base_coins = 0
    else:
        base_coins = compute_base_coins(quiz_type=qtype, quiz=quiz, graded=graded)

    resolution = apply_betcha_resolution_to_attempt(
        user_id=user_id,
        attempt_id=attempt_id,
        score_percent=score_pct,
        base_coins=base_coins,
    )

    payout: int
    betcha_applied = False
    eff: int | None = None

    if resolution is None:
        new_bal = get_user_coins(user_id) + base_coins
        update_user_coins(user_id, new_bal)
        update_attempt_scores(attempt_id, score_pct=score_pct, coins_earned=base_coins, completed=True)
        payout = base_coins
    else:
        betcha_applied = True
        eff = resolution.effective_factor
        payout = resolution.payout_coins
        mark_attempt_completed(attempt_id)

    streak = apply_streak_after_quiz_completion(user_id)
    apply_mastery_for_attempt(user_id, concept_results)

    return ScoreAttemptResult(
        quiz_id=quiz_id,
        attempt_id=attempt_id,
        score_pct=score_pct,
        correct_count=correct,
        total_questions=total,
        base_coins=base_coins,
        payout_coins=payout,
        betcha_effective_factor=eff,
        betcha_applied=betcha_applied,
        current_streak=streak.current_streak,
        streak_milestone_bonus_coins=streak.milestone_bonus_coins,
        streak_already_active_today=streak.already_active_today,
    )
