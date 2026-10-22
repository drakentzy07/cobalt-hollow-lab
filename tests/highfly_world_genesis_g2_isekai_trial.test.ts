import {describe,it,expect} from 'vitest';
import {newG2TrialQuest,advanceG2TrialQuest,G2_TRIAL_STATUS,G2_EXPERIMENTAL_SKILLS} from '../src/highfly/world_genesis/g2_isekai_trial';

describe('G2 premium Isekai preview progression (no production mutations)',()=>{
 it('spawns one classless universal Hunter quest at the blacksmith',()=>{
  const q=newG2TrialQuest();
  expect(q.hunter).toBe('universal');expect(q.phase).toBe('meet_smith');
  expect(q.trialWeaponGranted).toBe(false);
  expect(JSON.stringify(q)).not.toMatch(/classId|roleId|mageId|warriorId/);
 });
 it('requires blacksmith -> native wolf -> return before completion',()=>{
  let q=newG2TrialQuest();
  expect(advanceG2TrialQuest(q,{type:'native_wolf_defeated',monsterId:'forest_wolf'})).toEqual(q);
  q=advanceG2TrialQuest(q,{type:'blacksmith_used'});
  expect(q.phase).toBe('hunt_wolf');expect(q.trialWeaponGranted).toBe(true);
  expect(advanceG2TrialQuest(q,{type:'blacksmith_used'})).toEqual(q);
  q=advanceG2TrialQuest(q,{type:'native_wolf_defeated',monsterId:'forest_wolf'});
  expect(q.phase).toBe('return_to_smith');
  q=advanceG2TrialQuest(q,{type:'blacksmith_used'});
  expect(q.phase).toBe('complete');expect(q.completed).toBe(true);
  expect(advanceG2TrialQuest(q,{type:'blacksmith_used'})).toEqual(q);
 });
 it('reset is explicitly preview-only and does not touch saved Hunter',()=>{
  const done=advanceG2TrialQuest(advanceG2TrialQuest(newG2TrialQuest(),{type:'blacksmith_used'}),{type:'native_wolf_defeated',monsterId:'forest_wolf'});
  const reset=advanceG2TrialQuest(done,{type:'reset_preview'});
  expect(reset).toEqual(newG2TrialQuest());
  expect(G2_TRIAL_STATUS.originalSavesWritten).toBe(false);
  expect(G2_TRIAL_STATUS.nativeCombatBound).toBe(false);
  expect(G2_TRIAL_STATUS.realKaykitRig).toBe(false);
  expect(G2_TRIAL_STATUS.originalUnityTerrainLoaded).toBe(false);
 });
 it('keeps four prototype actions visibly distinct from native Sim bindings',()=>{
  expect(G2_EXPERIMENTAL_SKILLS.map(x=>x.slot)).toEqual([1,2,3,4]);
  expect(new Set(G2_EXPERIMENTAL_SKILLS.map(x=>x.intent)).size).toBe(4);
 });
});
