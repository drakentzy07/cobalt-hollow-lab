import {describe,expect,it} from 'vitest';
import {ABILITIES} from '../src/sim/content/classes';
import {HIGHFLY_FUSED_SKILLS,highflyUnlockedFusions} from '../src/highfly/sf3_skill_catalog';
import {highflySf5AllStages,highflySf5ClassStages} from '../src/highfly/highfly_sf5_unlock_stages';

const classes=Object.keys(HIGHFLY_FUSED_SKILLS) as (keyof typeof HIGHFLY_FUSED_SKILLS)[];
describe('HIGHFLY SF5 / V10 nine-class progressive fusion unlock truth',()=>{
  it('always covers exactly 9 original classes x 7 recipes',()=>{
    expect(classes).toHaveLength(9);
    for(const level of [1,5,10,15,20,25,30,50,99,100]){
      const stages=highflySf5AllStages(level,ABILITIES);
      expect(stages).toHaveLength(63);
      expect(new Set(stages.map(s=>s.specId)).size).toBe(63);
      for(const cls of classes)expect(stages.filter(s=>s.classId===cls)).toHaveLength(7);
    }
  });
  it('keeps HIGHFLY-locked sources out without changing authored kit order',()=>{
    for(const level of [1,4,5,9,10,14,15,19,20,24,25,29,30,99]){
      for(const cls of classes){
        const steps=highflySf5ClassStages(cls,level,ABILITIES);
        const alreadyUnlocked=highflyUnlockedFusions(cls,level).map(x=>x.id);
        expect(steps.filter(s=>s.status!=='recipe-locked').map(s=>s.specId))
          .toEqual(alreadyUnlocked);
        for(const stage of steps){
          expect(stage.status==='recipe-locked' ? stage.usableSourceIds.length===0 : true).toBe(true);
          expect(stage.usableSourceIds.every(id=>ABILITIES[id].class===cls)).toBe(true);
          expect(stage.futureSourceIds.every(id=>ABILITIES[id].class===cls)).toBe(true);
          expect(stage.mechanicAdapterStillRequired).toBe(true);
        }
      }
    }
  });
  it('authorizes later Claude donors precisely at HIGHFLY recipe unlock without releasing originals',()=>{
    const at=(id:string,level:number)=>highflySf5AllStages(level,ABILITIES).find(s=>s.specId===id)!;
    for(const [id,level,donor] of [
      ['hf_paladin_s1',1,'crusader_strike'],
      ['hf_hunter_s2',5,'aimed_shot'],
      ['hf_priest_s4',15,'flash_heal'],
      ['hf_warlock_s1',1,'soul_lance'],
      ['hf_druid_s2',5,'insect_swarm'],
    ] as const){
      expect(at(id,level).usableSourceIds).toContain(donor);
      expect(at(id,level).futureSourceIds).not.toContain(donor);
      expect(ABILITIES[donor].learnLevel).toBeGreaterThan(level);
    }
    expect(at('hf_druid_s3',9).status).toBe('recipe-locked');
    expect(at('hf_druid_s3',9).usableSourceIds).toEqual([]);
    expect(at('hf_druid_s3',10).usableSourceIds).toEqual(['rejuvenation','regrowth','healing_touch']);
    expect(ABILITIES.regrowth.learnLevel).toBe(14);
  });
  it('never passes bogus donor registry or invalid levels',()=>{
    expect(()=>highflySf5AllStages(0,ABILITIES)).toThrow(/invalid Hunter level/);
    expect(()=>highflySf5AllStages(Number.NaN,ABILITIES)).toThrow(/invalid Hunter level/);
    const withoutDonor={...ABILITIES};
    delete withoutDonor.mind_blast;
    expect(()=>highflySf5AllStages(10,withoutDonor)).toThrow(/absent or foreign source/);
  });
});
