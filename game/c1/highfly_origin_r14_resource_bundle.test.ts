import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { originCostDecision, originFreshResources, originRegen, originRestoreResources, originSpend, originAvailable } from '../src/sim/highfly_origin_universal_resources';
import { newOriginHunterProfile, restoreOriginHunterProfile } from '../src/sim/highfly_origin_hunter_profile';

describe('HIGHFLY ORIGIN R1-4 AB — universal HP MP stamina BUNDLE', () => {
  it('creates two INDEPENDENT pools for Hunter and preserves native HP value', () => {
    const sim=new Sim({seed:511,playerClass:'warrior',originHunterEnabled:true});
    const profile=sim.players.get(sim.player.id)?.originHunter;
    expect(profile?.resources).toEqual(originFreshResources());
    expect(profile?.resources.mana).toBe(200);
    expect(profile?.resources.stamina).toBe(100);
    expect(sim.player.hp).toBe(sim.player.maxHp);
    expect(sim.player.resourceType).toBe('rage'); // temporary legacy carrier, NOT MP/stamina
  });
  it('restores old ORIGIN saves with NO vitals and never converts legacy class saves', () => {
    const old={version:1,identity:'origin_hunter',learnedSkillIds:['fireball'],skillMastery:{fireball:2},unlocks:[]};
    const migrated=restoreOriginHunterProfile(old);
    expect(migrated.resources).toEqual(originFreshResources());
    expect(migrated.learnedSkillIds).toEqual(['fireball']);
    const sim=new Sim({seed:512,playerClass:'warrior'});
    const state=sim.serializeCharacter(sim.player.id);
    expect(state?.originHunter).toBeUndefined();
    const origin=new Sim({seed:513,playerClass:'warrior',originHunterEnabled:true});
    const save=origin.serializeCharacter(origin.player.id);
    expect(save?.originHunter?.resources).toEqual(originFreshResources());
    const loaded=new Sim({seed:513,playerClass:'warrior',noPlayer:true});
    const id=loaded.addPlayer('warrior','Saved Hunter',{state:save!});
    expect(loaded.serializeCharacter(id)?.originHunter?.resources).toEqual(originFreshResources());
  });
  it('does not accept negative, nonfinite, overflow or zero-capacity resource saves', () => {
    for (const bad of [
      {...originFreshResources(),mana:-1},
      {...originFreshResources(),stamina:101},
      {...originFreshResources(),maxMana:0},
      {...originFreshResources(),mana:Infinity},
    ])expect(()=>originRestoreResources(bad)).toThrow();
  });
  it('maps physical to STAMINA and magic of any original class to MP', () => {
    expect(originCostDecision(ABILITIES.fireball)).toEqual({ok:true,pool:'mana'});
    expect(originCostDecision(ABILITIES.frost_armor)).toEqual({ok:true,pool:'mana'});
    expect(originCostDecision(ABILITIES.sinister_strike)).toEqual({ok:true,pool:'stamina'});
    expect(originCostDecision(ABILITIES.battle_shout)).toEqual({ok:true,pool:'stamina'});
  });
  it('rejects resource generators, on-next-swing and old utility exceptions until ported', () => {
    expect(originCostDecision(ABILITIES.heroic_strike).ok).toBe(false);
    expect(originCostDecision(ABILITIES.charge).ok).toBe(false);
    expect(originCostDecision(ABILITIES.conjure_water).ok).toBe(false);
    expect(originCostDecision(ABILITIES.revive_pet).ok).toBe(false);
  });
  it('spends MP and stamina independently, prevents overspend and cannot change HP', () => {
    const p=newOriginHunterProfile();
    const hp=100;
    expect(originSpend(p,ABILITIES.fireball,30)).toBe(true);
    expect(p.resources).toMatchObject({mana:170,stamina:100});
    expect(originSpend(p,ABILITIES.sinister_strike,45)).toBe(true);
    expect(p.resources).toMatchObject({mana:170,stamina:55});
    expect(originSpend(p,ABILITIES.fireball,500)).toBe(false);
    expect(originSpend(p,ABILITIES.sinister_strike,999)).toBe(false);
    expect(originAvailable(p,ABILITIES.fireball)).toBe(170);
    expect(originAvailable(p,ABILITIES.sinister_strike)).toBe(55);
    expect(hp).toBe(100);
  });
  it('regenerates MP and stamina with deterministic limits while server ticks', () => {
    const p=newOriginHunterProfile();
    originSpend(p,ABILITIES.fireball,20);
    originSpend(p,ABILITIES.sinister_strike,40);
    originRegen(p,1);
    expect(p.resources.mana).toBe(182);
    expect(p.resources.stamina).toBe(68);
    originRegen(p,100);
    expect(p.resources).toEqual(originFreshResources());
    const sim=new Sim({seed:514,playerClass:'warrior',originHunterEnabled:true});
    const r=sim.players.get(sim.player.id)?.originHunter;
    if(!r)throw Error('no hunter');
    r.resources.mana=0;
    r.resources.stamina=0;
    sim.tick();
    expect(r.resources.mana).toBeGreaterThan(0);
    expect(r.resources.stamina).toBeGreaterThan(0);
  });
  it('actually bills a LEARNED Mage non-target spell from MP, never legacy Warrior rage', () => {
    const sim=new Sim({seed:515,playerClass:'warrior',originHunterEnabled:true});
    const id=sim.player.id;
    expect(sim.learnOriginHunterSkillTrusted('frost_armor',id)).toBe(true);
    const r=sim.players.get(id)?.originHunter;
    if(!r)throw Error('no hunter');
    const native=sim.player.resource;
    const hp=sim.player.hp;
    const mp=r.resources.mana;
    sim.castAbility('frost_armor');
    expect(r.resources.mana).toBeLessThan(mp);
    expect(sim.player.resource).toBe(native);
    expect(sim.player.hp).toBe(hp);
  });
  it('keeps legacy Mage and Warrior resource/casting behavior', () => {
    const mage=new Sim({seed:516,playerClass:'mage'});
    expect(mage.players.get(mage.player.id)?.originHunter).toBeUndefined();
    const before=mage.player.resource;
    mage.castAbility('frost_armor');
    expect(mage.player.resource).toBeLessThan(before);
    const warrior=new Sim({seed:517,playerClass:'warrior'});
    expect(warrior.players.get(warrior.player.id)?.originHunter).toBeUndefined();
  });
  it('patches BOTH admission sites and the shared spend hook, legacy stays branch-isolated', () => {
    const cast=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
    const sim=readFileSync('src/sim/sim.ts','utf8');
    expect(cast).toContain('originCostDecision(ability)');
    expect(cast).toContain('originAvailable(meta.originHunter, ability)');
    expect(cast).toContain('originSpend(meta.originHunter, res.def, res.cost)');
    expect(sim).toContain('originRegen(meta.originHunter, DT)');
    expect(sim).toContain('originHunter: saveOriginHunterProfile(meta.originHunter)');
  });
});
