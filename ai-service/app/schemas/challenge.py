from pydantic import BaseModel

class DailyChallengeGenerateRequest(BaseModel):
    target_role: str
    focus_skills: list[str]

class DailyChallengeQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer_index: int
    explanation: str

class DailyChallengeGenerateResponse(BaseModel):
    questions: list[DailyChallengeQuestion]
