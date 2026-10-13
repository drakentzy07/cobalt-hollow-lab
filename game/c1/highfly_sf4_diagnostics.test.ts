import { describe, expect, it } from 'vitest';
import { ABILITIES } from '../src/sim/content/classes';
import { HIGHFLY_FUSED_SKILLS } from '../src/highfly/sf3_skill_catalog';
import { traceSf4FusionDonors } from '../src/highfly/sf4_diagnostics';

describe('HIGHFLY SF4 native donor compatibility — ALL 9 classes / ALL 63', () => {
  const report=traceSf4FusionDonors(ABILITIES);
  it('covers exactly 7 skills for each of nine original classes',()=>{
    expect(report.length).toBe(63);
    expect(new Set(report.map(x=>x.id)).size).toBe(63);
    for(const cls of Object.keys(HIGHFLY_FUSED_SKILLS))
      expect(report.filter(x=>x.classId===cls)).toHaveLength(7);
  });
  it('has no missing donors or silently assigned foreign-class donors',()=>{
    expect(report.flatMap(x=>x.blockers.filter(reason=>
      reason.startsWith('MISSING_DONOR:') || reason==='CROSS_CLASS_DONOR'))).toEqual([]);
  });
  it('identifies the specific critical mismatches which cannot be auto-fused',()=>{
    const byId=new Map(report.map(x=>[x.id,x]));
    expect(byId.get('hf_warrior_s1')?.blockers).toContain('ON_NEXT_SWING_HANDLER');
    expect(byId.get('hf_mage_s1')?.blockers).toContain('MIXED_DAMAGE_SCHOOLS_NEED_ADAPTER');
    expect(byId.get('hf_hunter_s3')?.blockers).toContain('TARGET_CONTRACT_CONFLICT');
    expect(byId.get('hf_druid_u1')?.blockers).toContain('AUTHORED_RECIPE_DESIGN_MISMATCH');
    expect(byId.get('hf_shaman_s4')?.blockers).toContain('PROCEDURAL_NO_EFFECT_ARRAY');
    expect(byId.get('hf_priest_s4')?.sourceNotes).toContain('DONOR_LEVEL_AHEAD_OF_UNLOCK');
    expect(byId.get('hf_priest_s4')?.blockers).not.toContain('DONOR_LEVEL_AHEAD_OF_UNLOCK');
    expect(byId.get('hf_rogue_s2')?.blockers).toContain('ACTION_REPLACEMENT_HANDLER');
  });
  it('HIGHFLY-first: original LV20/LV50 donor levels, specs and visibility are NEVER unlock blockers',()=>{
    for(const entry of report){
      expect(entry.blockers).not.toContain('DONOR_LEVEL_AHEAD_OF_UNLOCK');
      expect(entry.blockers).not.toContain('PASSIVE_OR_HIDDEN_DONOR');
      expect(entry.blockers).not.toContain('SPEC_DEPENDENT_DONOR');
    }
    const byId=new Map(report.map(x=>[x.id,x]));
    for(const id of ['hf_paladin_s1','hf_priest_s4','hf_hunter_s2','hf_warlock_s1','hf_druid_s2']){
      expect(byId.get(id)?.sourceNotes,id).toContain('DONOR_LEVEL_AHEAD_OF_UNLOCK');
    }
    // Notes permit SOURCE reuse, not instant gameplay. 53 recipes still require
    // a mechanical adapter and their authored HIGHFLY unlock level.
    expect(report.filter(x=>x.status==='native-pilot')).toHaveLength(10);
    expect(report.filter(x=>x.status!=='native-pilot')).toHaveLength(53);
  });
  it('does not claim the other 53 are playable from the existence of IDs',()=>{
    expect(report.filter(x=>x.status==='native-pilot')).toHaveLength(10);
    expect(report.filter(x=>x.status!=='native-pilot')).toHaveLength(53);
    expect(report.filter(x=>x.status!=='native-pilot' && x.blockers.length===0)).toEqual([]);
  });
});
