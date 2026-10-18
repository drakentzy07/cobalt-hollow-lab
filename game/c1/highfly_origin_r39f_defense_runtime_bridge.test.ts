import {describe,it,expect} from 'vitest';
import {r39FDefensePresentation,type R39FAuthoritativeDefenseEvent} from '../src/sim/highfly_origin_r39f_defense_runtime_bridge';
const event:R39FAuthoritativeDefenseEvent={source:'sim',simTick:17,acceptedBySim:true,defense:{action:'parry',acceptedBySim:true,alive:true,interrupted:false,staminaAvailable:true,attackTelegraphMs:250,impactDeltaMs:60}};
describe('R39F authoritative defense presentation bridge',()=>{
  it('accepts a confirmed and timely parry cue',()=>expect(r39FDefensePresentation(event)?.cue).toBe('highfly_defense_parry'));
  it('never renders a rejected action',()=>expect(r39FDefensePresentation({...event,acceptedBySim:false})).toBeNull());
  it('rejects non-sim source and invalid tick',()=>{
    expect(r39FDefensePresentation({...event,source:'client' as 'sim'})).toBeNull();
    expect(r39FDefensePresentation({...event,simTick:-1})).toBeNull();
  });
  it('requires actual guard-break proof',()=>{
    expect(r39FDefensePresentation({...event,defense:{...event.defense,action:'break'}})).toBeNull();
    expect(r39FDefensePresentation({...event,defense:{...event.defense,action:'break',targetGuardBroken:true}})?.cue).toBe('highfly_defense_break');
  });
});
