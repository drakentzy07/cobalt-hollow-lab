/** HIGHFLY GOLDEN DEV5 — minimum native LV35 missing-band bridge.
 * EXACT 3 original donor weapon models/animations, one per proficiency group.
 * Required source proof: HF wolf_30 drops rough_hide, spider_30 spider_silk.
 * No replacement inventory/character/combat/crafting/loot engine.
 * No permanent Training stats and no new class/subclass/reset.
 * DEV only; never publish before complete native E2E and S23 QA.
 */
import type {ItemDef,PlayerClass,WeaponItemDef} from '../../sim/types';
import type {ProfessionRecipeRecord} from '../../sim/professions/types';
import {BASE_ITEMS} from '../../sim/content/items';

export const HF_P15_BRIDGE_LEVEL=35 as const;
type Track='warrior'|'scout'|'caster';
const DONORS={
  warrior:{id:'worn_sword',allowed:['warrior','paladin','shaman'],name:'Forgeblade'},
  scout:{id:'rusty_dagger',allowed:['hunter','rogue'],name:'Trail Dirk'},
  caster:{id:'gnarled_staff',allowed:['mage','priest','warlock','druid'],name:'Wayfarer Staff'},
} as const satisfies Record<Track,{
  id:string;allowed:readonly PlayerClass[];name:string}>;
export const hfP15ItemId=(track:Track)=>`hf_p15_bridge35_${track}`;
export const hfP15RecipeId=(track:Track)=>`recipe_${hfP15ItemId(track)}`;
export const HIGHFLY_P15_ITEMS:Record<string,ItemDef>={};
export const HIGHFLY_P15_RECIPES:ProfessionRecipeRecord[]=[];
const SOURCE_MATERIALS=[
  {itemId:'rough_hide',count:4},
  {itemId:'spider_silk',count:5},
  {itemId:'smithing_flux',count:2},
] as const;
for(const track of Object.keys(DONORS) as Track[]){
  const model=DONORS[track];
  const original=BASE_ITEMS[model.id];
  if(!original||original.kind!=='weapon'||!original.weapon)
    throw Error('HF_P15_NATIVE_DONOR_WEAPON_MISSING:'+model.id);
  const sword=original as WeaponItemDef;
  const {stats:_noPrimaryTrainingStatGrant,...withoutTrainingStats}=sword;
  const id=hfP15ItemId(track);
  const min=Math.round(HF_P15_BRIDGE_LEVEL*(track==='scout'?0.29:0.36));
  HIGHFLY_P15_ITEMS[id]={
    ...withoutTrainingStats,
    id,name:`HIGHFLY ${model.name} · 35`,
    requiredLevel:HF_P15_BRIDGE_LEVEL,
    requiredClass:[...model.allowed],classLocked:true,
    quality:'uncommon',
    weapon:{...sword.weapon,min,max:min+Math.round(HF_P15_BRIDGE_LEVEL*0.2)},
    ...(track==='caster'?{spellPower:7}:{}),
    sellValue:0,noMarketList:true,soulbound:true,
  };
  HIGHFLY_P15_RECIPES.push({
    id:hfP15RecipeId(track),resultItemId:id,resultCount:1,
    professionId:'weaponcrafting',level:HF_P15_BRIDGE_LEVEL,
    itemLevelBudget:HF_P15_BRIDGE_LEVEL,
    skillReq:50,stationType:'forge',acquisition:['trainer'],
    reagents:SOURCE_MATERIALS.map(x=>({...x})),
  });
}
if(Object.keys(HIGHFLY_P15_ITEMS).length!==3||HIGHFLY_P15_RECIPES.length!==3)
  throw Error('HF_P15_THREE_NATIVE_LV35_TRACKS_MISSING');
