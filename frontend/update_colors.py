import glob, os, re

files = glob.glob('src/app/**/*.tsx', recursive=True)
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace gray text colors
    new_content = re.sub(r'\btext-gray-[456]00\b', 'text-text-muted', content)
    
    # Replace gray borders
    new_content = re.sub(r'\bborder-gray-200\b', 'border-border', new_content)

    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
