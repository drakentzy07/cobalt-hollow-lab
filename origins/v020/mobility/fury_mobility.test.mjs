import test from 'node:test';
import assert from 'node:assert/strict';
// Pure test loads a JS version via TypeScript stripping supported by Node 22.
import { FuryMobility } from './fury_mobility.ts';
const near=(a,b,eps=.01)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
test('dash uses analog direction; costs energy; cannot spam cooldown',()=>{
 const machine=new FuryMobility(),p={onGround:true,jumping:false,facing:0};
 machine.update(p,{},.05);
 const first=machine.update(p,{furyDashSeq:1,analogWorldX:-.6,analogWorldZ:.8},.05);
 assert.ok(first.dash);near(first.dash.x,-.6);near(first.dash.z,.8);assert.ok(first.energy<80);
 const second=machine.update(p,{furyDashSeq:2,analogWorldX:1,analogWorldZ:0},.05);
 near(second.dash.x,-.6);assert.ok(second.energy>first.energy);
});
test('second air press gets one double jump, not infinite jump',()=>{
 const machine=new FuryMobility(),p={onGround:true,jumping:false,facing:1.2};
 machine.update(p,{furyJumpSeq:0},.05);
 machine.update(p,{furyJumpSeq:1},.05);
 p.onGround=false;p.jumping=true;
 const a=machine.update(p,{furyJumpSeq:2},.05);assert.equal(a.doubleJump,true);near(a.secondJumpDirection,1.2);
 assert.equal(machine.update(p,{furyJumpSeq:3},.05).doubleJump,false);
 p.onGround=true;p.jumping=false;machine.update(p,{furyJumpSeq:3},.05);
 p.onGround=false;p.jumping=true;machine.update(p,{furyJumpSeq:3},.05);
 assert.equal(machine.update(p,{furyJumpSeq:4},.05).doubleJump,true);
});
test('blocked movement prevents dash and second jump',()=>{
 const f=new FuryMobility(),p={onGround:true,jumping:false,facing:0};
 f.update(p,{furyJumpSeq:0},.05);
 f.update(p,{furyJumpSeq:1},.05);
 p.onGround=false;p.jumping=true;
 assert.equal(f.update(p,{furyJumpSeq:2,furyDashSeq:1},.05,true).doubleJump,false);
 assert.equal(f.update(p,{},.05,true).dash,null);
});
