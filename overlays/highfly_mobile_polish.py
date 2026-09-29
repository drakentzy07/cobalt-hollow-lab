from pathlib import Path
import json

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# 1) GitHub Pages PWA: installed app must reopen the project path, not domain /.
# ---------------------------------------------------------------------------
manifest = Path("public/manifest.webmanifest")
data = json.loads(manifest.read_text(encoding="utf-8"))
data["name"] = "HIGHFLY"
data["short_name"] = "HIGHFLY"
data["description"] = "HIGHFLY mobile Hunter realm"
data["start_url"] = "/cobalt-hollow-lab/"
data["scope"] = "/cobalt-hollow-lab/"
for icon in data.get("icons", []):
    src = icon.get("src")
    if isinstance(src, str) and src.startswith("/") and not src.startswith("/cobalt-hollow-lab/"):
        icon["src"] = "/cobalt-hollow-lab" + src
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# ---------------------------------------------------------------------------
# 2) Touch camera: user-approved gesture rule. Moving the finger right/down
#    must move the view right/down. Desktop mouse behaviour stays untouched.
# ---------------------------------------------------------------------------
input_ts = Path("src/game/input.ts")

replace_once(
    input_ts,
    "    this.camYaw += dx * dragSens;\n",
    "    this.camYaw -= dx * dragSens;\n",
    "touch drag horizontal natural direction",
)
replace_once(
    input_ts,
    """      this.camPitch + this.touchPitchSign * dy * dragSens,
""",
    """      this.camPitch - this.touchPitchSign * dy * dragSens,
""",
    "touch drag vertical natural direction",
)
replace_once(
    input_ts,
    """    this.camYaw += this.touchLookVector.x * TOUCH_LOOK_YAW_RATE * this.touchLookSpeed * dt;
""",
    """    this.camYaw -= this.touchLookVector.x * TOUCH_LOOK_YAW_RATE * this.touchLookSpeed * dt;
""",
    "touch look-stick horizontal natural direction",
)
replace_once(
    input_ts,
    """      this.camPitch +
        this.touchPitchSign *
          this.touchLookVector.y *
          TOUCH_LOOK_PITCH_RATE *
          this.touchLookSpeed *
          dt,
""",
    """      this.camPitch -
        this.touchPitchSign *
          this.touchLookVector.y *
          TOUCH_LOOK_PITCH_RATE *
          this.touchLookSpeed *
          dt,
""",
    "touch look-stick vertical natural direction",
)

# ---------------------------------------------------------------------------
# 3) Mobile Offline creator: true app-style fullscreen, above website chrome.
#    Also force the Hunter name field LTR so Samsung/browser bidi heuristics
#    cannot insert the caret on the wrong side and make typing look mirrored.
# ---------------------------------------------------------------------------
css = Path("src/styles/shell.css")
text = css.read_text(encoding="utf-8")
anchor = """    body.mobile-touch #offline-select .char-preview-container {
      height: clamp(180px, 42vh, 240px);
      min-height: 180px;
      flex-shrink: 0;
    }
"""
addition = anchor + """
    /* HIGHFLY RUN0.8.1: Offline character creation is an in-app screen, not a
       card inside the website. Cover the site chrome and consume the landscape
       viewport including safe areas. */
    body.mobile-touch #offline-select {
      position: fixed !important;
      inset: 0 !important;
      z-index: 500 !important;
      box-sizing: border-box;
      width: 100vw !important;
      max-width: none !important;
      height: var(--app-vh) !important;
      max-height: var(--app-vh) !important;
      margin: 0 !important;
      border-radius: 0 !important;
      padding-top: max(8px, env(safe-area-inset-top)) !important;
      padding-right: max(14px, env(safe-area-inset-right)) !important;
      padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
      padding-left: max(14px, env(safe-area-inset-left)) !important;
    }

    body.mobile-touch #offline-select #char-name {
      direction: ltr !important;
      unicode-bidi: plaintext;
      text-align: left !important;
    }
"""
if text.count(anchor) != 1:
    raise SystemExit(f"mobile creator polished anchor: expected 1, found {text.count(anchor)}")
css.write_text(text.replace(anchor, addition), encoding="utf-8")

print("HIGHFLY_MOBILE_POLISH_APPLIED=1")
