from pathlib import Path
import re
import shutil


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# FOUNDATION CLOSE 01 — use the actual owner-approved HIGHFLY full artwork.
# One optimized transparent WebP is used as the authoritative surface asset.
# ---------------------------------------------------------------------------
brand_source = Path("../branding/highfly-logo-full.webp")
brand_public = Path("public/highfly/highfly-logo-full.webp")
if not brand_source.exists() or brand_source.stat().st_size < 10000:
    raise SystemExit("premium HIGHFLY full logo asset missing or suspiciously small")
brand_public.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(brand_source, brand_public)

for html_path in (Path("index.html"), Path("play.html")):
    html = html_path.read_text(encoding="utf-8")

    # Replace all previously patched full/mark/donor logo image sources with the
    # actual integrated HIGHFLY wordmark artwork. A single real asset avoids the
    # old 128px fallback + live-text reconstruction that looked pasted on.
    html = re.sub(
        r'(<img[^>]*(?:id="intro-logo"|id="title-logo"|class="header-logo"|class="ls-logo")[^>]*\\bsrc=")[^"]+("[^>]*>)',
        r'\\1/highfly/highfly-logo-full.webp\\2',
        html,
    )

    # If the entry card does not already own an explicit HIGHFLY hero, add one
    # inside the card rather than floating a crest above it via ::after.
    if 'class="highfly-entry-logo"' not in html:
        anchor = '<div class="website-card-heading">'
        if anchor not in html:
            raise SystemExit(f"entry card heading missing in {html_path}")
        html = html.replace(
            anchor,
            anchor + '\n              <img class="highfly-entry-logo" src="/highfly/highfly-logo-full.webp" alt="HIGHFLY — Ascend · Train · Conquer" />',
            1,
        )

    html = html.replace("/highfly/highfly-logo-full.png", "/highfly/highfly-logo-full.webp")
    html = html.replace("/highfly/highfly-logo-mark.png", "/highfly/highfly-logo-full.webp")
    html = html.replace("/worldofclaudecraft-logo.png", "/highfly/highfly-logo-full.webp")

    html_path.write_text(html, encoding="utf-8")

website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
website_text += r'''

/* ========================================================================
   HIGHFLY FOUNDATION CLOSE — premium entry / no donor-style pasted crest
   ======================================================================== */
body[data-website-redesign] :is(#mode-select, #login-panel, #forgot-panel, #reset-panel)::after {
  content: none !important;
  display: none !important;
  background: none !important;
}

.highfly-entry-logo {
  display: block;
  width: min(420px, 72vw);
  max-width: 100%;
  height: auto;
  margin: -18px auto 2px;
  object-fit: contain;
  background: transparent;
  filter:
    drop-shadow(0 8px 18px rgba(0, 0, 0, .58))
    drop-shadow(0 0 22px rgba(139, 61, 255, .34));
}

.homepage-header .header-logo {
  width: min(230px, 31vw) !important;
  height: 78px !important;
  max-height: 78px !important;
  object-fit: contain !important;
  object-position: left center !important;
  background: transparent !important;
  border-radius: 0 !important;
}

.homepage-header .website-wordmark {
  display: none !important;
}

@media (orientation: landscape) and (max-width: 1100px) {
  body.mobile-touch.start-screen-open .homepage-header {
    display: none !important;
  }

  body.mobile-touch.start-screen-open #homepage-views-container {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    overflow: auto !important;
    z-index: 3 !important;
  }

  body.mobile-touch.start-screen-open #hero-view {
    min-height: 100dvh !important;
    height: 100dvh !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding:
      max(8px, env(safe-area-inset-top))
      max(12px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left)) !important;
  }

  body.mobile-touch.start-screen-open #hero-view .website-story {
    display: none !important;
  }

  body.mobile-touch.start-screen-open #mode-select {
    width: min(720px, calc(100vw - 28px)) !important;
    max-width: 720px !important;
    max-height: calc(100dvh - 18px) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  body.mobile-touch.start-screen-open .highfly-entry-logo {
    width: min(360px, 58vw) !important;
    max-height: 42dvh !important;
    margin: -24px auto -4px !important;
  }
}
'''
website_css.write_text(website_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# FOUNDATION CLOSE 02 — loading uses the real full logo, no separate fake text.
# ---------------------------------------------------------------------------
shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r'''

/* ========================================================================
   HIGHFLY FOUNDATION CLOSE — loading, creator and Android window geometry
   ======================================================================== */
#loading-screen {
  width: 100vw !important;
  height: 100dvh !important;
  inset: 0 !important;
  box-sizing: border-box !important;
}

#loading-screen .ls-logo {
  width: min(430px, 68vw) !important;
  max-width: 430px !important;
  height: auto !important;
  max-height: 52dvh !important;
  object-fit: contain !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  filter:
    drop-shadow(0 12px 24px rgba(0, 0, 0, .62))
    drop-shadow(0 0 25px rgba(150, 65, 255, .38)) !important;
}

#loading-screen .highfly-loading-wordmark {
  display: none !important;
}

body.mobile-touch #offline-select {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
  z-index: 500 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

body.mobile-touch #offline-select .charselect-layout {
  width: 100% !important;
  height: calc(100dvh - 56px) !important;
  min-height: 0 !important;
  display: grid !important;
  grid-template-columns: minmax(280px, .9fr) minmax(360px, 1.1fr) !important;
  gap: 10px !important;
  overflow: hidden !important;
}

body.mobile-touch #offline-select .charselect-col-left,
body.mobile-touch #offline-select .charselect-col-right {
  min-width: 0 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch;
}

body.mobile-touch #offline-preview-container.char-preview-container {
  position: relative !important;
  width: 100% !important;
  height: clamp(220px, 58dvh, 520px) !important;
  min-height: 220px !important;
  max-height: 58dvh !important;
  overflow: hidden !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

body.mobile-touch #offline-preview-container #char-preview-canvas {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 100% !important;
  min-height: 100% !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

@media (orientation: landscape) and (max-height: 460px) {
  body.mobile-touch #offline-select {
    padding:
      max(4px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(4px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left)) !important;
  }

  body.mobile-touch #offline-select .charselect-layout {
    height: calc(100dvh - 42px) !important;
    grid-template-columns: minmax(250px, .82fr) minmax(360px, 1.18fr) !important;
  }

  body.mobile-touch #offline-preview-container.char-preview-container {
    height: clamp(210px, 62dvh, 300px) !important;
    min-height: 210px !important;
    max-height: 62dvh !important;
  }
}

body.mobile-touch #highfly-training-window .hf-training-header {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  gap: 12px !important;
  align-items: start !important;
  padding-right: max(10px, env(safe-area-inset-right)) !important;
}

body.mobile-touch #highfly-training-window .hf-training-controls {
  min-width: 0 !important;
  max-width: min(190px, 34vw) !important;
  overflow: visible !important;
}

body.mobile-touch #highfly-training-window #hf-training-week {
  width: min(180px, 32vw) !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  text-overflow: ellipsis !important;
}

@media (orientation: landscape) and (max-height: 460px) {
  body.mobile-touch #highfly-training-window .hf-training-header {
    padding-top: 8px !important;
  }
  body.mobile-touch #highfly-training-window .hf-training-controls {
    max-width: 150px !important;
  }
  body.mobile-touch #highfly-training-window #hf-training-week {
    width: 148px !important;
    font-size: 14px !important;
  }
}

body.mobile-touch :is(#mobile-meters, #mobile-wiki, #mobile-steam-wishlist, #mobile-donate) {
  display: none !important;
}

body.mobile-touch :is(
  #talents-window,
  #reliquary-window,
  #char-window,
  #bags,
  #spellbook,
  #crafting-window,
  #deeds-window,
  #professions-window,
  #loot-explorer-window,
  #quest-log-window,
  #options-menu
) {
  position: fixed !important;
  left: max(6px, env(safe-area-inset-left)) !important;
  top: max(6px, env(safe-area-inset-top)) !important;
  right: max(6px, env(safe-area-inset-right)) !important;
  bottom: max(6px, env(safe-area-inset-bottom)) !important;
  width: auto !important;
  height: auto !important;
  max-width: none !important;
  max-height: none !important;
  box-sizing: border-box !important;
  overflow: auto !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y !important;
}
'''
shell_css.write_text(shell_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# FOUNDATION CLOSE 03 — Training day closure records the session AS PERFORMED.
# ---------------------------------------------------------------------------
ui = Path("src/highfly/training/ui.ts")
ui_text = ui.read_text(encoding="utf-8")

old_button = '''        <button
          type="button"
          id="hf-training-register"
          class="hf-primary-action"
          ${!allExercisesComplete() || sessionDone || !selectedSessionTrainable() ? 'disabled' : ''}
        >
          ${sessionDone ? 'SESIÓN YA REGISTRADA ✓' : selectedWeek !== state.activeWeek ? 'SEMANA SOLO VISTA · NO HABILITADA' : allExercisesComplete() ? 'REGISTRAR SESIÓN COMPLETA' : 'COMPLETÁ LA SESIÓN PARA REGISTRAR'}
        </button>
        <small>
          No existe Readiness manual: el sistema usa lo que realmente completaste, el orden y los descansos medidos.
        </small>'''
new_button = '''        <button
          type="button"
          id="hf-training-register"
          class="hf-primary-action"
          data-highfly-all-terminal="${allExercisesComplete() ? '1' : '0'}"
          ${sessionDone || !selectedSessionTrainable() ? 'disabled' : ''}
        >
          ${sessionDone ? 'SESIÓN YA REGISTRADA ✓' : selectedWeek !== state.activeWeek ? 'SEMANA SOLO VISTA · NO HABILITADA' : 'COMPLETAR SESIÓN'}
        </button>
        <small>
          Cierra el día tal como está: sólo registra sets realmente completados.
          Ejercicios saltados o pendientes no cuentan como completados.
        </small>'''
if ui_text.count(old_button) != 1:
    raise SystemExit(f"Training register button final form mismatch: {ui_text.count(old_button)}")
ui_text = ui_text.replace(old_button, new_button)

old_bind = '''  const register = mount.querySelector<HTMLElement>('#hf-training-register');
  if (register) {
    bindTouchTap(register, (event) => {
      event.preventDefault();
      if (allExercisesComplete() && selectedSessionTrainable()) registerSession();
    });
  }'''
new_bind = '''  const register = mount.querySelector<HTMLElement>('#hf-training-register');
  if (register) {
    bindTouchTap(register, (event) => {
      event.preventDefault();
      if (selectedSessionTrainable()) registerSession();
    });
  }'''
if ui_text.count(old_bind) != 1:
    raise SystemExit(f"Training register binding final form mismatch: {ui_text.count(old_bind)}")
ui_text = ui_text.replace(old_bind, new_bind)

old_guard = '''function registerSession(): void {
  const profile = profileOrNull();
  const exercises = activeDayExercises();
  if (
    !profile ||
    exercises.length === 0 ||
    !allExercisesComplete() ||
    !selectedSessionTrainable()
  ) return;
'''
new_guard = '''function registerSession(): void {
  const profile = profileOrNull();
  const exercises = activeDayExercises();
  if (
    !profile ||
    exercises.length === 0 ||
    sessionAlreadyRegistered() ||
    !selectedSessionTrainable()
  ) return;
'''
if ui_text.count(old_guard) != 1:
    raise SystemExit(f"Training register guard final form mismatch: {ui_text.count(old_guard)}")
ui_text = ui_text.replace(old_guard, new_guard)

old_partial_order = '''    const prescription = prescriptionForWeek(exercise, selectedWeek);
    if (!prescription) continue;
    const load = loadPlan(exercise);
    if (!load.ready) return;

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: load.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: load.rmReferenceKg,
    });

    plannedSets += prescription.sets;
    const actualSets = Math.min(
      prescription.sets,
      completedSets.get(exercise.exerciseId) ?? 0,
    );
'''

new_partial_order = '''    const prescription = prescriptionForWeek(exercise, selectedWeek);
    if (!prescription) continue;

    // Keep the complete plan as denominator, but ignore untouched work before
    // validating exercise-specific load input.
    plannedSets += prescription.sets;
    const actualSets = Math.min(
      prescription.sets,
      completedSets.get(exercise.exerciseId) ?? 0,
    );
    if (actualSets <= 0) continue;

    const load = loadPlan(exercise);
    if (!load.ready) continue;

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: load.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: load.rmReferenceKg,
    });
'''

if ui_text.count(old_partial_order) != 1:
    raise SystemExit(
        f"Training partial-session order mismatch: {ui_text.count(old_partial_order)}"
    )
ui_text = ui_text.replace(old_partial_order, new_partial_order)

ui.write_text(ui_text, encoding="utf-8")

print("HIGHFLY_RUN1J_FOUNDATION_CLOSE_APPLIED=1")
