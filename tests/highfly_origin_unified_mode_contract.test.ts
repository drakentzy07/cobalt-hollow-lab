import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_LAB_START_LEVEL,
  HIGHFLY_ORIGIN_MODE_CONTRACT,
  highflyOriginModeContract,
  normalizeHighflyOriginMode,
  highflyCanPreviewContent,
  highflyMeetsContentLevelGate,
} from '../src/highfly/origin/unified_mode';

describe('HIGHFLY ORIGIN — unified LV1 lab access contract (not yet wired)', () => {
  it('defaults to WORLD if mode is absent/invalid', () => {
    expect(normalizeHighflyOriginMode(undefined)).toBe('world');
    expect(normalizeHighflyOriginMode('')).toBe('world');
    expect(normalizeHighflyOriginMode('admin')).toBe('world');
    expect(normalizeHighflyOriginMode('lab')).toBe('lab');
  });
  it('keeps existing Draken database, slot, mirror and level', () => {
    const world = highflyOriginModeContract('world');
    expect(world.saveDb).toBe('highfly-offline');
    expect(world.saveSlot).toBe('origin-f1:primary');
    expect(world.saveLocal).toBe('highfly.origin.primary.v1');
    expect(world.progressAffectsHunter).toBe(true);
    expect(world.levelOverride).toBeNull();
  });
  it('uses an independent lab namespace without a level-99/stat override', () => {
    const world = HIGHFLY_ORIGIN_MODE_CONTRACT.world;
    const lab = HIGHFLY_ORIGIN_MODE_CONTRACT.lab;
    expect(HIGHFLY_LAB_START_LEVEL).toBe(1);
    expect(lab.saveDb).not.toBe(world.saveDb);
    expect(lab.saveSlot).not.toBe(world.saveSlot);
    expect(lab.saveLocal).not.toBe(world.saveLocal);
    expect(lab.progressAffectsHunter).toBe(false);
    expect(lab.temporaryContentAccess).toBe(true);
    expect(lab.levelOverride).toBeNull();
  });
  it('previews high-level content at level 1 ONLY under lab policy', () => {
    expect(highflyMeetsContentLevelGate('world',1,18)).toBe(false);
    expect(highflyMeetsContentLevelGate('world',18,18)).toBe(true);
    expect(highflyMeetsContentLevelGate('lab',1,18)).toBe(true);
    expect(highflyMeetsContentLevelGate('lab',1,99)).toBe(true);
    expect(highflyMeetsContentLevelGate('lab',0,18)).toBe(false);
    expect(highflyMeetsContentLevelGate('lab',1,Number.NaN)).toBe(false);
    for(const kind of ['skill','equipment','loot','recipe','monster','scenario'] as const) {
      expect(highflyCanPreviewContent('lab',kind)).toBe(true);
      expect(highflyCanPreviewContent('world',kind)).toBe(false);
    }
  });
});
