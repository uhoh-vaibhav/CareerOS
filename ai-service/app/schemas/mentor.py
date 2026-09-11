from pydantic import BaseModel
from typing import Any, Dict, Optional

class MentorMessageRequest(BaseModel):
    profile_id: str
    message: str
    career_context: Optional[Dict[str, Any]] = None

class MentorMessageResponse(BaseModel):
    reply: str
    retrieved_context: list[str]
