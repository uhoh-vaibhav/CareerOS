from fastapi import APIRouter
from app.schemas.dto import SkillGapRequest, SkillGapResponse
from app.services.skill_gap_service import analyze_skill_gap

router = APIRouter(prefix="/skill-gap", tags=["skill-gap"])


@router.post("/analyze", response_model=SkillGapResponse)
async def analyze(payload: SkillGapRequest):
    return await analyze_skill_gap(payload)
