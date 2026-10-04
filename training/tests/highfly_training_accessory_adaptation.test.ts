import { describe, expect, it } from 'vitest';
import {
  acceptAccessorySuggestion,
  defaultAccessoryStepKg,
  inferAccessoryEquipmentKind,
  markAccessoryRepeat,
  recordAccessoryCompletion,
} from '../src/highfly/training/accessory_adaptation';
import type { HighflyAccessoryLoadEntry } from '../src/highfly/training/core';

const base = (kg: number): HighflyAccessoryLoadEntry => ({
  kg,
  updatedAt: '2026-10-04T00:00:00.000Z',
});

describe('HIGHFLY accessory adaptive loads RUN137', () => {
  it('learns the exercise equipment family and useful default increment', () => {
    expect(inferAccessoryEquipmentKind('d2_db_row')).toBe('dumbbell');
    expect(defaultAccessoryStepKg('dumbbell')).toBe(2);
    expect(inferAccessoryEquipmentKind('d4_military_machine')).toBe('machine');
    expect(defaultAccessoryStepKg('machine')).toBe(5);
    expect(inferAccessoryEquipmentKind('d1_facepull')).toBe('cable');
  });

  it('proposes 18 -> 20 kg when 4x10 was completed and next prescription is 4x8', () => {
    const next = recordAccessoryCompletion('d2_db_row', base(18), {
      sets: 4,
      reps: 10,
      nextReps: 8,
      recordedAt: '2026-10-11T00:00:00.000Z',
    });
    expect(next.progressionStepKg).toBe(2);
    expect(next.nextSuggestedKg).toBe(20);
    expect(next.history?.at(-1)?.outcome).toBe('completed');
  });

  it('keeps the same load when the athlete explicitly asks to repeat', () => {
    const repeat = markAccessoryRepeat('d2_db_row', base(18), {
      sets: 4,
      reps: 10,
      recordedAt: '2026-10-11T00:00:00.000Z',
    });
    expect(repeat.nextSuggestedKg).toBe(18);
    expect(repeat.repeatRequested).toBe(true);

    const next = recordAccessoryCompletion('d2_db_row', repeat, {
      sets: 4,
      reps: 10,
      nextReps: 8,
      recordedAt: '2026-10-18T00:00:00.000Z',
    });
    expect(next.nextSuggestedKg).toBe(18);
  });

  it('never silently changes the chosen load: suggestion is explicit', () => {
    const suggested = recordAccessoryCompletion('d2_db_row', base(18), {
      sets: 4,
      reps: 10,
      nextReps: 8,
      recordedAt: '2026-10-11T00:00:00.000Z',
    });
    expect(suggested.kg).toBe(18);
    const accepted = acceptAccessorySuggestion(
      'd2_db_row',
      suggested,
      '2026-10-12T00:00:00.000Z',
    );
    expect(accepted.kg).toBe(20);
    expect(accepted.nextSuggestedKg).toBeUndefined();
  });

  it('holds load when the next prescription asks for more reps', () => {
    const next = recordAccessoryCompletion('d2_db_row', base(18), {
      sets: 4,
      reps: 8,
      nextReps: 10,
      recordedAt: '2026-10-11T00:00:00.000Z',
    });
    expect(next.nextSuggestedKg).toBe(18);
  });
});
