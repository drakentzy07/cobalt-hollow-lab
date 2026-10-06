from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

entity = Path("src/sim/entity.ts")
main = Path("src/main.ts")
runtime = Path("src/highfly/training/combat_runtime.ts")

# ---------------------------------------------------------------------------
# PF-5A — Primary Core enters ClaudeCraft's ONE canonical stat pass.
# Gear, buffs, talents, forms and all downstream derived-stat code stay donor.
# ---------------------------------------------------------------------------
entity_text = entity.read_text(encoding="utf-8")
authority_import = (
    "import { resolveHighflyPrimaryCoreForEntity } "
    "from '../highfly/training/stat_authority';\n"
)
if authority_import not in entity_text:
    entity.write_text(authority_import + entity_text, encoding="utf-8")

replace_once(
    entity,
    """  const def = CLASSES[cls];
  const lvl = e.level;
  const s: Stats = {
    str: def.baseStats.str + def.statsPerLevel.str * (lvl - 1),
    agi: def.baseStats.agi + def.statsPerLevel.agi * (lvl - 1),
    sta: def.baseStats.sta + def.statsPerLevel.sta * (lvl - 1),
    int: def.baseStats.int + def.statsPerLevel.int * (lvl - 1),
    spi: def.baseStats.spi + def.statsPerLevel.spi * (lvl - 1),
""",
    """  const def = CLASSES[cls];
  const lvl = e.level;
  // HIGHFLY PF-5: replace ONLY the class+level primary seed for the bound local
  // Hunter. ClaudeCraft remains the single downstream authority for gear,
  // buffs, talents, forms, AP/SP/HP/armor/crit/dodge and resources.
  const highflyCore = resolveHighflyPrimaryCoreForEntity(e.id, cls, lvl);
  const s: Stats = {
    str: highflyCore?.STR ?? def.baseStats.str + def.statsPerLevel.str * (lvl - 1),
    agi: highflyCore?.AGI ?? def.baseStats.agi + def.statsPerLevel.agi * (lvl - 1),
    sta: highflyCore?.VIT ?? def.baseStats.sta + def.statsPerLevel.sta * (lvl - 1),
    int: highflyCore?.INT ?? def.baseStats.int + def.statsPerLevel.int * (lvl - 1),
    spi: highflyCore?.PER ?? def.baseStats.spi + def.statsPerLevel.spi * (lvl - 1),
""",
    "PF-5 primary seed",
)

# ---------------------------------------------------------------------------
# PF-5B — Arm before Sim construction, then hard-bind to its local player id.
# ---------------------------------------------------------------------------
replace_once(
    main,
    """import {
  applyActiveTrainingBridgeToEntity,
  bindActiveTrainingCombatEntity,
  setActiveTrainingBridgeFlags,
} from './highfly/training/combat_runtime';
""",
    """import {
  applyActiveTrainingBridgeToEntity,
  bindActiveTrainingCombatEntity,
  setActiveTrainingBridgeFlags,
} from './highfly/training/combat_runtime';
import {
  armHighflyLocalStatAuthority,
  bindHighflyLocalStatAuthority,
} from './highfly/training/stat_authority';
""",
    "PF-5 main stat-authority imports",
)

replace_once(
    main,
    """  setActiveHighflyHunterProfile(
    applyHunterProgression(baseTrainingProfile, { classId: playerClass }),
  );
  installHighflyTrainingUi();
""",
    """  setActiveHighflyHunterProfile(
    applyHunterProgression(baseTrainingProfile, { classId: playerClass }),
  );
  // The next matching player recalc is the offline Hunter being constructed.
  // Once claimed, PF-5 refuses every other player/probe id.
  armHighflyLocalStatAuthority();
  installHighflyTrainingUi();
""",
    "PF-5 arm before Sim",
)

replace_once(
    main,
    """  bindActiveTrainingCombatEntity(sim.player);
  setActiveTrainingBridgeFlags({
    enabled: true,
    applyMovement: false,
    applyPerception: true,
    applyIntelligence: false,
  });
""",
    """  bindActiveTrainingCombatEntity(sim.player);
  bindHighflyLocalStatAuthority(sim.player.id);
  setActiveTrainingBridgeFlags({
    enabled: true,
    applyMovement: true,
    applyPerception: true,
    applyIntelligence: true,
  });
""",
    "PF-5 bind local authority",
)

# ---------------------------------------------------------------------------
# PF-5C — Retire duplicate Training-derived AP/HP/crit/dodge/ranged multipliers.
# The legacy bridge may remain importable for old tests/history, but runtime no
# longer calls it. Only mechanics Claude does NOT natively derive remain here.
# ---------------------------------------------------------------------------
replace_once(
    runtime,
    "import { applyTrainingBridge, trainingGain } from './bridge';",
    "import { highflyUniqueCoreModifiers } from './stat_authority';",
    "PF-5 runtime authority import",
)

old = """  const result = applyTrainingBridge({
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
new = """  // PF-5: AP/ranged AP/HP/crit/dodge are ALREADY derived from the full HIGHFLY
  // primary Core inside recalcPlayerStats. Never multiply them here again.
  const unique = highflyUniqueCoreModifiers(profile);
  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.dodgeChance = baseline.dodgeChance;

  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(0, baseline.moveSpeed * (1 + unique.moveSpeedBonus));
  }
  if (flags.applyPerception) {
    entity.hitBonus = Math.max(0, Math.min(1, baseline.hitBonus + unique.hitBonus));
    entity.critDmgPhysBonus = Math.max(0, baseline.critDmgPhysBonus + unique.weakPointBonus);
    entity.critDmgSpellBonus = Math.max(0, baseline.critDmgSpellBonus + unique.weakPointBonus);
    entity.critDmgHealBonus = Math.max(0, baseline.critDmgHealBonus + unique.weakPointBonus);
  }
  if (flags.applyIntelligence) {
    entity.highflyResourceCostMultiplier = Math.max(
      0.1,
      1 - unique.resourceCostReduction,
    );
    entity.highflyResourceRecoveryMultiplier = Math.max(
      1,
      1 + unique.resourceRecoveryBonus,
    );
  }
"""
replace_once(runtime, old, new, "PF-5 dedupe runtime outputs")

final_runtime = runtime.read_text(encoding="utf-8")
if "applyTrainingBridge(" in final_runtime or "trainingGain(" in final_runtime:
    raise SystemExit("PF-5 duplicate Training bridge survived combat runtime")
if "entity.attackPower = baseline.attackPower;" not in final_runtime:
    raise SystemExit("PF-5 donor AP authority missing")
if "highflyUniqueCoreModifiers(profile)" not in final_runtime:
    raise SystemExit("PF-5 unique Core modifier seam missing")

print("HIGHFLY_PROGRESSION_PF5_STAT_AUTHORITY_APPLIED=1")
