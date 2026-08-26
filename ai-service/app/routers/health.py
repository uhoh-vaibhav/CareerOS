from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "careeros-ai-service",
        "llm_provider": settings.llm_provider,
        "vector_store": settings.vector_store,
    }
