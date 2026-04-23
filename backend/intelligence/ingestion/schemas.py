"""HTTP response models for ingestion context endpoints."""

from pydantic import BaseModel, Field


class LessonContextResponse(BaseModel):
    lesson_id: int
    text: str
    char_count: int = Field(description="Length of returned text")
    truncated: bool = False


class MaterialContextResponse(BaseModel):
    material_id: int
    text: str
    char_count: int
    truncated: bool = False
