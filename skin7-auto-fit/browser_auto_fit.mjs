// HIGHFLY SKIN 7.3 | Browser Auto-Fit FIRST PROTOTYPE
// Converts an unrigged indexed GLB into a Native Rig_Medium SkinnedMesh composition.
// Geometry segmentation is HEURISTIC, not physically validated retopology or art approval.
// Does not modify or replace original GLB or animation clips.
import * as THREE from 'three';

const PARTS=['Head','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const JOINTS={
 Head:['head'],Chest:['chest','spine','hips'],
 ArmL:['upperarm.l','lowerarm.l','wrist.l'],ArmR:['upperarm.r','lowerarm.r','wrist.r'],
 HandL:['hand.l','wrist.l'],HandR:['hand.r','wrist.r'],
 LegL:['upperleg.l','lowerleg.l','foot.l'],LegR:['upperleg.r','lowerleg.r','foot.r'],
 FootL:['foot.l','toes.l'],FootR:['foot.r','toes.r']
};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

function connectedComponents(mesh){
 const geometry=mesh.geometry;
 const pos=geometry.getAttribute('position');
 const ind=geometry.getIndex();
 if(!pos||!ind||ind.count<30||pos.count>1_200_000)throw Error('Se requiere GLB con geometría indexada y menos de 1,2 M de vértices');
 const n=pos.count, parent=new Uint32Array(n),size=new Uint32Array(n).fill(1);
 for(let i=0;i<n;i++)parent[i]=i;
 function find(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
 function union(a,b){
  a=find(a);b=find(b);if(a===b)return;
  if(size[a]<size[b]){const t=a;a=b;b=t;}
  parent[b]=a;size[a]+=size[b];
 }
 const faces=ind.array;
 for(let i=0;i<faces.length;i+=3){
  union(faces[i],faces[i+1]);union(faces[i],faces[i+2]);
 }
 const components=new Map();
 for(let i=0;i<n;i++){
  const id=find(i);let c=components.get(id);
  if(!c){c={id,vertices:0,sumX:0,minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};components.set(id,c);}
  const x=pos.getX(i),y=pos.getY(i);
  c.vertices++;c.sumX+=x;c.minX=Math.min(c.minX,x);c.maxX=Math.max(c.maxX,x);
  c.minY=Math.min(c.minY,y);c.maxY=Math.max(c.maxY,y);
 }
 const top=[...components.values()].filter(c=>c.vertices>100).sort((a,b)=>b.vertices-a.vertices);
 if(!top.length)throw Error('El archivo no contiene geometría recuperable.');
 const triptych=top.length>=3&&top[2].vertices>1000;
 const strongest=(triptych?top.slice(0,3):top.slice(0,1)).sort((a,b)=>a.sumX/a.vertices-b.sumX/b.vertices);
 const selected=strongest[0];
 const tri=[];
 for(let i=0;i<faces.length;i+=3)if(find(faces[i])===selected.id)tri.push(faces[i],faces[i+1],faces[i+2]);
 if(!tri.length)throw Error('No encontramos triángulos en la pieza seleccionada');
 return {pos,tri,selected,triptych,componentCount:components.size,figures:strongest.map(c=>({vertices:c.vertices,centerX:c.sumX/c.vertices}))};
}
function identify(x,y){
 if(y>.14)return 'Head';
 if(Math.abs(x)>.19&&y<=-.30&&y>-.47)return x<0?'HandL':'HandR';
 if(Math.abs(x)>.175&&y<.17&&y>-.38)return x<0?'ArmL':'ArmR';
 if(y<=-.43)return x<0?'FootL':'FootR';
 if(y<=-.17)return x<0?'LegL':'LegR';
 return 'Chest';
}
function voxelReduce(coords,faces,limit){
 const edge=Math.max(...[0,1,2].map(k=>{
  let lo=Infinity,hi=-Infinity;
  for(let i=k;i<coords.length;i+=3){lo=Math.min(lo,coords[i]);hi=Math.max(hi,coords[i]);}
  return hi-lo;
 }));
 let solution=null, pitch=0;
 // Progressive spatial voxel clustering, not quality-preserving quadric retopology.
 for(let step=0;step<22;step++){
  pitch=edge/220*Math.pow(1.17,step);
  const unique=new Map(), sums=[],counts=[],mapping=new Uint32Array(coords.length/3);
  for(let v=0;v<mapping.length;v++){
   const i=v*3;
   const key=Math.round(coords[i]/pitch)+','+Math.round(coords[i+1]/pitch)+','+Math.round(coords[i+2]/pitch);
   let target=unique.get(key);
   if(target===undefined){
    target=sums.length/3;unique.set(key,target);
    sums.push(0,0,0);counts.push(0);
   }
   mapping[v]=target;counts[target]++;const ix=target*3;
   sums[ix]+=coords[i];sums[ix+1]+=coords[i+1];sums[ix+2]+=coords[i+2];
  }
  const reduced=new Float32Array(sums.length);
  for(let v=0;v<counts.length;v++){
   const k=v*3;reduced[k]=sums[k]/counts[v];reduced[k+1]=sums[k+1]/counts[v];reduced[k+2]=sums[k+2]/counts[v];
  }
  const seen=new Set(),remapped=[];
  for(let i=0;i<faces.length;i+=3){
   const a=mapping[faces[i]],b=mapping[faces[i+1]],c=mapping[faces[i+2]];
   if(a===b||b===c||c===a)continue;
   const key=[a,b,c].sort((x,y)=>x-y).join(',');
   if(seen.has(key))continue;seen.add(key);remapped.push(a,b,c);
  }
  if(!remapped.length)continue;
  const used=new Set(remapped),compact=new Uint32Array(counts.length).fill(0xffffffff);
  const outPos=new Float32Array(used.size*3);let next=0;
  for(const id of used){compact[id]=next;outPos.set(reduced.subarray(id*3,id*3+3),next*3);next++;}
  const outIndices=new Uint32Array(remapped.length);
  for(let i=0;i<remapped.length;i++)outIndices[i]=compact[remapped[i]];
  solution={positions:outPos,indices:outIndices,pitch,triangles:outIndices.length/3};
  if(solution.triangles<=limit)break;
 }
 if(!solution)throw Error('Simplificación sin triángulos útiles');
 return solution;
}
function transferSkin(position,part,reference){
 const bones=reference.skeleton.bones;
 const boneNames=bones.map(b=>b.name);
 const choices=JOINTS[part].filter(name=>boneNames.includes(name));
 if(!choices.length)throw Error('Huesos nativos ausentes en '+part);
 const anchors=choices.map(name=>{
  const index=boneNames.indexOf(name),p=new THREE.Vector3();
  bones[index].getWorldPosition(p);
  return {index,x:p.x,y:p.y,z:p.z};
 });
 const count=position.length/3;
 const skinIndex=new Uint16Array(count*4),skinWeight=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  const j=i*3,x=position[j],y=position[j+1],z=position[j+2];
  const near=anchors.map(b=>({
   index:b.index,
   weight:1/Math.pow(Math.max(.035,Math.hypot(x-b.x,y-b.y,z-b.z)),3)
  })).sort((a,b)=>b.weight-a.weight).slice(0,4);
  const sum=near.reduce((s,e)=>s+e.weight,0);
  for(let k=0;k<near.length;k++){
   skinIndex[i*4+k]=near[k].index;
   skinWeight[i*4+k]=near[k].weight/sum;
  }
 }
 return {skinIndex,skinWeight};
}
function makeMesh(part,reduced,reference){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(reduced.positions,3));
 geometry.setIndex(new THREE.BufferAttribute(reduced.indices,1));
 geometry.computeVertexNormals();
 const {skinIndex,skinWeight}=transferSkin(reduced.positions,part,reference);
 geometry.setAttribute('skinIndex',new THREE.BufferAttribute(skinIndex,4));
 geometry.setAttribute('skinWeight',new THREE.BufferAttribute(skinWeight,4));
 geometry.computeBoundingSphere();
 const baseMaterial=new THREE.MeshStandardMaterial({
  color:part==='Head'?'#181525':'#242232',
  metalness:.76,roughness:.30,side:THREE.DoubleSide,
  emissive:'#24094c',emissiveIntensity:.20
 });
 const mesh=new THREE.SkinnedMesh(geometry,baseMaterial);
 mesh.name='HIGHFLY_AUTO_FIT_'+part;
 mesh.frustumCulled=false;mesh.userData={experimental:true,source:'SupaVoxel unrigged GLB',component:part};
 reference.parent.add(mesh);
 mesh.bind(reference.skeleton,reference.bindMatrix);
 return mesh;
}
export async function autoFitRawGLB(source,rig,progress=()=>{}){
 const meshes=[];
 source.scene.traverse(o=>{if(o.isMesh&&o.geometry?.getAttribute('position')&&o.geometry.getIndex())meshes.push(o);});
 if(!meshes.length)throw Error('El GLB no tiene mallas indexadas aptas para conversión');
 meshes.sort((a,b)=>(b.geometry.getIndex()?.count||0)-(a.geometry.getIndex()?.count||0));
 progress('Separando las figuras del GLB de SupaVoxel...');
 await tick();
 const {pos,tri,selected,triptych,componentCount,figures}=connectedComponents(meshes[0]);
 const xcenter=(selected.minX+selected.maxX)*.5, floor=selected.minY,scale=1.26;
 // Same source-envelope transform as our verified Python prototype.
 const buckets=new Map(PARTS.map(part=>[part,[]]));
 for(let i=0;i<tri.length;i+=3){
  const a=tri[i],b=tri[i+1],c=tri[i+2];
  const x=(pos.getX(a)+pos.getX(b)+pos.getX(c))/3;
  const y=(pos.getY(a)+pos.getY(b)+pos.getY(c))/3;
  buckets.get(identify(x-xcenter,y)).push(a,b,c);
 }
 const reference=rig.scene.getObjectByName('M_Torso');
 if(!reference?.isSkinnedMesh||reference.skeleton.bones.length!==23){
  throw Error('No se pudo localizar M_Torso y los 23 huesos nativos Rig_Medium.');
 }
 rig.scene.updateMatrixWorld(true);
 const records=[];let total=0;
 for(const part of PARTS){
  const list=buckets.get(part);if(list.length<60)continue;
  progress('Adaptando '+part+' al Rig_Medium...');
  await tick();
  const local=new Map(),srcPos=[],srcFaces=[];
  for(const id of list){
   let out=local.get(id);
   if(out===undefined){
    out=srcPos.length/3;local.set(id,out);
    srcPos.push((pos.getX(id)-xcenter)*scale,(pos.getY(id)-floor)*scale,pos.getZ(id)*scale);
   }
   srcFaces.push(out);
  }
  const reduced=voxelReduce(srcPos,srcFaces,2300);
  const mesh=makeMesh(part,reduced,reference);
  records.push({part,triangles:reduced.triangles,vertices:reduced.positions.length/3,skinned:mesh.isSkinnedMesh});
  total+=reduced.triangles;
 }
 if(records.length<7)throw Error('No se pudieron recuperar suficientes piezas de armadura (7 requeridas).');
 rig.scene.updateMatrixWorld(true);
 const proof={source:'SupaVoxel raw GLB',triptych,originalComponents:componentCount,
  figures,selectedVertices:selected.vertices,parts:records,newTriangles:total,
  rigBones:reference.skeleton.bones.length,animations:rig.animations.length,
  gates:{structural:true,visualFitApproved:false,collisionApproved:false,femaleApproved:false,physicalAndroidApproved:false}};
 progress('Armado experimental listo. Revisá las vistas y animaciones; sin aprobación artística.');
 return {gltf:rig,proof};
}
