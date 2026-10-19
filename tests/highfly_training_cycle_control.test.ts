import { describe, expect, it } from 'vitest';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import {
  canTrainCycleSession,
  cycleWeekComplete,
  normalizeCycleProgression,
  restartCurrentCycle,
  unlockNextCycleWeek,
} from '../src/highfly/training/cycle_control';

describe('HIGHFLY cycle authority', () => {
  it('starts on week 1 and future weeks are view-only', () => {
    const profile = createHighflyHunterProfile({ profileId: 'cycle-a' });
    const state = normalizeCycleProgression(profile);
    expect(state.activeWeek).toBe(1);
    expect(canTrainCycleSession(state, 1, 1)).toBe(true);
    expect(canTrainCycleSession(state, 2, 1)).toBe(false);
  });

  it('locks a completed day from being trained twice', () => {
    const profile = createHighflyHunterProfile({ profileId: 'cycle-b' });
    profile.training.cycleProgression!.completedSessions = ['1:1'];
    const state = normalizeCycleProgression(profile);
    expect(canTrainCycleSession(state, 1, 1)).toBe(false);
    expect(canTrainCycleSession(state, 1, 2)).toBe(true);
  });

  it('unlocks week 2 only after all five week-1 days are complete', () => {
    const profile = createHighflyHunterProfile({ profileId: 'cycle-c' });
    expect(() => unlockNextCycleWeek(profile)).toThrow(/5 días/);
    profile.training.cycleProgression!.completedSessions = ['1:1','1:2','1:3','1:4','1:5'];
    expect(cycleWeekComplete(normalizeCycleProgression(profile), 1)).toBe(true);
    const next = unlockNextCycleWeek(profile);
    expect(normalizeCycleProgression(next).activeWeek).toBe(2);
  });

  it('manual reset preserves Core/RM and audits the reason', () => {
    const profile = createHighflyHunterProfile({ profileId: 'cycle-d' });
    profile.training.core.STR.current = 10;
    profile.training.cycleProgression!.completedSessions = ['1:1','1:2'];
    const reset = restartCurrentCycle(profile, 'viaje y semana interrumpida', '2026-10-03T20:00:00.000Z');
    const state = normalizeCycleProgression(reset);
    expect(state.activeWeek).toBe(1);
    expect(state.completedSessions).toEqual([]);
    expect(state.resetHistory.at(-1)?.reason).toBe('viaje y semana interrumpida');
    expect(reset.training.core.STR.current).toBe(10);
  });
});
