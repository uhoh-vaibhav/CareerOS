import glob

for f in glob.glob("app/services/*_service.py"):
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    content = content.replace(r'\"', '"')
    with open(f, "w", encoding="utf-8") as file:
        file.write(content)
print("Done")
