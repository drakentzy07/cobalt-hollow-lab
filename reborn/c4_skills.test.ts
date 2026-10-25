import test from 'node:test';
import assert from 'node:assert/strict';
import {HIGHFLY_REBORN_SKILLS,HIGHFLY_SKILL_IDS} from './c4_skill_defs.ts';

test('four owned names and unique identifiers without remote/third-party art',()=>{
  assert.equal(HIGHFLY_SKILL_IDS.length,4);
  assert.equal(new Set(HIGHFLY_SKILL_IDS).size,4);
  assert.deepEqual(Object.keys(HIGHFLY_REBORN_SKILLS).sort(),[...HIGHFLY_SKILL_IDS].sort());
  for(const id of HIGHFLY_SKILL_IDS){
    const skill=HIGHFLY_REBORN_SKILLS[id];
    assert.equal(skill.id,id);
    assert.equal(skill.learnLevel,1);
    assert.equal(skill.castTime,0);
    assert.equal(skill.castWhileMoving,true);
    assert.equal(skill.requiresTarget,false);
    assert.ok(skill.cooldown>0);
    assert.ok(skill.effects.length>0);
    assert.ok(!JSON.stringify(skill).toLowerCase().includes('craftpix'));
  }
});
test('S1 and S4 use authoritative ground location, S2 front slash, S3 post-dash range',()=>{
  const a=HIGHFLY_REBORN_SKILLS;
  assert.equal(a.highfly_arc_shot.targetMode,'position');
  assert.equal(a.highfly_storm_circle.targetMode,'position');
  assert.equal(a.highfly_cross_cut.effects[0].type,'aoeDamage');
  assert.equal(a.highfly_breakstep.effects[0].type,'aoeDamage');
  assert.equal(a.highfly_breakstep.range,0);
});
