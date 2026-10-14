import {describe,it,expect} from 'vitest';
import {V14_CLASSES,V14_ORIGINALS,v14Buffs,v14OriginalCatalogueErrors} from '../src/highfly/v14_original_skills';
import {ABILITIES,CLASSES} from '../src/sim/content/classes';
describe('HIGHFLY V14 9x10 source-native without fusion',()=>{
 it('uses exactly 90 unique original abilities',()=>{
  expect(v14OriginalCatalogueErrors()).toEqual([]);
  expect(V14_CLASSES).toHaveLength(9);
  expect(Object.values(V14_ORIGINALS).flat()).toHaveLength(90);
  expect(new Set(Object.values(V14_ORIGINALS).flat()).size).toBe(90);
  expect(Object.keys(ABILITIES).filter(id=>id.startsWith('hf_'))).toHaveLength(0);
 });
 it('preserves 10 per class, resource and vanilla gate metadata',()=>{
  for(const cls of V14_CLASSES){
   expect(CLASSES[cls]).toBeDefined();
   expect(V14_ORIGINALS[cls]).toHaveLength(10);
   for(const id of V14_ORIGINALS[cls]){
    const d=ABILITIES[id];expect(d.class).toBe(cls);
    expect(d.passive).not.toBe(true);
    expect(d.hiddenFromPlayer).not.toBe(true);
    expect(d.effects).toBeDefined();
   }
  }
 });
 it('lists all native buffs/pasivas outside ten slots',()=>{
  for(const cls of V14_CLASSES){
   const buffs=v14Buffs(cls);
   expect(buffs.length).toBeGreaterThan(0);
   expect(buffs.every(b=>b.class===cls&&!V14_ORIGINALS[cls].includes(b.id))).toBe(true);
  }
 });
});
