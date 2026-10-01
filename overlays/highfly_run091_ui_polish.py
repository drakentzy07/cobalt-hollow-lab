from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
mobile = Path("src/game/mobile_controls.ts")
css = Path("src/styles/hud.mobile.css")

# ---------------------------------------------------------------------------
# 1) CREATOR PREVIEW: do not repeatedly re-parent/re-size the WebGL canvas.
# RUN0.9's recovery called setContainer() four times; setContainer() calls
# renderer.setSize(), which clears the drawing buffer. On real mobile Chrome
# that could leave the creator stage blank even though the preview object lived.
# ---------------------------------------------------------------------------
preview_old = """      const settlePreview = () => {
        if (!characterPreview) return;
        characterPreview.setContainer(container);
        previewClassBody(cls);
        characterPreview.setSkin(selectedSkin('#offline-skin-row', offlineSkin));
        characterPreview.armOpen();
        characterPreview.syncSize();
      };

      // Mobile Chrome sometimes opens the fullscreen creator while visualViewport
      // is still settling after the address bar/status chrome moves. Re-seat the
      // shared canvas across that short window instead of leaving a black stage.
      settlePreview();
      requestAnimationFrame(() => requestAnimationFrame(settlePreview));
      window.setTimeout(settlePreview, 250);
      window.setTimeout(settlePreview, 900);
      syncPreviewAfterPanelLayout();
"""
preview_new = """      let previewArmed = false;
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
replace_once(main, preview_old, preview_new, "stable offline creator preview")

# Never overwrite an already-created CharacterPreview if the boot-time
# charactersReady() continuation and the on-demand recovery meet on the same
# resolved asset barrier.
main_text = main.read_text(encoding="utf-8")
needle = "characterPreview = new CharacterPreview(container, canvas, {"
count = main_text.count(needle)
if count < 1:
    raise SystemExit("character preview constructor guard: no constructors found")
main.write_text(
    main_text.replace(needle, "characterPreview ??= new CharacterPreview(container, canvas, {"),
    encoding="utf-8",
)

# ---------------------------------------------------------------------------
# 2) QUICK MENU: the top-centre ... opens ClaudeCraft's REAL More panel
# directly (the 4-column panel shown in the approved screenshot). No intermediate
# Quick Actions strip.
# ---------------------------------------------------------------------------
replace_once(
    mobile,
    "import { buildMobileMenuControl, type MobileMenuControl } from '../ui/hud/menu';\n",
    "import type { MobileMenuControl } from '../ui/hud/menu';\n",
    "remove unused quick-strip builder",
)

replace_once(
    mobile,
    """    this.menuControl = buildMobileMenuControl();
    document.addEventListener('pointerdown', (e) => {
""",
    """    // HIGHFLY RUN0.9.1: the visible three-dot button is the direct gateway
    // to the complete More panel. Skip the intermediate ten-item gesture strip.
    this.menuControl = null;
    this.bindButton('mobile-menu-anchor', () => {
      const open = !document.body.classList.contains('mobile-more-open');
      if (!open) {
        this.closeMoreModal();
        return;
      }
      this.root?.classList.add('expanded');
      document.body.classList.add('mobile-more-open');
      const modal = document.getElementById('mobile-extra-controls');
      if (modal) {
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.right = 'auto';
        modal.style.bottom = 'auto';
        modal.style.transform = 'translate(-50%, -50%)';
        delete modal.dataset.windowMoved;
      }
    });
    document.addEventListener('pointerdown', (e) => {
""",
    "direct three-dot More menu",
)

# Add the Training Core entry to the real More grid in both entry documents.
for html_name in ("index.html", "play.html"):
    html = Path(html_name)
    text = html.read_text(encoding="utf-8")
    anchor = """          <button type="button" class="mobile-btn" id="mobile-bar-editor" data-i18n-title="hudChrome.mobile.barEditorAria" data-i18n-aria="hudChrome.mobile.barEditorAria" title="Edit the action bar layout" aria-label="Edit the action bar layout" data-icon="swap"><span class="mobile-label" data-i18n="hudChrome.mobile.barEditor">Edit Bars</span></button>
"""
    training = anchor + """          <button type="button" class="mobile-btn" id="mobile-training" title="Entrenamiento" aria-label="Entrenamiento" data-icon="talents"><span class="mobile-label">Entrenamiento</span></button>
"""
    if text.count(anchor) != 1:
        raise SystemExit(f"{html_name} training menu anchor: expected 1, found {text.count(anchor)}")
    text = text.replace(anchor, training)

    # One small, honest integration shell: it proves navigation is wired now,
    # and gives the Training Core a stable mount point without inventing fake
    # stats/routines in this UI-polish run.
    shell_anchor = """      <div id="mobile-extra-controls" class="window panel" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" aria-hidden="true">
"""
    if text.count(shell_anchor) != 1:
        raise SystemExit(f"{html_name} training shell anchor: expected 1, found {text.count(shell_anchor)}")
    shell = """      <div id="highfly-training-window" class="window panel" role="dialog" aria-modal="true" aria-labelledby="highfly-training-title" hidden>
        <div class="panel-title">
          <span id="highfly-training-title">Entrenamiento</span>
          <button type="button" class="x-btn" id="highfly-training-close" title="Cerrar" aria-label="Cerrar" data-icon="close"></button>
        </div>
        <div class="highfly-training-shell">
          <strong>Training Core</strong>
          <span>Acceso preparado para integrar rutinas, progreso y Core Stats.</span>
        </div>
      </div>
""" + shell_anchor
    text = text.replace(shell_anchor, shell)
    html.write_text(text, encoding="utf-8")

# Wire the new entry without changing the gameplay/training data model.
replace_once(
    mobile,
    """    this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());
    this.bindButton('mobile-talents', () => this.callbacks.onTalents());
""",
    """    this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());
    this.bindButton('mobile-training', () => {
      // Training lives in HIGHFLY's real More grid: close that modal first,
      // then open the fullscreen Training System.
      this.closeMoreModal();
      window.dispatchEvent(new CustomEvent('highfly:open-training'));
      document.getElementById('highfly-training-window')?.removeAttribute('hidden');
    });
    this.bindButton('highfly-training-close', () => {
      document.getElementById('highfly-training-window')?.setAttribute('hidden', '');
    });
    this.bindButton('mobile-talents', () => this.callbacks.onTalents());
""",
    "wire Training Core menu entry",
)

# ---------------------------------------------------------------------------
# 3) ACTION ROW: exact requested left-to-right order:
# Passive | Evade | Jump | Use | Skill 1 | (Attack)
# Skills 2-4 return to ClaudeCraft's original arc geometry.
# ---------------------------------------------------------------------------
css_append = r"""

/* ==========================================================================
   HIGHFLY RUN0.9.1 — approved mobile action row
   Left -> right: Passive | Evade | Jump | Use | Skill 1 | Attack
   ========================================================================== */
body.mobile-touch #mobile-action-ring {
  --highfly-action-gap: calc(10px * var(--mobile-chrome-scale, 1));
  width: calc(
    var(--mobile-ring-attack-size) +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 3 +
    var(--menu-btn-size) +
    var(--highfly-action-gap) * 5
  );
}

/* Skill 1: immediately left of Attack. */
body.mobile-touch .mobile-action-slot[data-mobile-index="0"] {
  right: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-action-size) / 2);
}

/* Use: one symmetric seat left of Skill 1. */
body.mobile-touch #mobile-action-ring #mobile-interact {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-action-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

/* Jump: left of Use. */
body.mobile-touch #mobile-action-ring #mobile-jump {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

/* Evade: left of Jump. */
body.mobile-touch #mobile-action-ring #mobile-evade {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 2
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

/* Optional class passive/stance: left-most seat. */
body.mobile-touch #mobile-stance-anchor {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 5 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 3
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--menu-btn-size) / 2);
}

/* Skills 2-4: restore the original ClaudeCraft arc instead of RUN0.9's
   temporary hand-placed coordinates. */
body.mobile-touch .mobile-action-slot[data-mobile-index="1"] {
  right: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.9239 -
    var(--mobile-ring-action-size) / 2
  );
  bottom: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.3827 -
    var(--mobile-ring-action-size) / 2
  );
}
body.mobile-touch .mobile-action-slot[data-mobile-index="2"] {
  right: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.7071 -
    var(--mobile-ring-action-size) / 2
  );
  bottom: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.7071 -
    var(--mobile-ring-action-size) / 2
  );
}
body.mobile-touch .mobile-action-slot[data-mobile-index="3"] {
  right: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.3827 -
    var(--mobile-ring-action-size) / 2
  );
  bottom: calc(
    var(--mobile-ring-attack-size) / 2 +
    var(--mobile-ring-radius) * 0.9239 -
    var(--mobile-ring-action-size) / 2
  );
}

/* No intermediate Quick Actions strip: ... goes straight to More. */
body.mobile-touch #mobile-menu-strip {
  display: none !important;
}

/* Training Core mount shell. This is only a stable navigation mount; the real
   Training Core owns its content when integrated. */
body.mobile-touch #highfly-training-window:not([hidden]) {
  display: block;
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: min(720px, calc(100vw - 40px));
  max-height: min(520px, calc(100vh - 40px));
  z-index: 170;
}
body.mobile-touch #highfly-training-window .highfly-training-shell {
  display: grid;
  gap: 10px;
  padding: 22px;
  text-align: left;
}

/* Left-handed mirror for the complete approved bottom row. */
body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"],
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-interact,
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump,
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade,
body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  right: auto;
}
body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"] {
  left: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
}
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-interact {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-action-size)
  );
}
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size)
  );
}
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 2
  );
}
body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 5 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 3
  );
}
"""
css.write_text(css.read_text(encoding="utf-8") + css_append, encoding="utf-8")

print("HIGHFLY_RUN091_UI_POLISH_APPLIED=1")
