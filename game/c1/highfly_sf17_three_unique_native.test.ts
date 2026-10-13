/** SF17 independent real frozen ClaudeCraft simulation.
 * Exact LV unlock and LV99, 10-slot HUD, actual damage/aura/resource/cooldown.
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
import {SF17_IDS,installSf17ThreeNative} from '../src/highfly/sf17_three_unique_native';
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
 expect(registered).toHaveLength(29);
 expect(registered.some(x=>SF17_IDS.includes(x as typeof SF17_IDS[number]))).toBe(false);
 registered.push(...installSf17ThreeNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(32);
 expect(new Set(registered).size).toBe(32);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const list=CLASSES[id.split('_')[1] as PlayerClass].abilities;
  const at=list.indexOf(id);if(at>=0)list.splice(at,1);
 }
});
describe('SF17 three truly NEW native fusions, level 1-99',()=>{
 it('all three IDs were not previously certified and remain 9 original classes',()=>{
  expect(SF17_IDS).toHaveLength(3);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(ABILITIES.hf_hunter_s1.effects.map(e=>e.type))
   .toEqual(['directDamage','gainResource']);
  expect(ABILITIES.hf_shaman_u1.effects.map(e=>e.type))
   .toEqual(['groundAoE','aoeDamage','aoeSlow']);
  expect(ABILITIES.hf_shaman_u2.effects.map(e=>e.type))
   .toEqual(['aoeAllyHaste','selfBuff']);
 });
 for(const c of [
  {id:'hf_hunter_s1',cls:'hunter',lv:1},
  {id:'hf_shaman_u1',cls:'shaman',lv:25},
  {id:'hf_shaman_u2',cls:'shaman',lv:30}
 ] as const)for(const lv of [c.lv,99]){
  it(c.id+' LV'+lv+' original SIM and HUD behavior',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.lv-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,1)[1])
    .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:170010+lv+SF17_IDS.indexOf(c.id)*100,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.facing=0;p.hitBonus=1;p.resource=p.maxResource;
   const m=createMob(170510+lv+SF17_IDS.indexOf(c.id)*100,MOBS.training_dummy,20,
    {x:p.pos.x,y:p.pos.y,z:p.pos.z+12});
   m.hostile=true;m.aiState='idle';m.maxHp=m.hp=100000;
   sim.addEntity(m);
   if(d.requiresTarget)sim.targetEntity(m.id,p.id);
   if(c.id==='hf_shaman_u1')sim.castAbility(c.id,p.id,{x:m.pos.x,z:m.pos.z});
   else sim.castAbility(c.id,p.id);
   let dealt=0,haste=false,spellHaste=false,dr=false,sated=false,slow=false;
   for(let tick=0;tick<110;tick++){
    for(const e of sim.tick()){
     if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===m.id)dealt+=e.amount;
    }
    if(p.auras.some(a=>a.kind==='buff_haste'))haste=true;
    if(p.auras.some(a=>a.kind==='buff_spellhaste'))spellHaste=true;
    if(p.auras.some(a=>a.kind==='buff_dr'))dr=true;
    if(p.auras.some(a=>a.kind==='sated'))sated=true;
    if(m.auras.some(a=>a.kind==='slow'))slow=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' original Sim cast was not accepted').toBe(true);
   if(c.id==='hf_hunter_s1'||c.id==='hf_shaman_u1'){
    expect(dealt,c.id+' must cause real enemy damage').toBeGreaterThan(0);
    expect(m.hp).toBeLessThan(m.maxHp);
   }
   if(c.id==='hf_shaman_u2'){
    expect(haste,'group attack haste must apply in original Sim').toBe(true);
    expect(spellHaste,'group spell haste must apply').toBe(true);
    expect(sated,'shared exhaustion must apply').toBe(true);
    expect(dr,'self defensive trance must apply').toBe(true);
   }
  },25000);
 }
 it('fails atomically if one donor is removed',()=>{
  const abilities={...ABILITIES};
  for(const id of SF17_IDS)delete abilities[id];
  delete abilities.thunderstorm;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [cl,c] of Object.entries(CLASSES))
   classes[cl as PlayerClass]={abilities:c.abilities.filter(x=>
    !SF17_IDS.includes(x as typeof SF17_IDS[number]))};
  const before=Object.keys(abilities).length;
  expect(()=>installSf17ThreeNative(abilities,classes))
   .toThrow(/donor contract changed|missing/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF17_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
