import { afterEach, describe, expect, it } from 'vitest';
import {
  HIGHFLY_4_WEEK_BLOCK,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V2_ID,
  planLoadKg,
  prescriptionForWeek,
  trainingMaxKg,
} from '../src/highfly/training/personal_routine';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import { scoreTrainingSet, type ExerciseDefinition } from '../src/highfly/training/engine';
import {
  applyActiveTrainingBridgeToEntity,
  clearActiveTrainingCombatBinding,
  bindActiveTrainingCombatEntity,
  setActiveTrainingBridgeFlags,
} from '../src/highfly/training/combat_runtime';
import {
  clearActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';

afterEach(() => {
  clearActiveTrainingCombatBinding();
  clearActiveHighflyHunterProfile();
});

describe('HIGHFLY Training RUN1-J exact routine', () => {
  it('uses the attached 5-day / 4-week routine as the authority', () => {
    expect(HF_HIGHFLY_PERSONAL_5D_V2_ID).toBe('HF_HIGHFLY_PERSONAL_5D_V2');
    expect(HIGHFLY_PERSONAL_5D_ROUTINE).toHaveLength(5);
    expect(HIGHFLY_4_WEEK_BLOCK).toHaveLength(4);
    expect(HIGHFLY_PERSONAL_5D_ROUTINE.map((day) => day.name)).toEqual([
      'Pierna + Hombro (Estabilidad)',
      'Pecho + Hombro',
      'Front + Potencia',
      'Hombros (Fuerza + Completo)',
      'Posterior + Fuerza',
    ]);
  });

  it('reproduces the programmed sheet weights from RM -> TM 90% -> week percentage', () => {
    const squat = HIGHFLY_PERSONAL_5D_ROUTINE[0].exercises.find(
      (exercise) => exercise.exerciseId === 'back_squat',
    );
    const hang = HIGHFLY_PERSONAL_5D_ROUTINE[0].exercises.find(
      (exercise) => exercise.exerciseId === 'hang_power_clean_d1',
    );
    const front = HIGHFLY_PERSONAL_5D_ROUTINE[4].exercises.find(
      (exercise) => exercise.exerciseId === 'front_squat',
    );
    if (!squat || !hang || !front) throw new Error('RUN1-J fixture missing');

    expect(trainingMaxKg(120)).toBe(108);
    expect(planLoadKg(prescriptionForWeek(squat, 1).top!, 120)).toBe(86);
    expect(planLoadKg(prescriptionForWeek(squat, 1).work, 120)).toBe(76);
    expect(planLoadKg(prescriptionForWeek(squat, 2).top!, 120)).toBe(92);
    expect(planLoadKg(prescriptionForWeek(squat, 3).top!, 120)).toBe(97);
    expect(planLoadKg(prescriptionForWeek(squat, 4).work, 120)).toBe(76);

    expect(planLoadKg(prescriptionForWeek(hang, 1).work, 80)).toBe(50);
    expect(planLoadKg(prescriptionForWeek(hang, 3).work, 80)).toBe(58);
    expect(planLoadKg(prescriptionForWeek(front, 1).top!, 75)).toBe(54);
    expect(planLoadKg(prescriptionForWeek(front, 3).top!, 75)).toBe(61);
  });

  it('uses the approved recovery bands and reduces only the productive set score when rest is cut', () => {
    const power: ExerciseDefinition = {
      exerciseId: 'power',
      pattern: 'hinge',
      role: 'power',
      loadMode: 'external_kg',
      rmReferenceKg: 100,
    };
    const accessory: ExerciseDefinition = {
      exerciseId: 'accessory',
      pattern: 'isolation',
      role: 'accessory',
      loadMode: 'external_kg',
      rmReferenceKg: 100,
    };

    const fullPower = scoreTrainingSet(
      power,
      { setId: 'p-full', exerciseId: 'power', reps: 3, loadKg: 70, restSec: 150, intent: 'power' },
      1,
      false,
    );
    const shortPower = scoreTrainingSet(
      power,
      { setId: 'p-short', exerciseId: 'power', reps: 3, loadKg: 70, restSec: 75, intent: 'power' },
      1,
      false,
    );
    const fullAccessory = scoreTrainingSet(
      accessory,
      { setId: 'a-full', exerciseId: 'accessory', reps: 20, loadKg: 30, restSec: 75, intent: 'accessory' },
      1,
      false,
    );

    expect(fullPower.evidence.restCompliance).toBe(1);
    expect(shortPower.evidence.restCompliance).toBe(0.55);
    expect(shortPower.evidence.score).toBeLessThan(fullPower.evidence.score);
    expect(fullAccessory.evidence.restCompliance).toBe(1);
  });
});

describe('HIGHFLY Training RUN1-J five-stat donor bridge', () => {
  it('maps every Training Core stat into real ClaudeCraft-derived combat fields without stacking', () => {
    const profile = createHighflyHunterProfile({ profileId: 'run1-j-five-stat' });
    for (const stat of ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const) {
      profile.training.core[stat].current = 50;
      profile.training.core[stat].peak = 50;
      profile.training.core[stat].calibrated = true;
    }
    setActiveHighflyHunterProfile(profile);

    const entity = {
      id: 77,
      attackPower: 100,
      rangedPower: 80,
      spellPower: 90,
      healPower: 110,
      maxHp: 1000,
      hp: 700,
      maxResource: 1000,
      resource: 600,
      resourceType: 'mana',
      critChance: 0.05,
      hitBonus: 0.01,
      dodgeChance: 0.05,
      moveSpeed: 7,
      dead: false,
    };

    bindActiveTrainingCombatEntity(entity);
    setActiveTrainingBridgeFlags({
      enabled: true,
      applyMovement: true,
      applyPerception: true,
      applyIntelligence: true,
    });
    applyActiveTrainingBridgeToEntity(entity);

    expect(entity.attackPower).toBeGreaterThan(100);     // STR
    expect(entity.rangedPower).toBeGreaterThan(80);      // AGI
    expect(entity.dodgeChance).toBeGreaterThan(0.05);    // AGI
    expect(entity.moveSpeed).toBeGreaterThan(7);         // AGI
    expect(entity.maxHp).toBeGreaterThan(1000);          // VIT
    expect(entity.hitBonus).toBeGreaterThan(0.01);       // PER
    expect(entity.critChance).toBeGreaterThan(0.05);     // PER
    expect(entity.spellPower).toBeGreaterThan(90);       // INT
    expect(entity.healPower).toBeGreaterThan(110);       // INT
    expect(entity.maxResource).toBeGreaterThan(1000);    // INT mana seam
    expect(entity.hp / entity.maxHp).toBeCloseTo(0.7, 2);
    expect(entity.resource / entity.maxResource).toBeCloseTo(0.6, 2);

    const after = { ...entity };
    applyActiveTrainingBridgeToEntity(entity);
    expect(entity.attackPower).toBeCloseTo(after.attackPower, 10);
    expect(entity.maxHp).toBe(after.maxHp);
    expect(entity.spellPower).toBeCloseTo(after.spellPower, 10);
  });
});
