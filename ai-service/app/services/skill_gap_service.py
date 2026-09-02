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
    "You are a learning-roadmap generator that creates structured curricula. "
    "Given a list of missing skills for a target role, group related skills "
    "into logical learning phases ordered from foundational to advanced. "
    "Each phase should teach 2-4 related skills that make sense to learn "
    "together. Return a JSON array of 3-6 phases with these fields:\n"
    '  "step": phase number (1-based integer)\n'
    '  "title": a concise curriculum-style title for this learning phase\n'
    '  "description": 1-2 sentences on what to learn, why these skills '
    "pair together, and how they build on previous phases\n"
    '  "skills": array of skill names this phase covers (2-4 skills)\n'
    '  "resources": array of 2-3 specific resource suggestions '
    "(course names, books, platforms, or project ideas)\n"
    '  "estimatedWeeks": estimated weeks to complete (integer, 1-4)\n'
    "\n"
    "IMPORTANT: Group skills by relatedness and order phases so that "
    "foundational skills come first and advanced/specialized skills come "
    "last. Return ONLY the JSON array, no other text."
)

# ────────────────────── Skill Classification ──────────────────────
# Maps skills into learning domains so we can group related ones together
# and sequence them from foundational → advanced.

SKILL_DOMAINS: dict[str, list[str]] = {
    # Tier 0 — Fundamentals (learn first)
    "foundations": [
        "git", "linux", "data structures", "algorithms", "mathematics",
        "statistics", "networking", "html", "css", "xml",
    ],
    # Tier 1 — Core languages
    "languages": [
        "python", "javascript", "typescript", "java", "kotlin", "swift",
        "c++", "c#", "go", "rust", "ruby", "php", "sql", "r",
        "solidity", "scripting", "bash", "shell", "powershell",
    ],
    # Tier 2 — Frameworks & libraries
    "frameworks": [
        "react", "next.js", "angular", "vue.js", "node.js", "express",
        "django", "flask", "fastapi", "spring boot", "react native",
        "flutter", "android sdk", "swiftui", "uikit", "xcode",
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
        "langchain", "web3.js", "material design", "cocoapods",
        "bootstrap", "tailwind css", "redux", "jquery", "webpack", "vite",
    ],
    # Tier 3 — Data & ML concepts
    "data_ml": [
        "machine learning", "deep learning", "nlp", "computer vision",
        "data visualization", "data cleaning", "feature engineering",
        "excel", "tableau", "power bi", "jupyter",
        "etl", "data warehousing", "reporting", "data analysis",
    ],
    # Tier 4 — Infrastructure & DevOps
    "infrastructure": [
        "docker", "kubernetes", "ci/cd", "aws", "azure", "gcp",
        "terraform", "monitoring", "databases", "postgresql", "mysql",
        "mongodb", "redis", "firebase", "sqlite", "apache spark",
        "airflow", "kafka", "cloud platforms",
        "nginx", "heroku", "vercel", "netlify",
    ],
    # Tier 5 — Practices & methodologies
    "practices": [
        "testing", "rest apis", "graphql", "microservices", "system design",
        "agile", "scrum", "jira", "responsive design", "accessibility",
        "api testing", "automation testing", "selenium", "mlops",
        "app deployment", "app store deployment",
    ],
    # Tier 6 — Domain-specific / advanced
    "domain": [
        "cybersecurity", "owasp", "encryption", "firewalls", "siem",
        "penetration testing", "vulnerability assessment", "incident response",
        "web security", "kali linux", "burp suite", "compliance",
        "smart contracts", "ethereum", "cryptography", "defi", "blockchain",
        "user research", "wireframing", "prototyping", "figma",
        "design systems", "usability testing", "mobile ui design",
        "product strategy", "roadmap planning", "stakeholder management",
        "communication", "a/b testing", "requirements gathering",
        "incident management", "automation", "troubleshooting",
        "database tuning", "backup recovery", "replication",
        "security", "security tools", "vpn", "dns",
        "tcp/ip", "routing", "switching", "test planning",
        "llm apis", "llm",
    ],
}

# Phase title templates per domain
PHASE_TITLES: dict[str, str] = {
    "foundations":    "Fundamentals & Developer Tooling",
    "languages":      "Core Programming Languages",
    "frameworks":     "Frameworks & Libraries",
    "data_ml":        "Data & Machine Learning Concepts",
    "infrastructure": "Infrastructure & Cloud",
    "practices":      "Engineering Practices & Architecture",
    "domain":         "Domain Specialization",
}

PHASE_DESCRIPTIONS: dict[str, str] = {
    "foundations": (
        "Start here — these are the building blocks everything else depends on. "
        "Version control, OS fundamentals, and core CS concepts unlock all later phases."
    ),
    "languages": (
        "Pick up the programming languages required for this role. "
        "Focus on syntax fluency and solving small problems before moving to frameworks."
    ),
    "frameworks": (
        "Now apply your language skills through frameworks and libraries. "
        "Build small projects to internalize each tool's patterns and conventions."
    ),
    "data_ml": (
        "Develop your data literacy — learn to manipulate, visualize, and model data. "
        "These skills build on your programming foundation from earlier phases."
    ),
    "infrastructure": (
        "Learn to deploy, scale, and manage the systems you build. "
        "Containerization, cloud services, and databases are essential for production work."
    ),
    "practices": (
        "Level up from writing code to engineering software. "
        "Testing, API design, and architecture patterns make your work production-ready."
    ),
    "domain": (
        "Dive deep into the specialized knowledge that sets this role apart. "
        "These advanced skills build on everything you've learned so far."
    ),
}

RESOURCE_SUGGESTIONS: dict[str, list[str]] = {
    "foundations": [
        "freeCodeCamp — Git & Linux basics",
        "MIT OpenCourseWare — Introduction to Algorithms",
        "The Odin Project — Web fundamentals",
    ],
    "languages": [
        "Codecademy / LeetCode — language-specific tracks",
        "Exercism.io — practice problems",
        "Official language documentation & tutorials",
    ],
    "frameworks": [
        "Official framework tutorials (React docs, Django tutorial, etc.)",
        "Build a CRUD project to solidify patterns",
        "Udemy / Coursera — framework deep-dives",
    ],
    "data_ml": [
        "Kaggle Learn — free micro-courses",
        "Andrew Ng's Machine Learning Specialization (Coursera)",
        "Hands-On Machine Learning (book by Aurélien Géron)",
    ],
    "infrastructure": [
        "Docker official Getting Started guide",
        "AWS / Azure / GCP free-tier labs",
        "KodeKloud — Kubernetes for beginners",
    ],
    "practices": [
        "Designing Data-Intensive Applications (book)",
        "Martin Fowler's blog on architecture patterns",
        "Build & deploy a full project with CI/CD",
    ],
    "domain": [
        "Industry certifications (AWS, CKAD, OSCP, etc.)",
        "Specialized Coursera / Udacity nanodegrees",
        "Contribute to open-source projects in this domain",
    ],
}


def _classify_skill(skill: str) -> str:
    """Return the domain name a skill belongs to."""
    lowered = skill.lower()
    for domain, skills_list in SKILL_DOMAINS.items():
        if lowered in skills_list:
            return domain
    return "domain"  # default: domain-specific


def _generate_mock_roadmap(target_role: str, missing: list[str]) -> list[dict]:
    """
    Generate a curriculum-style roadmap by classifying each missing skill
    into a learning domain, then grouping related skills into sequenced
    learning phases ordered from foundational → advanced.
    """
    # 1. Classify each skill into its domain
    domain_skills: dict[str, list[str]] = {}
    for skill in missing:
        domain = _classify_skill(skill)
        domain_skills.setdefault(domain, []).append(skill)

    # 2. Build phases in tier order (foundations → domain-specific)
    tier_order = [
        "foundations", "languages", "frameworks", "data_ml",
        "infrastructure", "practices", "domain",
    ]

    phases: list[dict] = []
    step = 1

    for domain in tier_order:
        skills = domain_skills.get(domain)
        if not skills:
            continue

        # If a domain has many skills, split into sub-phases of 2-4
        chunks = [skills[i:i + 4] for i in range(0, len(skills), 4)]
        for chunk_idx, chunk in enumerate(chunks):
            title = PHASE_TITLES.get(domain, "Specialized Skills")
            if len(chunks) > 1:
                title += f" (Part {chunk_idx + 1})"

            # Estimate weeks: 1 week per skill, min 1, max 4
            weeks = max(1, min(len(chunk) + 1, 4))

            phases.append({
                "step": step,
                "title": title,
                "description": PHASE_DESCRIPTIONS.get(domain, (
                    f"Learn {', '.join(chunk)} to strengthen your "
                    f"qualification for the {target_role} role."
                )),
                "skills": chunk,
                "resources": RESOURCE_SUGGESTIONS.get(domain, [
                    f"Official {chunk[0].title()} documentation",
                    f"Udemy / Coursera courses on {chunk[0]}",
                ])[:3],
                "estimatedWeeks": weeks,
            })
            step += 1

    # 3. Cap at 6 phases max
    return phases[:6]


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
        raw = await llm.generate(prompt, system=ROADMAP_SYSTEM_PROMPT)

        # Try to parse structured JSON from the LLM response.
        # If it's a mock or the LLM returns non-JSON, fall back to
        # a deterministic structured roadmap.
        import json
        try:
            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]
            milestones = json.loads(cleaned)
            if not isinstance(milestones, list):
                raise ValueError("Not a list")
            roadmap = json.dumps(milestones)
        except (json.JSONDecodeError, ValueError):
            # LLM didn't return valid JSON — use structured mock
            milestones = _generate_mock_roadmap(payload.target_role, missing)
            roadmap = json.dumps(milestones)
    else:
        roadmap = "[]"

    return SkillGapResponse(missing_skills=missing, roadmap=roadmap)


