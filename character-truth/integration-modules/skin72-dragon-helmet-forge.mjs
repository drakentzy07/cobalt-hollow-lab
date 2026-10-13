/**
 * HIGHFLY SKIN 7.2 — NEW original DRAGON helmet 3D mesh authored for authentic
 * ClaudeCraft/KayKit Rig_Medium Head slot. This does NOT deform/recolor Paladin.
 * It replaces the existing equipment node with a new mesh, same native skin.
 * A deterministic geometric forger (not an LLM / image-to-3D model).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const SOURCE='public/models/chars/modular/warrior_modular.glb';
const TARGET='character-truth/skin72-evidence/HIGHFLY-SKIN72-DRAGON-HELM-ORIGINAL.glb';
const recipe=JSON.parse(fs.readFileSync('character-truth/integration-modules/skin72-dragon-helmet-recipe.json','utf8'));
assert.equal(recipe.schema,'highfly.skin7.2.original-compatible-helmet/1');
assert.equal(recipe.sourceSlot,'Armor_paladin_Head');
assert.equal(recipe.rig,'Rig_Medium');
assert(recipe.rules.baseGlbImmutable&&recipe.rules.replaceOriginalHelmetNotOverlay&&recipe.rules.skinHeadJoint);
assert(!recipe.rules.noPublicGameDeployment===false);
const originalBytes=fs.readFileSync(SOURCE);
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+originalBytes.length),Buffer.from([0]),originalBytes])).digest('hex');
assert.equal(gitBlob,'e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2');
assert.equal(originalBytes.toString('ascii',0,4),'glTF');
assert.equal(originalBytes.readUInt32LE(4),2);
assert.equal(originalBytes.readUInt32LE(8),originalBytes.length);
let off=12,rawJson=null,rawBin=null;
while(off<originalBytes.length){
 const len=originalBytes.readUInt32LE(off),typ=originalBytes.readUInt32LE(off+4);off+=8;
 assert(off+len<=originalBytes.length);
 if(typ===0x4e4f534a)rawJson=JSON.parse(originalBytes.subarray(off,off+len).toString('utf8'));
 if(typ===0x004e4942)rawBin=Buffer.from(originalBytes.subarray(off,off+len));
 off+=len;
}
assert(rawJson&&rawBin);
const src=rawJson,glb=structuredClone(src);
assert(src.skins.length>=1&&src.animations.length===22&&src.nodes.some(n=>n.name==='Rig_Medium'));
const headNode=src.nodes.findIndex(n=>n.name===recipe.sourceSlot);
assert(headNode>=0,'ORIGINAL_PALADIN_HEAD_SOURCE_NOT_FOUND');
const donor=src.nodes[headNode];
assert(Number.isInteger(donor.mesh)&&Number.isInteger(donor.skin));
const donorMesh=src.meshes[donor.mesh],skin=src.skins[donor.skin];
assert(donorMesh.primitives.length===2&&skin.joints.length===23,'NATIVE_HEAD_SOURCE_CONTRACT');
const headJoint=skin.joints.findIndex(i=>src.nodes[i].name==='head');
assert(headJoint>=0,'RIG_HEAD_JOINT_NOT_FOUND');
const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
for(const prim of donorMesh.primitives){
 const acc=src.accessors[prim.attributes.POSITION];
 assert(acc.type==='VEC3'&&acc.componentType===5122&&acc.normalized===true);
 for(let k=0;k<3;k++){
  mins[k]=Math.min(mins[k],acc.min[k]/32767);
  maxs[k]=Math.max(maxs[k],acc.max[k]/32767);
 }
}
const W=maxs[0]-mins[0],H=maxs[1]-mins[1],D=maxs[2]-mins[2];
assert(W>0.1&&H>0.1&&D>0.1);
const cx=(mins[0]+maxs[0])/2,cz=(mins[2]+maxs[2])/2;
const profiles=[
 [.09,.33,.37,-.025], [.18,.43,.44,.02], [.245,.49,.47,.14],
 [.315,.52,.54,.20], [.395,.56,.55,.19], [.485,.57,.52,.08],
 [.575,.53,.49,.02], [.65,.50,.49,.00], [.735,.46,.48,-.02],
 [.825,.37,.40,-.03], [.93,.16,.24,-.02]
];
const segments=recipe.geometry.radialSegments;
assert(segments===16&&profiles.length===recipe.geometry.profileRings);
const rings=[];
for(let k=0;k<profiles.length;k++){
 const [y,rx,rz,muzzle]=profiles[k],ring=[];
 for(let i=0;i<segments;i++){
  const angle=2*Math.PI*i/segments,side=Math.sin(angle),face=Math.cos(angle);
  const brow=k===7?H*.025*Math.max(0,face)*(Math.abs(side)>.12?1:0):0;
  const crest=k===9?H*.018*Math.max(0,-face):0;
  ring.push([
   cx+W*.5*rx*side,
   mins[1]+H*y+brow+crest,
   cz+D*.5*rz*face+D*recipe.geometry.frontSnoutExtension*(muzzle/.20)*Math.pow(Math.max(0,face),3)
  ]);
 }
 rings.push(ring);
}
const colors=recipe.palette;
for(const c of Object.values(colors))assert(/^#[0-9a-f]{6}$/i.test(c),'INVALID_COLOR');
const groups=Object.fromEntries(Object.keys(colors).map(k=>[k,[]]));
function tri(a,b,c,material){
 const x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
 const cross=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
 assert(Math.hypot(...cross)>1e-9,'DEGENERATE_TRIANGLE');
 groups[material].push([a,b,c]);
}
for(let k=0;k<rings.length-1;k++)for(let i=0;i<segments;i++){
 const j=(i+1)%segments,frontal=i<=2||i>=13;
 const eye=k===6&&(i===1||i===2||i===13||i===14);
 const nostril=k===3&&(i===1||i===14);
 const jaw=(k===1||k===2)&&frontal;
 const scale=(k>=7&&k<=9&&(i%3<=1))||(k>=4&&k<=8&&i>=5&&i<=11&&((i+k)%3!==0));
 const temple=k===5&&(i===3||i===12);
 const material=eye||nostril?'eyes':jaw?'bone':temple?'ridge':scale?'scale':k===0?'shadow':'main';
 tri(rings[k][i],rings[k+1][i],rings[k+1][j],material);
 tri(rings[k][i],rings[k+1][j],rings[k][j],material);
}
const low=[cx,mins[1]+H*.09,cz],high=[cx,mins[1]+H*.96,cz];
for(let i=0;i<segments;i++){
 const j=(i+1)%segments;
 tri(low,rings[0][j],rings[0][i],'shadow');
 tri(high,rings.at(-1)[i],rings.at(-1)[j],i%3===0?'ridge':'main');
}
const dimensions=rings.flat();
const min=(k)=>Math.min(...dimensions.map(v=>v[k])),max=(k)=>Math.max(...dimensions.map(v=>v[k]));
const bounds={width:(max(0)-min(0))/W,height:(max(1)-min(1))/H,depth:(max(2)-min(2))/D};
assert(bounds.width<=recipe.dimensions.maxWidthRatio&&bounds.height<=recipe.dimensions.maxHeightRatio&&bounds.depth<=recipe.dimensions.maxDepthRatio,'DRAGON_HEAD_OUTSIDE_NATIVE_SLOT_BUDGET');
const srgb=n=>{const v=parseInt(n,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
const materialIds={};
for(const [name,hex] of Object.entries(colors)){
 materialIds[name]=glb.materials.push({
  name:'HF72_DRAGON_'+name.toUpperCase(),doubleSided:true,alphaMode:'OPAQUE',
  pbrMetallicRoughness:{baseColorFactor:[srgb(hex.slice(1,3)),srgb(hex.slice(3,5)),srgb(hex.slice(5,7)),1],metallicFactor:.08,roughnessFactor:.78}
 })-1;
}
const mesh={name:'HIGHFLY_SKIN72_DRAGON_HEAD_MESH',primitives:[]};
let bin=Buffer.from(rawBin);
function put(data){
 bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
 const view=glb.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:data.length,target:34962})-1;
 bin=Buffer.concat([bin,data]);return view;
}
const proof=[];
for(const [material,triangles] of Object.entries(groups)){
 if(!triangles.length)continue;
 const verts=[],normals=[],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const [a,b,c] of triangles){
  const e=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],f=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const n=[e[1]*f[2]-e[2]*f[1],e[2]*f[0]-e[0]*f[2],e[0]*f[1]-e[1]*f[0]];
  const length=Math.hypot(...n);assert(length>1e-9);
  for(const p of [a,b,c]){
   verts.push(p);normals.push(n.map(x=>x/length));
   for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}
  }
 }
 const count=verts.length;
 function f32(arr){const b=Buffer.alloc(count*12);arr.forEach((v,i)=>v.forEach((x,k)=>b.writeFloatLE(x,12*i+4*k)));return b;}
 const joints=Buffer.alloc(count*8),weights=Buffer.alloc(count*16);
 for(let i=0;i<count;i++){joints.writeUInt16LE(headJoint,i*8);weights.writeFloatLE(1,i*16);}
 function access(data,componentType,type,extra={}){return glb.accessors.push({bufferView:put(data),byteOffset:0,componentType,count,type,...extra})-1;}
 mesh.primitives.push({mode:4,material:materialIds[material],attributes:{
  POSITION:access(f32(verts),5126,'VEC3',{min:lo,max:hi}),
  NORMAL:access(f32(normals),5126,'VEC3'),
  JOINTS_0:access(joints,5123,'VEC4'),
  WEIGHTS_0:access(weights,5126,'VEC4')
 }});
 proof.push({material,vertices:count,triangles:triangles.length,headJoint});
}
const tris=proof.reduce((x,p)=>x+p.triangles,0),verts=proof.reduce((x,p)=>x+p.vertices,0);
assert(tris>300&&tris<650&&verts===tris*3,'INVALID_DRAGON_MOBILE_TOPOLOGY');
assert(mesh.primitives.length>=4&&mesh.primitives.length<=6,'MATERIAL_GROUP_ERROR');
const newMesh=glb.meshes.push(mesh)-1;
const variant={...structuredClone(donor),mesh:newMesh,name:'HIGHFLY_SKIN72_DRAGON_HEAD'};
variant.extras={...(variant.extras||{}),highflySkin72:{sourceSlot:recipe.sourceSlot,design:recipe.design,newTopology:true}};
const newNode=glb.nodes.push(variant)-1;
let replacements=0;
for(const parent of glb.nodes)for(let i=0;i<(parent.children?.length||0);i++)if(parent.children[i]===headNode){parent.children[i]=newNode;replacements++;}
for(const scene of glb.scenes||[])for(let i=0;i<(scene.nodes?.length||0);i++)if(scene.nodes[i]===headNode){scene.nodes[i]=newNode;replacements++;}
assert(replacements>=1,'HELMET_SLOT_NOT_REPLACED');
assert(variant.skin===donor.skin);
assert.deepEqual(glb.skins,src.skins);
assert.deepEqual(glb.animations,src.animations);
assert.deepEqual(glb.meshes[donor.mesh],src.meshes[donor.mesh]);
glb.buffers[0].byteLength=bin.length;
glb.asset={...glb.asset,generator:'HIGHFLY SKIN7.2 original dragon helmet sculpt in native ClaudeCraft Head slot'};
const json=Buffer.from(JSON.stringify(glb)),jsonPadding=Buffer.alloc((4-json.length%4)%4,32);
bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
const total=12+8+json.length+jsonPadding.length+8+bin.length;
const result=Buffer.alloc(total);
result.write('glTF',0);result.writeUInt32LE(2,4);result.writeUInt32LE(total,8);
result.writeUInt32LE(json.length+jsonPadding.length,12);result.writeUInt32LE(0x4e4f534a,16);
json.copy(result,20);jsonPadding.copy(result,20+json.length);
const begin=20+json.length+jsonPadding.length;
result.writeUInt32LE(bin.length,begin);result.writeUInt32LE(0x004e4942,begin+4);bin.copy(result,begin+8);
fs.mkdirSync('character-truth/skin72-evidence',{recursive:true});
fs.writeFileSync(TARGET,result);
assert(fs.readFileSync(SOURCE).equals(originalBytes),'ORIGINAL_GLB_CHANGED');
const report={
 stage:'SKIN72_NEW_DRAGON_SKULL_GEOMETRY',sourceOriginalSha:gitBlob,sourceFileUnchanged:true,
 sourceOriginalHelmetIntact:true,originalHelmetReplacedNotStacked:true,
 newGeometry:true,newMeshNode:variant.name,originalMeshName:donorMesh.name,
 originalPrimitives:donorMesh.primitives.length,newPrimitives:mesh.primitives.length,
 newTriangles:tris,newVertices:verts,headJoint,nativeSkinIndex:variant.skin,
 originalNativeBones:skin.joints.length,originalAnimations:src.animations.length,
 rigAndAnimationUnchanged:true,materialGroups:proof,
 relativeNativeSlotBounds:bounds,artApproved:false,gameDeployed:false,
 physicalSamsungTested:false,imageDrivenGeneration:false,
 compiler:'deterministic authoring from recipe; NOT generative image-to-3D',
 sourceBytes:originalBytes.length,newBytes:result.length,recipe
};
fs.writeFileSync('character-truth/skin72-evidence/dragon-helmet-proof.json',JSON.stringify(report,null,2));
console.log('SKIN72_REAL_NEW_DRAGON_HEAD_NATIVE_SLOT_GREEN=1',JSON.stringify({tris,verts,parts:proof.length,headJoint,bounds}));
