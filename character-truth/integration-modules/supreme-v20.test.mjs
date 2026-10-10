/** V20.1 QA — data contracts, deterministic Spanish recipe and actual glTF2 binary rewriting. */
import assert from 'node:assert/strict';
import {buildRecipe,styleGlb,validateRecipe,SCHEMA} from './supreme-recipe-v20.mjs';
const prompt='Armadura samurái rojo carmesí, detalles dorados, núcleo cian, cuernos oni, máscara kabuto, pechera, hombrera izquierda gigante asimétrica, faldones, guanteletes y grebas';
const r=buildRecipe(prompt);
assert.equal(r.schema,SCHEMA);assert.equal(r.rig,'Rig_Medium');
assert.equal(r.originalBodyMeshesBundled,false);assert.equal(r.generatedNewMeshes,false);
assert(r.pieces.helmet.includes('horned'));assert(r.pieces.helmet.includes('kabuto'));
assert(r.pieces.shoulder.includes('massive'));assert(r.pieces.shoulder.includes('asymmetric'));
assert.equal(r.geometry.shoulderScale,1.1);
assert.equal(r.palette.base,'#ac2533');assert.equal(r.palette.trim,'#cba45e');
assert.equal(r.palette.accent,'#36d9eb');
assert.deepEqual(buildRecipe(prompt),r);
assert.throws(()=>buildRecipe('poco'),/V20_TEXT/);
assert.throws(()=>validateRecipe({...r,rig:'Rig_Copy'}),/SOURCE_OR_SCHEMA/);
assert.throws(()=>validateRecipe({...r,geometry:{shoulderScale:8}}),/SHOULDER/);
const img={schema:'highfly.image.pixel-analysis/v16',
 palette:{base:'#aa0000',trim:'#cc9900',accent:'#11ddff'}};
const imgR=buildRecipe(prompt,{analysis:img});
assert.equal(imgR.palette.base,'#aa0000');
assert.equal(imgR.confidence.imageSemantics,'not inferred; use written notes');
assert.throws(()=>buildRecipe(prompt,{analysis:{...img,palette:{...img.palette,trim:'javascript:'}}}),/IMAGE/);
function glb(entities=86){
 const meshes=[],nodes=[],materials=[{name:'original',pbrMetallicRoughness:{baseColorFactor:[.4,.4,.4,1]}}];
 const genders=['M','F'];
 for(const gender of genders){
  for(let n=0;n<entities/2;n++){
   const name='HFV19_'+gender+'_'+(n<4?'ARMS_DRAGON_SPIKE_':n%3===1?'CHEST_HEART_RUNE_':'BACK_SHADOW_PLATE_')+n;
   meshes.push({name,primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2},material:0}]});
   nodes.push({name,mesh:meshes.length-1,skin:0});
  }
 }
 const doc={asset:{version:'2.0'},nodes,meshes,materials,skins:[{joints:[0,1]}],
  buffers:[{byteLength:4}],bufferViews:[{buffer:0,byteOffset:0,byteLength:4}],accessors:[]};
 const data=new TextEncoder().encode(JSON.stringify(doc));
 const jsonLen=Math.ceil(data.length/4)*4;
 const b=new Uint8Array(12+8+jsonLen+8+4),d=new DataView(b.buffer);
 d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,b.length,true);
 d.setUint32(12,jsonLen,true);d.setUint32(16,0x4e4f534a,true);
 b.set(data,20);b.fill(32,20+data.length,20+jsonLen);
 d.setUint32(20+jsonLen,4,true);d.setUint32(24+jsonLen,0x004e4942,true);
 return b;
}
const source=glb(86);
assert.throws(()=>styleGlb(source.slice(0,50),r),/BINARY_SIZE/);
const bigger=new Uint8Array(Math.max(12000,source.length));
bigger.set(source);
// Build a valid GLB over threshold by padding BIN chunk.
const dv=new DataView(source.buffer),jsonSize=dv.getUint32(12,true),tail=source.subarray(20+jsonSize);
const padding=new Uint8Array(12000);
const total=12+8+jsonSize+8+padding.length;
const huge=new Uint8Array(total);const hd=new DataView(huge.buffer);
hd.setUint32(0,0x46546c67,true);hd.setUint32(4,2,true);hd.setUint32(8,total,true);
hd.setUint32(12,jsonSize,true);hd.setUint32(16,0x4e4f534a,true);
huge.set(source.subarray(20,20+jsonSize),20);
hd.setUint32(20+jsonSize,padding.length,true);hd.setUint32(24+jsonSize,0x004e4942,true);
huge.set(padding,28+jsonSize);
const styled=styleGlb(huge,r);assert(styled.bytes.length>huge.length);
assert(styled.summary.affectedPrimitives===86);assert(styled.summary.shoulderNodesScaled>0);
const out=new DataView(styled.bytes.buffer);
const parsed=JSON.parse(new TextDecoder().decode(styled.bytes.subarray(20,20+out.getUint32(12,true))).trim());
assert(parsed.materials.length>1);
assert(parsed.nodes.some(x=>x.name.includes('ARMS_DRAGON_SPIKE')&&x.scale[0]>1));
assert.deepEqual(parsed.skins,[{joints:[0,1]}]);
assert.deepEqual(parsed.meshes[0].primitives[0].attributes,{POSITION:0,JOINTS_0:1,WEIGHTS_0:2});
assert.equal(styled.bytes.subarray(styled.bytes.length-padding.length).length,padding.length);
console.log('HIGHFLY_V20_1_DETERMINISTIC_RECIPE_AND_RIGGED_GLB_BINARY_GREEN=1');
