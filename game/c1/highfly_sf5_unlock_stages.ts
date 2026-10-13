/**
 * HIGHFLY V10 / SF5 — HIGHFLY unlock levels, not ClaudeCraft donor learn levels,
 * govern the 9×7 fusion recipes. READ ONLY: does not register any ability.
 * Original source abilities keep their own requirements intact.
 */
import { HIGHFLY_FUSED_SKILLS, type HighflyClass, type HighflyFusionSpec } from './sf3_skill_catalog';
import type { AbilityDef } from '../sim/types';

export type Sf5StageStatus = 'recipe-locked' | 'needs-starter'
  | 'one-source' | 'multi-source-eligible';
export interface Sf5SkillStage {
  readonly specId: string;
  readonly classId: HighflyClass;
  readonly level: number;
  readonly unlockLevel: number;
  readonly status: Sf5StageStatus;
  readonly usableSourceIds: readonly string[];
  readonly futureSourceIds: readonly string[];
  /** NOT a claim that the whole fusion is mechanically implemented. */
  readonly mechanicAdapterStillRequired: true;
}

function sourceIsEligible(donor: AbilityDef): boolean {
  return !donor.passive && !donor.hiddenFromPlayer;
}
export function highflySf5SkillStage(
  spec: HighflyFusionSpec,
  level: number,
  abilities: Readonly<Record<string, AbilityDef>>,
): Sf5SkillStage {
  if (!Number.isInteger(level) || level < 1)
    throw new Error('SF5 invalid Hunter level: ' + level);
  const donors = spec.donors.map(id => {
    const ability = abilities[id];
    if (!ability || ability.class !== spec.classId)
      throw new Error('SF5 absent or foreign source: ' + spec.id + ' / ' + id);
    return ability;
  });
  const unlocked=level >= spec.unlockLevel;
  const usableSourceIds = unlocked ? spec.donors.filter((_,i)=>sourceIsEligible(donors[i])) : [];
  const futureSourceIds = spec.donors.filter((_,i)=>!unlocked || !sourceIsEligible(donors[i]));
  const status: Sf5StageStatus = level < spec.unlockLevel ? 'recipe-locked'
    : usableSourceIds.length === 0 ? 'needs-starter'
    : usableSourceIds.length === 1 ? 'one-source'
    : 'multi-source-eligible';
  return {
    specId: spec.id, classId: spec.classId, level,
    unlockLevel: spec.unlockLevel, status,
    usableSourceIds, futureSourceIds,
    mechanicAdapterStillRequired: true,
  };
}
export function highflySf5AllStages(
  level: number,
  abilities: Readonly<Record<string, AbilityDef>>,
): readonly Sf5SkillStage[] {
  return Object.values(HIGHFLY_FUSED_SKILLS)
    .flatMap(specs => specs.map(spec => highflySf5SkillStage(spec,level,abilities)));
}
export function highflySf5ClassStages(
  classId: HighflyClass,
  level: number,
  abilities: Readonly<Record<string, AbilityDef>>,
): readonly Sf5SkillStage[] {
  return HIGHFLY_FUSED_SKILLS[classId].map(spec =>
    highflySf5SkillStage(spec,level,abilities));
}
