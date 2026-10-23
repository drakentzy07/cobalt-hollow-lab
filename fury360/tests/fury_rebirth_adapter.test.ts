import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FuryRebirthAdapter} from '../src/rebirth_adapter.ts';
import type {FuryNativeAbility} from '../src/native_visual_registry.ts';
import type {FuryGroundPreview} from '../src/skill_preview.ts';
import type {FuryAimResult} from '../src/fury_core.ts';
const meteor:FuryNativeAbility={id:'meteor',class:'mage',requiresTarget:false,
  targetMode:'position',range:25,effects:[{type:'groundAoE',radius:5}]};
const locked:FuryNativeAbility={id:'shadow_bolt',class:'warlock',requiresTarget:true,
  targetType:'enemy',range:30};
const basic=()=>({kind:'basic' as const,gate:{kind:'basic' as const,
    nativeAllowed:true,stunned:false,airborne:false,moving:true,
    allowAirborne:false,allowMovement:true},
  cancelOpensMs:240,durationMs:490,bufferMs:180,allowCancelPrevious:true});
function makeHost(){
  const sent:FuryAimResult[]=[];
  const previews:(FuryGroundPreview|null)[]=[];
  const played:number[]=[];
  let attackCalls=0;
  let allowBasic=true;
  let origin={player:{x:0,z:0},cameraYaw:0};
  const nativeSkills=new Map<string,FuryNativeAbility>([
    ['meteor',meteor],['shadow_bolt',locked],
  ]);
  const host={
    readContext:()=>origin,
    findKnownAbility:(id:string)=>nativeSkills.get(id)??null,
    tryNativeSkill:(i:FuryAimResult)=>{sent.push(i);return true;},
    tryNativeBasicAttack:()=>{attackCalls++;return true;},
    nativeBasicAttackAllowed:()=>allowBasic,
    renderGroundPreview:(p:FuryGroundPreview|null)=>previews.push(p),
    acceptedCombatCue:(a:{comboStep:number})=>played.push(a.comboStep),
  };
  return {host,sent,previews,played,attackCalls:()=>attackCalls,
    setBasic:(v:boolean)=>{allowBasic=v;},
    movePlayer:(x:number,z:number)=>{origin={player:{x,z},cameraYaw:0};},
    forget:(id:string)=>nativeSkills.delete(id)};
}
test('adapter sends only native learned area casts, no phantom input on drag/cancel',()=>{
  const s=makeHost();const bridge=new FuryRebirthAdapter(s.host);
  assert.equal(bridge.beginNativeSkill(17,'meteor',{x:800,y:500}),true);
  assert.ok(s.previews.at(-1)?.fill.length);
  assert.equal(bridge.moveNativeSkill(17,{x:900,y:380}),true);
  assert.equal(s.sent.length,0);
  assert.equal(bridge.cancelNativeSkill(17),true);
  assert.equal(s.sent.length,0);
  assert.equal(s.previews.at(-1),null);
  assert.equal(bridge.beginNativeSkill(17,'shadow_bolt',{x:800,y:500}),false);
  assert.equal(bridge.beginNativeSkill(17,'unknown-ability',{x:800,y:500}),false);
  bridge.dispose();
});
test('adapter updates skill indicator with player moving and emits native cast once',()=>{
  const s=makeHost();const bridge=new FuryRebirthAdapter(s.host);
  bridge.beginNativeSkill(9,'meteor',{x:600,y:500});
  s.movePlayer(20,30);
  bridge.moveNativeSkill(9,{x:600,y:400});
  assert.equal(s.previews.at(-1)?.center.x,20);
  assert.equal(bridge.releaseNativeSkill(9,{x:600,y:400}),'native-accepted');
  assert.equal(s.sent.length,1);
  assert.equal(s.sent[0].world.x,20);
  assert.equal(bridge.releaseNativeSkill(9,{x:600,y:400}),'ignored');
  bridge.dispose();
});
test('native ability can be lost during aim: release is rejected, no cast performed',()=>{
  const s=makeHost();const bridge=new FuryRebirthAdapter(s.host);
  bridge.beginNativeSkill(9,'meteor',{x:600,y:500});
  s.forget('meteor');
  assert.equal(bridge.releaseNativeSkill(9,{x:600,y:400}),'native-rejected');
  assert.equal(s.sent.length,0);
});
test('basic attack is manual, buffered combo requires native authorization',()=>{
  const s=makeHost();const bridge=new FuryRebirthAdapter(s.host);
  assert.equal(s.attackCalls(),0);
  assert.equal(bridge.pressBasicAttack(100,basic()),'native-accepted');
  assert.equal(s.attackCalls(),1);
  assert.deepEqual(s.played,[1]);
  assert.equal(bridge.pressBasicAttack(290,basic()),'buffered');
  s.setBasic(false);
  assert.equal(bridge.pumpCombat(341),'native-rejected');
  assert.equal(s.attackCalls(),1);
  assert.deepEqual(s.played,[1]);
  bridge.reset();bridge.dispose();
});
test('blocked GOLDEN movement stays stopped and there is no second mover',()=>{
  const s=makeHost();const bridge=new FuryRebirthAdapter(s.host);
  const golden={worldX:0.5,worldZ:0.5,analog:0.7,facing:0.785398};
  assert.ok(bridge.sampleGoldenMovement(golden,false));
  assert.equal(bridge.sampleGoldenMovement(golden,true),null);
  bridge.dispose();
});
