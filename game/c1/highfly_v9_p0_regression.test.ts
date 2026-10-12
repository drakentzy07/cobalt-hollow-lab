import { describe, expect, it } from 'vitest';
import { bestSoftAutoTarget } from '../src/game/auto_target';
import { ABILITIES } from '../src/sim/content/classes';
import { moveSpeedMult } from '../src/sim/player_motion';
import type { Entity } from '../src/sim/types';

type Candidate = { id: number; pos: { x: number; z: number }; hp?: number; maxHp?: number };
const origin = { x: 0, z: 0 };
const select = (enemies: Candidate[], current: number | null = null, range = 40) =>
  bestSoftAutoTarget(enemies, origin, 0, () => true, range, current);

describe('HIGHFLY V9 P0 360° target + Rogue movement regression', () => {
  it('prefers a frontal enemy when similar distances', () => {
    expect(select([{ id: 1, pos: { x: 0, z: 3 } }, { id: 2, pos: { x: 0, z: -2.6 } }])).toBe(1);
  });
  it('acquires the enemy behind when no one is in front', () => {
    expect(select([{ id: 2, pos: { x: 0, z: -2 } }])).toBe(2);
  });
  it('does not chase a distant frontal enemy with a mob at the back', () => {
    expect(select([{ id: 1, pos: { x: 0, z: 5 } }, { id: 2, pos: { x: 0, z: -2 } }])).toBe(2);
  });
  it('uses nearest distance with two frontal mobs', () => {
    expect(select([{ id: 1, pos: { x: 0, z: 6 } }, { id: 2, pos: { x: 0, z: 2 } }])).toBe(2);
  });
  it('does not change target on every press within the score hysteresis', () => {
    expect(select([{ id: 1, pos: { x: 0, z: 2.5 } }, { id: 2, pos: { x: 0, z: 2.1 } }], 1)).toBe(1);
  });
  it('abandons an old distant soft target for an immediate threat', () => {
    expect(select([{ id: 1, pos: { x: 0, z: 20 } }, { id: 2, pos: { x: 0, z: -2 } }], 1)).toBe(2);
  });
  it('filters non-hostiles using caller predicate and respects attack range', () => {
    const c = [{ id: 10, pos: { x: 0, z: 1 } }, { id: 11, pos: { x: 0, z: -3 } }];
    expect(bestSoftAutoTarget(c, origin, 0, (e) => e.id !== 10, 12)).toBe(11);
    expect(select([{ id: 12, pos: { x: 0, z: 20 } }], null, 12)).toBeNull();
  });
  it('keeps Duskveil/Smokefade at 90 percent, and no rogue stealth over-speed', () => {
    const stealth = ABILITIES.stealth.effects;
    const vanish = ABILITIES.vanish.effects;
    expect(JSON.stringify(stealth)).toContain('"value":0.9');
    expect(JSON.stringify(vanish)).toContain('"value":0.9');
    const e = { ghost: false, mountKey: null,
      auras: [{ kind: 'stealth', id: 'stealth', value: 0.9 }] } as unknown as Entity;
    expect(moveSpeedMult(e)).toBeCloseTo(0.9, 6);
    // False Face boosts stealth aura by 1/9, giving 1.0 after the mastery.
    e.auras[0].value = 0.9 * (1 + 1 / 9);
    expect(moveSpeedMult(e)).toBeCloseTo(1.0, 6);
  });
});
