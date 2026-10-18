import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyOriginBufferedStrikeAllowed} from '../src/ui/hud/action_bar/highfly_origin_buffer_guard';
import {r39CClassifyStrike,r39CConnectWindow} from '../src/sim/highfly_r39c_combat_context';
import {Sim} from '../src/sim/sim';

const basic=()=>({queuedEpoch:10,currentEpoch:10,queuedTargetId:null as number|null,
  currentTargetId:null as number|null,nowMs:995,deadlineMs:1100,blocked:false,originWhiff:true});
describe('HIGHFLY R39C2: gameplay-connected mobile 170ms input buffer',()=>{
 it('buffers one explicit origin empty-air ATK but not a classic ghost attack',()=>{
   expect(highflyOriginBufferedStrikeAllowed(basic())).toBe(true);
   expect(highflyOriginBufferedStrikeAllowed({...basic(),originWhiff:false})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...basic(),originWhiff:undefined})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...basic(),currentTargetId:39})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...basic(),queuedTargetId:39})).toBe(false);
 });
 it('rejects stale, canceled, UI-blocked and changed-target queued taps',()=>{
   const x=basic();
   expect(highflyOriginBufferedStrikeAllowed({...x,currentEpoch:11})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...x,blocked:true})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...x,nowMs:1101})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...x,nowMs:Infinity})).toBe(false);
   const locked={...x,queuedTargetId:42,currentTargetId:42};
   expect(highflyOriginBufferedStrikeAllowed(locked)).toBe(true);
   expect(highflyOriginBufferedStrikeAllowed({...locked,currentTargetId:null})).toBe(false);
   expect(highflyOriginBufferedStrikeAllowed({...locked,currentTargetId:43})).toBe(false);
 });
 it('genuine accepted native Sim whiff spends stamina only once and never auto-attacks',()=>{
   const sim=new Sim({seed:391302,playerClass:'warrior',originHunterEnabled:true,compulsoryTutorial:false});
   const p=sim.player;
   p.targetId=null;p.autoAttack=false;
   const hp=[...sim.entities.values()].map(e=>e.hp);
   const stamina=p.originResources!.stamina;
   expect(sim.highflyBasicAttack(1)).toBe(true);
   expect(p.autoAttack).toBe(false);
   expect(p.originResources!.stamina).toBe(stamina-4);
   expect([...sim.entities.values()].map(e=>e.hp)).toEqual(hp);
 });
 it('connect is informational only, requires a real accepted prior strike',()=>{
   expect(r39CConnectWindow(1,2,210,{originalAccepted:true,grounded:true,gemReady:false})).toBe(true);
   expect(r39CConnectWindow(1,2,210,{originalAccepted:false,grounded:true,gemReady:false})).toBe(false);
   expect(r39CConnectWindow(3,4,280,{originalAccepted:true,grounded:true,gemReady:false})).toBe(false);
 });
 it('actual HUD hook preserves online acknowledgment, old legacy timeout and cumulative R39 A/B',()=>{
   const hud=readFileSync('src/ui/hud.ts','utf8');
   const guard=readFileSync('src/ui/hud/action_bar/highfly_origin_buffer_guard.ts','utf8');
   const visual=readFileSync('src/render/characters/visual.ts','utf8');
   const gate=readFileSync('src/sim/combat/cast_move_gate.ts','utf8');
   expect(hud).toContain('originWhiff: Boolean(this.sim.player.originResources)');
   expect(hud).toContain('this.sim.player.originResources ? 0.17 : 0.20');
   expect(hud).toContain('this.highflyOriginStrikeAck.settle');
   expect(hud).toContain('highflyR39CombatContext=r39Ctx');
   expect(hud).toContain('this.highflyOriginAcceptBasicStrike(next, elemental, now)');
   expect(guard).toContain('x.currentTargetId === x.queuedTargetId');
   expect(visual).toContain('!r39CIsNativeBasicCue(abilityId)');
   expect(visual).toContain('r39MaskedMobilePair(runClip,attackClip)');
   expect(gate).toContain('highflyR39bMobileProjectileCast(p,abilityId,resolved)');
   // Native fallback is still bound to the only explicitly pressed ATK, once.
   expect(hud).toContain('this.highflyV91QueuedAttack = setTimeout(() => {');
   expect(hud).toContain('this.onMobileAttackNearest?.()');
 });
 it('accepted branch can identify running/airborne without minting a skill',()=>{
   expect(r39CClassifyStrike({onGround:true,vy:0,horizontalSpeed:3})).toBe('running');
   expect(r39CClassifyStrike({onGround:false,vy:2,horizontalSpeed:3})).toBe('air');
   expect(r39CClassifyStrike({onGround:false,vy:-2,horizontalSpeed:3})).toBe('plunge');
 });
});
