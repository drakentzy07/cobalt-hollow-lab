/** HIGHFLY SF27: FINAL FIVE native combat, resurrection and guardian simulation. */
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
import {installSf26FiveNative} from '../src/highfly/sf26_five_native_wave_a';
import {SF27_IDS,installSf27FinalFive} from '../src/highfly/sf27_final_five_native';
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
 installed.push(...installSf27FinalFive(ABILITIES,CLASSES));
 expect(installed).toHaveLength(63);
 expect(new Set(installed).size).toBe(63);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const arr=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);
 }
});



function dummy(sim:Sim,id:number,dist:number){
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,Math.min(20,Math.max(1,p.level)),
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 m.hostile=true;m.aiState='idle';m.maxHp=m.hp=500000;
 sim.addEntity(m);sim.targetEntity(m.id,p.id);
 return m;
}
function groupDeadAlly(sim:Sim,pid:number){
 const a=sim.addPlayer('warrior','HF27 Fallen');
 sim.partyInvite(a,pid);sim.partyAccept(a);
 const e=sim.entities.get(a)!;
 e.pos={...sim.player.pos,x:sim.player.pos.x+3};
 e.prevPos={...e.pos};e.dead=true;e.ghost=false;
 e.corpsePos={...e.pos};e.hp=0;e.resource=0;
 return e;
}
const CASES=[
 {id:'hf_rogue_u2',cls:'rogue',lv:30},
 {id:'hf_priest_u1',cls:'priest',lv:25},
 {id:'hf_priest_u2',cls:'priest',lv:30},
 {id:'hf_druid_u1',cls:'druid',lv:25},
 {id:'hf_druid_u2',cls:'druid',lv:30},
] as const;
describe('SF27 all five ORIGINAL native combat and nine-class catalog',()=>{
 it('63 unique spells, nine classes, 7 Highfly actives each with donor-derived effects',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF27_IDS).toEqual(CASES.map(c=>c.id));
  const ids=Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'));
  expect(ids).toHaveLength(63);
  for(const cls of Object.keys(CLASSES)){
   expect(ids.filter(id=>id.startsWith('hf_'+cls+'_'))).toHaveLength(7);
  }
  expect(ABILITIES.hf_rogue_u2.effects.map(e=>e.type)).toEqual([
   'weaponStrike','incapacitate','selfBuff'
  ]);
  expect(ABILITIES.hf_priest_u1.effects.map(e=>e.type)).toEqual([
   'aoeHeal','massResurrectGroup'
  ]);
  expect(ABILITIES.hf_priest_u2.effects.map(e=>e.type)).toEqual(['aoeFear']);
  expect(ABILITIES.hf_druid_u1.effects.map(e=>e.type)).toEqual([
   'resurrectAlly','massResurrectGroup'
  ]);
  expect(ABILITIES.hf_druid_u2.effects.map(e=>e.type)).toEqual([
   'aoeDamage','directDamage','directDamage','extendDot'
  ]);
  expect(ABILITIES.hf_druid_u2.channel?.ticks).toBe(6);
 });
 for(const [n,c] of CASES.entries())for(const lv of [c.lv,99])it(
  c.id+' original native unlock/HUD, LV'+lv,()=>{
   const a=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   if(lv===c.lv)expect(abilitiesKnownAt(c.cls,lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(a)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,5)[5])
    .toEqual({type:'ability',id:c.id});
 },5000);
 for(const level of [30,99])it('Rogue Eclipse source-native Ambush+Blind+short Stealth LV'+level,()=>{
  const sim=new Sim({seed:270100+level,playerClass:'rogue',autoEquip:true});
  sim.setPlayerLevel(level);sim.tick();
  const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;
  const mob=dummy(sim,270400+level,3);
  sim.castAbility('hf_rogue_u2',p.id);
  let strike=false,blind=false,veil=false,cooldown=p.cooldowns.has('hf_rogue_u2');
  for(let i=0;i<35;i++){
   const events=sim.tick();
   if(p.cooldowns.has('hf_rogue_u2'))cooldown=true;
   if(p.auras.some(a=>a.kind==='stealth'))veil=true;
   if(mob.auras.some(a=>a.kind==='incapacitate'))blind=true;
   for(const e of events)if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===mob.id&&e.amount>0)strike=true;
  }
  expect(cooldown).toBe(true);
  expect(strike,'original Ambush weapon strike must land').toBe(true);
  expect(blind,'original Blind follows damage').toBe(true);
  expect(veil,'brief original stealth after strike').toBe(true);
 },18000);
 for(const [klass,id,lv] of [
  ['priest','hf_priest_u1',25],['druid','hf_druid_u1',25]
 ] as const)it(klass+' mass resurrection source returns group from death: '+id,()=>{
  const sim=new Sim({seed:277700+(klass==='priest'?1:2),playerClass:klass,autoEquip:true});
  sim.setPlayerLevel(lv);sim.tick();
  const p=sim.player;p.resource=p.maxResource;
  const fallen=groupDeadAlly(sim,p.id);
  if(id==='hf_priest_u1')sim.castAbility(id,p.id);
  else sim.castAbilityOn(id,fallen.id,p.id);
  let armed=p.cooldowns.has(id);
  for(let i=0;i<185;i++){
   sim.tick();if(p.cooldowns.has(id))armed=true;
  }
  expect(armed,'mass-resurrection original cast must consume cooldown').toBe(true);
  expect(sim.pendingResurrections.has(fallen.id),'dead party member offered original source resurrection').toBe(true);
 },20000);
 for(const level of [25,99])it('Druid Wildwake battle-rez ONE ally (never group), LV'+level,()=>{
  const sim=new Sim({seed:278900+level,playerClass:'druid',autoEquip:true});
  sim.setPlayerLevel(level);sim.tick();
  const p=sim.player;p.resource=p.maxResource;
  const fallen=groupDeadAlly(sim,p.id);
  p.inCombat=true;p.combatTimer=70;
  sim.castAbilityOn('hf_druid_u1',fallen.id,p.id);
  for(let i=0;i<90;i++)sim.tick();
  expect(sim.pendingResurrections.has(fallen.id),'battle-rez must work').toBe(true);
 },18000);
 for(const level of [30,99])it('Druid six original Hurricane ticks + ONE Starfire/Moonseed burst LV'+level,()=>{
  const sim=new Sim({seed:279100+level,playerClass:'druid',autoEquip:true});
  sim.setPlayerLevel(level);sim.tick();
  const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;
  const mob=dummy(sim,279500+level,12);
  sim.castAbilityAt('hf_druid_u2',{x:mob.pos.x,z:mob.pos.z});
  let hits=0,armed=p.cooldowns.has('hf_druid_u2'),started=false;
  for(let i=0;i<160;i++){
   const events=sim.tick();
   if(p.cooldowns.has('hf_druid_u2'))armed=true;
   for(const e of events){
    if(e.type==='castStart'&&e.ability==='hf_druid_u2')started=true;
    if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===mob.id&&e.amount>0)hits++;
   }
  }
  expect(armed).toBe(true);
  expect(started,'real source channel starts').toBe(true);
  expect(hits,'native stellar burst plus hurricane pulses').toBeGreaterThanOrEqual(6);
 },20000);
 it('atomic refusal if last five source original donor missing',()=>{
  const a={...ABILITIES};for(const id of SF27_IDS)delete a[id];
  delete a.prayer_of_healing;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cls,c] of Object.entries(CLASSES))classes[cls as PlayerClass]={
   abilities:c.abilities.filter(id=>!SF27_IDS.includes(id as typeof SF27_IDS[number]))
  };
  const n=Object.keys(a).length;
  expect(()=>installSf27FinalFive(a,classes))
   .toThrow(/SF27_SOURCE_DONOR_MISSING_OR_CHANGED/);
  expect(Object.keys(a)).toHaveLength(n);
 });
});
