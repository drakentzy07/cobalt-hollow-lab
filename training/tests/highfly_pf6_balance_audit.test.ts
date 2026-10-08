import { describe, expect, it } from 'vitest';
import { MOBS, ZONES } from '../src/sim/data';
import { mobXpValue, MAX_LEVEL, xpForLevel } from '../src/sim/types';
import {
  HIGHFLY_PF6_NORMAL_MAX_LEVEL,
  highflyPf6CumulativeXpToLevel,
} from '../src/highfly/training/pf6_xp_curve';

/**
 * PF-6 F / BALANCE OBSERVATORY (read-only).
 *
 * These tests do NOT certify the 1–99 game as balanced. They guard a smooth
 * XP threshold and expose a real authored-content/progression bottleneck.
 * Kill estimates assume SOLO, equal-level NORMAL mob, no quests/rested/events.
 */
describe('HIGHFLY PF-6 F: XP economics + authored-world readiness', () => {
  it('has no sudden high-level XP-cost discontinuity', () => {
    expect(MAX_LEVEL).toBe(HIGHFLY_PF6_NORMAL_MAX_LEVEL);
    for (let level = 20; level < 98; level++) {
      const increase = xpForLevel(level + 1) / xpForLevel(level);
      expect(increase).toBeGreaterThan(1);
      expect(increase).toBeLessThanOrEqual(1.09);
    }
    expect(highflyPf6CumulativeXpToLevel(99)).toBe(14_800_600);
  });

  it('reports actual world enemy levels and the donor gray-XP gate without pretending balance is finished', () => {
    const zoneHighs = ZONES.map((zone) => ({
      name: zone.name,
      max: zone.levelRange[1],
    }));
    const mobHighs = Object.values(MOBS)
      .map((mob) => mob.maxLevel)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const maxZoneLevel = Math.max(0, ...zoneHighs.map((zone) => zone.max));
    const maxMobTemplateLevel = Math.max(0, ...mobHighs);
    const firstGrayLevelFor20 = Array.from({ length: 99 }, (_, i) => i + 1)
      .find((level) => level > 20 && mobXpValue(20, level) === 0);
    expect(firstGrayLevelFor20).toBe(28);
    expect(mobXpValue(20, 27)).toBeGreaterThan(0);
    expect(mobXpValue(20, 28)).toBe(0);
    const levelSamples = [20, 40, 60, 80, 98].map((level) => {
      const target = xpForLevel(level);
      const normalAtLevelXp = mobXpValue(level, level);
      return {
        level,
        nextLevelCost: target,
        normalAtLevelMobXp: normalAtLevelXp,
        soloSameLevelKillsWithoutQuests: Math.ceil(target / normalAtLevelXp),
      };
    });
    const missingTier = maxZoneLevel < HIGHFLY_PF6_NORMAL_MAX_LEVEL;
    const report = {
      status: missingTier ? 'CONTENT_TIERS_INCOMPLETE' : 'CONTENT_TIERS_REQUIRE_PLAYTEST',
      maxZoneLevel,
      maxMobTemplateLevel,
      firstGrayLevelForLevel20Monster: firstGrayLevelFor20,
      xp1To99: highflyPf6CumulativeXpToLevel(99),
      levelSamples,
      note: 'XP economy is mechanically valid but high-level mob tiers, quests and human pacing are not balance-certified.',
    };
    // Emit verifiable diagnostics to GitHub Actions rather than a fake GREEN balance claim.
    console.info('HIGHFLY_PF6_F_BALANCE_AUDIT=' + JSON.stringify(report));
    expect(zoneHighs.length).toBeGreaterThan(0);
    expect(mobHighs.length).toBeGreaterThan(0);
    expect(levelSamples[0].soloSameLevelKillsWithoutQuests).toBe(160);
    expect(levelSamples[4].soloSameLevelKillsWithoutQuests).toBe(818);
  });
});
