"""Read-only API: assembled lesson/material text for LLM (Person B ingestion)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from intelligence.ingestion.context import get_text_for_lesson, get_text_for_material
from intelligence.ingestion.schemas import LessonContextResponse, MaterialContextResponse

router = APIRouter(prefix="/api/v1", tags=["Ingestion"])


def _is_truncated_marker(text: str) -> bool:
    return text.rstrip().endswith("[truncated]")


@router.get(
    "/lessons/{lesson_id}/context",
    response_model=LessonContextResponse,
    summary="LLM context text for a lesson",
    description="Resolves the lesson to material(s) and returns stored text (materials row / metadata).",
)
async def get_lesson_context(lesson_id: int, max_chars: int = 120_000) -> LessonContextResponse:
    if max_chars < 1 or max_chars > 500_000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="max_chars out of range")
    text = get_text_for_lesson(lesson_id, max_chars=max_chars)
    return LessonContextResponse(
        lesson_id=lesson_id,
        text=text,
        char_count=len(text),
        truncated=_is_truncated_marker(text),
    )


@router.get(
    "/materials/{material_id}/context",
    response_model=MaterialContextResponse,
    summary="LLM context text for a material",
)
async def get_material_context(material_id: int, max_chars: int = 120_000) -> MaterialContextResponse:
    if max_chars < 1 or max_chars > 500_000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="max_chars out of range")
    text = get_text_for_material(material_id, max_chars=max_chars)
    return MaterialContextResponse(
        material_id=material_id,
        text=text,
        char_count=len(text),
        truncated=_is_truncated_marker(text),
    )
