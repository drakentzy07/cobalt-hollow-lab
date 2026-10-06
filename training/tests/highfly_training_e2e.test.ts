import { describe, expect, it } from 'vitest';
import { runTrainingSessionPipeline } from '../src/highfly/training/pipeline';
import { progressCostForCurrent } from '../src/highfly/training/adaptation';
import {
  allocateTrainingPoints,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
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
  it('starts awakened and first real session earns decimal TP without auto-allocation', () => {
    const profile = createHighflyHunterProfile({ profileId: 'e2e', classId: 'warrior' });
    const before = profile.training.core.STR.current;
    const first = runTrainingSessionPipeline({
      profile, session: session('baseline', 85),
      definitions: new Map([[squat.exerciseId, squat]]),
      recordedAt: '2026-09-30T01:00:00.000Z',
    });
    expect(first.profile.training.core.STR.current).toBeCloseTo(before, 10);
    expect(first.profile.training.core.STR.trainingGrowth).toBe(0);
    expect(first.profile.training.points.available).toBeGreaterThan(0);
    expect(first.outcomes.find((o) => o.stat === 'STR')?.outcome).toBe('calibrated');
  });

  it('earns TP, allocates freely, then changes derived game power exactly once', () => {
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
    expect(improved.profile.training.core.STR.current).toBe(0);
    expect(improved.profile.training.points.available).toBeGreaterThan(0);

    const restored = JSON.parse(JSON.stringify(improved.profile));
    expect(restored.training.core.STR.current).toBe(0);
    expect(restored.training.points.available).toBeCloseTo(
      improved.profile.training.points.available,
      10,
    );

    const total = improved.profile.training.points.available;
    let allocated = allocateTrainingPoints(improved.profile, 'STR', total / 3);
    allocated = allocateTrainingPoints(allocated, 'PER', total / 3);
    allocated = allocateTrainingPoints(
      allocated,
      'INT',
      allocated.training.points.available,
    );
    expect(allocated.training.points.available).toBeCloseTo(0, 10);
    expect(allocated.training.core.STR.current).toBeGreaterThan(0);
    expect(allocated.training.core.PER.current).toBeGreaterThan(0);
    expect(allocated.training.core.INT.current).toBeGreaterThan(0);

    setActiveHighflyHunterProfile(allocated);
    const entity: Parameters<typeof bindActiveTrainingCombatEntity>[0] & {
      highflyResourceCostMultiplier?: number;
      highflyResourceRecoveryMultiplier?: number;
    } = {
      id: 1003,
      attackPower: 100,
      rangedPower: 0,
      spellPower: 50,
      healPower: 60,
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
      enabled: true, applyMovement: true, applyPerception: true, applyIntelligence: true,
    });
    applyActiveTrainingBridgeToEntity(entity);

    // STR / PER / INT are Training-only Core; only DERIVED game outputs move.
    expect(entity.attackPower).toBeGreaterThan(100);
    expect(entity.spellPower).toBeGreaterThan(50);
    expect(entity.healPower).toBeGreaterThan(60);
    expect(entity.maxHp).toBeGreaterThan(1000);
    expect(entity.hitBonus).toBeGreaterThan(0);
    expect(entity.critDmgPhysBonus).toBeGreaterThan(0);
    expect(entity.highflyResourceCostMultiplier ?? 1).toBeLessThan(1);
    expect(entity.highflyResourceRecoveryMultiplier ?? 1).toBeGreaterThan(1);

    const once = JSON.stringify(entity);
    refreshActiveTrainingCombatBridge();
    refreshActiveTrainingCombatBridge();
    expect(JSON.stringify(entity)).toBe(once);
  });
});
