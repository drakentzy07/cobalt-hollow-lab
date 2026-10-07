from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

# ---------------------------------------------------------------------------
# A — More tray: source authority, not a runtime interception.
# The existing first tile becomes AJUSTES and routes through the SAME native
# Options callback already used by the menu action.
# ---------------------------------------------------------------------------
mobile = Path("src/game/mobile_controls.ts")
replace_once(
    mobile,
    """    this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());""",
    """    this.bindButton('mobile-bar-editor', () => this.callbacks.onMenu());""",
    "C2.7 mobile settings native callback",
)

old_button = """<button type="button" class="mobile-btn" id="mobile-bar-editor" data-i18n-title="hudChrome.mobile.barEditorAria" data-i18n-aria="hudChrome.mobile.barEditorAria" title="Edit the action bar layout" aria-label="Edit the action bar layout" data-icon="swap"><span class="mobile-label" data-i18n="hudChrome.mobile.barEditor">Edit Bars</span></button>"""
new_button = """<button type="button" class="mobile-btn" id="mobile-bar-editor" title="Ajustes" aria-label="Ajustes" data-icon="menu"><span class="mobile-label">Ajustes</span></button>"""

for html_name in ("index.html", "play.html"):
    html = Path(html_name)
    replace_once(html, old_button, new_button, f"C2.7 Ajustes tile {html_name}")
    text = html.read_text(encoding="utf-8")
    preload = '<link rel="preload" as="image" href="/textures/loading/eastbrook-square.webp" fetchpriority="high" />'
    if preload not in text:
        anchor = '<link rel="manifest" href="/manifest.webmanifest" />'
        if text.count(anchor) != 1:
            raise SystemExit(f"C2.7 loading preload anchor {html_name}: expected 1, found {text.count(anchor)}")
        text = text.replace(anchor, anchor + "\n" + preload, 1)
        html.write_text(text, encoding="utf-8")

# ---------------------------------------------------------------------------
# B — Android/phone creator: stream heavy mobs after entry just like the
# existing iOS constrained path. They are not needed by creator/spawn and
# renderer already has fail-soft view retries for their late arrival.
# ---------------------------------------------------------------------------
assets = Path("src/render/characters/assets.ts")
replace_once(
    assets,
    """      (profile.iosMemoryProfile && STREAMED_URL_PREFIXES.some((prefix) => url.includes(prefix))),""",
    """      ((profile.iosMemoryProfile || profile.constrainedMemory) &&
        STREAMED_URL_PREFIXES.some((prefix) => url.includes(prefix))),""",
    "C2.7 constrained mobile creature streaming",
)

print("HIGHFLY_GAME_C27_HUMAN_RED_REPAIR_APPLIED=1")
