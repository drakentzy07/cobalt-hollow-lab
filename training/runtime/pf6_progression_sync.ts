/**
 * HIGHFLY PF-6 C: gameplay XP/level -> existing Hunter Training-profile mirror.
 *
 * Source authority remains the donor Sim. This consumes settled events after
 * grantXp; it NEVER grants XP or Training Points. The existing offline save
 * process persists the active profile, and relog restores from donor Sim.
 */
import { applyHunterProgression, HIGHFLY_NORMAL_MAX_LEVEL, type HighflyHunterProfile } from './core';
import {
  getActiveHighflyHunterProfile,
  updateActiveHighflyHunterProfile,
} from './profile_store';

export interface HighflyPf6GameplaySnapshot {
  localEntityId: number;
  /** The donor event PID may be omitted; an unaddressed event never changes a Hunter. */
  eventEntityId?: number;
  level: number;
  barXp: number;
  classId: string;
}

/** No local Hunter = no-op; do not touch party/probes/other players. */
export function syncHighflyPf6FromGameplay(
  snapshot: HighflyPf6GameplaySnapshot,
): HighflyHunterProfile | null {
  const current = getActiveHighflyHunterProfile();
  if (!current || !current.awakening.initialized || !current.awakening.classId) return null;
  if (snapshot.localEntityId !== snapshot.eventEntityId) return null;
  if (current.awakening.classId !== snapshot.classId) return null;
  if (!Number.isInteger(snapshot.level) || snapshot.level < 1 ||
    snapshot.level > HIGHFLY_NORMAL_MAX_LEVEL) return null;
  if (!Number.isSafeInteger(snapshot.barXp) || snapshot.barXp < 0) return null;
  const barXp = snapshot.level === HIGHFLY_NORMAL_MAX_LEVEL ? 0 : snapshot.barXp;
  if (current.hunter.level === snapshot.level && current.hunter.xp === barXp) return current;

  // ONLY projection: applyHunterProgression recomputes natural level growth.
  // The Training wallet and its proof-bearing allocation remain unchanged.
  return updateActiveHighflyHunterProfile((profile) =>
    applyHunterProgression(profile, {
      level: snapshot.level,
      xp: barXp,
      classId: snapshot.classId,
    }),
  );
}
