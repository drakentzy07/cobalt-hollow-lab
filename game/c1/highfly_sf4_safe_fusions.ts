/**
 * HIGHFLY SF4 · first native fusion pilots — no new combat engine.
 *
 * IMPORTANT: The previous SF3 registry proved that 63 donor IDs exist; it did
 * NOT prove that 63 skills can be mechanically fused. Never copy the entire
 * donor's effects onto arbitrary targets. Only hand-audited, explicit pilot
 * recipes below can be registered. Other 59 definitions remain locked.
 *
 * Opt-in code path is installed only when VITE_HIGHFLY_SF4 === '1' by the
 * isolated overlay. No mutation of Training, inventory, saves or world data.
 */
import type { AbilityDef, AbilityEffect } from '../sim/types';
import {
  HIGHFLY_FUSED_SKILLS,
  type HighflyFusionSpec,
  type HighflyClass,
} from './sf3_skill_catalog';

export type Sf4Status = 'native-pilot' | 'blocked-needs-adapter' | 'design-mismatch';
export interface Sf4Readiness {
  readonly id: string;
  readonly classId: HighflyClass;
  readonly unlockLevel: number;
  readonly status: Sf4Status;
  readonly note: string;
}

// These are prototype *mechanics*, not combat-certified player rewards.
// "Despertar del Bosque" used two resurrection donors to describe a damaging
// field in the PDF: block it until the authored design is corrected.
const PILOT_IDS = new Set([
  'hf_warrior_u1', // two distinct native group-buff effects
  'hf_rogue_s4',  // two distinct off-GCD self-buff effects
  'hf_priest_s2', // shadow damage + reduced periodic shadow damage
  'hf_priest_s3', // absorb + reduced healing over time
]);
const DESIGN_MISMATCHES: Readonly<Record<string, string>> = {
  hf_druid_u1:
    'Los donantes grove_awakening y wildwake resucitan; no forman un área ofensiva. Necesita nuevo diseño y donantes.',
  hf_druid_s5:
    'Travel Form y Dash exigen transiciones de forma; no se pueden sumar como buffs genéricos.',
  hf_hunter_s3:
    'Frostjaw Trap instala una trampa con propietario/armado; Concussive Shot apunta a una entidad. Se necesita lógica contextual.',
  hf_rogue_u2:
    'Stealth requiere estar fuera de combate; Blind y Ambush apuntan a enemigos. No se puede copiar como una sola ejecución.',
  hf_shaman_s4:
    'Unleash Weapon utiliza una ruta procedimental con effects: []; copiar su definición no aplica la imbuición.',
};
export function sf4Readiness(): readonly Sf4Readiness[] {
  return Object.values(HIGHFLY_FUSED_SKILLS).flatMap((skills) =>
    skills.map((skill) => ({
      id: skill.id,
      classId: skill.classId,
      unlockLevel: skill.unlockLevel,
      status: (PILOT_IDS.has(skill.id)
        ? 'native-pilot'
        : Object.hasOwn(DESIGN_MISMATCHES, skill.id)
          ? 'design-mismatch'
          : 'blocked-needs-adapter') as Sf4Status,
      note: PILOT_IDS.has(skill.id)
        ? 'Efectos nativos candidatos para simulación de combate; aún no certificados.'
        : DESIGN_MISMATCHES[skill.id]
          ?? 'Donantes registrados, pero falta un adaptador de efecto/objetivo/forma o VFX validado.',
    })),
  );
}
export interface Sf4InstallResult {
  readonly registered: readonly string[];
  readonly blocked: readonly string[];
  readonly mismatchedDesign: readonly string[];
}

function baseEffectAt(def: AbilityDef, level: number): readonly AbilityEffect[] {
  let effects = def.effects;
  for (const rank of def.ranks ?? []) if (rank.level <= level) effects = rank.effects;
  return effects;
}
function costAt(def: AbilityDef, level: number): number {
  let cost = def.cost;
  for (const rank of def.ranks ?? []) if (rank.level <= level) cost = rank.cost;
  return cost;
}
function sameTargetAndSchool(a: AbilityDef, b: AbilityDef): boolean {
  return a.class === b.class
    && a.school === b.school
    && a.requiresTarget === b.requiresTarget
    && (a.targetType ?? 'enemy') === (b.targetType ?? 'enemy')
    && (a.targetMode ?? 'entity') === (b.targetMode ?? 'entity')
    && (a.selfCentered ?? false) === (b.selfCentered ?? false)
    && a.range === b.range
    && a.minRange === b.minRange
    && a.scalesWith === b.scalesWith
    && a.projectile === b.projectile
    && a.partyOnlyTarget === b.partyOnlyTarget
    && a.targetsDead === b.targetsDead;
}
function safelyUnrestricted(def: AbilityDef, allowOffGcd = false): boolean {
  return !def.passive && !def.hiddenFromPlayer && !def.onNextSwing
    && !def.empowerStages && !def.channel && !def.specs && !def.excludeSpecs
    && !def.requiresQuest && !def.requiresForm && !def.requiresAuraKind
    && !def.requiresOutOfCombat && !def.requiresStealth
    && !def.requiresOutsideInstance && !def.requiresShield
    && !def.requiresDodgeProc && !def.requiresTargetHpBelow
    && !def.executeThreshold && !def.spendsCombo && !def.awardsCombo
    && !def.actionReplacement && (!def.offGcd || allowOffGcd)
    && !def.usableWhileCasting
    && !def.soulFragmentCost && !def.devotionCost && !def.ruinCost
    && !def.spendsAllResource && !def.maxCharges;
}
/**
 * Four hand-audited *composition shapes*, NOT certified combat outcomes.
 *
 * Warrior U1: battle_shout (raid AP buff) + rallying_cry (temporary raid HP).
 * Rogue S4: sprint (speed) + evasion (dodge), preserving off-GCD and 300s CD.
 * Priest S2: mind_blast directDamage + 30% of shadow_word_pain's DoT.
 * Priest S3: power_word_shield absorb + 30% of renew's HoT.
 *
 * The percentages are conservative tuning placeholders until native combat QA.
 * Other scripts keyed to the original donor ID (e.g. spec proc hooks) are
 * explicitly NOT claimed to carry into the fusion.
 */
function composePilot(
  spec: HighflyFusionSpec, primary: AbilityDef, second: AbilityDef,
): AbilityDef {
  // Never unlock a donor's LV20 mechanics through an LV15 fusion.
  if (primary.learnLevel > spec.unlockLevel || second.learnLevel > spec.unlockLevel)
    throw new Error('SF4 donor level exceeds fusion unlock: ' + spec.id);
  // Rank-specific cast times cannot silently revert to the base cast clock.
  if ([primary, second].some(donor =>
    donor.ranks?.some(rank => rank.castTime !== undefined && rank.castTime !== donor.castTime)))
    throw new Error('SF4 rank cast timing requires adapter: ' + spec.id);
  const rogueOffGcd = spec.id === 'hf_rogue_s4';
  if (!sameTargetAndSchool(primary, second)
    || !safelyUnrestricted(primary, rogueOffGcd)
    || !safelyUnrestricted(second, rogueOffGcd)
    || (rogueOffGcd && !(primary.offGcd && second.offGcd))) {
    throw new Error('SF4 incompatible pilot definitions: ' + spec.id);
  }
  const shapes = {
    hf_warrior_u1: ['buffTarget', 'aoeAllyMaxHp'],
    hf_rogue_s4: ['selfBuff', 'selfBuff'],
    hf_priest_s2: ['directDamage', 'dot'],
    hf_priest_s3: ['absorb', 'hot'],
  } as const;
  const shape = shapes[spec.id as keyof typeof shapes];
  if (!shape || primary.effects.length !== 1 || second.effects.length !== 1
    || primary.effects[0].type !== shape[0]
    || second.effects[0].type !== shape[1]) {
    throw new Error('SF4 unexpected native effect shape: ' + spec.id);
  }
  // Two native self-buffs must have separate aura kinds, otherwise one could
  // overwrite the other and masquerade as a real combined skill.
  if (spec.id === 'hf_rogue_s4') {
    const speed = primary.effects[0], dodge = second.effects[0];
    if (speed.type !== 'selfBuff' || speed.kind !== 'buff_speed'
      || dodge.type !== 'selfBuff' || dodge.kind !== 'buff_dodge')
      throw new Error('SF4 Rogue buff identity changed');
  }
  if (spec.id === 'hf_warrior_u1') {
    const shout = primary.effects[0], morale = second.effects[0];
    if (shout.type !== 'buffTarget' || shout.kind !== 'buff_ap_pct' || !shout.party
      || morale.type !== 'aoeAllyMaxHp')
      throw new Error('SF4 Warrior group effects changed');
  }
  const rankLevels = new Set<number>([spec.unlockLevel]);
  for (const donor of [primary, second]) {
    for (const rank of donor.ranks ?? [])
      if (rank.level > spec.unlockLevel) rankLevels.add(rank.level);
  }
  const snapshots = [...rankLevels].sort((a, b) => a - b).map((level) => {
    const first = baseEffectAt(primary, level);
    const secondEffect = baseEffectAt(second, level)[0];
    if (first.length !== 1 || first[0].type !== shape[0]
      || !secondEffect || secondEffect.type !== shape[1]) {
      throw new Error('SF4 donor rank changed shape at LV' + level + ': ' + spec.id);
    }
    const rider: AbilityEffect = secondEffect.type === 'dot' || secondEffect.type === 'hot'
      ? { ...secondEffect, total: Math.max(1, Math.round(secondEffect.total * 0.3)) }
      : secondEffect;
    return { level, cost: costAt(primary, level), effects: [...first, rider] };
  });
  return {
    ...primary,
    id: spec.id,
    name: spec.name,
    class: spec.classId,
    learnLevel: spec.unlockLevel,
    cooldown: Math.max(primary.cooldown, second.cooldown, spec.ultimate ? 25 : 5),
    effects: snapshots[0].effects,
    ranks: snapshots.slice(1).map((snapshot, index) => ({
      rank: index + 2,
      level: snapshot.level,
      cost: snapshot.cost,
      effects: snapshot.effects,
    })),
    // Do not promise original spec procs when handler code is keyed to old IDs.
    description: 'HIGHFLY SF4 (piloto): ' + spec.name
      + '. Combinación controlada de dos efectos nativos; sin procs por ID heredados.'
      + ' Su balance y VFX deben validarse antes de publicación.',
  };
}

/** Add ONLY four audited pilot definitions to the ONE original Sim registry. */
export function installSf4NativePilots(
  abilities: Record<string, AbilityDef>,
  classes: Record<HighflyClass, { abilities: string[] }>,
): Sf4InstallResult {
  const catalog = Object.values(HIGHFLY_FUSED_SKILLS).flat();
  const prepared: { def: AbilityDef; classId: HighflyClass }[] = [];
  for (const spec of catalog) {
    // Validate the entire destination BEFORE the first write. Otherwise a
    // missing/duplicate class list could leave one Priest skill half installed.
    if (!classes[spec.classId] || !Array.isArray(classes[spec.classId].abilities))
      throw new Error('SF4 missing class registry: ' + spec.classId);
    if (classes[spec.classId].abilities.includes(spec.id))
      throw new Error('SF4 duplicate class slot: ' + spec.id);
    // Donor truth must hold for ALL 63 even though only two are enabled.
    for (const id of spec.donors) {
      if (!abilities[id] || abilities[id].class !== spec.classId)
        throw new Error('SF4 missing or foreign donor: ' + spec.id + ' / ' + id);
    }
    if (abilities[spec.id])
      throw new Error('SF4 duplicate skill: ' + spec.id);
    if (!PILOT_IDS.has(spec.id)) continue;
    if (spec.donors.length !== 2)
      throw new Error('SF4 unexpected pilot donor count: ' + spec.id);
    prepared.push({
      def: composePilot(spec, abilities[spec.donors[0]], abilities[spec.donors[1]]),
      classId: spec.classId,
    });
  }
  if (prepared.length !== 4)
    throw new Error('SF4 expected exactly 4 native pilots');
  // Commit only after complete validation: fail without half-registering kits.
  for (const { def, classId } of prepared) {
    abilities[def.id] = def;
    classes[classId].abilities.push(def.id);
  }
  const status = sf4Readiness();
  return {
    registered: prepared.map((x) => x.def.id),
    blocked: status.filter((x) => x.status === 'blocked-needs-adapter').map((x) => x.id),
    mismatchedDesign: status.filter((x) => x.status === 'design-mismatch').map((x) => x.id),
  };
}
