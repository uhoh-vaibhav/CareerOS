import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace the entire try-except-fallback structure.
    # The safest way is to replace the fallback assignment with raising an exception
    # and stripping out the `if raw.startswith("[mock-llm"): ... else: ...` block, leaving just the parsing logic.
    
    # Actually, the simplest approach using python AST or just string replacement:
    
    # 1. Replace the try/except block
    content = re.sub(
        r'try:\s*(.*? = await llm\.generate.*?)\s*except Exception as e:\s*import logging\s*logging\.getLogger.*?mock.*?".*? = "\[mock-llm\]"',
        r'from fastapi import HTTPException\n    try:\n        \1\n    except Exception as e:\n        import logging\n        logging.getLogger(__name__).error(f"LLM generation failed: {e}")\n        raise HTTPException(status_code=502, detail="AI analysis is temporarily unavailable.")',
        content,
        flags=re.DOTALL
    )
    
    # 2. Remove `if raw_response.startswith("[mock-llm"): ... else:` block
    # It's tricky to do with regex because of indentation. Let's do it manually for each file structure.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for file in os.listdir('app/services'):
    if file.endswith('_service.py'):
        process_file(os.path.join('app/services', file))

