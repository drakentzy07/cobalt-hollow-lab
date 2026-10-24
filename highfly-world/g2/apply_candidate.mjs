/**
 * HIGHFLY WORLD — G2-01 Impacto Astral playable mechanics alpha.
 * Apply on v0.44.7 AFTER G0 then G1 overlays.
 * The native mechanics are positional leap + landing AoE.
 * Airborne knock-up is NOT implemented in this pass.
 */
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
function one(path,before,after){
  const source=readFileSync(path,'utf8'), n=source.split(before).length-1;
  if(n!==1)throw Error('HIGHFLY_G2_UPSTREAM_DRIFT '+path+' match='+n+' '+before.slice(0,75));
  writeFileSync(path,source.replace(before,after),'utf8');
}

const classes='src/sim/content/classes.ts';
one(classes,
 "    abilities: [\n      'heroic_strike',",
 "    abilities: [\n      // HIGHFLY G2-01: first original ability in the isolated Genesis fixture.\n      'hf_impacto_astral',\n      'heroic_strike',");
one(classes,'  heroic_leap: {',[
 "  // HIGHFLY G2-01. Independent data id; native landing physics/damage.",
 "  // Still uses the temporary Warrior simulation identity. No specializations.",
 "  hf_impacto_astral: {",
 "    id: 'hf_impacto_astral',",
 "    name: 'Impacto Astral',",
 "    class: 'warrior',",
 "    learnLevel: 1,",
 "    cost: 0,",
 "    castTime: 0,",
 "    cooldown: 9,",
 "    range: 16,",
 "    school: 'physical',",
 "    requiresTarget: false,",
 "    targetMode: 'position',",
 "    effects: [{type: 'repositionToAim', landingAoe: {min: 18, max: 26, radius: 5}}],",
 "    description: 'Salto hacia un punto indicado; golpe de area al aterrizar. Elevacion del enemigo en desarrollo.',",
 "  },",
 "  heroic_leap: {",
].join('\n'));
one('src/render/characters/manifest.ts',
 "        heroic_leap: 'Warrior_Heroic_Leap',",
 "        heroic_leap: 'Warrior_Heroic_Leap',\n        // Temporary G2 alpha uses existing positional-leap animation; no borrowed hero art.\n        hf_impacto_astral: 'Warrior_Heroic_Leap',");
// Native placement preview is ID-gated upstream; include our new positional skill
// so the circle indicates the same collision-safe landing as the actual cast.
one('src/sim/combat/heroic_leap.ts',
  "  if (abilityId !== 'heroic_leap') return point;",
  "  if (abilityId !== 'heroic_leap' && abilityId !== 'hf_impacto_astral') return point;");

// Candidate-only test: the source repository still holds overlays, not a donor copy.
copyFileSync('../overlays/highfly-world/g2/impacto_astral.test.ts','tests/highfly_impacto_astral.test.ts');
console.log('HIGHFLY_WORLD_G2_01_IMPACTO_ASTRAL_ALPHA_APPLIED=PASS');
