/** SF15: same frozen ClaudeCraft Sim, no fake 8/8 declarations.
 * Tests all 8 at original HIGHFLY unlock & LV99, no Pages writes.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass,Entity} from '../src/sim/types';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
import {installSf13Compatible} from '../src/highfly/sf13_mass_native_gate';
import {installSf14HandAdapters} from '../src/highfly/sf14_hand_native_adapters';
import {SF15_IDS,installSf15EightNative} from '../src/highfly/sf15_eight_native_batch';
const CASES=[
 {id:'hf_warrior_s4',cls:'warrior',lv:15,mode:'self'},
 {id:'hf_warrior_s5',cls:'warrior',lv:20,mode:'enemy'},
 {id:'hf_paladin_s2',cls:'paladin',lv:5,mode:'enemy'},
 {id:'hf_paladin_s3',cls:'paladin',lv:10,mode:'self'},
 {id:'hf_rogue_s1',cls:'rogue',lv:1,mode:'enemy'},
 {id:'hf_priest_s5',cls:'priest',lv:20,mode:'self'},
 {id:'hf_druid_s5',cls:'druid',lv:20,mode:'self'},
 {id:'hf_warlock_u2',cls:'warlock',lv:30,mode:'self'}
] as const;
let registered:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(id=>id.startsWith('hf_'))).toHaveLength(0);
 registered.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 registered.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 registered.push(...installSf13Compatible(ABILITIES,CLASSES));
 registered.push(...installSf14HandAdapters(ABILITIES,CLASSES));
 expect(registered).toHaveLength(20);
 registered.push(...installSf15EightNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(28);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const at=list.indexOf(id);if(at>=0)list.splice(at,1);
 }
});
function dummy(sim:Sim,id:number,distance:number):Entity{
 const hero=sim.player;
 const target=createMob(id,MOBS.training_dummy,20,
  {x:hero.pos.x,y:hero.pos.y,z:hero.pos.z+distance});
 target.hostile=true;target.aiState='idle';target.maxHp=target.hp=100000;
 target.facing=0;
 sim.addEntity(target);
 return target;
}
describe('SF15 eight REAL source-effect special adapters',()=>{
 it('has exactly eight catalog contracts & preserves nine classes',()=>{
  expect(SF15_IDS).toHaveLength(8);
  expect(new Set(SF15_IDS).size).toBe(8);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(new Set(registered).size).toBe(28);
  expect(ABILITIES.hf_warrior_s4.effects.map(e=>e.type)).toEqual(['selfBuff','aoeDamage']);
  expect(ABILITIES.hf_warrior_s5.effects.map(e=>e.type)).toEqual([
   'aoeDamage','selfBuff','weaponStrike','weaponStrike','weaponStrike','enrageChance'
  ]);
  expect(ABILITIES.hf_paladin_s2.effects.map(e=>e.type)).toEqual(['directDamage','chainDamage']);
  expect(ABILITIES.hf_paladin_s3.effects.map(e=>e.type)).toEqual([
   'selfBuff','absorb','threatPulse','buffTarget']);
  expect(ABILITIES.hf_rogue_s1.effects.map(e=>e.type)).toEqual(['weaponStrike']);
  expect(ABILITIES.hf_priest_s5.effects.map(e=>e.type)).toEqual(['aoeHeal','aoeDamage','buffTarget']);
  expect(ABILITIES.hf_druid_s5.effects.map(e=>e.type)).toEqual(['selfBuff','selfBuff','selfBuff']);
  expect(ABILITIES.hf_warlock_u2.effects.map(e=>e.type)).toEqual(['armyOfDead','summonUndead']);
 });
 for(const c of CASES)for(const level of [c.lv,99]){
  it(c.id+' LV'+level+' spellbook, 10-slot bar, source cast and cooldown',()=>{
   const d=ABILITIES[c.id];
   expect(d).toBeDefined();
   expect(abilitiesKnownAt(c.cls,level).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,2)[2])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:150010+level+CASES.indexOf(c)*111,playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const hero=sim.player;hero.resource=hero.maxResource;hero.hitBonus=1;hero.facing=0;
   hero.hp=Math.max(1,Math.round(hero.maxHp*.6));
   const target=d.requiresTarget?dummy(sim,159000+level+CASES.indexOf(c)*111,
     c.cls==='paladin'?8:3):null;
   const areaTarget=['hf_warrior_s4','hf_priest_s5'].includes(c.id)
    ?dummy(sim,169000+level+CASES.indexOf(c)*111,4):null;
   if(target)sim.targetEntity(target.id,hero.id);
   const originalHp=target?.hp??areaTarget?.hp??0;
   sim.castAbility(c.id,hero.id);
   let damage=0,observedDamage=false,observedHeal=false,observedAura=false;
   for(let tick=0;tick<95;tick++){
    for(const e of sim.tick()){
     if(e.type==='damage'&&e.sourceId===hero.id) {damage+=e.amount;observedDamage=true;}
     if(e.type==='heal2'&&e.sourceId===hero.id&&e.targetId===hero.id&&e.amount>0)observedHeal=true;
    }
    if(hero.auras.length>0)observedAura=true;
   }
   expect(hero.cooldowns.has(c.id),c.id+' LV'+level+' failed to cast in original Sim')
    .toBe(true);
   if(['hf_warrior_s4','hf_warrior_s5','hf_paladin_s2','hf_priest_s5'].includes(c.id)){
    expect(observedDamage,c.id+' LV'+level+' missing actual enemy damage').toBe(true);
    expect(damage).toBeGreaterThan(0);
   }
   if(['hf_paladin_s3','hf_druid_s5'].includes(c.id))
    expect(observedAura,c.id+' LV'+level+' missing actual defensive/form auras').toBe(true);
   if(c.id==='hf_rogue_s1'){
    expect(d.effects[0].type).toBe('weaponStrike');
    expect(observedDamage).toBe(true);
   }
   if(c.id==='hf_priest_s5')expect(observedHeal).toBe(true);
   if(c.id==='hf_warlock_u2')expect(d.effects.length).toBe(2);
  },25000);
 }
 it('rejects missing donor without mutating the registry',()=>{
  const abilities={...ABILITIES};
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [key,value] of Object.entries(CLASSES))
   classes[key as PlayerClass]={abilities:[...value.abilities].filter(id=>!SF15_IDS.includes(id as typeof SF15_IDS[number]))};
  for(const id of SF15_IDS)delete abilities[id];
  delete abilities.holy_shield;
  const before=Object.keys(abilities).length;
  expect(()=>installSf15EightNative(abilities,classes)).toThrow(/missing or changed original source/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF15_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
