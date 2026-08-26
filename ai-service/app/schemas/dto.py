from pydantic import BaseModel, Field


class ResumeParseRequest(BaseModel):
    resume_text: str = Field(..., description="Raw extracted text from the uploaded resume file")


class ResumeParseResponse(BaseModel):
    skills: list[str]
    ats_score: int
    feedback: str


class SkillGapRequest(BaseModel):
    profile_id: str
    current_skills: list[str]
    target_role: str


class SkillGapResponse(BaseModel):
    missing_skills: list[str]
    roadmap: str


class MentorMessageRequest(BaseModel):
    profile_id: str
    message: str


class MentorMessageResponse(BaseModel):
    reply: str
    retrieved_context: list[str]
