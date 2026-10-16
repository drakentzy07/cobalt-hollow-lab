#!/usr/bin/env python3
"""R28 P1 isolated source overlay, run AFTER R26 on the frozen donor."""
from pathlib import Path
import shutil

def once(path,old,new):
 p=Path(path);s=p.read_text('utf8');n=s.count(old)
 if n!=1:raise SystemExit(f'R28_SOURCE_DRIFT:{path}:{n}:{old[:100]}')
 p.write_text(s.replace(old,new,1),'utf8')

shutil.copy2('../v9-corrections/game/c1/highfly_origin_r28_universal_core.ts',
             'src/sim/highfly_origin_r28_universal_core.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r27_premium23_catalog.ts',
             'src/sim/highfly_origin_r27_premium23_catalog.ts')
shutil.copy2('../v9-corrections/game/c1/highfly_origin_r28_universal_tester.ts',
             'src/highfly/highfly_origin_r28_universal_tester.ts')
once('src/sim/sim.ts',
     "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';",
     "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';\nimport { originR28Reconcile } from './highfly_origin_r28_universal_core';")
once('src/sim/sim.ts',
     "      : abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);",
     "      : abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);\n    if(import.meta.env.VITE_HIGHFLY_ORIGIN_R28_TESTER==='1')originR28Reconcile(meta);")
once('src/ui/hud.ts',
     "import { audio } from '../game/audio';",
     "import { audio } from '../game/audio';\nimport { installR28UniversalTester } from '../highfly/highfly_origin_r28_universal_tester';\nimport type { Sim as R28Sim } from '../sim/sim';")
once('src/ui/hud.ts',
     "    this.mobileRingAttackBtn = ring.attackBtn;",
     """    this.mobileRingAttackBtn = ring.attackBtn;
    if(import.meta.env.VITE_HIGHFLY_ORIGIN_R28_TESTER==='1' && this.sim.player.originResources){
      installR28UniversalTester({
        sim:this.sim as unknown as R28Sim,
        attackBtn:ring.attackBtn,
        scene:this.renderer.scene,
        terrain:(x,z)=>highflyAimTerrainHeight(x,z,this.sim.cfg.seed),
        project:(x,y,z)=>this.renderer.worldToScreen(x,y,z),
        cameraYaw:()=>this.renderer.camYaw,
      });
    }""")
# Standalone lab: skip R26 seven-skill grant and its auto-binding, so the
# single R28 skill trial remains completely independent from S1-S7.
once('src/main.ts',
     "        if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1')originR26SessionOnly(hunter);",
     "        if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1' && import.meta.env.VITE_HIGHFLY_ORIGIN_R28_TESTER!=='1')originR26SessionOnly(hunter);")
once('src/ui/hud.ts',
     "      if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1'){",
     "      if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1' && import.meta.env.VITE_HIGHFLY_ORIGIN_R28_TESTER!=='1'){")
print('R28_P1_NATIVE_SKILL_TESTER_WIRED_TO_REAL_HUD_AND_SIM=1')
