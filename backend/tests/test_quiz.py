"""Quiz module unit tests (validate + schema; OpenAI mocked)."""

from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from intelligence.quiz.openai_client import generate_mcq_batch
from intelligence.quiz.schemas import (
    ChoiceItem,
    ConceptWeight,
    DifficultyWeights,
    QuestionDraft,
    QuizGenerationConfig,
)
from intelligence.quiz.validate import validate_quiz_data


def test_quiz_generation_config_weights() -> None:
    lid = 9
    cid = 1
    cfg = QuizGenerationConfig(
        lesson_ids=[lid],
        concepts=[ConceptWeight(concept_id=cid, weight=Decimal("100"))],
        difficulty_weights=DifficultyWeights(
            easy=Decimal("34"), medium=Decimal("33"), hard=Decimal("33")
        ),
        num_questions=3,
        time_per_question=60,
    )
    assert cfg.num_questions == 3


def test_validate_quiz_data_wrong_count() -> None:
    lid = 9
    cid = 1
    cfg = QuizGenerationConfig(
        lesson_ids=[lid],
        concepts=[ConceptWeight(concept_id=cid, weight=Decimal("100"))],
        difficulty_weights=DifficultyWeights(
            easy=Decimal("34"), medium=Decimal("33"), hard=Decimal("33")
        ),
        num_questions=3,
        time_per_question=60,
    )
    quiz = {"config": cfg.model_dump(mode="json")}
    errs = validate_quiz_data(quiz, [])
    assert errs and "3 questions" in errs[0]


def test_generate_mcq_batch_mocked() -> None:
    cid = "7"
    fake_json = (
        '{"questions":[{"text":"Q1","choices":['
        '{"key":"A","text":"a"},{"key":"B","text":"b"},{"key":"C","text":"c"},{"key":"D","text":"d"}],'
        f'"correct_choice":"A","concept_id":"{cid}","difficulty":"easy"}}]}}'
    )
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content=fake_json))]
    with patch("intelligence.quiz.openai_client._client") as mc:
        client_inst = MagicMock()
        mc.return_value = client_inst
        client_inst.chat.completions.create.return_value = mock_resp
        drafts = generate_mcq_batch(
            context_text="ctx",
            concept_specs=[{"id": cid, "name": "C1", "description": "d"}],
            allocations=[(cid, "easy")],
        )
    assert len(drafts) == 1
    assert drafts[0].correct_choice == "A"
    assert drafts[0].concept_id == 7


def test_question_draft_choice_keys() -> None:
    cid = 42
    q = QuestionDraft(
        text="t",
        choices=[
            ChoiceItem(key="A", text="a"),
            ChoiceItem(key="B", text="b"),
            ChoiceItem(key="C", text="c"),
            ChoiceItem(key="D", text="d"),
        ],
        correct_choice="B",
        concept_id=cid,
        difficulty="medium",
    )
    assert {c.key for c in q.choices} == {"A", "B", "C", "D"}
