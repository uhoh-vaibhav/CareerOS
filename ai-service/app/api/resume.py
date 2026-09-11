from fastapi import APIRouter, HTTPException
from app.schemas.resume import *
from app.services.resume_service import parse_resume
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/parse", response_model=ResumeParseResponse)
async def parse(payload: ResumeParseRequest):
    try:
        return await parse_resume(payload)
    except Exception as e:
        logger.exception("Resume parse failed")
        raise HTTPException(status_code=502, detail=str(e))
