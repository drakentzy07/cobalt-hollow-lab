#!/usr/bin/env python3
"""PR18: S23 human-video feedback. Reuse authentic GEM, original More, Crafting,
Professions, Talents, Training. UI only; no schema, stats, item, craft changes.
Applied AFTER native PR14/PR15 and guide PR16 (fail closed).
"""
from pathlib import Path

p = Path('src/highfly/game_c1_runtime.ts')
s = p.read_text(encoding='utf-8')
def swap(old, new, name):
    global s
    assert s.count(old) == 1, f"PR18 refused {name}: {s.count(old)} matches"
    s = s.replace(old, new, 1)
assert 'function showHighflyGemGuide()' in s, 'PR18 requires PR16'
swap("import '../styles/hf_game_c1.css';",
     "import '../styles/hf_game_c1.css';\nimport '../styles/highfly_v4_02_touch.css';",
     "single original HUD style import")
swap("  el.textContent = elementGlyph(effective);\n  el.title =",
"""  // PR18: the old 36px '◇' passed CI but was invisible as an action to humans.
  // Keep one native inlay button; add a persistent text label for touch.
  let symbol = el.querySelector<HTMLElement>('.hf-v4-gem-icon');
  if (!symbol) {
    el.replaceChildren();
    symbol = document.createElement('span');
    symbol.className = 'hf-v4-gem-icon';
    const label = document.createElement('span');
    label.className = 'hf-v4-gem-label';
    label.textContent = 'GEM';
    el.append(symbol, label);
  }
  symbol.textContent = elementGlyph(effective);
  el.title =""", "visible GEM caption in existing seat")
swap("      ? 'Sin gema elemental activa'\n      : `Gema ${effective.toUpperCase()} activa · ATK4 habilitado`;",
     "      ? 'GEM · Abrir gemas y forja (ATK4 se habilita con gema incrustada)'\n      : `GEM ${effective.toUpperCase()} · ATK4 habilitado`;",
     "human readable aria label")
anchor="function ensureUtilityLane(): void {"
assert s.count(anchor)==1, "PR18 missing utility seat"
insert="""/** Real More menu shortcut for novices who never notice the HUD diamond.
 * Native More close handler owns modal state; delegate the action to the same
 * physical GEM seat, never mint an item or open a parallel crafting service.
 */
function ensureHighflyGemMoreShortcut(): void {
  const grid = document.getElementById('mobile-extra-grid');
  if (!grid) return;
  if (grid.querySelector('#hf-v4-gem-menu')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'hf-v4-gem-menu';
  button.className = 'mobile-btn';
  button.title = 'Abrir gemas, materiales y forja';
  button.setAttribute('aria-label', 'Gemas y forja');
  const icon = document.createElement('span');
  icon.className = 'hf-v4-menu-gem-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '◆';
  const label = document.createElement('span');
  label.className = 'mobile-label';
  label.textContent = 'Gemas';
  button.append(icon, label);
  button.addEventListener('click', () => {
    // The native X clears mobile-more-open and restores HUD layering.
    document.querySelector<HTMLElement>('#mobile-extra-controls .panel-title .x-btn')?.click();
    window.setTimeout(() => document.getElementById('hf-c1-gem-seat')?.click(), 0);
  });
  grid.prepend(button);
}

"""
s=s.replace(anchor,insert+anchor,1)
swap("  paintGemSeat();\n}\n\nfunction skillInfo(",
     "  paintGemSeat();\n  ensureHighflyGemMoreShortcut();\n}\n\nfunction skillInfo(",
     "hook shortcut into idempotent utility lane")
p.write_text(s,encoding='utf-8')
print('HIGHFLY_PR18_GEM_VISIBLE_NATIVE_MORE_SHORTCUT=1')
