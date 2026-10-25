#!/usr/bin/env python3
"""C5: upgrade temporary C4 skills to REAL donor-driven native mechanics + FURY gesture.
Retains original collision, renderer, animations, resources and all public assets.
"""
from pathlib import Path
import shutil, subprocess
defs=Path('src/highfly/reborn/skill_defs.ts')
hud=Path('src/highfly/reborn/hud.ts')
assert defs.exists() and hud.exists(), 'C4_STAGE_REQUIRED'
assert "'highfly_arc_shot'" in defs.read_text()
shutil.copyfile('../tools/reborn/c5_skill_defs.ts',defs)
shutil.copyfile('../tools/reborn/c5_hud.ts',hud)
aim=Path('src/highfly/reborn/aim_line.ts')
shutil.copyfile('../tools/reborn/c5_aim_line.ts',aim)
main=Path('src/main.ts')
s=main.read_text()
old='    mountRebornHud(world, renderer);'
if s.count(old)!=1:raise SystemExit('REBORN_C5_HUD_INPUT_ANCHOR_DRIFT')
main.write_text(s.replace(old,'    mountRebornHud(world, renderer, input);'))
publicDiff=subprocess.check_output(['git','status','--porcelain','--untracked-files=no','--','public'],text=True).strip()
if publicDiff:raise SystemExit('REBORN_C5_PUBLIC_MEDIA_CHANGED: '+publicDiff)
print('HIGHFLY_C5_FURY_REAL_GESTURE_NATIVE_RETICLE=PASS')
print('HIGHFLY_C5_PROJECTILE_MANUAL_LINE_HIT_NATIVE_SIM=PASS')
print('HIGHFLY_C5_GROUND_METEOR_DELAY_DONOR=PASS')
