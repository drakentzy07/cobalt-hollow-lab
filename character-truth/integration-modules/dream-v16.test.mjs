import fs from 'node:fs';import assert from 'node:assert/strict';
import {analyzeReferencePixels,imageToSkinRecipe} from './dream-image-v16.mjs';
import {catalogFromNightfallGlb} from './dream-recipe-v15.mjs';
import {bakeNativeShapeV14} from './bake-native-shape-v14.mjs';
const w=64,h=96,data=new Uint8ClampedArray(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const i=(y*w+x)*4,armor=x>12&&x<52&&y>8&&y<85;
 const purple=armor&&y>=38&&y<49;
 const rgb=!armor?[245,245,245]:purple?[130,60,205]:[25,23,31];
 for(let k=0;k<3;k++)data[i+k]=rgb[k];
 data[i+3]=255;
}
const image=analyzeReferencePixels({width:w,height:h,data});
assert(image.coverage>.2&&image.coverage<.8,'V16_REAL_FOREGROUND_HEURISTIC');
assert(image.dominant.length>=2&&image.bands.every(x=>Number.isFinite(x)),
 'V16_COLOR_AND_SILHOUETTE_FEATURES_REQUIRED');
const original=new Uint8Array(fs.readFileSync('highfly-dream-v16-preview/assets/HIGHFLY-NIGHTFALL-rigged-body.glb'));
const cat=catalogFromNightfallGlb(original);
const imageRecipe=imageToSkinRecipe(image,cat,
 'Armadura Oni negra, pechera segmentada, hombros enormes, runas violetas');
assert(imageRecipe.newGeometryFabricated===false,'NO_FAKE_IMAGE_TO_3D');
assert(imageRecipe.textRecipe.paint.paints.length===cat.length,'V16_COMPLETE_REAL_PBR_RECIPE');
assert(imageRecipe.textRecipe.pending.some(x=>x.includes('profundidad')),'V16_UNCERTAINTY_REQUIRED');
const res=bakeNativeShapeV14(original,imageRecipe.textRecipe.paint,imageRecipe.textRecipe.shape);
assert(res.summary.unchangedOriginalSkins&&res.summary.originalWeightedBinaryPrefixPreserved,
 'V16_MUST_PRESERVE_NIGHTFALL_SKINNING');
fs.mkdirSync('character-truth/v16-evidence',{recursive:true});
fs.writeFileSync('character-truth/v16-evidence/HIGHFLY-V16-IMAGE-TO-REAL-PBR-NIGHTFALL.glb',res.bytes);
fs.writeFileSync('character-truth/v16-evidence/image-recipe.json',JSON.stringify(imageRecipe,null,2));
fs.writeFileSync('character-truth/v16-evidence/proof.json',JSON.stringify({
 green:true,source:'actual V12 Blender GLB',paletteHeuristic: image.palette,summary:res.summary,
 arbitraryImage3D:false,physicalSamsungVerified:false
},null,2));
console.log('HIGHFLY_V16_IMAGE_REFERENCE_REAL_PBR_WEIGHTED_GLB_GREEN=1');
