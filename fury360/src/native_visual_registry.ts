/**
 * FURY native visual mapper for ClaudeCraft v0.44.7 abilities.
 *
 * Conservative by design. Native class/restriction, target type, targeting
 * authority and visual FX never change. Missing metadata means NO fake marker.
 * Unknown ability ids can be authored through the explicit visual overrides.
 */
import type { FurySkillVisualSpec, FuryPreviewTone } from './skill_preview.ts';

export interface FuryNativeEffect {
  type:string;
  radius?:number;
  distance?:number;
  allyBuffPct?:number;
  frontal?:boolean;
}
export interface FuryNativeAbility {
  id:string;
  range:number;
  class?:string;
  requiresTarget:boolean;
  targetType?:'enemy'|'friendly'|'any';
  targetMode?:'position';
  selfCentered?:boolean;
  passive?:boolean;
  hiddenFromPlayer?:boolean;
  effects?:readonly FuryNativeEffect[];
}
export interface FuryVisualMapping {
  spec:FurySkillVisualSpec;
  tone:FuryPreviewTone;
}
export type FuryVisualOverride = Partial<Pick<FurySkillVisualSpec,
  'shape'|'range'|'width'|'radius'|'coneDegrees'|'sensitivity'|'horizontalSign'>>;
const finite=(n:number|undefined):n is number=>n!==undefined&&Number.isFinite(n);
function nativeRadius(ability:FuryNativeAbility):number|null {
  for(const e of ability.effects??[]) {
    if((e.type==='aoeDamage'||e.type==='groundAoE') && finite(e.radius)&&e.radius>0)
      return e.radius;
  }
  return null;
}
/** Only offer reticles whose footprint is grounded in native authored data. */
export function deriveFuryNativeVisual(
  ability:FuryNativeAbility,
  overrides:Readonly<Record<string,FuryVisualOverride>> = {},
):FuryVisualMapping|null {
  if(!ability.id || ability.passive || ability.hiddenFromPlayer ||
      !Number.isFinite(ability.range) || ability.range<0) return null;
  const chosen=overrides[ability.id];
  if(ability.selfCentered && !chosen)return null;
  const radius=nativeRadius(ability);
  const positionAoe=ability.targetMode==='position' &&
    !ability.requiresTarget && !ability.selfCentered && radius!==null;
  // Hostile/friendly target spells have an already-authoritative native target:
  // never convert into free-aim skillshots without an explicit authoring choice.
  if(!chosen && !positionAoe)return null;
  const shape=chosen?.shape??'circle';
  const spec:FurySkillVisualSpec={
    abilityId:ability.id,
    shape,
    range:finite(chosen?.range)?chosen!.range!:ability.range,
    ...(finite(chosen?.radius)?{radius:chosen!.radius!}:radius!==null?{radius}:{}),
    ...(finite(chosen?.width)?{width:chosen!.width!}:{}),
    ...(finite(chosen?.coneDegrees)?{coneDegrees:chosen!.coneDegrees!}:{}),
    ...(finite(chosen?.sensitivity)?{sensitivity:chosen!.sensitivity!}:{}),
    ...(chosen?.horizontalSign?{horizontalSign:chosen.horizontalSign}:{}),
  };
  if(spec.range<0||!finite(spec.range))return null;
  // The caller MUST still decide whether native casting accepts a world point,
  // a target entity, or direction-only facing; this is presentation metadata.
  const tone:FuryPreviewTone=
    ability.targetType==='friendly'||ability.effects?.some(e=>e.allyBuffPct!==undefined)
      ?'friendly'
      :shape==='dash'||shape==='leap'?'mobility':'offensive';
  return {spec,tone};
}
