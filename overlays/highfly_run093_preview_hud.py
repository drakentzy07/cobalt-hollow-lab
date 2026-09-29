from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
css = Path("src/styles/hud.mobile.css")

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
