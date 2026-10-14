#!/usr/bin/env python3
"""HIGHFLY V13 P1: opt-in real ClaudeCraft HUD + 63-skill scroll.
Run after ALL native SF4..SF27 installers, before TypeScript + WebGL build.
No changes to saved production code: all changes live in temporary Actions checkout.
"""
from pathlib import Path
import shutil

def replace_once(file: str, old: str, new: str):
    path=Path(file)
    content=path.read_text(encoding="utf-8")
    n=content.count(old)
    if n!=1:
        raise SystemExit(f"V13_SOURCE_ANCHOR_CHANGED {file}: found {n}; expected 1 for {old[:90]}")
    path.write_text(content.replace(old,new,1),encoding="utf-8")

source=Path("../v9-corrections/game/v13/highfly_v13_skill_lab.ts")
dest=Path("src/highfly/v13_skill_lab.ts")
if not source.is_file() or dest.exists():
    raise SystemExit("V13_NATIVE_SOURCE_MISSING_OR_ALREADY_INSTALLED")
shutil.copyfile(source,dest)

replace_once("src/main.ts",
 "import { applyFrameGeometrySetting } from './game/frame_geometry_settings';",
 """import { applyFrameGeometrySetting } from './game/frame_geometry_settings';
import { highflyV13Requested, highflyV13Class, installHighflyV13SkillLab } from './highfly/v13_skill_lab';
import { createMob as highflyV13CreateMob } from './sim/entity';
import { MOBS as HIGHFLY_V13_MOBS } from './sim/data';""")
replace_once("src/main.ts",
 "  mobileControls.start();",
 """  mobileControls.start();
  // Native browser renderer + original HUD+Sim, V13 UI only on isolated ?hf-v13=1.
  if (highflyV13Requested() && offlineSim) {
    // Source-modification-independent insertion: this anchor already survived
    // all V9 and SF4..SF27 overlays and is in the shared active game loop.
    offlineSim.setPlayerLevel(99);
    offlineSim.tick();
    const player=offlineSim.player;
    const spawnDummy=(id:number,dx:number,dz:number):void=>{
      const dummy=highflyV13CreateMob(id,HIGHFLY_V13_MOBS.training_dummy,20,{
        x:player.pos.x+dx,y:player.pos.y,z:player.pos.z+dz,
      });
      dummy.hostile=true;
      dummy.hp=dummy.maxHp=999999999;
      dummy.aiState='idle';
      (offlineSim as unknown as {addEntity(mob:typeof dummy):void}).addEntity(dummy);
      if(id===931101)offlineSim.targetEntity(dummy.id,player.id);
    };
    spawnDummy(931101,0,5);
    spawnDummy(931102,-3,7);
    spawnDummy(931103,3,7);
    player.resource=player.maxResource;
    installHighflyV13SkillLab({
      equip:(id,slot)=>hud.highflyV13Equip(id,slot),
      cast:(slot)=>hud.castSlot(slot),
    });
  }""")
replace_once("src/main.ts",
 "} else if (diagnosticsAutoOffline) {",
 """} else if (highflyV13Requested()) {
  // Protected lab URL auto-boots any of the nine REAL classes in offline Sim.
  startSitePresence('home');
  void startOffline(highflyV13Class(), 'HFV13Lab', 0);
} else if (diagnosticsAutoOffline) {""")
replace_once("src/ui/hud.ts",
 "  castSlot(barSlot: number): void {",
 """  /** V13 exclusive: use native action bar assignment and validation; never fake combat. */
  highflyV13Equip(abilityId: string, barSlot: number): boolean {
    if (new URLSearchParams(location.search).get('hf-v13') !== '1') return false;
    if (!Number.isInteger(barSlot) || barSlot < 1 || barSlot > 7) return false;
    if (!this.actionBarController.isAssignableAction({type:'ability',id:abilityId})) return false;
    this.commitHotbarActions(placeAbilityOnSlot(this.hotbarActions,abilityId,barSlot-1));
    return true;
  }

  castSlot(barSlot: number): void {""")
assert dest.is_file()
main=Path("src/main.ts").read_text(encoding="utf-8")
assert "installHighflyV13SkillLab" in main
assert "HFV13Lab" in main
assert "highflyV13CreateMob" in main
hud=Path("src/ui/hud.ts").read_text(encoding="utf-8")
assert "highflyV13Equip" in hud
print("HIGHFLY_V13_NATIVE_LV99_NINECLASS_SCROLL_SLOTS_ORIGINAL_HUD_SIM_PATCH_GREEN=1")
