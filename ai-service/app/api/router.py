from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.resume import router as resume_router
from app.api.skill_gap import router as skill_gap_router
from app.api.mentor import router as mentor_router
from app.api.mock_interview import router as mock_interview_router
from app.api.portfolio import router as portfolio_router
from app.api.challenge import router as challenge_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(resume_router)
api_router.include_router(skill_gap_router)
api_router.include_router(mentor_router)
api_router.include_router(mock_interview_router)
api_router.include_router(portfolio_router)
api_router.include_router(challenge_router)
