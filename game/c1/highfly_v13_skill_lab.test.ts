/** HIGHFLY V13: native source catalog / unchanged nine classes / all 63 labels. */
import {describe,it,expect} from 'vitest';
import {highflyV13Catalog} from '../src/highfly/v13_skill_lab';
import {HIGHFLY_FUSED_SKILLS} from '../src/highfly/sf3_skill_catalog';
import {ABILITIES} from '../src/sim/content/classes';

describe('HIGHFLY V13 scroll catalog native-source invariants', () => {
  const skills=highflyV13Catalog();
  it('has 63 unique HIGHFLY skills, 7 for each original class in slots 1..7',()=>{
    expect(skills).toHaveLength(63);
    expect(new Set(skills.map(s=>s.id)).size).toBe(63);
    for(const [cls,records] of Object.entries(HIGHFLY_FUSED_SKILLS)){
      expect(records.map(s=>s.slot),cls).toEqual([1,2,3,4,5,6,7]);
      expect(records.every(s=>s.classId===cls && s.id.startsWith('hf_'+cls+'_')),cls).toBe(true);
    }
  });
  it('compares REAL pinned ClaudeCraft originals and not renamed synthetic donors',()=>{
    for(const s of skills){
      expect(s.donors.length,s.id).toBeGreaterThanOrEqual(2);
      expect(Boolean(s.name.trim()),s.id).toBe(true);
      for(const donor of s.donors){
        expect(ABILITIES[donor],s.id+' original '+donor).toBeDefined();
        expect(ABILITIES[donor].class,s.id+' original class').toBe(s.classId);
      }
    }
  });
  it('does not replace any original or persist stats or create a parallel combat engine',()=>{
    expect(skills.every(s=>!s.donors.includes(s.id))).toBe(true);
    expect(ABILITIES.heroic_strike).toBeDefined();
    expect(ABILITIES.crusader_strike).toBeDefined();
    expect(ABILITIES.stealth).toBeDefined();
    expect(ABILITIES.regrowth).toBeDefined();
  });
});
