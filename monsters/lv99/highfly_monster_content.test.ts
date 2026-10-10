/** HIGHFLY LV21-99 monster content integration: real ClaudeCraft mob/loot engine. */
import { describe, expect, it } from 'vitest';
import { CAMPS, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { MAX_LEVEL, mobXpValue } from '../src/sim/types';
import {
  HIGHFLY_EXTENDED_MONSTERS_ENABLED, HIGHFLY_MONSTER_BANDS,
  HIGHFLY_MONSTER_DONORS, HIGHFLY_MONSTER_MAX_LEVEL,
  highflyMonsterId, highflyMonsterKillXpMultiplier,
} from '../src/highfly/monsters/level99';

describe('HIGHFLY Monster Content Pass 01 LV21-99', () => {
  it('extends real donor MOBS without mutating original quests or spawn camps', () => {
    expect(MAX_LEVEL).toBe(99);
    expect(HIGHFLY_MONSTER_MAX_LEVEL).toBe(99);
    expect(HIGHFLY_EXTENDED_MONSTERS_ENABLED).toBe(false);
    expect(HIGHFLY_MONSTER_DONORS).toHaveLength(8);
    expect(HIGHFLY_MONSTER_BANDS).toHaveLength(8);
    expect(Object.keys(MOBS).filter(id => id.startsWith('hf_hunt_'))).toHaveLength(64);
    expect(CAMPS.some(camp => camp.mobId.startsWith('hf_hunt_'))).toBe(false);
    for (const donor of HIGHFLY_MONSTER_DONORS) {
      const original = MOBS[donor.sourceId];
      expect(original).toBeDefined();
      for (const [low, high] of HIGHFLY_MONSTER_BANDS) {
        const m = MOBS[highflyMonsterId(donor.key, low)];
        expect(m).toBeDefined();
        expect(m.id).not.toBe(original.id);
        expect(m.family).toBe(original.family);
        expect([m.minLevel,m.maxLevel]).toEqual([low,high]);
        expect(m.componentTags).toEqual(original.componentTags);
        expect(m.requiresQuestId).toBeUndefined();
        expect(m.boss).toBeFalsy();
        expect(m.rare).toBeFalsy();
        expect(m.loot.filter(entry => 'copper' in entry && entry.chance===1)).toHaveLength(1);
        expect(m.loot.every(entry => !('questId' in entry))).toBe(true);
        expect(m.xpMult).toBeGreaterThanOrEqual(1);
        expect(m.xpMult).toBeLessThanOrEqual(4.16);
      }
    }
    expect(MOBS.forest_wolf.minLevel).toBe(1);
  });

  it('creates a real level-99 native monster with scaled HP, damage, armor, XP and loot', () => {
    const m=MOBS.hf_hunt_ogre_90;
    expect(m.maxLevel).toBe(99);
    const bossCandidate=createMob(7777,m,99,{x:0,y:0,z:0});
    const original=createMob(7778,MOBS.thornpeak_ogre,16,{x:0,y:0,z:0});
    expect(bossCandidate.level).toBe(99);
    expect(bossCandidate.maxHp).toBeGreaterThan(original.maxHp);
    expect(bossCandidate.weapon.max).toBeGreaterThan(original.weapon.max);
    expect(bossCandidate.stats.armor).toBeGreaterThan(original.stats.armor);
    expect(mobXpValue(99,99)).toBeGreaterThan(0);
    expect(highflyMonsterKillXpMultiplier(99)).toBe(4.16);
    expect(m.xpMult).toBeGreaterThan(3);
    expect(m.loot.some(entry => 'copper' in entry && entry.copper>75)).toBe(true);
  });

  it('uses real native melee → death → corpse loot once for an LV60 wolf', () => {
    const sim=new Sim({seed:73,playerClass:'warrior',noPlayer:true,autoEquip:false});
    const pid=sim.addPlayer('warrior','HunterLV60');
    sim.setPlayerLevel(60,pid);
    const hunter=sim.entities.get(pid),meta=sim.players.get(pid);
    if(!hunter || !meta)throw Error('missing Hunter');
    const m=createMob(sim.nextId++,MOBS.hf_hunt_wolf_60,60,{
      x:hunter.pos.x,y:hunter.pos.y,z:hunter.pos.z+2,
    });
    m.hp=1;
    m.hostile=true;
    sim.addEntity(m);
    hunter.facing=Math.atan2(m.pos.x-hunter.pos.x,m.pos.z-hunter.pos.z);
    sim.targetEntity(m.id,pid);
    const coins=meta.copper;
    for(let i=0;i<50&&!m.dead;i++)meleeSwing(sim.ctx,hunter,m,0,null,{});
    expect(m.dead).toBe(true);
    const available=m.loot?.copper??0;
    expect(available).toBeGreaterThan(0);
    expect(sim.lootCorpse(m.id,pid)).toBe(true);
    expect(meta.copper).toBe(coins+available);
    sim.lootCorpse(m.id,pid);
    expect(meta.copper).toBe(coins+available);
  });
});
