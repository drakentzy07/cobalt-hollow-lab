import test from 'node:test';import assert from 'node:assert/strict';
import {HIGHFLY_REBORN_SKILLS,HIGHFLY_SKILL_IDS,HIGHFLY_MECHANIC_DONORS} from './c5_skill_defs.ts';
test('four original skills with true native donor mechanics and zero third-party art',()=>{
 assert.equal(HIGHFLY_SKILL_IDS.length,4);
 for(const id of HIGHFLY_SKILL_IDS){
   const skill=HIGHFLY_REBORN_SKILLS[id];
   assert.equal(skill.id,id);
   assert.equal(skill.castTime,0);
   assert.equal(skill.castWhileMoving,true);
   assert.equal(skill.learnLevel,1);
   assert.ok(HIGHFLY_MECHANIC_DONORS[id]);
   assert.ok(!JSON.stringify(skill).toLowerCase().includes('craftpix'));
 }
});
test('S1 is actual projectile and S4 is delayed meteor, not fake visual/AoE hit',()=>{
 const a=HIGHFLY_REBORN_SKILLS;
 assert.equal(a.highfly_arc_shot.projectile,true);
 assert.equal(a.highfly_arc_shot.requiresTarget,true);
 assert.equal(a.highfly_arc_shot.effects[0].type,'directDamage');
 assert.equal(a.highfly_cross_cut.effects[0].type,'aoeDamage');
 assert.equal(a.highfly_cross_cut.effects[0].frontal,true);
 assert.equal(a.highfly_breakstep.effects[0].type,'aoeDamage');
 assert.equal(a.highfly_storm_circle.targetMode,'position');
 assert.equal(a.highfly_storm_circle.effects[0].type,'groundAoE');
 assert.equal(a.highfly_storm_circle.effects[0].delayed,true);
});
