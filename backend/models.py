# backend/models.py
from pydantic import BaseModel
from typing import Optional

class AssessmentCardResponse(BaseModel):
    id: int
    prompt_text: str
    primary_trait: str
    image_url: Optional[str] = None

    class Config:
        from_attributes = True