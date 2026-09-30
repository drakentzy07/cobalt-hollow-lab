from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = Path.cwd()

if not (UPSTREAM / "src").is_dir():
    raise SystemExit("highfly_branding_run1j.py must run from ClaudeCraft upstream checkout")

asset_src = ROOT / "assets" / "highfly"
asset_dst = UPSTREAM / "public" / "ui" / "highfly"
asset_dst.mkdir(parents=True, exist_ok=True)
for name in ("highfly-logo-full.webp", "highfly-mark.webp"):
    src = asset_src / name
    if not src.is_file():
        raise SystemExit(f"missing HIGHFLY branding asset: {src}")
    shutil.copy2(src, asset_dst / name)

def patch_text(path: Path, replacements: list[tuple[str, str]]) -> None:
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text == original:
        print(f"HIGHFLY_BRAND_NOOP={path.as_posix()}")
    path.write_text(text, encoding="utf-8")

brand_replacements = [
    ("World of ClaudeCraft", "HIGHFLY"),
    ("World of Claudecraft", "HIGHFLY"),
    ('content="ClaudeCraft"', 'content="HIGHFLY"'),
    ("/worldofclaudecraft-logo.png", "/ui/highfly/highfly-logo-full.webp"),
    (">Play<", ">Jugar<"),
    (">Enter World<", ">Entrar al mundo<"),
    (">Enter the World<", ">Entrar al mundo<"),
    (">Enter the Realm<", ">Entrar al mundo<"),
    ("Entering the world...", "Entrando al mundo..."),
    ("Loading world...", "Cargando mundo..."),
]

for rel in ("index.html", "play.html"):
    path = UPSTREAM / rel
    if path.is_file():
        patch_text(path, brand_replacements)

# Replace the giant ClaudeCraft gateway art with the user's real HIGHFLY logo.
website_css = UPSTREAM / "src" / "styles" / "shell.website.css"
if website_css.is_file():
    patch_text(
        website_css,
        [("/worldofclaudecraft-logo.png", "/ui/highfly/highfly-logo-full.webp")],
    )
    with website_css.open("a", encoding="utf-8") as fh:
        fh.write(r"""

/* HIGHFLY RUN1-J — visible donor branding/community removal only. */
#community-hud,
#mm-discord,
.uf-discord,
a[href*="discord.com"],
a[href*="discord.gg"],
a[href*="store.steampowered.com"] {
  display: none !important;
}

#intro-logo {
  object-fit: contain !important;
  max-width: min(72vw, 720px) !important;
  filter: drop-shadow(0 0 22px rgba(174, 64, 255, .34));
}
""")

# PWA/application identity.
manifest_path = UPSTREAM / "public" / "manifest.webmanifest"
if manifest_path.is_file():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["name"] = "HIGHFLY"
    manifest["short_name"] = "HIGHFLY"
    manifest["description"] = "HIGHFLY · Entrena. Asciende. Conquista."
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

# Spanish is already ClaudeCraft's own i18n path. Keep it, only remove donor brand
# literals from the Spanish surfaces instead of building a parallel locale system.
for rel in (
    "src/ui/i18n.catalog/shell.ts",
    "src/ui/i18n.locales/es.ts",
    "src/ui/i18n.locales/es_ES.ts",
    "src/ui/i18n.resolved.generated/es.ts",
    "src/ui/i18n.resolved.generated/es_ES.ts",
):
    path = UPSTREAM / rel
    if path.is_file():
        patch_text(
            path,
            [
                ("World of ClaudeCraft", "HIGHFLY"),
                ("World of Claudecraft", "HIGHFLY"),
            ],
        )

# The upstream shell has a few visible community controls outside shell.website.css
# on the in-game HUD. Hide them at the shared shell layer without removing donor code.
shell_css = UPSTREAM / "src" / "styles" / "shell.css"
with shell_css.open("a", encoding="utf-8") as fh:
    fh.write(r"""

/* HIGHFLY RUN1-J — donor community UI is intentionally retained in source but not exposed. */
#community-hud,
#mm-discord,
.uf-discord,
a[href*="discord.com"],
a[href*="discord.gg"],
a[href*="store.steampowered.com"] {
  display: none !important;
}
""")

# Assert the two visible logo seams were actually converted.
index = (UPSTREAM / "index.html").read_text(encoding="utf-8")
if "/ui/highfly/highfly-logo-full.webp" not in index:
    raise SystemExit("HIGHFLY intro logo seam was not patched")
if "World of ClaudeCraft" in index:
    raise SystemExit("visible index.html still contains World of ClaudeCraft")
if not (asset_dst / "highfly-logo-full.webp").is_file():
    raise SystemExit("HIGHFLY full logo was not installed")
if not (asset_dst / "highfly-mark.webp").is_file():
    raise SystemExit("HIGHFLY mark was not installed")

print("HIGHFLY_BRANDING_RUN1J_APPLIED=1")
