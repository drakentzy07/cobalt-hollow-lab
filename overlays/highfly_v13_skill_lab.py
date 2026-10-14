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

# Lab-only VFX isolation: protect the game, author-written skill hits and mobs.
atk_source=Path("../v9-corrections/game/v13/highfly_v13_normal_atk_isolation.ts")
atk_dest=Path("src/highfly/v13_normal_atk_isolation.ts")
if not atk_source.is_file() or atk_dest.exists():
    raise SystemExit("V13_NORMAL_ATK_SOURCE_MISSING_OR_ALREADY_INSTALLED")
shutil.copyfile(atk_source,atk_dest)

auto_attack=Path("src/sim/combat/auto_attack.ts")
if not auto_attack.is_file():
    raise SystemExit("V13_NATIVE_AUTO_ATTACK_SOURCE_MISSING")
auto_attack.write_text(
    "import { highflyV13MuteNormalAttackHere } from '../../highfly/v13_normal_atk_isolation';\n"
    + auto_attack.read_text(encoding="utf-8"),encoding="utf-8")
replace_once("src/sim/combat/auto_attack.ts",
 "export function startAutoAttack(ctx: SimContext, pid?: number): void {\n  const r = ctx.resolve(pid);\n  if (!r) return;",
 """export function startAutoAttack(ctx: SimContext, pid?: number): void {
  const r = ctx.resolve(pid);
  if (!r) return;
  // V13 only: no white auto-attack if a skill/auto-engage tries to arm it.
  // Authored skill weaponStrikes/VFX use independent effects.
  if (highflyV13MuteNormalAttackHere(r.e.id,ctx.primaryId)) {
    r.e.autoAttack=false;
    return;
  }""")
replace_once("src/sim/combat/auto_attack.ts",
 "export function tryPlayerSwing(ctx: SimContext, p: Entity, meta: PlayerMeta): void {\n  if (isValkyrsCallingAirborne(p)) return;",
 """export function tryPlayerSwing(ctx: SimContext, p: Entity, meta: PlayerMeta): void {
  // Defence in depth: white melee, offhand, wand and hunter auto-shot OFF.
  if (highflyV13MuteNormalAttackHere(p.id,ctx.primaryId)) {
    p.autoAttack=false;
    return;
  }
  if (isValkyrsCallingAirborne(p)) return;""")
replace_once("src/ui/hud.ts",
 "  private activateFixedAttackSlot(): void {\n    if (this.sim.player.autoAttack) this.sim.stopAutoAttack();",
 """  private activateFixedAttackSlot(): void {
    // The V13 skill VFX recording lab intentionally has NO ordinary ATK.
    if (new URLSearchParams(location.search).get('hf-v13') === '1') {
      this.sim.stopAutoAttack();
      return;
    }
    if (this.sim.player.autoAttack) this.sim.stopAutoAttack();""")
replace_once("src/ui/hud.ts",
 "            this.optionsHooks?.settings.get('startAttackOnAbilityUse') &&",
 """            new URLSearchParams(location.search).get('hf-v13') !== '1' &&
            this.optionsHooks?.settings.get('startAttackOnAbilityUse') &&""")


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
assert dest.is_file() and atk_dest.is_file()
attack=auto_attack.read_text(encoding="utf-8")
assert attack.count("highflyV13MuteNormalAttackHere(")==2
assert "export function tryPlayerSwing" in attack and "export function startAutoAttack" in attack
main=Path("src/main.ts").read_text(encoding="utf-8")
assert "installHighflyV13SkillLab" in main
assert "HFV13Lab" in main
assert "highflyV13CreateMob" in main
hud=Path("src/ui/hud.ts").read_text(encoding="utf-8")
assert "highflyV13Equip" in hud
assert "this.optionsHooks?.settings.get('startAttackOnAbilityUse')" in hud
assert "The V13 skill VFX recording lab intentionally has NO ordinary ATK" in hud
print("HIGHFLY_V13_NATIVE_LV99_NINECLASS_SCROLL_SLOTS_ORIGINAL_HUD_SIM_PATCH_GREEN=1")
print("HIGHFLY_V13_ALL_NINE_PRIMARY_BASIC_AUTOATTACK_DISABLED_ONLY_LAB=1")
