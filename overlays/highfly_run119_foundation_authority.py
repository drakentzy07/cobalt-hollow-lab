from pathlib import Path
import json
import re

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# HIGHFLY foundation authority pass:
# desktop Training, donor scrub, favicon, entry centering, vendor/bags fix,
# and the visible Character/Core contract.
# ---------------------------------------------------------------------------
for html_name in ("index.html", "play.html"):
    html = Path(html_name)
    text = html.read_text(encoding="utf-8")

    if 'id="mm-training"' not in text:
        pattern = re.compile(r'(<button[^>]*id="mm-talents"[^>]*>.*?</button>)', re.S)
        button = (
            r'\1'
            '<button type="button" class="micro-btn ui-icon-btn ui-icon-btn--micro" '
            'id="mm-training" title="Entrenamiento" aria-label="Entrenamiento" '
            'data-icon="talents"></button>'
        )
        text, count = pattern.subn(button, text, count=1)
        if count != 1:
            raise SystemExit(f"{html_name}: desktop Training button anchor missing")

    # The browser/PWA must never fall back to the donor C favicon.
    text = re.sub(
        r'(<link\s+rel="icon"[^>]*\bhref=")[^"]+',
        r'\1/highfly/highfly-logo-mark.png?v=119',
        text,
    )
    text = re.sub(
        r'(<link\s+rel="apple-touch-icon"[^>]*\bhref=")[^"]+',
        r'\1/highfly/highfly-logo-mark.png?v=119',
        text,
    )
    html.write_text(text, encoding="utf-8")

manifest_path = Path("public/manifest.webmanifest")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["name"] = "HIGHFLY"
manifest["short_name"] = "HIGHFLY"
for icon in manifest.get("icons", []):
    icon["src"] = "/highfly/highfly-logo-mark.png?v=119"
    icon["type"] = "image/png"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Character sheet: the five headline numbers are HIGHFLY Core, not Claude's
# level/gear primaries. Claude's internal baseline remains available to derived
# combat systems and equipment, but it is no longer presented as Hunter Core.
char_path = Path("src/ui/char_window.ts")
char_text = char_path.read_text(encoding="utf-8")
import_anchor = "import type { IWorld } from '../world_api';\n"
if "getActiveHighflyHunterProfile" not in char_text:
    if char_text.count(import_anchor) != 1:
        raise SystemExit("Character Core import anchor mismatch")
    char_text = char_text.replace(
        import_anchor,
        "import { getActiveHighflyHunterProfile } from '../highfly/training/profile_store';\n" + import_anchor,
    )

method_pattern = re.compile(
    r'  /\*\* The five primary attributes as tiles: the row under the paperdoll\. \*/\n'
    r'  private attributeTilesHtml\(\): string \{\n.*?\n  \}\n\n  private skillsHtml',
    re.S,
)
method_replacement = '''  /** HIGHFLY Core Stats: only real Training may change these five values. */
  private attributeTilesHtml(): string {
    const core = getActiveHighflyHunterProfile()?.training.core;
    const rows = [
      { id: 'STR', label: 'FUERZA', value: core?.STR.current ?? 0 },
      { id: 'AGI', label: 'AGILIDAD', value: core?.AGI.current ?? 0 },
      { id: 'VIT', label: 'VITALIDAD', value: core?.VIT.current ?? 0 },
      { id: 'PER', label: 'PERCEPCIÓN', value: core?.PER.current ?? 0 },
      { id: 'INT', label: 'INTELIGENCIA', value: core?.INT.current ?? 0 },
    ] as const;
    return rows
      .map((row) => {
        const value = formatNumber(row.value, { maximumFractionDigits: 0 });
        const desc = 'Core HIGHFLY: sólo aumenta mediante entrenamiento real.';
        return '<span class="stat-cell ui-stat-row ui-card highfly-core-stat" data-highfly-core="' +
          row.id + '" tabindex="0" title="' + desc + '">' + esc(row.label) +
          ' <b>' + value + '</b><span class="visually-hidden">' + desc + '</span></span>';
      })
      .join('');
  }

  private skillsHtml'''
char_text, method_count = method_pattern.subn(method_replacement, char_text, count=1)
if method_count != 1:
    raise SystemExit(f"Character Core tile method mismatch: {method_count}")
char_path.write_text(char_text, encoding="utf-8")

# Shared player card: same Core authority, while Armor remains a derived RPG stat.
card_path = Path("src/ui/hud/player_card/player_card_data.ts")
card_text = card_path.read_text(encoding="utf-8")
card_import = "import { ITEMS } from '../../../sim/data';\n"
if "getActiveHighflyHunterProfile" not in card_text:
    if card_text.count(card_import) != 1:
        raise SystemExit("Player card Core import anchor mismatch")
    card_text = card_text.replace(
        card_import,
        card_import + "import { getActiveHighflyHunterProfile } from '../../../highfly/training/profile_store';\n",
    )
old_stats = """  const primaryStats: PlayerCardStat[] = [
    { label: t('itemUi.stats.str'), value: number(player.stats.str) },
    { label: t('itemUi.stats.agi'), value: number(player.stats.agi) },
    { label: t('itemUi.stats.sta'), value: number(player.stats.sta) },
    { label: t('itemUi.stats.int'), value: number(player.stats.int) },
    { label: t('itemUi.stats.spi'), value: number(player.stats.spi) },
    { label: t('itemUi.stats.armor'), value: number(player.stats.armor) },
  ];
"""
new_stats = """  const core = getActiveHighflyHunterProfile()?.training.core;
  const primaryStats: PlayerCardStat[] = [
    { label: 'Fuerza', value: number(core?.STR.current ?? 0) },
    { label: 'Agilidad', value: number(core?.AGI.current ?? 0) },
    { label: 'Vitalidad', value: number(core?.VIT.current ?? 0) },
    { label: 'Percepción', value: number(core?.PER.current ?? 0) },
    { label: 'Inteligencia', value: number(core?.INT.current ?? 0) },
    { label: t('itemUi.stats.armor'), value: number(player.stats.armor) },
  ];
"""
if card_text.count(old_stats) != 1:
    raise SystemExit("Player card primary stat block mismatch")
card_text = card_text.replace(old_stats, new_stats)
card_path.write_text(card_text, encoding="utf-8")

website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
website_text += r"""

/* HIGHFLY FOUNDATION AUTHORITY — desktop entry centered over owned artwork. */
body:not(.mobile-touch).start-screen-open #mode-select {
  position: fixed !important;
  left: 50% !important;
  top: 66% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  grid-column: auto !important;
  grid-row: auto !important;
  justify-self: auto !important;
  width: min(520px, calc(100vw - 48px)) !important;
  max-width: 520px !important;
  margin: 0 !important;
  z-index: 3 !important;
}
"""
website_css.write_text(website_text, encoding="utf-8")

shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r"""

/* HIGHFLY FOUNDATION AUTHORITY — donor surfaces are not product UI. */
#mm-wiki,
#mobile-wiki,
#nav-btn-wiki,
#mobile-steam-wishlist,
#mobile-donate,
#community-hud,
.steam-wishlist,
.steam-wishlist-cta,
.donate-cta {
  display: none !important;
}

/* Finch/vendor lesson: HIGHFLY's generic mobile fullscreen Bags rule must not
   cover the paired vendor. Restore the donor's intended landscape split only
   while a vendor is actually open. */
@media (orientation: landscape) {
  body.mobile-touch.vendor-open #vendor-window {
    position: fixed !important;
    left: max(6px, env(safe-area-inset-left)) !important;
    right: calc(var(--app-vw) / var(--ui-scale, 1) / 2) !important;
    top: max(6px, env(safe-area-inset-top)) !important;
    bottom: max(6px, env(safe-area-inset-bottom)) !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    overflow-y: auto !important;
    z-index: 96 !important;
  }

  body.mobile-touch.vendor-open #bags {
    position: fixed !important;
    left: calc(var(--app-vw) / var(--ui-scale, 1) / 2) !important;
    right: max(6px, env(safe-area-inset-right)) !important;
    top: max(6px, env(safe-area-inset-top)) !important;
    bottom: max(6px, env(safe-area-inset-bottom)) !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    overflow: hidden !important;
    z-index: 95 !important;
  }
}

#char-window .highfly-core-stat {
  text-transform: uppercase;
}
"""
shell_css.write_text(shell_text, encoding="utf-8")

# Build-time authority checks: fail before tests if the intended seams did not land.
for html_name in ("index.html", "play.html"):
    html = Path(html_name).read_text(encoding="utf-8")
    if 'id="mm-training"' not in html:
        raise SystemExit(f"{html_name}: missing desktop Training entry")
    if 'highfly-logo-mark.png?v=119' not in html:
        raise SystemExit(f"{html_name}: HIGHFLY favicon missing")
if "highfly-entry" not in website_text:
    raise SystemExit("HIGHFLY entry artwork unexpectedly absent before centering")
if "vendor-open #bags" not in shell_text:
    raise SystemExit("Vendor/Bags mobile exception missing")

print("HIGHFLY_FOUNDATION_AUTHORITY_APPLIED=1")
