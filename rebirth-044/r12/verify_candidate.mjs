/** Static integration contract: fail closed if the R12 pilot escapes its opt-in. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');
const gate = read('src/sim/combat/cast_move_gate.ts');
const cast = read('src/sim/combat/casting_lifecycle.ts');
const damage = read('src/sim/combat/effect_dispatch.ts');
const classes = read('src/sim/content/classes.ts');
const originalIds = ['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
for (const id of originalIds) {
  assert.match(classes, new RegExp('^  '+id+': \\{', 'm'), 'missing native class '+id);
}
assert.match(gate, /p\.highflyVitals !== undefined && abilityId === 'fireball'/);
assert.match(cast, /p\.highflyVitals !== undefined && ability\.id === 'fireball'[\s\S]*?Math\.min\(nativeCastTime, 0\.65\)/);
assert.match(damage, /p\.highflyVitals !== undefined &&[\s\S]*?ability\.id === 'fireball' && !p\.onGround/);
assert.match(damage, /highflyAirFireball \? 1\.1 : 1/);
assert.match(cast, /const gcd = Math\.max\(MIN_GCD/);
assert.match(cast, /heldMovementInputWouldMove/);
assert.match(gate, /iceFloesAuraForAbility/);
console.log('HIGHFLY_R12_NATIVE_NINE_CLASSES_AND_MOBILE_AIR_FIREBALL_CONTRACT=PASS');
