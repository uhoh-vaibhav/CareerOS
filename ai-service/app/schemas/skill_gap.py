from pydantic import BaseModel
from typing import Any

class SkillGapRequest(BaseModel):
    profile_id: str
    current_skills: list[str]
    target_role: str

class SkillGapResponse(BaseModel):
    raw_json: Any
    missing_skills: list[str]
    roadmap: str
