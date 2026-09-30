from pathlib import Path
import re

index = Path("index.html")
play = Path("play.html")
css = Path("src/styles/shell.css")

def patch_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    replacements = {
        '<meta name="apple-mobile-web-app-title" content="ClaudeCraft" />':
            '<meta name="apple-mobile-web-app-title" content="HIGHFLY" />',
        '<title data-i18n="seo.title">World of ClaudeCraft: Classic-Style Web MMO</title>':
            '<title>HIGHFLY — Entrena · Asciende · Conquista</title>',
        '<meta property="og:site_name" content="World of ClaudeCraft" />':
            '<meta property="og:site_name" content="HIGHFLY" />',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Visible donor branding only. Internal IDs and gameplay architecture stay untouched.
    text = text.replace('alt="World of ClaudeCraft"', 'alt="HIGHFLY"')
    text = text.replace('>World of ClaudeCraft</span>', '>HIGHFLY</span>')
    text = text.replace('>World of ClaudeCraft</h1>', '>HIGHFLY</h1>')
    text = text.replace('aria-label="Play World of ClaudeCraft"', 'aria-label="Jugar HIGHFLY"')

    # Entry/logo surfaces are marked now; J2 asset pass swaps their src to the exact
    # HIGHFLY artwork supplied by the project owner.
    for element_id in ("intro-logo", "title-logo"):
        text = re.sub(
            rf'(<img[^>]*id="{element_id}"[^>]*)(>)',
            rf'\1 data-highfly-brand-target="full"\2',
            text,
            count=1,
        )
    text = re.sub(
        r'(<img[^>]*class="header-logo"[^>]*)(>)',
        r'\1 data-highfly-brand-target="mark"\2',
        text,
        count=1,
    )
    text = re.sub(
        r'(<img[^>]*class="ls-logo"[^>]*)(>)',
        r'\1 data-highfly-brand-target="full"\2',
        text,
        count=1,
    )

    path.write_text(text, encoding="utf-8")

patch_html(index)
patch_html(play)

css_append = r"""

/* ==========================================================================
   HIGHFLY RUN1-J / J2 — product branding surface
   Donor internals stay intact; HIGHFLY owns the visible product.
   ========================================================================== */
#mm-discord,
#mobile-discord,
#tf-discord,
#discord-window,
#discord-cta-banner,
#discord-keep-modal,
#discord-choice-panel,
#btn-login-discord,
#auth-or-divider,
.website-community[href*="discord"],
.social-link[href*="discord"],
a[href*="discord.com/invite/worldofclaudecraft"] {
  display: none !important;
}

.website-wordmark {
  letter-spacing: .14em;
  font-weight: 900;
}

[data-highfly-brand-target] {
  object-fit: contain;
}
"""
css.write_text(css.read_text(encoding="utf-8") + css_append, encoding="utf-8")

print("HIGHFLY_RUN1J_BRANDING_SURFACE_APPLIED=1")
