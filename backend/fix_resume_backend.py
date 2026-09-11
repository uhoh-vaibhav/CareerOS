with open("src/modules/student/resume.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_data = """      parsedJson: { skills: parsed.skills, feedback: parsed.feedback, ats_breakdown: parsed.ats_breakdown },"""
new_data = """      parsedJson: parsed,"""

content = content.replace(old_data, new_data)

with open("src/modules/student/resume.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
