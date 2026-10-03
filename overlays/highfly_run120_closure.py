from pathlib import Path
import json
import re
import shutil

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# 1) Transparent HIGHFLY browser/PWA branding.
# ---------------------------------------------------------------------------
public_highfly = Path("public/highfly")
public_highfly.mkdir(parents=True, exist_ok=True)
official = Path("../branding/highfly-logo-official.webp")
if not official.is_file() or official.stat().st_size < 1000:
    raise SystemExit("RUN120: missing valid transparent HIGHFLY official logo")
shutil.copyfile(official, public_highfly / "highfly-logo-official.webp")

for html_name in ("index.html", "play.html"):
    html_path = Path(html_name)
    html = html_path.read_text(encoding="utf-8")
    html = re.sub(
        r'(<link\s+rel="icon"[^>]*\bhref=")[^"]+',
        r'\1/highfly/highfly-logo-official.webp?v=120',
        html,
    )
    html = re.sub(
        r'(<link\s+rel="apple-touch-icon"[^>]*\bhref=")[^"]+',
        r'\1/highfly/highfly-logo-official.webp?v=120',
        html,
    )
    html_path.write_text(html, encoding="utf-8")

manifest_path = Path("public/manifest.webmanifest")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["name"] = "HIGHFLY"
manifest["short_name"] = "HIGHFLY"
for icon in manifest.get("icons", []):
    icon["src"] = "/highfly/highfly-logo-official.webp?v=120"
    icon["type"] = "image/webp"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# ---------------------------------------------------------------------------
# 2) Android native pre-WebView splash: never flash the donor C.
# ---------------------------------------------------------------------------
styles = Path("android/app/src/main/res/values/styles.xml")
styles_text = styles.read_text(encoding="utf-8")
old_launch = """    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>"""
new_launch = """    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@android:color/black</item>
        <item name="windowSplashScreenBackground">@android:color/black</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/highfly_splash_blank</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>"""
if styles_text.count(old_launch) != 1:
    raise SystemExit("RUN120: Android launch-theme anchor mismatch")
styles.write_text(styles_text.replace(old_launch, new_launch), encoding="utf-8")

blank = Path("android/app/src/main/res/drawable/highfly_splash_blank.xml")
blank.write_text("""<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#00000000" />
    <size android:width="1dp" android:height="1dp" />
</shape>
""", encoding="utf-8")

strings = Path("android/app/src/main/res/values/strings.xml")
strings_text = strings.read_text(encoding="utf-8")
strings_text = strings_text.replace(
    '<string name="app_name">World of ClaudeCraft</string>',
    '<string name="app_name">HIGHFLY</string>',
)
strings_text = strings_text.replace(
    '<string name="title_activity_main">World of ClaudeCraft</string>',
    '<string name="title_activity_main">HIGHFLY</string>',
)
strings.write_text(strings_text, encoding="utf-8")

capacitor = Path("capacitor.config.ts")
capacitor_text = capacitor.read_text(encoding="utf-8")
if "appName: 'World of ClaudeCraft'" in capacitor_text:
    capacitor_text = capacitor_text.replace("appName: 'World of ClaudeCraft'", "appName: 'HIGHFLY'")
capacitor.write_text(capacitor_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# 3) Desktop creator: deterministic live preview on actual panel-open lifecycle.
# ---------------------------------------------------------------------------
main = Path("src/main.ts")
main_text = main.read_text(encoding="utf-8")
preview_fix = """

// HIGHFLY RUN120: the offline creator is the product path on desktop and mobile.
// Re-seat its shared preview when the panel ACTUALLY becomes visible. This is a
// DOM lifecycle observer, not a timer/retry lottery.
async function highflyRun120EnsureOfflinePreview(): Promise<void> {
  const panel = document.getElementById('offline-select');
  if (!panel || panel.hasAttribute('hidden')) return;
  const selected = document.querySelector('#offline-select .mini-class.sel') as HTMLElement | null;
  const cls = (selected?.dataset.class as PlayerClass | undefined) ?? 'warrior';
  try {
    await ensureHighflyPreviewClassReady(cls);
    const container = document.getElementById('offline-preview-container');
    const canvas = document.getElementById('char-preview-canvas') as HTMLCanvasElement | null;
    if (!(container instanceof HTMLElement) || !canvas) return;
    if (!characterPreview) {
      characterPreview = new CharacterPreview(container, canvas, {
        constrainedMemory: GFX.constrainedMemory,
      });
    }
    if (canvas.parentElement !== container) characterPreview.setContainer(container);
    const look = modularLookForClass(cls);
    if (look) characterPreview.setModular(look.app, look.worn, cls);
    else characterPreview.setClass(cls);
    characterPreview.setSkin(selectedSkin('#offline-skin-row', offlineSkin));
    characterPreview.setFraming('sheet');
    characterPreview.syncSize();
    characterPreview.armOpen();
  } catch (err) {
    console.error('[HIGHFLY RUN120] desktop creator preview failed', err);
  }
}

const highflyRun120OfflinePanel = document.getElementById('offline-select');
if (highflyRun120OfflinePanel) {
  const highflyRun120PreviewObserver = new MutationObserver(() => {
    if (!highflyRun120OfflinePanel.hasAttribute('hidden')) {
      void highflyRun120EnsureOfflinePreview();
    }
  });
  highflyRun120PreviewObserver.observe(highflyRun120OfflinePanel, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
}
"""
if "highflyRun120EnsureOfflinePreview" in main_text:
    raise SystemExit("RUN120 creator preview already applied")
main.write_text(main_text + preview_fix, encoding="utf-8")

preview = Path("src/render/characters/preview.ts")
preview_text = preview.read_text(encoding="utf-8")
render_line = "this.renderer.render(this.scene, this.camera);"
render_count = preview_text.count(render_line)
if render_count < 2:
    raise SystemExit(f"RUN120 preview render marker expected >=2 render sites, found {render_count}")
preview_text = preview_text.replace(
    render_line,
    render_line + "\n    this.canvas.dataset.highflyPreviewFrame = String(performance.now());",
)
preview.write_text(preview_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# 4) Creator class card: donor base primary stats are not Hunter Core.
# ---------------------------------------------------------------------------
main_text = main.read_text(encoding="utf-8")
lore_pattern = re.compile(r'(<p class="class-details-lore">[^\n]*</p>)')
matches = lore_pattern.findall(main_text)
if len(matches) != 1:
    raise SystemExit(f"RUN120 creator lore anchor expected 1, found {len(matches)}")
origin_note = """<div class="highfly-core-origin-note">
          <b>HUNTER CORE · 0 / 0 / 0 / 0 / 0</b>
          <span>STR · AGI · VIT · PER · INT se activan únicamente mediante entrenamiento real.</span>
        </div>"""
main_text = lore_pattern.sub(lambda m: m.group(1) + "\n        " + origin_note, main_text, count=1)
main.write_text(main_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# 5) Tutorial mobile: keep the coach one-shot/contextual, but point to real UI.
# The central prompt stays pointer-transparent; real More/Bags/item controls glow.
# ---------------------------------------------------------------------------
bootcamp = Path("src/ui/bootcamp.ts")
boot = bootcamp.read_text(encoding="utf-8")
old_bag = """    const bagItem = (finalVerbKey: TranslationKey): { caps: readonly string[]; verb: string } => {
      if (!padSource) {
        return { caps: key('bags'), verb: t('hudChrome.bootcamp.promptOpenBags') };
      }
      const guidance = liveTutorialBagControllerGuidance(targetBagItem);
      return {
        caps: gamepadControlHint(padSource, {
          type: 'bagItem',
          step: guidance.step,
        }),
        verb: tutorialBagControllerVerb(
          guidance.step,
          targetBagItem,
          finalVerbKey,
          guidance.blockingWindowCloseLabel,
        ),
      };
    };"""
new_bag = """    const bagItem = (finalVerbKey: TranslationKey): { caps: readonly string[]; verb: string } => {
      if (mode === 'touch') {
        const bagsEl = document.getElementById('bags');
        const bagsOpen = bagsEl !== null && bagsWindowShown(bagsEl.style.display);
        if (!bagsOpen) return { caps: [], verb: 'MENÚ → BOLSAS' };
        if (targetBagItem) {
          return {
            caps: [],
            verb: t('hudChrome.bootcamp.promptSelectItem', {
              item: tEntity({ kind: 'item', id: targetBagItem, field: 'name' }),
            }),
          };
        }
        return { caps: [], verb: t(finalVerbKey) };
      }
      if (!padSource) {
        return { caps: key('bags'), verb: t('hudChrome.bootcamp.promptOpenBags') };
      }
      const guidance = liveTutorialBagControllerGuidance(targetBagItem);
      return {
        caps: gamepadControlHint(padSource, {
          type: 'bagItem',
          step: guidance.step,
        }),
        verb: tutorialBagControllerVerb(
          guidance.step,
          targetBagItem,
          finalVerbKey,
          guidance.blockingWindowCloseLabel,
        ),
      };
    };"""
if boot.count(old_bag) != 1:
    raise SystemExit(f"RUN120 tutorial bag anchor mismatch: {boot.count(old_bag)}")
bootcamp.write_text(boot.replace(old_bag, new_bag), encoding="utf-8")

# ---------------------------------------------------------------------------
# 6) UI polish: RM panel, creator Core note, deterministic preview visibility.
# ---------------------------------------------------------------------------
shell = Path("src/styles/shell.css")
shell_text = shell.read_text(encoding="utf-8")
shell_text += r"""

/* ==========================================================================
   HIGHFLY RUN120 — calibration + creator closure
   ========================================================================== */
#offline-preview-container #char-preview-canvas,
#charcreate-preview-container #char-preview-canvas {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.class-details-stats-col {
  display: none !important;
}

.highfly-core-origin-note {
  display: grid;
  gap: 4px;
  margin: 10px 0 14px;
  padding: 10px 12px;
  border: 1px solid rgba(86,224,255,.30);
  border-radius: 6px;
  background: rgba(6,18,30,.72);
}
.highfly-core-origin-note b {
  color: #dff9ff;
  letter-spacing: .07em;
}
.highfly-core-origin-note span {
  color: rgba(222,242,255,.72);
  font-size: 12px;
}

#highfly-training-window .hf-athlete-calibration {
  display: grid;
  grid-template-columns: repeat(3, minmax(130px, 1fr));
  gap: 10px;
  margin: 12px 0;
}
#highfly-training-window .hf-athlete-calibration label,
#highfly-training-window .hf-rm-inputs label {
  display: grid;
  gap: 4px;
}
#highfly-training-window .hf-rm-rule {
  display: block;
  margin: 0 0 12px;
  color: rgba(222,242,255,.68);
}
#highfly-training-window .hf-rm-message {
  margin: 8px 0 12px;
  padding: 9px 11px;
  border: 1px solid rgba(86,224,255,.28);
  border-radius: 6px;
  background: rgba(16,47,64,.45);
}
#highfly-training-window .hf-rm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 10px;
}
#highfly-training-window .hf-rm-card {
  padding: 11px;
  border: 1px solid rgba(86,224,255,.20);
  border-radius: 7px;
  background: rgba(5,15,27,.78);
}
#highfly-training-window .hf-rm-card.is-evaluation {
  border-color: rgba(255,184,82,.58);
}
#highfly-training-window .hf-rm-card__head,
#highfly-training-window .hf-rm-authority {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
#highfly-training-window .hf-rm-card__head span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .08em;
}
#highfly-training-window .hf-rm-authority {
  margin: 8px 0;
}
#highfly-training-window .hf-rm-authority small {
  text-align: right;
}
#highfly-training-window .hf-rm-inputs {
  display: grid;
  grid-template-columns: 1fr .75fr 1.2fr;
  gap: 8px;
  align-items: end;
}
#highfly-training-window .hf-rm-inputs button {
  min-height: 40px;
}

@media (max-width: 900px) {
  #highfly-training-window .hf-rm-grid {
    grid-template-columns: 1fr;
  }
  #highfly-training-window .hf-athlete-calibration {
    grid-template-columns: repeat(3, minmax(105px, 1fr));
  }
}
"""
shell.write_text(shell_text, encoding="utf-8")

# Strong build-time sentinels.
if "highflyRun120EnsureOfflinePreview" not in main.read_text(encoding="utf-8"):
    raise SystemExit("RUN120 desktop preview closure missing")
if "MENÚ → BOLSAS" not in bootcamp.read_text(encoding="utf-8"):
    raise SystemExit("RUN120 contextual tutorial guidance missing")
if "windowSplashScreenAnimatedIcon" not in styles.read_text(encoding="utf-8"):
    raise SystemExit("RUN120 Android blank splash icon missing")
if not (public_highfly / "highfly-logo-official.webp").is_file():
    raise SystemExit("RUN120 official transparent logo missing")

print("HIGHFLY_RUN120_CLOSURE_APPLIED=1")
