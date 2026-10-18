/** R37 — read-only native ClaudeCraft ability aim audit.
 * Never grants skills, changes damage, rewrites spell defs, or bypasses saves.
 * One source of truth for S1, meteor and original AoE lab metadata.
 */
import { ABILITIES } from '../sim/content/classes';
import { highflyAimSpec } from './highfly_origin_r20_premium_aim';

export const HIGHFLY_R37_REFERENCE_SKILLS =
  ['fireball','meteor','flamestrike','rain_of_fire','blizzard'] as const;
export type HighflyR37SkillId = typeof HIGHFLY_R37_REFERENCE_SKILLS[number];

export interface HighflyR37AimTruth {
  id:HighflyR37SkillId;
  shape:'line'|'circle';
  range:number;radius:number;
  targetMode:string;
  delaySeconds:number;
  durationSeconds:number;
  cooldown:number;
  nativeLearnLevel:number;
}
export function highflyR37AimTruth(id:HighflyR37SkillId):HighflyR37AimTruth {
  const def=ABILITIES[id];
  const aim=highflyAimSpec(id);
  if(!def||!aim || !(aim.shape==='circle'||aim.shape==='line'))
    throw Error('R37_NATIVE_ABILITY_AIM_DRIFT_'+id);
  const aoe=def.effects.find(e=>e.type==='groundAoE');
  const duration=aoe&&'duration' in aoe&&typeof aoe.duration==='number'?
    aoe.duration:0;
  const interval=aoe&&'interval' in aoe&&typeof aoe.interval==='number'?
    aoe.interval:0;
  const delayed=aoe&&'delayed' in aoe&&aoe.delayed===true;
  // A native groundAoE first hits after its next pulse, not immediately.
  // Flamestrike is a cast-time ground explosion, handled separately.
  const delay=delayed?interval:(def.castTime||0);
  return {
    id,shape:aim.shape,range:aim.range,radius:aim.radius,
    targetMode:def.targetMode??(def.requiresTarget?'entity':'self'),
    delaySeconds:delay,durationSeconds:duration,
    cooldown:def.cooldown??0,nativeLearnLevel:def.learnLevel,
  };
}
