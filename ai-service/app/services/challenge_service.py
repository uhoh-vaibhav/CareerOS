from fastapi import HTTPException
import json
from app.adapters.llm.factory import get_llm_provider
from app.schemas.challenge import DailyChallengeGenerateRequest, DailyChallengeGenerateResponse, DailyChallengeQuestion
from app.prompts.challenge_prompt import SYSTEM_PROMPT



async def generate_daily_challenge(target_role: str, focus_skills: list[str]) -> DailyChallengeGenerateResponse:
    llm = get_llm_provider()
    skills_str = ", ".join(focus_skills) if focus_skills else "general concepts"
    content = f"Target Role: {target_role}\nFocus Skills: {skills_str}"
    
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
        questions = []
        for q in data.get("questions", []):
            questions.append(DailyChallengeQuestion(**q))
        return DailyChallengeGenerateResponse(questions=questions)
    except Exception as e:
        # Fallback empty structure
        return DailyChallengeGenerateResponse(questions=[])
