import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { ABILITIES } from '../src/sim/content/classes';
import { highflyOriginNativeLearnable } from '../src/sim/highfly_origin_native_spellbook';

describe('HIGHFLY ORIGIN R1-2A — native skill catalogue detached from legacy class', () => {
  it('legacy Warrior retains original class ability book byte-identically', () => {
    const legacy = new Sim({ seed: 140, playerClass: 'warrior' });
    const known = legacy.players.get(legacy.player.id)?.known.map(k=>k.def.id) ?? [];
    expect(known).toContain('heroic_strike');
    expect(known).not.toContain('fireball');
  });
  it('ORIGIN Warrior carrier starts with NO free 9-class skills', () => {
    const sim = new Sim({ seed: 140, playerClass: 'warrior', originHunterEnabled: true });
    const meta = sim.players.get(sim.player.id);
    expect(meta?.known.map(k => k.def.id)).toEqual([]);
    expect(sim.resolvedAbility('heroic_strike')).toBeNull();
    expect(sim.resolvedAbility('fireball')).toBeNull();
    expect(meta?.originHunter?.learnedSkillIds).toEqual([]);
  });
  it('trusted server can learn a native MAGE skill on a Hunter carried by WARRIOR', () => {
    const sim = new Sim({ seed: 140, playerClass: 'warrior', originHunterEnabled: true });
    const before = { ...sim.player.stats };
    const pid = sim.player.id;
    expect(ABILITIES.fireball.class).toBe('mage');
    expect(sim.learnOriginHunterSkillTrusted('fireball', pid)).toBe(true);
    const resolved = sim.resolvedAbility('fireball', pid);
    expect(resolved?.def.id).toBe('fireball');
    expect(resolved?.def.class).toBe('mage');
    expect(resolved?.rank).toBe(1);
    expect(resolved?.effects).toEqual(ABILITIES.fireball.effects);
    expect(sim.player.stats).toEqual(before);
    expect(sim.players.get(pid)?.originHunter?.learnedSkillIds).toEqual(['fireball']);
    expect(sim.learnOriginHunterSkillTrusted('fireball', pid)).toBe(false);
  });
  it('discovery allows native physical + magic IDs but not class kits for free', () => {
    const sim = new Sim({ seed: 140, playerClass: 'warrior', originHunterEnabled: true });
    const id = sim.player.id;
    expect(sim.learnOriginHunterSkillTrusted('heroic_strike',id)).toBe(true);
    expect(sim.learnOriginHunterSkillTrusted('fireball',id)).toBe(true);
    const known=sim.players.get(id)?.known.map(k=>k.def.id).sort();
    expect(known).toEqual(['fireball','heroic_strike']);
    expect(sim.players.get(id)?.originHunter?.learnedSkillIds).toEqual(['fireball','heroic_strike']);
  });
  it('requires native level, valid published ID, and no unearned spec/quest', () => {
    const sim = new Sim({ seed: 140, playerClass: 'warrior', originHunterEnabled: true });
    const id=sim.player.id;
    expect(highflyOriginNativeLearnable('charge',1,new Set())).toBeNull();
    expect(sim.learnOriginHunterSkillTrusted('charge',id)).toBe(false); // level 3
    expect(sim.learnOriginHunterSkillTrusted('arcane_missiles',id)).toBe(false); // arcane spec
    expect(sim.learnOriginHunterSkillTrusted('nonexistent_super_skill',id)).toBe(false);
    expect(sim.learnOriginHunterSkillTrusted('../bad',id)).toBe(false);
    expect(sim.players.get(id)?.known).toEqual([]);
  });
  it('serializes skill knowledge, and reload rebuilds native known list', () => {
    const sim = new Sim({ seed: 140, playerClass: 'warrior', originHunterEnabled: true });
    expect(sim.learnOriginHunterSkillTrusted('fireball',sim.player.id)).toBe(true);
    const saved=sim.serializeCharacter(sim.player.id);
    if(!saved) throw Error('missing state');
    const loaded=new Sim({ seed: 140, playerClass: 'warrior', noPlayer: true });
    const id=loaded.addPlayer('warrior','Original Hunter',{state:saved});
    expect(loaded.players.get(id)?.known.map(k=>k.def.id)).toEqual(['fireball']);
    expect(loaded.resolvedAbility('fireball',id)?.def.class).toBe('mage');
    expect(loaded.serializeCharacter(id)?.originHunter?.learnedSkillIds).toEqual(['fireball']);
  });
  it('client cannot claim learned skills using any new websocket unlock command', () => {
    const sim=readFileSync('src/sim/sim.ts','utf8');
    const server=readFileSync('server/game.ts','utf8');
    expect(sim).toContain('meta.known = meta.originHunter');
    expect(sim).toContain('highflyOriginKnownAbilities(meta.originHunter, e.level, meta.questsDone)');
    expect(sim).toContain('learnOriginHunterSkillTrusted(abilityId: string');
    expect(server).not.toContain("case 'highfly_origin_learn':");
    expect(server).not.toContain('learnOriginHunterSkillTrusted(');
  });
});
