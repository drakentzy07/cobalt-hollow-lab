/**
 * HIGHFLY REBIRTH R12: isolated dynamic Cinderbolt pilot.
 * The native v0.44.7 Mage, its specializations, ability ranks, skill effects,
 * equip permissions, saves, GCD and all other class casts stay intact.
 * All changes are confined to REBIRTH's highflyVitals player marker.
 */
import { readFileSync, writeFileSync } from 'node:fs';
function patch(file, edits) {
  let s = readFileSync(file, 'utf8');
  for (const [before, after] of edits) {
    const occurrences = s.split(before).length - 1;
    if (occurrences !== 1) {
      throw Error('HIGHFLY_R12_ANCHOR_DRIFT ' + file + ' count=' + occurrences + ' ' + before.slice(0, 75));
    }
    s = s.replace(before, after);
  }
  writeFileSync(file, s, 'utf8');
}
patch('src/sim/combat/cast_move_gate.ts', [
  [
    '    resolved.def.castWhileMoving ||',
    "    (p.highflyVitals !== undefined && abilityId === 'fireball') ||\n    resolved.def.castWhileMoving ||",
  ],
]);
patch('src/sim/combat/casting_lifecycle.ts', [
  [
    '  const castTime = brinewardMendingCastTime(',
    '  const nativeCastTime = brinewardMendingCastTime(',
  ],
  [
    '  // A press that cannot survive movement (abilityCastSurvivesMovement) is denied',
    `  // HIGHFLY R12: rapid mobile Cinderbolt, retaining original GCD and rank effects.
  // No instant cast override of a proc, channel, or another class ability.
  const castTime = p.highflyVitals !== undefined && ability.id === 'fireball'
    ? Math.min(nativeCastTime, 0.65)
    : nativeCastTime;
  // A press that cannot survive movement (abilityCastSurvivesMovement) is denied`,
  ],
]);
patch('src/sim/combat/effect_dispatch.ts', [
  [
    '        const finalDamage = Math.round(dmg * primaryDamageMult);',
    `        // HIGHFLY R12: 10% bonus for a skillfully timed airborne Cinderbolt.
        // Only an opted-in REBIRTH player; no native 0.44.7 behavior changes.
        const highflyAirFireball = p.highflyVitals !== undefined &&
          ability.id === 'fireball' && !p.onGround;
        const finalDamage = Math.round(dmg * primaryDamageMult * (highflyAirFireball ? 1.1 : 1));`,
  ],
]);
console.log('HIGHFLY_REBIRTH_R12_MOBILE_AIRBORNE_FIREBALL_PATCHED=1');
