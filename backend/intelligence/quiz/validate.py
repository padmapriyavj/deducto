"""validate_quiz — structural checks before publish (PRD §7.6)."""

from __future__ import annotations

from collections import Counter
from decimal import Decimal
from typing import Any
from intelligence.quiz.repository import get_quiz_row, list_questions
from intelligence.quiz.schemas import QuizGenerationConfig


def validate_quiz(quiz_id: int) -> list[str]:
    """
    Return a list of human-readable errors; empty means valid for publishing
    (still require all questions approved in router).
    """
    errors: list[str] = []
    try:
        quiz = get_quiz_row(quiz_id)
    except Exception:
        return ["Quiz not found"]

    raw_cfg = quiz.get("config")
    if not raw_cfg:
        errors.append("Quiz config snapshot is missing")
        return errors

    try:
        cfg = QuizGenerationConfig.model_validate(raw_cfg)
    except Exception as e:
        return [f"Invalid stored QuizGenerationConfig: {e}"]

    questions = list_questions(quiz_id)
    n = cfg.num_questions

    if len(questions) != n:
        errors.append(f"Expected {n} questions, found {len(questions)}")

    concept_ids_cfg = {str(c.concept_id) for c in cfg.concepts}
    seen_stems: set[str] = set()

    for q in questions:
        stem = (q.get("text") or "").strip()
        if not stem:
            errors.append(f"Question {q.get('question_order')} has empty text")
        if stem in seen_stems:
            errors.append("Duplicate question stem detected")
        seen_stems.add(stem)

        choices = q.get("choices") or []
        if not isinstance(choices, list):
            errors.append(f"Question {q.get('question_order')}: invalid choices shape")
            continue
        keys = []
        for ch in choices:
            if isinstance(ch, dict):
                keys.append(str(ch.get("key", "")).upper())
        if len(set(keys)) != len(keys):
            errors.append(f"Question {q.get('question_order')}: duplicate choice keys")

        cc = str(q.get("correct_choice") or "").upper()
        if cc and cc not in keys:
            errors.append(f"Question {q.get('question_order')}: correct_choice not in choices")

        cid = str(q.get("concept_id") or "")
        if cid and cid not in concept_ids_cfg:
            errors.append(f"Question {q.get('question_order')}: concept_id not in quiz config")

    # Approximate difficulty mix (warn only if far off — optional)
    diff_counts = Counter((q.get("difficulty") or "").lower() for q in questions)
    total = len(questions) or 1
    for label, w in (
        ("easy", cfg.difficulty_weights.easy),
        ("medium", cfg.difficulty_weights.medium),
        ("hard", cfg.difficulty_weights.hard),
    ):
        expected = float(w) / 100.0
        actual = diff_counts.get(label, 0) / total
        if abs(expected - actual) > 0.35 and len(questions) >= 5:
            errors.append(
                f"Difficulty mix for '{label}' differs from config "
                f"(expected ~{expected:.0%}, got {actual:.0%})"
            )

    return errors


def validate_quiz_data(quiz: dict[str, Any], questions: list[dict[str, Any]]) -> list[str]:
    """Pure validation without DB reads (for tests)."""
    if not quiz.get("config"):
        return ["Quiz config snapshot is missing"]
    try:
        cfg = QuizGenerationConfig.model_validate(quiz["config"])
    except Exception as e:
        return [f"Invalid QuizGenerationConfig: {e}"]

    errs: list[str] = []
    if len(questions) != cfg.num_questions:
        errs.append(f"Expected {cfg.num_questions} questions, found {len(questions)}")
    return errs
