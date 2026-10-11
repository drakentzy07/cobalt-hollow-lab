import assert from 'node:assert/strict';
import {ARMOR_SCHEMA,parseArmorIntent,mutateArmorIntent,makeBlenderCandidate} from './skin9-armor-core.mjs';
const prompts=[
 'Quiero armadura de dragon verde con escamas, alas y casco con cuernos',
 'Rey oscuro con corona grande y hombreras enormes doradas',
 'Quiero una armadura celestial blanca y dorada con plumas',
 'Armadura demoníaca roja con espinas y visor cerrado',
 'Guerrera del hielo con casco plateado y capa glaciar',
 'Samurai negro con máscara de hierro y brazales',
 'Armadura tecnológica azul y plateada de ciencia ficción',
 'Armadura de bosque con hojas verdes y madera ancestral',
 'Paladín del rayo con gema eléctrica en la pechera',
 'Quiero una reina cristalina con corona y hombreras'
];
for(const p of prompts){
 const r=parseArmorIntent(p);
 assert.equal(r.schema,ARMOR_SCHEMA);
 assert.equal(r.sourceRig,'Rig_Medium');
 assert.equal(Object.keys(r.intensity).length,7);
 assert.equal(Object.keys(r.slotShapes).length,7);
 assert.equal(r.artistApproved,false);assert.equal(r.gameDeployAllowed,false);
 assert(Object.values(r.intensity).every(v=>v>=.15&&v<=1.3));
 const candidate=makeBlenderCandidate(r);
 assert.equal(candidate.executablePrototypeRecipe.schema,'highfly.skin7.paladin-source-reforge-recipe/2');
 assert.equal(candidate.needsOriginalModelSculpt,true);
 assert.equal(candidate.status,'CANDIDATE_NOT_GENERATED');
}
const dragon=parseArmorIntent(prompts[0]);
assert(dragon.themes.includes('dragon'));assert(dragon.slotShapes.head.includes('horned-helm'));
assert(dragon.slotShapes.back.includes('wing-back'));
const royal=parseArmorIntent(prompts[1]);assert(royal.themes.includes('royal'));assert(royal.themes.includes('shadow'));
assert(royal.slotShapes.head.includes('crown'));
const image=parseArmorIntent(prompts[9],{imagePalette:{enamel:'#123456',metal:'#abcdef',accent:'#ddeecc'}});
assert.equal(image.imagePaletteUsed,true);assert.equal(image.palette.enamel,'#123456');
const mut=mutateArmorIntent(dragon,'epic');assert(mut.intensity.head>=dragon.intensity.head);
assert.equal(mut.gameDeployAllowed,false);assert.equal(dragon.mutation,undefined);
assert.throws(()=>parseArmorIntent('corto'));assert.throws(()=>mutateArmorIntent(dragon,'deploy'));
assert.throws(()=>parseArmorIntent(prompts[0],{imagePalette:{enamel:'javascript:void(0)'}}));
console.log('HIGHFLY_SKIN9_TEN_TEXT_PROMPTS_NATIVE_RECIPE_AND_BLENDER_CANDIDATE_GREEN=1');
