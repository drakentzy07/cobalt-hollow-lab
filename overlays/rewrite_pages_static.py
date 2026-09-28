from pathlib import Path

BASE = "/cobalt-hollow-lab"
DIST = Path("dist")
PUBLIC = Path("public")

TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt"}
PREFIXES = ["ui", "audio", "basis", "textures", "fonts"]

root_files = sorted(p.name for p in PUBLIC.iterdir() if p.is_file()) if PUBLIC.exists() else []

def rewrite_text(text: str) -> tuple[str, int]:
    total = 0
    for prefix in PREFIXES:
        replacements = [
            (f'"/{prefix}/', f'"{BASE}/{prefix}/'),
            (f"'/{prefix}/", f"'{BASE}/{prefix}/"),
            (f'`/{prefix}/', f'`{BASE}/{prefix}/'),
            (f"url(/{prefix}/", f"url({BASE}/{prefix}/"),
            (f'url("/{prefix}/', f'url("{BASE}/{prefix}/'),
            (f"url('/{prefix}/", f"url('{BASE}/{prefix}/"),
        ]
        for old, new in replacements:
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                total += count

    for name in root_files:
        replacements = [
            (f'"/{name}', f'"{BASE}/{name}'),
            (f"'/{name}", f"'{BASE}/{name}"),
            (f'`/{name}', f'`{BASE}/{name}'),
            (f"url(/{name}", f"url({BASE}/{name}"),
            (f'url("/{name}', f'url("{BASE}/{name}'),
            (f"url('/{name}", f"url('{BASE}/{name}"),
        ]
        for old, new in replacements:
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                total += count
    return text, total

files_changed = 0
replacements = 0
for path in DIST.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
        continue
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    rewritten, count = rewrite_text(original)
    if count:
        path.write_text(rewritten, encoding="utf-8")
        files_changed += 1
        replacements += count

print(f"Pages static URL rewrite: {replacements} replacements in {files_changed} files")
