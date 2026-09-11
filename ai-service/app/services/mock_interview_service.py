from fastapi import HTTPException
import json
from app.adapters.llm.factory import get_llm_provider
from app.schemas.mock_interview import MockInterviewGenerateRequest, MockInterviewGenerateResponse, QuestionAnswer, MockInterviewEvaluateRequest, MockInterviewEvaluateResponse
from app.prompts.mock_interview_prompt import GENERATE_SYSTEM_PROMPT, EVALUATE_SYSTEM_PROMPT





async def generate_questions(target_role: str, student_context: str | None = None) -> MockInterviewGenerateResponse:
    llm = get_llm_provider()
    prompt = f"Target Role: {target_role}"
    if student_context:
        prompt += f"\nStudent Context: {student_context}"
    
    try:
        raw_response = await llm.generate(prompt, system=GENERATE_SYSTEM_PROMPT)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"LLM generation failed: {e}")
        raise HTTPException(status_code=502, detail="AI analysis is temporarily unavailable.")
    
    try:
        cleaned = raw_response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
        data = json.loads(cleaned)
        return MockInterviewGenerateResponse(questions=data.get("questions", []))
    except Exception:
        return MockInterviewGenerateResponse(questions=["Could not generate questions. Please try again."])

async def evaluate_answers(target_role: str, qa_pairs: list[QuestionAnswer]) -> MockInterviewEvaluateResponse:
    llm = get_llm_provider()
    
    content = f"Target Role: {target_role}\n\n"
    for i, qa in enumerate(qa_pairs, 1):
        content += f"Q{i}: {qa.question}\nA{i}: {qa.answer}\n\n"
        
    try:
        raw_response = await llm.generate(content, system=EVALUATE_SYSTEM_PROMPT)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"LLM generation failed: {e}")
        raise HTTPException(status_code=502, detail="AI analysis is temporarily unavailable.")
        
    try:
        cleaned = raw_response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
        data = json.loads(cleaned)
        return MockInterviewEvaluateResponse(
            score=data.get("score", 50),
            confidence_score=data.get("confidence_score", None),
            communication_feedback=data.get("communication_feedback", None),
            feedback=data.get("feedback", "No feedback provided.")
        )
    except Exception:
        return MockInterviewEvaluateResponse(score=50, feedback="Failed to parse AI evaluation.")
