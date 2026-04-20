import os

def find_non_printable(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.css', '.html', '.json', '.js', '.cjs')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f:
                        content = f.read()
                        # Look for backspaces (\x08) or other non-printable chars (except \n, \r, \t)
                        for i, char in enumerate(content):
                            if char < 32 and char not in [8, 9, 10, 13]: # 8 is backspace
                                pass # we mainly care about backspaces if they were introduced
                            if char == 8:
                                print(f"Found backspace in {path} at pos {i}")
                except Exception as e:
                    print(f"Error reading {path}: {e}")

if __name__ == "__main__":
    find_non_printable('src')
