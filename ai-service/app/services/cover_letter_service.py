from fastapi import HTTPException
import json
from app.adapters.llm.factory import get_llm_provider
from app.schemas.cover_letter import CoverLetterGenerateRequest, CoverLetterGenerateResponse
from app.prompts.cover_letter_prompt import SYSTEM_PROMPT



async def generate_cover_letter(job_description: str, student_context: str) -> CoverLetterGenerateResponse:
    llm = get_llm_provider()
    content = f"Job Description:\n{job_description}\n\nStudent Context:\n{student_context}"
    
    try:
        raw_response = await llm.generate(content, system=SYSTEM_PROMPT)
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
        return CoverLetterGenerateResponse(cover_letter=data.get("cover_letter", "Could not generate cover letter."))
    except Exception:
        return CoverLetterGenerateResponse(cover_letter="Failed to parse AI evaluation.\n\nRaw output:\n" + raw_response)
