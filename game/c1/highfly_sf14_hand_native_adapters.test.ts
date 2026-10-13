/** SF14 native simulator outcomes, do not claim VFX or physical S23. */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass,Entity} from '../src/sim/types';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
import {installSf13Compatible} from '../src/highfly/sf13_mass_native_gate';
import {installSf14HandAdapters} from '../src/highfly/sf14_hand_native_adapters';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
let registered:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(id=>id.startsWith('hf_'))).toHaveLength(0);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf13Compatible(ABILITIES,CLASSES));
 expect(registered).toHaveLength(18);
 registered.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 expect(registered).toHaveLength(20);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const index=list.indexOf(id);if(index>=0)list.splice(index,1);
 }
});
function mob(sim:Sim,id:number,z:number,x=0):Entity{
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,20,
  {x:p.pos.x+x,y:p.pos.y,z:p.pos.z+z});
 m.hostile=true;m.aiState='idle';m.maxHp=m.hp=100000;
 sim.addEntity(m);return m;
}
describe('SF14 exact two-original-mechanic adapters in REAL Sim',()=>{
 it('preserves 9 classes, 20 unique real entries and correct unlock and hotbar',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(new Set(registered).size).toBe(20);
  for(const id of ['hf_priest_s1','hf_shaman_s1']){
   const cls=id.split('_')[1] as PlayerClass;
   expect(abilitiesKnownAt(cls,1).some(x=>x.def.id===id)).toBe(true);
   expect(isAbilityActionBarEligible(ABILITIES[id])).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),id,2)[2]).toEqual({type:'ability',id});
  }
  expect(ABILITIES.hf_priest_s1.effects.map(e=>e.type)).toEqual(['heal','directDamage']);
  expect(ABILITIES.hf_priest_s1.targetType).toBe('any');
  expect(ABILITIES.hf_shaman_s1.effects.map(e=>e.type)).toEqual(['directDamage','chainDamage']);
  expect(ABILITIES.hf_shaman_s1.projectileFx).toBe('lightning');
 });
 for(const level of [1,99]){
  it('Priest LV'+level+' casts ally HEAL and enemy damage as separate branches',()=>{
   const healSim=new Sim({seed:140010+level,playerClass:'priest',autoEquip:true});
   healSim.setPlayerLevel(level);healSim.tick();
   const p=healSim.player;p.resource=p.maxResource;p.hp=Math.max(1,Math.round(p.maxHp*.3));
   const previous=p.hp;
   healSim.castAbilityOn('hf_priest_s1',p.id,p.id);
   for(let i=0;i<115;i++)healSim.tick();
   expect(p.cooldowns.has('hf_priest_s1')).toBe(true);
   expect(p.hp).toBeGreaterThan(previous);
   const sim=new Sim({seed:141010+level,playerClass:'priest',autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const hero=sim.player;hero.resource=hero.maxResource;hero.hitBonus=1;
   const target=mob(sim,141030+level,8);
   sim.targetEntity(target.id,hero.id);sim.castAbility('hf_priest_s1',hero.id);
   let damage=0;
   for(let i=0;i<115;i++){
    for(const event of sim.tick())if(event.type==='damage'&&
      event.sourceId===hero.id&&event.targetId===target.id)damage+=event.amount;
   }
   expect(hero.cooldowns.has('hf_priest_s1')).toBe(true);
   expect(damage).toBeGreaterThan(0);
  },25000);
  it('Shaman LV'+level+' lightning chain actually damages multiple targets',()=>{
   const sim=new Sim({seed:143010+level,playerClass:'shaman',autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const hero=sim.player;hero.resource=hero.maxResource;hero.hitBonus=1;
   const first=mob(sim,143100+level,8,0);
   const second=mob(sim,143200+level,9,2);
   const third=mob(sim,143300+level,9,-2);
   sim.targetEntity(first.id,hero.id);sim.castAbility('hf_shaman_s1',hero.id);
   const hit=new Set<number>();
   for(let i=0;i<115;i++)
    for(const e of sim.tick())
     if(e.type==='damage'&&e.sourceId===hero.id&&
       [first.id,second.id,third.id].includes(e.targetId))
       hit.add(e.targetId);
   expect(hero.cooldowns.has('hf_shaman_s1')).toBe(true);
   expect(hit.has(first.id)).toBe(true);
   expect(hit.size).toBeGreaterThanOrEqual(2);
  },25000);
 }
 it('atomic error for absent original donor preserves other registry entries',()=>{
  const defs={...ABILITIES};delete defs.hf_priest_s1;delete defs.hf_shaman_s1;
  delete defs.chain_lightning;
  const classes=Object.fromEntries(Object.entries(CLASSES).map(([id,c])=>
   [id,{abilities:c.abilities.filter(x=>x!=='hf_priest_s1'&&x!=='hf_shaman_s1')}]))
   as Record<PlayerClass,{abilities:string[]}>;
  const n=Object.keys(defs).length;
  expect(()=>installSf14HandAdapters(defs,classes)).toThrow(/original donor contract/);
  expect(Object.keys(defs)).toHaveLength(n);
  expect(defs.hf_priest_s1).toBeUndefined();
 });
});
