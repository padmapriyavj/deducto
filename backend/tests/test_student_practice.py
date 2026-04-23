"""Unit tests for student practice quiz start (no Supabase)."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from intelligence.quiz.student_practice import start_student_practice_quiz


@patch("intelligence.quiz.student_practice.insert_quiz_attempt_stub", return_value=42)
@patch("intelligence.quiz.student_practice.update_quiz_status")
@patch("intelligence.quiz.student_practice.update_question_row")
@patch("intelligence.quiz.student_practice.validate_quiz", return_value=[])
@patch(
    "intelligence.quiz.student_practice.list_questions",
    return_value=[{"id": 9}, {"id": 10}],
)
@patch(
    "intelligence.quiz.student_practice.get_quiz_row",
    return_value={"created_by": 5, "type": "practice", "status": "draft"},
)
def test_start_student_practice_ok(
    _mock_get: object,
    _mock_list: object,
    _mock_validate: object,
    _mock_update_q: object,
    _mock_update_quiz: object,
    _mock_insert: object,
) -> None:
    out = start_student_practice_quiz(100, 5)
    assert out == {"quiz_id": 100, "attempt_id": 42}


def test_start_student_practice_wrong_owner() -> None:
    with patch(
        "intelligence.quiz.student_practice.get_quiz_row",
        return_value={"created_by": 1, "type": "practice", "status": "draft"},
    ):
        with pytest.raises(ValueError, match="author"):
            start_student_practice_quiz(1, 99)


def test_start_student_practice_wrong_type() -> None:
    with patch(
        "intelligence.quiz.student_practice.get_quiz_row",
        return_value={"created_by": 7, "type": "tempo", "status": "draft"},
    ):
        with pytest.raises(ValueError, match="practice"):
            start_student_practice_quiz(2, 7)
