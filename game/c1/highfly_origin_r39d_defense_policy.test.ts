import {describe,it,expect} from 'vitest';
import {r39DDefenseCue,type R39DDefenseInput} from '../src/sim/highfly_origin_r39d_defense_policy';
const base:R39DDefenseInput={action:'parry',acceptedBySim:true,alive:true,interrupted:false,staminaAvailable:true,attackTelegraphMs:300,impactDeltaMs:60};
describe('R39D defensive presentation policy',()=>{
  it('rejects unaccepted, dead, interrupted or unpaid defensive actions',()=>{
    expect(r39DDefenseCue({...base,acceptedBySim:false})).toBeNull();
    expect(r39DDefenseCue({...base,alive:false})).toBeNull();
    expect(r39DDefenseCue({...base,interrupted:true})).toBeNull();
    expect(r39DDefenseCue({...base,staminaAvailable:false})).toBeNull();
  });
  it('enforces conservative timing windows without granting invulnerability',()=>{
    expect(r39DDefenseCue({...base,action:'perfect-dodge',impactDeltaMs:180})?.cue).toBe('highfly_defense_perfect_dodge');
    expect(r39DDefenseCue({...base,action:'perfect-dodge',impactDeltaMs:181})).toBeNull();
    expect(r39DDefenseCue({...base,action:'parry',impactDeltaMs:120})?.cue).toBe('highfly_defense_parry');
    expect(r39DDefenseCue({...base,action:'parry',impactDeltaMs:121})).toBeNull();
    expect(r39DDefenseCue({...base,impactDeltaMs:NaN})).toBeNull();
  });
  it('never presents a break without authoritative guard-break confirmation',()=>{
    expect(r39DDefenseCue({...base,action:'break'})).toBeNull();
    expect(r39DDefenseCue({...base,action:'break',targetGuardBroken:true})?.cue).toBe('highfly_defense_break');
  });
});
