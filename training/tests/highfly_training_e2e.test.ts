import { describe, expect, it } from 'vitest';
import { runTrainingSessionPipeline } from '../src/highfly/training/pipeline';
import { progressCostForCurrent } from '../src/highfly/training/adaptation';
import { trainingGain } from '../src/highfly/training/bridge';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import type { ExerciseDefinition, SessionRecord } from '../src/highfly/training/engine';
import {
  applyActiveTrainingBridgeToEntity,
  bindActiveTrainingCombatEntity,
  refreshActiveTrainingCombatBridge,
  setActiveTrainingBridgeFlags,
} from '../src/highfly/training/combat_runtime';
import {
  clearActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';

const squat: ExerciseDefinition = {
  exerciseId: 'back_squat', pattern: 'squat', role: 'strength',
  loadMode: 'external_kg', rmReferenceKg: 100,
};
function session(id: string, loadKg: number): SessionRecord {
  return {
    sessionId: id, routineId: 'HF_REFERENCE_5D_SUPREME_V1',
    block: 'reference', week: 1, day: 1, readiness: 0.9, isDeload: false, completed: true,
    sets: [{ setId: id + '-set', exerciseId: 'back_squat', reps: 5, loadKg, restSec: 180, intent: 'strength', quality: 1 }],
  };
}

describe('HIGHFLY Training RUN138 end-to-end', () => {
  it('starts awakened and first real session adds decimal growth', () => {
    const profile = createHighflyHunterProfile({ profileId: 'e2e', classId: 'warrior' });
    const before = profile.training.core.STR.current;
    const first = runTrainingSessionPipeline({
      profile, session: session('baseline', 85),
      definitions: new Map([[squat.exerciseId, squat]]),
      recordedAt: '2026-09-30T01:00:00.000Z',
    });
    expect(first.profile.training.core.STR.current).toBeGreaterThan(before);
    expect(first.profile.training.core.STR.trainingGrowth).toBeGreaterThan(0);
    expect(first.outcomes.find((o) => o.stat === 'STR')?.outcome).toBe('calibrated');
    expect(trainingGain(first.profile.training.core.STR.trainingGrowth)).toBeGreaterThan(0);
  });

  it('consolidates a decimal improvement, persists it, and changes local combat AP', () => {
    clearActiveHighflyHunterProfile();
    const initial = createHighflyHunterProfile({ profileId: 'e2e', classId: 'warrior' });
    const baseline = runTrainingSessionPipeline({
      profile: initial, session: session('baseline', 85),
      definitions: new Map([[squat.exerciseId, squat]]),
    });
    baseline.profile.training.core.STR.progress = progressCostForCurrent(
      baseline.profile.training.core.STR.current,
    );
    const improved = runTrainingSessionPipeline({
      profile: baseline.profile, session: session('improved', 90),
      definitions: new Map([[squat.exerciseId, squat]]),
    });
    const outcome = improved.outcomes.find((o) => o.stat === 'STR');
    expect(outcome?.outcome).toBe('stat_up');
    expect(outcome?.statDelta ?? 0).toBeGreaterThan(0);
    expect(outcome?.statDelta ?? 1).toBeLessThan(1);

    const restored = JSON.parse(JSON.stringify(improved.profile));
    expect(restored.training.core.STR.current).toBeCloseTo(improved.profile.training.core.STR.current, 10);
    expect(restored.training.core.STR.trainingGrowth).toBeCloseTo(improved.profile.training.core.STR.trainingGrowth, 10);

    setActiveHighflyHunterProfile(improved.profile);
    const entity = {
      id: 1003, attackPower: 100, rangedPower: 0, maxHp: 1000, hp: 800,
      critChance: 0.05, dodgeChance: 0.05, hitBonus: 0,
      critDmgPhysBonus: 0, critDmgSpellBonus: 0, critDmgHealBonus: 0,
      moveSpeed: 7, dead: false,
    };
    bindActiveTrainingCombatEntity(entity);
    setActiveTrainingBridgeFlags({
      enabled: true, applyMovement: false, applyPerception: true, applyIntelligence: false,
    });
    applyActiveTrainingBridgeToEntity(entity);
    expect(entity.attackPower).toBeGreaterThan(100);
    const once = entity.attackPower;
    refreshActiveTrainingCombatBridge();
    refreshActiveTrainingCombatBridge();
    expect(entity.attackPower).toBe(once);
  });
});
