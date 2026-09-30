from pathlib import Path
import re

for path in (Path("index.html"), Path("play.html")):
    text = path.read_text(encoding="utf-8")

    # J4 visible-product scrub. This deliberately touches only HTML-facing copy;
    # donor code identifiers and gameplay architecture remain unchanged.
    text = text.replace("World of ClaudeCraft", "HIGHFLY")

    # Donor social CTAs are not part of HIGHFLY's visible offline-first surface.
    text = re.sub(
        r'<a[^>]*href="[^"]*(?:discord\.com|worldofclaudecraft)[^"]*"[^>]*>.*?</a>',
        '',
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    text = re.sub(
        r'<button[^>]*(?:id="(?:mm-discord|mobile-discord|btn-login-discord)"|data-icon="discord")[^>]*>.*?</button>',
        '',
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # Repair the self-closing image syntax emitted by the earlier branding pass.
    text = re.sub(
        r'<img([^>]*?)\s*/\s+data-highfly-brand-target="([^"]+)">',
        r'<img\1 data-highfly-brand-target="\2" />',
        text,
    )
    path.write_text(text, encoding="utf-8")

locale = Path("src/ui/i18n.locales/es_ES.ts")
locale_text = locale.read_text(encoding="utf-8").replace("World of ClaudeCraft", "HIGHFLY")
locale.write_text(locale_text, encoding="utf-8")

print("HIGHFLY_RUN1J_J4_BRANDFIX_APPLIED=1")
