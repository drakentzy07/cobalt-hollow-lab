from pathlib import Path
import json
import re

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# HIGHFLY RUN122 — real desktop Training launcher.
# The previous browser gate used DOM .click(); wire the product HUD itself.
# ---------------------------------------------------------------------------
hud = Path("src/ui/hud.ts")
replace_once(
    hud,
    """    $('#mm-talents')?.addEventListener('click', () => this.toggleTalents());
    $('#mm-town-focus')?.addEventListener('click', () => this.toggleTownFocus());
""",
    """    $('#mm-talents')?.addEventListener('click', () => this.toggleTalents());
    $('#mm-training')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('highfly:open-training'));
    });
    $('#mm-town-focus')?.addEventListener('click', () => this.toggleTownFocus());
""",
    "desktop Training HUD wiring",
)

# ---------------------------------------------------------------------------
# PWA/native splash closure.
# The Android video proves the remaining C is the launch-splash app icon, before
# HIGHFLY's own entry art. Keep the app name but make the splash icon transparent.
# ---------------------------------------------------------------------------
public_highfly = Path("public/highfly")
public_highfly.mkdir(parents=True, exist_ok=True)
transparent_svg = public_highfly / "launch-transparent.svg"
transparent_svg.write_text(
    """<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"></svg>\n""",
    encoding="utf-8",
)

manifest_path = Path("public/manifest.webmanifest")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["name"] = "HIGHFLY"
manifest["short_name"] = "HIGHFLY"
manifest["icons"] = [
    {
        "src": "/highfly/launch-transparent.svg?v=122",
        "sizes": "any",
        "type": "image/svg+xml",
        "purpose": "any",
    }
]
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

for html_name in ("index.html", "play.html"):
    html_path = Path(html_name)
    text = html_path.read_text(encoding="utf-8")
    text = re.sub(
        r'(<link\s+rel="manifest"[^>]*\bhref=")[^"]+',
        r'\1/manifest.webmanifest?v=122',
        text,
    )
    html_path.write_text(text, encoding="utf-8")

v31 = Path("android/app/src/main/res/values-v31")
v31.mkdir(parents=True, exist_ok=True)
(v31 / "styles.xml").write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@android:color/black</item>
        <item name="windowSplashScreenBackground">@android:color/black</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/highfly_splash_blank</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
""",
    encoding="utf-8",
)

# ---------------------------------------------------------------------------
# Training UI polish for locked/view-only states and explicit System actions.
# ---------------------------------------------------------------------------
shell = Path("src/styles/shell.css")
css = shell.read_text(encoding="utf-8")
css += r"""

/* ==========================================================================
   HIGHFLY RUN122 — Training authority / one-shot sessions
   ========================================================================== */
#highfly-training-window .hf-training-day.is-view-only {
  opacity: .58;
}
#highfly-training-window .hf-secondary-action {
  margin-top: 10px;
  min-height: 38px;
}
#highfly-training-window .hf-cycle-reset-confirm {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(255,184,82,.45);
  border-radius: 8px;
  background: rgba(33,16,8,.78);
}
#highfly-training-window .hf-cycle-reset-confirm > b {
  letter-spacing: .09em;
  color: #ffd689;
}
#highfly-training-window .hf-cycle-reset-confirm label {
  display: grid;
  gap: 5px;
}
#highfly-training-window #hf-rm-submit-all {
  width: 100%;
  margin-top: 12px;
}
"""
shell.write_text(css, encoding="utf-8")

# Build-time truth gates.
if "highfly:open-training" not in hud.read_text(encoding="utf-8"):
    raise SystemExit("RUN122: desktop Training event missing")
if "launch-transparent.svg?v=122" not in manifest_path.read_text(encoding="utf-8"):
    raise SystemExit("RUN122: transparent PWA launch icon missing")
if not (v31 / "styles.xml").is_file():
    raise SystemExit("RUN122: Android 12 splash override missing")
print("HIGHFLY_RUN122_TRAINING_LOCK_APPLIED=1")
