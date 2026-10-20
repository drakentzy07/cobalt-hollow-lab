import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_LAB_LEVEL,
  HIGHFLY_ORIGIN_MODE_CONTRACT,
  highflyOriginModeContract,
  normalizeHighflyOriginMode,
} from '../src/highfly/origin/unified_mode';

describe('HIGHFLY ORIGIN — one-app dual-mode contract (not yet wired)', () => {
  it('defaults to the real Hunter whenever mode is missing/invalid', () => {
    expect(normalizeHighflyOriginMode(undefined)).toBe('world');
    expect(normalizeHighflyOriginMode('')).toBe('world');
    expect(normalizeHighflyOriginMode('admin')).toBe('world');
    expect(normalizeHighflyOriginMode('lab')).toBe('lab');
  });
  it('preserves original Draken storage identity exactly', () => {
    const world = highflyOriginModeContract('world');
    expect(world.saveDb).toBe('highfly-offline');
    expect(world.saveSlot).toBe('origin-f1:primary');
    expect(world.saveLocal).toBe('highfly.origin.primary.v1');
    expect(world.progressAffectsHunter).toBe(true);
    expect(world.levelOverride).toBeNull();
  });
  it('isolates LAB save writes, resets and progress completely', () => {
    const world = HIGHFLY_ORIGIN_MODE_CONTRACT.world;
    const lab = HIGHFLY_ORIGIN_MODE_CONTRACT.lab;
    expect(lab.saveDb).not.toBe(world.saveDb);
    expect(lab.saveSlot).not.toBe(world.saveSlot);
    expect(lab.saveLocal).not.toBe(world.saveLocal);
    expect(lab.progressAffectsHunter).toBe(false);
    expect(lab.temporarySkillAccess).toBe(true);
    expect(lab.levelOverride).toBe(HIGHFLY_LAB_LEVEL);
  });
});
