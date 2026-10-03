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
  exerciseId: 'back_squat',
  pattern: 'squat',
  role: 'strength',
  loadMode: 'external_kg',
  rmReferenceKg: 100,
};

function session(id: string, loadKg: number): SessionRecord {
  return {
    sessionId: id,
    routineId: 'HF_REFERENCE_5D_SUPREME_V1',
    block: 'reference',
    week: 1,
    day: 1,
    readiness: 0.9,
    isDeload: false,
    completed: true,
    sets: [
      {
        setId: id + '-set',
        exerciseId: 'back_squat',
        reps: 5,
        loadKg,
        restSec: 180,
        intent: 'strength',
        quality: 1,
      },
    ],
  };
}

describe('HIGHFLY Training RUN1-H end-to-end', () => {
  it('starts at zero and activates the bridge on the first real comparable calibration', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'e2e',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
    const first = runTrainingSessionPipeline({
      profile,
      session: session('baseline', 85),
      definitions: new Map([[squat.exerciseId, squat]]),
      recordedAt: '2026-09-30T01:00:00.000Z',
    });

    expect(first.profile.training.core.STR.calibrated).toBe(true);
    expect(first.profile.training.core.STR.current).toBeCloseTo(
      first.sessionResult.stimulus.STR,
      2,
    );
    expect(first.profile.training.core.STR.current).not.toBe(10);
    expect(first.outcomes.find((o) => o.stat === 'STR')?.outcome).toBe('calibrated');
    expect(first.profile.training.performance?.STR?.baseline).toBeGreaterThan(0);
    const firstStrHistory = [...(first.profile.training.history ?? [])]
      .reverse()
      .find((entry) => entry.stat === 'STR');
    expect(firstStrHistory?.outcome).toBe('calibrated');
    expect(trainingGain(first.profile.training.core.STR.current)).toBeGreaterThan(0);
  });

  it('consolidates a comparable improvement, persists it, and changes local combat AP', () => {
    clearActiveHighflyHunterProfile();

    const initial = createHighflyHunterProfile({
      profileId: 'e2e',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
    const baseline = runTrainingSessionPipeline({
      profile: initial,
      session: session('baseline', 85),
      definitions: new Map([[squat.exerciseId, squat]]),
      recordedAt: '2026-09-30T01:00:00.000Z',
    });

    baseline.profile.training.core.STR.progress = progressCostForCurrent(
      baseline.profile.training.core.STR.current,
    );

    const improved = runTrainingSessionPipeline({
      profile: baseline.profile,
      session: session('improved', 90),
      definitions: new Map([[squat.exerciseId, squat]]),
      recordedAt: '2026-09-30T02:00:00.000Z',
    });

    const strOutcome = improved.outcomes.find((o) => o.stat === 'STR');
    expect(strOutcome?.outcome).toBe('stat_up');
    expect(strOutcome?.statDelta).toBe(1);
    expect(improved.profile.training.core.STR.current).toBeCloseTo(
      baseline.profile.training.core.STR.current + 1,
      2,
    );
    expect(improved.profile.training.core.STR.peak).toBeCloseTo(
      baseline.profile.training.core.STR.current + 1,
      2,
    );
    expect(improved.profile.training.performance?.STR?.baseline).toBeGreaterThan(
      baseline.profile.training.performance?.STR?.baseline ?? 0,
    );

    const restored = JSON.parse(JSON.stringify(improved.profile));
    expect(restored.training.core.STR.current).toBeCloseTo(
      improved.profile.training.core.STR.current,
      2,
    );
    expect(restored.training.performance.STR.baseline).toBe(
      improved.profile.training.performance?.STR?.baseline,
    );
    const restoredStrHistory = [...restored.training.history]
      .reverse()
      .find((entry) => entry.stat === 'STR');
    expect(restoredStrHistory?.outcome).toBe('stat_up');

    setActiveHighflyHunterProfile(improved.profile);
    const entity = {
      id: 1003,
      attackPower: 100,
      rangedPower: 0,
      maxHp: 1000,
      hp: 800,
      critChance: 0.05,
      dodgeChance: 0.05,
      hitBonus: 0,
      critDmgPhysBonus: 0,
      critDmgSpellBonus: 0,
      critDmgHealBonus: 0,
      moveSpeed: 7,
      dead: false,
    };

    bindActiveTrainingCombatEntity(entity);
    setActiveTrainingBridgeFlags({
      enabled: true,
      applyMovement: false,
      applyPerception: true,
      applyIntelligence: false,
    });
    applyActiveTrainingBridgeToEntity(entity);

    expect(entity.attackPower).toBeGreaterThan(100);
    expect(entity.maxHp).toBe(1000);
    expect(entity.hp).toBe(800);

    const afterFirstRefresh = entity.attackPower;
    refreshActiveTrainingCombatBridge();
    refreshActiveTrainingCombatBridge();
    expect(entity.attackPower).toBe(afterFirstRefresh);
  });

  it('calibrates VIT from valid 7+ rep endurance evidence without inventing a free Stat Up', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'vit-pending',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
    const volume: ExerciseDefinition = {
      exerciseId: 'leg_press',
      pattern: 'squat',
      role: 'hypertrophy',
      loadMode: 'external_kg',
      rmReferenceKg: 100,
    };
    const result = runTrainingSessionPipeline({
      profile,
      session: {
        sessionId: 'volume',
        routineId: 'HF_REFERENCE_5D_SUPREME_V1',
        block: 'reference',
        week: 1,
        day: 5,
        readiness: 0.9,
        isDeload: false,
        completed: true,
        sets: [
          {
            setId: 'volume-set',
            exerciseId: 'leg_press',
            reps: 10,
            loadKg: 60,
            restSec: 90,
            intent: 'hypertrophy',
            quality: 1,
          },
        ],
      },
      definitions: new Map([[volume.exerciseId, volume]]),
      recordedAt: '2026-09-30T03:00:00.000Z',
    });

    expect(result.profile.training.core.VIT.calibrated).toBe(true);
    expect(result.profile.training.core.VIT.current).toBeCloseTo(
      result.sessionResult.stimulus.VIT,
      2,
    );
    expect(result.profile.training.core.VIT.progress).toBeGreaterThan(0);
    expect(result.profile.training.performance?.VIT?.baseline).toBeGreaterThan(0);
    expect(result.outcomes.find((o) => o.stat === 'VIT')?.outcome).toBe(
      'calibrated',
    );
  });
});
