import os

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    out_lines = []
    i = 0
    in_mock_block = False
    mock_indent = ""
    in_else_block = False
    
    while i < len(lines):
        line = lines[i]
        
        if not in_mock_block and ("if raw_response.startswith(\"[mock-llm\")" in line or "if raw.startswith(\"[mock-llm\")" in line):
            in_mock_block = True
            mock_indent = line[:len(line) - len(line.lstrip())]
            i += 1
            continue
            
        if in_mock_block:
            current_indent = line[:len(line) - len(line.lstrip())]
            stripped = line.strip()
            
            # Check if we reached the `else:` clause corresponding to the mock_indent
            if stripped == "else:" and len(current_indent) == len(mock_indent):
                in_mock_block = False
                in_else_block = True
                i += 1
                continue
                
            # If we reached another block at the same or lesser indentation, and it's not empty/comment
            if stripped and not stripped.startswith("#") and len(current_indent) <= len(mock_indent):
                in_mock_block = False
                # Don't skip this line, re-evaluate it
                continue
                
            # Skip lines inside the mock block
            i += 1
            continue
            
        if in_else_block:
            # We are in the else block. We need to unindent by 4 spaces.
            # Wait, how long does the else block last? Until we hit a line with indentation <= mock_indent
            # that is not empty/comment
            stripped = line.strip()
            if not stripped:
                out_lines.append("\n")
            else:
                current_indent = line[:len(line) - len(line.lstrip())]
                if len(current_indent) <= len(mock_indent) and not stripped.startswith("#"):
                    in_else_block = False
                    out_lines.append(line)
                else:
                    # unindent by 4 spaces
                    if line.startswith(mock_indent + "    "):
                        out_lines.append(line[len(mock_indent) + 4:])
                    elif line.startswith(mock_indent + "\t"):
                        out_lines.append(line[len(mock_indent) + 1:])
                    else:
                        out_lines.append(line)
            i += 1
            continue
            
        out_lines.append(line)
        i += 1

    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(out_lines)

import glob
for f in glob.glob("app/services/*_service.py"):
    fix_file(f)
print("Finished")
