from pydantic import BaseModel

class PortfolioAnalyzeRequest(BaseModel):
    github_username: str
    repos: list[dict]

class PortfolioAnalyzeResponse(BaseModel):
    score: int
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
