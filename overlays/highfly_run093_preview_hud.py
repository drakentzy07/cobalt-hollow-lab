from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
assets = Path("src/render/characters/assets.ts")
preview = Path("src/render/characters/preview.ts")
css = Path("src/styles/hud.mobile.css")

# ---------------------------------------------------------------------------
# P0 creator preview — selected-visual readiness.
#
# Load only the selected class body, animation donors and visible weapons.
# This avoids waiting for every eager ClaudeCraft character GLB on cold mobile.
# ---------------------------------------------------------------------------
insert_before = """/** Resolve once every boot-time character GLB + skin atlas is cached, retrying"""
assets_text = assets.read_text(encoding="utf-8")
if insert_before not in assets_text:
    raise SystemExit("selected preview readiness insertion point missing")
preview_ready = r"""
/** Ensure only the GLBs required to construct one preview visual are resident. */
export async function previewVisualReady(
  visualKey: string,
  weaponItemId: string | null = null,
  offhandItemId: string | null = null,
  maxAttempts = 3,
): Promise<void> {
  const def = VISUALS[visualKey];
  if (!def) throw new Error('unknown preview visual key: ' + visualKey);

  const required = new Set<string>();
  const add = (url: string | null | undefined) => {
    if (url) required.add(assetUrl(url));
  };
  add(def.url);
  for (const url of def.animUrls ?? []) add(url);
  for (const att of visibleAttachmentsForGraphics(def)) add(att.url);
  add(itemWeaponModelUrl(weaponItemId));
  add(itemOffhandModelUrl(offhandItemId));

  const urls = [...required];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const missing = urls.filter((url) => !gltfByUrl.has(url));
    if (missing.length === 0) return;
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, gltfRetryDelayMs(attempt)));
    }
    const results = await Promise.allSettled(missing.map((url) => prepareCharacterUrl(url)));
    if (attempt === maxAttempts) {
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error('selected preview assets failed to load (' + failed.length + '): ' + failed.map((f) => String(f.reason)).join('; '));
      }
    }
  }
}

"""
assets.write_text(assets_text.replace(insert_before, preview_ready + insert_before), encoding="utf-8")

replace_once(
    main,
    """import {
  charactersReady,
  ensureCharacterUrl,
  modularCacheStats,
  preloadMechAssets,
  startStreamedCharacterPreloads,
} from './render/characters/assets';
import { skinCount, weaponSkinModelUrl } from './render/characters/manifest';""",
    """import {
  charactersReady,
  ensureCharacterUrl,
  modularCacheStats,
  preloadMechAssets,
  previewVisualReady,
  startStreamedCharacterPreloads,
} from './render/characters/assets';
import {
  modularVisualKey,
  skinCount,
  weaponSkinModelUrl,
} from './render/characters/manifest';""",
    "selected preview readiness imports",
)

replace_once(
    main,
    """function previewClassBody(cls: PlayerClass): void {
  if (!characterPreview) return;
  const look = modularLookForClass(cls);
  if (look) characterPreview.setModular(look.app, look.worn, cls);
  else characterPreview.setClass(cls);
}""",
    """let highflyPreviewClassRequest = 0;

async function ensureHighflyPreviewClassReady(cls: PlayerClass): Promise<void> {
  const classDef = CLASSES[cls];
  await previewVisualReady(
    modularVisualKey(cls),
    classDef.startWeapon ?? null,
    classDef.startOffhand ?? null,
    3,
  );
}

function previewClassBody(cls: PlayerClass): void {
  if (!characterPreview) return;
  const request = ++highflyPreviewClassRequest;
  void ensureHighflyPreviewClassReady(cls)
    .then(() => {
      if (!characterPreview || request !== highflyPreviewClassRequest) return;
      const look = modularLookForClass(cls);
      if (look) characterPreview.setModular(look.app, look.worn, cls);
      else characterPreview.setClass(cls);
    })
    .catch((err: unknown) => {
      console.error('[HIGHFLY preview] selected class assets failed', cls, err);
    });
}""",
    "selected class preview gate",
)

replace_once(
    main,
    "      await charactersReady(5);",
    "      await ensureHighflyPreviewClassReady(cls);",
    "offline preview uses selected assets",
)

replace_once(
    main,
    """      if (container && canvas) {
        characterPreview = new CharacterPreview(container, canvas, {
          // GFX.constrainedMemory covers every iOS WebKit host (Safari and other iOS
          // browsers, not just the packaged app) plus the general touch/coarse-pointer
          // detector, not just NATIVE_APP: the launcher's char-select preview sits in the
          // same entry-allocation window the boot preload defers/streams for
          // (assets/preload.ts: "a 12 GB iPhone 17 Pro was killed 1.6s into the LAUNCHER").
          constrainedMemory: GFX.constrainedMemory,
        });""",
    """      if (container && canvas) {
        if (!characterPreview) {
          characterPreview = new CharacterPreview(container, canvas, {
            // GFX.constrainedMemory covers every iOS WebKit host (Safari and other iOS
            // browsers, not just the packaged app) plus the general touch/coarse-pointer
            // detector, not just NATIVE_APP: the launcher's char-select preview sits in the
            // same entry-allocation window the boot preload defers/streams for
            // (assets/preload.ts: "a 12 GB iPhone 17 Pro was killed 1.6s into the LAUNCHER").
            constrainedMemory: GFX.constrainedMemory,
          });
        } else if (canvas.parentElement !== container) {
          characterPreview.setContainer(container);
        }""",
    "global preview must not recreate fast preview",
)

preview_text = preview.read_text(encoding="utf-8")
old_preview = """    this.currentVisualSig = null;

    try {
      this.currentVisual = new CharacterVisual("""
new_preview = """    this.currentVisualSig = null;
    delete this.canvas.dataset.highflyPreviewVisual;

    try {
      this.currentVisual = new CharacterVisual("""
if preview_text.count(old_preview) != 1:
    raise SystemExit("preview visual marker start mismatch")
preview_text = preview_text.replace(old_preview, new_preview)
old_ready = """      this.currentVisualSig = nextSig;
      this.characterGroup.add(this.currentVisual.root);
      // Re-apply the persisted weapon-skin cosmetic"""
new_ready = """      this.currentVisualSig = nextSig;
      this.characterGroup.add(this.currentVisual.root);
      this.canvas.dataset.highflyPreviewVisual = visualKey;
      // Re-apply the persisted weapon-skin cosmetic"""
if preview_text.count(old_ready) != 1:
    raise SystemExit("preview visual marker ready mismatch")
preview_text = preview_text.replace(old_ready, new_ready)
old_fail = """    } catch (err) {
      console.error(`Failed to load preview character visual for ${visualKey}:`, err);
    }"""
new_fail = """    } catch (err) {
      delete this.canvas.dataset.highflyPreviewVisual;
      console.error(`Failed to load preview character visual for ${visualKey}:`, err);
    }"""
if preview_text.count(old_fail) != 1:
    raise SystemExit("preview visual marker fail mismatch")
preview.write_text(preview_text.replace(old_fail, new_fail), encoding="utf-8")

# ---------------------------------------------------------------------------
# P0 creator preview — deterministic lifecycle, no timer lottery.
#
# CharacterPreview already owns a ResizeObserver and parks/wakes its render loop
# from real container geometry. RUN0.9.1 added 180/520/1400ms retries around that
# lifecycle; on the S23 those retries could race WebGL warmup / viewport chrome.
# Mount once, arm once, and let the actual ResizeObserver + context restoration
# drive recovery.
# ---------------------------------------------------------------------------
old = """      let previewArmed = false;
      const settlePreview = () => {
        if (!characterPreview) return;

        // Re-parent only when the canvas is genuinely elsewhere. Calling
        // setContainer repeatedly resizes the renderer and clears WebGL's draw
        // buffer, which is exactly what blanked the creator on the S23 Ultra.
        if (canvas.parentElement !== container) characterPreview.setContainer(container);
        canvas.hidden = false;
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';

        characterPreview.setFraming('sheet');
        previewClassBody(cls);
        characterPreview.setSkin(selectedSkin('#offline-skin-row', offlineSkin));
        characterPreview.syncSize();

        // Arm the cold-open gate once. Later layout retries only sync size;
        // they never restart/clear a preview that has already begun revealing.
        if (!previewArmed) {
          previewArmed = true;
          characterPreview.armOpen();
        }
      };

      // Samsung/Chrome changes visualViewport while the fullscreen creator
      // settles. Keep bounded size retries, without re-creating/re-parenting.
      settlePreview();
      requestAnimationFrame(() => requestAnimationFrame(settlePreview));
      window.setTimeout(settlePreview, 180);
      window.setTimeout(settlePreview, 520);
      window.setTimeout(settlePreview, 1400);
      syncPreviewAfterPanelLayout();
"""
new = """      const mountPreview = () => {
        if (!characterPreview) return;
        if (canvas.parentElement !== container) characterPreview.setContainer(container);
        canvas.hidden = false;
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        characterPreview.setFraming('sheet');
        previewClassBody(cls);
        characterPreview.setSkin(selectedSkin('#offline-skin-row', offlineSkin));
        characterPreview.syncSize();
        characterPreview.armOpen();
      };

      // CharacterPreview already observes its live container. Do one real mount
      // after the creator is visible; every subsequent geometry change wakes via
      // that ResizeObserver instead of arbitrary 180/520/1400 ms guesses.
      mountPreview();

      // A genuine WebGL context restoration is the one non-layout event that
      // needs an explicit re-seat. Bind it once to the shared canvas.
      if (canvas.dataset.highflyPreviewRecoveryBound !== '1') {
        canvas.dataset.highflyPreviewRecoveryBound = '1';
        canvas.addEventListener('webglcontextrestored', () => {
          if (!characterPreview || canvas.parentElement !== container) return;
          characterPreview.syncSize();
          characterPreview.armOpen();
          console.info('[HIGHFLY preview] WebGL context restored', {
            css: [container.clientWidth, container.clientHeight],
            buffer: [canvas.width, canvas.height],
          });
        });
        canvas.addEventListener('webglcontextlost', () => {
          console.warn('[HIGHFLY preview] WebGL context lost');
        });
      }

      const rect = container.getBoundingClientRect();
      const gl = canvas.getContext('webgl2');
      console.info('[HIGHFLY preview] mounted', {
        connected: canvas.isConnected,
        container: [Math.round(rect.width), Math.round(rect.height)],
        buffer: [canvas.width, canvas.height],
        contextLost: gl?.isContextLost() ?? null,
      });
      syncPreviewAfterPanelLayout();
"""
replace_once(main, old, new, "deterministic creator preview")

addition = r"""

/* ==========================================================================
   HIGHFLY RUN0.9.3 — PHASE 0 PREVIEW + HUD
   Preserve approved movement/camera/action cluster. Only re-seat the requested
   top chrome: Hunter menu below frame and minimap/compass slightly higher.
   ========================================================================== */
@media (orientation: landscape) {
  /* Three-dot System/More trigger: directly below the Hunter identity frame,
     left aligned with it. The target/party stack moves below this seat so a
     selected enemy can never cover the button. */
  body.mobile-touch #mobile-combat-controls {
    position: fixed !important;
    left: max(22px, calc(env(safe-area-inset-left) + 4px)) !important;
    right: auto !important;
    top: calc(max(16px, env(safe-area-inset-top)) + 64px) !important;
    bottom: auto !important;
    z-index: 42;
  }

  body.mobile-touch #target-frame {
    top: calc(max(16px, env(safe-area-inset-top)) + 116px);
  }

  body.mobile-touch #party-frames {
    top: calc(max(16px, env(safe-area-inset-top)) + 162px);
  }

  /* Raise the complete minimap column a few pixels. Compass + clock live in
     this column, so they keep their internal geometry while clearing Skill 5. */
  body.mobile-touch #minimap-wrap {
    top: max(0px, calc(env(safe-area-inset-top) - 6px));
  }
}

/* The creator preview must never be hidden by stale inline visibility left by
   a previous shared-preview mount. Actual draw activity remains owned by
   CharacterPreview's ResizeObserver/render gate. */
#offline-preview-container #char-preview-canvas {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
"""
text = css.read_text(encoding="utf-8")
if "HIGHFLY RUN0.9.3 — PHASE 0 PREVIEW + HUD" in text:
    raise SystemExit("RUN0.9.3 preview/HUD already applied")
css.write_text(text + addition, encoding="utf-8")

print("HIGHFLY_RUN093_PREVIEW_HUD_APPLIED=1")
