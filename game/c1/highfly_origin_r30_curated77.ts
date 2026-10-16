/** R30 playtest manifest — reviewed original IDs, NOT a claim of 77 certified.
 * Native entries have no prerequisite buffs, stealth, execute windows, pets,
 * combo-spend, class restriction or old rage/focus/ruin spending requirement.
 * 23 source effects retained, including 9 explicitly blocked unfinished ones.
 * These are trial selections, not permanent player unlocks.
 */
import { ABILITIES } from './content/classes';
import { originCostDecision } from './highfly_origin_universal_resources';
import { R27_PREMIUM_23 } from './highfly_origin_r27_premium23_catalog';
import { R29_PREMIUM_CONTRACTS } from './highfly_origin_r29_premium_native';

export const R30_ORIGINAL_BY_SCHOOL = {
 warrior:['thunder_clap','whirlwind','heroic_leap','mortal_strike','storm_bolt'],
 paladin:['hammer_of_grace','crusader_strike','holy_shock','consecration','final_edict'],
 hunter:['arcane_shot','volley','concussive_shot','frostjaw_trap','shrapnel_charge'],
 rogue:['sinister_strike','venom_dart','gouge','hemorrhage','crippling_poison'],
 priest:['smite','shadow_word_pain','mind_blast','holy_nova','scouring_mercy'],
 shaman:['lightning_bolt','lava_burst','thunderstorm','earthquake','frost_shock'],
 mage:['fireball','frostbolt','blizzard','flamestrike','cone_of_cold'],
 warlock:['shadow_bolt','immolate','corruption','soul_lance','curse_of_agony'],
 druid:['wrath','moonfire','entangling_roots','hurricane','starfire'],
} as const;
export const R30_ORIGINAL_45:readonly string[]=Object.values(R30_ORIGINAL_BY_SCHOOL).flat();
export const R30_PREMIUM_23:readonly string[]=R27_PREMIUM_23.map(c=>c.id);

/** Proposed, not yet granted passives. Needs real Sim integration and QA.
 * Passive design is intentionally unconditional; mastery unlock is separate.
 */
export const R30_PASSIVE_DESIGNS = [
 {id:'hf_passive_warrior_resolve',school:'warrior',name:'Temple de Acero',stat:'physicalDamagePct',value:0.04},
 {id:'hf_passive_paladin_grace',school:'paladin',name:'Gracia Radiante',stat:'damageReductionPct',value:0.03},
 {id:'hf_passive_hunter_precision',school:'hunter',name:'Precision del Cazador',stat:'rangedDamagePct',value:0.04},
 {id:'hf_passive_rogue_footwork',school:'rogue',name:'Paso del Asesino',stat:'movementSpeedPct',value:0.04},
 {id:'hf_passive_priest_devotion',school:'priest',name:'Voluntad Interior',stat:'spellDamagePct',value:0.04},
 {id:'hf_passive_shaman_resonance',school:'shaman',name:'Resonancia Elemental',stat:'natureDamagePct',value:0.04},
 {id:'hf_passive_mage_conduit',school:'mage',name:'Conductor Arcano',stat:'spellDamagePct',value:0.04},
 {id:'hf_passive_warlock_shadow',school:'warlock',name:'Afinidad Oscura',stat:'shadowDamagePct',value:0.04},
 {id:'hf_passive_druid_regrowth',school:'druid',name:'Pulso Natural',stat:'manaRegenPct',value:0.05},
] as const;
export const R30_TOTAL_DESIGN_SCOPE=R30_ORIGINAL_45.length+R30_PREMIUM_23.length+R30_PASSIVE_DESIGNS.length;

/** Fail shut: avoid pretending prerequisites are optional when they are hard
 * engine casting gates. Buffs and special effects are tested separately.
 */
export function r30AuditSelected():{original:number,premium:number,passiveDesigns:number,premiumBlocked:number}{
 const all=new Set(R30_ORIGINAL_45);
 if(all.size!==45||R30_PREMIUM_23.length!==23||R30_PASSIVE_DESIGNS.length!==9||R30_TOTAL_DESIGN_SCOPE!==77)
  throw Error('R30_INVALID_CATALOG_COUNT');
 for(const [school,ids] of Object.entries(R30_ORIGINAL_BY_SCHOOL)){
  if(ids.length!==5)throw Error('R30_BAD_SCHOOL_COUNT_'+school);
  for(const id of ids){
   const d=ABILITIES[id];
   if(!d||d.class!==school||d.passive||d.hiddenFromPlayer||d.requiresStealth||
      d.requiresForm||d.requiresAuraKind||d.requiresTargetHpBelow||
      d.requiresShield||d.spendsCombo||d.requiresQuest||
      !originCostDecision(d).ok)throw Error('R30_SKILL_REQUIRES_MISSING_CONDITION_'+id);
  }
 }
 for(const p of R30_PASSIVE_DESIGNS)
  if(p.value<=0||p.value>0.15)throw Error('R30_BAD_PASSIVE_DESIGN');
 if(R30_PREMIUM_23.some((id,i)=>id!==R29_PREMIUM_CONTRACTS[i]?.id))
  throw Error('R30_PREMIUM_MANIFEST_DRIFT');
 return {original:45,premium:23,passiveDesigns:9,
   premiumBlocked:R29_PREMIUM_CONTRACTS.filter(c=>c.readiness==='visual-only-behavior-pending').length};
}
