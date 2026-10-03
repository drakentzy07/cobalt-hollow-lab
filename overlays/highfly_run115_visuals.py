from pathlib import Path
import base64
import re

ROOT = Path("..")
PUBLIC = Path("public/highfly")
PUBLIC.mkdir(parents=True, exist_ok=True)

def decode_parts(stem: str, out_name: str) -> None:
    parts = sorted((ROOT / "branding" / "run115q8").glob(f"{stem}.part*.b64"))
    if not parts:
        raise SystemExit(f"RUN115 missing payload parts for {stem}")
    payload = "".join(p.read_text(encoding="ascii").strip() for p in parts)
    data = base64.b64decode(payload, validate=True)
    if len(data) < 20000 or b"ftypavif" not in data[:64]:
        raise SystemExit(f"RUN115 invalid AVIF payload for {stem}: {len(data)} bytes")
    (PUBLIC / out_name).write_bytes(data)

decode_parts("splash", "highfly-splash.avif")
decode_parts("entry", "highfly-entry.avif")
decode_parts("loading", "highfly-loading.avif")

for html_path in (Path("index.html"), Path("play.html")):
    html = html_path.read_text(encoding="utf-8")
    html = re.sub(
        r'(<img[^>]*id="intro-logo"[^>]*\bsrc=")[^"]+("[^>]*>)',
        r'\1/highfly/highfly-splash.avif\2',
        html,
        count=1,
    )
    html = html.replace('alt="World of ClaudeCraft"', 'alt="HIGHFLY"')
    html_path.write_text(html, encoding="utf-8")

website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
website_text += r"""

/* ==========================================================================
   HIGHFLY RUN #115 — original HIGHFLY entry artwork (desktop + mobile)
   ========================================================================== */
body.start-screen-open #start-screen {
  background: #050714 !important;
}

body.mobile-touch.start-screen-open #hero-view,
body.start-screen-open #hero-view {
  background:
    linear-gradient(180deg, rgba(3,4,13,.06), rgba(3,4,13,.10) 52%, rgba(2,3,10,.30)),
    url("/highfly/highfly-entry.avif") center / cover no-repeat !important;
}

body.mobile-touch.start-screen-open #homepage-views-container,
body.start-screen-open #homepage-views-container {
  background: transparent !important;
}

body.mobile-touch.start-screen-open #start-screen-backdrop,
body.start-screen-open #start-screen-backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 0 !important;
  pointer-events: none !important;
  background:
    linear-gradient(180deg, rgba(3,4,13,.10), rgba(3,4,13,.16) 48%, rgba(2,3,10,.42)),
    url("/highfly/highfly-entry.avif") center / cover no-repeat !important;
}

body.mobile-touch.start-screen-open #start-screen-backdrop > *,
body.start-screen-open #start-screen-backdrop > * {
  display: none !important;
}

body.start-screen-open :is(
  .homepage-header,
  .homepage-footer,
  .website-story,
  .website-community-links,
  .website-tools-item,
  .steam-wishlist,
  .donate-cta,
  #game-version,
  .play-tip,
  #performance-tip,
  #title-logo
) {
  display: none !important;
}

body.mobile-touch.start-screen-open #mode-select,
body.start-screen-open #mode-select {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

body.mobile-touch.start-screen-open #mode-select::before,
body.mobile-touch.start-screen-open #mode-select::after,
body.start-screen-open #mode-select::before,
body.start-screen-open #mode-select::after {
  content: none !important;
  display: none !important;
  border: 0 !important;
  border-image: none !important;
  background: none !important;
}

body.mobile-touch.start-screen-open .highfly-entry-logo,
body.start-screen-open .highfly-entry-logo {
  opacity: 0 !important;
  filter: none !important;
}

body.mobile-touch.start-screen-open .highfly-entry-subtitle,
body.start-screen-open .highfly-entry-subtitle {
  color: rgba(255,245,223,.94) !important;
  text-shadow: 0 2px 8px rgba(0,0,0,.90) !important;
}

body.mobile-touch.start-screen-open #btn-play,
body.start-screen-open #btn-play {
  border-color: rgba(255,220,143,.96) !important;
  background: linear-gradient(180deg, rgba(67,22,97,.92), rgba(23,10,49,.96)) !important;
  box-shadow: 0 10px 28px rgba(0,0,0,.48), 0 0 26px rgba(164,70,255,.22) !important;
}
"""
website_css.write_text(website_text, encoding="utf-8")

shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r"""

/* ==========================================================================
   HIGHFLY RUN #115 — original HIGHFLY splash + loading artwork
   ========================================================================== */
#intro-logo[src$="/highfly/highfly-splash.avif"] {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
  object-position: center !important;
  border: 0 !important;
  border-radius: 0 !important;
  filter: none !important;
}

body.mobile-touch #loading-screen,
#loading-screen {
  background:
    linear-gradient(180deg, rgba(2,3,11,.06), rgba(3,4,14,.12) 55%, rgba(2,3,10,.58)),
    url("/highfly/highfly-loading.avif") center / cover no-repeat !important;
  justify-content: flex-end !important;
  gap: 10px !important;
}

body.mobile-touch #loading-screen .ls-logo,
#loading-screen .ls-logo {
  opacity: 0 !important;
  filter: none !important;
  pointer-events: none !important;
}

body.mobile-touch #loading-screen .ls-progress,
#loading-screen .ls-progress {
  margin-top: auto !important;
  margin-bottom: max(28px, env(safe-area-inset-bottom)) !important;
  width: min(700px, 78vw) !important;
}

body.mobile-touch #loading-screen #ls-status,
body.mobile-touch #loading-screen #ls-tip,
body.mobile-touch #loading-screen #ls-slow-hint,
#loading-screen #ls-status,
#loading-screen #ls-tip,
#loading-screen #ls-slow-hint {
  text-shadow: 0 2px 7px rgba(0,0,0,.95) !important;
}

@media (orientation: landscape) and (max-height: 430px) {
  body.mobile-touch #loading-screen .ls-progress,
  #loading-screen .ls-progress {
    margin-bottom: max(14px, env(safe-area-inset-bottom)) !important;
    width: min(620px, 76vw) !important;
  }
}
"""
shell_css.write_text(shell_text, encoding="utf-8")

print("HIGHFLY_RUN115_VISUALS_APPLIED=1")
