import glob, os, re

files = glob.glob('src/app/dashboard/student/**/*.tsx', recursive=True)
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace standard button pattern
    new_content = re.sub(
        r'className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium disabled:opacity-50"',
        r'className="btn-primary text-sm"',
        content
    )
    
    # Replace secondary button pattern if any (like px-3 py-1.5 border border-navy text-navy)
    new_content = re.sub(
        r'className="px-3 py-1.5 rounded-lg border border-navy text-navy text-xs font-medium hover:bg-navy hover:text-white transition"',
        r'className="btn-secondary text-xs"',
        new_content
    )

    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
