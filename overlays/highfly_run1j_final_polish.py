from pathlib import Path

# HIGHFLY FINAL FOUNDATION POLISH — real-device pass after RUN #93

brand_source = Path("../branding/highfly-logo-full.webp")
brand_public = Path("public/highfly/highfly-logo-full.webp")
if not brand_source.exists() or brand_source.stat().st_size < 10000:
    raise SystemExit("validated HIGHFLY full artwork missing or suspiciously small")
brand_public.parent.mkdir(parents=True, exist_ok=True)
brand_public.write_bytes(brand_source.read_bytes())

for html_path in (Path("index.html"), Path("play.html")):
    html = html_path.read_text(encoding="utf-8")
    for old in (
        "/highfly/highfly-logo-full.webp",
        "/highfly/highfly-logo-full.png",
        "/highfly/highfly-logo-mark.png",
        "/worldofclaudecraft-logo.png",
    ):
        html = html.replace(old, "/highfly/highfly-logo-full.webp")

    if html_path.name == "play.html" and 'id="highfly-chat-close"' not in html:
        anchor = '<button type="button" id="mobile-chat-reply"'
        idx = html.find(anchor)
        if idx < 0:
            raise SystemExit("mobile chat reply anchor missing in play.html")
        end = html.find("</button>", idx)
        if end < 0:
            raise SystemExit("mobile chat reply close tag missing in play.html")
        end += len("</button>")
        controls = '''
      <button type="button" id="highfly-chat-close" class="highfly-chat-control" aria-label="Cerrar chat">×</button>
      <button type="button" id="highfly-chat-send" class="highfly-chat-control" aria-label="Enviar mensaje">ENVIAR</button>'''
        html = html[:end] + controls + html[end:]

    html_path.write_text(html, encoding="utf-8")

website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
website_text += r'''

/* HIGHFLY FINAL FOUNDATION POLISH — OWN ENTRY SCREEN */
body.start-screen-open {
  overflow: hidden !important;
  background: #070912 !important;
}
body.start-screen-open .homepage-header,
body.start-screen-open .homepage-footer,
body.start-screen-open #hero-view > .website-story {
  display: none !important;
}
body.start-screen-open #homepage-views-container,
body.start-screen-open #hero-view {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-height: 100dvh !important;
  max-width: none !important;
  margin: 0 !important;
  overflow: hidden !important;
}
body.start-screen-open #hero-view {
  display: grid !important;
  place-items: center !important;
  box-sizing: border-box !important;
  padding:
    max(10px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left)) !important;
  background:
    radial-gradient(circle at 50% 42%, rgba(100, 48, 190, .26), transparent 34%),
    radial-gradient(circle at 50% 72%, rgba(28, 91, 180, .17), transparent 44%),
    linear-gradient(180deg, #090b15 0%, #050711 100%) !important;
}
body.start-screen-open #mode-select {
  position: relative !important;
  inset: auto !important;
  left: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  transform: none !important;
  width: min(650px, calc(100vw - 28px)) !important;
  height: auto !important;
  max-width: 650px !important;
  max-height: calc(100dvh - 20px) !important;
  margin: 0 !important;
  padding: 12px 22px 18px !important;
  box-sizing: border-box !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  border: 1px solid rgba(196, 153, 54, .44) !important;
  border-radius: 18px !important;
  background: linear-gradient(180deg, rgba(14, 16, 29, .96), rgba(7, 10, 20, .98)) !important;
  box-shadow: 0 28px 72px rgba(0, 0, 0, .66), 0 0 38px rgba(121, 56, 220, .13) !important;
}
body.start-screen-open #mode-select::before,
body.start-screen-open #mode-select::after {
  content: none !important;
  display: none !important;
}
body.start-screen-open #mode-select .website-card-heading {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  gap: 0 !important;
  margin: 0 0 6px !important;
}
body.start-screen-open #mode-select .website-card-eyebrow {
  display: none !important;
}
body.start-screen-open #mode-select .highfly-entry-logo {
  position: static !important;
  display: block !important;
  width: min(300px, 48vw) !important;
  height: auto !important;
  max-width: 300px !important;
  max-height: 172px !important;
  margin: -8px auto -14px !important;
  object-fit: contain !important;
  object-position: center !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  filter: drop-shadow(0 9px 20px rgba(0, 0, 0, .72)) drop-shadow(0 0 18px rgba(153, 74, 255, .30)) !important;
}
body.start-screen-open #mode-select .website-card-heading h2 {
  margin: 0 0 8px !important;
  font-size: clamp(24px, 4.2vw, 38px) !important;
}
body.start-screen-open #mode-select :is(.website-performance, .play-tip) {
  display: none !important;
}
body.start-screen-open #mode-select .play-console {
  margin-top: 0 !important;
  padding-top: 2px !important;
}
@media (orientation: landscape) and (max-height: 460px) {
  body.start-screen-open #mode-select {
    width: min(620px, calc(100vw - 24px)) !important;
    max-height: calc(100dvh - 14px) !important;
    padding: 8px 18px 12px !important;
  }
  body.start-screen-open #mode-select .highfly-entry-logo {
    width: min(220px, 33vw) !important;
    max-height: 112px !important;
    margin: -12px auto -14px !important;
  }
  body.start-screen-open #mode-select .website-card-heading h2 {
    font-size: 26px !important;
    margin-bottom: 4px !important;
  }
}
'''
website_css.write_text(website_text, encoding="utf-8")

shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r'''

/* HIGHFLY FINAL FOUNDATION POLISH — LOADING + MOBILE WINDOWS */
#loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
#loading-screen .ls-logo {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  width: min(300px, 44vw) !important;
  height: auto !important;
  max-width: 300px !important;
  max-height: 174px !important;
  margin: 0 auto 12px !important;
  object-fit: contain !important;
  background: transparent !important;
  border: 0 !important;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .76)) drop-shadow(0 0 20px rgba(150, 68, 255, .32)) !important;
  z-index: 2 !important;
}
#loading-screen .highfly-loading-wordmark { display: none !important; }
#loading-screen .ls-progress { width: min(820px, 72vw) !important; }

body.mobile-touch :is(#talents-window, #spellbook, #loot-explorer-window, #crafting-window) {
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: min(820px, calc(100vw - 20px)) !important;
  height: min(366px, calc(100dvh - 16px)) !important;
  max-width: calc(100vw - 20px) !important;
  max-height: calc(100dvh - 16px) !important;
  min-width: 0 !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch;
  z-index: 95 !important;
}
body.mobile-touch #crafting-window {
  width: min(980px, calc(100vw - 16px)) !important;
  height: min(374px, calc(100dvh - 12px)) !important;
  max-width: calc(100vw - 16px) !important;
  max-height: calc(100dvh - 12px) !important;
}
body.mobile-touch #crafting-window .crafting-tabs {
  display: flex !important;
  flex-wrap: nowrap !important;
  gap: 8px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding: 6px 8px 9px !important;
  scroll-snap-type: x proximity;
}
body.mobile-touch #crafting-window .crafting-tab {
  flex: 0 0 auto !important;
  min-width: 180px !important;
  scroll-snap-align: start;
}
body.mobile-touch #crafting-window :is(.crafting-body, .crafting-identity, .profession-identity-card) {
  line-height: 1.32 !important;
}
body.mobile-touch #crafting-window :is(button, select, input) { min-height: 40px; }

body.mobile-touch #chatlog-wrap {
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: min(760px, calc(100vw - 28px)) !important;
  max-width: calc(100vw - 28px) !important;
  max-height: calc(100dvh - 24px) !important;
}
#highfly-chat-close, #highfly-chat-send { display: none; }
body.mobile-touch.mobile-chat-open #highfly-chat-close,
body.mobile-touch.mobile-chat-open #highfly-chat-send {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  position: absolute !important;
  z-index: 12 !important;
  min-height: 38px;
  border: 1px solid rgba(219, 175, 60, .72);
  background: rgba(11, 13, 22, .96);
  color: #f4e3af;
  font-weight: 800;
}
body.mobile-touch.mobile-chat-open #highfly-chat-close {
  top: 8px !important;
  right: 8px !important;
  width: 42px;
  font-size: 25px;
}
body.mobile-touch.mobile-chat-open #highfly-chat-send {
  right: 8px !important;
  bottom: 8px !important;
  min-width: 104px;
  padding: 0 14px;
  font-size: 13px;
  letter-spacing: .06em;
}
body.mobile-touch.mobile-chat-open #chat-input { padding-right: 118px !important; }
'''
shell_css.write_text(shell_text, encoding="utf-8")

ui = Path("src/highfly/training/ui.ts")
ui_text = ui.read_text(encoding="utf-8")
marker = "function resultHtml(): string {"
if marker not in ui_text:
    raise SystemExit("Training resultHtml anchor missing")
helpers = r'''function trainingOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    calibrated: 'BASE ESTABLECIDA',
    awaiting_performance: 'EN CALIBRACIÓN',
    progress_only: 'PROGRESO REGISTRADO',
    stat_up: 'STAT +1',
    maintained: 'MANTENIDO',
    insufficient_evidence: 'EVIDENCIA INSUFICIENTE',
    insufficient_performance: 'RENDIMIENTO INSUFICIENTE',
  };
  return labels[outcome] ?? outcome.replaceAll('_', ' ').toUpperCase();
}

function trainingOutcomeReason(reason: string): string {
  const known: Record<string, string> = {
    'Initial comparable evidence established the neutral Core baseline; calibration itself grants no Training Bridge bonus.':
      'La primera evidencia comparable estableció la base neutral del Core; calibrar no otorga por sí solo una bonificación de Training Bridge.',
    'Stimulus recorded, but initial calibration needs a valid comparable performance sample.':
      'Se registró estímulo, pero la calibración inicial todavía necesita una muestra válida de rendimiento comparable.',
    'Comparable baseline seeded for an already-calibrated legacy profile.':
      'Se estableció una referencia comparable para un perfil previamente calibrado.',
  };
  return known[reason] ?? reason;
}

'''
ui_text = ui_text.replace(marker, helpers + marker, 1)
ui_text = ui_text.replace(
    "<span>${o.outcome.replaceAll('_', ' ')}</span>",
    "<span>${trainingOutcomeLabel(o.outcome)}</span>",
)
ui_text = ui_text.replace(
    "<small>${escapeHtml(o.reason)}</small>",
    "<small>${escapeHtml(trainingOutcomeReason(o.reason))}</small>",
)
ui_text = ui_text.replace("<h4>HUNTER CORE</h4>", "<h4>HUNTER CORE · ESTADO CONSOLIDADO</h4>")
ui_text = ui_text.replace(
    "<span>STR / AGI / VIT / PER / INT sólo suben por entrenamiento real</span>",
    "<span>Los valores 10.0 son la base calibrada; el resultado de sesión se muestra por separado.</span>",
)
ui_text = ui_text.replace("<h4>RESULTADO DEL SISTEMA</h4>", "<h4>RESULTADO DE ESTA SESIÓN</h4>")
ui.write_text(ui_text, encoding="utf-8")

main = Path("src/main.ts")
main_text = main.read_text(encoding="utf-8")
if "HIGHFLY_FINAL_CHAT_CONTROLS" not in main_text:
    main_text += r'''

// HIGHFLY_FINAL_CHAT_CONTROLS
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.closest('#highfly-chat-close')) {
    const input = document.getElementById('chat-input');
    if (input instanceof HTMLTextAreaElement) input.blur();
    document.body.classList.remove(
      'mobile-chat-open',
      'mobile-chat-reply',
      'mobile-keyboard-open',
    );
    return;
  }

  if (target.closest('#highfly-chat-send')) {
    const input = document.getElementById('chat-input');
    if (!(input instanceof HTMLTextAreaElement)) return;
    if (!input.value.trim()) {
      input.focus();
      return;
    }
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
  }
});
'''
main.write_text(main_text, encoding="utf-8")

print("HIGHFLY_FINAL_FOUNDATION_POLISH_APPLIED=1")
