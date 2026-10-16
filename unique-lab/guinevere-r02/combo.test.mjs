import test from 'node:test';
import assert from 'node:assert/strict';
import {UniqueGuinevereLab as Lab,RULES} from './core.mjs';
const advance=(g,t)=>{let n=Math.ceil(t*120);for(let i=0;i<n;i++)g.step(1/120);};
const enemy=()=>new Lab({targets:[{id:'enemy',pos:{x:5,z:0},hp:2000,radius:.5}],obstacles:[]});
const events=(g,type)=>g.events.filter(e=>e.type===type);

test('R02 cooldowns are explicitly lab tuned and nonzero',()=>{
  assert.deepEqual([RULES.U1.cd,RULES.U2.cd,RULES.U3.cd],[4.4,15,40]);
  assert.ok(RULES.U2.recastSec>=RULES.U3.duration);
});
test('U1 locks out duplicate animation overlap but accepts buffered U2',()=>{
  const g=enemy();assert.equal(g.request('U1',{x:1,z:0}).ok,true);
  const buffered=g.request('U2',{x:4,z:0});assert.equal(buffered.buffered,true);
  assert.equal(events(g,'cast').length,1);advance(g,.19);
  assert.equal(events(g,'cast').length,2);
  assert.equal(events(g,'cast')[1].skill,'U2');
});
test('U1 -> U2 -> U3: full combo with 3 marks and 11 hits',()=>{
  const g=enemy();g.request('U1',{x:1,z:0});advance(g,.35);assert.equal(g.targets.get('enemy').marks,1);
  g.request('U2',{x:4.2,z:0});
  const buffered=g.request('U3');assert.equal(buffered.buffered,true);
  advance(g,.47);
  assert.equal(g.targets.get('enemy').marks,3);
  assert.equal(events(g,'cast').filter(e=>e.skill==='U3').length,1);
  advance(g,2.1);
  assert.equal(events(g,'ultimate_tick').length,11);
  assert.equal(events(g,'damage').filter(e=>e.skill==='U3').length,11);
  assert.equal(events(g,'ultimate_end').length,1);
});
test('early U3 press during leap queues until exact landing',()=>{
  const g=enemy();g.request('U2',{x:4,z:0});g.request('U3');advance(g,.40);
  assert.equal(events(g,'cast').filter(e=>e.skill==='U3').length,0);
  advance(g,.03);assert.equal(events(g,'cast').filter(e=>e.skill==='U3').length,1);
});
test('queued U3 refuses if insufficient MP at landing; no double deduction',()=>{
  const g=enemy();g.player.mp=RULES.U2.cost+RULES.U3.cost-15;g.request('U2',{x:4,z:0});g.request('U3');
  advance(g,.5);assert.equal(events(g,'cast').filter(e=>e.skill==='U3').length,0);
  assert.ok(events(g,'refused').some(e=>e.skill==='U3'&&e.reason==='MANA'));
});
test('U2 recast stays available after completing non-prioritized U3 combo',()=>{
  const g=enemy();g.request('U2',{x:4,z:0});g.request('U3');advance(g,2.6);
  assert.equal(g.canRecast,true);assert.equal(g.request('U2',{x:0,z:1}).ok,true);
  assert.equal(events(g,'echo_spawn').length,1);
});
test('U1 CD refund only after confirmed hit and changes U3 cooldown',()=>{
  const g=enemy();g.cd.U3=70;g.request('U1',{x:1,z:0});advance(g,.3);
  assert.ok(g.cd.U3<70);assert.equal(events(g,'cooldown_refund').length,1);
});
test('U3 alone is useful and never requires marks',()=>{
  const g=new Lab({targets:[{id:'close',pos:{x:1,z:0},hp:2000}],obstacles:[]});
  g.request('U3');advance(g,2.2);
  assert.equal(events(g,'damage').filter(e=>e.skill==='U3').length,11);
});
test('boss cannot airborne, but suffers eleven hit attempts',()=>{
  const g=new Lab({targets:[{id:'boss',pos:{x:4,z:0},hp:9000,kind:'boss',poise:350}],obstacles:[]});
  g.request('U2',{x:3.5,z:0});g.request('U3');advance(g,2.6);
  assert.equal(g.targets.get('boss').airborneUntil,0);
  assert.equal(events(g,'damage').filter(e=>e.skill==='U3').length,11);
});
test('U2 collision denial spends nothing, preserving exact combo resources',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:8,z:0},hp:1000}],obstacles:[{id:'ob',pos:{x:2,z:0},radius:1}]});
  const before=g.player.mp;assert.equal(g.request('U2',{x:4,z:0}).reason,'WALL');
  assert.equal(g.player.mp,before);assert.equal(g.cd.U2,0);
});
test('dead caster cancels queued combo and no later damage',()=>{
  const g=enemy();g.request('U2',{x:4,z:0});g.request('U3');g.hitPlayer({damage:3000});advance(g,5);
  assert.equal(events(g,'ultimate_tick').length,0);
  assert.equal(g.player.dead,true);
});
test('all three cooldowns use the same monotonic sim time (no UI authority)',()=>{
  const g=enemy();g.request('U1',{x:1,z:0});const original=g.cd.U1;
  advance(g,.5);assert.ok(g.cd.U1<=original);
  assert.equal(g.available.U1,Math.max(0,g.cd.U1-g.time));
});
