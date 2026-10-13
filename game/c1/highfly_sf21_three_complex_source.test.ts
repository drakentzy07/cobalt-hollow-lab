/** SF21: REAL source Sim condition/proc/aura/guardian tests at unlock + 99. */
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
import {SF21_IDS,installSf21ThreeNative} from '../src/highfly/sf21_three_complex_source';
const CASES=[
 {id:'hf_paladin_u2',cls:'paladin',unlock:30},
 {id:'hf_hunter_u2',cls:'hunter',unlock:30},
 {id:'hf_warlock_s4',cls:'warlock',unlock:15}
] as const;
let registered:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'))).toHaveLength(0);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf13Compatible(ABILITIES,CLASSES));
 registered.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 registered.push(...installSf15EightNative(ABILITIES,CLASSES));
 registered.push(...installSf16UniqueNative(ABILITIES,CLASSES));
 registered.push(...installSf17ThreeNative(ABILITIES,CLASSES));
 registered.push(...installSf18ThreeNative(ABILITIES,CLASSES));
 registered.push(...installSf19TwoNative(ABILITIES,CLASSES));
 registered.push(...installSf20TwoNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(39);
 expect(SF21_IDS.some(x=>registered.includes(x))).toBe(false);
 registered.push(...installSf21ThreeNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(42);
 expect(new Set(registered).size).toBe(42);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const p=list.indexOf(id);if(p>=0)list.splice(p,1);
 }
});
describe('SF21 3 original-source guardians/devotion/affliction fusions',()=>{
 it('keeps nine classes and original donor effect types',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(ABILITIES.hf_paladin_u2.effects.map(x=>x.type))
   .toEqual(['grantDevotion','divineAscension','selfBuff','selfBuff']);
  expect(ABILITIES.hf_hunter_u2.effects.map(x=>x.type))
   .toEqual(['hunterStampede','packCommand']);
  expect(ABILITIES.hf_warlock_s4.effects.map(x=>x.type))
   .toEqual(['afflictionEvilEye','incapacitate']);
  const a=ABILITIES.hf_paladin_u2.effects;
  expect(a[2].type==='selfBuff'&&a[2].auraId).toBe('hf_paladin_u2_damage');
  expect(a[3].type==='selfBuff'&&a[3].auraId).toBe('hf_paladin_u2_healing');
 });
 for(const c of CASES)for(const lv of [c.unlock,99]){
  it(c.id+' LV'+lv+' casts ORIGINAL mechanics + source FX + 10-slot HUD',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.unlock-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,4)[4])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:210010+lv+CASES.indexOf(c)*100,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;p.facing=0;
   const m=createMob(210510+lv+CASES.indexOf(c)*100,MOBS.training_dummy,20,
    {x:p.pos.x,y:p.pos.y,z:p.pos.z+8});
   m.hostile=true;m.aiState='idle';m.hp=m.maxHp=100000;
   sim.addEntity(m);
   if(c.cls==='paladin'){
    expect(p.paladinDevotion).toBeDefined();
    p.paladinDevotion!.value=10;
   }
   if(c.cls==='hunter'){
    const pet=createMob(212510+lv,MOBS.forest_wolf,20,
     {x:p.pos.x+1,y:p.pos.y,z:p.pos.z+2});
    pet.hostile=false;pet.ownerId=p.id;pet.hp=pet.maxHp=1000;
    sim.addEntity(pet);
    expect(sim.petOf(p.id)?.id).toBe(pet.id);
    p.resource=0;
   }
   if(d.requiresTarget)sim.targetEntity(m.id,p.id);
   sim.castAbility(c.id,p.id);
   let ascend=false,damageBuff=false,healBuff=false,originalFx=false;
   let guardianCount=0,ferocity=false,eye=false,fear=false,damage=0;
   for(let i=0;i<110;i++){
    for(const ev of sim.tick()){
     if(ev.type==='damage'&&ev.targetId===m.id)damage+=ev.amount;
     if(ev.type==='spellfx'&&ev.fx==='paladinAscensionStart')originalFx=true;
     if(ev.type==='spellfx'&&ev.fx==='echoBurst')originalFx=true;
    }
    if((p.paladinDevotion?.ascensionCharges??0)>0)ascend=true;
    if(p.auras.some(x=>x.kind==='buff_dmg_done'))damageBuff=true;
    if(p.auras.some(x=>x.kind==='buff_healing_done'))healBuff=true;
    guardianCount=Math.max(guardianCount,[...sim.entities.values()]
     .filter(x=>x.ownerId===p.id&&x.guardianState?.key.startsWith('stampede')).length);
    if(p.auras.some(x=>x.id==='pack_ferocity'))ferocity=true;
    if(m.auras.some(x=>x.kind==='affliction_eye'))eye=true;
    if(m.auras.some(x=>x.kind==='incapacitate'))fear=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' native cooldown not armed').toBe(true);
   if(c.cls==='paladin'){
    expect(ascend,'real Devotion/Ascension controller did not activate').toBe(true);
    expect(damageBuff).toBe(true);expect(healBuff).toBe(true);
    expect(originalFx,'original ClaudeCraft ascension FX event').toBe(true);
   } else if(c.cls==='hunter'){
    expect(guardianCount,'three REAL guardian mobs expected').toBe(3);
    expect(ferocity,'native Pack Command pet hit/ferocity did not fire').toBe(true);
    expect(damage,'real living pet and guardians must hit enemy').toBeGreaterThan(0);
    expect(originalFx,'original guardian echoBurst FX event').toBe(true);
   } else {
    expect(eye,'original affliction eye aura').toBe(true);
    expect(fear,'original controlled fear aura').toBe(true);
   }
  },25000);
 }
 it('rejects missing donor atomically',()=>{
  const abilities={...ABILITIES};for(const id of SF21_IDS)delete abilities[id];
  delete abilities.ghost_wolf;delete abilities.avenging_wrath;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cl,c] of Object.entries(CLASSES))
   classes[cl as PlayerClass]={abilities:c.abilities.filter(id=>
    !SF21_IDS.includes(id as typeof SF21_IDS[number]))};
  const n=Object.keys(abilities).length;
  expect(()=>installSf21ThreeNative(abilities,classes))
   .toThrow(/frozen source contract violated/);
  expect(Object.keys(abilities)).toHaveLength(n);
  expect(SF21_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
