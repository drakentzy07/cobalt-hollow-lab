import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FurySkillTouchController} from '../src/skill_gestures.ts';
import {makeFurySkillPreview,raiseFuryPreview} from '../src/skill_preview.ts';
import type {FurySkillVisualSpec} from '../src/skill_preview.ts';

const origin={x:0,z:0};
const context={player:origin,cameraYaw:0};
const spec=(shape:FurySkillVisualSpec['shape']):FurySkillVisualSpec =>
  ({abilityId:'native-action',shape,range:18,width:2,radius:3,coneDegrees:60});
const aim=(shape:FurySkillVisualSpec['shape']) =>
  ({abilityId:'native-action',shape,world:{x:0,z:12},facing:0,distance:12,isTap:false});

test('telegraphs support all 9 skill shapes and finite closed outlines',()=>{
  for(const shape of ['line','cone','circle','rectangle','triangle','leap','dash','target','self'] as const){
    const a=shape==='self'?{...aim(shape),distance:0,world:origin}:aim(shape);
    const g=makeFurySkillPreview(origin,a,spec(shape));
    assert.ok(g,shape);
    assert.ok(g!.fill.length>=3,shape);
    assert.deepEqual(g!.outline[0],g!.outline[g!.outline.length-1]);
    for(const pt of g!.outline) assert.ok(Number.isFinite(pt.x)&&Number.isFinite(pt.z));
  }
});
test('circle / leap landing ring remains at actual landing point and matches radius',()=>{
  const g=makeFurySkillPreview(origin,aim('leap'),spec('leap'))!;
  assert.deepEqual(g.center,{x:0,z:12});
  for(const p of g.fill) assert.ok(Math.abs(Math.hypot(p.x,p.z-12)-3)<1e-7);
});
test('line preview is a rectangular hit corridor oriented toward aimed point',()=>{
  const g=makeFurySkillPreview(origin,aim('line'),spec('line'))!;
  assert.equal(g.fill.length,4);
  assert.equal(g.trajectory.length,2);
  assert.deepEqual(g.trajectory[1],{x:0,z:12});
  assert.ok(g.fill.every(p=>Math.abs(p.x)===1));
});
test('uneven world height is projected without changing simulation or hit rules',()=>{
  const g=makeFurySkillPreview(origin,aim('cone'),spec('cone'))!;
  const raised=raiseFuryPreview(g,(x,z)=>2+x*0.1+z*0.05)!;
  assert.equal(raised.fill.length,g.fill.length);
  assert.ok(raised.fill.every(p=>Math.abs(p.y-(2+p.x*0.1+p.z*0.05+0.06))<1e-9));
  assert.equal(raiseFuryPreview(g,()=>NaN),null);
});
test('reject invalid metadata rather than showing misleading telegraph',()=>{
  assert.equal(makeFurySkillPreview(origin,{...aim('circle'),distance:25},spec('circle')),null);
  assert.equal(makeFurySkillPreview(origin,aim('line'),spec('circle')),null);
  assert.equal(makeFurySkillPreview(origin,aim('line'),{...spec('line'),range:NaN}),null);
});
test('pointer-release skill cast is emitted once, and tracks player current position',()=>{
  const calls:any[]=[];
  const shown:any[]=[];
  const ctl=new FurySkillTouchController({attemptNativeCast:(i)=>{calls.push(i);return true;},
    showPreview:f=>shown.push(f)});
  assert.equal(ctl.begin(11,spec('circle'),{x:500,y:300},context),true);
  assert.equal(ctl.begin(12,spec('line'),{x:500,y:300},context),false);
  assert.equal(ctl.update(12,{x:600,y:200},context),null); // another finger moves joystick freely
  const moved={player:{x:8,z:9},cameraYaw:0};
  const f=ctl.update(11,{x:500,y:150},moved)!;
  assert.equal(f.geometry!.trajectory[0].x,8);
  assert.ok(f.geometry!.center.z>9);
  assert.equal(ctl.release(11,{x:500,y:150},moved),'native-accepted');
  assert.equal(calls.length,1);
  assert.equal(calls[0].abilityId,'native-action');
  assert.equal(calls[0].world.x,8);
  assert.equal(ctl.release(11,{x:500,y:150},moved),'ignored');
  assert.equal(shown[shown.length-1],null);
});
test('cancellation drop zone prevents native cast and avoids resource consumption',()=>{
  let castCount=0;
  const c=new FurySkillTouchController({attemptNativeCast:()=>{castCount++;return true;}});
  c.begin(3,spec('line'),{x:300,y:300},context,
    {cancelZone:{center:{x:420,y:220},radiusPx:35}});
  assert.equal(c.update(3,{x:420,y:220},context)!.cancelled,true);
  assert.equal(c.release(3,{x:420,y:220},context),'cancelled');
  assert.equal(castCount,0);
  assert.equal(c.aiming,false);
});
test('pointercancel, window blur and native rejection keep native authority',()=>{
  let count=0;
  const c=new FurySkillTouchController({attemptNativeCast:()=>{count++;return false;}});
  c.begin(2,spec('dash'),{x:300,y:300},context);
  assert.equal(c.cancel(8),false);
  assert.equal(c.cancel(2),true);
  assert.equal(count,0);
  c.begin(2,spec('dash'),{x:300,y:300},context);
  c.reset();
  assert.equal(c.release(2,{x:300,y:300},context),'ignored');
  c.begin(2,spec('dash'),{x:300,y:300},context);
  assert.equal(c.release(2,{x:300,y:300},context),'native-rejected');
  assert.equal(count,1);
});
test('right-hand skill pointer leaves free simultaneous camera/movement thumbs untouched',()=>{
  let calls=0;
  const c=new FurySkillTouchController({attemptNativeCast:()=>{calls++;return true;}});
  assert.equal(c.begin(201,spec('cone'),{x:900,y:600},context),true);
  assert.equal(c.update(100,{x:80,y:700},context),null);
  assert.equal(c.cancel(100),false);
  assert.equal(c.update(202,{x:1100,y:540},context),null);
  assert.equal(c.release(201,{x:960,y:450},context),'native-accepted');
  assert.equal(calls,1);
});
