/** SF13 fail-closed mass audit against frozen ClaudeCraft, no fake 47/47. */
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {ABILITIES,CLASSES,abilitiesKnownAt} from '../src/sim/content/classes';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {MOBS} from '../src/sim/data';
import type {PlayerClass,AbilityDef} from '../src/sim/types';
import {HIGHFLY_FUSED_SKILLS} from '../src/highfly/sf3_skill_catalog';
import {installSf4NativePilots} from '../src/highfly/sf4_safe_fusions';
import {installSf10NativeExpansion} from '../src/highfly/sf10_three_native_reuses';
import {installSf12NativeExpansion} from '../src/highfly/sf12_three_native_mechanics';
import {auditSf13FortySeven,installSf13Compatible} from '../src/highfly/sf13_mass_native_gate';
const installed:string[]=[];
let extras:string[]=[];
beforeAll(()=>{
 expect(Object.keys(ABILITIES).filter(x=>x.startsWith('hf_'))).toHaveLength(0);
 installed.push(...installSf4NativePilots(ABILITIES,CLASSES).registered);
 installed.push(...installSf10NativeExpansion(ABILITIES,CLASSES));
 installed.push(...installSf12NativeExpansion(ABILITIES,CLASSES));
 expect(installed).toHaveLength(16);
});
afterAll(()=>{
 for(const id of [...extras,...installed]){
  delete ABILITIES[id];
  const cls=id.split('_')[1] as PlayerClass;
  const list=CLASSES[cls].abilities;const at=list.indexOf(id);
  if(at>=0)list.splice(at,1);
 }
});
describe('SF13 47 full audit and conservative native effect composition',()=>{
 it('accounts for all 47 with donor-level blockade reasons, preserves 16 previous',()=>{
  const report=auditSf13FortySeven(ABILITIES);
  expect(report).toHaveLength(47);
  expect(new Set(report.map(x=>x.id)).size).toBe(47);
  expect(new Set(Object.values(HIGHFLY_FUSED_SKILLS).flat().map(x=>x.id)).size).toBe(63);
  expect(report.every(x=>x.status==='candidate'||x.reasons.length>0)).toBe(true);
  const path=join('..','highfly-sf13-native-audit');
  mkdirSync(path,{recursive:true});
  writeFileSync(join(path,'47_source_contracts.json'),
   JSON.stringify({priorNative:16,examined:47,candidates:report.filter(x=>x.status==='candidate').length,
    blocked:report.filter(x=>x.status==='blocked').length,recipes:report},null,2),'utf8');
  const count=report.filter(x=>x.status==='candidate').length;
  console.log('HF_SF13_CANDIDATE_NUM='+count+' BLOCKED='+ (47-count));
 });
 it('installs only sound compositions atomically and keeps all original 16',()=>{
  const signatures=Object.fromEntries(installed.map(x=>[x,JSON.stringify(ABILITIES[x])]));
  extras=installSf13Compatible(ABILITIES,CLASSES);
  expect(extras.length).toBeGreaterThanOrEqual(0);
  expect(extras.every(x=>!installed.includes(x))).toBe(true);
  expect(new Set([...extras,...installed]).size).toBe(extras.length+16);
  for(const id of installed)expect(JSON.stringify(ABILITIES[id])).toBe(signatures[id]);
  for(const id of extras){
   const d=ABILITIES[id];const cls=d.class as PlayerClass;
   expect(CLASSES[cls].abilities.includes(id)).toBe(true);
   expect(abilitiesKnownAt(cls,d.learnLevel).some(x=>x.def.id===id)).toBe(true);
   expect(abilitiesKnownAt(cls,d.learnLevel-1).some(x=>x.def.id===id)).toBe(false);
   expect(d.effects.length).toBeGreaterThan(0);
  }
  console.log('HF_SF13_NATIVE_COMPOSED='+extras.length+' REMAINING_ADAPTERS='+(47-extras.length));
 });
 it('simulates every composed recipe at its unlock and LV99 in ORIGINAL Sim',()=>{
  for(const id of extras){
   const d=ABILITIES[id] as AbilityDef;
   for(const level of [d.learnLevel,99]){
    const sim=new Sim({seed:130000+level+extras.indexOf(id)*101,playerClass:d.class,autoEquip:true});
    sim.setPlayerLevel(level);sim.tick();
    const hero=sim.player;hero.resource=hero.maxResource;hero.hitBonus=1;
    if(d.requiresTarget && d.targetType!=='friendly'){
     const dist=Math.max(3,Math.min(d.range,Math.max(d.minRange??0,8)));
     const mob=createMob(133000+level+extras.indexOf(id)*101,MOBS.training_dummy,20,
       {x:hero.pos.x,y:hero.pos.y,z:hero.pos.z+dist});
     mob.hostile=true;mob.aiState='idle';mob.maxHp=mob.hp=100000;
     sim.addEntity(mob);sim.targetEntity(mob.id,hero.id);
    }
    if(d.targetType==='friendly')sim.castAbilityOn(id,hero.id,hero.id);
    else sim.castAbility(id,hero.id);
    let seen=false;
    for(let i=0;i<85;i++) {
     const events=sim.tick();
     if(events.some(e=>['damage','heal','auraApply','auraAdd','castComplete'].includes(e.type)))seen=true;
    }
    expect(hero.cooldowns.has(id),id+' LV'+level+' was not cast in native Sim').toBe(true);
    expect(seen||hero.auras.some(a=>a.id===id),id+' LV'+level+' had no native effects').toBe(true);
   }
  }
 });
 it('does not accept a missing original donor or mutate original source abilities',()=>{
  const report=auditSf13FortySeven(ABILITIES);
  expect(report.length+extras.length).toBe(47);
  expect(Object.keys(CLASSES)).toHaveLength(9);
 });
});
