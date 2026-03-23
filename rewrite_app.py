import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
has_lazy = False

for i in range(len(lines)):
    line = lines[i]
    if 'import { BrowserRouter, Routes, Route, Navigate }' in line and not has_lazy:
        new_lines.append('import { Suspense, lazy } from "react"\n')
        new_lines.append(line)
        has_lazy = True
        continue
    
    if line.startswith('// Pages -') or line.startswith('// Novas Páginas -'):
        new_lines.append(line)
        continue

    # matches standard pages importing
    match = re.search(r'^import\s+\{\s*([a-zA-Z0-9_]+)\s*\}\s+from\s+[\'"](.+)[\'"]', line)
    if match and ('pages' in line or '/v2/pages' in line):
        comp = match.group(1)
        path = match.group(2)
        new_lines.append(f"const {comp} = lazy(() => import('{path}').then(m => ({{ default: m.{comp} }})))\n")
        continue

    match_default = re.search(r'^import\s+([a-zA-Z0-9_]+)\s+from\s+[\'"](.+)[\'"]', line)
    if match_default and ('pages' in line or '/v2/pages' in line) and 'CookieConsent' not in line:
        comp = match_default.group(1)
        path = match_default.group(2)
        new_lines.append(f"const {comp} = lazy(() => import('{path}'))\n")
        continue

    # We need to wrap Routes with suspense
    if '          <Routes>' in line:
        new_lines.append('          <Suspense fallback={\n')
        new_lines.append('            <div className="flex h-[60vh] items-center justify-center">\n')
        new_lines.append('              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />\n')
        new_lines.append('            </div>\n')
        new_lines.append('          }>\n')
        new_lines.append(line)
        continue

    if '</Routes>' in line:
        new_lines.append(line)
        new_lines.append('          </Suspense>\n')
        continue

    new_lines.append(line)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done rewrite")
