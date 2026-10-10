/** HIGHFLY P02-E — real crafting reagents from native monster corpse loot.
 *
 * Existing donor LootEntry + loot_roll + corpse ownership + recipe acquisition
 * are the ONLY authorities. This layer adds ONE bounded chance row per ordinary
 * LV21–99 family/band, using an EXISTING ItemDef with an EXISTING recipe consumer.
 * No new items, loot-roll engine, quest drops, bosses, mounts, sockets,
 * profession XP, Hunter STR/AGI/VIT/PER/INT, or public-world camps.
 * The ordinary donor's guaranteed copper and material rolls remain unchanged.
 */
import type { ItemDef, LootEntry, MobTemplate } from '../../sim/types';
import type { ProfessionRecipeRecord } from '../../sim/professions/types';
import { HIGHFLY_MONSTER_BANDS, HIGHFLY_MONSTER_DONORS, highflyMonsterId } from './level99';

export const HIGHFLY_HUNT_REWARD_CAPS={
  addedRowsPerMob:1,
  maxExtraChance:0.18,
  minExtraChance:0.02,
  maxNormalLootRows:5,
} as const;
export type HighflyHuntFamily = typeof HIGHFLY_MONSTER_DONORS[number]['key'];
export interface HighflyHuntRewardProfile {
  readonly mobId:string;
  readonly minLevel:number;
  readonly maxLevel:number;
  readonly family:HighflyHuntFamily;
  readonly itemId:string;
  readonly chance:number;
  readonly recipeIds:readonly string[];
}
/** Consentful material sinks: every ID is an existing ClaudeCraft consumable
 * reagent. Neither boss-only wyrmfall_core nor signed pristine specimens are
 * minted by trash kills. All IDs must be verified against actual ALL_RECIPES.
 */
export const HIGHFLY_HUNT_FAMILY_REAGENTS={
  wolf: ['rough_hide','rough_hide','rough_hide'],
  spider: ['spider_silk','spider_silk','spider_silk'],
  skeleton: ['homespun_cloth','arcane_dust','arcane_essence'],
  ogre: ['curved_tusk','curved_tusk','curved_tusk'],
  revenant: ['homespun_cloth','arcane_essence','arcane_shard'],
  dragonkin: ['sharp_claw','sharp_claw','sharp_claw'],
  elemental: ['arcane_dust','arcane_essence','arcane_shard'],
  stalker: ['rough_hide','rough_hide','rough_hide'],
} as const satisfies Record<HighflyHuntFamily, readonly [string,string,string]>;

/** Three economic reagent bands; not a new item rarity, XP or equipment tier.
 * Bonus reagent drops are much rarer than natural corpse harvest. Endgame
 * arcane shards are capped at 2-3% per kill, not a disguised boss loot path.
 */
export function highflyHuntReagentPhase(minLevel:number):0|1|2 {
  if(!Number.isInteger(minLevel)||!HIGHFLY_MONSTER_BANDS.some(b=>b[0]===minLevel))
    throw Error('HF_HUNT_REWARD_INVALID_BAND');
  return minLevel<40?0:minLevel<80?1:2;
}
export function highflyHuntReagentChance(family:HighflyHuntFamily,minLevel:number):number {
  const phase=highflyHuntReagentPhase(minLevel);
  const material=HIGHFLY_HUNT_FAMILY_REAGENTS[family]?.[phase];
  if(!material)throw Error('HF_HUNT_REWARD_UNKNOWN_FAMILY');
  if(material==='arcane_shard')return minLevel>=90?0.02:0.03;
  if(material==='arcane_essence')return 0.06;
  if(material==='arcane_dust')return 0.09;
  // A modest crafting supply reward, not guaranteed / not a free harvest.
  return Math.min(0.18,0.10+Math.floor((minLevel-21)/20)*0.02);
}

/** Derived against the REAL currently registered item and recipe tables. A
 * typo, missing consumer or quest-only material fails CLOSED at registration.
 * No permissions to generate extra items, recipe grants or skill points.
 */
export function highflyHuntRewardProfiles(
  items:Readonly<Record<string,ItemDef>>,
  recipes:readonly ProfessionRecipeRecord[],
): readonly HighflyHuntRewardProfile[] {
  const profiles:HighflyHuntRewardProfile[]=[];
  for(const donor of HIGHFLY_MONSTER_DONORS) {
    const family=donor.key;
    for(const [minLevel,maxLevel] of HIGHFLY_MONSTER_BANDS) {
      const phase=highflyHuntReagentPhase(minLevel);
      const itemId=HIGHFLY_HUNT_FAMILY_REAGENTS[family][phase];
      const item=items[itemId];
      if(!item||item.id!==itemId||item.kind!=='junk')
        throw Error('HF_HUNT_REWARD_ITEM_NOT_NATIVE_REAGENT:'+itemId);
      const consumers=recipes.filter(r=>r.reagents.some(ing=>ing.itemId===itemId))
        .map(r=>r.id);
      if(consumers.length<1)
        throw Error('HF_HUNT_REWARD_WITHOUT_REAL_RECIPE:'+itemId);
      const chance=highflyHuntReagentChance(family,minLevel);
      if(chance<HIGHFLY_HUNT_REWARD_CAPS.minExtraChance ||
         chance>HIGHFLY_HUNT_REWARD_CAPS.maxExtraChance)
        throw Error('HF_HUNT_REWARD_CHANCE_OUT_OF_BOUNDS');
      profiles.push({mobId:highflyMonsterId(family,minLevel),
        minLevel,maxLevel,family,itemId,chance,recipeIds:consumers});
    }
  }
  if(profiles.length!==64 || new Set(profiles.map(p=>p.mobId)).size!==64)
    throw Error('HF_HUNT_REWARD_COVERAGE_DRIFT');
  return profiles;
}

/** Applies native chance rows to isolated HIGHFLY mob templates, NOT to
 * MOBS[donor] or any original quest/party loot. Sim rollLoot owns the RNG,
 * ownership, quality and real corpse transfer. Caller registers results.
 */
export function applyHighflyHuntRewardTables(
  roster:Readonly<Record<string,MobTemplate>>,
  items:Readonly<Record<string,ItemDef>>,
  recipes:readonly ProfessionRecipeRecord[],
):Record<string,MobTemplate> {
  const profiles=highflyHuntRewardProfiles(items,recipes);
  const next:Record<string,MobTemplate>={...roster};
  for(const p of profiles){
    const source=roster[p.mobId];
    if(!source||source.minLevel!==p.minLevel||
      source.maxLevel!==p.maxLevel||source.boss||source.elite||source.rare||
      source.worldBoss||source.requiresQuestId)
      throw Error('HF_HUNT_REWARD_MOB_NOT_SAFE:'+p.mobId);
    if(source.loot.some(v=>v.itemId===p.itemId||v.rollGroup?.startsWith('hf_hunt_')))
      throw Error('HF_HUNT_REWARD_DUPLICATE_NATIVE_MATERIAL:'+p.mobId);
    const bonus:LootEntry={itemId:p.itemId,chance:p.chance};
    const loot=[...source.loot,bonus];
    if(loot.length>HIGHFLY_HUNT_REWARD_CAPS.maxNormalLootRows)
      throw Error('HF_HUNT_REWARD_TOO_MANY_LOOT_ROWS:'+p.mobId);
    if(loot.filter(v=>v.copper!==undefined&&v.chance===1).length!==1||
      loot.some(v=>v.questId!==undefined||v.normalOnly||v.heroicCopper!==undefined))
      throw Error('HF_HUNT_REWARD_LOOT_POLICY_BROKEN:'+p.mobId);
    next[p.mobId]={...source,loot};
  }
  return next;
}
