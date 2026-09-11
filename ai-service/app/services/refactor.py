import os
import re

files = [
    "challenge_service.py",
    "cover_letter_service.py",
    "mentor_service.py",
    "mock_interview_service.py",
    "portfolio_service.py",
    "resume_service.py",
    "skill_gap_service.py"
]

base_dir = r"C:\workspace\specializationProject\careeros\ai-service\app\services"

for filename in files:
    filepath = os.path.join(base_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if "from fastapi import HTTPException" not in content:
        content = "from fastapi import HTTPException\n" + content

    # Replace the exception block
    content = re.sub(
        r"except Exception as e:\s+import logging\s+logging\.getLogger\(__name__\)\.warning\(f\"LLM generation failed.*?falling back to mock response\.\"\)\s+raw_response = \"\[mock-llm\]\"",
        r"except Exception as e:\n        import logging\n        logging.getLogger(__name__).error(f\"LLM generation failed: {e}\")\n        raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
        content,
        flags=re.DOTALL
    )

    # Remove the if raw_response.startswith("[mock-llm"): block
    content = re.sub(
        r"(\s+)if raw_response\.startswith\(\"\[mock-llm\"\):\s+return .*?(?=\n\s+(?:try|else|cleaned =|raw_response_str))",
        r"",
        content,
        flags=re.DOTALL
    )

    # In some files, the code continues directly (like challenge_service.py).
    # Wait, some files might use if/else instead of just returning inside the if.
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done")
