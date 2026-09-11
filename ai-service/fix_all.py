import re
import os
import glob

for fpath in glob.glob("app/services/*_service.py"):
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Ensure fastapi import
    if "from fastapi import HTTPException" not in content:
        content = "from fastapi import HTTPException\n" + content

    # 2. Fix the try/except block
    content = re.sub(
        r"(except Exception as e:)\s+import logging\s+logging\.getLogger\(__name__\)\.(?:warning|error)\([^\)]*?\[mock-llm\].*?\)\s+(raw_response|raw) = ['\"]\[mock-llm\]['\"]",
        r"\1\n        import logging\n        logging.getLogger(__name__).error(f\"LLM generation failed: {e}\")\n        raise HTTPException(status_code=502, detail=\"AI analysis is temporarily unavailable.\")",
        content,
        flags=re.DOTALL
    )

    lines = content.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r'^(\s+)if\s+(raw|raw_response)\.startswith\("\[mock-llm"\):', line)
        if match:
            indent = match.group(1)
            i += 1
            # skip all lines that are indented more than `indent`
            while i < len(lines):
                if lines[i].strip() == "":
                    i += 1
                    continue
                curr_indent = len(lines[i]) - len(lines[i].lstrip())
                if curr_indent > len(indent):
                    i += 1
                elif lines[i].startswith(indent + "else:"):
                    # skip this else: line
                    i += 1
                    # now unindent the else block
                    while i < len(lines):
                        if lines[i].strip() == "":
                            out.append(lines[i])
                            i += 1
                            continue
                        inner_indent = len(lines[i]) - len(lines[i].lstrip())
                        if inner_indent > len(indent):
                            # unindent by 4 spaces
                            if lines[i].startswith(indent + "    "):
                                out.append(lines[i][:len(indent)] + lines[i][len(indent)+4:])
                            else:
                                out.append(lines[i])
                            i += 1
                        else:
                            break
                    break
                else:
                    # no else block, just break and process lines[i] normally
                    break
            continue
        out.append(line)
        i += 1
        
    content = "\n".join(out)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done")
