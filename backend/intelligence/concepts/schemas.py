"""Pydantic models for concept extraction (PRD concepts + lessons)."""

from pydantic import BaseModel, Field


class ConceptGenerateBody(BaseModel):
    """
    Course context and material reference for LLM extraction.

    ``material_id`` points at ``materials``; the model reads the **excerpt** stored on that row
    (e.g. ``text`` or ``content``, or nested under ``metadata``) — a partial PDF sample, not S3 bytes.
    """

    course_id: int
    title: str = Field(max_length=200, description="Lesson title (stored on lessons row)")
    material_id: int = Field(description="FK to materials; excerpt text lives on the materials row")


class ConceptItem(BaseModel):
    id: int
    lesson_id: int
    name: str
    description: str | None = None


class ConceptGenerateResponse(BaseModel):
    lesson_id: int
    concepts: list[ConceptItem]
    replaced: bool = Field(True, description="Existing concepts for this lesson were replaced")


class ConceptListResponse(BaseModel):
    lesson_id: int
    concepts: list[ConceptItem]
