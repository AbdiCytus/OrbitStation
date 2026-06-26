import re

with open(r'd:\Documents\Ngoding\Proyek\OrbStation\OrbitStation\app\badges.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing background-image:
content = content.replace(
    '-webkit-backdrop-filter: none !important;\n    url("data:image',
    '-webkit-backdrop-filter: none !important;\n  background-image:\n    url("data:image'
)

# Remove stray bracket
stray = '''  z-index: auto !important;\n}\n\n  background-size: 100% 100%, 100% 100% !important;'''
replacement = '''  background-size: 100% 100%, 100% 100% !important;'''
content = content.replace(stray, replacement)

with open(r'd:\Documents\Ngoding\Proyek\OrbStation\OrbitStation\app\badges.css', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed CSS syntax!')
