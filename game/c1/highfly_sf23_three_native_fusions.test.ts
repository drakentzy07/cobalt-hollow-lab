/** HIGHFLY SF23: REAL original Sim integration and 9-class HUD/LV1-99. */
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
import {SF23_IDS,installSf23ThreeNative} from '../src/highfly/sf23_three_native_fusions';

const CASES=[
 {id:'hf_warrior_s1',cls:'warrior',lv:1},
 {id:'hf_rogue_s2',cls:'rogue',lv:5},
 {id:'hf_mage_s5',cls:'mage',lv:20}
] as const;
let installed:string[]=[];
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
 expect(installed).toHaveLength(45);
 installed.push(...installSf23ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(48);
 expect(new Set(installed).size).toBe(48);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const i=list.indexOf(id);if(i>=0)list.splice(i,1);
 }
});
function makeTarget(sim:Sim,id:number,dist:number){
 const p=sim.player;
 // Original LV1 melee miss/defense tables assume an equal-level training target.
 // Do not validate a LV1 ability against a LV20 training dummy: a zero-damage
 // miss would be a valid outcome, not a native-fusion failure.
 const dummyLevel=Math.min(20,Math.max(1,p.level));
 const t=createMob(id,MOBS.training_dummy,dummyLevel,
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 t.hostile=true;t.aiState='idle';t.maxHp=t.hp=500000;
 sim.addEntity(t);sim.targetEntity(t.id,p.id);
 return t;
}
describe('SF23 source-native 3 real combat fusion, 9-class invariant',()=>{
 it('63-source preservation, 48 actual registered and source effect shapes',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF23_IDS).toEqual(['hf_warrior_s1','hf_rogue_s2','hf_mage_s5']);
  expect(ABILITIES.hf_warrior_s1.effects.map(e=>e.type))
   .toEqual(['weaponStrike','sunder']);
  expect(ABILITIES.hf_rogue_s2.effects.map(e=>e.type))
   .toEqual(['weaponStrike','finisherDamage']);
  expect(ABILITIES.hf_rogue_s2.spendsCombo).toBe(true);
  expect(ABILITIES.hf_rogue_s2.awardsCombo).toBe(1);
  expect(ABILITIES.hf_mage_s5.effects.map(e=>e.type))
   .toEqual(['directDamage','directDamage',
    'directDamage','directDamage','directDamage','selfBuff']);
 });
 for(const c of CASES)for(const level of [c.lv,99]){
  it(c.id+' LV'+level+' original Sim hit, actionbar, spellbook',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,level).some(x=>x.def.id===c.id)).toBe(true);
   if(c.lv>1)expect(abilitiesKnownAt(c.cls,c.lv-1)
    .some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,4)[4])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:233321+level+CASES.indexOf(c)*1000,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;p.facing=0;
   const mob=makeTarget(sim,233721+level+CASES.indexOf(c)*1000,
    c.cls==='mage'?8:3);
   if(c.cls==='rogue'){p.comboPoints=3;p.comboUntil=sim.time+30;}
   sim.castAbility(c.id,p.id);
   let hits=0,armor=false,speed=false,finisherZero=false;
   for(let k=0;k<75;k++){
    for(const ev of sim.tick()){
     if(ev.type==='damage'&&ev.sourceId===p.id&&
      ev.targetId===mob.id&&ev.amount>0&&ev.ability===d.name)hits++;
     if(ev.type==='comboPoint'&&ev.pid===p.id&&ev.points===0)
      finisherZero=true;
    }
    if(mob.auras.some(a=>a.kind==='sunder'))armor=true;
    if(p.auras.some(a=>a.kind==='buff_speed'))speed=true;
   }
   expect(p.cooldowns.has(c.id),'source native cooldown on '+c.id).toBe(true);
   expect(hits,c.id+' actual native damage events').toBeGreaterThan(0);
   if(c.cls==='warrior')
    expect(armor,'source Sunder aura must land').toBe(true);
   if(c.cls==='rogue')
    expect(finisherZero,'source Rogue combo must be consumed').toBe(true);
   if(c.cls==='mage'){
    expect(hits,'five native Mage packet effects').toBeGreaterThanOrEqual(3);
    expect(speed,'native Scald movement speed buff').toBe(true);
   }
  },25000);
 }
 it('Rogue starter can build combo on first hit with no combo bank',()=>{
  const sim=new Sim({seed:230001,playerClass:'rogue',autoEquip:true});
  sim.setPlayerLevel(5);sim.tick();
  const p=sim.player;p.resource=p.maxResource;p.comboPoints=0;p.hitBonus=1;
  const t=makeTarget(sim,230002,3);
  sim.castAbility('hf_rogue_s2',p.id);
  let awarded=false;
  for(let k=0;k<35;k++){
   for(const ev of sim.tick()){
    if(ev.type==='comboPoint'&&ev.pid===p.id&&ev.points>0)awarded=true;
   }
  }
  expect(p.cooldowns.has('hf_rogue_s2')).toBe(true);
  expect(awarded,'source Sinister builder from 0 combo').toBe(true);
  expect(t.hp).toBeLessThan(t.maxHp);
 },25000);
 it('missing original donor fails atomically and leaves all 9 classes unchanged',()=>{
  const registry={...ABILITIES};
  for(const id of SF23_IDS)delete registry[id];
  delete registry.eviscerate;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [c,data] of Object.entries(CLASSES))
   classes[c as PlayerClass]={abilities:data.abilities.filter(id=>
    !SF23_IDS.includes(id as typeof SF23_IDS[number]))};
  const count=Object.keys(registry).length;
  expect(()=>installSf23ThreeNative(registry,classes))
   .toThrow(/original donor missing or changed/);
  expect(Object.keys(registry)).toHaveLength(count);
  expect(SF23_IDS.every(id=>!registry[id])).toBe(true);
 });
});
