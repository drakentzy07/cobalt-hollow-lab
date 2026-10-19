import type {
  HighflyCycleProgressionState,
  HighflyHunterProfile,
} from './core';

export type HighflyCycleWeekNumber = 1 | 2 | 3 | 4;

export interface NormalizedCycleProgressionState extends HighflyCycleProgressionState {
  activeWeek: HighflyCycleWeekNumber;
  resetHistory: NonNullable<HighflyCycleProgressionState['resetHistory']>;
}

export function normalizeCycleProgression(
  profile: HighflyHunterProfile | null,
): NormalizedCycleProgressionState {
  const state = profile?.training.cycleProgression;
  const activeWeek = Math.max(1, Math.min(4, Math.trunc(state?.activeWeek ?? 1))) as HighflyCycleWeekNumber;
  return {
    currentCycle: Math.max(1, Math.trunc(state?.currentCycle ?? 1)),
    activeWeek,
    successfulCycles: Math.max(0, Math.trunc(state?.successfulCycles ?? 0)),
    repeatedCycles: Math.max(0, Math.trunc(state?.repeatedCycles ?? 0)),
    lastDecision: state?.lastDecision ?? null,
    completedSessions: [...(state?.completedSessions ?? [])],
    resetHistory: [...(state?.resetHistory ?? [])],
  };
}

export function cycleSessionKey(week: number, day: number): string {
  return `${Math.max(1, Math.min(4, Math.trunc(week)))}:${Math.max(1, Math.min(5, Math.trunc(day)))}`;
}

export function cycleWeekComplete(
  state: NormalizedCycleProgressionState,
  week: number,
): boolean {
  for (let day = 1; day <= 5; day++) {
    if (!state.completedSessions.includes(cycleSessionKey(week, day))) return false;
  }
  return true;
}

export function canTrainCycleSession(
  state: NormalizedCycleProgressionState,
  week: number,
  day: number,
): boolean {
  return (
    week === state.activeWeek &&
    !state.completedSessions.includes(cycleSessionKey(week, day))
  );
}

export function unlockNextCycleWeek(
  profile: HighflyHunterProfile,
): HighflyHunterProfile {
  const state = normalizeCycleProgression(profile);
  if (!cycleWeekComplete(state, state.activeWeek)) {
    throw new Error('HIGHFLY: completá los 5 días de la semana activa antes de habilitar la siguiente.');
  }
  if (state.activeWeek >= 4) {
    throw new Error('HIGHFLY: la semana 4 cierra el ciclo; no existe una semana posterior dentro del bloque.');
  }
  const activeWeek = (state.activeWeek + 1) as HighflyCycleWeekNumber;
  return {
    ...profile,
    training: {
      ...profile.training,
      cycleProgression: {
        ...state,
        activeWeek,
      },
    },
  };
}

export function restartCurrentCycle(
  profile: HighflyHunterProfile,
  reason: string,
  resetAt = new Date().toISOString(),
): HighflyHunterProfile {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) {
    throw new Error('HIGHFLY: indicá el motivo del reinicio de ciclo.');
  }
  const state = normalizeCycleProgression(profile);
  const resetHistory = [
    ...state.resetHistory,
    {
      cycle: state.currentCycle,
      resetAt,
      reason: cleanReason,
      completedSessions: [...state.completedSessions],
      activeWeek: state.activeWeek,
    },
  ].slice(-20);

  return {
    ...profile,
    training: {
      ...profile.training,
      cycleProgression: {
        ...state,
        activeWeek: 1,
        completedSessions: [],
        resetHistory,
      },
    },
  };
}
