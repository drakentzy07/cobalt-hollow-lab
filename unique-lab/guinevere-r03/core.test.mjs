import test from 'node:test';
import assert from 'node:assert/strict';
import {UniqueGuinevereLab as Lab,RULES,segmentCircle,firstContact,normalize} from './core.mjs';
const actor=()=>new Lab({targets:[{id:'a',pos:{x:5,z:0},hp:2000},{id:'b',pos:{x:8,z:0},hp:2000},{id:'boss',pos:{x:0,z:7},hp:8000,kind:'boss',poise:100}],obstacles:[]});
const count=(g,type)=>g.events.filter(e=>e.type===type).length;
const evt=(g,type)=>g.events.filter(e=>e.type===type);
const move=(g,seconds)=>{for(let t=0;t<seconds-1e-8;t+=.1)g.step(Math.min(.1,seconds-t));};

test('geometry: no movement normal is rejected',()=>assert.equal(normalize({x:0,z:0}),null));
test('geometry: swept segment contact between frames',()=>assert.ok(segmentCircle({x:0,z:0},{x:10,z:0},{x:5,z:.25},.5)!==null));
test('geometry: first contact, not closest to endpoint',()=>assert.equal(firstContact({x:0,z:0},{x:20,z:0},[
  {id:'late',pos:{x:16,z:0},radius:.5},{id:'early',pos:{x:5,z:0},radius:.5}],.5).id,'early'));
test('geometry: deterministic tie-break by stable id',()=>assert.equal(firstContact({x:0,z:0},{x:10,z:0},[
  {id:'b',pos:{x:4,z:0}},{id:'a',pos:{x:4,z:0}}],.5).id,'a'));
test('geometry: misses off-axis target',()=>assert.equal(segmentCircle({x:0,z:0},{x:10,z:0},{x:5,z:3},.5),null));
test('targets: invalid target rejected',()=>assert.throws(()=>new Lab({targets:[{id:'a',pos:{x:0,z:0},hp:-1}]}),/INVALID_TARGET/));

test('U1: manual direction and physical hit',()=>{
  const g=actor();assert.equal(g.castU1({x:1,z:0}).ok,true);move(g,.35);
  assert.equal(evt(g,'damage')[0].target,'a');assert.equal(evt(g,'damage')[0].skill,'U1');assert.equal(count(g,'mark'),1);
});
test('U1: blocked by obstacle prevents damage and refund',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:9,z:0},hp:1000}],obstacles:[{id:'rock',pos:{x:4,z:0},radius:1}]});
  g.castU1({x:1,z:0});move(g,.5);assert.equal(count(g,'projectile_blocked'),1);
  assert.equal(count(g,'damage'),0);assert.equal(count(g,'cooldown_refund'),0);
});
test('U1: missed projectile has no damage/refund',()=>{
  const g=actor();g.castU1({x:0,z:-1});move(g,1);assert.equal(count(g,'projectile_miss'),1);assert.equal(count(g,'damage'),0);
});
test('U1: cooldown and MP admission',()=>{
  const g=actor();const mp=g.player.mp;assert.equal(g.castU1({x:1,z:0}).ok,true);
  assert.ok(g.player.mp<mp);move(g,.2);assert.equal(g.castU1({x:1,z:0}).reason,'COOLDOWN');
  g.cd.U1=0;g.player.mp=0;assert.equal(g.castU1({x:1,z:0}).reason,'MANA');
});
test('U1: on-hit cooldown refund only once',()=>{
  const g=actor();g.cd.U2=100;g.castU1({x:1,z:0});move(g,.5);
  assert.equal(count(g,'cooldown_refund'),1);assert.ok(Math.abs(g.cd.U2-99.4)<.0001);
});
test('U1: applies slow 1.6 seconds and mark 5 seconds',()=>{
  const g=actor();g.castU1({x:1,z:0});move(g,.4);
  assert.equal(g.targets.get('a').marks,1);assert.equal(g.targets.get('a').slowMult,RULES.U1.slow);
  move(g,2);assert.equal(g.targets.get('a').slowMult,1);
  move(g,3.1);assert.equal(g.targets.get('a').marks,0);
});
test('U1: targets behind are not hit',()=>{
  const g=new Lab({targets:[{id:'behind',pos:{x:-5,z:0},hp:1000}],obstacles:[]});g.castU1({x:1,z:0});move(g,1);
  assert.equal(count(g,'damage'),0);
});
test('U1: no aim never spends resources',()=>{
  const g=actor(),before=g.player.mp;assert.equal(g.castU1({x:0,z:0}).reason,'BAD_DIRECTION');assert.equal(g.player.mp,before);
});
test('U1: cancel preview spends neither MP nor CD',()=>{
  const g=actor(),mp=g.player.mp;g.cancelPreview('U1');assert.equal(g.player.mp,mp);assert.equal(g.cd.U1,0);assert.equal(count(g,'aim_cancel'),1);
});

test('U2: leap lands at targeted destination, hits in area, launches',()=>{
  const g=actor();assert.equal(g.castU2({x:4,z:0}).ok,true);move(g,.42);
  assert.ok(Math.abs(g.player.pos.x-4)<1e-6);assert.equal(count(g,'leap_land'),1);
  assert.ok(g.targets.get('a').airborneUntil>g.time);assert.equal(g.targets.get('a').marks,2);
});
test('U2: leap is animated in time, not instant teleport',()=>{
  const g=actor();g.castU2({x:4,z:0});move(g,.2);assert.equal(g.player.pos.x,0);assert.ok(g.pendingLeap);
});
test('U2: cannot jump through wall',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:7,z:0},hp:1000}],obstacles:[{id:'pillar',pos:{x:3,z:0},radius:1}]});
  const mp=g.player.mp;assert.equal(g.castU2({x:6,z:0}).reason,'WALL');assert.equal(g.player.mp,mp);
});
test('U2: cannot jump farther than range',()=>assert.equal(actor().castU2({x:10,z:0}).reason,'OUT_OF_RANGE'));
test('U2: recast window + echo detonation + damage',()=>{
  const g=actor();g.castU2({x:4,z:0});move(g,.45);assert.ok(g.canRecast);
  assert.equal(g.recastU2({x:1,z:0}).ok,true);assert.equal(g.echoes.length,1);
  move(g,1.6);assert.equal(count(g,'echo_detonate'),1);assert.ok(evt(g,'damage').some(e=>e.tag==='echo'));
});
test('U2: recast cannot be used twice',()=>{
  const g=actor();g.castU2({x:4,z:0});move(g,.45);g.recastU2({x:1,z:0});assert.equal(g.recastU2({x:1,z:0}).reason,'NO_RECAST');
});
test('U2: expires if not used',()=>{
  const g=actor();g.castU2({x:4,z:0});move(g,5.2);assert.equal(g.canRecast,false);assert.equal(count(g,'recast_expire'),1);
});
test('U2: boss cannot airborne; takes poise damage',()=>{
  const g=actor();g.castU2({x:0,z:6});move(g,.5);
  assert.equal(g.targets.get('boss').airborneUntil,0);assert.ok(count(g,'boss_poise')>=1);
});
test('U2: blink must not pass through wall',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:5,z:0},hp:1000}],obstacles:[{id:'ob',pos:{x:7,z:0},radius:1}]});
  g.castU2({x:4,z:0});move(g,.45);assert.equal(g.recastU2({x:1,z:0}).reason,'WALL');assert.ok(g.canRecast);
});

test('U3: precisely eleven authoritative ticks',()=>{
  const g=actor();g.castU3();move(g,2.2);assert.equal(count(g,'ultimate_tick'),11);
  const tickDmg=evt(g,'damage').filter(e=>e.skill==='U3');assert.equal(tickDmg.length,0); // no enemies in radius
  assert.equal(count(g,'ultimate_end'),1);
});
test('U3: exactly 11 real hit events per target within range',()=>{
  const g=new Lab({targets:[{id:'near',pos:{x:2,z:0},hp:2000}],obstacles:[]});g.castU3();move(g,2.2);
  assert.equal(evt(g,'damage').filter(e=>e.skill==='U3'&&e.target==='near').length,11);
  assert.ok(Math.abs(g.targets.get('near').hp-(2000-RULES.U3.totalDamage))<.00001);
});
test('U3: executes alone without a prior combo',()=>{
  const g=new Lab({targets:[{id:'near',pos:{x:2,z:0},hp:2000}],obstacles:[]});assert.equal(g.castU3().ok,true);move(g,2.2);
  assert.ok(g.targets.get('near').hp<2000);
});
test('U3: CC immunity active only in channel',()=>{
  const g=actor();g.castU3();assert.equal(g.hitPlayer({control:true}),false);move(g,2.2);
  assert.equal(g.hitPlayer({control:true}),true);
});
test('U3: triple mark consumed and launched',()=>{
  const g=new Lab({targets:[{id:'near',pos:{x:2,z:0},hp:2500}],obstacles:[]});
  const t=g.targets.get('near');t.marks=3;t.markUntil=10;
  g.castU3();move(g,.3);assert.equal(count(g,'mark_consumed'),1);assert.ok(t.airborneUntil>g.time);
});
test('U3: boss fallback never airborne',()=>{
  const g=new Lab({targets:[{id:'raid',pos:{x:2,z:0},hp:8000,kind:'boss',poise:100}],obstacles:[]});
  g.castU3();move(g,2.2);assert.equal(g.targets.get('raid').airborneUntil,0);
  assert.ok(count(g,'boss_poise')>=1);
});
test('U3: refuses second simultaneous channel',()=>{
  const g=actor();g.castU3();assert.equal(g.castU3().reason,'BUSY');assert.equal(g.castU1({x:1,z:0}).reason,'BUSY');
});
test('U3: stays within absolute per-hit damage budget',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:1,z:0},hp:1000},{id:'b',pos:{x:2,z:0},hp:1000}],obstacles:[]});
  g.castU3();move(g,2.2);for(const t of g.targets.values())assert.ok(Math.abs(t.hp-(1000-RULES.U3.totalDamage))<1e-5);
});

test('combo: U2 leap then buffered U3 executes',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:5,z:0},hp:2500}],obstacles:[]});
  g.castU2({x:4,z:0});move(g,.21);assert.equal(g.request('U3').buffered,true);move(g,2.5);
  assert.equal(count(g,'input_dequeued'),1);assert.equal(count(g,'ultimate_tick'),11);
  assert.ok(g.targets.get('a').hp<2500-RULES.U2.damage);
});
test('combo: U1 → U2 → U3 remains independent of marks',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:5,z:0},hp:2400}],obstacles:[]});
  g.castU1({x:1,z:0});move(g,.3);g.castU2({x:4,z:0});move(g,.45);
  assert.equal(g.castU3().ok,true);move(g,2.2);
  assert.ok(g.targets.get('a').hp<2400-300);assert.equal(count(g,'ultimate_tick'),11);
});
test('death: cleanup all temporal combat instances',()=>{
  const g=actor();g.castU1({x:1,z:0});g.hitPlayer({damage:2000});move(g,.2);
  assert.equal(g.projectiles.length,0);assert.equal(g.player.dead,true);
  assert.equal(g.castU3().reason,'DEAD');
});
test('reset: clears marks, cost, cooldown, effects, status',()=>{
  const g=actor();g.castU1({x:1,z:0});move(g,.3);g.reset();assert.equal(g.time,0);assert.equal(g.cd.U1,0);
  assert.equal(g.targets.get('a').marks,0);assert.equal(g.projectiles.length,0);
});
test('render frame variance: deterministic enough for impact and hit count',()=>{
  const make=()=>new Lab({targets:[{id:'a',pos:{x:5,z:0},hp:2500}],obstacles:[]});
  const a=make(),b=make();a.castU3();b.castU3();for(let i=0;i<132;i++)a.step(1/60);for(let i=0;i<44;i++)b.step(1/20);
  assert.equal(count(a,'ultimate_tick'),11);assert.equal(count(b,'ultimate_tick'),11);
  assert.ok(Math.abs(a.targets.get('a').hp-b.targets.get('a').hp)<.00001);
});
test('target dies mid channel: no further hit events on dead target',()=>{
  const g=new Lab({targets:[{id:'a',pos:{x:2,z:0},hp:50}],obstacles:[]});
  g.castU3();move(g,2.2);assert.equal(count(g,'death'),1);assert.equal(evt(g,'damage').filter(e=>e.target==='a').length,2);
});
test('invalid dt is refused',()=>assert.throws(()=>actor().step(NaN),/INVALID_DT/));
test('safety: no basic attack auto generated at idle',()=>{
  const g=actor();move(g,4);assert.equal(count(g,'damage'),0);assert.equal(count(g,'cast'),0);
});
