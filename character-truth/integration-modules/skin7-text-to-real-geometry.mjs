/**
 * HIGHFLY SKIN7 V2: constrained text -> real 3D geometry operations.
 * The small text compiler is deterministic, NOT an LLM and NOT image recognition.
 * Native Paladin head geometry and skeleton are the sole donor.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const ROOT='character-truth/skin7-evidence/';
const INPUT=ROOT+'HIGHFLY-SKIN7-PALADIN-HELMET-NATIVE-VARIANT.glb';
const OUTPUT=ROOT+'HIGHFLY-SKIN7-PALADIN-TEXT-DESIGN-REAL-GEOMETRY.glb';
const REQUEST='character-truth/integration-modules/skin7-helmet-commission.json';
const request=JSON.parse(fs.readFileSync(REQUEST,'utf8'));
assert.equal(request.schema,'highfly.skin7.text-commission/v1');
assert.equal(request.base,'Armor_paladin_Head');
assert.equal(request.replacePreviousSwollenPrototype,true);
assert.equal(request.gameDeployAllowed,false);
assert(typeof request.description==='string'&&request.description.length>=40&&request.description.length<=1200);
for(const hex of Object.values(request.palette))assert(/^#[0-9a-fA-F]{6}$/.test(hex),'INVALID_PBR_COLOR');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const t=normalize(request.description);
const operations={
 vVisor:/(visor|mascara|frontal)/.test(t)&&/(en v|forma de v|angular|agresiv)/.test(t),
 crownCrest:/(cresta|corona|penacho)/.test(t),
 cheekPlates:/(laterales|carrilleras|mejillas|protecciones)/.test(t),
 horns:/(cuern|astas)/.test(t)
};
assert(Object.values(operations).filter(Boolean).length>=3,'DESIGN_MUST_SPECIFY_THREE_REAL_OPERATIONS');
const colors=request.palette;
function parseGlb(bytes){
 assert(bytes.toString('ascii',0,4)==='glTF'&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length);
 let pos=12,doc=null,bin=null;
 while(pos<bytes.length){
  const len=bytes.readUInt32LE(pos),typ=bytes.readUInt32LE(pos+4);pos+=8;
  assert(pos+len<=bytes.length);
  if(typ===0x4e4f534a)doc=JSON.parse(bytes.subarray(pos,pos+len).toString('utf8'));
  if(typ===0x004e4942)bin=Buffer.from(bytes.subarray(pos,pos+len));
  pos+=len;
 }
 assert(doc&&bin&&doc.skins?.length&&doc.animations?.length);
 return {doc,bin};
}
const sourceBytes=fs.readFileSync(INPUT);
const {doc:original,bin:originalBin}=parseGlb(sourceBytes);
const doc=structuredClone(original);
let bin=Buffer.from(originalBin);
const targetIndex=doc.nodes.findIndex(n=>n.name==='HIGHFLY_SKIN7_PALADIN_HELMET_LEGENDARY');
assert(targetIndex>=0,'AUTHENTIC_FORGED_PALADIN_HELMET_REQUIRED');
const node=doc.nodes[targetIndex],sourceMesh=original.meshes[node.mesh],mesh=doc.meshes[node.mesh];
assert(node.skin!==undefined&&sourceMesh.primitives.length===2);
const skin=doc.skins[node.skin];
const headJoint=skin.joints.findIndex(n=>normalize(doc.nodes[n].name||'').replace(/[^a-z0-9]/g,'')==='head');
assert(headJoint>=0&&headJoint<65536,'HEAD_BONE_NOT_IN_NATIVE_SKIN');
const positions=[];
for(const primitive of mesh.primitives){
 const attr=doc.accessors[primitive.attributes.POSITION],view=doc.bufferViews[attr.bufferView];
 assert(attr.type==='VEC3'&&attr.componentType===5126&&!view.extensions?.EXT_meshopt_compression,'REQUIRES_REAL_FORGED_NATIVE_FLOAT_POSITIONS');
 const step=view.byteStride||12,base=(view.byteOffset||0)+(attr.byteOffset||0);
 for(let j=0;j<attr.count;j++)positions.push([
  bin.readFloatLE(base+j*step),bin.readFloatLE(base+j*step+4),bin.readFloatLE(base+j*step+8)
 ]);
}
assert(positions.length>1200,'NOT_NATIVE_HEAD_GEOMETRY');
const mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];
for(const p of positions)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[k]);mx[k]=Math.max(mx[k],p[k]);}
const width=mx[0]-mn[0],height=mx[1]-mn[1],depth=mx[2]-mn[2];
assert(width>0.01&&height>0.01&&depth>0.001&&width<10&&height<10,'HELMET_SIZE_IMPLAUSIBLE');
const cx=(mn[0]+mx[0])/2;
const Y=u=>mn[1]+height*u;
const X=u=>cx+width*u;
const Z=u=>mx[2]+depth*u;
function srgb(c){const x=parseInt(c,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}
function mat(hex,name,metal=.83){
 const color=[srgb(hex.slice(1,3)),srgb(hex.slice(3,5)),srgb(hex.slice(5,7)),1];
 return doc.materials.push({name:'HF_SKIN7_GEO_'+name,alphaMode:'OPAQUE',doubleSided:true,
  pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:metal,roughnessFactor:.29}})-1;
}
const dark=mat(colors.steel,'DARK');
const trim=mat(colors.trim,'GOLD');
const align4=n=>(n+3)&~3;
function append(bytes){
 bin=Buffer.concat([bin,Buffer.alloc(align4(bin.length)-bin.length)]);
 const view=doc.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:bytes.length,target:34962})-1;
 bin=Buffer.concat([bin,bytes]);
 return view;
}
const meshStarts=mesh.primitives.length;
const pieces=[];
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function sub(a,b){return a.map((v,i)=>v-b[i]);}
function addSurface(name, triangles, material){
 assert(triangles.length>0&&triangles.length<240,'UNSAFE_TRIANGLE_COUNT');
 const verts=[],normals=[];
 for(const tri of triangles){
  assert(tri.length===3);
  const v=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));
  const len=Math.hypot(...v);
  assert(len>1e-9,'DEGENERATE_NEW_GEOMETRY_'+name);
  for(const p of tri){verts.push(p);normals.push(v.map(x=>x/len));}
 }
 const count=verts.length;
 const flat32=xs=>{const b=Buffer.alloc(xs.length*12);xs.forEach((p,i)=>p.forEach((v,k)=>b.writeFloatLE(v,12*i+4*k)));return b;};
 const joints=Buffer.alloc(count*8),weights=Buffer.alloc(count*16);
 for(let i=0;i<count;i++){joints.writeUInt16LE(headJoint,i*8);weights.writeFloatLE(1,i*16);}
 const mini=[Infinity,Infinity,Infinity],maxi=[-Infinity,-Infinity,-Infinity];
 for(const p of verts)for(let i=0;i<3;i++){mini[i]=Math.min(mini[i],p[i]);maxi[i]=Math.max(maxi[i],p[i]);}
 const accessor=(buffer,componentType,type,extra={})=>doc.accessors.push({
  bufferView:append(buffer),byteOffset:0,componentType,count,type,...extra})-1;
 const pa=accessor(flat32(verts),5126,'VEC3',{min:mini,max:maxi});
 const na=accessor(flat32(normals),5126,'VEC3');
 const ja=accessor(joints,5123,'VEC4');
 const wa=accessor(weights,5126,'VEC4');
 mesh.primitives.push({mode:4,attributes:{POSITION:pa,NORMAL:na,JOINTS_0:ja,WEIGHTS_0:wa},material,extras:{highflyPart:name}});
 pieces.push({name,triangles:triangles.length,vertices:count,headJoint,skinned:true});
}
function prism(polygon,thickness){
 assert(polygon.length>=3);
 const front=polygon.map(p=>[p[0],p[1],p[2]+thickness/2]);
 const back=polygon.map(p=>[p[0],p[1],p[2]-thickness/2]);
 const tris=[];
 for(let i=1;i<polygon.length-1;i++){tris.push([front[0],front[i],front[i+1]]);tris.push([back[0],back[i+1],back[i]]);}
 for(let i=0;i<polygon.length;i++){
  const j=(i+1)%polygon.length;
  tris.push([front[i],back[i],back[j]],[front[i],back[j],front[j]]);
 }
 return tris;
}
function bar(a,b,thick,zDepth){
 const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);
 assert(l>0);
 const nx=dy/l*thick/2,ny=-dx/l*thick/2;
 return prism([
  [a[0]+nx,a[1]+ny,zDepth],
  [b[0]+nx,b[1]+ny,zDepth],
  [b[0]-nx,b[1]-ny,zDepth],
  [a[0]-nx,a[1]-ny,zDepth]
 ],Math.max(depth*.10,width*.015));
}
// Visor V: two separate 3-D angular steel ridges with golden highlights.
// Not enlargement: changes the face architecture and silhouette.
if(operations.vVisor){
 const outerL=[X(-.38),Y(.70)],center=[X(0),Y(.43)],outerR=[X(.38),Y(.70)];
 addSurface('V-VISOR-LEFT',bar(outerL,center,width*.095,Z(.11)),trim);
 addSurface('V-VISOR-RIGHT',bar(center,outerR,width*.095,Z(.11)),trim);
 addSurface('FACE-MASK-CENTER',prism([
 [X(-.15),Y(.52),Z(.14)],[X(0),Y(.34),Z(.23)],
 [X(.15),Y(.52),Z(.14)],[X(.10),Y(.62),Z(.16)],[X(-.10),Y(.62),Z(.16)]
 ],depth*.12),dark);
}
if(operations.crownCrest){
 addSurface('ANGULAR-CROWN-CREST',prism([
 [X(-.16),Y(.86),Z(-.07)],[X(-.12),Y(1.31),Z(-.07)],
 [X(0),Y(1.47),Z(-.07)],[X(.12),Y(1.31),Z(-.07)],
 [X(.16),Y(.86),Z(-.07)]
 ],depth*.17),dark);
 addSurface('CROWN-GOLD-RIB',bar([X(0),Y(.90)],[X(0),Y(1.43)],width*.035,Z(.065)),trim);
}
if(operations.cheekPlates){
 for(const side of [-1,1]){
  const p=side<0?'LEFT':'RIGHT';
  addSurface('CHEEK-GUARD-'+p,prism([
   [X(side*.32),Y(.59),Z(.01)],[X(side*.52),Y(.64),Z(.07)],
   [X(side*.62),Y(.31),Z(.03)],[X(side*.48),Y(.13),Z(.015)],
   [X(side*.33),Y(.28),Z(.07)]
  ],depth*.12),dark);
  addSurface('CHEEK-GOLD-EDGE-'+p,bar([X(side*.51),Y(.61)],[X(side*.58),Y(.32)],width*.036,Z(.12)),trim);
 }
}
if(operations.horns){
 for(const side of [-1,1]){
  const label=side===-1?'LEFT':'RIGHT';
  addSurface('CROWN-HORN-'+label,prism([
   [X(side*.25),Y(.89),Z(-.10)],[X(side*.39),Y(1.14),Z(-.10)],
   [X(side*.70),Y(1.31),Z(-.10)],[X(side*.49),Y(1.02),Z(-.10)],
   [X(side*.41),Y(.85),Z(-.10)]
  ],depth*.20),trim);
 }
}
assert(mesh.primitives.length>=meshStarts+4,'NO_NEW_TOPOLOGY_GENERATED');
assert.deepEqual(doc.skins,original.skins,'ORIGINAL_SKELETON_CHANGED');
assert.deepEqual(doc.animations,original.animations,'ANIMATIONS_CHANGED');
assert.deepEqual(doc.nodes,original.nodes,'NODES_CHANGED');
for(let i=0;i<meshStarts;i++)assert.deepEqual(mesh.primitives[i],sourceMesh.primitives[i],'NATIVE_MESH_PRIMITIVE_CHANGED');
doc.buffers[0].byteLength=bin.length;
doc.asset={...doc.asset,generator:'HIGHFLY SKIN 7 native geometry + procedural skinned helmet plates (NOT LLM)'};
const jb=Buffer.from(JSON.stringify(doc)),jpad=Buffer.alloc(align4(jb.length)-jb.length,32);
bin=Buffer.concat([bin,Buffer.alloc(align4(bin.length)-bin.length)]);
const total=12+8+jb.length+jpad.length+8+bin.length;
const result=Buffer.alloc(total);
result.write('glTF');result.writeUInt32LE(2,4);result.writeUInt32LE(total,8);
result.writeUInt32LE(jb.length+jpad.length,12);result.writeUInt32LE(0x4e4f534a,16);
jb.copy(result,20);jpad.copy(result,20+jb.length);
const bstart=20+jb.length+jpad.length;
result.writeUInt32LE(bin.length,bstart);result.writeUInt32LE(0x004e4942,bstart+4);bin.copy(result,bstart+8);
const baselineAfter=fs.readFileSync(INPUT);assert(baselineAfter.equals(sourceBytes),'PREVIOUS_VARIANT_MUTATED');
fs.writeFileSync(OUTPUT,result);
const report={version:2,base:'Armor_paladin_Head',nativeMesh:true,
 sourceSha256:crypto.createHash('sha256').update(sourceBytes).digest('hex'),
 sourceUnchanged:true,rigAndAnimationUnchanged:true,headJoint,
 inputText:request.description,compiler:'constrained-keyword-to-operation, not generative LLM',
 imageUnderstandingImplemented:false,requestedOperations:operations,
 actualNewPrimitives:mesh.primitives.length-meshStarts,
 actualNewTriangles:pieces.reduce((n,p)=>n+p.triangles,0),
 actualNewVertices:pieces.reduce((n,p)=>n+p.vertices,0),
 parts:pieces,outputSize:result.length,
 visuallyApproved:false,physicalSamsungCertified:false,unityCertified:false,
 noPublicDeploy:true};
fs.writeFileSync(ROOT+'skin7-text-geometry-proof.json',JSON.stringify(report,null,2));
assert(report.actualNewPrimitives>=4&&report.actualNewTriangles>=20);
console.log('SKIN7_TEXT_RECIPE_REAL_NEW_SKINNED_GEOMETRY_GREEN=1',JSON.stringify({
 operations,primitives:report.actualNewPrimitives,triangles:report.actualNewTriangles,
 vertices:report.actualNewVertices,bytes:result.length}));
