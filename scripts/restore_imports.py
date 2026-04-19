import os
import re

def restore_imports_and_usage(directory):
    # Match named imports: import { ... } from '...'
    import_regex = re.compile(r'import\s+\{([^}]+)\}\s+from\s+[\'"](.+)[\'"]', re.DOTALL)
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                
                # First, find all renamed imports and collect the mapping { _Old: Old }
                matches = import_regex.finditer(content)
                mappings = {}
                
                for match in matches:
                    named_group = match.group(1)
                    parts = re.split(r'(\s*,\s*)', named_group)
                    
                    for part in parts:
                        stripped = part.strip().strip(',')
                        if not stripped:
                            continue
                        
                        if ' as ' in stripped:
                            m = re.match(r'([^\s]+)\s+as\s+([^\s]+)', stripped)
                            if m and m.group(1).startswith('_'):
                                mappings[m.group(1)] = m.group(1)[1:]
                        elif stripped.startswith('_'):
                            mappings[stripped] = stripped[1:]

                if not mappings:
                    continue

                # 1. Update the imports in content
                def fix_named_imports_full(match):
                    named_group = match.group(1)
                    from_source = match.group(2)
                    parts = re.split(r'(\s*,\s*)', named_group)
                    new_parts = []
                    
                    for part in parts:
                        stripped = part.strip().strip(',')
                        if not stripped:
                            new_parts.append(part)
                            continue
                        
                        if stripped in mappings:
                            new_name = mappings[stripped]
                            # If it was an 'as' match, we already handled it in mappings
                            # But wait, mappings[stripped] = stripped[1:] handles both cases
                            new_parts.append(part.replace(stripped, new_name))
                        elif ' as ' in stripped:
                            m = re.match(r'([^\s]+)\s+as\s+([^\s]+)', stripped)
                            if m and m.group(1) in mappings:
                                new_original = mappings[m.group(1)]
                                new_parts.append(part.replace(m.group(1), new_original))
                            else:
                                new_parts.append(part)
                        else:
                            new_parts.append(part)
                    
                    return f'import {{{ "".join(new_parts) }}} from \'{from_source}\''

                new_content = import_regex.sub(fix_named_imports_full, new_content)

                # 2. Update all usages in the rest of the file
                for old_name, new_name in mappings.items():
                    # We use word boundary \b to avoid partial matches
                    # regex: \b_Name\b -> Name
                    usage_regex = re.compile(r'\b' + re.escape(old_name) + r'\b')
                    new_content = usage_regex.sub(new_name, new_content)

                if new_content != content:
                    print(f"Restored imports and usages in: {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    restore_imports_and_usage('src')
