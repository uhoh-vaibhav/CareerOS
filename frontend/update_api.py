import re

with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("  feedback: { qa?: QuestionAnswer[]; feedback?: string } | string | null;", "  feedback: { qa?: QuestionAnswer[]; feedback?: string; confidenceScore?: number; communicationFeedback?: string; } | string | null;")

with open("src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(content)
