/** F7.2 RUN2 — first accessible level 21–30 physical hunting strip.
 * Original world content, movement/AI, loot and XP stay single-authority.
 * Mobs are descendants of established Claude beast/burrower/ogre templates,
 * with unique native IDs and familiar authored materials. NOT the full
 * historical 80-monster donor import or a new dungeon.
 */
import type { CampDef, MobTemplate } from '../../sim/types';
import { ZONE3_MOBS } from '../../sim/content/zone3';
export const HIGHFLY_F72_HUNT_CAMPS: CampDef[] = [
  {mobId:'hf_f72_ridge_hound',center:{x:134,z:820},radius:11,count:5,offStream:true},
  {mobId:'hf_f72_crag_burrower',center:{x:138,z:854},radius:12,count:5,offStream:true},
  {mobId:'hf_f72_ridge_captain',center:{x:141,z:883},radius:5,count:1,offStream:true},
];
export const HIGHFLY_F72_HUNT_MOBS: Record<string,MobTemplate> = {
  hf_f72_ridge_hound: {
    ...ZONE3_MOBS.ridge_stalker,id:'hf_f72_ridge_hound',
    name:'HIGHFLY · Acechador del Risco',minLevel:21,maxLevel:24,
    loot:[{copper:90,chance:1},{itemId:'ridge_stalker_pelt',chance:0.75},{itemId:'healing_potion',chance:0.12}],
    aggroRadius:9,hardLeashRadius:26,offStreamIdle:true,
  },
  hf_f72_crag_burrower: {
    ...ZONE3_MOBS.deeprock_kobold,id:'hf_f72_crag_burrower',
    name:'HIGHFLY · Perforador de Cumbre',minLevel:25,maxLevel:28,
    loot:[{copper:120,chance:1},{itemId:'tallow_candle',chance:0.70},{itemId:'healing_potion',chance:0.16}],
    aggroRadius:9,hardLeashRadius:27,offStreamIdle:true,
  },
  hf_f72_ridge_captain: {
    ...ZONE3_MOBS.old_cragmaw,id:'hf_f72_ridge_captain',
    name:'HIGHFLY · Capitán Colmillo Gris',minLevel:30,maxLevel:30,
    loot:[{copper:440,chance:1},{itemId:'old_cragmaws_pelt',chance:1},{itemId:'cragmaw_huntcord',chance:0.35}],
    aggroRadius:12,hardLeashRadius:38,respawnMult:1,offStreamIdle:true,
  },
};
export const HIGHFLY_F72_HUNT_ARRIVAL = {x:111,z:830} as const;
export const HIGHFLY_F72_HUNT_LABEL = 'Risco de Cacería LV21–30';
