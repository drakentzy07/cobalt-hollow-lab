/** SF22: original Sim combat, LV unlock and 99, no fake visual pass. */
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
import {SF22_IDS,installSf22ThreeNative} from '../src/highfly/sf22_three_original_compat';
const CASES=[
 {id:'hf_paladin_u1',cls:'paladin',unlock:25},
 {id:'hf_hunter_s4',cls:'hunter',unlock:15},
 {id:'hf_mage_u2',cls:'mage',unlock:30}
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
 expect(installed).toHaveLength(42);
 installed.push(...installSf22ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(45);
 expect(new Set(installed).size).toBe(45);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const arr=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const ix=arr.indexOf(id);if(ix>=0)arr.splice(ix,1);
 }
});
function dummy(sim:Sim,id:number,x:number,z:number){
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,20,
  {x:p.pos.x+x,y:p.pos.y,z:p.pos.z+z});
 m.hostile=true;m.aiState='idle';m.maxHp=m.hp=100000;
 sim.addEntity(m);return m;
}
describe('SF22 original Paladin/Hunter/Mage native source compatibility',()=>{
 it('preserves 9 classes and original donor effect types',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(ABILITIES.hf_paladin_u1.effects.map(e=>e.type))
   .toEqual(['sunGodVerdict','weaponStrike']);
  expect(ABILITIES.hf_hunter_s4.effects.map(e=>e.type))
   .toEqual(['hunterShrapnel','aoeDamage']);
  expect(ABILITIES.hf_mage_u2.effects.map(e=>e.type))
   .toEqual(['temporalHourglass','selfBuff']);
 });
 for(const c of CASES)for(const lv of [c.unlock,99]){
  it(c.id+' LV'+lv+' casts in real Sim and 10-slot HUD',()=>{
   const def=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.unlock-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(def)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,3)[3])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:220500+lv+CASES.indexOf(c)*111,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const hero=sim.player;
   hero.resource=hero.maxResource;hero.facing=0;hero.hitBonus=1;
   const dist=c.cls==='paladin'?3:8;
   const target=dummy(sim,221500+lv+CASES.indexOf(c)*111,0,dist);
   const other=c.cls==='hunter'?dummy(sim,222500+lv,3,dist):null;
   if(def.requiresTarget)sim.targetEntity(target.id,hero.id);
   if(c.cls==='mage')sim.castAbility(c.id,hero.id,{x:target.pos.x,z:target.pos.z});
   else sim.castAbility(c.id,hero.id);
   let hurt=false,marked=false,aura=false,suspended=false,neighbor=false,fxAtTarget=false;
   for(let k=0;k<110;k++){
    for(const ev of sim.tick()){
     if(ev.type==='damage'&&ev.targetId===target.id&&ev.amount>0)hurt=true;
     if(ev.type==='spellfxAt'&&ev.ability===c.id&&
      Math.abs(ev.x-target.pos.x)<0.1&&Math.abs(ev.z-target.pos.z)<0.1)
      fxAtTarget=true;
    }
    if(target.auras.some(a=>a.kind==='sun_verdict'))marked=true;
    if(hero.auras.some(a=>a.kind==='combustion'))aura=true;
    if(other&&other.hp<other.maxHp)neighbor=true;
    // Original Hourglass routes an aimed cast ON a living enemy to hostile
    // temporal suspension immediately, NOT to an empty-ground hourglass.
    if(target.auras.some(a=>a.id==='temporal_hourglass'&&
     a.kind==='incapacitate'&&a.sourceId===hero.id))suspended=true;
   }
   expect(hero.cooldowns.has(c.id),c.id+' original Sim cast failed').toBe(true);
   if(c.cls==='paladin'){
    expect(marked,'real original verdict target mark').toBe(true);
    expect(hurt,'real source weapon strike').toBe(true);
   }
   if(c.cls==='hunter'){
    expect(hurt,'real native shrapnel hit').toBe(true);
    expect(neighbor,'real splash damage on second original mob').toBe(true);
    expect(fxAtTarget,'native original nova centered on selected mob').toBe(true);
   }
   if(c.cls==='mage'){
    expect(suspended,'native Hourglass must suspend the aimed living mob').toBe(true);
    expect(aura,'real original Phoenix selfBuff aura').toBe(true);
   }
  },25000);
 }
 for(const level of [30,99]){
  it('hf_mage_u2 LV'+level+' places ORIGINAL pending hourglass on EMPTY ground',()=>{
   const sim=new Sim({seed:222211+level,playerClass:'mage',autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const hero=sim.player;hero.resource=hero.maxResource;
   const aim={x:hero.pos.x+16,z:hero.pos.z+8};
   sim.castAbility('hf_mage_u2',hero.id,aim);
   let field=false;
   for(let tick=0;tick<6;tick++){
    sim.tick();
    // Native pending area exists ONLY for unoccupied ground; never invent
    // a synthetic zone to make the targeted-hostile test appear to pass.
    if(sim.activeTemporalHourglasses.some(h=>
      Math.abs(h.pos.x-aim.x)<0.5&&Math.abs(h.pos.z-aim.z)<0.5))field=true;
   }
   expect(hero.cooldowns.has('hf_mage_u2')).toBe(true);
   expect(field,'source Hourglass pending area must appear on EMPTY ground').toBe(true);
  },25000);
 }
 it('rejects missing original donor without any partial registration',()=>{
  const abilities={...ABILITIES};
  for(const id of SF22_IDS)delete abilities[id];
  delete abilities.temporal_hourglass;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cl,c] of Object.entries(CLASSES))
   classes[cl as PlayerClass]={abilities:c.abilities.filter(id=>
    !SF22_IDS.includes(id as typeof SF22_IDS[number]))};
  const before=Object.keys(abilities).length;
  expect(()=>installSf22ThreeNative(abilities,classes))
   .toThrow(/original donor missing or changed/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF22_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
