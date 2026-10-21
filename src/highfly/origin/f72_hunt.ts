/** F7.2 RUN2 — first accessible level 21–30 physical hunting strip.
 * Original world content, movement/AI, loot and XP stay single-authority.
 * Mobs are descendants of established Claude beast/burrower/ogre templates,
 * with unique native IDs and familiar authored materials. NOT the full
 * historical 80-monster donor import or a new dungeon.
 */
import type { CampDef, MobTemplate, ItemDef } from '../../sim/types';
import type { ProfessionRecipeRecord } from '../../sim/professions/types';
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
    loot:[{copper:90,chance:1},{itemId:'hf_f72_ridge_fang',chance:0.85},{itemId:'ridge_stalker_pelt',chance:0.75},{itemId:'hf_f72_ridge_blade',chance:0.035},{itemId:'healing_potion',chance:0.12}],
    aggroRadius:9,hardLeashRadius:26,offStreamIdle:true,
  },
  hf_f72_crag_burrower: {
    ...ZONE3_MOBS.deeprock_kobold,id:'hf_f72_crag_burrower',
    name:'HIGHFLY · Perforador de Cumbre',minLevel:25,maxLevel:28,
    loot:[{copper:120,chance:1},{itemId:'hf_f72_crag_core',chance:0.85},{itemId:'tallow_candle',chance:0.70},{itemId:'hf_f72_crag_mail',chance:0.035},{itemId:'healing_potion',chance:0.16}],
    aggroRadius:9,hardLeashRadius:27,offStreamIdle:true,
  },
  hf_f72_ridge_captain: {
    ...ZONE3_MOBS.old_cragmaw,id:'hf_f72_ridge_captain',
    name:'HIGHFLY · Capitán Colmillo Gris',minLevel:30,maxLevel:30,
    loot:[{copper:440,chance:1},{itemId:'old_cragmaws_pelt',chance:1},{itemId:'hf_f72_crag_core',chance:1},{itemId:'hf_f72_captain_cleaver',chance:0.35},{itemId:'cragmaw_huntcord',chance:0.35}],
    aggroRadius:12,hardLeashRadius:38,respawnMult:1,offStreamIdle:true,
  },
};
export const HIGHFLY_F72_HUNT_ARRIVAL = {x:111,z:830} as const;
export const HIGHFLY_F72_HUNT_LABEL = 'Risco de Cacería LV21–30';

/** Earnable first-tier LV21-30 weapons/armor and native profession recipes.
 * Materials come from physical monsters; no content is granted to World.
 * Recipe knowledge still requires native trainer acquisition. */
export const HIGHFLY_F72_ITEMS: Record<string,ItemDef> = {
  hf_f72_ridge_fang:{id:'hf_f72_ridge_fang',name:'Colmillo del Risco',kind:'junk',quality:'common',stackSize:20,sellValue:14},
  hf_f72_crag_core:{id:'hf_f72_crag_core',name:'Núcleo de la Cumbre',kind:'junk',quality:'common',stackSize:20,sellValue:22},
  hf_f72_ridge_blade:{id:'hf_f72_ridge_blade',name:'Filo del Risco',kind:'weapon',slot:'mainhand',quality:'rare',requiredLevel:23,weapon:{min:40,max:64,speed:2.4},stats:{str:8,agi:5},sellValue:200},
  hf_f72_crag_mail:{id:'hf_f72_crag_mail',name:'Coraza de la Cumbre',kind:'armor',armorType:'mail',slot:'chest',quality:'rare',requiredLevel:27,stats:{armor:150,sta:18,str:7},sellValue:260},
  hf_f72_captain_cleaver:{id:'hf_f72_captain_cleaver',name:'Hacha de Colmillo Gris',kind:'weapon',slot:'mainhand',quality:'epic',requiredLevel:30,weapon:{min:76,max:110,speed:2.7},stats:{str:12,sta:9},sellValue:600},
};
export const HIGHFLY_F72_RECIPES: ProfessionRecipeRecord[] = [
  {id:'recipe_hf_f72_ridge_blade',professionId:'weaponcrafting',resultItemId:'hf_f72_ridge_blade',
   resultCount:1,reagents:[{itemId:'hf_f72_ridge_fang',count:5},{itemId:'ridge_stalker_pelt',count:2},{itemId:'smithing_flux',count:6}],
   skillReq:25,itemLevelBudget:23,level:23,acquisition:['trainer']},
  {id:'recipe_hf_f72_crag_mail',professionId:'armorcrafting',resultItemId:'hf_f72_crag_mail',
   resultCount:1,reagents:[{itemId:'hf_f72_crag_core',count:5},{itemId:'tallow_candle',count:2},{itemId:'smithing_flux',count:8}],
   skillReq:25,itemLevelBudget:27,level:27,acquisition:['trainer']},
];
