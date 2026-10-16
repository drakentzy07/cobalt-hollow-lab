#!/usr/bin/env python3
"""R25A — preserve 36 native skills; add read-only 63-fusion A/B selector.
Patch runs AFTER R24A and R23, on a disposable frozen donor worktree.
No skill grants, hotbar edits, save schema, combat authority or public deployment.
"""
from pathlib import Path
import shutil
def once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8');count=s.count(old)
 if count!=1:raise SystemExit(f'R25A_SOURCE_DRIFT {path} {count}: {old[:90]}')
 p.write_text(s.replace(old,new,1),encoding='utf8')

source=Path('../v9-corrections/game/c1')
shutil.copy2(source/'highfly_origin_r25_sf27_catalog.ts','src/highfly/highfly_origin_r25_sf27_catalog.ts')
shutil.copy2(source/'highfly_origin_r25a_sf27_selector.ts','src/highfly/highfly_origin_r25a_sf27_selector.ts')
trial='src/highfly/highfly_origin_trial_runtime.ts'
once(trial,
 "import { ABILITIES } from '../sim/content/classes';",
 "import { ABILITIES } from '../sim/content/classes';\nimport { mountOriginR25aSelector } from './highfly_origin_r25a_sf27_selector';")
once(trial,
 "  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);",
 """  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);
  // The R18 editor uses replaceChildren(), so R22's visual gallery must be
  // reattached AFTER that rebuild or its event buttons silently disappear.
  panel.insertBefore(gallery,referencePanel);
  // R25A: read-only original/fusion catalog with native-geometry previews.
  // Nothing here writes to the Hunter profile or changes the hotbar.
  mountOriginR25aSelector(sim,panel);""")
# R22 gallery supports representative samples. R25A can request the original
# donor from which a fusion's visual is *suggested*, never pretend that this
# is the exact target geometry of the unregistered HIGHFLY ability.
aim='src/highfly/highfly_origin_r17_hud.ts'
once(aim,
 """    const shape=(event as CustomEvent<{shape?:string}>).detail?.shape;
    if(!['line','cone','circle','dash','target'].includes(shape??''))return;
    const sourceId=shape==='circle'?'blizzard'
      :shape==='dash'?'heroic_leap'
      :shape==='target'?'sinister_strike'
      :'fireball';""",
 """    const request=(event as CustomEvent<{shape?:string;abilityId?:string}>).detail;
    const shape=request?.shape;
    if(!['line','cone','circle','dash','target'].includes(shape??''))return;
    const requested=request?.abilityId;
    const sourceId=requested&&highflyAimSpec(requested)?requested
      :shape==='circle'?'blizzard'
      :shape==='dash'?'heroic_leap'
      :shape==='target'?'sinister_strike'
      :'fireball';""")
# When any registered donor has the requested visual family, inherit native
# physical dimensions. For a catalog fusion this is only a reference sample.
once(aim,
 """    const sample=shape==='cone'
      ? {...native,shape:'cone' as const,range:9,angle:Math.PI/2,radius:0}
      :shape==='target'
      ? {...native,shape:'target' as const,range:4.5,radius:0}
      :native;""",
 """    const sample=shape==='cone'
      ? {...native,shape:'cone' as const,range:Math.max(2,native.range||9),angle:Math.PI/2,radius:0}
      :shape==='target'
      ? {...native,shape:'target' as const,range:Math.max(1,native.range||4.5),radius:0}
      :shape===native.shape
      ? native
      : {...native,shape:shape as typeof native.shape};""")
print('HIGHFLY_R25A_GALLERY_AFTER_EDITOR_READONLY_63_PLUS_36_READY=1')
