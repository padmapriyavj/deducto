"""Unit tests for quiz room session summaries (no Socket.IO)."""

from engagement.realtime.session import QuizRoomSession


def test_compute_summary_for_user() -> None:
    questions = [
        {
            "id": "q1",
            "text": "t",
            "choices": [],
            "correct_choice": "A",
            "question_order": 0,
        },
        {
            "id": "q2",
            "text": "t2",
            "choices": [],
            "correct_choice": "B",
            "question_order": 1,
        },
    ]
    room = QuizRoomSession.build(
        room_id="r1",
        quiz_id="quiz-1",
        mode="practice",
        quiz_row={"config": {"time_per_question": 60}, "status": "published"},
        questions=questions,
    )
    uid = "user-1"
    room.answers[uid] = {
        "q1": {"selected_choice": "A", "time_taken_ms": 100},
        "q2": {"selected_choice": "A", "time_taken_ms": 100},
    }
    s = room.compute_summary_for_user(uid)
    assert s.correct_count == 1
    assert s.total_questions == 2
    assert s.score_pct == 50.0


def test_question_public_excludes_correct() -> None:
    q = {
        "id": "x",
        "text": "hello",
        "choices": [{"key": "A", "text": "a"}],
        "correct_choice": "A",
        "question_order": 0,
    }
    pub = QuizRoomSession.build(
        room_id="r",
        quiz_id="q",
        mode="practice",
        quiz_row={},
        questions=[q],
    ).question_public_at(0)
    d = pub.model_dump()
    assert "correct_choice" not in d
