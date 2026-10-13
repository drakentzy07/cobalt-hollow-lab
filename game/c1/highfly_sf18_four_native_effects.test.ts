/** HIGHFLY SF18: three NEW original-Sim skills; Hunter U1 blocked / LV unlock and LV99.
 * No altered monsters or fake damage; inspect actual auras, damage and trap.
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
import {installSf16UniqueNative} from '../src/highfly/sf16_eight_support_elemental';
import {installSf17ThreeNative} from '../src/highfly/sf17_three_unique_native';
import {SF18_IDS,installSf18ThreeNative} from '../src/highfly/sf18_four_native_effects';
const CASES=[
 {id:'hf_hunter_s3',cls:'hunter',lv:10},
 {id:'hf_shaman_s5',cls:'shaman',lv:20},
 {id:'hf_mage_s2',cls:'mage',lv:5}
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
 expect(registered).toHaveLength(32);
 expect(SF18_IDS.some(x=>registered.includes(x))).toBe(false);
 registered.push(...installSf18ThreeNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(35);
 expect(new Set(registered).size).toBe(35);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const index=list.indexOf(id);if(index>=0)list.splice(index,1);
 }
});
describe('SF18 three source-valid original native fusion source mechanics',()=>{
 it('keeps 9 classes and four correct source shapes',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF18_IDS).toHaveLength(3);
  expect(ABILITIES.hf_hunter_s3.effects.map(e=>e.type))
   .toEqual(['frostjawTrap','directDamage','slow']);
  // A six-tick rapid-fire channel cannot dispatch a second selfBuff effect:
  // fail closed instead of registering an ability that loses half its identity.
  expect(SF18_IDS).not.toContain('hf_hunter_u1');
  expect(ABILITIES.hf_hunter_u1).toBeUndefined();
  expect(ABILITIES.hf_mage_s2.channel?.ticks).toBe(3);
  expect(ABILITIES.hf_shaman_s5.effects.map(e=>e.type))
   .toEqual(['selfBuff','directDamage','slow']);
 });
 for(const c of CASES)for(const lv of [c.lv,99]){
  it(c.id+' LV'+lv+' real hostile original-Sim cast, source mechanics and HUD',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,3)[3])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:180010+lv+CASES.indexOf(c)*100,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.hitBonus=1;p.facing=0;p.resource=p.maxResource;
   const m=createMob(180510+lv+CASES.indexOf(c)*100,MOBS.training_dummy,20,
    {x:p.pos.x,y:p.pos.y,z:p.pos.z+12});
   m.hostile=true;m.aiState='idle';m.maxHp=m.hp=100000;
   sim.addEntity(m);sim.targetEntity(m.id,p.id);
   sim.castAbility(c.id,p.id);
   let damage=0,trap=false,speed=false,slow=false,minHp=m.hp;
   for(let i=0;i<135;i++){
    for(const e of sim.tick()){
     if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===m.id)
      damage+=e.amount;
    }
    // training_dummy restores to full out of combat: capture the lowest HP
    // while the original damage event is applied, never just the final tick.
    minHp=Math.min(minHp,m.hp);
    // Read-only diagnostic view of a private native-Sim collection.
    // Do not modify runtime visibility or fake a trap instance.
    const realGroundEffects=(sim as unknown as {groundAoEs:readonly {
      hunterTrap?:{abilityId:string}
    }[]}).groundAoEs;
    if(realGroundEffects.some(e=>e.hunterTrap?.abilityId===c.id))trap=true;
    if(p.auras.some(e=>e.kind==='buff_speed'))speed=true;
    if(m.auras.some(e=>e.kind==='slow'))slow=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' did not execute').toBe(true);
   expect(damage,c.id+' must hit a REAL mob').toBeGreaterThan(0);
   expect(minHp,c.id+' target must actually lose HP before dummy reset')
    .toBeLessThan(m.maxHp);
   if(c.id==='hf_hunter_s3')expect(trap,'native armed Frostjaw trap').toBe(true);
   if(c.id==='hf_shaman_s5'){
    expect(speed,'native Shadewolf mobility buff must apply').toBe(true);
    expect(slow,'native Frost Shock slow must apply').toBe(true);
   }
   if(c.id==='hf_hunter_s3')expect(slow,'native shot slow must apply').toBe(true);
  },25000);
 }
 it('fails atomically without spawning phantom skills when a donor is missing',()=>{
  const abilities={...ABILITIES};
  for(const id of SF18_IDS)delete abilities[id];
  delete abilities.arcane_missiles;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cl,c] of Object.entries(CLASSES))
   classes[cl as PlayerClass]={abilities:c.abilities.filter(id=>
    !SF18_IDS.includes(id as typeof SF18_IDS[number]))};
  const before=Object.keys(abilities).length;
  expect(()=>installSf18ThreeNative(abilities,classes)).toThrow(/missing or changed frozen donor/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF18_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
