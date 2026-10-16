#!/usr/bin/env python3
"""R28 P1 applies AFTER R26 in the disposable ClaudeCraft build.
No original source repository, saves, game root, or public Pages writes.
"""
from pathlib import Path
import shutil

def once(path,old,new):
 p=Path(path);s=p.read_text('utf8')
 if s.count(old)!=1:
  raise SystemExit('R28_SOURCE_DRIFT:'+path+':'+str(s.count(old))+':'+repr(old[:110]))
 p.write_text(s.replace(old,new,1),'utf8')

for item in [
 'highfly_origin_r27_premium23_catalog.ts',
 'highfly_origin_r28_universal_catalog.ts',
 'highfly_origin_r28_session.ts',
 'highfly_origin_r28_universal_tester.ts'
]:
 dest=('src/highfly/' if item.endswith('universal_tester.ts') else 'src/sim/')+item
 shutil.copyfile('../v9-corrections/game/c1/'+item,dest)
 if not Path(dest).is_file():raise SystemExit('R28_MISSING_SOURCE_'+dest)

main='src/main.ts'
once(main,
 "import { originR26SessionOnly } from './sim/highfly_origin_r26_seven_trial';",
 "import { originR26SessionOnly } from './sim/highfly_origin_r26_seven_trial';\nimport { r28StartSession } from './sim/highfly_origin_r28_session';")
once(main,
 "if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1')originR26SessionOnly(hunter);",
 """if(import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1')r28StartSession(hunter);
        else if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1')originR26SessionOnly(hunter);""")
once(main,"? 'highfly:origin:r26-ephemeral' : ",
          "? (import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1' ? 'highfly:origin:r28-ephemeral' : 'highfly:origin:r26-ephemeral') : ")

# The LIVE native level-up path and native respec path both call refreshKnownAbilities.
# Restore the preview-only selected skill AFTER that original authoritative pass.
sim='src/sim/sim.ts'
once(sim,
 "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';",
 "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';\nimport { r28Reapply } from './highfly_origin_r28_session';")
once(sim,
 "      : abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);",
 "      : abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);\n    r28Reapply(meta); // weak session map: no-op for ALL normal games and saved characters")

# R26 old 'equip seven first' was running before the original bar's init.
# R28 makes NO permanent action bar edits at all.
hud='src/ui/hud.ts'
once(hud,
 "if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1'){",
 "if(import.meta.env.VITE_HIGHFLY_ORIGIN_SEVEN_LAB==='1' && import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER!=='1'){")
once(hud,
 "import { installOriginAimAndLoadout, originSkillRole } from '../highfly/highfly_origin_r17_hud';",
 "import { installOriginAimAndLoadout, originSkillRole } from '../highfly/highfly_origin_r17_hud';\nimport { mountR28UniversalTester } from '../highfly/highfly_origin_r28_universal_tester';\nimport type { Sim as R28Sim } from '../sim/sim';")
once(hud,
 "    this.buildMobileActionRing();\n    this.buildMobileConsumableSeat();",
 """    this.buildMobileActionRing();
    if (import.meta.env.VITE_HIGHFLY_ORIGIN_UNIVERSAL_TESTER==='1' &&
        this.sim.player.originResources) {
      mountR28UniversalTester({
        sim:this.sim as R28Sim,
        attackButton:this.mobileRingAttackBtn,
        scene:this.renderer.scene,
        terrain:(x,z)=>highflyAimTerrainHeight(x,z,this.sim.cfg.seed),
        project:(x,y,z)=>this.renderer.worldToScreen(x,y,z),
        cameraYaw:()=>this.renderer.camYaw,
        iconUrl:(id)=>iconDataUrl('ability',id),
      });
    }
    this.buildMobileConsumableSeat();""")
print('HIGHFLY_R28_UNIVERSAL_ATK_NATIVE_BRIDGE_INSTALLED=1')
