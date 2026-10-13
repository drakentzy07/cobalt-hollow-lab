/** SF10: three real ORIGINAL-Sim donor fusions. Native math and cooldown;
 * NO abstract mocked ability registry, false VFX certification or boss nerf.
 */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {placeAbilityOnSlot,isAbilityActionBarEligible} from '../src/ui/hud/action_bar/hotbar';
import type {Entity,PlayerClass} from '../src/sim/types';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';

const MATRIX=[
 {cls:'priest',id:'hf_priest_s4',level:15,mode:'heal'},
 {cls:'shaman',id:'hf_shaman_s2',level:5,mode:'fire'},
 {cls:'warlock',id:'hf_warlock_s1',level:1,mode:'shadow'},
] as const;
let installed:string[]=[];
beforeAll(()=>{
 if(MATRIX.some(x=>ABILITIES[x.id]))throw Error('SF10 isolated registry unexpectedly pre-filled');
 const base=installSf4NativePilots(ABILITIES,CLASSES).registered;
 const extra=installSf10NativeExpansion(ABILITIES,CLASSES);
 installed=[...base,...extra];
 expect(base).toHaveLength(10);expect(extra).toHaveLength(3);
});
afterAll(()=>{
 for(const id of installed){
  delete ABILITIES[id];
  const cl=id.split('_')[1] as PlayerClass;
  const i=CLASSES[cl].abilities.indexOf(id);
  if(i>=0)CLASSES[cl].abilities.splice(i,1);
 }
});
function dummy(sim:Sim,id:number):Entity{
 const p=sim.player;
 const mob=createMob(id,MOBS.training_dummy,20,{x:p.pos.x,y:p.pos.y,z:p.pos.z+8});
 mob.hostile=true;mob.aiState='idle';mob.maxHp=mob.hp=100000;
 sim.addEntity(mob);
 return mob;
}
describe('SF10: three safe native compositions — at own HIGHFLY unlock and LV99',()=>{
 for(const c of MATRIX)for(const lv of [c.level,99]){
  it(c.id+' at LV'+lv+' learns, appears on actionbar and genuinely resolves source effects',()=>{
    expect(abilitiesKnownAt(c.cls,lv).some(x=>x.def.id===c.id)).toBe(true);
    const action=placeAbilityOnSlot(Array.from({length:10},()=>null),c.id,4)[4];
    expect(action).toEqual({type:'ability',id:c.id});
    expect(isAbilityActionBarEligible(ABILITIES[c.id])).toBe(true);
    const sim=new Sim({seed:105010+lv+MATRIX.indexOf(c)*100,playerClass:c.cls,autoEquip:true});
    sim.setPlayerLevel(lv);sim.tick();
    const hero=sim.player;
    hero.resource=hero.maxResource;
    hero.hp=Math.max(1,Math.round(hero.maxHp*.15));
    hero.hitBonus=1;
    const before={hp:hero.hp,resource:hero.resource};
    const mob=c.mode==='heal'?null:dummy(sim,100500+lv+MATRIX.indexOf(c)*100);
    if(mob)sim.targetEntity(mob.id,hero.id);
    const hpMob=mob?.hp??0;
    // Original Sim periodically regenerates player resources and training
    // dummies restore HP after damage. Track the actual extrema during cast,
    // rather than incorrectly looking at final values seven seconds later.
    sim.castAbility(c.id,hero.id);
    let damage=0;
    let minResource=hero.resource,minMobHp=mob?.hp??0;
    for(let k=0;k<145;k++){
      for(const e of sim.tick()){
        if(mob&&e.type==='damage'&&e.sourceId===hero.id&&e.targetId===mob.id)damage+=e.amount;
      }
      minResource=Math.min(minResource,hero.resource);
      if(mob)minMobHp=Math.min(minMobHp,mob.hp);
    }
    expect(hero.cooldowns.has(c.id)).toBe(true);
    expect(minResource).toBeLessThan(before.resource);
    if(c.mode==='heal')expect(hero.hp).toBeGreaterThan(before.hp);
    if(mob){
      expect(minMobHp).toBeLessThan(hpMob);
      expect(damage).toBeGreaterThan(0);
    }
    if(c.mode==='fire'){
      expect(mob?.auras.some(a=>a.kind==='dot'&&a.sourceId===hero.id)).toBe(true);
    }
  },30000);
 }
 it('SF10 exposes 13 real skills across nine unchanged original classes',()=>{
  expect(installed).toHaveLength(13);
  const hf=Object.keys(ABILITIES).filter(x=>x.startsWith('hf_')&&installed.includes(x));
  expect(hf).toHaveLength(13);
  expect(new Set(MATRIX.map(x=>x.cls)).size).toBe(3);
  expect(Object.keys(CLASSES)).toHaveLength(9);
  const priest=ABILITIES.hf_priest_s4;
  expect(priest.effects.map(e=>e.type)).toEqual(['heal']);
  expect(priest.castTime).toBe(1.5);
  expect(priest.ranks?.some(r=>r.level===20)).toBe(true);
  const shaman=ABILITIES.hf_shaman_s2;
  expect(shaman.effects.map(e=>e.type)).toEqual(['directDamage','dot']);
  expect(shaman.projectileFx).toBe('heavyBolt');
  expect(shaman.specs).toBeUndefined();
  const warlock=ABILITIES.hf_warlock_s1;
  expect(warlock.effects.map(e=>e.type)).toEqual(['directDamage']);
  expect(warlock.excludeSpecs).toBeUndefined();
  expect(warlock.ranks?.find(x=>x.level===14)?.castTime).toBe(2);
 });
 it('rejects a changed donor atomically, without installing any SF10 skill',()=>{
   const registry={...ABILITIES};const classMap=Object.fromEntries(
     Object.entries(CLASSES).map(([id,c])=>[id,{abilities:[...c.abilities]}])
   ) as Record<PlayerClass,{abilities:string[]}>;
   for(const c of MATRIX){
     delete registry[c.id];
     classMap[c.cls].abilities.splice(classMap[c.cls].abilities.indexOf(c.id),1);
   }
   delete registry.soul_lance;
   const before=Object.keys(registry).length;
   expect(()=>installSf10NativeExpansion(registry,classMap)).toThrow(/missing source/);
   expect(Object.keys(registry)).toHaveLength(before);
   expect(MATRIX.every(x=>!registry[x.id])).toBe(true);
 });
 it('never registers an unapproved extra 50 or mutates the 10 original pilots',()=>{
  expect(MATRIX.every(x=>installed.includes(x.id))).toBe(true);
  const old=installed.filter(x=>!MATRIX.some(m=>m.id===x));
  expect(old).toHaveLength(10);
  expect(ABILITIES.hf_mage_s3.effects.map(x=>x.type)).toEqual(['blinkForward','aoeRoot']);
  expect(ABILITIES.hf_hunter_s5.effects.map(x=>x.type)).toEqual(['weaponStrike','hunterTrailbreak']);
 });
});
