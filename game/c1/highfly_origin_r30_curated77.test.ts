import {describe,it,expect} from 'vitest';
import {ABILITIES} from '../src/sim/content/classes';
import {originCostDecision} from '../src/sim/highfly_origin_universal_resources';
import {R30_ORIGINAL_BY_SCHOOL,R30_ORIGINAL_45,R30_PREMIUM_23,R30_PASSIVE_DESIGNS,r30AuditSelected} from '../src/sim/highfly_origin_r30_curated77';
import {r30ResolveSelected,r30Growth} from '../src/sim/highfly_origin_r30_lv99_instant';
import {installR29PremiumNativeContracts,R29_PREMIUM_CONTRACTS} from '../src/sim/highfly_origin_r29_premium_native';

describe('HIGHFLY R30 isolated 77-scope playable foundation',()=>{
 it('has 45 unique standalone original abilities, five per school',()=>{
  installR29PremiumNativeContracts();
  const stats=r30AuditSelected();
  expect(stats).toEqual({original:45,premium:23,passiveDesigns:9,premiumBlocked:9});
  expect(new Set(R30_ORIGINAL_45).size).toBe(45);
  expect(Object.keys(R30_ORIGINAL_BY_SCHOOL)).toHaveLength(9);
  for(const id of R30_ORIGINAL_45){
   const def=ABILITIES[id];
   expect(def).toBeTruthy();
   expect(def.passive).not.toBe(true);
   expect(def.requiresStealth).not.toBe(true);
   expect(def.requiresForm).toBeUndefined();
   expect(def.requiresAuraKind).toBeUndefined();
   expect(def.requiresShield).not.toBe(true);
   expect(def.spendsCombo).not.toBe(true);
   expect(originCostDecision(def).ok).toBe(true);
  }
 });
 it('does not misrepresent unavailable premium native gameplay as complete',()=>{
  installR29PremiumNativeContracts();
  expect(R30_PREMIUM_23).toHaveLength(23);
  for(const c of R29_PREMIUM_CONTRACTS){
   const a=ABILITIES[c.id];
   const blocked=c.readiness==='visual-only-behavior-pending';
   expect(Boolean(a.hiddenFromPlayer)).toBe(blocked);
   if(blocked)expect(a.effects).toEqual([]);
  }
 });
 it('nine new passive proposals are EXPLICITLY design-only; no fake active abilities',()=>{
  expect(R30_PASSIVE_DESIGNS).toHaveLength(9);
  expect(new Set(R30_PASSIVE_DESIGNS.map(s=>s.school)).size).toBe(9);
  expect(new Set(R30_PASSIVE_DESIGNS.map(s=>s.id)).size).toBe(9);
  for(const p of R30_PASSIVE_DESIGNS){
   expect(p.value).toBeGreaterThan(0);
   expect(ABILITIES[p.id]).toBeUndefined();
  }
 });
 it('resolves actual classic ranks LV1–20 and provisional LV21–99 WITHOUT altering source',()=>{
  const source=ABILITIES.fireball;
  const untouched=JSON.stringify(source);
  const l1=r30ResolveSelected('fireball',1);
  const l20=r30ResolveSelected('fireball',20);
  const l21=r30ResolveSelected('fireball',21);
  const l99=r30ResolveSelected('fireball',99);
  expect(l1.rank).toBe(1);
  expect(l20.rank).toBeGreaterThanOrEqual(l1.rank);
  expect(l20.rank).toBeGreaterThan(1);
  expect(l1.castTime).toBe(0);
  expect(l99.castTime).toBe(0);
  expect(l99.cost).toBeGreaterThanOrEqual(12);
  expect(r30Growth(1)).toBe(1);
  expect(r30Growth(20)).toBe(1);
  expect(r30Growth(21)).toBeGreaterThan(1);
  expect(r30Growth(99)).toBeGreaterThan(r30Growth(21));
  const hit=(a:typeof l1)=>a.effects.find(e=>e.type==='directDamage');
  expect(hit(l1)).toBeTruthy();
  expect(hit(l20)).toBeTruthy();
  expect(hit(l21)).toBeTruthy();
  expect(hit(l99)).toBeTruthy();
  expect(JSON.stringify(hit(l99))).not.toBe(JSON.stringify(hit(l20)));
  expect(JSON.stringify(source)).toBe(untouched);
 });
 it('bounds spam by real resource spend and VFX safety rather than long cast bars',()=>{
  installR29PremiumNativeContracts();
  for(const id of [...R30_ORIGINAL_45,...R30_PREMIUM_23.filter(k=>!ABILITIES[k]?.hiddenFromPlayer)]){
   const a=r30ResolveSelected(id,10);
   expect(a.cost).toBeGreaterThan(0);
   expect(a.castTime).toBe(0);
   expect(a.cooldown).toBeGreaterThanOrEqual(0.25);
   expect(a.cooldown).toBeLessThanOrEqual(4);
  }
  expect(()=>r30ResolveSelected('hf_vfx23_glacial_crown',10)).toThrow('R30_NOT_ADMITTED');
 });
});
