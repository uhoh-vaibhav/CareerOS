from pydantic import BaseModel, Field
from typing import Dict

class ResumeParseRequest(BaseModel):
    resume_text: str = Field(..., description='Raw extracted text from the uploaded resume file')


class ResumeScoreDetail(BaseModel):
    score: int
    max_score: int
    reason: str


class ResumeCandidateProfile(BaseModel):
    recruiter_first_impression: str
    strongest_areas: list[str]


class ResumeImprovement(BaseModel):
    priority: int
    issue: str
    why_it_matters: str
    recommended_action: str


class ResumeRecruiterVerdict(BaseModel):
    shortlist_readiness: str
    reason: str


class ResumeAnalysis(BaseModel):
    ats_score: int
    score_label: str
    analysis_confidence: str
    candidate_profile: ResumeCandidateProfile
    section_scores: Dict[str, ResumeScoreDetail]
    top_improvements: list[ResumeImprovement]
    strengths: list[str]
    weaknesses: list[str]
    recruiter_verdict: ResumeRecruiterVerdict


class ResumeParseResponse(BaseModel):
    raw_json: ResumeAnalysis
    skills: list[str]
    ats_score: int
    ats_breakdown: dict[str, int]
    feedback: str
