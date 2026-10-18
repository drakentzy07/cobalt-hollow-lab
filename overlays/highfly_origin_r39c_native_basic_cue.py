#!/usr/bin/env python3
"""R39C-P1: make R39A layering recognize the REAL manual ATK1..4 cue.
No Sim actions, skill entitlement, HUD buttons or saves are changed.
"""
from pathlib import Path
import shutil

path=Path('src/render/characters/visual.ts')
src=path.read_text('utf8')
old="if(abilityId || !this.r39MovingGround || this.warriorBody.rushOwnsBody ||"
new="if((abilityId && !r39CIsNativeBasicCue(abilityId)) ||\n       !this.r39MovingGround || this.warriorBody.rushOwnsBody ||"
if src.count(old)!=1:raise SystemExit('R39C_R39A_BASIC_CUE_GUARD_DRIFT')
src=src.replace(old,new,1)
old_import="import {r39MaskedMobilePair, type R39MaskedPair} from './highfly_r39_anim_split';"
if src.count(old_import)!=1:raise SystemExit('R39C_R39A_IMPORT_DRIFT')
src=src.replace(old_import,old_import+"\nimport {r39CIsNativeBasicCue} from '../../sim/highfly_r39c_combat_context';",1)
if src.count('this.r39StartMobileBasic(abilityId);')!=5:
  raise SystemExit('R39C_NATIVE_BASIC_BRANCHES_DRIFT')
path.write_text(src,'utf8')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_r39c_combat_context.ts',
  'src/sim/highfly_r39c_combat_context.ts')
r=Path('src/render/renderer.ts').read_text('utf8')
if "this.triggerAttack(ev.sourceId,'highfly_basic_'+ev.step)" not in r:
  raise SystemExit('R39C_REAL_R36A_WHIFF_VISUAL_ROUTE_DRIFT')
print('HIGHFLY_R39C_REAL_NATIVE_BASIC_1_TO_4_R39A_LAYER_CONNECTED=1')
