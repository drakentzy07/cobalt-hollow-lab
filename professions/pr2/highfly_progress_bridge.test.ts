import { describe, expect, it } from 'vitest';
import { CRAFT_RING, craftMaxSkillFor } from '../src/sim/content/professions';
import { observeLegacyProfessionProgress } from '../src/sim/professions/highfly_progress_bridge';
import { emptyCraftSkills, gainCraftSkill } from '../src/sim/professions/wheel';
import { Sim, type PlayerMeta } from '../src/sim/sim';

describe('HIGHFLY PR-2: exact legacy gain parity (no new XP, RNG, or saves)', () => {
  it('invokes the untouched gain body EXACTLY once, observes result, grants no XP', () => {
    const skills = emptyCraftSkills();
    let calls = 0;
    const result = observeLegacyProfessionProgress(skills, 'alchemy', 0.25, () => {
      calls += 1;
      skills.alchemy += 0.25;
    });
    expect(calls).toBe(1);
    expect(skills.alchemy).toBe(0.25);
    expect(result).toEqual({
      skillDelta: 0.25,
      learningCredit: 0.25,
      professionXpGranted: 0,
      promotionReady: false,
    });
  });

  it('has no independent gain, and reports zero when the legacy gain refuses', () => {
    const skills = emptyCraftSkills();
    const before = { ...skills };
    let calls = 0;
    const out = observeLegacyProfessionProgress(skills, 'not-a-craft', 1000, () => {
      calls += 1;
    });
    expect(calls).toBe(1);
    expect(skills).toEqual(before);
    expect(out.skillDelta).toBe(0);
    expect(out.learningCredit).toBe(0);
    expect(out.professionXpGranted).toBe(0);
  });

  it('matches the original source algorithm over every craft and gain band', () => {
    const amounts = [1, 0.5, 0.25, 0, -2, Number.NaN, 40.5, 125, 250];
    expect(CRAFT_RING).toHaveLength(10);
    const actual = emptyCraftSkills();
    const old = emptyCraftSkills();
    const ids = CRAFT_RING.map(c => c.id);
    for (let rep = 0; rep < 15; rep++) {
      for (const craftId of [...ids, 'not-a-craft']) {
        for (const amount of amounts) {
          // Frozen Claude v0.44.0 gainCraftSkill body, deliberately kept as
          // an independent test oracle. No RNG or new achievement logic.
          if ((craftId in old) && amount > 0) {
            old[craftId] = Math.min(craftMaxSkillFor(craftId), old[craftId] + amount);
          }
          gainCraftSkill(actual, craftId, amount);
          expect(actual).toEqual(old);
        }
      }
    }
    for (const id of ids) expect(actual[id]).toBe(craftMaxSkillFor(id));
    expect(Object.hasOwn(actual, 'not-a-craft')).toBe(false);
  });

  it('preserves the fractional skill and cap boundary exactly', () => {
    const skills = emptyCraftSkills();
    skills.cooking = 124.75;
    gainCraftSkill(skills, 'cooking', 0.25);
    expect(skills.cooking).toBe(125);
    gainCraftSkill(skills, 'cooking', 1);
    expect(skills.cooking).toBe(125);
    gainCraftSkill(skills, 'cooking', -5);
    expect(skills.cooking).toBe(125);
  });

  it('a real character has no new career save data after legacy gains', () => {
    const sim = new Sim({ seed: 404, playerClass: 'warrior' });
    const pid = sim.playerId;
    const meta = sim.players.get(pid) as PlayerMeta;
    const old = sim.serializeCharacter(pid)!;
    for (const craft of CRAFT_RING) gainCraftSkill(meta.craftSkills, craft.id, 1.25);
    const after = sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions).toBeUndefined();
    expect(after.knownRecipes).toEqual(old.knownRecipes);
    expect(after.archetype).toEqual(old.archetype);
    expect(after.gatheringProficiency).toEqual(old.gatheringProficiency);
    expect(after.xp).toEqual(old.xp);
    expect(after.level).toEqual(old.level);
    for (const c of CRAFT_RING) expect(after.craftSkills?.[c.id]).toBe(1.25);
  });

  it('does not introduce any extra RNG draw or other callback', () => {
    const skills = emptyCraftSkills();
    let draws = 0;
    const rawDraw = () => { draws += 1; return 0.5; };
    const event = observeLegacyProfessionProgress(skills, 'tailoring', 1, () => {
      const roll = rawDraw();
      skills.tailoring += roll;
    });
    expect(draws).toBe(1);
    expect(event.skillDelta).toBe(0.5);
  });
});
