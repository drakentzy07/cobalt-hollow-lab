/** SF4 native runtime smoke: actual priest casts in the original ClaudeCraft Sim.
 * This is an authored test, NOT a recorded GREEN test run.
 * No Pages, Training progression or persisted character is touched.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ABILITIES, CLASSES } from '../src/sim/content/classes';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';
import { installSf4NativePilots } from '../src/highfly/sf4_safe_fusions';

let installedLocally: readonly string[] = [];
beforeAll(() => {
  // The isolated overlay may already have registered these via VITE_HIGHFLY_SF4.
  if (!ABILITIES.hf_priest_s2 && !ABILITIES.hf_priest_s3) {
    installedLocally = installSf4NativePilots(ABILITIES, CLASSES).registered;
  }
  expect(ABILITIES.hf_priest_s2).toBeDefined();
  expect(ABILITIES.hf_priest_s3).toBeDefined();
  expect(ABILITIES.hf_warrior_u1).toBeDefined();
  expect(ABILITIES.hf_rogue_s4).toBeDefined();
  expect(CLASSES.warrior.abilities).toContain('hf_warrior_u1');
  expect(CLASSES.rogue.abilities).toContain('hf_rogue_s4');
  expect(CLASSES.priest.abilities).toContain('hf_priest_s2');
  expect(CLASSES.priest.abilities).toContain('hf_priest_s3');
});
afterAll(() => {
  for (const id of installedLocally) {
    delete ABILITIES[id];
    const classId = id.startsWith('hf_warrior_') ? 'warrior' : id.startsWith('hf_rogue_') ? 'rogue' : 'priest';
    const at = CLASSES[classId].abilities.indexOf(id);
    if (at >= 0) CLASSES[classId].abilities.splice(at, 1);
  }
});

function priestAt(level: number): Sim {
  const sim = new Sim({ seed: 43013, playerClass: 'priest', autoEquip: true });
  sim.setPlayerLevel(level);
  sim.tick();
  const p = sim.player;
  p.resource = p.maxResource;
  p.hitBonus = 1; // isolate cast/effect dispatch from random resist rolls
  return sim;
}

function inertTarget(sim: Sim, id: number, yards: number): Entity {
  const p = sim.player;
  const target = createMob(id, MOBS.training_dummy, 20, {
    x: p.pos.x,
    y: p.pos.y,
    z: p.pos.z + yards,
  });
  target.hostile = true;
  target.hp = target.maxHp = 100000;
  target.aiState = 'idle';
  (sim as unknown as { addEntity(entity: Entity): void }).addEntity(target);
  return target;
}

describe('SF4 Warrior and Rogue — original Sim native self/raid effect gates', () => {
  it('Warrior U1 applies AP raid buff and temporary max HP using its real 180s cooldown', () => {
    const sim = new Sim({ seed: 43014, playerClass: 'warrior', autoEquip: true });
    sim.setPlayerLevel(25);
    sim.tick();
    const p = sim.player;
    const maxBefore = p.maxHp;
    sim.castAbility('hf_warrior_u1', p.id);
    sim.tick();
    expect(p.cooldowns.has('hf_warrior_u1')).toBe(true);
    expect(p.auras.some(a => a.kind === 'buff_ap_pct')).toBe(true);
    expect(p.auras.some(a => a.kind === 'buff_maxhp_pct')).toBe(true);
    expect(p.maxHp).toBeGreaterThan(maxBefore);
  });
  it('Rogue S4 applies BOTH movement speed and dodge on its true 300s off-GCD', () => {
    const sim = new Sim({ seed: 43015, playerClass: 'rogue', autoEquip: true });
    sim.setPlayerLevel(15);
    sim.tick();
    const p = sim.player;
    sim.castAbility('hf_rogue_s4', p.id);
    sim.tick();
    expect(p.cooldowns.has('hf_rogue_s4')).toBe(true);
    expect(p.auras.some(a => a.kind === 'buff_speed')).toBe(true);
    expect(p.auras.some(a => a.kind === 'buff_dodge')).toBe(true);
  });
  it('Warrior U1 and Rogue S4 both reject below-unlock casts', () => {
    for (const [cl, lv, skill] of [
      ['warrior',24,'hf_warrior_u1'],
      ['rogue',14,'hf_rogue_s4'],
    ] as const) {
      const sim = new Sim({seed:43016,playerClass:cl,autoEquip:true});
      sim.setPlayerLevel(lv);
      sim.tick();
      const p=sim.player;
      const before=p.resource;
      sim.castAbility(skill,p.id);
      sim.tick();
      expect(p.resource).toBe(before);
      expect(p.cooldowns.has(skill)).toBe(false);
    }
  });
});

describe('SF4 two Priest pilots — ORIGINAL Sim effect and cast gates', () => {
  it('LV20 Azote Mental spends resource, enters cooldown, deals damage and applies a DoT', () => {
    const sim = priestAt(20);
    const target = inertTarget(sim, 43100, 8);
    const priest = sim.player;
    const initialResource = priest.resource;
    const initialHp = target.hp;
    sim.targetEntity(target.id, priest.id);
    sim.castAbility('hf_priest_s2', priest.id);
    for (let i = 0; i < 90; i++) sim.tick();
    expect(priest.resource).toBeLessThan(initialResource);
    expect(priest.cooldowns.has('hf_priest_s2')).toBe(true);
    expect(target.hp).toBeLessThan(initialHp);
    expect(target.auras.some(a => a.kind === 'dot' && a.sourceId === priest.id)).toBe(true);
  });
  it('LV20 Escudo Renovador gives both absorb and periodic healing to the caster', () => {
    const sim = priestAt(20);
    const priest = sim.player;
    priest.hp = Math.max(1, Math.round(priest.maxHp / 3));
    const startResource = priest.resource;
    sim.castAbility('hf_priest_s3', priest.id);
    sim.tick();
    expect(priest.resource).toBeLessThan(startResource);
    expect(priest.auras.some(a => a.kind === 'absorb')).toBe(true);
    expect(priest.auras.some(a => a.kind === 'hot')).toBe(true);
    const startHp = priest.hp;
    for (let i = 0; i < 70; i++) sim.tick();
    expect(priest.hp).toBeGreaterThan(startHp);
  });
  it('Azote Mental refuses out-of-range target without spending resource or cooldown', () => {
    const sim = priestAt(20);
    const priest = sim.player;
    const far = inertTarget(sim, 43101, 100);
    const initialResource = priest.resource;
    sim.targetEntity(far.id, priest.id);
    sim.castAbility('hf_priest_s2', priest.id);
    sim.tick();
    expect(priest.resource).toBe(initialResource);
    expect(priest.cooldowns.has('hf_priest_s2')).toBe(false);
    expect(far.hp).toBe(far.maxHp);
  });
  it('unlock contract rejects Azote at LV4 and Escudo at LV9', () => {
    for (const [level, ability] of [[4, 'hf_priest_s2'], [9, 'hf_priest_s3']] as const) {
      const sim = priestAt(level);
      const priest = sim.player;
      const before = priest.resource;
      sim.castAbility(ability, priest.id);
      sim.tick();
      expect(priest.resource).toBe(before);
      expect(priest.cooldowns.has(ability)).toBe(false);
    }
  });
});
