#!/usr/bin/env python3
"""R30 isolated overlay AFTER R29. Only disposable donor edits.
Curate 45 originals/23 premiums, fix R28 always-rank-1, mark nine passive
designs unimplemented, ground original-source effects on physical terrain.
No edits to main, permanent saves, source licenses or public Pages.
"""
from pathlib import Path
import shutil

def once(path,old,new):
 p=Path(path)
 s=p.read_text('utf8')
 n=s.count(old)
 if n!=1:raise SystemExit('R30_SOURCE_DRIFT:'+str(path)+':'+str(n)+':'+repr(old[:90]))
 p.write_text(s.replace(old,new,1),'utf8')

for item in ['highfly_origin_r30_curated77.ts','highfly_origin_r30_lv99_instant.ts']:
 shutil.copy2('../v9-corrections/game/c1/'+item,'src/sim/'+item)

session='src/sim/highfly_origin_r28_session.ts'
once(session,
 "import { r28Selectable } from './highfly_origin_r28_universal_catalog';",
 "import { r28Selectable } from './highfly_origin_r28_universal_catalog';\n"+
 "import {r30ResolveSelected} from './highfly_origin_r30_lv99_instant';\n"+
 "import {r30AuditSelected} from './highfly_origin_r30_curated77';")
once(session,
 "export function r28Resolved(id:string):ResolvedAbility {",
 """export function r28Resolved(id:string,level=1):ResolvedAbility {
 if(import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1')return r30ResolveSelected(id,level);""")
once(session,
 "export function r28Reapply(meta:LabMeta):void {",
 "export function r28Reapply(meta:LabMeta,level=1):void {")
once(session,
 " meta.known=[r28Resolved(id)];",
 " meta.known=[r28Resolved(id,level)];")
once(session,
 " r28Reapply(meta);\n // Selection cannot silently start",
 " r28Reapply(meta,sim.player.level);\n // Selection cannot silently start")
once(session,
 " if(!r28Select(sim,'shadow_bolt'))throw Error('R28_DEFAULT_SKILL_NOT_ADMITTED');",
 """ if(import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1'){
   r30AuditSelected();
   if(!r28Select(sim,'fireball'))throw Error('R30_DEFAULT_SKILL_NOT_ADMITTED');
 }else if(!r28Select(sim,'shadow_bolt'))throw Error('R28_DEFAULT_SKILL_NOT_ADMITTED');""")
# Sim level-up/respec restores the correct rank instead of rank 1.
once('src/sim/sim.ts',
 "    r28Reapply(meta); // weak session map: no-op for ALL normal games and saved characters",
 "    r28Reapply(meta, e.level); // R30 disposable session respects true current level")

catalog='src/sim/highfly_origin_r28_universal_catalog.ts'
once(catalog,
 "import { R27_PREMIUM_23 } from './highfly_origin_r27_premium23_catalog';",
 "import { R27_PREMIUM_23 } from './highfly_origin_r27_premium23_catalog';\n"+
 "import {R30_ORIGINAL_45} from './highfly_origin_r30_curated77';")
# Preserve the FULL 411-original catalog for backward-compatible R28 tests.
# The R30 45 selection is only a non-destructive UI projection.

ui='src/highfly/highfly_origin_r28_universal_tester.ts'
once(ui,
 "import { R27_PREMIUM_23 } from '../sim/highfly_origin_r27_premium23_catalog';",
 "import { R27_PREMIUM_23 } from '../sim/highfly_origin_r27_premium23_catalog';") if False else None
once(ui,
 "import { ABILITIES } from '../sim/content/classes';",
 "import { ABILITIES } from '../sim/content/classes';\n"+
 "import {R30_PASSIVE_DESIGNS,R30_ORIGINAL_45} from '../sim/highfly_origin_r30_curated77';")
once(ui,
 " let category:'native'|'premium'|'support'='native';",
 " let category:'native'|'premium'|'support'|'passives'='native';")
once(ui,
 " const ta=tab('CLAUDE ORIGINAL','native'),tb=tab('PREMIUM · 23','premium');",
 """ const ta=tab(import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1'?'CLAUDE · 45':'CLAUDE ORIGINAL','native'),
       tb=tab('PREMIUM · 23','premium'),
       td=import.meta.env.VITE_HIGHFLY_ORIGIN_R30==='1'?tab('PASIVAS · 9','passives'):null;""")
once(ui,
 "  // Buffs remain below near GEM/food, not in the combat tester.",
 "  // Buffs remain below near GEM/food, not in the combat tester.\n"+
 "  if(td)td.style.borderColor=category==='passives'?'#b0e9ff':'#446079';")
once(ui,
 "  let rows=category==='native'?native:category==='premium'?list.filter(x=>x.kind==='premium'):\n   native.filter(x=>x.shape==='SELF'||x.effect==='holy');",
 """  const passiveRows:R28Item[]=R30_PASSIVE_DESIGNS.map(p=>({
    id:p.id,name:p.name,originalName:p.name,group:p.school,kind:'native' as const,
    shape:'PASSIVE',effect:p.stat,cost:null,pool:null,cooldown:null,
    status:'passive' as const,note:'DISEÑO R30 · aún NO activada en combate'
  }));
  let rows:R28Item[]=category==='native'?native.filter(x=>import.meta.env.VITE_HIGHFLY_ORIGIN_R30!=='1'||R30_ORIGINAL_45.includes(x.id)):
    category==='premium'?list.filter(x=>x.kind==='premium'):
    category==='passives'?passiveRows:native.filter(x=>x.shape==='SELF'||x.effect==='holy');""")
once(ui,
 "  if(category==='native'||category==='support'){",
 "  if(category==='native'||category==='support'||category==='passives'){")
once(ui,
 "  info.textContent='GRIMORIO · '+rows.length+' '+(category==='premium'?'PROTOTIPOS':'HABILIDADES');",
 "  info.textContent='GRIMORIO · '+rows.length+' '+(category==='premium'?'PREMIUM':category==='passives'?'PASIVAS EN DISEÑO':'HABILIDADES');")
# The original-source vendors were hardcoded to y=0 even on elevated terrain.
# Retain vendors' own geometry offsets, and translate their root point to real
# terrain; separate hand/socket anchoring remains subject to runtime QA.
runtime='src/highfly/highfly_origin_r29_vendor_runtime.js'
once(runtime,
 " constructor(scene,camera){",
 " constructor(scene,camera,terrain=()=>0){\n   this.terrain=terrain;")
once(runtime,
 "const a=new THREE.Vector3(from.x,0,from.z);",
 "const a=new THREE.Vector3(from.x,this.terrain(from.x,from.z),from.z);")
once(ui,
 "const r29Fx=h.camera?new R29OriginalSourceVFX(h.scene,h.camera):null;",
 "const r29Fx=h.camera?new R29OriginalSourceVFX(h.scene,h.camera,h.terrain):null;")

print('HF_R30_45_CURATED_23_SOURCES_LEVEL99_INSTANT_GROUND_ADAPTATION_INSTALLED=1')
