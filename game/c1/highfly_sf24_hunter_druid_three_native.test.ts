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
import {SF24_IDS,installSf24ThreeNative} from '../src/highfly/sf24_hunter_druid_three_native';
const CASES=[
 {id:'hf_hunter_u1',cls:'hunter',lv:25},
 {id:'hf_druid_s1',cls:'druid',lv:1},
 {id:'hf_druid_s2',cls:'druid',lv:5}
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
 installed.push(...installSf23ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(48);
 installed.push(...installSf24ThreeNative(ABILITIES,CLASSES));
 expect(installed).toHaveLength(51);
 expect(new Set(installed).size).toBe(51);
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
 const mob=createMob(id,MOBS.training_dummy,Math.min(20,Math.max(1,p.level)),
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 mob.hostile=true;mob.aiState='idle';mob.maxHp=mob.hp=500000;
 sim.addEntity(mob);sim.targetEntity(mob.id,p.id);
 return mob;
}
describe('SF24 Hunter six-shot, Druid lunar and twin dot ORIGINAL Sim',()=>{
 it('51 unique IDs, nine classes and guarded original native effect shapes',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF24_IDS).toEqual(['hf_hunter_u1','hf_druid_s1','hf_druid_s2']);
  expect(ABILITIES.hf_hunter_u1.channel?.ticks).toBe(6);
  expect(ABILITIES.hf_hunter_u1.effects.map(e=>e.type))
   .toEqual(['directDamage','selfBuff']);
  expect(ABILITIES.hf_druid_s1.effects.map(e=>e.type))
   .toEqual(['weaponStrike','directDamage','dot']);
  expect(ABILITIES.hf_druid_s2.effects.map(e=>e.type))
   .toEqual(['weaponStrike','dot','dot','selfBuff']);
  expect(ABILITIES.hf_druid_s2.effects[1].type==='dot'&&
   ABILITIES.hf_druid_s2.effects[2].type==='dot'&&
   ABILITIES.hf_druid_s2.effects[1].auraId!==
   ABILITIES.hf_druid_s2.effects[2].auraId).toBe(true);
 });
 for(const c of CASES)for(const level of [c.lv,99]){
  it(c.id+' LV'+level+' actually casts in source Sim, spellbook and HUD',()=>{
   const ability=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,level).some(x=>x.def.id===c.id)).toBe(true);
   if(c.lv>1)expect(abilitiesKnownAt(c.cls,c.lv-1)
    .some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(ability)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,4)[4])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:240000+level+CASES.indexOf(c)*1000,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.facing=0;p.hitBonus=1;
   const mob=target(sim,241000+level+CASES.indexOf(c)*1000,
    c.cls==='hunter'?12:3);
   sim.castAbility(c.id,p.id);
   let hits=0,moon=false,rake=false,swarm=false,thorns=false,trail=false;
   // Confirm cooldown was actually ARMED during the cast. Garra Lunar's
   // native 4s cooldown is allowed to expire in the later 110-tick DoT
   // observation window; reading the map only at the end was a false RED.
   let cooldownArmed=p.cooldowns.has(c.id);
   const ticks=c.cls==='hunter'?230:110;
   for(let i=0;i<ticks;i++){
    const events=sim.tick();
    if(p.cooldowns.has(c.id))cooldownArmed=true;
    for(const ev of events){
     if(ev.type==='damage'&&ev.sourceId===p.id&&ev.targetId===mob.id&&
       ev.ability===ability.name&&ev.amount>0)hits++;
    }
    if(mob.auras.some(a=>a.id==='hf_druid_s1_lunar'&&a.kind==='dot'))moon=true;
    if(mob.auras.some(a=>a.id==='hf_druid_s2_rake'&&a.kind==='dot'))rake=true;
    if(mob.auras.some(a=>a.id==='hf_druid_s2_swarm'&&a.kind==='dot'&&
      a.school==='nature'))swarm=true;
    if(p.auras.some(a=>a.kind==='thorns'&&a.sourceId===p.id))thorns=true;
    if(p.auras.some(a=>a.kind==='hunter_bloodtrail'))trail=true;
   }
   expect(cooldownArmed,c.id+' native cast must arm cooldown').toBe(true);
   expect(hits,c.id+' native damage must land in combat').toBeGreaterThan(0);
   if(c.cls==='hunter'){
    expect(hits,'6 source channel shots (at least 4 must land)').toBeGreaterThanOrEqual(4);
    expect(trail,'native original Bloodtrail selfBuff must remain').toBe(true);
   }
   if(c.id==='hf_druid_s1')expect(moon,'native original lunar DoT').toBe(true);
   if(c.id==='hf_druid_s2'){
    expect(rake,'native source Rake blood DoT').toBe(true);
    expect(swarm,'native source Insect nature DoT must be independent').toBe(true);
    expect(thorns,'native Thorns stays on CASTER, never hostile').toBe(true);
    expect(mob.auras.some(a=>a.kind==='thorns')).toBe(false);
   }
  },25000);
 }
 it('fails closed atomically when a required original donor is missing',()=>{
  const abilities={...ABILITIES};
  for(const id of SF24_IDS)delete abilities[id];
  delete abilities.insect_swarm;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cls,c] of Object.entries(CLASSES))
   classes[cls as PlayerClass]={abilities:c.abilities.filter(id=>
     !SF24_IDS.includes(id as typeof SF24_IDS[number]))};
  const before=Object.keys(abilities).length;
  expect(()=>installSf24ThreeNative(abilities,classes))
   .toThrow(/SF24 source contract missing\/mutated/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF24_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
