"""Quiz KB context: delegates to ``intelligence.ingestion`` (materials-only, no chunk table)."""

from __future__ import annotations

from intelligence.ingestion.context import assemble_text_for_lesson_ids


def load_chunk_text_for_lessons(lesson_ids: list[int], max_chars: int = 120_000) -> str:
    """Concatenate LLM context for lessons (same policy as ingestion)."""
    return assemble_text_for_lesson_ids(lesson_ids, max_chars=max_chars)
