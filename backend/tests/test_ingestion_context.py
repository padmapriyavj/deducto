"""Unit tests for ingestion text extraction (no DB)."""

from intelligence.ingestion.context import extract_text_from_material_row


def test_extract_prefers_metadata_full_text() -> None:
    row = {"file_metadata": {"full_text": "Hello from PDF", "other": 1}}
    assert extract_text_from_material_row(row) == "Hello from PDF"


def test_extract_top_level_text_first() -> None:
    row = {"text": "Column", "file_metadata": {"full_text": "Meta"}}
    assert extract_text_from_material_row(row) == "Column"
