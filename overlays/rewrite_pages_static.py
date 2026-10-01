from hashlib import sha256
from pathlib import Path, PurePosixPath

BASE = "/cobalt-hollow-lab"
DIST = Path("dist")
PUBLIC = Path("public")

TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt"}
PREFIXES = ["ui", "audio", "basis", "textures", "fonts", "claudium", "guide-stills", "map_art", "map_bg"]
MEDIA_ROOTS = ("models", "textures", "env", "vfx")
MEDIA_EXTS = {".glb", ".fbx", ".hdr", ".jpg", ".jpeg", ".png", ".webp", ".ktx2"}
HASH_LEN = 12

root_files = sorted(p.name for p in PUBLIC.iterdir() if p.is_file()) if PUBLIC.exists() else []


def media_map() -> dict[str, str]:
    mapping: dict[str, str] = {}
    for root_name in MEDIA_ROOTS:
        root = PUBLIC / root_name
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in MEDIA_EXTS:
                continue
            logical = path.relative_to(PUBLIC).as_posix()
            parsed = PurePosixPath(logical)
            digest = sha256(path.read_bytes()).hexdigest()[:HASH_LEN]
            hashed_name = f"{parsed.stem}.{digest}{parsed.suffix}"
            hashed_rel = (PurePosixPath("media") / parsed.parent / hashed_name).as_posix()
            mapping[logical] = f"{BASE}/{hashed_rel}"
    return mapping


MEDIA_MAP = media_map()


def rewrite_exact_media(text: str) -> tuple[str, int]:
    total = 0
    # Some ClaudeCraft code paths still reference public media directly instead
    # of going through assetUrl(). Production prune removes those originals, so
    # translate literal references to the exact hashed copy emitted in dist/media.
    for logical, target in MEDIA_MAP.items():
        source = f"/{logical}"
        replacements = [
            (f'"{source}', f'"{target}'),
            (f"'{source}", f"'{target}"),
            (f'`{source}', f'`{target}'),
            (f"url({source}", f"url({target}"),
            (f'url("{source}', f'url("{target}'),
            (f"url('{source}", f"url('{target}"),
        ]
        for old, new in replacements:
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                total += count
    return text, total


def rewrite_text(text: str) -> tuple[str, int]:
    text, total = rewrite_exact_media(text)

    # Non-media public files still live at their original path under dist.
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

print(
    f"Pages static URL rewrite: {replacements} replacements in {files_changed} files; "
    f"{len(MEDIA_MAP)} hashed media assets indexed"
)
