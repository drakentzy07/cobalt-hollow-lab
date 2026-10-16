// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {installOriginAimAndLoadout} from '../src/highfly/highfly_origin_r17_hud';
import {abilityCastSurvivesMovement} from '../src/sim/combat/cast_move_gate';
import type {Entity} from '../src/sim/types';
function ptr(el:Element,type:string,id:number,x:number,y:number){
 const e=new Event(type,{bubbles:true,cancelable:true}) as PointerEvent;
 Object.defineProperties(e,{
  pointerType:{value:'touch'},pointerId:{value:id},
  clientX:{value:x},clientY:{value:y},
  isPrimary:{value:id===11}
 });
 el.dispatchEvent(e);
 return e;
}
function harness(abilityId='fireball'){
 const joystick=document.createElement('div');
 joystick.id='mobile-move-zone';
 const button=document.createElement('button');
 button.className='mobile-action-slot';button.dataset.mobileIndex='0';
 document.body.append(joystick,button);
 const joy={down:0,move:0,up:0};
 joystick.addEventListener('pointerdown',e=>{if((e as PointerEvent).pointerId===11)joy.down++;});
 joystick.addEventListener('pointermove',e=>{if((e as PointerEvent).pointerId===11)joy.move++;});
 joystick.addEventListener('pointerup',e=>{if((e as PointerEvent).pointerId===11)joy.up++;});
 const actor={id:1,kind:'player',dead:false,hostile:false,hp:100,maxHp:100,
  facing:0,targetId:null as number|null,pos:{x:0,y:0,z:0}};
 const enemies=[{id:88,kind:'mob',hostile:true,dead:false,hp:100,maxHp:100,
   pos:{x:0,y:0,z:12}}];
 const cast=vi.fn(),castAt=vi.fn(),target=vi.fn(),face=vi.fn();
 installOriginAimAndLoadout({
   getSlot:slot=>slot===1?abilityId:null,
   setSlot:vi.fn(),castSlot:cast,castAt,
   project:(x,y,z)=>({x:500+x*10,y:260-z*10,behind:false}),
   learned:()=>true,target,
   player:()=>actor,targets:()=>enemies,cameraYaw:()=>0,
   face,scene:new THREE.Scene(),terrain:()=>0,ringSlot:i=>i+1
 });
 return {joystick,button,joy,cast,castAt,target,face};
}
beforeEach(()=>{vi.stubEnv('VITE_HIGHFLY_ORIGIN_PREVIEW','1');document.body.replaceChildren();});
afterEach(()=>{vi.unstubAllEnvs();document.body.replaceChildren();});
describe('R23 real second-thumb pointer path + separated support banks',()=>{
 it('casts a RIGHT-thumb skill while LEFT thumb remains held on moving joystick',()=>{
  const h=harness();
  ptr(h.joystick,'pointerdown',11,100,270);
  ptr(h.joystick,'pointermove',11,105,225);
  ptr(h.button,'pointerdown',22,880,270);
  ptr(h.joystick,'pointermove',11,113,210);
  ptr(h.button,'pointerup',22,880,270);
  ptr(h.joystick,'pointermove',11,119,204);
  expect(h.joy.down).toBe(1);
  expect(h.joy.move).toBe(3);
  // R24A changed fireball to a real free projectile: it must cast at a
  // world point, not use R23's legacy lock-on castSlot path.
  expect(h.castAt).toHaveBeenCalledTimes(1);
  expect(h.castAt).toHaveBeenCalledWith('fireball',{x:0,y:0,z:12});
  expect(h.cast).not.toHaveBeenCalled();
  expect(h.target).not.toHaveBeenCalled();
  expect(h.face).toHaveBeenCalledTimes(1);
 });
 it('independent left joystick pointer continues after skill-first press, and drag remains manual',()=>{
  const h=harness();
  ptr(h.button,'pointerdown',22,850,260);
  ptr(h.joystick,'pointerdown',11,100,270);
  ptr(h.joystick,'pointermove',11,115,240);
  ptr(h.button,'pointermove',22,850,160); // manual UP, target lies forward
  ptr(h.joystick,'pointermove',11,130,220);
  ptr(h.button,'pointerup',22,850,160);
  expect(h.joy.move).toBe(2);
  expect(h.castAt).toHaveBeenCalledTimes(1);
  expect(h.castAt.mock.calls[0][0]).toBe('fireball');
  expect(h.castAt.mock.calls[0][1].z).toBeGreaterThan(0);
  expect(h.cast).not.toHaveBeenCalled();
  expect(h.target).not.toHaveBeenCalled();
  expect(h.face).toHaveBeenCalledTimes(1);
 });
 it('non-ballistic native targeted skill still uses R23 castSlot and target selection',()=>{
  const h=harness('mind_blast');
  ptr(h.joystick,'pointerdown',11,100,270);
  ptr(h.button,'pointerdown',22,880,270);
  ptr(h.joystick,'pointermove',11,112,220);
  ptr(h.button,'pointerup',22,880,270);
  expect(h.joy.move).toBe(1);
  expect(h.cast).toHaveBeenCalledExactlyOnceWith(1);
  expect(h.target).toHaveBeenCalledExactlyOnceWith(88);
  expect(h.castAt).not.toHaveBeenCalled();
 });
 it('the Origin Hunter survives a cast while moving in the ORIGINAL shared native gate',()=>{
  const player={
    kind:'player',originResources:{mp:120,stamina:100},auras:[]
  } as unknown as Entity;
  expect(abilityCastSurvivesMovement(player,'fireball',
    {def:{castWhileMoving:false},castWhileMoving:false})).toBe(true);
  // The original ClaudeCraft ability-level mobility flag must remain valid.
  const legacy={kind:'player',auras:[]} as unknown as Entity;
  expect(abilityCastSurvivesMovement(legacy,'fireball',
    {def:{castWhileMoving:true}})).toBe(true);
 });
 it('R23 replaces B1-B8 panel with two GEM-sized independent four-button banks',()=>{
  const trial=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
  expect(trial).toContain("topBank.id='hf-origin-buffs-top'");
  expect(trial).toContain("bottomBank.id='hf-origin-buffs-bottom'");
  expect(trial).toContain("bank.appendChild(b)");
  expect(trial).toContain("utility.replaceChildren(topBank,bottomBank)");
  expect(trial).toContain("utility.style.cssText='position:fixed;inset:0;z-index:8400;pointer-events:none;display:block;'");
  expect(trial).not.toContain('bottom:clamp(112px,22vh,190px)');
 });
});
