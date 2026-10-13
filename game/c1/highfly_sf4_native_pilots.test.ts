import { describe, expect, it } from 'vitest';
import { ABILITIES, CLASSES } from '../src/sim/content/classes';
import { HIGHFLY_FUSED_SKILLS } from '../src/highfly/sf3_skill_catalog';
import { sf4Readiness, installSf4NativePilots } from '../src/highfly/sf4_safe_fusions';
import type { AbilityDef } from '../src/sim/types';

const clsIds = Object.keys(HIGHFLY_FUSED_SKILLS) as
  (keyof typeof HIGHFLY_FUSED_SKILLS)[];
function copies() {
  const abilities: Record<string, AbilityDef> = { ...ABILITIES };
  const classes = Object.fromEntries(
    clsIds.map(id => [id, { abilities: [...CLASSES[id].abilities] }]),
  ) as Record<(typeof clsIds)[number], { abilities: string[] }>;
  return { abilities, classes };
}
describe('SF4 fail-closed 9/9 fusion integration — no release or save mutations', () => {
  it('tracks all 63 skills without claiming that all are playable', () => {
    const data=sf4Readiness();
    expect(data).toHaveLength(63);
    expect(new Set(data.map(s=>s.id)).size).toBe(63);
    expect(data.filter(s=>s.status==='native-pilot').map(s=>s.id).sort())
      .toEqual(['hf_priest_s2','hf_priest_s3']);
    expect(data.filter(s=>s.status!=='native-pilot')).toHaveLength(61);
    expect(data.find(s=>s.id==='hf_druid_u1')?.status).toBe('design-mismatch');
    expect(data.find(s=>s.id==='hf_shaman_s4')?.status).toBe('design-mismatch');
  });
  it('registers only two real-effect Priest pilots and does not unlock anything else', () => {
    const { abilities, classes }=copies();
    const result=installSf4NativePilots(abilities,classes);
    expect(result.registered).toEqual(['hf_priest_s2','hf_priest_s3']);
    expect(result.blocked.length + result.mismatchedDesign.length).toBe(61);
    const outputSkills=clsIds.flatMap(cl=>classes[cl].abilities.filter(id=>id.startsWith('hf_')));
    expect(outputSkills.sort()).toEqual(['hf_priest_s2','hf_priest_s3']);
    for (const cl of clsIds) {
      if (cl !== 'priest') expect(classes[cl].abilities).toEqual(CLASSES[cl].abilities);
      expect(CLASSES[cl].abilities.every(id => classes[cl].abilities.includes(id))).toBe(true);
    }
    const blast = abilities.hf_priest_s2;
    const shield = abilities.hf_priest_s3;
    expect(blast.class).toBe('priest');
    expect(blast.learnLevel).toBe(5); // S2 arrives at Hunter LV5
    expect(blast.school).toBe('shadow');
    expect(blast.effects.map(e=>e.type)).toEqual(['directDamage','dot']);
    expect(blast.effects[1]).toMatchObject({type:'dot',total:9,duration:18,interval:3});
    expect(shield.learnLevel).toBe(10); // S3 arrives at Hunter LV10
    expect(shield.school).toBe('holy');
    expect(shield.targetType).toBe('friendly');
    expect(shield.effects.map(e=>e.type)).toEqual(['absorb','hot']);
    expect(shield.effects[1]).toMatchObject({type:'hot',total:14,duration:15,interval:3});
  });
  it('maintains donor rank scaling and never zeroes out the old rank progression', () => {
    const { abilities, classes }=copies();
    installSf4NativePilots(abilities,classes);
    const blast = abilities.hf_priest_s2!;
    const shield = abilities.hf_priest_s3!;
    expect(blast.ranks?.some(r=>r.level===14)).toBe(true);
    expect(blast.ranks?.some(r=>r.level===16)).toBe(true);
    expect(blast.ranks?.some(r=>r.level===20)).toBe(true);
    const at20=blast.ranks?.find(r=>r.level===20);
    expect(at20?.effects).toEqual([
      expect.objectContaining({type:'directDamage',min:86,max:94}),
      expect.objectContaining({type:'dot',total:25}),
    ]);
    const shield20=shield.ranks?.find(r=>r.level===20);
    expect(shield20?.effects).toEqual([
      expect.objectContaining({type:'absorb',amount:210}),
      expect.objectContaining({type:'hot',total:62}),
    ]);
  });
  it('never overwrites donor registries, base class stats or permanent Training attributes', () => {
    const { abilities, classes }=copies();
    const originalBlast=ABILITIES.mind_blast;
    const originalShield=ABILITIES.power_word_shield;
    const stats=Object.fromEntries(clsIds.map(cl=>[cl,{...CLASSES[cl].baseStats}]));
    installSf4NativePilots(abilities,classes);
    expect(ABILITIES.mind_blast).toBe(originalBlast);
    expect(ABILITIES.power_word_shield).toBe(originalShield);
    expect(Object.fromEntries(clsIds.map(cl=>[cl,CLASSES[cl].baseStats]))).toEqual(stats);
    expect(Object.keys(CLASSES)).toHaveLength(9);
  });
  it('rejects changed donors before creating even one skill (atomic fail closed)', () => {
    const { abilities, classes }=copies();
    delete abilities.shadow_word_pain;
    expect(()=>installSf4NativePilots(abilities,classes)).toThrow(/foreign donor|missing/);
    expect(Object.keys(abilities).filter(id=>id.startsWith('hf_'))).toEqual([]);
    for(const cl of clsIds)expect(classes[cl].abilities).toEqual(CLASSES[cl].abilities);
  });
  it('a duplicated SF3 slot aborts rather than quietly replacing the old skill',()=>{
    const { abilities, classes }=copies();
    abilities.hf_priest_s2 = ABILITIES.mind_blast;
    expect(()=>installSf4NativePilots(abilities,classes)).toThrow(/duplicate skill/);
    expect(abilities.hf_priest_s3).toBeUndefined();
  });
});
