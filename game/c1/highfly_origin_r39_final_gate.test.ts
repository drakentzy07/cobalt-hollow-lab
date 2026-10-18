import {describe,it,expect} from 'vitest';
import {r39C3AcceptedMotion} from '../src/sim/highfly_origin_r39c3_motion_policy';
import {r39FDefensePresentation} from '../src/sim/highfly_origin_r39f_defense_runtime_bridge';
const state={onGround:true,vy:0,horizontalSpeed:2,dead:false,swimming:false};
const defense={source:'sim' as const,simTick:42,acceptedBySim:true,defense:{action:'perfect-dodge' as const,acceptedBySim:true,alive:true,interrupted:false,staminaAvailable:true,attackTelegraphMs:300,impactDeltaMs:100}};
describe('R39 FINAL safety gate (not a gameplay E2E certificate)',()=>{
 it('never animates an unaccepted attack',()=>expect(r39C3AcceptedMotion(1,state,false,true)).toBeNull());
 it('preserves elemental fourth hit gating',()=>expect(r39C3AcceptedMotion(4,state,true,false)).toBeNull());
 it('selects running context only after Sim accepted',()=>expect(r39C3AcceptedMotion(1,state,true,true)?.context).toBe('running'));
 it('rejects interrupted defense',()=>expect(r39FDefensePresentation({...defense,defense:{...defense.defense,interrupted:true}})).toBeNull());
 it('requires authoritative acceptance',()=>expect(r39FDefensePresentation({...defense,acceptedBySim:false})).toBeNull());
});
