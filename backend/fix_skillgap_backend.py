with open("src/modules/student/skillgap.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Currently it does:
# missingSkills: aiResult.missing_skills
# Let's change it to:
# missingSkills: aiResult.raw_json || aiResult.missing_skills

content = content.replace("missingSkills: aiResult.missing_skills,", "missingSkills: aiResult.raw_json || aiResult.missing_skills,")

with open("src/modules/student/skillgap.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
