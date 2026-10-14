/** SF24: original native 6-shot channel, lunar melee + DoT, 2 DoTs+SELF thorns. */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
import {installSf13Compatible} from '../src/highfly/sf13_mass_native_gate';
import {installSf14HandAdapters} from '../src/highfly/sf14_hand_native_adapters';
import {installSf15EightNative} from '../src/highfly/sf15_eight_native_batch';
import {installSf16UniqueNative} from '../src/highfly/sf16_eight_support_elemental';
import {installSf17ThreeNative} from '../src/highfly/sf17_three_unique_native';
import {installSf18ThreeNative} from '../src/highfly/sf18_four_native_effects';
import {installSf19TwoNative} from '../src/highfly/sf19_two_melee_native';
import {installSf20TwoNative} from '../src/highfly/sf20_two_source_effects';
import {installSf21ThreeNative} from '../src/highfly/sf21_three_complex_source';
import {installSf22ThreeNative} from '../src/highfly/sf22_three_original_compat';
import {installSf23ThreeNative} from '../src/highfly/sf23_three_native_fusions';
import {installSf24ThreeNative} from '../src/highfly/sf24_hunter_druid_three_native';
import {SF25_IDS,installSf25TwoNative} from '../src/highfly/sf25_shaman_warlock_two_native';
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'))).toHaveLength(0);
 installed.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 installed.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 installed.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 installed.push(...installSf13Compatible(ABILITIES,CLASSES));
 installed.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 installed.push(...installSf15EightNative(ABILITIES,CLASSES));
 installed.push(...installSf16UniqueNative(ABILITIES,CLASSES));
 installed.push(...installSf17ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf18ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf19TwoNative(ABILITIES,CLASSES));
 installed.push(...installSf20TwoNative(ABILITIES,CLASSES));
 installed.push(...installSf21ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf22ThreeNative(ABILITIES,CLASSES));
 installed.push(...installSf23ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(48);
 installed.push(...installSf24ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(51);
 installed.push(...installSf25TwoNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(53);
 expect(new Set(installed).size).toBe(53);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const arr=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);
 }
});

function target(sim:Sim,id:number,dist:number){
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,Math.min(20,Math.max(1,p.level)),
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 m.hostile=true;m.aiState='idle';m.maxHp=m.hp=500000;
 sim.addEntity(m);sim.targetEntity(m.id,p.id);
 return m;
}
function demonOwnedBy(sim:Sim,id:number){
 return [...sim.entities.values()].filter(e=>e.ownerId===id && !e.dead &&
  (e.templateId==='emberkin'||e.templateId==='gloomshade'));
}
describe('SF25 original source Shaman Pyrebrand and Warlock ONE demon 9class',()=>{
 it('exact 53 unique source IDs and original two donor contracts',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF25_IDS).toEqual(['hf_shaman_s4','hf_warlock_s5']);
  expect(ABILITIES.hf_shaman_s4.effects[0].type).toBe('imbue');
  expect(ABILITIES.hf_warlock_s5.effects).toEqual([{type:'summonDemon',mobId:'emberkin'}]);
  expect(ABILITIES.hf_warlock_s5.castTime).toBe(5);
  expect(ABILITIES.hf_shaman_s4.cooldown).toBe(15);
 });
 for(const level of [15,99])it('hf_shaman_s4 LV'+level+' original Pyrebrand and Unleash FIRE in source Sim',()=>{
  const id='hf_shaman_s4',c=ABILITIES[id];
  expect(abilitiesKnownAt('shaman',level).some(x=>x.def.id===id)).toBe(true);
  expect(isAbilityActionBarEligible(c)).toBe(true);
  expect(placeAbilityOnSlot(Array.from({length:10},()=>null),id,3)[3])
    .toEqual({type:'ability',id});
  const sim=new Sim({seed:250100+level,playerClass:'shaman',autoEquip:true});
  sim.setPlayerLevel(level);sim.tick();
  const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;
  const mob=target(sim,251100+level,12);
  sim.castAbility(id,p.id);
  let dmg=0,pyrebrand=false,cooldownArmed=p.cooldowns.has(id);
  for(let i=0;i<120;i++){
   const events=sim.tick();
   if(p.cooldowns.has(id))cooldownArmed=true;
   if(p.auras.some(a=>a.id==='flametongue_weapon'&&a.kind==='imbue'&&a.value>0))
    pyrebrand=true;
   for(const ev of events)if(ev.type==='damage'&&ev.sourceId===p.id&&
    ev.targetId===mob.id&&ev.amount>0&&ev.ability==='Unleash Weapon')
    dmg++;
  }
  expect(cooldownArmed,'native Shaman recast cooldown armed').toBe(true);
  expect(pyrebrand,'original Pyrebrand aura under original donor ID').toBe(true);
  expect(dmg,'original runUnleashWeapon hits in real Sim').toBeGreaterThan(0);
 },25000);
 for(const level of [20,99])it('hf_warlock_s5 LV'+level+' recast switches native permanent demons, never twins',()=>{
  const id='hf_warlock_s5',c=ABILITIES[id];
  expect(abilitiesKnownAt('warlock',level).some(x=>x.def.id===id)).toBe(true);
  expect(isAbilityActionBarEligible(c)).toBe(true);
  expect(placeAbilityOnSlot(Array.from({length:10},()=>null),id,4)[4])
    .toEqual({type:'ability',id});
  const sim=new Sim({seed:252100+level,playerClass:'warlock',autoEquip:true});
  sim.setPlayerLevel(level);sim.tick();
  const p=sim.player;p.resource=p.maxResource;
  // Source pet engine only allows 1 demon; the first cast takes original 5 sec.
  sim.castAbility(id,p.id);
  let cooldownArmed=false;
  for(let i=0;i<330;i++){
   sim.tick();if(p.cooldowns.has(id))cooldownArmed=true;
  }
  const first=demonOwnedBy(sim,p.id);
  expect(cooldownArmed,'source cooldown armed').toBe(true);
  expect(first.map(e=>e.templateId)).toEqual(['emberkin']);
  // 330 native ticks elapse > 8sec cooldown and >5sec cast.
  p.resource=p.maxResource;
  sim.castAbility(id,p.id);
  for(let i=0;i<330;i++)sim.tick();
  const second=demonOwnedBy(sim,p.id);
  expect(second.map(e=>e.templateId)).toEqual(['gloomshade']);
  expect(second.length).toBe(1);
 },25000);
 it('atomically refuses missing original Shaman/Warlock donor',()=>{
  const copy={...ABILITIES};
  for(const id of SF25_IDS)delete copy[id];
  delete copy.flametongue_weapon;
  const cl={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cls,c] of Object.entries(CLASSES))
   cl[cls as PlayerClass]={abilities:c.abilities.filter(id=>
    !SF25_IDS.includes(id as typeof SF25_IDS[number]))};
  const n=Object.keys(copy).length;
  expect(()=>installSf25TwoNative(copy,cl))
    .toThrow(/SF25 ORIGINAL donor missing\/mutated/);
  expect(Object.keys(copy)).toHaveLength(n);
  expect(SF25_IDS.every(id=>!copy[id])).toBe(true);
 });
});
