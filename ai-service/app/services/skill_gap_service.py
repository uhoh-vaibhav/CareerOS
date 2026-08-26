from app.adapters.llm.factory import get_llm_provider
from app.schemas.dto import SkillGapRequest, SkillGapResponse

# Minimal seed of role -> required skills. Replace with a real role-skills
# table (see Design Document 3.1 notes on JSON columns for AI-derived content).
ROLE_SKILL_PROFILES: dict[str, list[str]] = {
    "backend developer": ["python", "sql", "docker", "git", "rest apis"],
    "frontend developer": ["javascript", "typescript", "react", "css", "git"],
    "data analyst": ["sql", "python", "excel", "data visualization", "statistics"],
    "full stack developer": ["javascript", "typescript", "react", "node.js", "sql", "git"],
}

ROADMAP_SYSTEM_PROMPT = (
    "You are a learning-roadmap generator. Given a list of missing skills for "
    "a target role, produce a short, sequenced roadmap (3-5 steps)."
)


async def analyze_skill_gap(payload: SkillGapRequest) -> SkillGapResponse:
    # Step: fetch required-skill profile for target role
    required = ROLE_SKILL_PROFILES.get(payload.target_role.lower(), [])
    possessed = {s.lower() for s in payload.current_skills}

    # Step: compute set difference (required - possessed)
    missing = [skill for skill in required if skill not in possessed]

    # Step: any gaps found? -> generate roadmap, else mark "skills matched"
    llm = get_llm_provider()
    if missing:
        prompt = (
            f"Target role: {payload.target_role}\n"
            f"Missing skills: {', '.join(missing)}"
        )
        roadmap = await llm.generate(prompt, system=ROADMAP_SYSTEM_PROMPT)
    else:
        roadmap = "No gaps found for this role — skills matched."

    return SkillGapResponse(missing_skills=missing, roadmap=roadmap)
