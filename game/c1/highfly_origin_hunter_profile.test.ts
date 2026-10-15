import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import {
  newOriginHunterProfile,
  restoreOriginHunterProfile,
  saveOriginHunterProfile,
} from '../src/sim/highfly_origin_hunter_profile';

describe('HIGHFLY ORIGIN R1-1 persistent opt-in Hunter identity', () => {
  it('never creates an ORIGIN profile on a V15.2 legacy player/save', () => {
    const sim = new Sim({ seed: 144, playerClass: 'warrior' });
    const pid = sim.player.id;
    expect(sim.players.get(pid)?.originHunter).toBeUndefined();
    const save = sim.serializeCharacter(pid);
    expect(save).not.toBeNull();
    expect(Object.hasOwn(save!, 'originHunter')).toBe(false);
    expect(sim.cfg.playerClass).toBe('warrior');
  });
  it('creates exactly one blank ORIGIN identity only with explicit feature opt-in', () => {
    const sim = new Sim({ seed: 144, playerClass: 'warrior', originHunterEnabled: true });
    const pid = sim.player.id;
    const state = sim.serializeCharacter(pid);
    expect(state?.originHunter).toEqual({
      version: 1, identity: 'origin_hunter',
      learnedSkillIds: [], skillMastery: {}, unlocks: [],
    });
    expect(sim.players.get(pid)?.originHunter).toEqual(state?.originHunter);
    expect(sim.cfg.playerClass).toBe('warrior'); // legacy temporary combat carrier only
    expect(sim.player.autoAttack).toBe(false);
  });
  it('preserves independent skill discovery and mastery on a real CharacterState save/rejoin', () => {
    const sim = new Sim({ seed: 144, playerClass: 'warrior', originHunterEnabled: true });
    const pid = sim.player.id;
    const profile = sim.players.get(pid)?.originHunter;
    if (!profile) throw Error('not installed');
    profile.learnedSkillIds = ['heroic_strike','fireball'];
    profile.skillMastery = { fireball: 4 };
    profile.unlocks = ['book_of_flame'];
    const save = sim.serializeCharacter(pid);
    if (!save) throw Error('missing save');
    const restored = new Sim({ seed: 144, playerClass: 'warrior', noPlayer: true });
    const id = restored.addPlayer('warrior', 'Original Hunter', { state: save });
    const after = restored.serializeCharacter(id);
    expect(after?.originHunter).toEqual({
      version: 1, identity: 'origin_hunter',
      learnedSkillIds: ['fireball','heroic_strike'],
      skillMastery: { fireball: 4 },
      unlocks: ['book_of_flame'],
    });
    expect(restored.players.get(id)?.originHunter?.learnedSkillIds).toEqual(['fireball','heroic_strike']);
  });
  it('never retrofits legacy saved identity merely because caller asks for ORIGIN', () => {
    const legacy = new Sim({ seed: 144, playerClass: 'warrior' });
    const saved = legacy.serializeCharacter(legacy.player.id);
    if (!saved) throw Error('missing original save');
    const restored = new Sim({ seed: 144, playerClass: 'warrior', noPlayer: true });
    const id = restored.addPlayer('warrior', 'Legacy', { state: saved, originHunter: true });
    expect(restored.serializeCharacter(id)?.originHunter).toBeUndefined();
  });
  it('fails closed on unknown profile versions or malformed skill/mastery data', () => {
    const ok = newOriginHunterProfile();
    expect(saveOriginHunterProfile(ok)).toEqual(ok);
    expect(() => restoreOriginHunterProfile({ ...ok, version: 2 })).toThrow('UNSUPPORTED');
    expect(() => restoreOriginHunterProfile({ ...ok, learnedSkillIds: ['../bad'] })).toThrow();
    expect(() => restoreOriginHunterProfile({
      ...ok, learnedSkillIds: ['fireball'], skillMastery: { fireball: Infinity },
    })).toThrow();
    expect(ok.learnedSkillIds).toEqual([]);
  });
  it('does not grant skills, change damage, mutate attributes, or alter R0 gameplay paths', () => {
    const core = readFileSync('src/sim/sim.ts','utf8');
    const state = readFileSync('src/sim/character_state.ts','utf8');
    expect(core).toContain('originHunter: saveOriginHunterProfile(meta.originHunter)');
    expect(core).toContain('if (savedState?.originHunter !== undefined)');
    expect(core).toContain('if (!savedState && opts?.originHunter === true)');
    expect(state).toContain('originHunter?: OriginHunterProfileV1');
    const a = new Sim({ seed: 144, playerClass: 'warrior' });
    const b = new Sim({ seed: 144, playerClass: 'warrior', originHunterEnabled: true });
    expect(b.player.stats).toEqual(a.player.stats);
    expect(b.players.get(b.player.id)?.known.map(x=>x.def.id))
      .toEqual(a.players.get(a.player.id)?.known.map(x=>x.def.id));
  });
});
