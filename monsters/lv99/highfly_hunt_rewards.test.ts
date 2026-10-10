/** HIGHFLY P02-E — ordinary native corpse -> actual recipe reagents. */
import { describe, expect, it } from 'vitest';
import { ALL_RECIPES, CAMPS, ITEMS, MOBS } from '../src/sim/data';
import { HARVEST_COMPONENT_ITEMS } from '../src/sim/content/professions';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { buildHighflyMonsterRoster, HIGHFLY_MONSTER_BANDS, HIGHFLY_MONSTER_DONORS } from '../src/highfly/monsters/level99';
import {
  applyHighflyHuntRewardTables, HIGHFLY_HUNT_FAMILY_REAGENTS,
  HIGHFLY_HUNT_REWARD_CAPS, highflyHuntReagentChance,
  highflyHuntReagentPhase, highflyHuntRewardProfiles,
} from '../src/highfly/monsters/hunt_rewards';

describe('HIGHFLY P02E real profession reagents and fair 1–99 hunt loot',()=>{
  it('uses exactly 64 native material profiles and established real recipe consumers',()=>{
    const profiles=highflyHuntRewardProfiles(ITEMS,ALL_RECIPES);
    expect(profiles).toHaveLength(64);
    expect(new Set(profiles.map(x=>x.mobId)).size).toBe(64);
    expect(HIGHFLY_MONSTER_DONORS).toHaveLength(8);
    expect(HIGHFLY_MONSTER_BANDS).toHaveLength(8);
    expect(new Set(Object.values(HIGHFLY_HUNT_FAMILY_REAGENTS).flat()).size).toBeGreaterThan(5);
    for(const p of profiles){
      const m=MOBS[p.mobId],sourceDonor=HIGHFLY_MONSTER_DONORS.find(d=>d.key===p.family)!;
      expect(m).toBeDefined();
      expect([m.minLevel,m.maxLevel]).toEqual([p.minLevel,p.maxLevel]);
      expect(p.chance).toBeGreaterThanOrEqual(HIGHFLY_HUNT_REWARD_CAPS.minExtraChance);
      expect(p.chance).toBeLessThanOrEqual(HIGHFLY_HUNT_REWARD_CAPS.maxExtraChance);
      expect(ITEMS[p.itemId]?.kind).toBe('junk');
      expect(p.recipeIds.length).toBeGreaterThan(0);
      expect(p.recipeIds.every(id=>ALL_RECIPES.some(v=>v.id===id&&
        v.reagents.some(x=>x.itemId===p.itemId)))).toBe(true);
      expect(m.loot.filter(x=>x.itemId===p.itemId)).toHaveLength(1);
      const bonus=m.loot.find(x=>x.itemId===p.itemId)!;
      expect(bonus.chance).toBe(p.chance);
      expect(bonus.questId).toBeUndefined();
      expect(m.loot.filter(e=>e.copper!==undefined&&e.chance===1)).toHaveLength(1);
      expect(m.componentTags).toEqual(MOBS[sourceDonor.sourceId].componentTags);
      expect(m.componentTags?.every(tag=>HARVEST_COMPONENT_ITEMS[tag]!==undefined)??true).toBe(true);
      expect(m.loot.length).toBeLessThanOrEqual(HIGHFLY_HUNT_REWARD_CAPS.maxNormalLootRows);
      expect(m.loot.every(v=>v.questId===undefined)).toBe(true);
      expect(m.elite).toBeFalsy();
      expect(m.boss).toBeFalsy();
      expect(m.worldBoss).toBeFalsy();
    }
    expect(CAMPS.some(c=>c.mobId.startsWith('hf_hunt_'))).toBe(false);
  });

  it('keeps ALL original donor loot rows and exact copper/XP unchanged',()=>{
    const source=Object.fromEntries(HIGHFLY_MONSTER_DONORS.map(d=>[d.sourceId,MOBS[d.sourceId]]));
    const original=buildHighflyMonsterRoster(source);
    const withRewards=applyHighflyHuntRewardTables(original,ITEMS,ALL_RECIPES);
    const profiles=highflyHuntRewardProfiles(ITEMS,ALL_RECIPES);
    for(const p of profiles){
      const before=original[p.mobId],after=withRewards[p.mobId];
      expect(before.loot).toEqual(after.loot.slice(0,-1));
      expect(after.loot.length).toBe(before.loot.length+1);
      expect(after.hpBase).toBe(before.hpBase);
      expect(after.dmgBase).toBe(before.dmgBase);
      expect(after.xpMult).toBe(before.xpMult);
      expect(after.componentTags).toEqual(before.componentTags);
      expect(after.loot.at(-1)).toEqual({itemId:p.itemId,chance:p.chance});
      expect(MOBS[p.mobId].loot).toEqual(after.loot);
      expect(MOBS[HIGHFLY_MONSTER_DONORS.find(d=>d.key===p.family)!.sourceId]).toBe(source[HIGHFLY_MONSTER_DONORS.find(d=>d.key===p.family)!.sourceId]);
    }
  });

  it('has hard gates for unknown tiers, missing items, recipe or duplicate reward',()=>{
    expect(()=>highflyHuntReagentPhase(20)).toThrow('HF_HUNT_REWARD_INVALID_BAND');
    expect(()=>highflyHuntReagentPhase(22)).toThrow('HF_HUNT_REWARD_INVALID_BAND');
    expect(()=>highflyHuntReagentPhase(100)).toThrow('HF_HUNT_REWARD_INVALID_BAND');
    expect(highflyHuntReagentPhase(21)).toBe(0);
    expect(highflyHuntReagentPhase(50)).toBe(1);
    expect(highflyHuntReagentPhase(80)).toBe(2);
    expect(highflyHuntReagentChance('elemental',90)).toBe(0.02);
    expect(()=>highflyHuntRewardProfiles({},ALL_RECIPES)).toThrow('HF_HUNT_REWARD_ITEM_NOT_NATIVE_REAGENT');
    expect(()=>highflyHuntRewardProfiles(ITEMS,[])).toThrow('HF_HUNT_REWARD_WITHOUT_REAL_RECIPE');
    const source=Object.fromEntries(HIGHFLY_MONSTER_DONORS.map(d=>[d.sourceId,MOBS[d.sourceId]]));
    const first=applyHighflyHuntRewardTables(buildHighflyMonsterRoster(source),ITEMS,ALL_RECIPES);
    expect(()=>applyHighflyHuntRewardTables(first,ITEMS,ALL_RECIPES)).toThrow('HF_HUNT_REWARD_DUPLICATE_NATIVE_MATERIAL');
  });

  it('transfers a craft reagent through actual native melee corpse loot ONCE',()=>{
    const monsterId='hf_hunt_elemental_50';
    const source=MOBS[monsterId], p=highflyHuntRewardProfiles(ITEMS,ALL_RECIPES)
      .find(x=>x.mobId===monsterId)!;
    expect(p.itemId).toBe('arcane_essence');
    // A test-only guaranteed roll proves the native loot transfer wiring;
    // production 6% remains checked above and is restored in finally.
    MOBS[monsterId]={...source,loot:source.loot.map(x=>
      x.itemId===p.itemId?{...x,chance:1}:x)};
    try {
      const sim=new Sim({seed:73,playerClass:'warrior',noPlayer:true,autoEquip:false});
      const pid=sim.addPlayer('warrior','HunterP02E');
      sim.setPlayerLevel(50,pid);
      const hunter=sim.entities.get(pid),meta=sim.players.get(pid);
      if(!hunter||!meta)throw Error('HF_P02E_MISSING_HUNTER');
      const victim=createMob(sim.nextId++,MOBS[monsterId],50,{
        x:hunter.pos.x,y:hunter.pos.y,z:hunter.pos.z+2});
      victim.hp=1;
      victim.hostile=true;
      sim.addEntity(victim);
      hunter.facing=Math.atan2(victim.pos.x-hunter.pos.x,victim.pos.z-hunter.pos.z);
      sim.targetEntity(victim.id,pid);
      const beforeCoins=meta.copper;
      const beforeItem=sim.countItem(p.itemId,pid);
      for(let i=0;i<80&&!victim.dead;i++)meleeSwing(sim.ctx,hunter,victim,0,null,{});
      expect(victim.dead).toBe(true);
      expect(victim.loot?.copper).toBeGreaterThan(0);
      expect(sim.lootCorpse(victim.id,pid)).toBe(true);
      expect(sim.countItem(p.itemId,pid)).toBe(beforeItem+1);
      const coins=meta.copper;
      expect(coins).toBeGreaterThan(beforeCoins);
      sim.lootCorpse(victim.id,pid);
      expect(meta.copper).toBe(coins);
      expect(sim.countItem(p.itemId,pid)).toBe(beforeItem+1);
      const save=sim.serializeCharacter(pid);
      const loaded=new Sim({seed:74,playerClass:'warrior',noPlayer:true,autoEquip:false});
      const loadedId=loaded.addPlayer('warrior','HunterP02E',{state:JSON.parse(JSON.stringify(save))});
      expect(loaded.countItem(p.itemId,loadedId)).toBe(beforeItem+1);
    }finally {
      MOBS[monsterId]=source;
    }
  });
});
