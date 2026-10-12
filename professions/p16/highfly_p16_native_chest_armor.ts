/** HIGHFLY GOLDEN DEV6 — minimal native chest armor LV50/70/90.
 * Reuses EXACT donor mail/leather/cloth model, gear rules, native armorcrafting.
 * Adds only 3 protection tracks ×3 tiers =9 ItemDefs /9 recipes, NOT 9 meshes.
 * Stats contain ONLY 'armor' (derived defense), never STR/AGI/VIT/PER/INT.
 * DEV only, no changes to public PLAY, saves or donor content.
 */
import type {ItemDef,PlayerClass} from '../../sim/types';
import type {ProfessionRecipeRecord} from '../../sim/professions/types';
import {BASE_ITEMS} from '../../sim/content/items';

export const HF_P16_ARMOR_LEVELS=[50,70,90] as const;
export type HfP16ArmorTrack='mail'|'leather'|'cloth';
const SOURCE={
  mail:{
    donor:'eastbrook_chain_vest',name:'Bastion Mail',
    classes:['warrior','paladin','shaman'],
  },
  leather:{
    donor:'tanned_leather_jerkin',name:'Trailguard Leather',
    classes:['hunter','rogue','druid'],
  },
  cloth:{
    donor:'valespun_robe',name:'Arcanist Cloth',
    classes:['mage','priest','warlock'],
  },
} as const satisfies Record<HfP16ArmorTrack,{donor:string,name:string,
  classes:readonly PlayerClass[]}>;
const SKILL={50:75,70:95,90:125} as const;
const QUALITY={50:'uncommon',70:'rare',90:'epic'} as const;
const MATERIALS={
  50:{
    mail:[{itemId:'rough_hide',count:6},{itemId:'arcane_essence',count:3},{itemId:'smithing_flux',count:3}],
    leather:[{itemId:'rough_hide',count:6},{itemId:'arcane_essence',count:3},{itemId:'smithing_flux',count:3}],
    cloth:[{itemId:'rough_hide',count:6},{itemId:'arcane_essence',count:3},{itemId:'smithing_flux',count:3}],
  },
  70:{
    mail:[{itemId:'rough_hide',count:8},{itemId:'arcane_essence',count:5},{itemId:'smithing_flux',count:5}],
    leather:[{itemId:'spider_silk',count:8},{itemId:'rough_hide',count:6},{itemId:'smithing_flux',count:5}],
    cloth:[{itemId:'spider_silk',count:9},{itemId:'arcane_essence',count:6},{itemId:'smithing_flux',count:5}],
  },
  90:{
    mail:[{itemId:'sharp_claw',count:8},{itemId:'arcane_shard',count:2},{itemId:'smithing_flux',count:7}],
    leather:[{itemId:'curved_tusk',count:8},{itemId:'arcane_shard',count:2},{itemId:'smithing_flux',count:7}],
    cloth:[{itemId:'arcane_essence',count:8},{itemId:'arcane_shard',count:2},{itemId:'smithing_flux',count:7}],
  },
} as const;
export const hfP16ArmorId=(level:number,track:HfP16ArmorTrack)=>
  `hf_p16_${track}_chest_${level}`;
export const hfP16ArmorRecipeId=(level:number,track:HfP16ArmorTrack)=>
  `recipe_${hfP16ArmorId(level,track)}`;
export const HIGHFLY_P16_ARMOR_ITEMS:Record<string,ItemDef>={};
export const HIGHFLY_P16_ARMOR_RECIPES:ProfessionRecipeRecord[]=[];
for(const level of HF_P16_ARMOR_LEVELS){
  for(const track of Object.keys(SOURCE) as HfP16ArmorTrack[]){
    const spec=SOURCE[track];
    const base=BASE_ITEMS[spec.donor];
    const baseArmor=base?.kind==='armor'?base.stats?.armor:undefined;
    if(!base||base.kind!=='armor'||base.slot!=='chest'||
      base.armorType!==track||typeof baseArmor!=='number'||baseArmor<=0)
      throw Error('HF_P16_INVALID_ORIGINAL_DONOR_CHEST:'+spec.donor);
    // Explicitly remove donor equipment's physical/mental stats, sets and
    // vendor price. Only original defensive armor value is level-scaled.
    const {stats:_oldTrainingStats,buyValue:_vendor,set:_set,...native}=base;
    const id=hfP16ArmorId(level,track);
    const armor=Math.round(baseArmor*level/20);
    HIGHFLY_P16_ARMOR_ITEMS[id]={
      ...native,id,
      name:`HIGHFLY ${spec.name} · ${level}`,
      quality:QUALITY[level],requiredLevel:level,
      requiredClass:[...spec.classes],classLocked:true,
      stats:{armor},
      sellValue:0,noMarketList:true,soulbound:true,
    };
    HIGHFLY_P16_ARMOR_RECIPES.push({
      id:hfP16ArmorRecipeId(level,track),
      professionId:'armorcrafting',
      resultItemId:id,resultCount:1,
      level,itemLevelBudget:level,
      skillReq:SKILL[level],acquisition:['trainer'],
      stationType:'forge',
      reagents:MATERIALS[level][track].map(x=>({...x})),
    });
  }
}
if(Object.keys(HIGHFLY_P16_ARMOR_ITEMS).length!==9||
  HIGHFLY_P16_ARMOR_RECIPES.length!==9)
  throw Error('HF_P16_9_CHEST_NATIVE_ARMOR_TIER_REGISTRY_DRIFT');
