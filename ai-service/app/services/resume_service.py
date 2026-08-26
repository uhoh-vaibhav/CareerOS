from app.adapters.llm.factory import get_llm_provider
from app.schemas.dto import ResumeParseRequest, ResumeParseResponse

RESUME_SYSTEM_PROMPT = (
    "You are a resume parsing assistant. Extract skills as a comma-separated "
    "list and give a short, actionable improvement note. Be concise."
)


async def parse_resume(payload: ResumeParseRequest) -> ResumeParseResponse:
    llm = get_llm_provider()

    raw = await llm.generate(payload.resume_text, system=RESUME_SYSTEM_PROMPT)

    # NOTE: with a real provider this should request structured JSON output
    # (see docs/build-with-claude style function-calling / JSON mode) rather
    # than parsing free text — left simple here since MockLLMProvider just
    # echoes the prompt back.
    skills = _naive_skill_extract(payload.resume_text)
    ats_score = _naive_ats_score(payload.resume_text)

    return ResumeParseResponse(skills=skills, ats_score=ats_score, feedback=raw)


def _naive_skill_extract(text: str) -> list[str]:
    known_skills = [
        "python", "javascript", "typescript", "react", "next.js", "node.js",
        "express", "postgresql", "mongodb", "docker", "aws", "fastapi",
        "sql", "git", "java", "c++", "machine learning", "nlp",
    ]
    lowered = text.lower()
    return [s for s in known_skills if s in lowered]


def _naive_ats_score(text: str) -> int:
    # Placeholder heuristic: longer, keyword-denser resumes score higher.
    # Replace with the real ATS scoring model described in the Design Document.
    length_score = min(len(text) // 50, 60)
    return min(40 + length_score, 100)
