import re
from app.adapters.llm.factory import get_llm_provider
from app.schemas.dto import ResumeParseRequest, ResumeParseResponse

RESUME_SYSTEM_PROMPT = (
    "You are a professional resume reviewer. Analyze the resume and provide "
    "specific, actionable feedback in 3-5 bullet points covering: strengths, "
    "weaknesses, formatting suggestions, and content improvements. Be concise "
    "and direct."
)

# ────────────────────── Skill Extraction ──────────────────────
# Comprehensive skill dictionary organized by category.
SKILL_CATALOG: dict[str, list[str]] = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "perl", "dart", "lua", "shell", "bash", "powershell",
    ],
    "frontend": [
        "react", "next.js", "angular", "vue.js", "svelte", "html", "css",
        "sass", "tailwind css", "bootstrap", "material ui", "webpack",
        "vite", "redux", "jquery", "responsive design",
    ],
    "backend": [
        "node.js", "express", "fastapi", "django", "flask", "spring boot",
        "spring", "asp.net", "rails", "laravel", "gin", "nestjs", "graphql",
        "rest apis", "grpc", "microservices",
    ],
    "databases": [
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "sqlite", "oracle", "cassandra", "dynamodb", "firebase",
        "neo4j", "supabase", "prisma",
    ],
    "devops_cloud": [
        "docker", "kubernetes", "aws", "azure", "gcp", "terraform",
        "ansible", "jenkins", "ci/cd", "github actions", "gitlab ci",
        "nginx", "linux", "vercel", "netlify", "heroku",
    ],
    "data_ml": [
        "machine learning", "deep learning", "nlp", "computer vision",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
        "data visualization", "tableau", "power bi", "apache spark",
        "hadoop", "airflow", "kafka", "etl", "data warehousing",
        "jupyter", "langchain", "llm",
    ],
    "tools_practices": [
        "git", "github", "gitlab", "bitbucket", "jira", "agile", "scrum",
        "figma", "postman", "swagger", "selenium", "jest", "pytest",
        "testing", "unit testing", "api testing",
    ],
    "security": [
        "cybersecurity", "owasp", "encryption", "firewalls", "siem",
        "penetration testing", "vulnerability assessment",
    ],
    "mobile": [
        "react native", "flutter", "android sdk", "ios", "swiftui",
        "xcode", "kotlin multiplatform",
    ],
    "blockchain": [
        "solidity", "ethereum", "web3.js", "smart contracts", "blockchain",
    ],
}

# Flatten for fast lookups
ALL_SKILLS: list[str] = []
for _category_skills in SKILL_CATALOG.values():
    ALL_SKILLS.extend(_category_skills)


# ────────────────────── ATS Scoring Criteria ──────────────────────
# Each criterion has a weight (total = 100) and a scoring function.

# Contact information patterns
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s\-()]{7,}\d)")
LINKEDIN_PATTERN = re.compile(r"linkedin\.com/in/", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"github\.com/", re.IGNORECASE)
PORTFOLIO_PATTERN = re.compile(r"(portfolio|\.dev|\.io|\.com|\.me)", re.IGNORECASE)

# Resume sections that ATS systems look for
SECTION_KEYWORDS: dict[str, list[str]] = {
    "education": ["education", "academic", "degree", "university", "college", "bachelor", "master", "mca", "bca", "b.tech", "m.tech", "bsc", "msc", "phd"],
    "experience": ["experience", "work history", "employment", "internship", "work experience", "professional experience"],
    "skills": ["skills", "technical skills", "technologies", "competencies", "proficiencies", "tech stack"],
    "projects": ["projects", "personal projects", "academic projects", "key projects"],
    "certifications": ["certifications", "certificates", "credentials", "licensed"],
    "summary": ["summary", "objective", "profile", "about me", "professional summary", "career objective"],
    "achievements": ["achievements", "awards", "honors", "accomplishments", "recognition"],
}

# Strong action verbs that indicate impact
ACTION_VERBS = [
    "achieved", "built", "created", "delivered", "designed", "developed",
    "engineered", "established", "implemented", "improved", "increased",
    "integrated", "launched", "led", "managed", "migrated", "optimized",
    "orchestrated", "reduced", "refactored", "resolved", "scaled",
    "spearheaded", "streamlined", "architected", "automated", "deployed",
    "maintained", "contributed", "collaborated", "mentored", "published",
]

# Quantifiable metrics patterns (numbers that suggest measurable impact)
METRICS_PATTERN = re.compile(r"\b(\d+[%+xX]|\d+\s*(?:users|requests|transactions|clients|projects|team|members|servers|endpoints|apis|hours|days|weeks|months))\b", re.IGNORECASE)


async def parse_resume(payload: ResumeParseRequest) -> ResumeParseResponse:
    llm = get_llm_provider()

    # Extract skills and compute ATS score using the real scoring engine
    skills = extract_skills(payload.resume_text)
    ats_score, score_breakdown = compute_ats_score(payload.resume_text, skills)

    # Build a context-aware prompt for LLM feedback that includes the score breakdown
    feedback_prompt = _build_feedback_prompt(payload.resume_text, ats_score, score_breakdown)
    feedback = await llm.generate(feedback_prompt, system=RESUME_SYSTEM_PROMPT)

    return ResumeParseResponse(skills=skills, ats_score=ats_score, ats_breakdown=score_breakdown, feedback=feedback)


def extract_skills(text: str) -> list[str]:
    """
    Extract skills from resume text by matching against a comprehensive
    skill catalog. Uses word-boundary-aware matching for short terms and
    substring matching for multi-word skills.
    """
    lowered = text.lower()
    found: list[str] = []

    for skill in ALL_SKILLS:
        if len(skill) <= 3:
            # Short terms (e.g. "r", "go", "c#") — require word boundaries
            # to avoid false positives
            if re.search(rf"\b{re.escape(skill)}\b", lowered):
                found.append(skill)
        else:
            if skill in lowered:
                found.append(skill)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for s in found:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    return unique


def compute_ats_score(text: str, skills: list[str]) -> tuple[int, dict[str, int]]:
    """
    Computes a realistic ATS compatibility score (0-100) based on seven
    weighted criteria that real Applicant Tracking Systems evaluate:

      1. Contact Information  (10 pts)  — email, phone, LinkedIn, etc.
      2. Resume Sections      (20 pts)  — presence of standard sections
      3. Skills & Keywords    (25 pts)  — technical skills density
      4. Action Verbs         (10 pts)  — strong action verbs usage
      5. Quantifiable Impact  (10 pts)  — metrics and measurable results
      6. Length & Density      (15 pts)  — appropriate resume length
      7. Formatting Signals   (10 pts)  — clean formatting indicators
    """
    lowered = text.lower()

    # ── 1. Contact Information (0-10) ──
    contact_score = 0
    if EMAIL_PATTERN.search(text):
        contact_score += 4
    if PHONE_PATTERN.search(text):
        contact_score += 3
    if LINKEDIN_PATTERN.search(text) or GITHUB_PATTERN.search(text):
        contact_score += 2
    if PORTFOLIO_PATTERN.search(text):
        contact_score += 1
    contact_score = min(contact_score, 10)

    # ── 2. Resume Sections (0-20) ──
    sections_found = 0
    for _section_name, keywords in SECTION_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            sections_found += 1
    # 7 possible sections, scale to 20
    section_score = min(round(sections_found / 7 * 20), 20)

    # ── 3. Skills & Keywords (0-25) ──
    skill_count = len(skills)
    # Categorize: how many different categories are represented?
    categories_hit = 0
    for _cat, cat_skills in SKILL_CATALOG.items():
        if any(s in skills for s in cat_skills):
            categories_hit += 1
    # Reward both breadth (categories) and depth (count)
    depth_score = min(skill_count * 1.5, 15)  # up to 15 for ~10+ skills
    breadth_score = min(categories_hit * 2, 10)  # up to 10 for 5+ categories
    skills_score = min(round(depth_score + breadth_score), 25)

    # ── 4. Action Verbs (0-10) ──
    verb_hits = sum(1 for v in ACTION_VERBS if v in lowered)
    action_score = min(round(verb_hits / 5 * 10), 10)  # 5+ verbs → full marks

    # ── 5. Quantifiable Impact (0-10) ──
    metrics_found = len(METRICS_PATTERN.findall(text))
    metrics_score = min(round(metrics_found / 3 * 10), 10)  # 3+ metrics → full marks

    # ── 6. Length & Density (0-15) ──
    word_count = len(text.split())
    # Ideal resume: 300-800 words (1-2 pages). Penalize too short or too long.
    if word_count < 100:
        length_score = 3
    elif word_count < 200:
        length_score = 7
    elif word_count < 300:
        length_score = 10
    elif word_count <= 800:
        length_score = 15  # sweet spot
    elif word_count <= 1200:
        length_score = 12
    else:
        length_score = 8  # too long

    # ── 7. Formatting Signals (0-10) ──
    format_score = 0
    lines = text.strip().split("\n")
    non_empty_lines = [l for l in lines if l.strip()]
    if len(non_empty_lines) >= 15:
        format_score += 3  # not too sparse
    # Check for some structure (lines of varying length suggest headers/bullets)
    if len(non_empty_lines) > 0:
        lengths = [len(l.strip()) for l in non_empty_lines]
        avg_len = sum(lengths) / len(lengths)
        if 20 < avg_len < 120:
            format_score += 3  # reasonable line lengths
    # Check for bullet points or dashes (common in well-formatted resumes)
    bullet_lines = sum(1 for l in non_empty_lines if l.strip().startswith(("-", "•", "–", "*", "▪")))
    if bullet_lines >= 3:
        format_score += 2
    # Check for date-like patterns (suggests proper experience entries)
    date_pattern = re.compile(r"\b(20\d{2}|19\d{2})\b")
    if date_pattern.search(text):
        format_score += 2
    format_score = min(format_score, 10)

    # ── Total ──
    total = contact_score + section_score + skills_score + action_score + metrics_score + length_score + format_score
    total = max(0, min(total, 100))

    breakdown = {
        "contact_info": contact_score,
        "sections": section_score,
        "skills_keywords": skills_score,
        "action_verbs": action_score,
        "quantifiable_impact": metrics_score,
        "length_density": length_score,
        "formatting": format_score,
    }

    return total, breakdown


def _build_feedback_prompt(text: str, ats_score: int, breakdown: dict[str, int]) -> str:
    """
    Build a prompt that gives the LLM context about the ATS score breakdown
    so it can provide targeted, actionable feedback.
    """
    weak_areas = [k for k, v in breakdown.items() if v < _max_for_criterion(k) * 0.5]
    weak_str = ", ".join(a.replace("_", " ") for a in weak_areas) if weak_areas else "none"

    return (
        f"Resume text:\n{text[:3000]}\n\n"
        f"ATS Score: {ats_score}/100\n"
        f"Score breakdown: {breakdown}\n"
        f"Weak areas: {weak_str}\n\n"
        "Based on this analysis, provide specific improvement suggestions "
        "focusing on the weak areas. If the score is high, acknowledge "
        "strengths and suggest minor polish."
    )


def _max_for_criterion(name: str) -> int:
    """Returns the maximum possible score for a given criterion."""
    maxes = {
        "contact_info": 10,
        "sections": 20,
        "skills_keywords": 25,
        "action_verbs": 10,
        "quantifiable_impact": 10,
        "length_density": 15,
        "formatting": 10,
    }
    return maxes.get(name, 10)
