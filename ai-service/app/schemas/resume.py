from pydantic import BaseModel, Field
from typing import Any, Dict

class ResumeParseRequest(BaseModel):
    resume_text: str = Field(..., description='Raw extracted text from the uploaded resume file')

class ResumeParseResponse(BaseModel):
    raw_json: Dict[str, Any]
    skills: list[str]
    ats_score: int
    ats_breakdown: dict[str, int]
    feedback: str
