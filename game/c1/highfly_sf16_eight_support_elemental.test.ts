/**
 * HIGHFLY SF16 three NEW original-source mechanics: unlock, actual damage,
 * shield/HoT, spells, support, movement and combat gates. No mock Sim.
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
import {installSf15EightNative} from '../src/highfly/sf15_eight_native_batch';
import {SF16_IDS,installSf16EightNative} from '../src/highfly/sf16_eight_support_elemental';
const CASES=[
 {id:'hf_paladin_s5',cls:'paladin',lv:20,mode:'enemy'},
 {id:'hf_shaman_s2',cls:'shaman',lv:5,mode:'enemy'},
 {id:'hf_warlock_s1',cls:'warlock',lv:1,mode:'enemy'}
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
 expect(registered).toHaveLength(28);
 registered.push(...installSf16EightNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(31);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const idx=list.indexOf(id);if(idx>=0)list.splice(idx,1);
 }
});
function target(sim:Sim,id:number,dist:number):Entity{
 const p=sim.player;
 const m=createMob(id,MOBS.training_dummy,20,
  {x:p.pos.x,y:p.pos.y,z:p.pos.z+dist});
 m.hostile=true;m.aiState='idle';m.hp=m.maxHp=100000;
 sim.addEntity(m);return m;
}
describe('SF16 — three distinct native support/elemental skills in original real Sim',()=>{
 it('atomically registers precisely three new, preserves all nine original classes',()=>{
  expect(SF16_IDS).toHaveLength(3);
  expect(new Set(registered).size).toBe(31);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(ABILITIES.hf_paladin_s5.effects.map(x=>x.type)).toEqual(['selfBuff','stun']);
  expect(ABILITIES.hf_shaman_s2.effects.map(x=>x.type)).toEqual(['directDamage','dot']);
  expect(ABILITIES.hf_warlock_s1.effects.map(x=>x.type)).toEqual(['directDamage']);
 });
 for(const c of CASES)for(const level of [c.lv,99]){
  it(c.id+' LV'+level+' learns, casts and causes correct native Sim result',()=>{
   const d=ABILITIES[c.id];expect(d).toBeDefined();
   expect(abilitiesKnownAt(c.cls,level).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,3)[3])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:160000+level+CASES.indexOf(c)*211,playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(level);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.hitBonus=1;p.facing=0;
   p.hp=Math.max(1,Math.round(p.maxHp*.4));
   const oldHp=p.hp,oldMaxHp=p.maxHp,oldZ=p.pos.z;
   const m=c.mode==='enemy'?target(sim,161000+level+CASES.indexOf(c)*211,
    c.id==='hf_paladin_s5'?8:12):null;
   if(m)sim.targetEntity(m.id,p.id);
   if(c.mode==='friendly')sim.castAbilityOn(c.id,p.id,p.id);
   else sim.castAbility(c.id,p.id);
   let damage=0,healing=0,seenSpeed=false,seenStun=false;
   for(let tick=0;tick<105;tick++){
    for(const ev of sim.tick()){
     if(ev.type==='damage'&&ev.sourceId===p.id&&m&&ev.targetId===m.id)
      damage+=ev.amount;
     if(ev.type==='heal2'&&ev.sourceId===p.id&&ev.targetId===p.id)
      healing+=ev.amount;
    }
    if(p.auras.some(a=>a.kind==='buff_speed'))seenSpeed=true;
    if(m?.auras.some(a=>a.kind==='stun'))seenStun=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' cast did not execute').toBe(true);
   if(['hf_priest_s2','hf_shaman_s2','hf_warlock_s1'].includes(c.id)){
    expect(damage,c.id+' must damage a REAL mob').toBeGreaterThan(0);
    expect(m?.hp).toBeLessThan(m?.maxHp??0);
   }
   if(c.id==='hf_paladin_s5'){
    expect(seenSpeed).toBe(true);
    expect(seenStun).toBe(true);
   }
   if(c.id==='hf_priest_s3'){
    expect(p.auras.some(a=>a.kind==='absorb')).toBe(true);
    expect(p.auras.some(a=>a.kind==='hot')).toBe(true);
   }
   if(c.id==='hf_shaman_s3'){
    expect(healing).toBeGreaterThan(0);
    expect(p.hp).toBeGreaterThan(oldHp);
   }
   if(c.id==='hf_warrior_u1'){
    expect(p.maxHp).toBeGreaterThanOrEqual(oldMaxHp);
    expect(p.auras.some(a=>a.kind==='buff_ap_pct')).toBe(true);
   }
   if(c.id==='hf_mage_s3')expect(Math.abs(p.pos.z-oldZ)).toBeGreaterThan(5);
  },25000);
 }
 it('fails as a unit on missing donors without half-registering',()=>{
  const abilities={...ABILITIES};
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [id,c] of Object.entries(CLASSES))
   classes[id as PlayerClass]={abilities:c.abilities.filter(x=>
    !SF16_IDS.includes(x as typeof SF16_IDS[number]))};
  for(const id of SF16_IDS)delete abilities[id];
  delete abilities.lava_burst;
  const before=Object.keys(abilities).length;
  expect(()=>installSf16EightNative(abilities,classes)).toThrow(/missing exact original donor/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF16_IDS.every(x=>!abilities[x])).toBe(true);
 });
});
