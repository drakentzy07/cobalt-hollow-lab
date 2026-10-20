import {describe,it,expect} from 'vitest';
import {highflyF263AssistAim} from '../src/highfly/combat/f263_assisted_aim';
describe('F2.6.3 Fireball subtle assistance',()=>{
 const p={x:0,z:0},aim={x:0,z:20},targets=[
  {id:2,pos:{x:2,z:16}},{id:3,pos:{x:6,z:12}}];
 it('corrects only a plausible near miss and uses a static launch position',()=>{
  const a=highflyF263AssistAim(p,aim,targets,()=>true,30);
  expect(a).toEqual({point:targets[0].pos,assistedId:2});
 });
 it('cannot magnetize an obviously wide shot',()=>{
  const a=highflyF263AssistAim(p,{x:20,z:0},targets,()=>true,30);
  expect(a.assistedId).toBeNull();
 });
 it('never considers behind or beyond range and respects hostile filtering',()=>{
  const distant=[{id:1,pos:{x:0,z:-2}},{id:2,pos:{x:0,z:25}},{id:3,pos:{x:1,z:12}}];
  expect(highflyF263AssistAim(p,aim,distant,t=>t.id===3,30).assistedId).toBe(3);
  expect(highflyF263AssistAim(p,aim,distant,t=>t.id!==3,30).assistedId).toBeNull();
 });
 it('preserves exact aim if no candidate nearby',()=>{
  expect(highflyF263AssistAim(p,aim,[],()=>true,30).point).toEqual(aim);
 });
});
