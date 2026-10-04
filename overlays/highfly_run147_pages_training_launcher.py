from pathlib import Path

p = Path("src/highfly/training/ui.ts")
s = p.read_text(encoding="utf-8")

old = """  window.addEventListener('highfly:open-training', () => {
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
"""

new = """  // HIGHFLY Pages desktop launcher resilience: RUN122 wires #mm-training
  // through Hud, but on a real remote Pages boot that binding can be missed
  // even though the static button and Training window are present. Keep the
  // normal Hud path authoritative; after the click propagation completes,
  // dispatch our existing open event only if the window is still hidden.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      if (!target?.closest?.('#mm-training')) return;
      queueMicrotask(() => {
        if (trainingWindow?.hasAttribute('hidden')) {
          console.warn('[HIGHFLY training] desktop launcher fallback engaged');
          window.dispatchEvent(new CustomEvent('highfly:open-training'));
        }
      });
    },
    true,
  );

  window.addEventListener('highfly:open-training', () => {
    console.info('[HIGHFLY training] open requested', {
      hasWindow: trainingWindow instanceof HTMLElement,
      hidden: trainingWindow?.hasAttribute('hidden') ?? null,
    });
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
"""

if s.count(old) != 1:
    raise SystemExit(f"RUN147 training launcher anchor expected once, found {s.count(old)}")
p.write_text(s.replace(old, new), encoding="utf-8")
print("HIGHFLY_RUN147_PAGES_TRAINING_LAUNCHER_APPLIED=1")
