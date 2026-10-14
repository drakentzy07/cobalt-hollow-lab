/** HIGHFLY SF26: five source-native mechanics and combat integration. */
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
import {installSf25TwoNative} from '../src/highfly/sf25_shaman_warlock_two_native';
import {SF26_IDS,installSf26FiveNative} from '../src/highfly/sf26_five_native_wave_a';
const installed:string[]=[];
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
 installed.push(...installSf26FiveNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(58);
 expect(new Set(installed).size).toBe(58);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const arr=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);
 }
});


function dummy(sim:Sim,id:number,dist:number,low=false){
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,Math.min(20,Math.max(1,p.level)),
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 m.hostile=true;m.aiState='idle';m.maxHp=500000;m.hp=low?75000:500000;
 sim.addEntity(m);sim.targetEntity(m.id,p.id);
 return m;
}
const TARGETS=[
 {id:'hf_warrior_u2',cls:'warrior',lv:30,dist:10,mode:'aim'},
 {id:'hf_rogue_s3',cls:'rogue',lv:10,dist:3,mode:'target'},
 {id:'hf_warlock_s3',cls:'warlock',lv:10,dist:12,mode:'target'},
 {id:'hf_warlock_u1',cls:'warlock',lv:25,dist:12,mode:'aim'},
 {id:'hf_druid_s4',cls:'druid',lv:15,dist:12,mode:'target'}
] as const;
describe('SF26 FIVE ORIGINAL source combat mechanics',()=>{
 it('58 unique abilities, original nine classes, guarded five source contracts',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF26_IDS).toEqual(TARGETS.map(x=>x.id));
  expect(ABILITIES.hf_warrior_u2.effects[0].type).toBe('repositionToAim');
  expect(ABILITIES.hf_rogue_s3.effects.map(e=>e.type)).toEqual(['dot','imbue']);
  const venom=ABILITIES.hf_rogue_s3.effects[1];
  expect(venom.type==='imbue'&&venom.coat?.rider==='stackDot'&&venom.bonus>0).toBe(true);
  expect(ABILITIES.hf_warlock_s3.effects.map(e=>e.type)).toEqual([
   'lifeTap','drainTick','afflictionCruelPact'
  ]);
  expect(ABILITIES.hf_warlock_s3.channel?.ticks).toBe(3);
  expect(ABILITIES.hf_warlock_u1.effects.map(e=>e.type)).toEqual([
   'groundAoE','directDamage'
  ]);
  expect(ABILITIES.hf_druid_s4.effects.map(e=>e.type)).toEqual(['charge','stun']);
 });
 for(const [n,c] of TARGETS.entries())for(const lv of [c.lv,99]){
  it(c.id+' LV'+lv+' original native Sim hit and spellbook/HUD',()=>{
   const a=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   if(c.lv>1)expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(a)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,4)[4])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:260000+n*1000+lv,playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;p.facing=0;
   const m=dummy(sim,265000+n*1000+lv,c.dist,c.id==='hf_warrior_u2');
   const hpBefore=p.hp;
   if(c.mode==='aim')sim.castAbilityAt(c.id,{x:m.pos.x,z:m.pos.z});
   else sim.castAbility(c.id,p.id);
   let hits=0,cooldown=p.cooldowns.has(c.id),bleed=false,poison=false;
   let charge=false,stun=false,shadowTrade=false,hellfire=false;
   const ticks=c.id==='hf_warlock_u1'?230:190;
   for(let i=0;i<ticks;i++){
    const events=sim.tick();
    if(p.cooldowns.has(c.id))cooldown=true;
    if(p.chargeTargetId===m.id)charge=true;
    if(m.auras.some(x=>x.kind==='stun'))stun=true;
    if(m.auras.some(x=>x.id==='hf_rogue_s3_bleed'&&x.kind==='dot'))bleed=true;
    if(p.auras.some(x=>x.id==='hf_rogue_s3'&&x.kind==='imbue'))poison=true;
    if(p.hp<hpBefore)shadowTrade=true;
    if((sim as unknown as {groundAoEs?:unknown[]}).groundAoEs?.length)hellfire=true;
    for(const ev of events)if(ev.type==='damage'&&ev.sourceId===p.id&&
      ev.targetId===m.id&&ev.amount>0)hits++;
   }
   expect(cooldown,c.id+' native cooldown armed').toBe(true);
   expect(hits,c.id+' must actually damage real mob in frozen Sim').toBeGreaterThan(0);
   if(c.id==='hf_warrior_u2')expect(stun,'faultline after real leap touchdown').toBe(true);
   if(c.id==='hf_rogue_s3'){
    expect(bleed,'original Rupture bleed must apply').toBe(true);
    expect(poison,'original deadly+instant coat must apply').toBe(true);
   }
   if(c.id==='hf_warlock_s3'){
    expect(shadowTrade,'original lifeTap+cruelPact ONE TIME health price').toBe(true);
   }
   if(c.id==='hf_druid_s4'){
    expect(charge,'original bear route really starts').toBe(true);
    expect(p.auras.some(x=>x.kind==='form_bear')).toBe(true);
   }
  },30000);
 }
 it('rejects missing original donor atomically',()=>{
  const a={...ABILITIES};for(const id of SF26_IDS)delete a[id];
  delete a.execute;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cls,c] of Object.entries(CLASSES))classes[cls as PlayerClass]={
   abilities:c.abilities.filter(id=>!SF26_IDS.includes(id as typeof SF26_IDS[number]))
  };
  const before=Object.keys(a).length;
  expect(()=>installSf26FiveNative(a,classes)).toThrow(/SF26_SOURCE_CONTRACT_MISSING_OR_MUTATED/);
  expect(Object.keys(a)).toHaveLength(before);
 });
});
