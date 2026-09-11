from fastapi import APIRouter
from app.schemas.portfolio import *
from app.services.portfolio_service import analyze_portfolio

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.post("/analyze", response_model=PortfolioAnalyzeResponse)
async def analyze(req: PortfolioAnalyzeRequest):
    return await analyze_portfolio(req)
