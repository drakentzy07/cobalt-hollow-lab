import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {highflyR36ANearbyTarget} from '../src/game/highfly_r36a_soft_attack_target';

const hunter=()=>new Sim({seed:361501,playerClass:'warrior',
  originHunterEnabled:true,compulsoryTutorial:false});

describe('HIGHFLY R36A — manual origin physical ATK (functional acceptance)',()=>{
 it('one ATTACK with no target swings, bills stamina, never damages or starts autoattack',()=>{
   const s=hunter(),p=s.player;
   p.targetId=null;p.autoAttack=false;
   const hps=[...s.entities.values()].map(e=>e.hp);
   const stamina=p.originResources!.stamina;
   expect(s.highflyBasicAttack(1)).toBe(true);
   expect(p.targetId).toBeNull();
   expect(p.autoAttack).toBe(false);
   expect(p.swingTimer).toBeGreaterThan(0);
   expect(p.originResources!.stamina).toBe(stamina-4);
   expect([...s.entities.values()].map(e=>e.hp)).toEqual(hps);
 });
 it('attack with a far or stale target is still a physical swing without remote damage',()=>{
   const s=hunter(),p=s.player;
   const mob=[...s.entities.values()].find(e=>e.kind==='mob'&&e.hostile&&!e.dead);
   expect(mob).toBeDefined();
   p.targetId=mob!.id;
   mob!.pos.x=p.pos.x+100;mob!.pos.z=p.pos.z+100;
   const hp=mob!.hp,stamina=p.originResources!.stamina;
   expect(s.highflyBasicAttack(2)).toBe(true);
   expect(mob!.hp).toBe(hp);
   expect(p.originResources!.stamina).toBe(stamina-4);
   expect(p.autoAttack).toBe(false);
 });
 it('native hit table is retained when a real enemy is within melee reach',()=>{
   const s=hunter(),p=s.player;
   const mob=[...s.entities.values()].find(e=>e.kind==='mob'&&e.hostile&&!e.dead);
   expect(mob).toBeDefined();
   mob!.hp=mob!.maxHp=100000;
   mob!.pos.x=p.pos.x;mob!.pos.z=p.pos.z+1.6;
   mob!.pos.y=p.pos.y;p.targetId=mob!.id;
   const stamina=p.originResources!.stamina;
   expect(s.highflyBasicAttack(1)).toBe(true);
   expect(p.autoAttack).toBe(false);
   expect(p.originResources!.stamina).toBe(stamina-4);
   expect(p.swingTimer).toBeGreaterThan(0);
   // Native hit RNG is authoritative: whiff/dodge is permitted, fake HP is not.
   expect(mob!.hp).toBeLessThanOrEqual(100000);
 });
 it('ATK4 without activated elemental gem cannot be invented as air attack',()=>{
   const s=hunter(),p=s.player;
   p.targetId=null;
   const stamina=p.originResources!.stamina;
   expect(s.highflyElementalFinisherReady()).toBe(false);
   expect(s.highflyBasicAttack(4)).toBe(false);
   expect(p.originResources!.stamina).toBe(stamina);
 });
 it('original nine-class Sim without origin profile still rejects blank attack',()=>{
   const s=new Sim({seed:361501,playerClass:'warrior',compulsoryTutorial:false});
   s.player.targetId=null;
   expect(s.player.originResources).toBeUndefined();
   const hp=s.player.hp;
   expect(s.highflyBasicAttack(1)).toBe(false);
   expect(s.player.hp).toBe(hp);
 });
 it('ATK chooses close front hostile without pressing TARGET; never auto-locks behind',()=>{
   const at={x:0,z:0};
   const enemy=[
     {id:11,pos:{x:0,z:3},hostile:true},
     {id:12,pos:{x:0,z:-1},hostile:true},
     {id:13,pos:{x:2,z:0},hostile:true},
     {id:14,pos:{x:0,z:2},hostile:false},
     {id:15,pos:{x:0,z:6},hostile:true},
   ];
   const hostile=(e:typeof enemy[number])=>e.hostile;
   expect(highflyR36ANearbyTarget(enemy,at,0,hostile)).toBe(11);
   expect(highflyR36ANearbyTarget([enemy[1]],at,0,hostile)).toBeNull();
   expect(highflyR36ANearbyTarget([enemy[4]],at,0,hostile)).toBeNull();
   expect(highflyR36ANearbyTarget([enemy[3]],at,0,hostile)).toBeNull();
   expect(highflyR36ANearbyTarget([enemy[2]],at,Math.PI/2,hostile)).toBe(13);
   const main=readFileSync('src/main.ts','utf8');
   expect(main).toContain('highflyR36ANearbyTarget(');
   expect(main).toContain('world.targetEntity(nearby);');
   expect(main).toContain("document.body.classList.contains('hf-android-p35')");
 });
 it('whiff uses a TYPED renderer-only cue, never fake damage or a fabricated target',()=>{
   const src=readFileSync('src/sim/combat/auto_attack.ts','utf8');
   const a=src.slice(src.indexOf('function highflyR36AWhiff('),
     src.indexOf('export function highflyBasicAttack('));
   expect(a).toContain("ctx.emit({type:'highflyBasicSwing',sourceId:p.id,step})");
   expect(a).not.toContain("type:'damage'");
   expect(a).not.toContain('targetId');
   expect(a).not.toContain('meleeSwing(');
   expect(a).not.toContain('rangedSwing(');
   expect(readFileSync('src/render/renderer.ts','utf8')).toContain("case 'highflyBasicSwing':");
   expect(readFileSync('src/sim/types.ts','utf8')).toContain("type: 'highflyBasicSwing'");
 });
 it('native ATK and USAR are separate interactions; 4 original slots not modified',()=>{
   const main=readFileSync('src/game/mobile_controls.ts','utf8');
   const ring=readFileSync('src/ui/hud/action_bar/mobile_action_ring_controller.ts','utf8');
   const runtime=readFileSync('src/highfly/game_c1_runtime.ts','utf8');
   expect(main).toContain("bindButton('mobile-interact', () => this.callbacks.onInteract())");
   expect(ring).toContain("bindTouchTap(attackBtn, () => {");
   expect(ring).toContain('deps.activateFixedAttackSlot()');
   expect(runtime).toContain("!document.body.classList.contains('hf-android-p35')");
   expect(runtime).toContain("const label = use ? 'USAR' : 'ATK'");
   expect(ring).not.toContain('onInteract()');
 });
});
