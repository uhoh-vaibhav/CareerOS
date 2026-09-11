from pydantic import BaseModel
from typing import Any, Dict

class StudyMaterialRequest(BaseModel):
    target_role: str
    phase_title: str
    milestone_title: str
    milestone_description: str
    skills: list[str] = []

class StudyMaterialResponse(BaseModel):
    material: Dict[str, Any]
