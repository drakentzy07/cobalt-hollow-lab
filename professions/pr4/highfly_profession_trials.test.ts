import { describe, expect, it } from 'vitest';
import { recipeById } from '../src/sim/content/recipes';
import { STATIONS } from '../src/sim/data';
import { resolveCraft } from '../src/sim/professions/crafting';
import { battlefieldExperienceTrickle } from '../src/sim/professions/battlefield_xp';
import { recordHighflyProfessionProgress } from '../src/sim/professions/highfly_profession_progress';
import {
  COOKING_APPRENTICE_TRIAL, PROFESSION_TRIAL_THRESHOLDS,
  claimCookingTrialPilot, cookingTrialIsPending, cookingTrialStatus,
  cookingTrialXpFrozen, enrollCookingTrialPilot, professionTrialId,
  professionTrialXpThreshold, recordCookingTrialProof,
  trialIsReachable, trialLimitedCookingGain,
} from '../src/sim/professions/highfly_profession_trials';
import { stationsOfType } from '../src/sim/professions/stations';
import { Sim, type PlayerMeta } from '../src/sim/sim';

const threshold = professionTrialXpThreshold(25);
function makeSim(seed = 400) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: false });
}
function givePerchCraft(sim: Sim, pid: number) {
  const r = recipeById('recipe_pan_seared_perch')!;
  const meta = sim.players.get(pid) as PlayerMeta;
  meta.knownRecipes.add(r.id); // emulate learning it from its existing trainer
  const station = stationsOfType(STATIONS, 'kitchens')[0];
  expect(station).toBeTruthy();
  const e = sim.entities.get(pid)!;
  e.pos.x = station.pos.x;
  e.pos.z = station.pos.z;
  e.prevPos = { ...e.pos };
  sim.addItem('raw_river_perch', 2, pid);
  sim.addItem('cooking_salt', 1, pid);
  return resolveCraft(sim.ctx, pid, r.id);
}

describe('HIGHFLY PR-4 — safe opt-in Cooking 24 -> 25 trial', () => {
  it('exposes five generic promotion boundaries, NOT a new level 126', () => {
    expect([...PROFESSION_TRIAL_THRESHOLDS]).toEqual([25, 50, 75, 100, 125]);
    expect(PROFESSION_TRIAL_THRESHOLDS.map(t => professionTrialId('weaponcrafting', t)))
      .toEqual([25,50,75,100,125].map(t => `trial.weaponcrafting.${t}`));
    expect(PROFESSION_TRIAL_THRESHOLDS.map(professionTrialXpThreshold))
      .toEqual([111500,311500,661500,1261500,2261500]);
  });

  it('validates authored trials cannot require locked-tier recipes or circular proofs', () => {
    expect(trialIsReachable(COOKING_APPRENTICE_TRIAL)).toBe(true);
    for (const recipeId of ['recipe_tough_jerky', 'recipe_pan_seared_perch']) {
      const recipe = recipeById(recipeId);
      expect(recipe?.professionId).toBe('cooking');
      expect(recipe?.skillReq).toBeLessThan(25);
    }
    expect(trialIsReachable({...COOKING_APPRENTICE_TRIAL,maxPrerequisiteSkill:25})).toBe(false);
    expect(trialIsReachable({...COOKING_APPRENTICE_TRIAL,requiredEvidence:['same','same']})).toBe(false);
    expect(trialIsReachable({...COOKING_APPRENTICE_TRIAL,trialId:'wrong'})).toBe(false);
  });

  it('enrollment is explicit, sparse, grandfather-safe and irreversible by accident', () => {
    expect(cookingTrialIsPending(undefined)).toBe(false);
    expect(enrollCookingTrialPilot(undefined,25)).toBeUndefined();
    expect(enrollCookingTrialPilot(undefined,99)).toBeUndefined();
    expect(enrollCookingTrialPilot(undefined,Number.NaN)).toBeUndefined();
    const fresh=enrollCookingTrialPilot(undefined,0)!;
    expect(fresh).toEqual({version:1,trialTracks:['cooking']});
    expect(enrollCookingTrialPilot(fresh,20)).toBe(fresh);
    expect(trialLimitedCookingGain(undefined,'cooking',24,1)).toBe(1);
    expect(trialLimitedCookingGain(fresh,'alchemy',24,1)).toBe(1);
  });

  it('stops at exactly 24, supports partial skill and resumes when claimed', () => {
    const enrolled=enrollCookingTrialPilot(undefined,10)!;
    expect(trialLimitedCookingGain(enrolled,'cooking',23.75,1)).toBe(0.25);
    expect(trialLimitedCookingGain(enrolled,'cooking',24,0.5)).toBe(0);
    expect(trialLimitedCookingGain(enrolled,'cooking',24,1)).toBe(0);
    expect(trialLimitedCookingGain(enrolled,'cooking',15,0.25)).toBe(0.25);
    const claimed={...enrolled,completedTrials:['trial.cooking.25']};
    expect(trialLimitedCookingGain(claimed,'cooking',24,1)).toBe(1);
  });

  it('freezes post-milestone XP, keeps ONLY crossing-action overflow', () => {
    let enrolled=enrollCookingTrialPilot({
      version:1, craftXp:{cooking:threshold-50}, practice:{'recipe:tough':1},
    },24)!;
    expect(cookingTrialXpFrozen(enrolled)).toBe(false);
    const first=recordHighflyProfessionProgress(enrolled,{
      professionId:'cooking',skillDelta:0,learningCredit:1,practiceKey:'recipe:tough',
    });
    expect(first.professionXpGranted).toBe(1000);
    enrolled=first.state!;
    expect(enrolled.craftXp?.cooking).toBe(threshold+950);
    expect(cookingTrialXpFrozen(enrolled)).toBe(true);
    // Production crafting seam passes ZERO learningCredit once the threshold
    // was crossed, preserving only the previous action's overflow.
    const second=recordHighflyProfessionProgress(enrolled,{
      professionId:'cooking',skillDelta:0,learningCredit:0,practiceKey:'recipe:tough',
    });
    expect(second.professionXpGranted).toBe(0);
    expect(second.state?.craftXp?.cooking).toBe(threshold+950);
    expect(second.state?.practice?.['recipe:tough']).toBe(3);
  });

  it('requires two DIFFERENT actual cooking recipes and explicit claim', () => {
    let s=enrollCookingTrialPilot({version:1, craftXp:{cooking:threshold}},24)!;
    expect(cookingTrialStatus(s,24).ready).toBe(false);
    s=recordCookingTrialProof(s,'cooking','recipe_tough_jerky')!;
    expect(cookingTrialStatus(s,24).proofs).toBe(1);
    const same=recordCookingTrialProof(s,'cooking','recipe_tough_jerky');
    expect(same).toBe(s);
    expect(claimCookingTrialPilot(s,24)).toBeUndefined();
    s=recordCookingTrialProof(s,'cooking','recipe_pan_seared_perch')!;
    expect(cookingTrialStatus(s,23.75).ready).toBe(false);
    expect(cookingTrialStatus(s,24).ready).toBe(true);
    const claimed=claimCookingTrialPilot(s,24)!;
    expect(claimed.completedTrials).toEqual(['trial.cooking.25']);
    expect(cookingTrialIsPending(claimed)).toBe(false);
    expect(claimCookingTrialPilot(claimed,24)).toBeUndefined();
    expect(recordCookingTrialProof(claimed,'cooking','recipe_tough_jerky')).toBe(claimed);
  });

  it('real Cooking craft at cap still consumes materials/output, earns trial XP but not raw skill', () => {
    const sim=makeSim(411), pid=sim.playerId;
    const meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.cooking=24;
    expect(sim.enrollHighflyCookingTrialPilot()).toBe(true);
    const before=sim.serializeCharacter(pid)!;
    sim.addItem('spider_leg',1,pid);
    const result=resolveCraft(sim.ctx,pid,'recipe_tough_jerky');
    expect(result.ok).toBe(true);
    expect(sim.countItem('spider_leg',pid)).toBe(0);
    expect(sim.countItem('tough_jerky',pid)).toBe(1);
    expect(meta.craftSkills.cooking).toBe(24);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions?.craftXp?.cooking).toBe(1500);
    expect(after.highflyProfessions?.practice?.['recipe:recipe_tough_jerky']).toBe(1);
    expect(after.highflyProfessions?.evidence?.['trial.cooking.25.recipe_tough_jerky']).toBe(1);
    expect(after.xp).toBe(before.xp); // no inflated delayed Character XP
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
  });

  it('real trial proof + XP reaches ready, claim unlocks 25, survives reload', () => {
    const sim=makeSim(412),pid=sim.playerId;
    const meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.cooking=24;
    expect(sim.enrollHighflyCookingTrialPilot()).toBe(true);
    meta.highflyProfessions={
      ...meta.highflyProfessions!,craftXp:{cooking:threshold-10},
    };
    sim.addItem('spider_leg',1,pid);
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(true);
    expect(meta.craftSkills.cooking).toBe(24);
    expect(sim.highflyCookingTrialPilotStatus().ready).toBe(false);
    const fish=givePerchCraft(sim,pid);
    expect(fish.ok).toBe(true);
    expect(sim.highflyCookingTrialPilotStatus().ready).toBe(true);
    const banked=meta.highflyProfessions!.craftXp!.cooking;
    expect(banked).toBeGreaterThan(threshold);
    sim.addItem('spider_leg',1,pid);
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(true);
    expect(meta.highflyProfessions!.craftXp!.cooking).toBe(banked);
    expect(sim.claimHighflyCookingTrialPilot()).toBe(true);
    expect(sim.claimHighflyCookingTrialPilot()).toBe(false);
    sim.addItem('spider_leg',1,pid);
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(true);
    expect(meta.craftSkills.cooking).toBe(25);
    const saved=sim.serializeCharacter(pid)!;
    const fresh=new Sim({seed:413,playerClass:'warrior',noPlayer:true});
    const nextPid=fresh.addPlayer('warrior','Cooking Trial Reload',{state:saved});
    const loaded=fresh.serializeCharacter(nextPid)!;
    expect(loaded.highflyProfessions).toEqual(saved.highflyProfessions);
    expect(loaded.craftSkills).toEqual(saved.craftSkills);
    expect(loaded.highflyProfessions?.completedTrials).toContain('trial.cooking.25');
    expect(fresh.highflyCookingTrialPilotStatus(nextPid).completed).toBe(true);
  });

  it('battlefield trickle cannot bypass an enrolled cooking trial cap', () => {
    const career=enrollCookingTrialPilot(undefined,24)!;
    const skill={cooking:24};
    const observation={
      itemId:'tough_jerky',instance:{signer:'Alice',rolled:{quality:'rare'}},
      observerName:'Alice',observerActiveArchetype:'cooking',
    };
    expect(battlefieldExperienceTrickle(skill,observation,career)).toBe(0);
    expect(skill.cooking).toBe(24);
    expect(battlefieldExperienceTrickle(skill,observation)).toBe(0.25);
    expect(skill.cooking).toBe(24.25);
  });

  it('old non-enrolled character keeps all original crafting and save semantics', () => {
    const sim=makeSim(414),pid=sim.playerId;
    const meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.cooking=24;
    const original=sim.serializeCharacter(pid)!;
    expect(original.highflyProfessions).toBeUndefined();
    sim.addItem('spider_leg',1,pid);
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(true);
    expect(meta.craftSkills.cooking).toBe(25);
    expect(sim.serializeCharacter(pid)!.highflyProfessions?.trialTracks).toBeUndefined();
  });
});
