with open("src/app.ts", "r", encoding="utf-8") as f:
    content = f.read()

import_str = "import { certificateRouter } from './modules/student/certificate.routes';"
new_import_str = import_str + "\nimport { coverLetterRouter } from './modules/student/coverLetter.routes';\nimport { challengeRouter } from './modules/student/challenge.routes';"

register_str = "app.use('/api/v1/student/certificates', certificateRouter);"
new_register_str = register_str + "\napp.use('/api/v1/student/cover-letter', coverLetterRouter);\napp.use('/api/v1/student/daily-challenge', challengeRouter);"

content = content.replace(import_str, new_import_str)
content = content.replace(register_str, new_register_str)

with open("src/app.ts", "w", encoding="utf-8") as f:
    f.write(content)
