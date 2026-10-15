/** HIGHFLY ORIGIN R19 · exactly 3 combat skills and 1 support from each of 9 original classes.
 * Rogue has NO genuinely native base AoE: its three picks are all honest,
 * non-AoE actions. Archived skills are not deleted or rewritten.
 */
export type OriginClassName = 'warrior'|'paladin'|'hunter'|'rogue'|'priest'|'shaman'|'mage'|'warlock'|'druid';
export type OriginPickKind='combat'|'support';
export type OriginCombatShape='single'|'area'|'mobility'|'special';
export interface OriginPick{className:OriginClassName;role:OriginPickKind;shape:OriginCombatShape;label:string;}
export const ORIGIN_TOP36:Record<OriginClassName,{combat:readonly [string,string,string];buff:string}>={
 warrior:{combat:['overpower','heroic_leap','pummel'],buff:'battle_shout'},
 paladin:{combat:['hammer_of_grace','consecration','solar_step'],buff:'divine_protection'},
 hunter:{combat:['arcane_shot','volley','trailbreak'],buff:'aspect_of_the_hawk'},
 rogue:{combat:['sinister_strike','ambush','venom_dart'],buff:'evasion'},
 priest:{combat:['mind_blast','holy_nova','veilstep'],buff:'power_word_fortitude'},
 shaman:{combat:['lightning_bolt','chain_lightning','thunderstorm'],buff:'lightning_shield'},
 mage:{combat:['fireball','blizzard','blink'],buff:'frost_armor'},
 warlock:{combat:['shadow_bolt','corpse_explosion','fear'],buff:'demon_skin'},
 druid:{combat:['wrath','hurricane','starfire'],buff:'barkskin'}
};
const SHAPES:Record<OriginClassName,readonly [OriginCombatShape,OriginCombatShape,OriginCombatShape]>={
 warrior:['single','area','special'],paladin:['single','area','mobility'],
 hunter:['single','area','mobility'],rogue:['single','special','single'],
 priest:['single','area','mobility'],shaman:['single','area','area'],
 mage:['single','area','mobility'],warlock:['single','area','special'],
 druid:['single','area','single']
};
export const ORIGIN_FOCUS_SKILLS:ReadonlyMap<string,OriginPick>=new Map(
 (Object.keys(ORIGIN_TOP36) as OriginClassName[]).flatMap(cls=>{
   const pick=ORIGIN_TOP36[cls];
   return [
     ...pick.combat.map((id,i)=>[id,{className:cls,role:'combat',shape:SHAPES[cls][i],label:cls.toUpperCase()}] as const),
     [pick.buff,{className:cls,role:'support',shape:'special',label:cls.toUpperCase()}] as const
   ] as (readonly [string,OriginPick])[];
 })
);
export const ORIGIN_ROGUE_AOE_PENDING=true;
export function originFocusRole(id:string):OriginPickKind|null{
 return ORIGIN_FOCUS_SKILLS.get(id)?.role??null;
}
