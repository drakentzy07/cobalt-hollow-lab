/** SF16: 28 previously certified plus one new Paladin native skill.
 * Real original Sim, LV20/LV99, hotbar, actual buff+stun, atomic donor failure.
 */
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
import {SF16_IDS,installSf16UniqueNative} from '../src/highfly/sf16_eight_support_elemental';
let registered:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'))).toHaveLength(0);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf13Compatible(ABILITIES,CLASSES));
 registered.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 registered.push(...installSf15EightNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(28);
 expect(SF16_IDS).toEqual(['hf_paladin_s5']);
 expect(registered.some(id=>SF16_IDS.includes(id as typeof SF16_IDS[number]))).toBe(false);
 registered.push(...installSf16UniqueNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(29);
 expect(new Set(registered).size).toBe(29);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const index=list.indexOf(id);if(index>=0)list.splice(index,1);
 }
});
describe('SF16 exact one NEW HIGHFLY Paladin source-fusion',()=>{
 it('preserves nine classes and original speed+stun source effects',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(ABILITIES.hf_paladin_s5.effects.map(e=>e.type)).toEqual(['selfBuff','stun']);
  expect(ABILITIES.hf_paladin_s5.requiresTarget).toBe(true);
  expect(ABILITIES.hf_paladin_s5.range).toBe(10);
 });
 for(const level of [20,99]){
  it('LV'+level+' truly performs both original buff and stun',()=>{
   const id='hf_paladin_s5',d=ABILITIES[id];
   expect(abilitiesKnownAt('paladin',level).some(x=>x.def.id===id)).toBe(true);
   expect(abilitiesKnownAt('paladin',19).some(x=>x.def.id===id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),id,3)[3])
    .toEqual({type:'ability',id});
   const sim=new Sim({seed:165001+level,playerClass:'paladin',autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.facing=0;
   const mob=createMob(165551+level,MOBS.training_dummy,20,
    {x:p.pos.x,y:p.pos.y,z:p.pos.z+8});
   mob.hostile=true;mob.aiState='idle';mob.hp=mob.maxHp=100000;
   sim.addEntity(mob);sim.targetEntity(mob.id,p.id);
   sim.castAbility(id,p.id);
   let speed=false,stunned=false;
   for(let i=0;i<50;i++){
    sim.tick();
    if(p.auras.some(a=>a.kind==='buff_speed'))speed=true;
    if(mob.auras.some(a=>a.kind==='stun'))stunned=true;
   }
   expect(p.cooldowns.has(id),'original cast was not accepted').toBe(true);
   expect(speed,'native Solar Step buff must occur').toBe(true);
   expect(stunned,'native Sundering Gavel stun must occur').toBe(true);
  },20000);
 }
 it('rejects missing original donor atomically, without half-install',()=>{
  const defs={...ABILITIES};delete defs.hf_paladin_s5;delete defs.solar_step;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [id,c] of Object.entries(CLASSES))
   classes[id as PlayerClass]={abilities:c.abilities.filter(x=>x!=='hf_paladin_s5')};
  const original=Object.keys(defs).length;
  expect(()=>installSf16UniqueNative(defs,classes))
   .toThrow(/missing\/changed original Paladin donors/);
  expect(Object.keys(defs)).toHaveLength(original);
  expect(defs.hf_paladin_s5).toBeUndefined();
 });
});
