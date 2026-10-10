#!/usr/bin/env python3
"""HIGHFLY V4-02 PR19: mobile presentation adapter on TOP of PR18.
No changes to ClaudeCraft source-of-truth or gameplay.
Fail closed if the frozen overlay seams change.
"""
from pathlib import Path

path=Path('src/highfly/game_c1_runtime.ts')
s=path.read_text(encoding='utf-8')
old_import="import '../styles/highfly_v4_02_touch.css';"
assert s.count(old_import)==1, 'PR19 requires exactly one PR18 CSS entry'
s=s.replace(old_import,old_import+"\nimport '../styles/highfly_v4_02_pr19_mobile.css';",1)

start="/** PR18: native crafting tabs can be repainted with inline donor styling."
end="\nfunction ensureUtilityLane(): void {"
assert s.count(start)==1 and s.count(end)==1, 'PR19 needs unambiguous PR18 crafting seam'
a=s.index(start)
z=s.index(end,a)
assert a<z and 'ensureHighflyCraftingTouchLayout' in s[a:z]
replacement="""/** PR19: one mobile craft selector, exact original tab actions. This replaces
 * PR18's constant forced grid/style-writing, and changes NO donor recipes.
 * The original CraftingWindow painter may recreate its tab strip at any
 * time; the small select is repainted only when needed by our HUD tick.
 */
function ensureHighflyCraftingTouchLayout(): void {
  if (!document.body.classList.contains('mobile-touch') ||
      innerWidth <= innerHeight || innerHeight > 470) return;
  const root = document.getElementById('crafting-window');
  if (!root || getComputedStyle(root).display === 'none') return;
  const tabs = root.querySelector<HTMLElement>('.crafting-tabs');
  if (!tabs) return;
  // PR18 / donor may set inline !important, which outranks CSS even if
  // later stylesheet also says !important. This row is presentation-only;
  // its original event handlers stay attached for select delegation.
  tabs.style.setProperty('display', 'none', 'important');
  const originals = Array.from(tabs.querySelectorAll<HTMLButtonElement>('button.crafting-tab[data-craft]'));
  if (!originals.length) return;
  let bar = root.querySelector<HTMLElement>('#hf-pr19-craft-chooser');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'hf-pr19-craft-chooser';
    const caption = document.createElement('label');
    caption.htmlFor = 'hf-pr19-craft-select';
    caption.textContent = 'OFICIO';
    const select = document.createElement('select');
    select.id = 'hf-pr19-craft-select';
    select.setAttribute('aria-label', 'Elegir oficio de elaboración');
    select.addEventListener('change', () => {
      const current = root.querySelector<HTMLButtonElement>(
        '.crafting-tabs button.crafting-tab[data-craft="' + select.value + '"]');
      // Click the original ClaudeCraft tab: never synthesize a recipe or
      // mutate the Sim/economy directly.
      current?.click();
    });
    const info = document.createElement('button');
    info.type = 'button';
    info.className = 'hf-pr19-craft-info-toggle';
    info.textContent = 'Detalles';
    info.setAttribute('aria-expanded', 'false');
    info.addEventListener('click', () => {
      const active = root.classList.toggle('hf-pr19-craft-show-info');
      info.setAttribute('aria-expanded', String(active));
      info.textContent = active ? 'Ocultar' : 'Detalles';
    });
    bar.append(caption,select,info);
  }
  // The donor rebuilds its .crafting-tabs using its own painter. Ensure the
  // presentation control remains before the live strip after every repaint.
  if (bar.nextElementSibling !== tabs) tabs.before(bar);
  const select = bar.querySelector<HTMLSelectElement>('select');
  if (!select) return;
  const next = originals.map(btn => ({
    id:btn.dataset.craft ?? '',
    text:btn.querySelector('.crafting-tab-label')?.textContent?.trim() ?? btn.textContent?.trim() ?? '',
    count:btn.querySelector('.crafting-tab-count')?.textContent?.trim() ?? '',
  })).filter(row=>row.id);
  const sig = next.map(row=>row.id + ':' + row.text + ':' + row.count).join('|');
  if (bar.dataset.signature !== sig) {
    select.replaceChildren();
    for (const row of next) {
      const opt = document.createElement('option');
      opt.value = row.id;
      opt.textContent = row.text + (row.count ? ' · ' + row.count : '');
      select.append(opt);
    }
    bar.dataset.signature = sig;
  }
  const nativeSelected = originals.find(btn=>btn.getAttribute('aria-pressed')==='true')?.dataset.craft;
  if (nativeSelected && select.value !== nativeSelected) select.value = nativeSelected;
}

"""
s=s[:a]+replacement+s[z:]
path.write_text(s,encoding='utf-8')
print('HIGHFLY_V4_02_PR19_SELECTOR_NATIVE_CLICK_ONLY=1')
