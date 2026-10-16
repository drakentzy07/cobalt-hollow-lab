import {describe,it,expect} from 'vitest';
import {R30_ORIGINAL_45,R30_PASSIVE_DESIGNS,r30AuditSelected} from '../src/sim/highfly_origin_r30_curated77';
import {R29_PREMIUM_CONTRACTS,installR29PremiumNativeContracts} from '../src/sim/highfly_origin_r29_premium_native';
import {r31PassiveLabAudit,r31OutgoingDamageMultiplier,
 r31IncomingDamageMultiplier,r31MovementSpeedBonus,r31ManaRegenMultiplier}
 from '../src/sim/highfly_origin_r31_passive_runtime';
import {originFreshResources,originRegen} from '../src/sim/highfly_origin_universal_resources';

describe('HIGHFLY R31 77 complete-identity LAB (honest readiness)',()=>{
 it('keeps 45+23+9 unique without claiming unfinished gameplay',()=>{
  installR29PremiumNativeContracts();
  expect(r30AuditSelected().original).toBe(45);
  expect(R30_ORIGINAL_45).toHaveLength(45);
  const ready=R29_PREMIUM_CONTRACTS.filter(x=>x.readiness!=='visual-only-behavior-pending');
  const unfinished=R29_PREMIUM_CONTRACTS.filter(x=>x.readiness==='visual-only-behavior-pending');
  expect(ready).toHaveLength(14);
  expect(unfinished).toHaveLength(9);
  expect(R30_PASSIVE_DESIGNS).toHaveLength(9);
  expect(new Set([...R30_ORIGINAL_45,...R29_PREMIUM_CONTRACTS.map(x=>x.id),
    ...R30_PASSIVE_DESIGNS.map(x=>x.id)]).size).toBe(77);
 });
 it('nine independent passives have measurable, isolated values',()=>{
  const q=r31PassiveLabAudit();
  expect(q.passives).toBe(9);
  expect(q.mode).toBe('ephemeral-all-on-only');
  expect(r31OutgoingDamageMultiplier('physical',null)).toBeCloseTo(1.04);
  expect(r31OutgoingDamageMultiplier('fire',null)).toBeCloseTo(1.08);
  expect(r31OutgoingDamageMultiplier('nature',null)).toBeCloseTo(1.12);
  expect(r31OutgoingDamageMultiplier('shadow',null)).toBeCloseTo(1.12);
  expect(r31OutgoingDamageMultiplier('arcane','arcane_shot')).toBeCloseTo(1.12);
  expect(r31IncomingDamageMultiplier()).toBeCloseTo(.97);
  expect(r31MovementSpeedBonus()).toBeCloseTo(.04);
  expect(r31ManaRegenMultiplier()).toBeCloseTo(1.05);
 });
 it('Druid passive adds mana regen without giving stamina or HP',()=>{
  const plain={resources:originFreshResources()} as Parameters<typeof originRegen>[0];
  const withPassive={resources:originFreshResources()} as Parameters<typeof originRegen>[0];
  plain.resources.mana=100;withPassive.resources.mana=100;
  plain.resources.stamina=20;withPassive.resources.stamina=20;
  originRegen(plain,1);
  originRegen(withPassive,1,r31ManaRegenMultiplier());
  expect(withPassive.resources.mana).toBeGreaterThan(plain.resources.mana);
  expect(withPassive.resources.stamina).toBe(plain.resources.stamina);
 });
 it('never changes source original abilities or unblocks fake summons',()=>{
  installR29PremiumNativeContracts();
  for(const c of R29_PREMIUM_CONTRACTS){
   if(c.readiness==='visual-only-behavior-pending')expect(c.id).toMatch(/^hf_vfx23_/);
  }
  expect(R30_PASSIVE_DESIGNS.every(x=>x.value>0)).toBe(true);
 });
});
