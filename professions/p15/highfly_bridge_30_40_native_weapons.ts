/** HIGHFLY GOLDEN DEV1 P15 — LV21–49 bridge, six NATIVE weapon variants.
 * Keep donor LV1–20 exactly as shipped; use the existing Sim, forge, train,
 * ITEMS, ALL_RECIPES, class equipment gates and existing weapon art.
 * No new profession system, gem engine, 3D mesh, XP or Training stat points.
 * Materials are genuine LV30/LV40 HIGHFLY mob reagents; vendor flux remains
 * a separate accessibility/economy gate before PLAY publication.
 */
import type {ItemDef,PlayerClass,WeaponItemDef} from '../../sim/types';
import type {ProfessionRecipeRecord} from '../../sim/professions/types';
import {BASE_ITEMS} from '../../sim/content/items';

export const HF_P15_BRIDGE_WEAPON_LEVELS=[30,40] as const;
type Track='warrior'|'scout'|'caster';
const TRACKS={
  warrior:{base:'worn_sword',classes:['warrior','paladin','shaman'],label:'Forgeblade'},
  scout:{base:'rusty_dagger',classes:['hunter','rogue'],label:'Pathfinder Dirk'},
  caster:{base:'gnarled_staff',classes:['priest','mage','warlock','druid'],label:'Runewood Staff'},
} as const satisfies Record<Track,{base:string,classes:readonly PlayerClass[],label:string}>;
const MATERIALS={
  // Phase 0: LV21–39 wolf + spider; phase 1: LV40+ ogre and revenant/elemental.
  30:[{itemId:'rough_hide',count:4},{itemId:'spider_silk',count:3},{itemId:'smithing_flux',count:1}],
  40:[{itemId:'curved_tusk',count:4},{itemId:'arcane_essence',count:2},{itemId:'smithing_flux',count:2}],
} as const;
const SKILL_REQ={30:50,40:65} as const;
const QUALITY={30:'uncommon',40:'uncommon'} as const;

export const hfP15BridgeItemId=(level:number,track:Track)=>
  `hf_p15_bridge_${track}_${level}`;
export const hfP15BridgeRecipeId=(level:number,track:Track)=>
  `recipe_${hfP15BridgeItemId(level,track)}`;

function donorWeapon(id:string):WeaponItemDef {
  const item:ItemDef|undefined=BASE_ITEMS[id];
  if(!item||item.kind!=='weapon')
    throw Error('HF_P15_ORIGINAL_WEAPON_MISSING:'+id);
  return item;
}

export const HIGHFLY_P15_BRIDGE_ITEMS:Record<string,ItemDef>={};
export const HIGHFLY_P15_BRIDGE_RECIPES:ProfessionRecipeRecord[]=[];
for(const level of HF_P15_BRIDGE_WEAPON_LEVELS){
  for(const track of Object.keys(TRACKS) as Track[]){
    const cfg=TRACKS[track];
    const old=donorWeapon(cfg.base);
    // Donor ItemDef.stats could modify Training primaries: remove them.
    // Retain the verified native weapon visual/animation fields untouched.
    const {stats:_forbiddenHunterStats,...originalVisual}=old;
    const id=hfP15BridgeItemId(level,track);
    const min=Math.round(level*(track==='scout'?0.29:0.36));
    HIGHFLY_P15_BRIDGE_ITEMS[id]={
      ...originalVisual,
      id,
      name:`HIGHFLY ${cfg.label} · ${level}`,
      requiredLevel:level,
      requiredClass:[...cfg.classes],
      classLocked:true,
      quality:QUALITY[level],
      weapon:{...old.weapon,min,max:min+Math.round(level*0.20)},
      ...(track==='caster'?{spellPower:Math.round(level*0.2)}:{}),
      sellValue:0,noMarketList:true,soulbound:true,
    };
    HIGHFLY_P15_BRIDGE_RECIPES.push({
      id:hfP15BridgeRecipeId(level,track),
      professionId:'weaponcrafting',
      resultItemId:id,
      resultCount:1,
      reagents:[...MATERIALS[level]],
      level,itemLevelBudget:level,skillReq:SKILL_REQ[level],
      acquisition:['trainer'],
      stationType:'forge',
    });
  }
}
if(Object.keys(HIGHFLY_P15_BRIDGE_ITEMS).length!==6||
   HIGHFLY_P15_BRIDGE_RECIPES.length!==6)
  throw Error('HF_P15_LV30_40_NATIVE_BRIDGE_INCOMPLETE');
