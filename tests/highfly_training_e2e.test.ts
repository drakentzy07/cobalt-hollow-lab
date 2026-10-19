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
  it('starts with permanent class Core and first real session earns TP without auto-allocation', () => {
    const profile = createHighflyHunterProfile({ profileId: 'e2e', classId: 'warrior' });
    const before = profile.training.core.STR.current;
    expect(before).toBeGreaterThan(0);

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

  it('earns TP, allocates freely, and bridge never double-counts Claude primary-derived power', () => {
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

    expect(improved.outcomes.find((o) => o.stat === 'STR')?.outcome).toBe('stat_up');
    const naturalStr = improved.profile.training.core.STR.current;
    expect(naturalStr).toBeGreaterThan(0);
    expect(improved.profile.training.core.STR.trainingAllocated).toBe(0);
    expect(improved.profile.training.points.available).toBeGreaterThan(0);

    const total = improved.profile.training.points.available;
    let allocated = allocateTrainingPoints(improved.profile, 'STR', total / 3);
    allocated = allocateTrainingPoints(allocated, 'PER', total / 3);
    allocated = allocateTrainingPoints(
      allocated,
      'INT',
      allocated.training.points.available,
    );

    expect(allocated.training.points.available).toBeCloseTo(0, 10);
    expect(allocated.training.core.STR.current).toBeGreaterThan(naturalStr);
    expect(allocated.training.core.PER.trainingAllocated).toBeGreaterThan(0);
    expect(allocated.training.core.INT.trainingAllocated).toBeGreaterThan(0);

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

    // Permanent Core already entered Claude's recalc. Bridge must not add AP/HP/crit again.
    expect(entity.attackPower).toBe(100);
    expect(entity.rangedPower).toBe(0);
    expect(entity.spellPower).toBe(50);
    expect(entity.healPower).toBe(60);
    expect(entity.maxHp).toBe(1000);
    expect(entity.critChance).toBe(0.05);
    expect(entity.dodgeChance).toBe(0.05);

    // Only HIGHFLY-specific side mechanics remain in this bridge.
    expect(entity.moveSpeed).toBeGreaterThan(7);
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
