/** SF4 read-only audit for EVERY one of the 63 skill recipes.
 * Generated at test/runtime from pinned ClaudeCraft AbilityDef truth.
 * No ability is registered or cast by this module.
 */
import type { AbilityDef } from '../sim/types';
import { HIGHFLY_FUSED_SKILLS } from './sf3_skill_catalog';
import { sf4Readiness } from './sf4_safe_fusions';

export interface Sf4DonorDiagnostics {
  readonly id: string;
  readonly classId: string;
  readonly sourceIds: readonly string[];
  readonly status: string;
  readonly blockers: readonly string[];
  readonly sourceEffectKinds: readonly string[];
}
const SPECIAL_EFFECTS = new Set([
  'charge','repositionToAim','blinkForward','hunterStampede',
  'frostjawTrap','hunterShrapnel','hunterTrailbreak','packCommand',
  'summonDemon','summonUndead','armyOfDead','afflictionEvilEye',
  'afflictionCruelPact','finisherDamage','finisherStun','weaponDamage',
  'weaponStrike','selfBuff','imbue','interrupt','groundAoE',
  'resurrectAlly','massResurrectGroup','drainTick','lifeTap',
  'temporalHourglass','frozenOrb','chainDamage',
]);
export function traceSf4FusionDonors(
  abilities: Readonly<Record<string, AbilityDef>>,
): readonly Sf4DonorDiagnostics[] {
  const readiness = new Map(sf4Readiness().map(x => [x.id,x]));
  return Object.values(HIGHFLY_FUSED_SKILLS).flatMap(skills =>
    skills.map(spec => {
      const donors=spec.donors.map(id=>abilities[id]);
      const valid=donors.filter((x):x is AbilityDef=>!!x);
      const blockers:string[]=[];
      const sources=donors.flatMap(x=>(x?.effects??[]).map(effect=>effect.type));
      const missing=spec.donors.filter(id=>!abilities[id]);
      if(missing.length)blockers.push('MISSING_DONOR:'+missing.join(','));
      if(valid.some(x=>x.class!==spec.classId))blockers.push('CROSS_CLASS_DONOR');
      if(valid.some(x=>x.passive || x.hiddenFromPlayer))blockers.push('PASSIVE_OR_HIDDEN_DONOR');
      if(valid.some(x=>x.specs?.length || x.excludeSpecs?.length))blockers.push('SPEC_DEPENDENT_DONOR');
      if(valid.some(x=>x.requiresForm))blockers.push('SHAPESHIFT_FORM_GATE');
      if(valid.some(x=>x.requiresAuraKind))blockers.push('AURA_REQUIRED');
      if(valid.some(x=>x.onNextSwing))blockers.push('ON_NEXT_SWING_HANDLER');
      if(valid.some(x=>x.channel || x.empowerStages))blockers.push('CHANNEL_OR_EMPOWER');
      if(valid.some(x=>x.requiresOutOfCombat))blockers.push('OUT_OF_COMBAT_RESTRICTION');
      if(valid.some(x=>x.effects.length===0))blockers.push('PROCEDURAL_NO_EFFECT_ARRAY');
      if(valid.some(x=>x.effects.some(e=>SPECIAL_EFFECTS.has(e.type))))
        blockers.push('CUSTOM_EFFECT_DISPATCH_REQUIRED');
      const first=valid[0];
      if(first && valid.some(x=>x.requiresTarget!==first.requiresTarget ||
          (x.targetType??'enemy')!==(first.targetType??'enemy') ||
          (x.targetMode??'entity')!==(first.targetMode??'entity')))
        blockers.push('TARGET_CONTRACT_CONFLICT');
      if(first && valid.some(x=>x.school!==first.school))
        blockers.push('MIXED_DAMAGE_SCHOOLS_NEED_ADAPTER');
      if(first && valid.some(x=>x.range!==first.range))
        blockers.push('MIXED_RANGE_REQUIREMENTS');
      if(first && valid.some(x=>x.castTime!==first.castTime))
        blockers.push('MIXED_CAST_TIMINGS');
      // Important: this is only a static audit, NOT a full gameplay proof.
      // Scripted hooks keyed to ability IDs require separate Sim tests.
      if(readiness.get(spec.id)?.status==='design-mismatch')
        blockers.push('AUTHORED_RECIPE_DESIGN_MISMATCH');
      if(readiness.get(spec.id)?.status!=='native-pilot' && blockers.length===0)
        blockers.push('UNREVIEWED_SERVER_ID_HOOKS_AND_BALANCE');
      return {
        id:spec.id,classId:spec.classId,sourceIds:[...spec.donors],
        status:readiness.get(spec.id)?.status??'unknown',
        blockers,sourceEffectKinds:sources,
      };
    }),
  );
}
