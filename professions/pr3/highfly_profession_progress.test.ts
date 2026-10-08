import { describe, expect, it } from 'vitest';
import { recipeById } from '../src/sim/content/recipes';
import {
  HIGHFLY_PROFESSION_XP_CURVE_DRAFT,
  practiceMultiplier,
  professionXpCurvePreview,
  recordHighflyProfessionProgress,
} from '../src/sim/professions/highfly_profession_progress';
import { resolveCraft } from '../src/sim/professions/crafting';
import { Sim, type PlayerMeta } from '../src/sim/sim';

describe('HIGHFLY PR-3: deterministic Profession XP + Practice', () => {
  it('uses the five authored DRAFT XP bands (not a false frozen leveling gate)', () => {
    expect(HIGHFLY_PROFESSION_XP_CURVE_DRAFT.map(x => x.xp))
      .toEqual([111500, 200000, 350000, 600000, 1000000]);
    expect(professionXpCurvePreview(1)).toBe(0);
    expect(professionXpCurvePreview(125)).toBe(2261500);
    expect(professionXpCurvePreview(126)).toBe(2261500);
    expect(professionXpCurvePreview(Number.NaN)).toBe(0);
  });

  it('follows 1st, 2–5, 6–15, 16–30, 31+ Practice bands', () => {
    for (const [prior, multiplier] of [[0,1.5],[1,1],[4,1],[5,0.75],
      [14,0.75],[15,0.5],[29,0.5],[30,0.25],[31,0.25],[500,0.25]]) {
      expect(practiceMultiplier(prior)).toBe(multiplier);
    }
  });

  it('awards first 1500, later 1000 and then reduced XP with ZERO rng calls', () => {
    let state;
    const awards: number[] = [];
    for (let i=0; i<7; i++) {
      const result=recordHighflyProfessionProgress(state,{
        professionId: 'cooking', skillDelta: 1, practiceKey:'recipe:test_jerky',
      });
      state=result.state;
      awards.push(result.professionXpGranted);
      expect(result.learningCredit).toBe(1);
      expect(result.promotionReady).toBe(false);
    }
    expect(awards).toEqual([1500,1000,1000,1000,1000,750,750]);
    expect(state?.craftXp?.cooking).toBe(6750);
    expect(state?.practice?.['recipe:test_jerky']).toBe(7);
  });

  it('preserves fractional learning and zeroes gray/capped learning without XP', () => {
    const first=recordHighflyProfessionProgress(undefined,{
      professionId:'weaponcrafting',skillDelta:0.25,practiceKey:'recipe:steel',
    });
    expect(first.professionXpGranted).toBe(375);
    expect(first.learningCredit).toBe(0.25);
    const gray=recordHighflyProfessionProgress(first.state,{
      professionId:'weaponcrafting',skillDelta:0,practiceKey:'recipe:steel',
    });
    expect(gray.professionXpGranted).toBe(0);
    expect(gray.state?.craftXp?.weaponcrafting).toBe(375);
    expect(gray.state?.practice?.['recipe:steel']).toBe(2);
  });

  it('saturates Practice at 31, bounds saved XP, refuses unknown crafts', () => {
    let state;
    for (let i=0;i<50;i++) state=recordHighflyProfessionProgress(state,{
      professionId:'alchemy',skillDelta:1,practiceKey:'recipe:elixir',
    }).state;
    expect(state?.practice?.['recipe:elixir']).toBe(31);
    const near=recordHighflyProfessionProgress({
      version:1,craftXp:{alchemy:999999999999},practice:{'recipe:elixir':31},
    }, {professionId:'alchemy',skillDelta:1,practiceKey:'recipe:elixir'});
    expect(near.professionXpGranted).toBe(1);
    expect(near.state?.craftXp?.alchemy).toBe(1e12);
    const unknown=recordHighflyProfessionProgress(undefined,{
      professionId:'unknown',skillDelta:1,practiceKey:'recipe:bad',
    });
    expect(unknown.professionXpGranted).toBe(0);
    expect(unknown.state).toBeUndefined();
  });

  it('uses different counters for different recipe identities and crafts', () => {
    const a=recordHighflyProfessionProgress(undefined,{
      professionId:'cooking',skillDelta:1,practiceKey:'recipe:feast',
    });
    const b=recordHighflyProfessionProgress(a.state,{
      professionId:'alchemy',skillDelta:1,practiceKey:'recipe:flask',
    });
    expect(b.state?.craftXp).toEqual({cooking:1500,alchemy:1500});
    expect(b.state?.practice).toEqual({'recipe:feast':1,'recipe:flask':1});
  });

  it('REAL committed craft writes career XP and Practice; original character XP remains', () => {
    const sim=new Sim({seed:371,playerClass:'warrior',autoEquip:false});
    const pid=sim.playerId;
    const meta=sim.players.get(pid) as PlayerMeta;
    const recipe=recipeById('recipe_tough_jerky')!;
    expect(recipe.professionId).toBe('cooking');
    const before=sim.serializeCharacter(pid)!;
    expect(before.highflyProfessions).toBeUndefined();
    sim.addItem('spider_leg',1,pid);
    const result=resolveCraft(sim.ctx,pid,recipe.id);
    expect(result.ok).toBe(true);
    const after=sim.serializeCharacter(pid)!;
    const gained=(after.craftSkills?.cooking??0)-(before.craftSkills?.cooking??0);
    expect(gained).toBeGreaterThan(0);
    expect(after.highflyProfessions?.craftXp?.cooking)
      .toBe(Math.round(1000*gained*1.5));
    expect(after.highflyProfessions?.practice?.[`recipe:${recipe.id}`]).toBe(1);
    expect(after.xp).toBeGreaterThan(before.xp); // Claude Character XP still granted.
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.archetype).toEqual(before.archetype);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
  });

  it('REAL failed craft changes neither profession XP nor Practice', () => {
    const sim=new Sim({seed:372,playerClass:'warrior',autoEquip:false});
    const pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    const result=resolveCraft(sim.ctx,pid,'recipe_tough_jerky');
    expect(result.ok).toBe(false);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions).toBeUndefined();
    expect(after.craftSkills).toEqual(before.craftSkills);
    expect(after.xp).toEqual(before.xp);
  });

  it('REAL save/reload preserves career XP and Practice and Claude authorities', () => {
    const sim=new Sim({seed:373,playerClass:'warrior',autoEquip:false});
    const pid=sim.playerId;
    sim.addItem('spider_leg',1,pid);
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(true);
    const state=sim.serializeCharacter(pid)!;
    const next=new Sim({seed:374,playerClass:'warrior',noPlayer:true});
    const nextPid=next.addPlayer('warrior','Profession Saver',{state});
    const loaded=next.serializeCharacter(nextPid)!;
    expect(loaded.highflyProfessions).toEqual(state.highflyProfessions);
    expect(loaded.craftSkills).toEqual(state.craftSkills);
    expect(loaded.knownRecipes).toEqual(state.knownRecipes);
    expect(loaded.gatheringProficiency).toEqual(state.gatheringProficiency);
    expect(loaded.archetype).toEqual(state.archetype);
  });
});
