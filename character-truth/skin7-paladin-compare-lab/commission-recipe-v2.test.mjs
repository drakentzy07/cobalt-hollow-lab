import assert from 'node:assert/strict';
import {commissionRecipe,commissionIntensity,SLOTS} from './commission-recipe-v2.mjs';
const prompt='Quiero un casco cerrado y hombreras gigantes, pechera azul y espalda amplia.';
const v=commissionRecipe(prompt);
assert.equal(v.schema,'highfly.skin7.paladin-source-reforge-recipe/2');
assert.equal(v.sourceRig,'Rig_Medium');
assert.equal(v.gameDeployAllowed,false);
assert.equal(v.artistApproved,false);
assert.equal(SLOTS.length,7);
assert.equal(Object.keys(v.slots).length,7);
assert.equal(Object.keys(v.hardSurface.slotIntensity).length,7);
assert(commissionIntensity(prompt).arms>commissionIntensity('una armadura sencilla').arms);
assert(commissionIntensity('una armadura elegante de espalda alada').back>
 commissionIntensity('armadura sencilla de guerrero').back);
assert.throws(()=>commissionRecipe('muy corto'));
assert.throws(()=>commissionRecipe(prompt,{intensity:{head:10}}));
const photo=commissionRecipe(prompt,{palette:{enamel:'#123456',metal:'#abcdef',accent:'#456abc'}});
assert.equal(photo.palette.enamel,'#123456');
console.log('HIGHFLY_SKIN7_COMMISSION_V2_REUSABLE_REAL_BLENDER_RECIPE_GREEN=1');
