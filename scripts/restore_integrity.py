import os
import re

def restore_integrity(directory):
    import_regex = re.compile(r'import\s+\{([^}]+)\}\s+from', re.DOTALL)
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find all names currently in curly braces (already restored by previous script)
                imports = import_regex.findall(content)
                imported_names = set()
                for group in imports:
                    parts = re.split(r'[\s,]+', group)
                    for p in parts:
                        p = p.strip()
                        if p and p != 'as' and not p.startswith('_'): # only take the clean names
                            imported_names.add(p)

                if not imported_names:
                    continue

                new_content = content
                changed = False
                for name in imported_names:
                    # Look for _Name in the code
                    # but avoid matching _Name if it's already an alias Name as _Name
                    # actually, if they are already aliases, it's fine.
                    # The issue is when code has <_Badge /> but import is { Badge }
                    old_symbol = f'_{name}'
                    if re.search(r'\b' + re.escape(old_symbol) + r'\b', new_content):
                        # Verify we don't accidentally replace a legitimate local variable 
                        # that happened to be called _Name.
                        # But given the context of the recent "cleaning", it's 99% a broken ref.
                        new_content = re.sub(r'\b' + re.escape(old_symbol) + r'\b', name, new_content)
                        changed = True

                if changed:
                    print(f"Fixed usages in: {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    restore_integrity('src')
