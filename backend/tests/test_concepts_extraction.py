"""Unit tests for concept extraction JSON parsing (no live API)."""

import json
from unittest.mock import MagicMock, patch

from intelligence.concepts.extraction import extract_concepts_from_text


def test_extract_concepts_from_text_mocked() -> None:
    fake = json.dumps(
        {
            "concepts": [
                {"name": "Recursion", "description": "Functions that call themselves."},
                {"name": "Big-O", "description": "Asymptotic complexity."},
            ]
        }
    )
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content=fake))]
    with patch("intelligence.concepts.extraction._client") as mc:
        client_inst = MagicMock()
        mc.return_value = client_inst
        client_inst.chat.completions.create.return_value = mock_resp
        out = extract_concepts_from_text(
            course_name="CS 101",
            lesson_title="Algorithms",
            material_text="long text here",
        )
    assert len(out) == 2
    assert out[0]["name"] == "Recursion"
