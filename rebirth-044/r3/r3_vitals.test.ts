import {describe,it,expect} from 'vitest';
import {CLASSES} from '../src/sim/content/classes';
import {rebirthInitializeVitals,rebirthRegenSecondaryVitals,rebirthSecondaryBalance,rebirthSpendSecondaryEnergy,rebirthMirrorNativeVitals} from '../src/highfly/rebirth/vitals_core';
import type {Entity} from '../src/sim/types';
const mageLike=(type:'mana'|'rage'|'energy'|'focus'):Entity=>({
  resourceType:type,resource:type==='mana'?150:0,maxResource:type==='mana'?150:100,
  savedMana:0,stats:{int:15},highflyVitals:undefined,
} as Entity);
describe('REBIRTH R3: HP MP EN universal compatibility from level one',()=>{
 it('retains all nine native classes and original resource tags for wire compatibility',()=>{
  const names=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
  for(const k of names)expect(CLASSES[k as keyof typeof CLASSES]).toBeDefined();
  expect(CLASSES.warrior.resourceType).toBe('rage');
  expect(CLASSES.hunter.resourceType).toBe('focus');
  expect(CLASSES.rogue.resourceType).toBe('energy');
 });
 it('creates both mana and energy pools for all nine level-one classes',()=>{
  for(const cls of Object.keys(CLASSES) as (keyof typeof CLASSES)[]){
   const p=mageLike(CLASSES[cls].resourceType);
   const v=rebirthInitializeVitals(p);
   expect(v.maxMana).toBeGreaterThan(0);
   expect(v.maxEnergy).toBe(100);
   expect(v.energy).toBe(100);
   expect(v.mana).toBeGreaterThan(0);
   expect(p.highflyVitals).toBe(v);
  }
 });
 it('energy-gates a mana-class physical strike without spending its mana',()=>{
  const p=mageLike('mana');
  rebirthInitializeVitals(p);
  expect(rebirthSecondaryBalance(p,{school:'physical'})).toBe(100);
  expect(rebirthSpendSecondaryEnergy(p,{school:'physical'},35)).toBe(true);
  expect(p.highflyVitals?.energy).toBe(65);
  expect(p.resource).toBe(150);
 });
 it('magic on a caster still pays from native mana rather than the energy pool',()=>{
  const p=mageLike('mana');rebirthInitializeVitals(p);
  expect(rebirthSecondaryBalance(p,{school:'fire'})).toBe(null);
  expect(rebirthSpendSecondaryEnergy(p,{school:'fire'},25)).toBe(false);
  p.resource-=25;
  expect(rebirthMirrorNativeVitals(p)?.mana).toBe(125);
 });
 it('form toggles remain on native cast/resource code for druid safety',()=>{
  const p=mageLike('mana');rebirthInitializeVitals(p);
  expect(rebirthSecondaryBalance(p,{school:'physical'},true)).toBe(null);
 });
 it('regen restores real reserve in both orientations',()=>{
  const m=mageLike('mana');rebirthInitializeVitals(m);
  m.highflyVitals!.energy=22;rebirthRegenSecondaryVitals(m);
  expect(m.highflyVitals!.energy).toBe(42);
  const w=mageLike('rage');rebirthInitializeVitals(w);
  w.highflyVitals!.mana=0;rebirthRegenSecondaryVitals(w);
  expect(w.highflyVitals!.mana).toBeGreaterThan(0);
 });
 it('native HP is authoritative and no global class/ability tables were mutated',()=>{
  const p=mageLike('focus');
  const v=rebirthInitializeVitals(p);
  expect(v.energy).toBe(100);
  expect(p.resource).toBe(100);
  expect(CLASSES.hunter.resourceType).toBe('focus');
 });
});
