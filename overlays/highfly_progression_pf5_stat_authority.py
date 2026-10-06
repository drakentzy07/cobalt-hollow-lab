from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

runtime = Path("src/highfly/training/combat_runtime.ts")
ui = Path("src/highfly/training/ui.ts")

# ---------------------------------------------------------------------------
# PF-5 — TRAINING-ONLY CORE -> DERIVED GAME POWER
#
# ClaudeCraft keeps its complete class/level/gear/talent/buff baseline intact.
# HIGHFLY reads only wallet-backed Training allocation and modifies DERIVED
# outputs afterwards. We intentionally do not patch recalcPlayerStats primaries.
# ---------------------------------------------------------------------------

replace_once(
    runtime,
    "import { applyTrainingBridge, trainingGain } from './bridge';",
    "import { highflyTrainingDerivedModifiers } from './stat_authority';",
    "PF-5 derived-authority import",
)

replace_once(
    runtime,
    """  attackPower: number;
  rangedPower: number;
  maxHp: number;
  hp: number;
""",
    """  attackPower: number;
  rangedPower: number;
  spellPower: number;
  healPower: number;
  maxHp: number;
  hp: number;
""",
    "PF-5 entity spell/heal fields",
)

replace_once(
    runtime,
    """  attackPower: number;
  rangedPower: number;
  maxHp: number;
  critChance: number;
""",
    """  attackPower: number;
  rangedPower: number;
  spellPower: number;
  healPower: number;
  maxHp: number;
  critChance: number;
""",
    "PF-5 baseline spell/heal fields",
)

replace_once(
    runtime,
    """  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.maxHp = baseline.maxHp;
""",
    """  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.spellPower = baseline.spellPower;
  entity.healPower = baseline.healPower;
  entity.maxHp = baseline.maxHp;
""",
    "PF-5 baseline restore spell/heal",
)

old_block = """  const result = applyTrainingBridge({
    baseline: {
      physicalAP: baseline.attackPower,
      stagger: 1,
      power: baseline.rangedPower > 0 ? baseline.rangedPower : 1,
      moveSpeed: baseline.moveSpeed,
      maxHP: baseline.maxHp,
      precision: 1,
      weakPointMultiplier: 1,
      critChance: baseline.critChance,
      resourceCostMultiplier: 1,
      resourceRecovery: 1,
    },
    core: profile.training.core,
    flags,
  });

  entity.attackPower = Math.max(0, result.combat.physicalAP);
  if (baseline.rangedPower > 0) entity.rangedPower = Math.max(0, result.combat.power);
  entity.maxHp = Math.max(1, Math.round(result.combat.maxHP));

  const gAGI = trainingGain(profile.training.core.AGI.trainingGrowth);
  const agiCritBonus = Math.min(0.03, 0.02 * gAGI);
  const agiDodgeBonus = Math.min(0.04, 0.025 * gAGI);
  entity.critChance = Math.max(0, Math.min(1, result.combat.critChance + agiCritBonus));
  entity.dodgeChance = Math.max(0, Math.min(1, baseline.dodgeChance + agiDodgeBonus));

  if (flags.applyMovement) entity.moveSpeed = Math.max(0, result.combat.moveSpeed);
  if (flags.applyPerception) {
    const precisionBonus = Math.max(0, result.combat.precision - 1);
    const weakPointBonus = Math.max(0, result.combat.weakPointMultiplier - 1);
    entity.hitBonus = Math.max(0, Math.min(1, baseline.hitBonus + precisionBonus));
    entity.critDmgPhysBonus = Math.max(0, baseline.critDmgPhysBonus + weakPointBonus);
    entity.critDmgSpellBonus = Math.max(0, baseline.critDmgSpellBonus + weakPointBonus);
    entity.critDmgHealBonus = Math.max(0, baseline.critDmgHealBonus + weakPointBonus);
  }
  if (flags.applyIntelligence) {
    entity.highflyResourceCostMultiplier = Math.max(0.1, result.combat.resourceCostMultiplier);
    entity.highflyResourceRecoveryMultiplier = Math.max(1, result.combat.resourceRecovery);
  }
"""
new_block = """  const derived = highflyTrainingDerivedModifiers(profile);

  // Core power is applied ONCE, here, to derived outputs. Claude's internal
  // class/gear primaries remain untouched and therefore cannot become HIGHFLY Core.
  entity.attackPower = Math.max(
    0,
    baseline.attackPower * (1 + derived.physicalAttackBonus),
  );
  entity.rangedPower = Math.max(
    0,
    baseline.rangedPower * (1 + derived.rangedAttackBonus),
  );
  entity.spellPower = Math.max(
    0,
    baseline.spellPower * (1 + derived.spellPowerBonus),
  );
  entity.healPower = Math.max(
    0,
    baseline.healPower * (1 + derived.healingPowerBonus),
  );
  entity.maxHp = Math.max(
    1,
    Math.round(baseline.maxHp * (1 + derived.maxHpBonus)),
  );

  entity.critChance = Math.max(
    0,
    Math.min(1, baseline.critChance + derived.critChanceBonus),
  );
  entity.dodgeChance = Math.max(
    0,
    Math.min(1, baseline.dodgeChance + derived.dodgeChanceBonus),
  );

  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(
      0,
      baseline.moveSpeed * (1 + derived.moveSpeedBonus),
    );
  }
  if (flags.applyPerception) {
    entity.hitBonus = Math.max(0, Math.min(1, baseline.hitBonus + derived.hitBonus));
    entity.critDmgPhysBonus = Math.max(
      0,
      baseline.critDmgPhysBonus + derived.weakPointBonus,
    );
    entity.critDmgSpellBonus = Math.max(
      0,
      baseline.critDmgSpellBonus + derived.weakPointBonus,
    );
    entity.critDmgHealBonus = Math.max(
      0,
      baseline.critDmgHealBonus + derived.weakPointBonus,
    );
  }
  if (flags.applyIntelligence) {
    entity.highflyResourceCostMultiplier = Math.max(
      0.1,
      1 - derived.resourceCostReduction,
    );
    entity.highflyResourceRecoveryMultiplier = Math.max(
      1,
      1 + derived.resourceRecoveryBonus,
    );
  }
"""
replace_once(runtime, old_block, new_block, "PF-5 derived output mapping")

replace_once(
    runtime,
    """    attackPower: entity.attackPower,
    rangedPower: entity.rangedPower,
    maxHp: entity.maxHp,
""",
    """    attackPower: entity.attackPower,
    rangedPower: entity.rangedPower,
    spellPower: entity.spellPower,
    healPower: entity.healPower,
    maxHp: entity.maxHp,
""",
    "PF-5 baseline snapshot spell/heal",
)

# Final visible semantics after legacy RUN129/RUN137 overlays.
replace_once(
    ui,
    "${profile.awakening.initialized ? (state.calibrated ? 'CORE + TRAINING' : 'DESPERTAR ACTIVO') : 'SIN DESPERTAR'}",
    "${state.trainingAllocated > 0 ? 'TRAINING ACTIVO' : 'CORE 0 · SIN ASIGNAR'}",
    "PF-5 Core badge",
)

replace_once(
    ui,
    """          <div class="hf-core-source">
            <span>DESPERTAR <b>${state.awakeningBase.toFixed(2)}</b></span>
            <span>NIVEL <b>+${state.naturalLevelGrowth.toFixed(2)}</b></span>
            <span>TRAINING <b>+${state.trainingAllocated.toFixed(2)}</b></span>
          </div>
""",
    """          <div class="hf-core-source">
            <span>TRAINING CORE <b>${state.trainingAllocated.toFixed(2)}</b></span>
            <span>CLASE · NIVEL · EQUIPO <b>0 CORE</b></span>
          </div>
""",
    "PF-5 Core source display",
)

replace_once(
    ui,
    "El Core nace del DESPERTAR de clase y después sólo aumenta mediante entrenamiento real",
    "STR / AGI / VIT / PER / INT nacen en 0 y sólo aumentan mediante entrenamiento real",
    "PF-5 Core authority copy",
)

final_runtime = runtime.read_text(encoding="utf-8")
if "applyTrainingBridge(" in final_runtime or "trainingGain(" in final_runtime:
    raise SystemExit("PF-5 legacy Training bridge survived runtime")
if "highflyTrainingDerivedModifiers(profile)" not in final_runtime:
    raise SystemExit("PF-5 derived authority missing")
if "resolveHighflyPrimaryCoreForEntity" in Path("src/sim/entity.ts").read_text(encoding="utf-8"):
    raise SystemExit("PF-5 must not inject HIGHFLY Core into Claude primary stats")

final_ui = ui.read_text(encoding="utf-8")
for forbidden in ("DESPERTAR <b>", "NIVEL <b>+", "El Core nace del DESPERTAR"):
    if forbidden in final_ui:
        raise SystemExit(f"PF-5 obsolete Core source survived: {forbidden}")
if "CLASE · NIVEL · EQUIPO <b>0 CORE</b>" not in final_ui:
    raise SystemExit("PF-5 Training-only Core disclosure missing")

print("HIGHFLY_PROGRESSION_PF5_TRAINING_ONLY_BRIDGE_APPLIED=1")
