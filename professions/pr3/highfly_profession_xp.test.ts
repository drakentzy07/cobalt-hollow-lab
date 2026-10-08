import { describe, expect, it } from 'vitest';
import { CRAFT_RING } from '../src/sim/content/professions';
import {
  PROFESSION_XP_BANDS,
  professionPracticeMultiplier,
  professionXpFloorForSkill,
  recordHighflyProfessionProgress,
} from '../src/sim/professions/highfly_profession_xp';
import { Sim, type PlayerMeta } from '../src/sim/sim';

const craft = (overrides: Partial<Parameters<typeof recordHighflyProfessionProgress>[0]> = {}) =>
  recordHighflyProfessionProgress({
    currentSkill: 0,
    professionId: 'cooking',
    source: 'craft',
    contentId: 'recipe_eastbrook_root_pottage',
    learningMultiplier: 1,
    ...overrides,
  });

describe('HIGHFLY PR-3A: pure Profession XP math (no activation)', () => {
  it('five provisional bands total 2,261,500, never raise Claude skill cap', () => {
    expect(PROFESSION_XP_BANDS).toHaveLength(5);
    expect(professionXpFloorForSkill(0)).toBe(0);
    expect(professionXpFloorForSkill(25)).toBe(111_500);
    expect(professionXpFloorForSkill(50)).toBe(311_500);
    expect(professionXpFloorForSkill(75)).toBe(661_500);
    expect(professionXpFloorForSkill(100)).toBe(1_261_500);
    expect(professionXpFloorForSkill(125)).toBe(2_261_500);
    expect(professionXpFloorForSkill(999)).toBe(2_261_500);
  });

  it('practice uses deterministic repeat bands, saturates at 31', () => {
    expect(professionPracticeMultiplier(0)).toBe(1.5);
    expect(professionPracticeMultiplier(1)).toBe(1);
    expect(professionPracticeMultiplier(4)).toBe(1);
    expect(professionPracticeMultiplier(5)).toBe(0.75);
    expect(professionPracticeMultiplier(14)).toBe(0.75);
    expect(professionPracticeMultiplier(15)).toBe(0.5);
    expect(professionPracticeMultiplier(29)).toBe(0.5);
    expect(professionPracticeMultiplier(30)).toBe(0.25);
    expect(professionPracticeMultiplier(31)).toBe(0.25);
  });

  it('records precise cumulative XP, and skill steps only after threshold', () => {
    const one = craft();
    expect(one.professionXpGranted).toBe(1500);
    expect(one.skillDelta).toBe(0);
    expect(one.newSkill).toBe(0);
    expect(one.state?.practice?.['recipe:recipe_eastbrook_root_pottage']).toBe(1);
    expect(one.learningCredit).toBeCloseTo(1500 / 4460);
    let state = one.state;
    const awards: number[] = [1500];
    let skill = 0;
    for (let i = 0; i < 3; i++) {
      const next = craft({ state, currentSkill: skill });
      state = next.state;
      skill = next.newSkill;
      awards.push(next.professionXpGranted);
    }
    expect(awards).toEqual([1500, 1000, 1000, 1000]);
    expect(skill).toBe(1);
    expect(state?.craftXp?.cooking).toBe(4500);
    expect(state?.practice?.['recipe:recipe_eastbrook_root_pottage']).toBe(4);
  });

  it('migrates a fractional Claude skill WITHOUT lowering skill or erasing other career data', () => {
    const original = {
      version: 1 as const,
      knowledge: ['material.dragonsteel'],
      craftXp: { engineering: 999.75 },
      practice: { 'recipe:retired_recipe': 31 },
    };
    const frozen = JSON.stringify(original);
    const first = craft({
      state: original,
      professionId: 'weaponcrafting',
      contentId: 'recipe_eastbrook_arming_sword',
      currentSkill: 25.25,
    });
    expect(first.state?.craftXp?.weaponcrafting).toBe(
      professionXpFloorForSkill(25.25) + 1500,
    );
    expect(first.newSkill).toBe(25.25);
    expect(first.state?.craftXp?.engineering).toBe(999.75);
    expect(first.state?.practice?.['recipe:retired_recipe']).toBe(31);
    expect(first.state?.knowledge).toEqual(['material.dragonsteel']);
    expect(JSON.stringify(original)).toBe(frozen);
  });

  it('never awards progress from gray content, invalid craft, bad factors or at cap', () => {
    expect(craft({ learningMultiplier: 0 }).professionXpGranted).toBe(0);
    expect(craft({ learningMultiplier: Number.NaN }).professionXpGranted).toBe(0);
    expect(craft({ currentSkill: 125 }).professionXpGranted).toBe(0);
    expect(craft({ professionId: 'fake_profession' }).professionXpGranted).toBe(0);
    expect(craft({ contentId: '../bad/id' }).professionXpGranted).toBe(0);
    const maxed = craft({ currentSkill: 125, state: {
      version: 1, craftXp: { cooking: 2_261_500 },
    } });
    expect(maxed.newSkill).toBe(125);
    expect(maxed.skillDelta).toBe(0);
  });

  it('preserves future capstone; reward can cross 124.75 to 125 but not 126', () => {
    const result = craft({
      currentSkill: 124.75,
      state: { version: 1, craftXp: { cooking: 2_261_400 } },
    });
    expect(result.newSkill).toBe(125);
    expect(result.skillDelta).toBeCloseTo(0.25);
    const next = craft({ currentSkill: 125, state: result.state });
    expect(next.newSkill).toBe(125);
    expect(next.professionXpGranted).toBe(0);
  });

  it('works independently for all 10 crafts, including enchanting action', () => {
    expect(CRAFT_RING).toHaveLength(10);
    for (const def of CRAFT_RING) {
      const result = craft({
        professionId: def.id,
        source: def.id === 'enchanting' ? 'disenchant' : 'craft',
      });
      expect(result.state?.craftXp?.[def.id]).toBe(1500);
      expect(result.professionXpGranted).toBe(1500);
      expect(result.promotionReady).toBe(false);
    }
    const a = craft({ source: 'apply_enchant' });
    expect(a.state?.practice?.['action:apply_enchant']).toBe(1);
  });

  it('is a pure proposal: no RNG, Character XP, core stats, inventory, save writes', () => {
    const sim = new Sim({ seed: 9035, playerClass: 'warrior' });
    const pid = sim.playerId;
    const meta = sim.players.get(pid) as PlayerMeta;
    const before = sim.serializeCharacter(pid)!;
    let draws = 0;
    sim.rng.setObserver(() => { draws++; });
    const result = craft({ currentSkill: meta.craftSkills.cooking });
    sim.rng.setObserver(null);
    const after = sim.serializeCharacter(pid)!;
    expect(draws).toBe(0);
    expect(after).toEqual(before);
    expect(meta.highflyProfessions).toBeUndefined();
    expect(result.professionXpGranted).toBe(1500);
    expect(result.state?.craftXp?.cooking).toBe(1500);
  });
});
