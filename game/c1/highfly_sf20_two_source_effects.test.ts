/** SF20 authoritative Sim: both original meteor + orb and Rogue CC finisher. */
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
import {SF20_IDS,installSf20TwoNative} from '../src/highfly/sf20_two_source_effects';
const CASES=[
 {id:'hf_mage_u1',cls:'mage',unlock:25},
 {id:'hf_rogue_s5',cls:'rogue',unlock:20}
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
 expect(registered).toHaveLength(37);
 expect(SF20_IDS.every(x=>!registered.includes(x))).toBe(true);
 registered.push(...installSf20TwoNative(ABILITIES,CLASSES));
 expect(registered).toHaveLength(39);
 expect(new Set(registered).size).toBe(39);
});
afterAll(()=>{
 for(const id of registered){
  delete ABILITIES[id];
  const cl=id.split('_')[1] as PlayerClass;
  const a=CLASSES[cl].abilities;
  const n=a.indexOf(id);if(n>=0)a.splice(n,1);
 }
});
describe('SF20 new original-engine native fusions at unlock and LV99',()=>{
 it('has both native multi-effect source contracts / original 9 classes',()=>{
  expect(Object.keys(CLASSES)).toHaveLength(9);
  expect(SF20_IDS).toEqual(['hf_mage_u1','hf_rogue_s5']);
  expect(ABILITIES.hf_mage_u1.effects.map(x=>x.type))
    .toEqual(['groundAoE','frozenOrb']);
  expect(ABILITIES.hf_rogue_s5.effects.map(x=>x.type))
    .toEqual(['directDamage','interrupt','finisherStun']);
  expect(ABILITIES.hf_rogue_s5.spendsCombo).toBe(true);
 });
 for(const c of CASES)for(const lv of [c.unlock,99]){
  it(c.id+' LV'+lv+' casts real native effects and unlocks 10-slot HUD',()=>{
   const d=ABILITIES[c.id];
   expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
   expect(abilitiesKnownAt(c.cls,c.unlock-1).some(x=>x.def.id===c.id)).toBe(false);
   expect(isAbilityActionBarEligible(d)).toBe(true);
   expect(placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,5)[5])
     .toEqual({type:'ability',id:c.id});
   const sim=new Sim({seed:200010+lv+CASES.indexOf(c)*100,
    playerClass:c.cls,autoEquip:true});
   sim.setPlayerLevel(lv);sim.tick();
   const p=sim.player;p.resource=p.maxResource;p.facing=0;p.hitBonus=1;
   const range=c.cls==='mage'?8:3;
   const m=createMob(200510+lv+CASES.indexOf(c)*100,MOBS.training_dummy,20,
    {x:p.pos.x,y:p.pos.y,z:p.pos.z+range});
   m.hostile=true;m.aiState='idle';m.maxHp=m.hp=100000;
   sim.addEntity(m);sim.targetEntity(m.id,p.id);
   if(c.cls==='rogue'){p.comboPoints=3;p.comboUntil=sim.time+30;}
   if(c.cls==='mage')sim.castAbility(c.id,p.id,{x:m.pos.x,z:m.pos.z});
   else sim.castAbility(c.id,p.id);
   let damage=0,ground=false,orb=false,stun=false,minimumHp=m.hp;
   for(let i=0;i<120;i++){
    for(const e of sim.tick()){
     if(e.type==='damage'&&e.sourceId===p.id&&e.targetId===m.id)
      damage+=e.amount;
    }
    minimumHp=Math.min(minimumHp,m.hp);
    const internals=sim as unknown as {
     groundAoEs:readonly {abilityId?:string}[];
     frozenOrbs:readonly {abilityId:string}[]
    };
    if(internals.groundAoEs.some(e=>e.abilityId===c.id))ground=true;
    if(internals.frozenOrbs.some(e=>e.abilityId===c.id))orb=true;
    if(m.auras.some(a=>a.kind==='stun'&&a.id===c.id+'_stun'))stun=true;
   }
   expect(p.cooldowns.has(c.id),c.id+' original Sim cooldown missing').toBe(true);
   expect(damage,c.id+' source must damage original monster').toBeGreaterThan(0);
   expect(minimumHp,c.id+' original monster must lose real HP')
    .toBeLessThan(m.maxHp);
   if(c.cls==='mage'){
    expect(ground,'native delayed meteor must exist').toBe(true);
    expect(orb,'native drifting frozen orb must exist').toBe(true);
   }else{
    expect(stun,'native per-combo finisher stun must apply').toBe(true);
    expect(p.comboPoints,'original Rogue combo points must be spent').toBe(0);
   }
  },25000);
 }
 it('fails atomically when original donor vanishes',()=>{
  const abilities={...ABILITIES};
  for(const id of SF20_IDS)delete abilities[id];
  delete abilities.kick;
  const classes={} as Record<PlayerClass,{abilities:string[]}>;
  for(const [c,d] of Object.entries(CLASSES))
   classes[c as PlayerClass]={abilities:d.abilities.filter(id=>
    !SF20_IDS.includes(id as typeof SF20_IDS[number]))};
  const before=Object.keys(abilities).length;
  expect(()=>installSf20TwoNative(abilities,classes))
    .toThrow(/original donor missing or changed/);
  expect(Object.keys(abilities)).toHaveLength(before);
  expect(SF20_IDS.every(id=>!abilities[id])).toBe(true);
 });
});
