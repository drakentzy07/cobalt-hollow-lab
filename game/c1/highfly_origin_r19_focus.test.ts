import { describe, expect, it } from 'vitest';
import { CLASSES, ABILITIES } from '../src/sim/content/classes';
import { ORIGIN_TOP36, ORIGIN_FOCUS_SKILLS, ORIGIN_ROGUE_AOE_PENDING } from '../src/sim/highfly_origin_r19_selection';
import { highflyOriginNativeLearnable } from '../src/sim/highfly_origin_native_spellbook';
import { originCostDecision } from '../src/sim/highfly_origin_universal_resources';
import { originSkillRole } from '../src/highfly/highfly_origin_r17_hud';
describe('ORIGIN R19 exact 9x3 + 9 support, no fabricated Rogue AoE',()=>{
 it('36 unique IDs are authored native class skills, and have valid universal resources',()=>{
   expect(ORIGIN_FOCUS_SKILLS.size).toBe(36);
   for(const [cls,group] of Object.entries(ORIGIN_TOP36)){
     expect(group.combat).toHaveLength(3);
     for(const id of [...group.combat,group.buff]){
       const ability=ABILITIES[id];
       expect(ability,cls+' '+id).toBeDefined();
       expect(ability.class).toBe(cls);
       expect(CLASSES[ability.class].abilities).toContain(id);
       expect(originCostDecision(ability).ok,id).toBe(true);
       expect(originSkillRole(id)).toBe(id===group.buff?'support':'combat');
     }
   }
   expect(ORIGIN_ROGUE_AOE_PENDING).toBe(true);
 });
 it('no third-party class talent unlocks; curated specialist signatures preserve levels',()=>{
   for(const id of ORIGIN_FOCUS_SKILLS.keys()){
     const def=ABILITIES[id];
     expect(highflyOriginNativeLearnable(id,def.learnLevel-1,new Set())).toBeNull();
     const known=highflyOriginNativeLearnable(id,99,new Set());
     expect(known?.def.id,id).toBe(id);
   }
   expect(highflyOriginNativeLearnable('arcane_missiles',99,new Set())).toBeNull();
   expect(originSkillRole('divine_ascension')).toBe('reference');
   expect(originSkillRole('heroic_strike')).toBe('reference');
 });
});
