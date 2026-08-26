from fastapi import APIRouter
from app.schemas.dto import MentorMessageRequest, MentorMessageResponse
from app.services.mentor_service import handle_mentor_message

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.post("/message", response_model=MentorMessageResponse)
async def message(payload: MentorMessageRequest):
    return await handle_mentor_message(payload)
