from datetime import datetime
from typing import Any

from pydantic import BaseModel


class MaterialResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    course_id: int
    type: str
    filename: str
    processing_status: str
    metadata: dict[str, Any]
    created_at: datetime
