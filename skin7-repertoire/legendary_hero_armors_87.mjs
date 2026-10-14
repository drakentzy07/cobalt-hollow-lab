/** HIGHFLY 8.7 — Three concept-inspired NEW skinned armors, not an exact image-to-GLB conversion.
 * Three genuine distinct shapes, native vertex-rooted ornaments, 3D scale plates, feathered
 * angel and fallen angel wings. Rig_Medium and original animations never modified.
 */
import * as THREE from 'three';
export const HERO87=Object.freeze({
 'hero-dragon':{label:'DRAGON SOVEREIGN · Rey Dragón',base:'dragon',color:0x792222,trim:0xe0aa60,glow:0xff641e,wing:0x541a20,kind:'dragon'},
 'hero-celestial':{label:'CELESTIAL SERAPH · Alas de Luz',base:'celestial',color:0xeaeaf2,trim:0xf4cc70,glow:0x68caff,wing:0xfff7ed,kind:'angel'},
 'hero-death':{label:'MORTIS SERAPH · Ángel de la Muerte',base:'berserker',color:0x171820,trim:0xaeb5bf,glow:0xca304f,wing:0x15151c,kind:'fallen'}
});
const SLOT=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function donors(scene){
 const map=new Map(SLOT.map(k=>[k,[]]));
 scene.traverse(root=>{
  const key=root.name?.startsWith('Armor_paladin_')?root.name.slice('Armor_paladin_'.length):null;
  if(!map.has(key))return;
  root.traverse(m=>{if(m.isSkinnedMesh&&m.name?.startsWith('Armor_paladin_')&&!map.get(key).includes(m))map.get(key).push(m)});
 });
 if([...map.values()].flat().length!==17||[...map.values()].some(a=>!a.length))throw Error('HF87_17_NATIVE_DONOR_RED');
 return new Map([...map].map(([k,a])=>[k,a.sort((x,y)=>y.geometry.attributes.position.count-x.geometry.attributes.position.count)[0]]));
}
function bounds(mesh){
 const b=new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
 return {b,c:b.getCenter(V()),s:b.getSize(V())};
}
function anchor(src,nx,ny,nz){
 const {c,s}=bounds(src),want=V(c.x+nx*s.x*.5,c.y+ny*s.y*.5,c.z+nz*s.z*.5),
 p=src.geometry.attributes.position,n=src.geometry.attributes.normal,si=src.geometry.attributes.skinIndex,sw=src.geometry.attributes.skinWeight;
 let at=0,min=Infinity;
 for(let i=0;i<p.count;i++){
  const d=(p.getX(i)-want.x)**2+(p.getY(i)-want.y)**2+(p.getZ(i)-want.z)**2;
  if(d<min){at=i;min=d;}
 }
 const point=V(p.getX(at),p.getY(at),p.getZ(at));
 const normal=n?V(n.getX(at),n.getY(at),n.getZ(at)).normalize():V(0,0,1);
 const idx=[],w=[];let sum=0;
 if(!si||!sw)throw Error('HF87_SKINNING_MISSING');
 for(let i=0;i<4;i++){idx.push(si.getComponent(at,i));const a=sw.getComponent(at,i);w.push(a);sum+=a;}
 if(sum<.00001)throw Error('HF87_EMPTY_WEIGHTS');
 return {point,normal,idx,w:w.map(x=>x/sum)};
}
function feather(root,tip,width){
 const axis=tip.clone().sub(root).normalize();
 let across=V(0,0,1).cross(axis);if(across.lengthSq()<.0001)across=V(0,1,0).cross(axis);
 across.normalize();const front=across.clone().cross(axis).normalize();
 const xyz=[],tris=[],steps=7;
 for(let i=0;i<=steps;i++){
  const t=i/steps,center=root.clone().lerp(tip,t).addScaledVector(front,.018*Math.sin(t*Math.PI));
  const w=width*Math.sin(Math.PI*Math.pow(t,.78));
  for(const v of [center.clone().addScaledVector(across,-w),center.clone().addScaledVector(front,.02*Math.sin(t*Math.PI)),center.clone().addScaledVector(across,w)])xyz.push(v.x,v.y,v.z);
  if(i){const a=(i-1)*3,b=i*3;tris.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));g.setIndex(tris);g.computeVertexNormals();return g;
}
function relief(a,s,shape){
 const g=shape==='scale'?new THREE.IcosahedronGeometry(1,1):shape==='gem'?new THREE.OctahedronGeometry(1,0):new THREE.SphereGeometry(1,8,6);
 g.scale(Math.max(.01,s.x),Math.max(.01,s.y),Math.max(.01,s.z));
 const normal=a.normal.lengthSq()>.1?a.normal:V(0,0,1);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,0,1),normal));
 g.translate(a.point.x+normal.x*s.z*.25,a.point.y+normal.y*s.z*.25,a.point.z+normal.z*s.z*.25);
 return g;
}
function skinned(src,g,a,material,name){
 const count=g.attributes.position.count,idx=new Uint16Array(count*4),w=new Float32Array(count*4);
 for(let i=0;i<count;i++)for(let k=0;k<4;k++){idx[i*4+k]=a.idx[k];w[i*4+k]=a.w[k];}
 g.setAttribute('skinIndex',new THREE.BufferAttribute(idx,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 g.computeBoundingSphere();const mesh=new THREE.SkinnedMesh(g,material);
 mesh.name=name;mesh.bind(src.skeleton,src.bindMatrix.clone());
 mesh.frustumCulled=false;src.parent.add(mesh);return mesh;
}
export function buildLegendary87(gltf,id){
 const spec=HERO87[id];if(!spec)throw Error('HF87_INVALID_LEGEND '+id);
 const source=donors(gltf.scene),added=[],stats={wings:0,armor:0,scales:0,gems:0,halo:0},coverage=new Set();
 const mats=Object.fromEntries(['color','trim','glow','wing'].map(k=>[k,new THREE.MeshStandardMaterial({
  color:spec[k],emissive:k==='glow'?spec.glow:0x000000,emissiveIntensity:k==='glow'?.62:0,
  metalness:k==='wing'?.16:.71,roughness:k==='wing'?.72:.31,side:THREE.DoubleSide
 })]));
 // Discard prior spike recipes for these new hero designs, keep only the 17
 // already conformed natively-weighted original armor pieces beneath them.
 let oldHidden=0;
 gltf.scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('HF86_SCULPT_')){if(o.visible)oldHidden++;o.visible=false;}});
 function insert(slot,geo,a,type,mat='color'){
  const m=skinned(source.get(slot),geo,a,mats[mat],'HF87_'+id+'_'+type+'_'+added.length);
  added.push(m);coverage.add(slot);stats[type]++;return m;
 }
 function plate(slot,x,y,z,scale=[.25,.20,.17],type='armor',mat='color',shape='plate'){
  const src=source.get(slot),a=anchor(src,x,y,z),s=bounds(src).s;
  insert(slot,relief(a,V(s.x*scale[0],s.y*scale[1],s.z*scale[2]),shape),a,type,mat);
 }
 const isDragon=spec.kind==='dragon',isAngel=spec.kind==='angel',isDeath=spec.kind==='fallen';
 // 3D chest scales in dragon, holy layered breastplate in seraph,
 // death-mask Gothic segmented breastplate in fallen angel.
 for(let row=0;row<(isDragon?5:3);row++)for(let col=-2;col<=2;col++){
  if(row===4&&Math.abs(col)===2)continue;
  plate('Chest',col*.31+(row%2)*.07,.74-row*.35,.91,
   [isDragon?.20:.27,.22,.20],isDragon?'scales':'armor',
   row===0?'trim':(isDeath&&col===0?'trim':'color'),isDragon?'scale':'plate');
 }
 plate('Chest',0,.20,.94,[.17,.17,.24],'gems','glow','gem');
 // Distributed real 3D armor on shoulder, arms, gauntlets, legs and feet.
 for(const side of [-1,1]){
  const arm=side<0?'ArmL':'ArmR',hand=side<0?'HandL':'HandR',
   leg=side<0?'LegL':'LegR',foot=side<0?'FootL':'FootR';
  for(let n=0;n<4;n++)
   plate(arm,side*(.16+n*.16),.72-n*.34,.72,[.31,.28,.22],
    isDragon?'scales':'armor',n===0?'trim':'color',isDragon?'scale':'plate');
  for(let n=0;n<3;n++)
   plate(hand,side*(.10+n*.22),.54-n*.42,.93,[.29,.29,.21],
     'armor',isDragon?'trim':'color',isDragon?'scale':'plate');
  for(let n=0;n<4;n++)
   plate(leg,side*(n%2?.33:-.23),.60-n*.38,.85,[.31,.27,.22],
     isDragon?'scales':'armor',n===0?'trim':'color',isDragon?'scale':'plate');
  plate(foot,side*.20,-.29,.90,[.37,.32,.22],'armor','trim',isDragon?'scale':'plate');
 }
 // Distinct helmet sculpt vocabularies; no random forest of horns.
 if(isDragon){
  for(let row=0;row<3;row++)for(let col=-2;col<=2;col++)
   plate('Head',col*.35,.73-row*.39,.90,[.21,.19,.16],'scales',
     row===0?'trim':'color','scale');
  plate('Head',0,-.48,.95,[.37,.19,.26],'armor','trim','plate'); // dragon muzzle
 }else if(isAngel){
  for(const side of [-1,1])for(let j=0;j<4;j++)
   plate('Head',side*(.24+j*.19),.77-j*.30,.78,[.22,.27,.17],'armor',j%2?'color':'trim','scale');
  plate('Head',0,.72,.93,[.18,.27,.15],'gems','glow','gem');
 }else{
  for(const side of [-1,1])for(let j=0;j<4;j++)
   plate('Head',side*(.15+j*.19),.64-j*.28,.81,[.27,.26,.22],'armor','color','scale');
  plate('Head',0,.24,.98,[.25,.07,.16],'gems','glow','scale');
 }
 // Two sculpted wing roots attached to ORIGINAL BACK geometry and weights,
 // not a cape placed in arbitrary world space. Lower feather tips are
 // deliberately different for crimson membrane / ivory wings / torn black.
 const back=source.get('Back'),bs=bounds(back).s;
 for(const side of [-1,1]){
  const a=anchor(back,side*.60,.69,-.80),root=a.point;
  const count=isDragon?9:isAngel?13:15;
  for(let j=0;j<count;j++){
   const t=j/(count-1),width=bs.x*(isDragon?1.22:1.85),height=bs.y*(isDragon?1.28:2.08);
   const tip=root.clone().add(V(
    side*width*(.38+.63*Math.sin(t*Math.PI*.69)),
    height*((isAngel?.68:.39)-t*(isDragon?.85:1.12)),
    -bs.z*.30-bs.x*.10*Math.sin(t*2)
   ));
   const start=root.clone().lerp(tip,.06);
   const g=feather(start,tip,bs.x*(isDragon?.15:.12)*(1-t*.4));
   insert('Back',g,a,'wings',j%5===0?'glow':j%4===0?'trim':'wing');
  }
 }
 if(!isDragon){
  const a=anchor(back,0,.92,-.89),r=Math.max(bs.x*.48,.12);
  const g=new THREE.TorusGeometry(r,r*.06,5,32);
  g.translate(a.point.x,a.point.y+bs.y*.87,a.point.z-bs.z*.09);
  insert('Back',g,a,'halo',isAngel?'trim':'glow');
 }
 plate('Back',0,.40,-1,[.17,.18,.17],'gems','glow','gem');
 let rogue=0;
 gltf.scene.traverse(o=>{if(o.isMesh&&o.visible&&o.name.startsWith('HF86_SCULPT_'))rogue++;});
 const qa={pass:'SKIN8_7_THREE_LEGENDARY',id,legendName:spec.label,enabled:true,
  sourcePrimitives:17,bones:23,clips:gltf.animations.length,
  weightedMeshes:added.filter(o=>o.isSkinnedMesh&&o.skeleton.bones.length===23).length,
  meshes:added.length,attachedWingFeathers:stats.wings,
  wingPairs:2,haloCount:stats.halo,geometryKinds:stats,
  coverage:[...coverage],oldSpikesHidden:oldHidden,legacySpikesVisible:rogue,
  exactToRenderedImages:false,clippingCertified:false,wingPhysics:false,realS23Tested:false};
 if(rogue!==0||qa.clips!==22||qa.meshes!==qa.weightedMeshes||
  qa.attachedWingFeathers!==(isDragon?18:isAngel?26:30)||
  !['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'].every(k=>coverage.has(k))||
  (isDragon?stats.scales<15:stats.halo!==1))
   throw Error('HF87_LEGENDARY_GATE_RED '+JSON.stringify(qa));
 return qa;
}
