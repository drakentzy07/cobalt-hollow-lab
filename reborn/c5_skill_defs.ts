import type {AbilityDef} from '../../sim/types';

/** Pure mechanic adaptations, not borrowed CraftPix/ClaudeCraft artwork.
 * Historical donor list: HIGHFLY_ORIGIN_BIBLIOTECA_MAESTRA_AUDITORIA 2026-10-21.
 * IDs authored for HIGHFLY; native Sim still owns cooldowns, hits and resource.
 */
export const HIGHFLY_SKILL_IDS = [
 'highfly_arc_shot','highfly_cross_cut','highfly_breakstep','highfly_storm_circle'
] as const;
export type HighflySkillId=(typeof HIGHFLY_SKILL_IDS)[number];
export const HIGHFLY_MECHANIC_DONORS:Record<HighflySkillId,string>={
 highfly_arc_shot:'fireball: projectile travel and authoritative direct hit',
 highfly_cross_cut:'sinister_strike + whirlwind: physical melee plus frontal cleave',
 highfly_breakstep:'F263 physical evade + charge: dash physics then arrival impact',
 highfly_storm_circle:'meteor + flamestrike: delayed ground AoE and fire pulses'
};
export const HIGHFLY_REBORN_SKILLS:Record<HighflySkillId,AbilityDef>={
 highfly_arc_shot:{
   id:'highfly_arc_shot',name:'Pulso Arcano',class:'warrior',learnLevel:1,cost:0,
   castTime:0,castWhileMoving:true,cooldown:2.5,range:18,
   school:'arcane',projectile:true,requiresTarget:true,
   effects:[{type:'directDamage',min:12,max:17}],
   description:'S1: proyectil instantáneo; el apuntado manual define si impacta.',
 },
 highfly_cross_cut:{
   id:'highfly_cross_cut',name:'Corte Cruzado',class:'warrior',learnLevel:1,cost:0,
   castTime:0,castWhileMoving:true,cooldown:2,range:0,school:'physical',
   requiresTarget:false,
   effects:[{type:'aoeDamage',min:15,max:21,radius:3,frontal:true,frontalHalfAngle:1.2}],
   description:'S2: corte frontal mientras corrés o estás en combate.',
 },
 highfly_breakstep:{
   id:'highfly_breakstep',name:'Paso Quebrador',class:'warrior',learnLevel:1,cost:0,
   castTime:0,castWhileMoving:true,cooldown:6,range:0,school:'physical',
   requiresTarget:false,
   effects:[{type:'aoeDamage',min:13,max:19,radius:2.4}],
   description:'S3: F263 Dash físico y daño nativo al finalizar en el suelo.',
 },
 highfly_storm_circle:{
   id:'highfly_storm_circle',name:'Círculo de Tormenta',class:'warrior',learnLevel:1,cost:0,
   castTime:0,castWhileMoving:true,cooldown:8,range:15,school:'fire',
   requiresTarget:false,targetMode:'position',
   effects:[{type:'groundAoE',min:16,max:22,radius:4.5,duration:2.5,interval:1.5,delayed:true}],
   description:'S4: meteorito con demora y zona real en el suelo.',
 },
};
