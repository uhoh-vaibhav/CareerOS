from fastapi import APIRouter, HTTPException
from app.schemas.challenge import *
from app.services.challenge_service import generate_daily_challenge

router = APIRouter(prefix="/daily-challenge", tags=["Challenge"])

@router.post("/generate", response_model=DailyChallengeGenerateResponse)
async def generate(req: DailyChallengeGenerateRequest):
    try:
        return await generate_daily_challenge(req.target_role, req.focus_skills)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
