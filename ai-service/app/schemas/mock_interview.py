from pydantic import BaseModel

class MockInterviewGenerateRequest(BaseModel):
    target_role: str
    student_context: str | None = None

class MockInterviewGenerateResponse(BaseModel):
    questions: list[str]

class QuestionAnswer(BaseModel):
    question: str
    answer: str

class MockInterviewEvaluateRequest(BaseModel):
    target_role: str
    qa_pairs: list[QuestionAnswer]

class MockInterviewEvaluateResponse(BaseModel):
    score: int
    feedback: str
    confidence_score: int | None = None
    communication_feedback: str | None = None
