import {describe,expect,it} from 'vitest';
import {ABILITIES,CLASSES} from '../src/sim/content/classes';
import {HIGHFLY_FUSED_SKILLS,HIGHFLY_PASSIVES,HIGHFLY_UNIQUE_SLOTS,HIGHFLY_SKILL_LEVELS,highflyUnlockedFusions,highflyCatalogIsValid} from '../src/highfly/sf3_skill_catalog';
import {installHighflySF3Fusions} from '../src/highfly/sf3_fusion_runtime';
import type {AbilityDef} from '../src/sim/types';

const names=Object.keys(HIGHFLY_FUSED_SKILLS) as (keyof typeof HIGHFLY_FUSED_SKILLS)[];
describe('HIGHFLY SF3 9/9 native donor kit contracts',()=>{
  it('9 classes, 7 fused skills, 27 class passives, 3 legendary slots locked',()=>{
    expect(names).toHaveLength(9);
    expect(names.flatMap(n=>HIGHFLY_FUSED_SKILLS[n])).toHaveLength(63);
    expect(names.flatMap(n=>HIGHFLY_PASSIVES[n])).toHaveLength(27);
    expect(HIGHFLY_UNIQUE_SLOTS).toEqual(['U1','U2','U3']);
    for(const cl of names){
      const set=HIGHFLY_FUSED_SKILLS[cl];
      expect(set.map(s=>s.slot)).toEqual([1,2,3,4,5,6,7]);
      expect(set.map(s=>s.unlockLevel)).toEqual([...HIGHFLY_SKILL_LEVELS]);
      expect(set.filter(s=>s.ultimate).length).toBe(2);
      expect(new Set(set.map(s=>s.id)).size).toBe(7);
    }
  });
  it('EVERY donated ability ID exists in the pinned ClaudeCraft content',()=>{
    expect(highflyCatalogIsValid(new Set(Object.keys(ABILITIES)))).toEqual([]);
  });
  it('LV1/5/10/15/20/25/30 progression; no extra slot at LV99',()=>{
    for(const cl of names){
      for(const [lvl,expected] of [[1,1],[4,1],[5,2],[10,3],[15,4],[20,5],[25,6],[30,7],[60,7],[99,7]] as const){
        expect(highflyUnlockedFusions(cl,lvl)).toHaveLength(expected);
      }
    }
  });
  it('registers 63 usable native definitions without deleting original donors',()=>{
    const cloned:Record<string,AbilityDef>={...ABILITIES};
    const existing=new Set(Object.keys(cloned));
    const classes=Object.fromEntries(names.map(cl=>[cl,{abilities:[...CLASSES[cl].abilities]}])) as Record<typeof names[number],{abilities:string[]}>;
    const audit=installHighflySF3Fusions(cloned,classes);
    expect(audit.total).toBe(63);
    expect(audit.nativeFusionCount).toBe(63);
    expect(audit.additiveCombos+audit.needsSpecialHandling.length).toBe(63);
    for(const cl of names)for(const def of HIGHFLY_FUSED_SKILLS[cl]){
      expect(classes[cl].abilities).toContain(def.id);
      const native=cloned[def.id]!;
      expect(native.class).toBe(cl);
      expect(native.learnLevel).toBe(def.unlockLevel);
      expect(native.name).toBe(def.name);
      expect(native.passive).toBe(false);
      // Some native ClaudeCraft abilities (e.g. Unleash Weapon) resolve via
      // custom cast handlers with effects:[], not through effect arrays.
      // Their composite REQUIRES an explicit adapter; do not claim it works.
      if (!native.effects?.length)
        expect(audit.needsSpecialHandling,def.id).toContain(def.id);
      if(def.ultimate)expect(native.cooldown).toBeGreaterThanOrEqual(25);
      for(const donor of def.donors)expect(existing.has(donor)).toBe(true);
    }
  });
  it('does not change donor definitions, training stats, old class kits or 9-class count',()=>{
    const cloned:Record<string,AbilityDef>={...ABILITIES};
    const classes=Object.fromEntries(names.map(cl=>[cl,{abilities:[...CLASSES[cl].abilities]}])) as Record<typeof names[number],{abilities:string[]}>;
    const before=names.map(cl=>[cl,CLASSES[cl].abilities.length,CLASSES[cl].baseStats]);
    const sample=ABILITIES['backstab'];
    installHighflySF3Fusions(cloned,classes);
    expect(ABILITIES['backstab']).toBe(sample);
    expect(names.map(cl=>[cl,CLASSES[cl].abilities.length,CLASSES[cl].baseStats])).toEqual(before);
    expect(Object.keys(CLASSES)).toHaveLength(9);
  });
});
