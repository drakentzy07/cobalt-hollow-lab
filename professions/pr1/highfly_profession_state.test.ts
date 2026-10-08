import { describe, expect, it } from 'vitest';
import {
  normalizeHighflyProfessionState,
  savedHighflyProfessionFragment,
} from '../src/sim/professions/highfly_profession_state';
import { Sim, type PlayerMeta } from '../src/sim/sim';

describe('HIGHFLY PR-1: sparse career state + guarded migrations', () => {
  it('leaves old, missing, empty or unknown versions absent', () => {
    expect(normalizeHighflyProfessionState(undefined)).toBeUndefined();
    expect(normalizeHighflyProfessionState({ version: 1 })).toBeUndefined();
    expect(normalizeHighflyProfessionState({ version: 0, knowledge: ['old'] })).toBeUndefined();
    expect(normalizeHighflyProfessionState({ version: 2, knowledge: ['future'] })).toBeUndefined();
    expect(normalizeHighflyProfessionState([])).toBeUndefined();
    expect(savedHighflyProfessionFragment(undefined)).toEqual({});
  });

  it('keeps valid retired ids, fractional XP and every future career axis', () => {
    const raw = {
      version: 1,
      craftXp: { weaponcrafting: 12.5, 'retired.craft-id': 8.75 },
      practice: { 'recipe:old_recipe': 4, 'action:disenchant': 31 },
      completedTrials: ['weaponcrafting.25'],
      knowledge: ['material.dragonsteel'],
      discoveries: ['discovery.alchemy1'],
      legendaryProfessions: ['cooking'],
      legendaryArchetypes: ['smith'],
      evidence: { 'feast.placed': 2 },
      discoveredSources: ['source.deep_vein'],
    };
    const good = normalizeHighflyProfessionState(raw);
    expect(good).toEqual(raw);
    expect(normalizeHighflyProfessionState(good)).toEqual(good);
    expect(savedHighflyProfessionFragment(good)).toEqual({ highflyProfessions: good });
    expect(good?.craftXp).not.toBe(raw.craftXp);
    expect(good?.knowledge).not.toBe(raw.knowledge);
  });

  it('drops malicious/bad values; bounds counters, list size and practice history', () => {
    const ids = Array.from({ length: 400 }, (_, i) => `knowledge.${i}`);
    const raw = {
      version: 1,
      knowledge: ['fine', 'fine', '', '__proto__', 'not allowed !', ...ids],
      craftXp: { smith: -1, cook: Number.NaN, alchemy: 0.5, huge: 1e99 },
      practice: { 'recipe:smith': 9999, 'action:enchant': 3.8 },
      evidence: { 'craft.success': 1e50, zero: 0 },
      unknownField: { poison: 'ignored' },
    };
    const good = normalizeHighflyProfessionState(raw)!;
    expect(good.knowledge?.[0]).toBe('fine');
    expect(good.knowledge?.length).toBe(256);
    expect(good.craftXp).toEqual({ alchemy: 0.5, huge: 1e12 });
    expect(good.practice).toEqual({ 'recipe:smith': 31, 'action:enchant': 3 });
    expect(good.evidence).toEqual({ 'craft.success': 1e9 });
    expect((good as unknown as Record<string, unknown>).unknownField).toBeUndefined();
  });

  it('old save survives real addPlayer and serializeCharacter without new empty keys', () => {
    const sim = new Sim({ seed: 901, playerClass: 'warrior' });
    const old = sim.serializeCharacter(sim.playerId);
    expect(old).not.toBeNull();
    expect(old?.highflyProfessions).toBeUndefined();
    const fresh = new Sim({ seed: 902, playerClass: 'warrior', noPlayer: true });
    const pid = fresh.addPlayer('warrior', 'Previous Character', { state: old! });
    const loaded = fresh.players.get(pid) as PlayerMeta;
    expect(Object.hasOwn(loaded, 'highflyProfessions')).toBe(false);
    const after = fresh.serializeCharacter(pid)!;
    expect(Object.hasOwn(after, 'highflyProfessions')).toBe(false);
    expect(after.craftSkills).toEqual(old?.craftSkills);
    expect(after.knownRecipes).toEqual(old?.knownRecipes);
    expect(after.gatheringProficiency).toEqual(old?.gatheringProficiency);
    expect(after.archetype).toEqual(old?.archetype);
  });

  it('round-trips added state through the REAL game save/load, without mutating Claude fields', () => {
    const sim = new Sim({ seed: 903, playerClass: 'warrior' });
    const pid = sim.playerId;
    const meta = sim.players.get(pid) as PlayerMeta;
    const initial = sim.serializeCharacter(pid)!;
    const chosen = normalizeHighflyProfessionState({
      version: 1,
      craftXp: { weaponcrafting: 0.375, 'old-retired': 100.75 },
      practice: { 'recipe:ironedge_longsword': 2 },
      completedTrials: ['trial.weaponcrafting.25'],
      knowledge: ['material.dragonsteel'],
      discoveries: ['smith.hidden-source'],
      legendaryProfessions: ['weaponcrafting'],
      legendaryArchetypes: ['smith'],
      evidence: { 'craft.success.weaponcrafting': 7 },
      discoveredSources: ['source.deep_vein'],
    });
    meta.highflyProfessions = chosen;
    const state = sim.serializeCharacter(pid)!;
    expect(state.highflyProfessions).toEqual(chosen);
    expect(state.craftSkills).toEqual(initial.craftSkills);
    expect(state.knownRecipes).toEqual(initial.knownRecipes);
    expect(state.gatheringProficiency).toEqual(initial.gatheringProficiency);
    expect(state.archetype).toEqual(initial.archetype);
    const fresh = new Sim({ seed: 904, playerClass: 'warrior', noPlayer: true });
    const nextPid = fresh.addPlayer('warrior', 'Persisted Career', { state });
    const next = fresh.serializeCharacter(nextPid)!;
    expect(next.highflyProfessions).toEqual(chosen);
    expect(next.craftSkills).toEqual(initial.craftSkills);
    expect(next.knownRecipes).toEqual(initial.knownRecipes);
    expect(next.gatheringProficiency).toEqual(initial.gatheringProficiency);
    expect(next.archetype).toEqual(initial.archetype);
  });

  it('real load rejects a bad career payload without touching existing professions', () => {
    const sim = new Sim({ seed: 905, playerClass: 'warrior' });
    const state = sim.serializeCharacter(sim.playerId)!;
    const initialCraft = state.craftSkills;
    state.highflyProfessions = { version: 1, knowledge: [false, 7, 'valid.id'] } as never;
    const fresh = new Sim({ seed: 906, playerClass: 'warrior', noPlayer: true });
    const pid = fresh.addPlayer('warrior', 'Bad Career Input', { state });
    const after = fresh.serializeCharacter(pid)!;
    expect(after.highflyProfessions).toEqual({ version: 1, knowledge: ['valid.id'] });
    expect(after.craftSkills).toEqual(initialCraft);
    expect(after.knownRecipes).toEqual(state.knownRecipes);
  });
});
