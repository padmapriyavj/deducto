from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateLessonRequest(BaseModel):
    title: str
    week_number: int


class UpdateLessonRequest(BaseModel):
    title: Optional[str] = None
    week_number: Optional[int] = None


class LessonResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    course_id: int
    title: str
    week_number: int
    material_id: Optional[int]
    created_at: datetime
