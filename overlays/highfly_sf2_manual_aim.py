#!/usr/bin/env python3
"""HIGHFLY SF2 — non-destructive optional skill-aim touch pilot.
Run ONLY after frozen V9.1 overlays. Changes no Sim, Training, items, XP or saves.
"""
from pathlib import Path
import shutil

def replace_one(path: str, old: str, new: str) -> None:
    p = Path(path)
    source = p.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"SF2_ANCHOR_CHANGED:{path}:{count}:{old[:90]!r}")
    p.write_text(source.replace(old, new, 1), encoding="utf-8")

helper = Path("../sf2-lab/game/c1/highfly_manual_skill_aim.ts")
target = Path("src/highfly/manual_skill_aim.ts")
if not helper.exists() or target.exists():
    raise SystemExit("SF2_SOURCE_MISSING_OR_ALREADY_INSTALLED")
shutil.copyfile(helper, target)

hud = "src/ui/hud.ts"
replace_one(
    hud,
    """  cancelGroundAim(): boolean {
    return this.groundAim.cancel();
  }

  groundAimAbilityRange(): number | null {""",
    """  cancelGroundAim(): boolean {
    return this.groundAim.cancel();
  }

  /** SF2 opt-in: resolve real donor ability under a ring centre slot. */
  highflyManualAimSpec(buttonIndex: number): import('./highfly/manual_skill_aim').HfAimSpec | null {
    if (!Number.isInteger(buttonIndex) || buttonIndex < 0 || buttonIndex >= this.mobileRingSlotBtns.length) return null;
    const slot = this.mobileSourceSlotForButton(buttonIndex);
    const action = this.actionForSlot(slot);
    const ability = this.abilityForSlot(slot);
    if (!action || action.type !== 'ability' || !ability?.def || ability.def.empowerStages) return null;
    const def = ability.def;
    const shape: import('./highfly/manual_skill_aim').HfAimShape | null =
      def.targetMode === 'position' && !def.selfCentered ? 'area' :
      def.requiresTarget ? /charge|leap|dash|step|rush/.test(def.id) ? 'dash' : 'target' :
      def.effects?.some(e => e.type === 'aoeDamage' && 'frontal' in e && e.frontal) ? 'cone' :
      null;
    if (!shape) return null; // self buffs, consumables and non-aimed casts remain native.
    const aoe = def.effects?.find(e => 'radius' in e);
    return {
      slot, id: def.id, label: def.name ?? def.id, shape,
      range: Math.max(2, Number(def.range ?? 8)),
      radius: aoe && 'radius' in aoe ? Number(aoe.radius) : 3,
      cooldown: Number(def.cooldown ?? 0),
    };
  }

  highflyManualAimBeginGround(id: string, slot: number): void {
    this.groundAim.begin(id, slot);
  }

  highflyManualAimCastSlot(slot: number): void {
    this.castSlot(slot);
  }

  groundAimAbilityRange(): number | null {"""
)

main = "src/main.ts"
p = Path(main)
original = p.read_text(encoding="utf-8")
if "from './highfly/manual_skill_aim'" in original:
    raise SystemExit("SF2_MAIN_ALREADY_PATCHED")
p.write_text(
    "import { installHighflyManualAim, hfAimVector, hfPointFromVector, hfAimTarget } from './highfly/manual_skill_aim';\n" + original,
    encoding="utf-8",
)
replace_one(
    main,
    """  mobileControls.start();
  const syncOverlayDiagnostics = () => {""",
    """  mobileControls.start();
  // SF2 manual, player-directed skill release: opt-in on preview only.
  // Donor radial, basic ATK and ground reticle remain the authority when off.
  installHighflyManualAim({
    resolve: (index) => hud.highflyManualAimSpec(index),
    cameraYaw: () => input.camYaw,
    begin: (spec) => {
      if (spec.shape === 'area') hud.highflyManualAimBeginGround(spec.id, spec.slot);
    },
    preview: (spec, direction) => {
      if (spec.shape === 'area') hud.updateGroundAimPoint(hfPointFromVector(world.player.pos, direction));
    },
    commit: (spec, direction) => {
      if (spec.shape === 'area') {
        hud.commitGroundAimAt(hfPointFromVector(world.player.pos, direction));
        return;
      }
      // A manual drag is never re-aimed by soft 360-degree targeting.
      const picked = hfAimTarget(
        world.entities.values(), world.player.pos, direction.yaw, spec.range,
        (id) => isAttackableEntity(world.entities.get(id), world.playerId, activePvpOpponentIds(world)),
      );
      world.targetEntity(picked);
      world.player.facing = direction.yaw;
      hud.highflyManualAimCastSlot(spec.slot);
    },
    cancel: () => { hud.cancelGroundAim(); },
  });
  const syncOverlayDiagnostics = () => {"""
)
# Remove unused import to preserve tsc noUnusedLocals policy.
replace_one(
    main,
    "installHighflyManualAim, hfAimVector, hfPointFromVector, hfAimTarget",
    "installHighflyManualAim, hfPointFromVector, hfAimTarget",
)
assert "SF2 opt-in" in Path(hud).read_text()
assert "installHighflyManualAim({" in Path(main).read_text()
assert target.exists()
print("HIGHFLY_SF2_OPTIN_MANUAL_TARGET_GROUND_AIM_CANCEL_APPLIED=1")
