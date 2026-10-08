import { describe, expect, it } from 'vitest';
import { COMBO_RECIPES, recipeById } from '../src/sim/content/recipes';
import { STATIONS } from '../src/sim/data';
import { resolveCraft } from '../src/sim/professions/crafting';
import { battlefieldExperienceTrickle } from '../src/sim/professions/battlefield_xp';
import { stationsOfType } from '../src/sim/professions/stations';
import { professionTrialXpThreshold } from '../src/sim/professions/highfly_profession_trials';
import {
  SMITH_CRAFTS, SMITH_TRIALS, smithCraftId, smithTrialCatalogValid,
  smithIsActive, smithLiveComboRecipeIds,
  smithPilotEnroll, smithPilotClaim, smithTrialLimitedGain, smithTrialPending,
  smithTrialStatus, smithTrialXpFrozen, recordSmithTrialProof,
  highflySmithSnapshot,
} from '../src/sim/professions/highfly_smith_pilot';
import { Sim, type PlayerMeta } from '../src/sim/sim';

const threshold=professionTrialXpThreshold(25);
const weapon='weaponcrafting', armor='armorcrafting';
function make(seed=510){return new Sim({seed,playerClass:'warrior',autoEquip:false});}
function realCraft(sim: Sim, id: string, pid=sim.playerId) {
  const recipe=recipeById(id)!;
  expect(recipe).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer')) meta.knownRecipes.add(recipe.id);
  if(recipe.stationType){
    const station=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(station).toBeTruthy();
    const e=sim.entities.get(pid)!;
    e.pos.x=station.pos.x;
    e.pos.z=station.pos.z;
    e.prevPos={...e.pos};
  }
  for(const reagent of recipe.reagents){
    sim.addItem(reagent.itemId,reagent.count,pid);
  }
  return resolveCraft(sim.ctx,pid,recipe.id);
}
describe('HIGHFLY PR-5 — real Smith weapon and armor pilot',()=>{
  it('uses both original crafts, the ring-adjacent pair, and two REAL combo recipes',()=>{
    expect([...SMITH_CRAFTS]).toEqual([weapon,armor]);
    expect(smithCraftId('cooking')).toBe(false);
    expect(smithTrialCatalogValid()).toBe(true);
    expect(smithIsActive({activeArchetype:weapon,pairedMajor:armor})).toBe(true);
    expect(smithIsActive({activeArchetype:armor,pairedMajor:weapon})).toBe(true);
    expect(smithIsActive({activeArchetype:null,pairedMajor:null})).toBe(false);
    const actual=smithLiveComboRecipeIds().sort();
    expect(actual).toEqual(['recipe_forgeguard_bulwark_gauntlets','recipe_ironbound_warplate_helm']);
    for(const id of actual){
      const combo=COMBO_RECIPES.find(r=>r.id===id)!.comboRequirement!;
      expect(new Set([combo.craftA,combo.craftB])).toEqual(new Set([weapon,armor]));
      expect(combo.minTier).toBe(1);
    }
  });

  it('authored proof recipes exist, have distinct item types, and require skill BELOW 25',()=>{
    for(const craft of SMITH_CRAFTS){
      const def=SMITH_TRIALS[craft];
      expect(def.maxPrerequisiteSkill).toBe(0);
      expect(def.requiredEvidence).toHaveLength(2);
      for(const proof of def.requiredEvidence){
        const id=proof.replace(`trial.${craft}.25.`,'');
        const recipe=recipeById(id)!;
        expect(recipe).toBeTruthy();
        expect(recipe.professionId).toBe(craft);
        expect(recipe.skillReq).toBe(0);
      }
    }
  });

  it('requires EXPLICIT per-craft enrollment and never retro-caps an old skill25+',()=>{
    expect(smithPilotEnroll(undefined,weapon,25)).toBeUndefined();
    expect(smithPilotEnroll(undefined,armor,50)).toBeUndefined();
    expect(smithPilotEnroll(undefined,'enchanting',0)).toBeUndefined();
    const w=smithPilotEnroll(undefined,weapon,1)!;
    expect(w.trialTracks).toEqual([weapon]);
    expect(smithTrialPending(w,weapon)).toBe(true);
    expect(smithTrialPending(w,armor)).toBe(false);
    expect(smithPilotEnroll(w,weapon,1)).toBe(w);
    const a=smithPilotEnroll(w,armor,1)!;
    expect(a.trialTracks).toEqual([weapon,armor]);
    expect(smithTrialLimitedGain(a,weapon,23.75,1)).toBe(0.25);
    expect(smithTrialLimitedGain(a,armor,24,1)).toBe(0);
    expect(smithTrialLimitedGain(a,'cooking',24,1)).toBe(1);
    expect(smithTrialLimitedGain(undefined,armor,24,1)).toBe(1);
  });

  it('independent XP, proof, and explicit claims cannot be substituted between branches',()=>{
    let s=smithPilotEnroll(undefined,weapon,24)!;
    s=smithPilotEnroll(s,armor,24)!;
    s={...s, craftXp:{weaponcrafting:threshold,armorcrafting:threshold-1}};
    s=recordSmithTrialProof(s,weapon,'recipe_eastbrook_arming_sword')!;
    s=recordSmithTrialProof(s,weapon,'recipe_copper_bearded_axe')!;
    expect(smithTrialStatus(s,weapon,24).ready).toBe(true);
    expect(smithTrialStatus(s,armor,24).ready).toBe(false);
    expect(smithPilotClaim(s,armor,24)).toBeUndefined();
    expect(smithPilotClaim(s,weapon,23)).toBeUndefined();
    const done=smithPilotClaim(s,weapon,24)!;
    expect(done.completedTrials).toEqual(['trial.weaponcrafting.25']);
    expect(smithTrialPending(done,weapon)).toBe(false);
    expect(smithTrialPending(done,armor)).toBe(true);
    expect(smithTrialLimitedGain(done,weapon,24,1)).toBe(1);
    expect(smithTrialLimitedGain(done,armor,24,1)).toBe(0);
  });

  it('Smith XP reaches exactly completing action overflow then freezes until claim',()=>{
    let s=smithPilotEnroll({version:1,craftXp:{weaponcrafting:threshold}},weapon,24)!;
    expect(smithTrialXpFrozen(s,weapon)).toBe(true);
    expect(smithTrialXpFrozen(s,armor)).toBe(false);
    s=recordSmithTrialProof(s,weapon,'recipe_copper_bearded_axe')!;
    expect(s.evidence?.['trial.weaponcrafting.25.recipe_copper_bearded_axe']).toBe(1);
    expect(recordSmithTrialProof(s,weapon,'recipe_copper_bearded_axe')).toBe(s);
    expect(recordSmithTrialProof(s,armor,'recipe_copper_bearded_axe')).toBe(s);
  });

  it('read-only Smith profile does not fake titles, Grandmaster Proof or Legendary',()=>{
    const base={weaponcrafting:125,armorcrafting:124};
    const first=highflySmithSnapshot(base,{activeArchetype:null,pairedMajor:null});
    expect(first.smithActive).toBe(false);
    expect(first.grandmasterSkillEligible).toBe(false);
    expect(first.legendaryAwardedByThisPilot).toBe(false);
    const both=highflySmithSnapshot({...base,armorcrafting:125},{
      activeArchetype:weapon,pairedMajor:armor,
    });
    expect(both.smithActive).toBe(true);
    expect(both.titleId).toBeTruthy();
    expect(both.grandmasterSkillEligible).toBe(true);
    expect(both.legendaryAwardedByThisPilot).toBe(false);
    expect(both.comboRecipeIds).toHaveLength(2);
  });

  it('real weapon trial stops at 24 while item/material/economy still work',()=>{
    const sim=make(511),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.weaponcrafting=24;
    expect(sim.enrollHighflySmithTrialPilot(weapon)).toBe(true);
    const out=realCraft(sim,'recipe_eastbrook_arming_sword');
    expect(out.ok).toBe(true);
    expect(meta.craftSkills.weaponcrafting).toBe(24);
    expect(sim.countItem('eastbrook_arming_sword',pid)).toBe(1);
    const p=sim.highflySmithPilotStatus()!;
    expect(p.weaponcrafting.xp).toBe(1500);
    expect(p.weaponcrafting.proofs).toBe(1);
    expect(p.armorcrafting.enrolled).toBe(false);
    expect(meta.highflyProfessions?.practice?.['recipe:recipe_eastbrook_arming_sword']).toBe(1);
  });

  it('real armor trial progresses separately from weapon and saves both histories',()=>{
    const sim=make(512),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.weaponcrafting=24;
    meta.craftSkills.armorcrafting=24;
    expect(sim.enrollHighflySmithTrialPilot(weapon)).toBe(true);
    expect(sim.enrollHighflySmithTrialPilot(armor)).toBe(true);
    expect(realCraft(sim,'recipe_eastbrook_chain_vest').ok).toBe(true);
    expect(realCraft(sim,'recipe_eastbrook_warded_leggings').ok).toBe(true);
    const s=sim.serializeCharacter(pid)!;
    expect(meta.craftSkills.armorcrafting).toBe(24);
    expect(meta.craftSkills.weaponcrafting).toBe(24);
    expect(s.highflyProfessions?.craftXp?.armorcrafting).toBe(3000);
    expect(s.highflyProfessions?.craftXp?.weaponcrafting).toBeUndefined();
    expect(s.highflyProfessions?.evidence?.['trial.armorcrafting.25.recipe_eastbrook_chain_vest']).toBe(1);
    expect(s.highflyProfessions?.evidence?.['trial.armorcrafting.25.recipe_eastbrook_warded_leggings']).toBe(1);
    const fresh=new Sim({seed:513,playerClass:'warrior',noPlayer:true});
    const newPid=fresh.addPlayer('warrior','Smith Save',{state:s});
    expect(fresh.serializeCharacter(newPid)?.highflyProfessions).toEqual(s.highflyProfessions);
    expect(fresh.serializeCharacter(newPid)?.craftSkills).toEqual(s.craftSkills);
  });

  it('REAL weapon proof pair: learned axe at the forge, claim unlocks 25',()=>{
    const sim=make(514),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.weaponcrafting=24;
    expect(sim.enrollHighflySmithTrialPilot(weapon)).toBe(true);
    meta.highflyProfessions={...meta.highflyProfessions!,craftXp:{weaponcrafting:threshold-100}};
    expect(realCraft(sim,'recipe_eastbrook_arming_sword').ok).toBe(true);
    expect(sim.highflySmithPilotStatus()!.weaponcrafting.ready).toBe(false);
    expect(realCraft(sim,'recipe_copper_bearded_axe').ok).toBe(true);
    expect(sim.highflySmithPilotStatus()!.weaponcrafting.ready).toBe(true);
    expect(meta.craftSkills.weaponcrafting).toBe(24);
    expect(sim.claimHighflySmithTrialPilot(weapon)).toBe(true);
    expect(sim.claimHighflySmithTrialPilot(weapon)).toBe(false);
    expect(realCraft(sim,'recipe_eastbrook_arming_sword').ok).toBe(true);
    expect(meta.craftSkills.weaponcrafting).toBe(25);
    expect(sim.highflySmithPilotStatus()!.weaponcrafting.completed).toBe(true);
  });

  it('unenrolled existing character still gains original raw craft skill',()=>{
    const sim=make(515),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.weaponcrafting=24;
    expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
    expect(realCraft(sim,'recipe_eastbrook_arming_sword').ok).toBe(true);
    expect(meta.craftSkills.weaponcrafting).toBe(25);
    expect(sim.serializeCharacter(pid)?.highflyProfessions?.trialTracks).toBeUndefined();
  });

  it('failed Smith craft and unrelated recipes add NO Smith proof',()=>{
    const sim=make(516),pid=sim.playerId,meta=sim.players.get(pid) as PlayerMeta;
    meta.craftSkills.weaponcrafting=24;
    expect(sim.enrollHighflySmithTrialPilot(weapon)).toBe(true);
    const fail=resolveCraft(sim.ctx,pid,'recipe_eastbrook_arming_sword');
    expect(fail.ok).toBe(false);
    expect(sim.highflySmithPilotStatus()!.weaponcrafting.proofs).toBe(0);
    expect(meta.highflyProfessions?.craftXp?.weaponcrafting).toBeUndefined();
  });

  it('rare crafted Smith battlefield trickle cannot bypass an enrolled cap',()=>{
    const career=smithPilotEnroll(undefined,weapon,24)!;
    const skills={weaponcrafting:24};
    const obs={
      itemId:'eastbrook_arming_sword',
      instance:{signer:'Smith',rolled:{quality:'rare'}},
      observerName:'Smith',observerActiveArchetype:weapon,
    };
    expect(battlefieldExperienceTrickle(skills,obs,career)).toBe(0);
    expect(skills.weaponcrafting).toBe(24);
    expect(battlefieldExperienceTrickle(skills,obs)).toBe(0.25);
    expect(skills.weaponcrafting).toBe(24.25);
  });
});
