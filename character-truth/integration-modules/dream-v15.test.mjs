import fs from 'node:fs';import assert from 'node:assert/strict';
import {catalogFromNightfallGlb,createTextSkinRecipe,validateTextSkinRecipe} from './dream-recipe-v15.mjs';
import {bakeNativeShapeV14} from './bake-native-shape-v14.mjs';
const body=fs.readFileSync('highfly-dream-v15-preview/assets/HIGHFLY-NIGHTFALL-rigged-body.glb');
const original=new Uint8Array(body),catalog=catalogFromNightfallGlb(original);
assert(catalog.includes('HFV8_CHEST_NIGHTFALL')&&catalog.some(k=>k.startsWith('HFV12_CHEST_')),
 'SOURCE_NIGHTFALL_KEYS_NOT_REAL');
const request='Fabricá una armadura Oni samurái negra, cuernos plateados, detalles violetas, hombreras enormes, pechera segmentada y máscara demoníaca.';
const recipe=createTextSkinRecipe(request,catalog);
assert(recipe.paint.paints.length===catalog.length,'V15_INCOMPLETE_REAL_MESH_PAINT');
assert(recipe.shape.shapes.length>=2,'V15_REAL_SHOULDER_TRANSFORMS_REQUIRED');
assert(recipe.pending.some(x=>x.includes('Encastre')),'V15_MUST_NOT_HIDE_UNRESOLVED_HELMET_FIT');
assert(recipe.ingredients.some(x=>x.source.includes('Kage-Oni')),'V15_MUST_REUSE_REAL_KAGE_ONI');
assert.deepEqual(createTextSkinRecipe(request,catalog),recipe,'V15_REPRODUCIBILITY');
assert.throws(()=>createTextSkinRecipe('pecho',catalog),'V15_NO_FAKE_EMPTY_REQUEST');
assert.throws(()=>validateTextSkinRecipe({...recipe,paint:{...recipe.paint,paints:[
 ...recipe.paint.paints,{key:'FAKE_ARMOR_UNKNOWN',color:'#ffffff',metalness:.4,roughness:.5}
 ]}},catalog),'V15_NO_FAKE_MESHES');
const {bytes,summary}=bakeNativeShapeV14(original,recipe.paint,recipe.shape);
assert(summary.originalWeightedBinaryPrefixPreserved&&summary.unchangedOriginalSkins,
 'V15_MUST_PRESERVE_SOURCE_SKIN_AND_VERTEX_WEIGHTS');
assert(summary.shapedGenderMeshes>0&&summary.paintedSemanticPieces>30,
 'V15_REAL_3D_AND_PBR_REQUIRED');
assert(bytes.length>original.length,'V15_EXPECTS_REAL_NEW_VERTEX_DATA_IN_GLB');
fs.mkdirSync('character-truth/v15-evidence',{recursive:true});
fs.writeFileSync('character-truth/v15-evidence/HIGHFLY-V15-TEXT-TO-NIGHTFALL-REAL-GLB.glb',bytes);
fs.writeFileSync('character-truth/v15-evidence/recipe.json',JSON.stringify(recipe,null,2));
fs.writeFileSync('character-truth/v15-evidence/proof.json',JSON.stringify({
 green:true,sourceRig:'Rig_Medium',catalogKeys:catalog.length,summary,
 honestLimitations:recipe.pending,physicalS23Tested:false,visualArtApproved:false
},null,2));
console.log('HIGHFLY_V15_REAL_TEXT_RECIPE_SKINNED_GLB_EXPORT_GREEN=1 KEYS='+catalog.length+
 ' SCULPTED_MESHES='+summary.shapedGenderMeshes);
