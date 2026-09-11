from fastapi import APIRouter, HTTPException
import logging

from app.schemas.skill_gap import *
from app.schemas.study import *
from app.services.skill_gap_service import analyze_skill_gap, generate_study_material

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skill-gap", tags=["skill-gap"])


@router.post("/analyze", response_model=SkillGapResponse)
async def analyze(payload: SkillGapRequest):
    try:
        return await analyze_skill_gap(payload)
    except Exception as e:
        logger.exception("Skill gap analysis failed")
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/study-material", response_model=StudyMaterialResponse)
async def generate_material(payload: StudyMaterialRequest):
    try:
        return await generate_study_material(payload)
    except Exception as e:
        logger.exception("Study material generation failed")
        raise HTTPException(status_code=502, detail=str(e))
