# -*- coding: utf-8 -*-
import re

with open("src/app/dashboard/student/mentor/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix types in milestones parsing
content = content.replace("const phases = rmRes.value.milestones;", "const phases = rmRes.value.milestones as any[];")

# Fix marked renderer link
old_link = """      renderer.link = (href, title, text) => {
        return `<a target="_blank" rel="noopener noreferrer" href="${href}" class="text-blue-600 underline font-semibold hover:text-blue-800 transition-colors">${text}</a>`;
      };"""

new_link = """      renderer.link = (options: any) => {
        const href = options.href || "";
        const text = options.text || options.raw || href;
        return `<a target="_blank" rel="noopener noreferrer" href="${href}" class="text-blue-600 underline font-semibold hover:text-blue-800 transition-colors">${text}</a>`;
      };"""

content = content.replace(old_link, new_link)

with open("src/app/dashboard/student/mentor/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
