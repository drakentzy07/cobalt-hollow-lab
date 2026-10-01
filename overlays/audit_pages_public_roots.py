from pathlib import Path

BASE = "/cobalt-hollow-lab"
DIST = Path("dist")
TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt"}
PUBLIC_ROOTS = (
    "audio", "basis", "claudium", "env", "fonts", "guide-stills",
    "map_art", "map_bg", "models", "textures", "ui", "vfx",
)
PATTERNS = (
    '"{path}',
    "'{path}",
    "`{path}",
    "url({path}",
    'url("{path}',
    "url('{path}",
)

hits = []
for file in DIST.rglob("*"):
    if not file.is_file() or file.suffix.lower() not in TEXT_EXTS:
        continue
    try:
        text = file.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for root in PUBLIC_ROOTS:
        raw = f"/{root}/"
        based = f"{BASE}/{root}/"
        for pattern in PATTERNS:
            token = pattern.format(path=raw)
            start = 0
            while True:
                idx = text.find(token, start)
                if idx < 0:
                    break
                # A correctly based URL contains the raw root later in the string,
                # but does not start with the literal token itself.
                snippet = text[max(0, idx - 90): idx + 180].replace("\n", " ")
                if based not in snippet:
                    hits.append((file.as_posix(), root, snippet))
                start = idx + len(token)

if hits:
    print("HIGHFLY_PAGES_ROOT_AUDIT_FAIL=1")
    for file, root, snippet in hits[:80]:
        print(f"{file}: /{root}/ :: {snippet}")
    raise SystemExit(f"unbased public-root URLs remain: {len(hits)}")

print("HIGHFLY_PAGES_ROOT_AUDIT_OK=1")
