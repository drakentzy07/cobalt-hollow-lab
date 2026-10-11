/** HIGHFLY P13 — NATIVE five-rung LV50–99 weaponcrafting pilot.
 *
 * ADDITIVE NEW IDs, no duplicate crafting/loot/XP/character/gear system.
 * Uses the original ClaudeCraft weapon kinds, recipes, forge and equipping,
 * plus HIGHFLY encounter material drops. Does NOT increase STR/AGI/VIT/PER/
 * INT: stats deliberately absent on new items. No new armor models, gems or
 * fake drop injection. Skill 75–125 requirements are authored; actual recipe
 * learning / available NPC trainer and craft skill admission are separate QA.
 *
 * DEVELOPMENT ONLY — no PLAY/Pages deployment until every reagent acquisition
 * and class equipment + economy gate is proven.
 */
import type {ItemDef,PlayerClass,WeaponItemDef} from '../../sim/types';
import type {ProfessionRecipeRecord} from '../../sim/professions/types';
import {BASE_ITEMS} from '../../sim/content/items';

export const HF_P13_WEAPON_LEVELS=[50,60,70,80,90] as const;
type Track='warrior'|'scout'|'caster';
const TRACKS={
  warrior:{base:'worn_sword',classes:['warrior','paladin','shaman']},
  scout:{base:'rusty_dagger',classes:['rogue','hunter']},
  caster:{base:'gnarled_staff',classes:['mage','priest','warlock','druid']},
} as const satisfies Record<Track,{base:string,classes:readonly PlayerClass[]}>;
const MATERIALS={
  50:[{itemId:'rough_hide',count:5},{itemId:'arcane_essence',count:3},{itemId:'smithing_flux',count:3}],
  60:[{itemId:'sharp_claw',count:5},{itemId:'curved_tusk',count:5},{itemId:'smithing_flux',count:3}],
  70:[{itemId:'spider_silk',count:8},{itemId:'arcane_essence',count:7},{itemId:'smithing_flux',count:5}],
  80:[{itemId:'arcane_shard',count:3},{itemId:'sharp_claw',count:9},{itemId:'smithing_flux',count:6}],
  90:[{itemId:'arcane_shard',count:7},{itemId:'arcane_essence',count:12},{itemId:'smithing_flux',count:8}],
} as const;
const SKILLS={50:75,60:85,70:95,80:110,90:125} as const;
const QUALITY={50:'uncommon',60:'rare',70:'rare',80:'epic',90:'epic'} as const;
const AFFIX={warrior:'Forgeblade',scout:'Night Dirk',caster:'Wayfarer Staff'} as const;
export const hfP13ItemId=(level:number,track:Track)=>`hf_p13_${track}_${level}`;
export const hfP13RecipeId=(level:number,track:Track)=>`recipe_${hfP13ItemId(level,track)}`;
function originalWeapon(id:string):WeaponItemDef {
  const source:ItemDef|undefined=BASE_ITEMS[id];
  if(!source||source.kind!=='weapon')throw Error('HF_P13_ORIGINAL_WEAPON_MISSING:'+id);
  return source;
}
export const HIGHFLY_P13_ITEMS:Record<string,ItemDef>={};
export const HIGHFLY_P13_RECIPES:ProfessionRecipeRecord[]=[];
for(const level of HF_P13_WEAPON_LEVELS){
  for(const track of Object.keys(TRACKS) as Track[]){
    const donor=TRACKS[track];
    const original=originalWeapon(donor.base);
    const {stats:_noHunterStats, ...unchangedNativeModel}=original;
    const id=hfP13ItemId(level,track);
    const amount=Math.round(level*(track==='scout'?0.29:0.36));
    // Do not use donor stats/int/sta. Weapon damage or spellPower are
    // combat EFFECTS only; permanent Training Core never changes.
    HIGHFLY_P13_ITEMS[id]={
      ...unchangedNativeModel,
      id,
      name:`HIGHFLY ${AFFIX[track]} · ${level}`,
      requiredLevel:level,
      requiredClass:[...donor.classes],
      classLocked:true,
      quality:QUALITY[level],
      weapon:{...original.weapon,min:amount,max:amount+Math.round(level*0.20)},
      ...(track==='caster'?{spellPower:Math.round(level*0.2)}:{}),
      // Pilot supply is non-tradeable until economy and market tests:
      sellValue:0,noMarketList:true,soulbound:true,
    };
    HIGHFLY_P13_RECIPES.push({
      id:hfP13RecipeId(level,track),
      professionId:'weaponcrafting',
      resultItemId:id,
      resultCount:1,
      reagents:[...MATERIALS[level]],
      skillReq:SKILLS[level],
      itemLevelBudget:level,
      level,
      acquisition:['trainer'],
      stationType:'forge',
    });
  }
}
if(Object.keys(HIGHFLY_P13_ITEMS).length!==15||HIGHFLY_P13_RECIPES.length!==15)
  throw Error('HF_P13_FIVE_LEVELS_THREE_ARCHETYPES_INCOMPLETE');
