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
# PF-5 / C2.1 — PERMANENT CORE authority
#
# Permanent Core = Awakening/Class Base + Natural LV Growth + Training.
# Replace only Claude's class+level PRIMARY seed for the bound local Hunter.
# Claude still owns gear, buffs, talents, forms and all derived combat formulas.
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
  // HIGHFLY permanent Core replaces ONLY the local Hunter's class+level seed.
  // Claude remains the single downstream authority for gear/buffs/talents and
  // derived AP/SP/HP/armor/crit/dodge/resources.
  const highflyCore = resolveHighflyPrimaryCoreForEntity(e.id, cls, lvl);
  const s: Stats = {
    str: highflyCore?.STR ?? def.baseStats.str + def.statsPerLevel.str * (lvl - 1),
    agi: highflyCore?.AGI ?? def.baseStats.agi + def.statsPerLevel.agi * (lvl - 1),
    sta: highflyCore?.VIT ?? def.baseStats.sta + def.statsPerLevel.sta * (lvl - 1),
    int: highflyCore?.INT ?? def.baseStats.int + def.statsPerLevel.int * (lvl - 1),
    spi: highflyCore?.PER ?? def.baseStats.spi + def.statsPerLevel.spi * (lvl - 1),
""",
    "PF-5 permanent primary seed",
)

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
    "PF-5 main stat authority imports",
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
  // Arm before Sim construction; the first matching local player claims the id.
  armHighflyLocalStatAuthority();
  installHighflyTrainingUi();
""",
    "PF-5 arm local authority",
)

replace_once(
    main,
    "  bindActiveTrainingCombatEntity(sim.player);\n",
    """  bindActiveTrainingCombatEntity(sim.player);
  bindHighflyLocalStatAuthority(sim.player.id);
""",
    "PF-5 bind local authority",
)

# ---------------------------------------------------------------------------
# Core enters Claude exactly once through primary recalc. The bridge now adds
# only HIGHFLY-specific side mechanics not already derived by Claude.
# ---------------------------------------------------------------------------
replace_once(
    runtime,
    "import { applyTrainingBridge, trainingGain } from './bridge';",
    "import { highflyUniqueCoreModifiers } from './stat_authority';",
    "PF-5 unique-authority import",
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
new_block = """  const unique = highflyUniqueCoreModifiers(profile);

  // AP/SP/HP/crit/dodge already came from the full permanent Core inside
  // recalcPlayerStats. Never count them a second time here.
  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.spellPower = baseline.spellPower;
  entity.healPower = baseline.healPower;
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
    entity.highflyResourceCostMultiplier = Math.max(0.1, 1 - unique.resourceCostReduction);
    entity.highflyResourceRecoveryMultiplier = Math.max(1, 1 + unique.resourceRecoveryBonus);
  }
"""
replace_once(runtime, old_block, new_block, "PF-5 single-count mapping")

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

final_runtime = runtime.read_text(encoding="utf-8")
if "applyTrainingBridge(" in final_runtime or "trainingGain(" in final_runtime:
    raise SystemExit("PF-5 duplicate Training bridge survived runtime")
if "highflyUniqueCoreModifiers(profile)" not in final_runtime:
    raise SystemExit("PF-5 unique Core seam missing")
if "resolveHighflyPrimaryCoreForEntity" not in entity.read_text(encoding="utf-8"):
    raise SystemExit("PF-5 permanent primary authority missing")

print("HIGHFLY_PROGRESSION_PF5_PERMANENT_CORE_APPLIED=1")
