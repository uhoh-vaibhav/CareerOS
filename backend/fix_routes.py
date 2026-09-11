with open("src/modules/student/roadmap.routes.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { latest, history, updateProgress } from \"./roadmap.controller\";",
    "import { latest, history, updateProgress, generateMaterial } from \"./roadmap.controller\";"
)

with open("src/modules/student/roadmap.routes.ts", "w", encoding="utf-8") as f:
    f.write(content)
