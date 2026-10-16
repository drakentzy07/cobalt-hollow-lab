/** R30 isolated lab rank and resource policy.
 * - Original level 1..20 rank data untouched in the frozen parent registry.
 * - Preview resolves the rank at the CURRENT hunter level, never always rank 1.
 * - Levels 21..99: conservative provisional data-only improvement (not a
 *   replacement for mastery unlocks or real equipment/stat scaling).
 * - Casts instant; cooldowns bounded for mobile and AoE/VFX safety;
 *   MP/Stamina remain authoritative and actually spent by the native Sim.
 */
import type {AbilityDef,AbilityEffect} from './types';
import type {ResolvedAbility} from './resolved_ability';
import { ABILITIES } from './content/classes';
import {R30_ORIGINAL_45,R30_PREMIUM_23} from './highfly_origin_r30_curated77';
const selected=new Set([...R30_ORIGINAL_45,...R30_PREMIUM_23]);
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function r30Growth(level:number):number{
 const lv=clamp(Math.floor(Number.isFinite(level)?level:1),1,99);
 return lv<=20?1:Number((1+(lv-20)*0.028).toFixed(5));
}
function scaleEffect(e:AbilityEffect,mult:number):AbilityEffect{
 if(mult===1)return {...e};
 // Damage/heal numeric output ONLY; NEVER multiply crowd-control duration,
 // radii, knockback, movement distances, proc odds or status values.
 const damage=new Set([
  'directDamage','aoeDamage','groundAoE','weaponStrike','weaponDamage',
  'dot','drainTick','heal','aoeHeal','hot','projectileDamage'
 ]);
 if(!damage.has(e.type))return {...e};
 const src=e as unknown as Record<string,unknown>;
 const out:Record<string,unknown>={...src};
 for(const field of ['min','max','bonus','total','amount']){
  const n=src[field];
  if(typeof n==='number'&&Number.isFinite(n)&&n>0)out[field]=Math.max(1,Math.round(n*mult));
 }
 return out as unknown as AbilityEffect;
}
function nonResourceCooldown(d:AbilityDef):number{
 // Resource is the main spam limiter, not long cast bars. Mobility/large AoE
 // still need tiny GPU and motion safety windows.
 if(d.targetMode==='position')return Math.min(4,Math.max(1,d.cooldown));
 if(d.channel)return Math.min(3,Math.max(1,d.cooldown));
 if(d.effects.some(x=>['aoeDamage','groundAoE','repositionToAim'].includes(x.type)))
   return Math.min(2,Math.max(0.5,d.cooldown));
 return 0.25;
}
export function r30ResolveSelected(id:string,level:number):ResolvedAbility{
 const d=ABILITIES[id];
 if(!selected.has(id)||!d||d.hiddenFromPlayer||d.passive)
  throw Error('R30_NOT_ADMITTED_'+id);
 const lv=clamp(Math.floor(Number.isFinite(level)?level:1),1,99);
 const source=[...(d.ranks??[])].filter(r=>r.level<=lv).sort((a,b)=>a.level-b.level).at(-1);
 const effects=(source?.effects??d.effects).map(e=>scaleEffect(e,r30Growth(lv)));
 const origCost=source?.cost??d.cost;
 // Keep actual MP or stamina spend: physically free spells should not become
 // infinite zero-cost projectiles in the faster combat prototype.
 const cost=Math.max(12,Math.round(origCost));
 const cd=nonResourceCooldown(d);
 const resolved:ResolvedAbility={
  def:d,rank:source?.rank??1,cost,castTime:0,cooldown:cd,effects,
  threatFlat:source?.threatFlat??d.threat?.flat??0,
  threatMult:d.threat?.mult??1,
  bonusCharges:Math.max(0,(d.maxCharges??1)-1)
 };
 if(d.maxCharges!==undefined)resolved.charges=d.maxCharges;
 return resolved;
}
