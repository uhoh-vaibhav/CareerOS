from app.adapters.llm.factory import get_llm_provider
from app.schemas.dto import SkillGapRequest, SkillGapResponse

# Minimal seed of role -> required skills. Replace with a real role-skills
# table (see Design Document 3.1 notes on JSON columns for AI-derived content).
ROLE_SKILL_PROFILES: dict[str, list[str]] = {
    # ── Software Engineering ──
    "backend developer": [
        "python", "java", "sql", "docker", "git", "rest apis", "linux",
        "databases", "microservices", "testing",
    ],
    "frontend developer": [
        "javascript", "typescript", "react", "html", "css", "git",
        "responsive design", "rest apis", "testing", "webpack",
    ],
    "full stack developer": [
        "javascript", "typescript", "react", "node.js", "sql", "git",
        "docker", "rest apis", "html", "css", "databases", "testing",
    ],
    "software engineer": [
        "python", "java", "data structures", "algorithms", "git", "sql",
        "system design", "testing", "linux", "rest apis",
    ],
    "mobile app developer": [
        "react native", "javascript", "typescript", "git", "rest apis",
        "mobile ui design", "testing", "firebase", "app deployment",
    ],
    "android developer": [
        "java", "kotlin", "android sdk", "xml", "git", "rest apis",
        "firebase", "sqlite", "testing", "material design",
    ],
    "ios developer": [
        "swift", "xcode", "uikit", "swiftui", "git", "rest apis",
        "core data", "testing", "app store deployment", "cocoapods",
    ],

    # ── Data & AI / ML ──
    "data analyst": [
        "sql", "python", "excel", "data visualization", "statistics",
        "tableau", "power bi", "pandas", "data cleaning", "reporting",
    ],
    "data scientist": [
        "python", "machine learning", "statistics", "sql", "pandas",
        "numpy", "scikit-learn", "data visualization", "deep learning",
        "jupyter", "feature engineering",
    ],
    "data engineer": [
        "python", "sql", "apache spark", "etl", "data warehousing",
        "airflow", "docker", "cloud platforms", "databases", "kafka",
    ],
    "machine learning engineer": [
        "python", "machine learning", "deep learning", "tensorflow",
        "pytorch", "docker", "mlops", "sql", "git", "mathematics",
    ],
    "ai engineer": [
        "python", "machine learning", "deep learning", "nlp",
        "computer vision", "tensorflow", "pytorch", "docker", "git",
        "cloud platforms", "langchain", "llm apis",
    ],

    # ── Cloud & DevOps ──
    "devops engineer": [
        "docker", "kubernetes", "ci/cd", "linux", "git", "terraform",
        "aws", "monitoring", "scripting", "networking",
    ],
    "cloud engineer": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
        "linux", "networking", "security", "ci/cd",
    ],
    "site reliability engineer": [
        "linux", "docker", "kubernetes", "monitoring", "python",
        "ci/cd", "networking", "incident management", "cloud platforms",
        "automation",
    ],

    # ── Security ──
    "cybersecurity analyst": [
        "networking", "linux", "security tools", "siem", "firewalls",
        "incident response", "vulnerability assessment", "python",
        "encryption", "compliance",
    ],
    "penetration tester": [
        "networking", "linux", "kali linux", "python", "web security",
        "owasp", "scripting", "vulnerability assessment", "burp suite",
        "reporting",
    ],

    # ── QA & Testing ──
    "qa engineer": [
        "testing", "selenium", "automation testing", "python", "java",
        "sql", "api testing", "jira", "ci/cd", "test planning",
    ],

    # ── Design & Product ──
    "ui/ux designer": [
        "figma", "user research", "wireframing", "prototyping",
        "design systems", "usability testing", "html", "css",
        "responsive design", "accessibility",
    ],
    "product manager": [
        "product strategy", "user research", "agile", "data analysis",
        "roadmap planning", "stakeholder management", "sql", "jira",
        "a/b testing", "communication",
    ],

    # ── Database ──
    "database administrator": [
        "sql", "postgresql", "mysql", "database tuning", "backup recovery",
        "replication", "linux", "monitoring", "security", "scripting",
    ],

    # ── Blockchain & Emerging ──
    "blockchain developer": [
        "solidity", "ethereum", "javascript", "web3.js", "smart contracts",
        "git", "cryptography", "data structures", "testing", "defi",
    ],

    # ── Networking ──
    "network engineer": [
        "networking", "tcp/ip", "routing", "switching", "firewalls",
        "linux", "vpn", "dns", "monitoring", "troubleshooting",
    ],

    # ── Business Intelligence ──
    "business analyst": [
        "sql", "excel", "data visualization", "requirements gathering",
        "agile", "jira", "communication", "power bi", "reporting",
        "stakeholder management",
    ],
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
