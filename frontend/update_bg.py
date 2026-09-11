import glob, os, re

files = glob.glob('src/app/dashboard/student/**/*.tsx', recursive=True)
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace main bg-white
    new_content = re.sub(r'(<main.*?className="[^"]*)\bbg-white\b([^"]*")', r'\1bg-background\2', content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
