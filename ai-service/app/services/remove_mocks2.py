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

    # Make sure we have the fastapi import
    if "from fastapi import HTTPException" not in content:
        content = "from fastapi import HTTPException\n" + content

    # Use a more generic regex for the except block
    # Matches:
    # except Exception as e:
    #     ...
    #     raw_response = "[mock-llm]" (or raw = "[mock-llm]")
    content = re.sub(
        r"except Exception as e:\s+import logging\s+logging\.getLogger\(__name__\)\.(?:warning|error)\(.*?\[mock-llm\](?:\"|')",
        r"except Exception as e:\n        import logging\n        logging.getLogger(__name__).error(f\"LLM generation failed: {e}\")\n        raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
        content,
        flags=re.DOTALL
    )

    # There might be raw = "[mock-llm]" 
    content = re.sub(
        r"except Exception as e:\n\s+import logging\n\s+logging\.getLogger\(__name__\)\.warning\(f\"LLM generation failed.*?\)\n\s+raw(?:_response)? = \"\[mock-llm\]\"",
        r"except Exception as e:\n        import logging\n        logging.getLogger(__name__).error(f\"LLM generation failed: {e}\")\n        raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
        content,
        flags=re.DOTALL
    )
    
    # We also need to strip the if raw.startswith("[mock-llm") block
    # and unindent the else block if it exists
    
    # Actually, ast parsing might be safer, or just doing it with a generic regex and checking the output.
    # We can write a custom function to handle the if raw.startswith("[mock-llm")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done phase 1")
