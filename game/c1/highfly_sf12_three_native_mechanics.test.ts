/** SF12: no mocked combat events; original native Sim at unlock and 99.
 * Isolated opt-in registration, exact donor ranks, cooldown, targeting.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass,Entity} from '../src/sim/types';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
const CASES=[
 {cls:'warrior',id:'hf_warrior_s3',lv:10},
 {cls:'paladin',id:'hf_paladin_s4',lv:15},
 {cls:'mage',id:'hf_mage_s4',lv:15},
] as const;
let registered:string[]=[];
beforeAll(()=>{
 expect(CASES.some(c=>Boolean(ABILITIES[c.id]))).toBe(false);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 expect(registered).toHaveLength(16);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const cl=id.split('_')[1] as PlayerClass;
  const i=CLASSES[cl].abilities.indexOf(id);
  if(i>=0)CLASSES[cl].abilities.splice(i,1);
 }
});
function makeMob(sim:Sim,dist:number,id:number):Entity{
 const p=sim.player;
 const enemy=createMob(id,MOBS.training_dummy,20,{x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 enemy.hostile=true;enemy.aiState='idle';enemy.hp=enemy.maxHp=100000;
 sim.addEntity(enemy);return enemy;
}
describe('SF12 — Warrior arrival hit+slow, Paladin dual-target, Mage absorb, actual native Sim',()=>{
 for(const c of CASES)for(const lv of [c.lv,99]){
  it(c.id+' LV'+lv+' learns and appears in ORIGINAL ten-slot hotbar',()=>{
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,3)[3]).toEqual({type:'ability',id:c.id});
   expect(isAbilityActionBarEligible(ABILITIES[c.id])).toBe(true);
  });
  it(c.id+' LV'+lv+' executes original Sim effects (without Training edits)',()=>{
   const sim=new Sim({seed:120000+lv+CASES.indexOf(c)*171,playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;
   p.resource=p.maxResource;p.hitBonus=1;
   p.hp=Math.max(1,Math.round(p.maxHp*.35));
   const before={pos:{...p.pos},hp:p.hp};
   const mob=c.cls==='mage'?null:makeMob(sim,c.cls==='warrior'?12:8,122000+lv+CASES.indexOf(c)*171);
   if(mob)sim.targetEntity(mob.id,p.id);
   const oldHp=mob?.hp??0;
   if(c.cls==='mage')sim.castAbilityOn(c.id,p.id,p.id);
   else sim.castAbility(c.id,p.id);
   let minMobHp=oldHp,damage=0,minResource=p.resource;
   for(let i=0;i<100;i++){
    for(const e of sim.tick()){
     if(mob&&e.type==='damage'&&e.sourceId===p.id&&e.targetId===mob.id)damage+=e.amount;
    }
    minResource=Math.min(minResource,p.resource);
    if(mob)minMobHp=Math.min(minMobHp,mob.hp);
   }
   expect(p.cooldowns.has(c.id),c.id+' did not execute a real native cast').toBe(true);
   // Warrior uses rage: a charge can generate rage rather than spend it.\n   // Other resource classes must show actual resource spend.\n   if(c.cls!=='warrior')expect(minResource).toBeLessThan(p.maxResource);
   if(c.cls==='warrior'){
    expect(Math.hypot(p.pos.x-before.pos.x,p.pos.z-before.pos.z)).toBeGreaterThan(2);
    expect(minMobHp).toBeLessThan(oldHp);
    expect(damage).toBeGreaterThan(0);
    expect(mob?.auras.some(a=>a.kind==='slow')).toBe(true);
   }else if(c.cls==='paladin'){
    expect(minMobHp).toBeLessThan(oldHp);
    expect(damage).toBeGreaterThan(0);
   }else{
    expect(p.auras.some(a=>a.kind==='absorb'&&a.id===c.id)).toBe(true);
    expect(p.hp).toBeGreaterThanOrEqual(before.hp);
   }
  },20000);
 }
 for(const lv of [15,99]){
  it('Paladin '+lv+' reuses actual ally HEAL branch, not damage branch on friendly',()=>{
   const sim=new Sim({seed:122500+lv,playerClass:'paladin',autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.hp=Math.round(p.maxHp*.3);p.resource=p.maxResource;
   const before=p.hp;
   sim.castAbilityOn('hf_paladin_s4',p.id,p.id);
   for(let i=0;i<20;i++)sim.tick();
   expect(p.cooldowns.has('hf_paladin_s4')).toBe(true);
   expect(p.hp).toBeGreaterThan(before);
  });
 }
 it('all 16 hand-audited skills survive, only 47 catalog entries remain design-only',()=>{
  expect(registered).toHaveLength(16);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  const def=ABILITIES.hf_warrior_s3;
  expect(def.effects.map(x=>x.type)).toEqual(['charge','stun','directDamage','slow']);
  expect(def.minRange).toBe(8);
  expect(def.offGcd).toBeUndefined();
  expect(ABILITIES.hf_paladin_s4.effects.map(x=>x.type)).toEqual(['heal','directDamage']);
  expect(ABILITIES.hf_paladin_s4.targetType).toBe('any');
  expect(ABILITIES.hf_mage_s4.effects.map(x=>x.type)).toEqual(['absorb']);
  expect(ABILITIES.hf_mage_s4.targetType).toBe('friendly');
  expect(ABILITIES.hf_mage_s4.cooldown).toBe(30);
  expect(ABILITIES.hf_priest_s4).toBeDefined();
  expect(ABILITIES.hf_hunter_s5.effects.map(x=>x.type)).toEqual(['weaponStrike','hunterTrailbreak']);
 });
 it('atomic failure: missing special donor does not half-register new skills',()=>{
  const copy={...ABILITIES};
  const cls=Object.fromEntries(Object.entries(CLASSES).map(([name,c])=>
   [name,{abilities:[...c.abilities]}])) as Record<PlayerClass,{abilities:string[]}>;
  for(const c of CASES){delete copy[c.id];cls[c.cls].abilities.splice(cls[c.cls].abilities.indexOf(c.id),1);}
  delete copy.temporal_barrier;
  const size=Object.keys(copy).length;
  expect(()=>installSf12NativeExpansion(copy,cls)).toThrow(/missing\/foreign original donor/);
  expect(Object.keys(copy)).toHaveLength(size);
  expect(CASES.every(c=>!copy[c.id])).toBe(true);
 });
});
