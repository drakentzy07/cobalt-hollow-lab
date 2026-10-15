import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CLASSES, ABILITIES } from '../src/sim/content/classes';
import { Sim } from '../src/sim/sim';
import { originResourceAdmission } from '../src/sim/highfly_origin_resource_admission';
import { shieldEquipped, wieldsDagger, effectsRequireDagger } from '../src/sim/combat/equipment_requirement';

describe('HIGHFLY ORIGIN R1-2C — resource and native weapon safety', () => {
  it('does not disguise Mage mana as Warrior rage (or Rogue energy)', () => {
    expect(CLASSES.warrior.resourceType).toBe('rage');
    expect(CLASSES.mage.resourceType).toBe('mana');
    expect(originResourceAdmission(ABILITIES.fireball, 'rage')).toEqual({
      allowed:false,required:'mana',available:'rage',
    });
    expect(originResourceAdmission(ABILITIES.fireball, 'energy')).toEqual({
      allowed:false,required:'mana',available:'energy',
    });
    expect(originResourceAdmission(ABILITIES.fireball, 'mana')).toEqual({allowed:true});
    expect(originResourceAdmission(ABILITIES.heroic_strike, 'rage')).toEqual({allowed:true});
  });
  it('blocks unaffordable cross-class casts BEFORE spending the wrong pool', () => {
    const sim = new Sim({seed:505,playerClass:'warrior',originHunterEnabled:true});
    const pid=sim.player.id;
    expect(sim.learnOriginHunterSkillTrusted('fireball',pid)).toBe(true);
    const prior=sim.player.resource;
    const previousCooldowns=JSON.stringify([...sim.player.cooldowns.entries()]);
    const priorKnown=sim.players.get(pid)?.known.map(k=>k.def.id);
    sim.castAbility('fireball');
    expect(sim.player.resource).toBe(prior);
    expect(JSON.stringify([...sim.player.cooldowns.entries()])).toBe(previousCooldowns);
    expect(sim.players.get(pid)?.known.map(k=>k.def.id)).toEqual(priorKnown);
  });
  it('preserves original legacy mage casting without the Hunter admission', () => {
    const sim = new Sim({seed:505,playerClass:'mage'});
    expect(sim.players.get(sim.player.id)?.originHunter).toBeUndefined();
    expect(sim.players.get(sim.player.id)?.known.some(k=>k.def.id==='fireball')).toBe(true);
  });
  it('preserves original dagger/backstab and shield cast gates', () => {
    const backstab=ABILITIES.backstab;
    expect(backstab.class).toBe('rogue');
    expect(effectsRequireDagger(backstab.effects)).toBe(true);
    expect(effectsRequireDagger(ABILITIES.fireball.effects)).toBe(false);
    expect(ABILITIES.shield_slam.requiresShield).toBe(true);
    expect(wieldsDagger({mainhand:'rusty_dagger'},1)).toBe(true);
    expect(wieldsDagger({mainhand:'worn_sword'},1)).toBe(false);
    expect(shieldEquipped({offhand:'eastbrook_buckler'})).toBe(true);
  });
  it('touches no legacy cost, animation, attack, movement or training implementation', () => {
    const native=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
    const helper=readFileSync('src/sim/highfly_origin_resource_admission.ts','utf8');
    expect(native).toContain('if (meta.originHunter) {');
    expect(native).toContain('const admission = originResourceAdmission(ability, p.resourceType);');
    expect(native).toContain('if (!admission.allowed) {');
    expect(helper).not.toContain('spendResource(');
    expect(native).toContain("if (ability.requiresShield) {");
    expect(native).toContain("if (!p.weapon.dagger) {");
  });
});
