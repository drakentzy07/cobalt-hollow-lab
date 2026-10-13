/** SF19: source-native cast/resource/combo behavior, not registry-only tests. */
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
import {SF19_IDS,installSf19TwoNative} from '../src/highfly/sf19_two_melee_native';
const CASES=[
 {id:'hf_warrior_s2',cls:'warrior',lv:5},
 {id:'hf_rogue_u1',cls:'rogue',lv:25}
] as const;
let registered:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(id=>id.startsWith('hf_'))).toHaveLength(0);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf13Compatible(ABILITIES,CLASSES));
 registered.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 registered.push(...installSf15EightNative(ABILITIES,CLASSES));
 registered.push(...installSf16UniqueNative(ABILITIES,CLASSES));
 registered.push(...installSf17ThreeNative(ABILITIES,CLASSES));
 registered.push(...installSf18ThreeNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(35);
 expect(SF19_IDS.every(id=>!registered.includes(id))).toBe(true);
 registered.push(...installSf19TwoNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(37);
 expect(new Set(registered).size).toBe(37);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const at=list.indexOf(id);if(at>=0)list.splice(at,1);
 }
});
describe('SF19 two unregistered native original melee resource fusions',()=>{
 it('preserves nine original classes, source effects, distinct skill IDs',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF19_IDS).toEqual(['hf_warrior_s2','hf_rogue_u1']);
  expect(ABILITIES.hf_warrior_s2.effects.map(e=>e.type))
    .toEqual(['weaponStrike','gainResource','selfBuff']);
  expect(ABILITIES.hf_rogue_u1.effects.map(e=>e.type))
    .toEqual(['gainResource','sunder']);
  expect(ABILITIES.hf_rogue_u1.spendsCombo).toBe(true);
  expect(ABILITIES.hf_warrior_s2.cost).toBe(0);
 });
 for(const c of CASES)for(const lv of [c.lv,99]){
  it(c.id+' LV'+lv+' real Sim melee, cooldown, resource and crowd dynamics',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,2)[2])
     .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:190019+lv+CASES.indexOf(c)*77,
     playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.hitBonus=1;p.facing=0;
   const mob=createMob(190719+lv+CASES.indexOf(c)*77,
    MOBS.training_dummy,20,{x:p.pos.x,y:p.pos.y,z:p.pos.z+3});
   mob.hostile=true;mob.aiState='idle';mob.maxHp=mob.hp=100000;
   sim.addEntity(mob);sim.targetEntity(mob.id,p.id);
   if(c.id==='hf_warrior_s2')p.resource=0;
   else {p.comboPoints=3;p.comboUntil=sim.time+30;p.resource=40;}
   const before=p.resource;
   sim.castAbility(c.id,p.id);
   let dmg=0,empower=false,sunder=false;
   for(let i=0;i<60;i++){
    for(const e of sim.tick()){
     if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===mob.id)
      dmg+=e.amount;
    }
    if(p.auras.some(a=>a.kind==='overpower_charge'))empower=true;
    if(mob.auras.some(a=>a.kind==='sunder'&&(a.stacks??0)>=3))sunder=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' must spend cooldown in ORIGINAL Sim')
     .toBe(true);
   if(c.id==='hf_warrior_s2'){
    expect(dmg,'native melee damage must hit the true target').toBeGreaterThan(0);
    expect(p.resource,'native rage must increase').toBeGreaterThan(before);
    expect(empower,'Redhand buff should apply by native selfBuff').toBe(true);
   }else{
    expect(sunder,'original Rogue per-combo armor debuff needs 3 stacks')
      .toBe(true);
    expect(p.comboPoints,'combo points must be consumed').toBe(0);
    expect(p.resource,'native quickened-blood restore').toBeGreaterThan(before);
   }
  },25000);
 }
 it('blocks missing source atomically',()=>{
  const abilities={...ABILITIES};
  for(const id of SF19_IDS)delete abilities[id];
  delete abilities.overpower;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cls,d] of Object.entries(CLASSES))
   classes[cls as PlayerClass]={abilities:d.abilities.filter(id=>
    !SF19_IDS.includes(id as typeof SF19_IDS[number]))};
  const count=Object.keys(abilities).length;
  expect(()=>installSf19TwoNative(abilities,classes))
    .toThrow(/original donor or ability contract changed/);
  expect(Object.keys(abilities)).toHaveLength(count);
  expect(SF19_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
