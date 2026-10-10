#!/usr/bin/env python3
"""HIGHFLY V3-01B: genuine Training window visibility fix.
Exactly two controlled changes to the TRAINING UI event/close path.
Never alters persistent Hunter state, stats, talent, GLB, combat or movement.
Only applicable after the frozen CLEAN and RUN129 overlays have been replayed.
"""
from pathlib import Path

p=Path("src/highfly/training/ui.ts")
s=p.read_text(encoding="utf-8")
old_open="""  window.addEventListener('highfly:open-training', () => {
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');"""
new_open="""  window.addEventListener('highfly:open-training', () => {
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
    // CLEAN's managed .window uses inline display:none; removing [hidden]
    // alone cannot make the real Training panel visible.
    if (trainingWindow) trainingWindow.style.display = 'flex';"""
old_close="""      setTrainingFocusMode(false);
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');"""
new_close="""      setTrainingFocusMode(false);
      trainingWindow?.setAttribute('hidden', '');
      // Keep both visibility channels coherent. [hidden] alone loses to
      // an author-level inline display:flex when the modal is closed.
      if (trainingWindow) trainingWindow.style.display = 'none';"""
for label,old in [("open event",old_open),("close event",old_close)]:
    n=s.count(old)
    if n!=1:raise SystemExit(f"HIGHFLY V3-01 UI FIX REFUSED: {label} expected 1, found {n}")
s=s.replace(old_open,new_open,1).replace(old_close,new_close,1)
p.write_text(s,encoding="utf-8")
print("HIGHFLY_V3_01_TRAINING_VISIBILITY_REAL_EVENT_FIX=1")
print("HIGHFLY_V3_01_TRAINING_STATE_STATS_UNCHANGED=1")
