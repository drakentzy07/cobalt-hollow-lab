from pathlib import Path

BASE = "/cobalt-hollow-lab"
DIST = Path("dist")
PUBLIC = Path("public")
TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt"}
# Direct public roots only. Hashed media roots (models/textures/env/vfx)
# intentionally remain logical inside bundles and resolve via assetUrl().
PUBLIC_ROOTS = (
    "audio", "basis", "claudium", "fonts", "guide-stills",
    "highfly", "map_art", "map_bg", "ui",
)
PATTERNS = (
    '"{path}',
    "'{path}",
    "`{path}",
    "url({path}",
    'url("{path}',
    "url('{path}",
)
ROOT_FILES = sorted(p.name for p in PUBLIC.iterdir() if p.is_file()) if PUBLIC.exists() else []

hits = []
double_base_hits = []
double_base = f"{BASE}{BASE}/"

for file in DIST.rglob("*"):
    if not file.is_file() or file.suffix.lower() not in TEXT_EXTS:
        continue
    try:
        text = file.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue

    if double_base in text:
        double_base_hits.append(file.as_posix())

    for root in PUBLIC_ROOTS:
        raw = f"/{root}/"
        for pattern in PATTERNS:
            token = pattern.format(path=raw)
            start = 0
            while True:
                idx = text.find(token, start)
                if idx < 0:
                    break
                snippet = text[max(0, idx - 90): idx + 180].replace("\n", " ")
                hits.append((file.as_posix(), raw, snippet))
                start = idx + len(token)

    for name in ROOT_FILES:
        raw = f"/{name}"
        for pattern in PATTERNS:
            token = pattern.format(path=raw)
            start = 0
            while True:
                idx = text.find(token, start)
                if idx < 0:
                    break
                snippet = text[max(0, idx - 90): idx + 180].replace("\n", " ")
                hits.append((file.as_posix(), raw, snippet))
                start = idx + len(token)

if double_base_hits:
    print("HIGHFLY_PAGES_DOUBLE_BASE_FAIL=1")
    for file in double_base_hits[:80]:
        print(file)
    raise SystemExit(f"double project base remains in {len(double_base_hits)} file(s)")

if hits:
    print("HIGHFLY_PAGES_ROOT_AUDIT_FAIL=1")
    for file, raw, snippet in hits[:80]:
        print(f"{file}: {raw} :: {snippet}")
    raise SystemExit(f"unbased direct public URLs remain: {len(hits)}")

print("HIGHFLY_PAGES_ROOT_AUDIT_OK=1")
