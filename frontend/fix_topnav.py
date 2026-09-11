with open("src/components/TopNav.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'setEmail(payload.email || payload.sub || "User");',
    'setEmail(payload.email || "Student");'
)

with open("src/components/TopNav.tsx", "w", encoding="utf-8") as f:
    f.write(content)
