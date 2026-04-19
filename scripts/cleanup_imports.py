import os

path = r'c:\PROJETOS\01 FLUXOO\01 fluxoo-edu\src\modules\portal\v2\pages\PortalCobrancasPageV2.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
imports_seen = set()

for line in lines:
    if line.strip().startswith('import { motion, AnimatePresence }'):
        if 'framer-motion' in line:
            if line.strip() in imports_seen:
                print(f"Skipping duplicate: {line.strip()}")
                continue
            imports_seen.add(line.strip())
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
