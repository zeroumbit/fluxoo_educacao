"""
fix_unused_vars.py
Prefix unused variables and parameters with underscore (_)
based on ESLint no-unused-vars JSON output.

Usage:
  python scripts/fix_unused_vars.py

Expects lint-results.json in the project root.
SAFE: Only renames identifiers that ESLint flagged as unused;
does NOT alter control flow, types, or business logic.
"""
import json
import re
import sys
from pathlib import Path

LINT_RESULTS = Path("lint-results.json")
RULE_ID = "@typescript-eslint/no-unused-vars"

def load_results() -> list:
    if not LINT_RESULTS.exists():
        print("[ERROR] lint-results.json not found. Run: npx eslint . --quiet --format json | Out-File -Encoding utf8 lint-results.json")
        sys.exit(1)
    with open(LINT_RESULTS, encoding="utf-8-sig") as f:
        return json.load(f)

def collect_fixes(data: list) -> dict:
    """
    Returns { file_path: [(line, col, identifier)] }
    sorted descending by line then col so we apply from bottom-up.
    """
    fixes: dict = {}
    for file_report in data:
        path = file_report["filePath"]
        entries = []
        for msg in file_report.get("messages", []):
            if msg.get("ruleId") != RULE_ID:
                continue
            # ESLint message text: "'foo' is defined but never used."
            match = re.search(r"'([^']+)'", msg.get("message", ""))
            if not match:
                continue
            identifier = match.group(1)
            # Skip if already prefixed
            if identifier.startswith("_"):
                continue
            entries.append((msg["line"], msg["column"], identifier))
        if entries:
            # Sort bottom-up so offsets don't shift
            entries.sort(key=lambda x: (-x[0], -x[1]))
            fixes[path] = entries
    return fixes

def apply_fix_to_file(path: str, entries: list) -> int:
    """
    Returns the number of replacements made.
    Safe strategy: replace the FIRST occurrence of `identifier`
    on the exact LINE number (1-indexed), with word-boundary matching.
    """
    p = Path(path)
    if not p.exists():
        print(f"  [SKIP] File not found: {path}")
        return 0

    lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
    count = 0

    for line_no, _col, identifier in entries:
        idx = line_no - 1  # 0-indexed
        if idx >= len(lines):
            continue
        original = lines[idx]
        # Word-boundary replace; only replaces the FIRST standalone occurrence
        pattern = rf"\b{re.escape(identifier)}\b"
        # Avoid renaming if it appears in a string literal (heuristic)
        if identifier in ('"', "'"):
            continue
        new_line, n = re.subn(pattern, f"_{identifier}", original, count=1)
        if n:
            lines[idx] = new_line
            count += 1

    p.write_text("".join(lines), encoding="utf-8")
    return count

def main():
    data = load_results()
    fixes = collect_fixes(data)

    if not fixes:
        print("No unused-var fixes needed.")
        return

    total_files = 0
    total_fixes = 0
    for path, entries in fixes.items():
        n = apply_fix_to_file(path, entries)
        if n:
            print(f"  Fixed {n} variable(s) in: {Path(path).name}")
            total_files += 1
            total_fixes += n

    print(f"\nDone. {total_fixes} rename(s) across {total_files} file(s).")
    print("Run 'npm run lint' again to verify.")

if __name__ == "__main__":
    main()
