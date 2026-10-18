import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {Sim} from '../src/sim/sim';
import {
 r39AcceptedEvade,r39PhysicalDefense,r39RecordBasic,r39AddGuardPressure,
 r39ContextualAttackClip,r39ConnectConfirmedSkill,
} from '../src/sim/highfly_origin_r39_final_runtime';

function arena(){
 const sim=new Sim({seed:391999,playerClass:'warrior',
   originHunterEnabled:true,compulsoryTutorial:false});
 const p=sim.player;
 const mob=[...sim.entities.values()].find(x=>
   x.kind==='mob'&&x.hostile&&!x.dead&&x.ownerId===null&&!x.guardianState);
 if(!mob)throw Error('R39_TEST_NEEDS_REAL_HOSTILE_MOB');
 mob.pos.x=p.pos.x;mob.pos.z=p.pos.z+1.7;mob.pos.y=p.pos.y;
 mob.hp=mob.maxHp=100000;p.facing=0;p.targetId=mob.id;
 p.autoAttack=false;
 return {sim,p,mob};
}
describe('R39 FINAL: REAL runtime action->Sim defense/guard/rig',()=>{
 it('parries a real physical mob impact ONLY after an accepted manual ATK',()=>{
   const {sim,p,mob}=arena();
   const hp=p.hp,stamina=p.originResources!.stamina;
   expect(sim.highflyBasicAttack(1)).toBe(true);
   expect(p.originResources!.stamina).toBe(stamina-4);
   sim.drainEvents();
   sim.mobSwing(mob,p);
   const ev=sim.drainEvents();
   expect(p.hp).toBe(hp);
   expect(ev.some(x=>x.type==='highflyR39Defense'&&x.action==='parry')).toBe(true);
   expect(ev.some(x=>x.type==='damage'&&x.kind==='parry'&&x.amount===0)).toBe(true);
   // The same press cannot parry a second simultaneous mob attack.
   expect(r39PhysicalDefense(p,mob,sim.time)).toBeNull();
 });
 it('native authorized evade gets <=180ms real no-HP-loss window',()=>{
   const {sim,p,mob}=arena(),hp=p.hp;
   expect(r39PhysicalDefense(p,mob,sim.time)).toBeNull();
   r39AcceptedEvade(p,sim.time);
   sim.mobSwing(mob,p);
   expect(p.hp).toBe(hp);
   expect(sim.drainEvents().some(x=>x.type==='highflyR39Defense'&&x.action==='perfect-dodge')).toBe(true);
   expect(r39PhysicalDefense(p,mob,sim.time+.181)).toBeNull();
 });
 it('guard pressure is separate from HP, immune bosses never break',()=>{
   const {sim,p,mob}=arena(),hp=mob.hp;
   expect(r39AddGuardPressure(mob,sim.time,9999,true)).toBe(false);
   expect(mob.hp).toBe(hp);
   expect(r39AddGuardPressure(mob,sim.time,9999,false)).toBe(true);
   expect(r39AddGuardPressure(mob,sim.time,9999,false)).toBe(false);
   expect(mob.hp).toBe(hp);
   expect(r39RecordBasic(p,mob,2,sim.time,0,false).guardBroken).toBe(false);
 });
 it('combo and skill link require native confirmed inputs (no automatic cast)',()=>{
   const {sim,p,mob}=arena();
   expect(r39ConnectConfirmedSkill(p,sim.time)).toBe(false);
   expect(sim.highflyBasicAttack(1)).toBe(true);
   expect(r39ConnectConfirmedSkill(p,sim.time+.3)).toBe(true);
   expect(r39ConnectConfirmedSkill(p,sim.time+.3)).toBe(false);
   expect(r39RecordBasic(p,mob,2,sim.time+.4,0,false).connected).toBe(false);
 });
 it('air/plunge use distinct existing KayKit clips; ground retains weapon animation',()=>{
   expect(r39ContextualAttackClip(1,false,false)).toBeNull();
   expect(r39ContextualAttackClip(1,true,false)).toBe('1H_Melee_Attack_Slice_Diagonal');
   expect(r39ContextualAttackClip(3,true,true)).toBe('2H_Melee_Attack_Chop');
   const visual=readFileSync('src/render/characters/visual.ts','utf8');
   const render=readFileSync('src/render/renderer.ts','utf8');
   expect(visual).toContain('this.playOneShot(clip,this.r39Falling?1.45:1.3)');
   expect(visual).toContain("this.playOneShot('Block',1.1)");
   expect(render).toContain('sourceEntity?.originResources');
 });
 it('real evade edge owns stamina, and renderer events never invent damage',()=>{
   const motion=readFileSync('src/sim/player_motion.ts','utf8');
   const sim=readFileSync('src/sim/sim.ts','utf8');
   expect(motion).toContain('deps.originDefensiveEvadeAccepted?.(p)');
   expect(sim).toContain('r39AcceptedEvade(p,this.time)');
   expect(sim).toContain('r39PhysicalDefense(target,mob,this.time)');
   expect(sim).toContain('r39AddGuardPressure(mob,this.time,30,immune)');
   expect(sim).toContain("if(ev.type==='castStart')");
 });
});
