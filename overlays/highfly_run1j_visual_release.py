from pathlib import Path
import re

# HIGHFLY RUN1-J VISUAL RELEASE
# Visual-only overlay. Baseline gameplay/Training/save/combat logic stays untouched.

for html_path in (Path("index.html"), Path("play.html")):
    html = html_path.read_text(encoding="utf-8")

    # Authoritative HIGHFLY art on both visible entry and world-loading surfaces.
    html = re.sub(
        r'(<img[^>]*class="highfly-entry-logo"[^>]*src=")[^"]+("[^>]*>)',
        r'\1/highfly/highfly-logo-full.webp\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(<img[^>]*class="ls-logo"[^>]*src=")[^"]+("[^>]*>)',
        r'\1/highfly/highfly-logo-full.webp\2',
        html,
        count=1,
    )

    # One clean entry CTA. Offline remains the real underlying selected mode;
    # compatibility buttons and donor internals stay in the DOM for reuse/tests.
    html = re.sub(
        r'<span class="btn-play-label"[^>]*>.*?</span>',
        '<span class="btn-play-label">ENTRAR AL MUNDO</span>',
        html,
        count=1,
        flags=re.S,
    )

    # A small HIGHFLY-owned subtitle, independent of donor i18n updates.
    if 'class="highfly-entry-subtitle"' not in html:
        html = re.sub(
            r'(<img[^>]*class="highfly-entry-logo"[^>]*>)',
            r'\1\n              <p class="highfly-entry-subtitle">MUNDO LOCAL · PROGRESO PERSISTENTE</p>',
            html,
            count=1,
        )

    html_path.write_text(html, encoding="utf-8")

website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
# Remove every remaining visible donor-logo URL, including dormant desktop rules.
website_text = website_text.replace(
    'url("/worldofclaudecraft-logo.png")',
    'url("/highfly/highfly-logo-full.webp")',
)
website_text += r'''

/* ========================================================================
   HIGHFLY RUN1-J VISUAL RELEASE — S23 entry surface
   Removes donor portal/footer/marketing chrome from the actual mobile entry.
   ======================================================================== */
body.mobile-touch.start-screen-open {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}

body.mobile-touch.start-screen-open #start-screen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  overflow: hidden !important;
  background: #050714 !important;
}

body.mobile-touch.start-screen-open :is(
  .homepage-header,
  .homepage-footer,
  .website-story,
  .website-community-links,
  .website-tools-item,
  .steam-wishlist,
  .donate-cta,
  #game-version,
  .play-tip,
  #performance-tip
) {
  display: none !important;
}

body.mobile-touch.start-screen-open #homepage-views-container {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

body.mobile-touch.start-screen-open #hero-view {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  padding:
    max(10px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left)) !important;
  margin: 0 !important;
  display: grid !important;
  place-items: center !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

body.mobile-touch.start-screen-open #start-screen-backdrop {
  position: fixed !important;
  inset: 0 !important;
  overflow: hidden !important;
}

body.mobile-touch.start-screen-open .website-cinematic-art {
  inset: -2% !important;
  transform: scale(1.02) !important;
  filter: saturate(.92) brightness(.72) contrast(1.06) !important;
}

body.mobile-touch.start-screen-open .bg-trailer-scrim {
  background:
    radial-gradient(circle at 50% 42%, rgba(96, 35, 170, .10), transparent 34%),
    linear-gradient(90deg, rgba(3, 5, 15, .78), rgba(5, 6, 18, .38) 50%, rgba(3, 5, 15, .78)),
    linear-gradient(0deg, rgba(2, 3, 10, .76), rgba(3, 4, 14, .16) 52%, rgba(2, 3, 10, .62)) !important;
}

body.mobile-touch.start-screen-open #mode-select {
  position: relative !important;
  isolation: isolate !important;
  width: min(430px, calc(100vw - 40px)) !important;
  max-width: 430px !important;
  min-width: 0 !important;
  height: auto !important;
  max-height: calc(100dvh - 24px) !important;
  margin: 0 !important;
  padding: 14px 26px 20px !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  border: 1px solid rgba(219, 183, 255, .26) !important;
  border-radius: 20px !important;
  background:
    linear-gradient(180deg, rgba(13, 9, 31, .72), rgba(5, 7, 20, .88)) !important;
  box-shadow:
    0 18px 55px rgba(0, 0, 0, .52),
    inset 0 1px rgba(255, 255, 255, .07),
    0 0 44px rgba(121, 50, 220, .12) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  backdrop-filter: blur(10px) !important;
  text-align: center !important;
}

/* Kill the actual donor portal frame and donor crest. */
body.mobile-touch.start-screen-open #mode-select::before,
body.mobile-touch.start-screen-open #mode-select::after {
  content: none !important;
  display: none !important;
  border: 0 !important;
  border-image: none !important;
  background: none !important;
}

body.mobile-touch.start-screen-open #mode-select .website-card-heading {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  margin: 0 !important;
}

body.mobile-touch.start-screen-open #mode-select .website-card-eyebrow,
body.mobile-touch.start-screen-open #mode-select .website-card-heading > h2 {
  display: none !important;
}

body.mobile-touch.start-screen-open .highfly-entry-logo {
  display: block !important;
  width: min(225px, 37vw) !important;
  max-width: 225px !important;
  height: auto !important;
  max-height: 220px !important;
  margin: 0 auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: transparent !important;
  filter:
    drop-shadow(0 10px 18px rgba(0, 0, 0, .62))
    drop-shadow(0 0 20px rgba(163, 69, 255, .34)) !important;
}

body.mobile-touch.start-screen-open .highfly-entry-subtitle {
  margin: -2px 0 12px !important;
  color: rgba(239, 224, 255, .84) !important;
  font: 700 11px/1.2 var(--font-ui) !important;
  letter-spacing: .18em !important;
  text-align: center !important;
  text-shadow: 0 2px 8px #000 !important;
}

body.mobile-touch.start-screen-open #mode-select .server-select {
  display: none !important;
}

body.mobile-touch.start-screen-open #mode-select > .play-console {
  display: block !important;
  width: min(320px, 100%) !important;
  max-width: 320px !important;
  margin: 0 auto !important;
  padding: 0 !important;
}

body.mobile-touch.start-screen-open #btn-play {
  width: 100% !important;
  min-height: 56px !important;
  padding: 14px 24px !important;
  margin: 0 !important;
  border: 1px solid rgba(255, 220, 143, .92) !important;
  border-radius: 12px !important;
  background:
    linear-gradient(180deg, rgba(60, 22, 86, .96), rgba(25, 14, 50, .98)) !important;
  color: #f9e7b5 !important;
  box-shadow:
    inset 0 1px rgba(255,255,255,.13),
    0 10px 24px rgba(0,0,0,.42),
    0 0 22px rgba(158, 74, 255, .18) !important;
  filter: none !important;
  font-size: 18px !important;
  letter-spacing: .13em !important;
  text-shadow: 0 2px 7px rgba(0,0,0,.8) !important;
}

body.mobile-touch.start-screen-open #btn-play::before,
body.mobile-touch.start-screen-open #btn-play::after {
  content: none !important;
  display: none !important;
}

body.mobile-touch.start-screen-open .btn-play-sheen {
  opacity: .28 !important;
}

@media (orientation: landscape) and (max-height: 430px) {
  body.mobile-touch.start-screen-open #mode-select {
    width: min(390px, calc(100vw - 44px)) !important;
    padding: 10px 22px 15px !important;
  }

  body.mobile-touch.start-screen-open .highfly-entry-logo {
    width: min(190px, 31vw) !important;
    max-width: 190px !important;
    max-height: 190px !important;
  }

  body.mobile-touch.start-screen-open .highfly-entry-subtitle {
    margin-top: -4px !important;
    margin-bottom: 9px !important;
    font-size: 10px !important;
  }

  body.mobile-touch.start-screen-open #btn-play {
    min-height: 52px !important;
    font-size: 17px !important;
  }
}
'''
website_css.write_text(website_text, encoding="utf-8")

shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r'''

/* ========================================================================
   HIGHFLY RUN1-J VISUAL RELEASE — actual world-loading composition
   ======================================================================== */
body.mobile-touch #loading-screen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-width: 0 !important;
  min-height: 0 !important;
  padding:
    max(14px, env(safe-area-inset-top))
    max(18px, env(safe-area-inset-right))
    max(18px, env(safe-area-inset-bottom))
    max(18px, env(safe-area-inset-left)) !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  background-color: #050714 !important;
  background-image:
    linear-gradient(180deg, rgba(2, 3, 11, .60), rgba(3, 4, 14, .25) 48%, rgba(2, 3, 10, .82)),
    var(--loading-backdrop-image, none) !important;
  background-position: center !important;
  background-size: cover !important;
}

body.mobile-touch #loading-screen.visible {
  display: flex !important;
}

body.mobile-touch #loading-screen .ls-logo {
  display: block !important;
  flex: 0 0 auto !important;
  width: min(210px, 34vw) !important;
  max-width: 210px !important;
  height: auto !important;
  max-height: 190px !important;
  margin: 0 auto !important;
  object-fit: contain !important;
  object-position: center !important;
  opacity: 1 !important;
  visibility: visible !important;
  filter:
    drop-shadow(0 10px 20px rgba(0,0,0,.72))
    drop-shadow(0 0 20px rgba(158,70,255,.32)) !important;
}

body.mobile-touch #loading-screen .highfly-loading-wordmark {
  display: none !important;
}

body.mobile-touch #loading-screen .ls-progress {
  flex: 0 0 auto !important;
  width: min(620px, 78vw) !important;
  max-width: 620px !important;
  gap: 7px !important;
}

body.mobile-touch #loading-screen .ls-bar {
  width: 100% !important;
  height: 12px !important;
  border-color: rgba(238, 201, 127, .74) !important;
  background: rgba(4, 4, 12, .80) !important;
  box-shadow:
    0 4px 18px rgba(0,0,0,.56),
    inset 0 1px 3px rgba(0,0,0,.9) !important;
}

body.mobile-touch #loading-screen #ls-fill {
  background:
    linear-gradient(90deg, #6d27c9, #b448ff 58%, #f0c66f) !important;
}

body.mobile-touch #loading-screen #ls-status {
  color: #f7ecff !important;
  font-size: 15px !important;
  letter-spacing: .04em !important;
  text-align: center !important;
}

body.mobile-touch #loading-screen #ls-tip {
  max-width: min(680px, 86vw) !important;
  color: rgba(235, 220, 244, .76) !important;
  font-size: 11px !important;
  line-height: 1.35 !important;
}

body.mobile-touch #loading-screen #ls-slow-hint {
  max-width: min(680px, 86vw) !important;
  font-size: 10px !important;
}

@media (orientation: landscape) and (max-height: 430px) {
  body.mobile-touch #loading-screen {
    gap: 8px !important;
    padding-block: 10px 14px !important;
  }

  body.mobile-touch #loading-screen .ls-logo {
    width: min(165px, 28vw) !important;
    max-width: 165px !important;
    max-height: 160px !important;
  }

  body.mobile-touch #loading-screen .ls-progress {
    width: min(600px, 76vw) !important;
  }
}
'''
shell_css.write_text(shell_text, encoding="utf-8")

print("HIGHFLY_RUN1J_VISUAL_RELEASE_APPLIED=1")
