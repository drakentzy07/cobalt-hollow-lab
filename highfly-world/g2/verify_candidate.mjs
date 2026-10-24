// G2-01 static assertion gate. Run on upstream v0.44.7 after G0, G1, G2.
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
assert.equal(JSON.parse(read('package.json')).version,'0.44.7');
const abilities=read('src/sim/content/classes.ts');
const visuals=read('src/render/characters/manifest.ts');
const main=read('src/main.ts');
const leap=read('src/sim/combat/heroic_leap.ts');
assert.ok(abilities.includes("      'hf_impacto_astral',"),'G2 skill is not in first-level skill list');
assert.ok(abilities.includes("  hf_impacto_astral: {"),'G2 skill is not in ability dictionary');
assert.ok(abilities.includes("    id: 'hf_impacto_astral',"),'G2 skill id mismatch');
assert.ok(abilities.includes("    targetMode: 'position',"),'position aim missing');
assert.ok(abilities.includes("effects: [{type: 'repositionToAim', landingAoe:"),'native leap/area damage not connected');
assert.ok(visuals.includes("hf_impacto_astral: 'Warrior_Heroic_Leap'"),'shared original Rig_Medium clip missing');
assert.ok(main.includes('highflyWornSlots'),'G1 bare body lost');
assert.ok(leap.includes("abilityId !== 'hf_impacto_astral'"),'G2 landing preview mismatch');
assert.ok(main.includes('hf-world-lab'),'G1 laboratory entry lost');
console.log('HIGHFLY_G2_01_NATIVE_LEAP_AOE_AND_ANIMATION_CONTRACT=PASS');
