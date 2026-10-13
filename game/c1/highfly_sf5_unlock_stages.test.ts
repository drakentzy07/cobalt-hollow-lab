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
  it('keeps locked sources out of each level without changing authored kit order',()=>{
    for(const level of [1,4,5,9,10,14,15,19,20,24,25,29,30,99]){
      for(const cls of classes){
        const steps=highflySf5ClassStages(cls,level,ABILITIES);
        const alreadyUnlocked=highflyUnlockedFusions(cls,level).map(x=>x.id);
        expect(steps.filter(s=>s.status!=='recipe-locked').map(s=>s.specId))
          .toEqual(alreadyUnlocked);
        for(const stage of steps){
          expect(stage.usableSourceIds.every(id=>ABILITIES[id].learnLevel<=level)).toBe(true);
          expect(stage.futureSourceIds.every(id=>
            ABILITIES[id].learnLevel>level ||
            ABILITIES[id].passive || ABILITIES[id].hiddenFromPlayer)).toBe(true);
          expect(stage.mechanicAdapterStillRequired).toBe(true);
        }
      }
    }
  });
  it('explicitly reveals late donor blockers at low unlock levels',()=>{
    const at=(id:string,level:number)=>highflySf5AllStages(level,ABILITIES).find(s=>s.specId===id)!;
    expect(at('hf_paladin_s1',1).futureSourceIds).toContain('crusader_strike');
    expect(at('hf_hunter_s2',5).futureSourceIds).toContain('aimed_shot');
    expect(at('hf_priest_s4',15).futureSourceIds).toContain('flash_heal');
    expect(at('hf_warlock_s1',1).futureSourceIds).toContain('soul_lance');
    expect(at('hf_druid_s2',5).futureSourceIds).toContain('insect_swarm');
    expect(at('hf_priest_s2',5).futureSourceIds).not.toContain('mind_blast');
    expect(at('hf_priest_s3',10).futureSourceIds).toEqual([]);
  });
  it('never passes bogus donor registry or invalid levels',()=>{
    expect(()=>highflySf5AllStages(0,ABILITIES)).toThrow(/invalid Hunter level/);
    expect(()=>highflySf5AllStages(Number.NaN,ABILITIES)).toThrow(/invalid Hunter level/);
    const withoutDonor={...ABILITIES};
    delete withoutDonor.mind_blast;
    expect(()=>highflySf5AllStages(10,withoutDonor)).toThrow(/absent or foreign source/);
  });
});
