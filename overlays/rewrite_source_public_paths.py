from pathlib import Path

BASE = "/cobalt-hollow-lab"
ROOTS = [Path("src")]
ROOT_FILES = [Path("index.html"), Path("play.html"), Path("admin.html"), Path("guide.html"), Path("editor.html")]
TEXT_EXTS = {".ts", ".tsx", ".js", ".mjs", ".css", ".html"}
PREFIXES = ("ui", "audio", "basis", "fonts", "claudium", "guide-stills", "map_art", "map_bg")

changed_files = 0
replacements = 0

def rewrite(text: str) -> tuple[str, int]:
    total = 0
    for prefix in PREFIXES:
        variants = [
            (f'"/{prefix}/', f'"{BASE}/{prefix}/'),
            (f"'/{prefix}/", f"'{BASE}/{prefix}/"),
            (f'`/{prefix}/', f'`{BASE}/{prefix}/'),
            (f"url(/{prefix}/", f"url({BASE}/{prefix}/"),
            (f'url("/{prefix}/', f'url("{BASE}/{prefix}/'),
            (f"url('/{prefix}/", f"url('{BASE}/{prefix}/"),
        ]
        for old, new in variants:
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                total += count
    return text, total

paths = []
for root in ROOTS:
    if root.exists():
        paths.extend(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in TEXT_EXTS)
paths.extend(p for p in ROOT_FILES if p.exists())

for path in paths:
    original = path.read_text(encoding="utf-8")
    rewritten, count = rewrite(original)
    if count:
        path.write_text(rewritten, encoding="utf-8")
        changed_files += 1
        replacements += count

print(f"HIGHFLY_SOURCE_PUBLIC_PATHS_OK=1 files={changed_files} replacements={replacements}")
