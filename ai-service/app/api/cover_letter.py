from fastapi import APIRouter, HTTPException
from app.schemas.cover_letter import *
from app.services.cover_letter_service import generate_cover_letter

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])

@router.post("/generate", response_model=CoverLetterGenerateResponse)
async def generate(req: CoverLetterGenerateRequest):
    try:
        return await generate_cover_letter(req.job_description, req.student_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
