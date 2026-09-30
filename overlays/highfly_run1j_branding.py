from pathlib import Path
import re
import shutil

index = Path("index.html")
play = Path("play.html")
css = Path("src/styles/shell.css")
brand_source = Path("../branding")
brand_public = Path("public/highfly")
brand_public.mkdir(parents=True, exist_ok=True)
shutil.copyfile(brand_source / "highfly-logo-full.png", brand_public / "highfly-logo-full.png")
shutil.copyfile(brand_source / "highfly-logo-mark.png", brand_public / "highfly-logo-mark.png")

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

    # Exact owner-supplied HIGHFLY artwork.
    def brand_img(match: re.Match[str], target: str, src: str) -> str:
        tag = match.group(0)
        tag = re.sub(r'\ssrc="[^"]*"', f' src="{src}"', tag, count=1)
        if "data-highfly-brand-target=" not in tag:
            tag = tag[:-1] + f' data-highfly-brand-target="{target}">'
        return tag

    for element_id in ("intro-logo", "title-logo"):
        text = re.sub(
            rf'<img[^>]*id="{element_id}"[^>]*>',
            lambda m: brand_img(m, "full", "/highfly/highfly-logo-full.png"),
            text,
            count=1,
        )
    text = re.sub(
        r'<img[^>]*class="header-logo"[^>]*>',
        lambda m: brand_img(m, "mark", "/highfly/highfly-logo-mark.png"),
        text,
        count=1,
    )
    text = re.sub(
        r'<img[^>]*class="ls-logo"[^>]*>',
        lambda m: brand_img(m, "full", "/highfly/highfly-logo-full.png"),
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
  filter: drop-shadow(0 0 18px rgba(168, 85, 247, .34));
}

[data-highfly-brand-target="full"] {
  max-height: min(58vh, 620px);
}

[data-highfly-brand-target="mark"] {
  border-radius: 12px;
}
"""
css.write_text(css.read_text(encoding="utf-8") + css_append, encoding="utf-8")

print("HIGHFLY_RUN1J_BRANDING_SURFACE_APPLIED=1")
