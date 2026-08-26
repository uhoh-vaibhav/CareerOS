from fastapi import APIRouter
from app.schemas.dto import ResumeParseRequest, ResumeParseResponse
from app.services.resume_service import parse_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/parse", response_model=ResumeParseResponse)
async def parse(payload: ResumeParseRequest):
    return await parse_resume(payload)
