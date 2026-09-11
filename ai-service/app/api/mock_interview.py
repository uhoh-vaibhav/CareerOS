from fastapi import APIRouter
from app.schemas.mock_interview import *
from app.services.mock_interview_service import generate_questions, evaluate_answers

router = APIRouter(prefix="/mock-interview", tags=["Mock Interview"])

@router.post("/generate", response_model=MockInterviewGenerateResponse)
async def generate(req: MockInterviewGenerateRequest):
    return await generate_questions(req.target_role, req.student_context)

@router.post("/evaluate", response_model=MockInterviewEvaluateResponse)
async def evaluate(req: MockInterviewEvaluateRequest):
    return await evaluate_answers(req.target_role, req.qa_pairs)
