from pathlib import Path

p = Path("src/highfly/training/ui.ts")
s = p.read_text(encoding="utf-8")

old_open = """  window.addEventListener('highfly:open-training', () => {
    console.info('[HIGHFLY training] open requested', {
      hasWindow: trainingWindow instanceof HTMLElement,
      hidden: trainingWindow?.hasAttribute('hidden') ?? null,
    });
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
"""

new_open = """  window.addEventListener('highfly:open-training', () => {
    console.info('[HIGHFLY training] open requested', {
      hasWindow: trainingWindow instanceof HTMLElement,
      hidden: trainingWindow?.hasAttribute('hidden') ?? null,
    });
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
    if (trainingWindow) {
      // ClaudeCraft desktop windows default to .window { display: none }.
      // Mobile had its own :not([hidden]) display:block override, desktop did not.
      // Make Training's open state explicit on both platforms.
      trainingWindow.style.setProperty('display', 'block', 'important');
    }
"""

if s.count(old_open) != 1:
    raise SystemExit(f"RUN148 open anchor expected once, found {s.count(old_open)}")
s = s.replace(old_open, new_open)

old_close = """      setTrainingFocusMode(false);
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
"""
new_close = """      setTrainingFocusMode(false);
      const windowEl = document.querySelector<HTMLElement>('#highfly-training-window');
      windowEl?.setAttribute('hidden', '');
      windowEl?.style.setProperty('display', 'none', 'important');
"""

# There can be more than one close path after RUN129/RUN137. Replace all exact copies.
if old_close not in s:
    raise SystemExit("RUN148 close anchor missing")
s = s.replace(old_close, new_close)

old_basic_close = """      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
"""
new_basic_close = """      const windowEl = document.querySelector<HTMLElement>('#highfly-training-window');
      windowEl?.setAttribute('hidden', '');
      windowEl?.style.setProperty('display', 'none', 'important');
"""
s = s.replace(old_basic_close, new_basic_close)

p.write_text(s, encoding="utf-8")
print("HIGHFLY_RUN148_PAGES_DESKTOP_TRAINING_VISIBLE_APPLIED=1")
