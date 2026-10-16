import test from 'node:test';
import assert from 'node:assert/strict';
import { projectR32CombatHud, R32_BASE_SLOT_COUNT, R32_UNIQUE_SLOT_CAP } from './hud_contract.mjs';

test('fresh Hunter: 4 base slots, no visible or serialized UNIQUE placeholder', () => {
  const view = projectR32CombatHud();
  assert.equal(view.baseSlots.length, 4);
  assert.equal(Object.hasOwn(view, 'uniqueSlots'), false);
  assert.doesNotMatch(JSON.stringify(view), /unique|ult|esp|locked|secret|0\/3/i);
});

test('the legacy 10-slot action bar never leaks into the normal R32 view', () => {
  const view = projectR32CombatHud({baseEquippedIds: Array.from({length: 10}, (_, i) => 'skill' + i)});
  assert.equal(view.baseSlots.length, R32_BASE_SLOT_COUNT);
  assert.deepEqual(view.baseSlots.map(s => s.abilityId), ['skill0','skill1','skill2','skill3']);
});

test('one validated discovery reveals only one usable UNIQUE slot', () => {
  const view = projectR32CombatHud({validatedUniqueUnlockIds: ['legacy-u1']});
  assert.equal(view.uniqueSlots.length, 1);
  assert.deepEqual(view.uniqueSlots[0], {slot: 1, abilityId: null});
});

test('multiple discoveries cap at 3; no unused secret placeholders appear', () => {
  const view = projectR32CombatHud({validatedUniqueUnlockIds: ['u1', 'u2', 'u3','u4']});
  assert.equal(view.uniqueSlots.length, R32_UNIQUE_SLOT_CAP);
});

test('unique ability not unlocked by the Sim cannot be shown as equipped', () => {
  const view = projectR32CombatHud({validatedUniqueUnlockIds: ['u1'], uniqueEquippedIds: ['unauthorized']});
  assert.equal(view.uniqueSlots[0].abilityId, null);
});

test('no ephemeral QA input or debug flag creates a UNIQUE slot', () => {
  const view = projectR32CombatHud({debug: true, qaUnlockAll: true, uniqueEquippedIds: ['u1']});
  assert.equal(Object.hasOwn(view, 'uniqueSlots'), false);
});

test('HUD projection does not mutate persisted arrays', () => {
  const base = Object.freeze(['fireball']);
  const unique = Object.freeze(['u1']);
  const view = projectR32CombatHud({baseEquippedIds: base, validatedUniqueUnlockIds: unique, uniqueEquippedIds: unique});
  assert.equal(view.uniqueSlots[0].abilityId, 'u1');
  assert.deepEqual(base, ['fireball']);
  assert.deepEqual(unique, ['u1']);
});
