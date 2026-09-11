import os
import re

filepath = "app/services/skill_gap_service.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the mock generating functions
content = re.sub(r"def _classify_skill.*?return phases\[:6\]\n\n", "", content, flags=re.DOTALL)

out = []
lines = content.split('\n')
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("async def analyze_skill_gap"):
        break
    out.append(line)
    i += 1

out.extend([
    "async def analyze_skill_gap(payload: SkillGapRequest) -> SkillGapResponse:",
    "    # Step: fetch required-skill profile for target role",
    "    required = ROLE_SKILL_PROFILES.get(payload.target_role.lower(), [])",
    "    possessed = {s.lower() for s in payload.current_skills}",
    "",
    "    # Step: compute set difference (required - possessed)",
    "    missing = [skill for skill in required if skill not in possessed]",
    "",
    "    llm = get_llm_provider()",
    "    if missing:",
    "        prompt = (",
    "            f\"Target role: {payload.target_role}\\n\"",
    "            f\"Missing skills: {', '.join(missing)}\"",
    "        )",
    "        ",
    "        try:",
    "            raw = await llm.generate(prompt, system=ROADMAP_SYSTEM_PROMPT)",
    "        except Exception as e:",
    "            import logging",
    "            logging.getLogger(__name__).error(f\"LLM generation failed: {e}\")",
    "            raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
    "        ",
    "        import json",
    "        try:",
    "            cleaned = raw.strip()",
    "            if cleaned.startswith(\"```\"):",
    "                cleaned = cleaned.split(\"\\n\", 1)[1]",
    "                cleaned = cleaned.rsplit(\"```\", 1)[0]",
    "            milestones = json.loads(cleaned)",
    "            if not isinstance(milestones, list):",
    "                raise ValueError(\"Not a list\")",
    "            roadmap = json.dumps(milestones)",
    "        except Exception as e:",
    "            import logging",
    "            logging.getLogger(__name__).error(f\"Failed to parse roadmap: {e}\")",
    "            raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
    "    else:",
    "        roadmap = \"[]\"",
    "",
    "    return SkillGapResponse(missing_skills=missing, roadmap=roadmap)",
    ""
])

with open(filepath, "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("Fixed skill gap")
