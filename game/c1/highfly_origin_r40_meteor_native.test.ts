import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {ABILITIES} from '../src/sim/content/classes';
import {originCostDecision} from '../src/sim/highfly_origin_universal_resources';

/** STRICT R40 test: native Sim meteor must debit real MP and damage a real mob.
 * In-memory spell-list fixture never writes Hunter mastery or learnedSkillIds.
 * This test is not browser/VFX evidence; paired S23 E2E is also required.
 */
describe('HIGHFLY R40 native meteor: a real delayed impact',()=>{
  it('uses the original meteor definition with a session-only ability entitlement',()=>{
    const def=ABILITIES.meteor;
    expect(def.id).toBe('meteor');
    expect(def.targetMode).toBe('position');
    expect(def.effects.some(e=>e.type==='groundAoE' && e.radius===8 && e.delayed===true)).toBe(true);
    expect(originCostDecision(def)).toEqual({ok:true,pool:'mana'});
  });
  it('accepts cast through native Sim, spends MP, arms cooldown and lands on real enemy HP',()=>{
    const sim=new Sim({seed:391999,playerClass:'warrior',
      originHunterEnabled:true,compulsoryTutorial:false});
    const p=sim.player;
    const mob=[...sim.entities.values()].find(e=>
      e.kind==='mob' && e.hostile && !e.dead && e.ownerId===null && !e.guardianState);
    if(!mob)throw Error('R40_NATIVE_METEOR_NEEDS_REAL_HOSTILE');
    if(!p.originResources)throw Error('R40_HUNTER_RESOURCES_MISSING');
    const previous=JSON.stringify(sim.serializeCharacter(p.id)?.originHunter?.learnedSkillIds??[]);
    // Dedicated in-memory QA arena: not a persisted Hunter, not a second Sim.
    p.autoAttack=false;
    p.hp=p.maxHp=100000;
    mob.hp=mob.maxHp=100000;
    p.facing=0;
    p.originResources.mana=p.originResources.maxMana;
    const beforeMP=p.originResources.mana;
    const beforeMobHP=mob.hp;
    const def=ABILITIES.meteor;
    sim.known.push({def,rank:1,cost:def.cost,castTime:def.castTime,
      cooldown:def.cooldown,effects:def.effects,threatFlat:0,threatMult:1});
    const target={x:p.pos.x,z:p.pos.z+2};
    mob.pos.x=target.x;mob.pos.z=target.z;mob.pos.y=p.pos.y;
    sim.castAbilityAt('meteor',target);
    expect(p.originResources.mana).toBeLessThan(beforeMP);
    expect(p.cooldowns.has('meteor')).toBe(true);
    // Native delayed groundAoE pulse, no direct damage from a test helper.
    const startedAt=sim.time;
    let ticks=0;
    while(sim.time-startedAt<3.2 && ticks++<400){
      mob.pos.x=target.x;mob.pos.z=target.z;mob.pos.y=p.pos.y;
      sim.tick();
    }
    expect(ticks).toBeGreaterThan(1);
    expect(mob.hp).toBeLessThan(beforeMobHP);
    const after=JSON.stringify(sim.serializeCharacter(p.id)?.originHunter?.learnedSkillIds??[]);
    expect(after).toBe(previous);
  });
  it('identifies the still-blocked legacy Ruin-cost skill rather than faking it',()=>{
    expect(originCostDecision(ABILITIES.rain_of_fire).ok).toBe(false);
  });
});
