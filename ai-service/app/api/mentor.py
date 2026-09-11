from fastapi import APIRouter, HTTPException
import logging

from app.schemas.mentor import *
from app.services.mentor_service import handle_mentor_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.post("/message", response_model=MentorMessageResponse)
async def message(payload: MentorMessageRequest):
    try:
        return await handle_mentor_message(payload)
    except Exception as e:
        logger.exception("Mentor message failed")
        raise HTTPException(status_code=502, detail=str(e))
