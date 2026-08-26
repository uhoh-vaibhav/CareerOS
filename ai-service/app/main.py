from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import health, resume, skill_gap, mentor

app = FastAPI(
    title="CareerOS AI Service",
    description="Resume parsing, skill-gap prediction, and RAG-grounded AI Mentor.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.backend_service_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(resume.router)
app.include_router(skill_gap.router)
app.include_router(mentor.router)
# GitHub portfolio analysis router follows the same pattern once implemented.
