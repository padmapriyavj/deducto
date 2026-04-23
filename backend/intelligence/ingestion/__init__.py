"""Lesson/material text assembly for LLM (no chunk table; materials-only)."""

from intelligence.ingestion.context import (
    assemble_text_for_lesson_ids,
    extract_text_from_material_row,
    get_text_for_lesson,
    get_text_for_material,
)
from intelligence.ingestion.router import router as ingestion_router

__all__ = [
    "assemble_text_for_lesson_ids",
    "extract_text_from_material_row",
    "get_text_for_lesson",
    "get_text_for_material",
    "ingestion_router",
]
