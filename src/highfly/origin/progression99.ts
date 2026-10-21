/** HIGHFLY LV99 real XP; ClaudeCraft retains its native LV20 contracts. */
import { MAX_LEVEL, xpForLevel, xpToReachLevel } from '../../sim/types';
export const HIGHFLY_ORIGIN_REAL_MAX_LEVEL = 99 as const;
export const highflyOriginLevelCap = (enabled: boolean): number => enabled ? HIGHFLY_ORIGIN_REAL_MAX_LEVEL : MAX_LEVEL;
export function highflyOriginXpCost(level: number, enabled: boolean): number {
  if (!enabled) return xpForLevel(level);
  if (!Number.isInteger(level) || level < 1 || level >= HIGHFLY_ORIGIN_REAL_MAX_LEVEL) return 0;
  if (level < MAX_LEVEL) return xpForLevel(level);
  return xpToReachLevel(level + 1) - xpToReachLevel(level);
}
export function highflyOriginClampLevel(level: number, enabled: boolean): number {
  return Math.max(1, Math.min(highflyOriginLevelCap(enabled), Number.isFinite(level) ? Math.trunc(level) : 1));
}
