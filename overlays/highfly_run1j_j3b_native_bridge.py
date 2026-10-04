from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

runtime = Path("src/highfly/training/combat_runtime.ts")
types = Path("src/sim/types.ts")
ability = Path("src/sim/combat/ability_resolution.ts")
auras = Path("src/sim/combat/auras.ts")

replace_once(
    runtime,
    "import { applyTrainingBridge } from './bridge';",
    "import { applyTrainingBridge, trainingGain } from './bridge';",
    "bridge import",
)

replace_once(
    runtime,
    """  attackPower: number;
  maxHp: number;
  hp: number;
  critChance: number;
  moveSpeed: number;
  dead: boolean;
""",
    """  attackPower: number;
  rangedPower: number;
  maxHp: number;
  hp: number;
  critChance: number;
  dodgeChance: number;
  hitBonus: number;
  critDmgPhysBonus: number;
  critDmgSpellBonus: number;
  critDmgHealBonus: number;
  moveSpeed: number;
  dead: boolean;
  highflyResourceCostMultiplier?: number;
  highflyResourceRecoveryMultiplier?: number;
""",
    "entity bridge fields",
)

replace_once(
    runtime,
    """  attackPower: number;
  maxHp: number;
  critChance: number;
  moveSpeed: number;
""",
    """  attackPower: number;
  rangedPower: number;
  maxHp: number;
  critChance: number;
  dodgeChance: number;
  hitBonus: number;
  critDmgPhysBonus: number;
  critDmgSpellBonus: number;
  critDmgHealBonus: number;
  moveSpeed: number;
""",
    "baseline fields",
)

replace_once(
    runtime,
    """  entity.attackPower = baseline.attackPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.moveSpeed = baseline.moveSpeed;
""",
    """  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.dodgeChance = baseline.dodgeChance;
  entity.hitBonus = baseline.hitBonus;
  entity.critDmgPhysBonus = baseline.critDmgPhysBonus;
  entity.critDmgSpellBonus = baseline.critDmgSpellBonus;
  entity.critDmgHealBonus = baseline.critDmgHealBonus;
  entity.moveSpeed = baseline.moveSpeed;
  entity.highflyResourceCostMultiplier = 1;
  entity.highflyResourceRecoveryMultiplier = 1;
""",
    "baseline restore",
)

replace_once(
    runtime,
    """      stagger: 1,
      power: 1,
      moveSpeed: baseline.moveSpeed,
""",
    """      stagger: 1,
      power: baseline.rangedPower > 0 ? baseline.rangedPower : 1,
      moveSpeed: baseline.moveSpeed,
""",
    "AGI power baseline",
)

replace_once(
    runtime,
    """  entity.attackPower = Math.max(0, result.combat.physicalAP);
  entity.maxHp = Math.max(1, Math.round(result.combat.maxHP));
  entity.critChance = Math.max(0, Math.min(1, result.combat.critChance));
  if (flags.applyMovement) entity.moveSpeed = Math.max(0, result.combat.moveSpeed);
  entity.hp = entity.dead
""",
    """  entity.attackPower = Math.max(0, result.combat.physicalAP);
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
  entity.hp = entity.dead
""",
    "native output mapping",
)

replace_once(
    runtime,
    """    attackPower: entity.attackPower,
    maxHp: entity.maxHp,
    critChance: entity.critChance,
    moveSpeed: entity.moveSpeed,
""",
    """    attackPower: entity.attackPower,
    rangedPower: entity.rangedPower,
    maxHp: entity.maxHp,
    critChance: entity.critChance,
    dodgeChance: entity.dodgeChance,
    hitBonus: entity.hitBonus,
    critDmgPhysBonus: entity.critDmgPhysBonus,
    critDmgSpellBonus: entity.critDmgSpellBonus,
    critDmgHealBonus: entity.critDmgHealBonus,
    moveSpeed: entity.moveSpeed,
""",
    "native baseline snapshot",
)

replace_once(
    types,
    """  moveSpeed: number;
  hostile: boolean;
""",
    """  moveSpeed: number;
  // HIGHFLY Training bridge: local/offline Hunter-only derived resource modifiers.
  highflyResourceCostMultiplier?: number;
  highflyResourceRecoveryMultiplier?: number;
  hostile: boolean;
""",
    "entity optional HIGHFLY resource fields",
)

replace_once(
    ability,
    """  if (abilityId === 'arcane_surge' && cost > 0) {
    cost = Math.round(cost * aetherSurgeCostMult(actor));
  }
""",
    """  if (abilityId === 'arcane_surge' && cost > 0) {
    cost = Math.round(cost * aetherSurgeCostMult(actor));
  }
  // HIGHFLY INT: final resolved resource efficiency. This lives in the canonical
  // cost tail so readiness, tooltip and actual spend all see the same number.
  const highflyCostMult = actor.highflyResourceCostMultiplier ?? 1;
  if (cost > 0 && highflyCostMult < 1) {
    cost = Math.max(0, Math.round(cost * highflyCostMult));
  }
""",
    "INT cost tail",
)

replace_once(
    auras,
    """  if (p.resourceType !== 'energy') regenParkedCatEnergy(p);
  if (p.resourceType === 'mana') {
""",
    """  if (p.resourceType !== 'energy') regenParkedCatEnergy(p);
  const highflyRegenStart = p.resource;
  if (p.resourceType === 'mana') {
""",
    "INT regen start",
)

replace_once(
    auras,
    """  } else if (p.resourceType === 'rage' && !p.inCombat) {
    p.resource = Math.max(0, p.resource - 2);
  }
  // Eating STACKS with natural regen (issue #1608), matching how drinking
""",
    """  } else if (p.resourceType === 'rage' && !p.inCombat) {
    p.resource = Math.max(0, p.resource - 2);
  }
  const highflyRecovery = p.highflyResourceRecoveryMultiplier ?? 1;
  if (highflyRecovery > 1 && p.resource > highflyRegenStart) {
    const naturalGain = p.resource - highflyRegenStart;
    const bonus = Math.round(naturalGain * (highflyRecovery - 1));
    p.resource = Math.min(p.maxResource, p.resource + bonus);
  }
  // Eating STACKS with natural regen (issue #1608), matching how drinking
""",
    "INT natural resource recovery",
)

print("HIGHFLY_RUN1J_J3B_NATIVE_BRIDGE_APPLIED=1")
