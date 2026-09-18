from fastapi import HTTPException
import json
from app.adapters.llm.factory import get_llm_provider
from app.schemas.portfolio import PortfolioAnalyzeRequest, PortfolioAnalyzeResponse
from app.prompts.portfolio_prompt import SYSTEM_PROMPT



async def analyze_portfolio(req: PortfolioAnalyzeRequest) -> PortfolioAnalyzeResponse:
    llm = get_llm_provider()
    
    # Format repos into a readable string
    repo_text = f"Username: {req.github_username}\n\n"
    if not req.repos:
        repo_text += "No public repositories found."
    else:
        for i, repo in enumerate(req.repos, 1):
            name = repo.get("name", "Unknown")
            desc = repo.get("description", "No description")
            lang = repo.get("language", "None")
            stars = repo.get("stargazers_count", 0)
            repo_text += f"{i}. {name} (Language: {lang}, Stars: {stars})\n   Description: {desc}\n\n"
            
    try:
        raw_response = await llm.generate(repo_text, system=SYSTEM_PROMPT)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"LLM generation failed: {e}")
        raise HTTPException(status_code=502, detail="AI analysis is temporarily unavailable.")
        
    try:
        cleaned = raw_response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
        data = json.loads(cleaned)
        if "score" not in data:
            raise ValueError("Score missing in portfolio analysis response")
        return PortfolioAnalyzeResponse(
            score=max(0, min(100, int(data["score"]))),
            strengths=data.get("strengths", ["No strengths provided."]),
            weaknesses=data.get("weaknesses", ["No weaknesses provided."]),
            suggestions=data.get("suggestions", ["No suggestions provided."])
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to parse portfolio analysis: {e}")
        raise HTTPException(status_code=502, detail="Failed to parse portfolio analysis from AI.")
