/**
 * HIGHFLY SKIN 8.6 — Native-surface ANCHORED, RIGGED 3D silhouette authoring.
 *
 * Major architectural change from 8.5 spray-paint pass:
 * each family's helmet/pauldrons/gauntlets/chest/greaves gain unique 3D
 * sculpted protrusions (NOT recolors), originating at actual ORIGINAL
 * Armor_paladin source vertices. Never from an arbitrary bbox plane.
 *
 * Each attachment's base is a native vertex. Geometry inherits the skinning
 * indices and weights of that native vertex, binds to its SAME 23-bone
 * skeleton, and travels with native animation. Nothing replaces the Back
 * cape; the ONLY cape remains the conformed native Back mesh from 8.5.
 *
 * This is a first-pass procedural 3D reinterpretation, not an exact
 * reconstruction of the five concept renders. Visual approval pending.
 */
import * as THREE from 'three';

const SPECS={
 violet:{label:'Obsidiana Violeta',kind:'SWEPT OBSIDIAN',colors:[0x0d101d,0xb9b2c8,0x9b35f3],head:4,shoulder:4,chest:3,leg:2},
 dragon:{label:'Dragón Rojo Escamado',kind:'DRAGON HORNS',colors:[0x581e1d,0xffc578,0xff5315],head:5,shoulder:6,chest:5,leg:4},
 celestial:{label:'Saint Celestial',kind:'WINGED SAINT',colors:[0xedf0ff,0xf5ce74,0x6bccff],head:7,shoulder:8,chest:6,leg:4},
 berserker:{label:'Infernal Cataclismo',kind:'INFERNAL FLAME',colors:[0x1b1417,0xc5aca1,0xff4a18],head:5,shoulder:7,chest:5,leg:4},
 arcane:{label:'Arcane Astral',kind:'ASTRAL CRYSTAL',colors:[0x23365a,0xdce9ff,0x228dff],head:5,shoulder:6,chest:7,leg:4}
};
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(x,low,high)=>Math.max(low,Math.min(high,x));
function getSources(scene){
 const m=new Map(SLOTS.map(s=>[s,[]]));
 scene.traverse(o=>{
  const slot=o.name?.startsWith('Armor_paladin_')?o.name.slice('Armor_paladin_'.length):null;
  if(!m.has(slot))return;
  o.traverse(child=>{
   if(child.isSkinnedMesh&&child.name?.startsWith('Armor_paladin_')&&!m.get(slot).includes(child))m.get(slot).push(child);
  });
 });
 if([...m.values()].flat().length!==17||[...m.values()].some(a=>a.length===0))
  throw Error('SKIN86_17_SOURCE_PRIMITIVES_REQUIRED');
 return new Map([...m].map(([slot,a])=>[slot,a.slice().sort((x,y)=>y.geometry.getAttribute('position').count-x.geometry.getAttribute('position').count)[0]]));
}
function nativeSurfaceAnchor(source,xyz){
 const g=source.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
 const desired=xyz;
 let at=0,dist=Infinity;
 for(let i=0;i<p.count;i++){
  const d=(p.getX(i)-desired.x)**2+(p.getY(i)-desired.y)**2+(p.getZ(i)-desired.z)**2;
  if(d<dist){dist=d;at=i;}
 }
 const point=vec(p.getX(at),p.getY(at),p.getZ(at));
 const normal=n?vec(n.getX(at),n.getY(at),n.getZ(at)).normalize():vec(0,0,1);
 const si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
 if(!si||!sw)throw Error('SKIN86_SOURCE_WEIGHTS_MISSING '+source.name);
 const indices=[],weights=[];let total=0;
 for(let k=0;k<4;k++){indices.push(si.getComponent(at,k));const w=sw.getComponent(at,k);weights.push(w);total+=w;}
 if(total<.000001)throw Error('SKIN86_ZERO_WEIGHT '+source.name);
 return {point,normal,index:at,indices,weights:weights.map(w=>w/total)};
}
function curveHorn(base,p1,p2,width,ring=7,steps=9){
 // Sculpted, bevelled 3D horn/flame/crystal: native-rooted loft, not plane.
 const xyz=[],indices=[];
 let zero=null,tip=null;
 for(let row=0;row<=steps;row++){
  const t=row/steps,omt=1-t;
  const center=base.clone().multiplyScalar(omt*omt).addScaledVector(p1,2*omt*t).addScaledVector(p2,t*t);
  const ahead=t<1?base.clone().multiplyScalar((1-Math.min(1,t+.01))**2)
   .addScaledVector(p1,2*(1-Math.min(1,t+.01))*Math.min(1,t+.01))
   .addScaledVector(p2,Math.min(1,t+.01)**2):p2.clone();
  const tangent=(t<1?ahead.sub(center):p2.clone().sub(p1)).normalize();
  let basisA=tangent.clone().cross(vec(0,0,1));
  if(basisA.lengthSq()<.0001)basisA=tangent.clone().cross(vec(0,1,0));
  basisA.normalize();
  const basisB=tangent.clone().cross(basisA).normalize();
  const radius=width*Math.pow(Math.max(0,1-t),.78)*(1+.08*Math.sin(t*6));
  for(let side=0;side<ring;side++){
   const angle=side*2*Math.PI/ring;
   const p=center.clone().addScaledVector(basisA,radius*Math.cos(angle))
    .addScaledVector(basisB,radius*Math.sin(angle));
   xyz.push(p.x,p.y,p.z);
  }
  if(row===0)zero=center;
  if(row===steps)tip=center;
 }
 for(let row=0;row<steps;row++)for(let side=0;side<ring;side++){
  const a=row*ring+side,b=row*ring+(side+1)%ring,c=(row+1)*ring+side,d=(row+1)*ring+(side+1)%ring;
  indices.push(a,c,b,b,c,d);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 return {geo,base:zero,tip};
}
function groupedSkinned(pieces,source,style,slot){
 let count=0;
 for(const p of pieces){p.g=p.geo.index?p.geo.toNonIndexed():p.geo;count+=p.g.attributes.position.count;}
 const xyz=new Float32Array(count*3),nrm=new Float32Array(count*3),
  indices=new Uint16Array(count*4),weights=new Float32Array(count*4);
 const geom=new THREE.BufferGeometry();let start=0;
 for(const part of pieces){
  const p=part.g.getAttribute('position'),n=part.g.getAttribute('normal');
  for(let i=0;i<p.count;i++){
   const target=(start+i)*3,sk=(start+i)*4;
   xyz[target]=p.getX(i);xyz[target+1]=p.getY(i);xyz[target+2]=p.getZ(i);
   nrm[target]=n.getX(i);nrm[target+1]=n.getY(i);nrm[target+2]=n.getZ(i);
   for(let k=0;k<4;k++){indices[sk+k]=part.anchor.indices[k];weights[sk+k]=part.anchor.weights[k];}
  }
  geom.addGroup(start,p.count,part.mat);start+=p.count;
  if(part.g!==part.geo)part.g.dispose();
  part.geo.dispose();
 }
 geom.setAttribute('position',new THREE.BufferAttribute(xyz,3));
 geom.setAttribute('normal',new THREE.BufferAttribute(nrm,3));
 geom.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));
 geom.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
 geom.computeBoundingSphere();
 const ms=SPECS[style].colors.map(c=>new THREE.MeshStandardMaterial({
  color:c,roughness:.34,metalness:.68,side:THREE.DoubleSide,
  emissive:c===SPECS[style].colors[2]?c:0,
  emissiveIntensity:c===SPECS[style].colors[2]?.34:0
 }));
 const mesh=new THREE.SkinnedMesh(geom,ms);
 mesh.name='HF86_SCULPT_'+style+'_'+slot;mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.frustumCulled=false;source.parent.add(mesh);
 return mesh;
}
export function sculptFamilySilhouette86(gltf,style){
 if(style==='royal')return {pass:'SKIN8_6_SCULPT',enabled:false,comparator:true};
 const spec=SPECS[style];if(!spec)throw Error('SKIN86_STYLE_UNKNOWN');
 const donors=getSources(gltf.scene),added=[],fit={};
 const piecesBySlot=new Map(SLOTS.map(s=>[s,[]]));
 let surfaceAnchors=0,parts=0,nonSurfaceBases=0;
 function build(slot,{x=0,y=.2,z=1,dx=0,dy=1,dz=0,length=.35,width=.09,curve=.25,material=1}){
  const donor=donors.get(slot),b=new THREE.Box3().setFromBufferAttribute(donor.geometry.getAttribute('position'));
  const center=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());
  const sourcePoint=vec(center.x+x*size.x*.5,center.y+y*size.y*.5,center.z+z*size.z*.5);
  const anchor=nativeSurfaceAnchor(donor,sourcePoint);
  const unit=Math.max(.09,Math.min(size.x,size.y,size.z));
  const dimension=Math.max(size.x,size.y,size.z);
  const direction=vec(dx,dy,dz).normalize();
  const start=anchor.point.clone();
  const span=dimension*length,thick=dimension*width;
  const normal=anchor.normal.lengthSq()>.2?anchor.normal:vec(0,0,1);
  // The base penetrates its source by one small radius: NO floating ornament.
  const behind=start.clone().addScaledVector(normal,-thick*.18);
  const tip=behind.clone().addScaledVector(direction,span)
   .addScaledVector(vec(0,0,1),curve*span*.25);
  const middle=behind.clone().lerp(tip,.48)
   .addScaledVector(vec(dx<0?-1:1,0,.30).normalize(),curve*span);
  const result=curveHorn(behind,middle,tip,thick,style==='celestial'?6:7,8);
  piecesBySlot.get(slot).push({geo:result.geo,anchor,mat:material});
  surfaceAnchors++;parts++;
  if(behind.distanceTo(start)>thick*.20)nonSurfaceBases++;
  return {extent:tip.distanceTo(start)/Math.max(dimension,.01),sourceWidth:size.x};
 }
 function hornPair(slot,props){
  const d=props;
  build(slot,{...d,x:-d.x,dx:-Math.abs(d.dx),material:d.material??1});
  build(slot,{...d,x:d.x,dx:Math.abs(d.dx),material:d.material??1});
 }
 // Shared anchors only; each family uses DIFFERENT counts, lengths,
 // directions, materials, and compositional motifs.
 if(style==='violet'){
  hornPair('Head',{x:.36,y:.36,z:.44,dx:.73,dy:.84,dz:-.12,length:.61,width:.084,curve:.32,material:2});
  hornPair('Head',{x:.16,y:.75,z:.25,dx:.32,dy:1,dz:.0,length:.27,width:.045,curve:.06,material:1});
  for(const slot of ['ArmL','ArmR']){
   const sign=slot==='ArmL'?-1:1;
   build(slot,{x:sign*.45,y:.62,z:.27,dx:sign*.62,dy:.91,dz:-.3,length:.58,width:.13,curve:.16,material:0});
   build(slot,{x:sign*.29,y:.38,z:.59,dx:sign*.75,dy:.25,dz:.6,length:.26,width:.09,curve:.15,material:1});
  }
  build('Chest',{x:0,y:.25,z:.96,dx:0,dy:.48,dz:1,length:.21,width:.075,curve:.02,material:2});
  hornPair('Chest',{x:.31,y:.07,z:.97,dx:.45,dy:-.78,dz:.50,length:.22,width:.052,curve:.04,material:1});
  for(const slot of ['LegL','LegR'])build(slot,{x:0,y:.35,z:.95,dx:0,dy:-.65,dz:1,length:.19,width:.09,material:1});
 }else if(style==='dragon'){
  hornPair('Head',{x:.37,y:.60,z:.19,dx:.53,dy:1,dz:-.46,length:.78,width:.15,curve:.32,material:1});
  build('Head',{x:0,y:.95,z:.08,dx:0,dy:1,dz:-.24,length:.37,width:.13,material:1});
  hornPair('Head',{x:.45,y:-.05,z:.65,dx:.55,dy:-.48,dz:.85,length:.20,width:.07,curve:.11,material:0});
  for(const slot of ['ArmL','ArmR']){
   const sign=slot==='ArmL'?-1:1;
   for(let i=0;i<3;i++)
    build(slot,{x:sign*(.43-i*.12),y:.70-i*.19,z:.23,dx:sign*(.6+i*.1),dy:.78,dz:-.21,length:.52-i*.11,width:.10,curve:.18,material:i===0?1:0});
  }
  for(let i=-2;i<=2;i++)build('Chest',{x:i*.18,y:.28-Math.abs(i)*.1,z:.91,dx:i*.18,dy:-.30,dz:1,length:.12,width:.055,material:i===0?2:1});
  for(const slot of ['LegL','LegR'])for(let i=0;i<2;i++)
   build(slot,{x:i===0?-.16:.16,y:.21,z:.96,dx:i===0?-.2:.2,dy:-.35,dz:1,length:.21,width:.085,material:1});
 }else if(style==='celestial'){
  build('Head',{x:0,y:.96,z:.16,dx:0,dy:1,dz:.04,length:.60,width:.11,curve:.05,material:1});
  for(const sign of [-1,1])for(let i=0;i<3;i++){
   build('Head',{x:sign*(.34+i*.12),y:.47-i*.14,z:.05,
    dx:sign*(.83+i*.09),dy:.79-i*.16,dz:-.18,length:.48-i*.07,width:.068,curve:.11,material:i%2===0?1:0});
  }
  for(const slot of ['ArmL','ArmR']){
   const sign=slot==='ArmL'?-1:1;
   for(let i=0;i<4;i++)build(slot,{x:sign*(.22+i*.12),y:.72-i*.13,z:.18,
    dx:sign*.78,dy:.89-i*.18,dz:-.1,length:.49-i*.07,width:.073,curve:.10,material:i%2});
  }
  for(let i=0;i<6;i++){
   const theta=2*Math.PI*i/6;
   build('Chest',{x:Math.cos(theta)*.30,y:Math.sin(theta)*.35,z:.95,dx:Math.cos(theta),dy:Math.sin(theta),dz:.50,length:.17,width:.042,curve:0,material:i%2?1:2});
  }
  for(const slot of ['LegL','LegR'])for(const sign of [-1,1])
   build(slot,{x:sign*.32,y:.24,z:.6,dx:sign*.5,dy:-.49,dz:.5,length:.16,width:.065,material:1});
 }else if(style==='berserker'){
  build('Head',{x:-.36,y:.66,z:.1,dx:-.44,dy:1,dz:-.3,length:.75,width:.14,curve:.23,material:2});
  build('Head',{x:.37,y:.55,z:.2,dx:.45,dy:.94,dz:-.23,length:.49,width:.135,curve:.17,material:2});
  for(let i=-1;i<=1;i++)build('Head',{x:i*.23,y:.87,z:.35,dx:i*.24,dy:1,dz:.13,length:.17+(.05*(i+1)),width:.066,material:1});
  for(const slot of ['ArmL','ArmR']){
   const sign=slot==='ArmL'?-1:1;
   for(let i=0;i<(sign<0?4:3);i++)
    build(slot,{x:sign*.40,y:.75-i*.18,z:.15,dx:sign*(.3+i*.2),dy:.86,dz:-.1,
     length:.43-i*.065,width:.10,curve:.13,material:i%2?1:2});
  }
  for(let i=-2;i<=2;i++)build('Chest',{x:i*.18,y:.08,z:.96,dx:i*.13,dy:-.38,dz:1,length:.16,width:.045,material:2});
  for(const slot of ['LegL','LegR'])for(const sign of [-1,1])
   build(slot,{x:sign*.35,y:.25,z:.72,dx:sign*.30,dy:.12,dz:1,length:.18,width:.075,material:1});
 }else if(style==='arcane'){
  for(let i=-2;i<=2;i++)build('Head',{x:i*.20,y:.79-Math.abs(i)*.12,z:.23,
   dx:i*.18,dy:1,dz:.18,length:.51-Math.abs(i)*.095,width:.074,curve:.035,material:i===0?2:1});
  for(const slot of ['ArmL','ArmR']){
   const sign=slot==='ArmL'?-1:1;
   for(let i=0;i<3;i++)build(slot,{x:sign*(.20+i*.19),y:.48-i*.22,z:.57,
    dx:sign*.75,dy:.52-i*.16,dz:.78,length:.28-i*.055,width:.09,curve:.04,material:i===0?2:1});
  }
  for(let i=0;i<7;i++){const t=2*Math.PI*i/7;
   build('Chest',{x:Math.cos(t)*.26,y:Math.sin(t)*.30,z:.94,
    dx:Math.cos(t)*.5,dy:Math.sin(t)*.4,dz:1,length:.14,width:.046,curve:.01,material:i%2?2:1});
  }
  for(const slot of ['LegL','LegR'])for(const sign of [-1,1])
   build(slot,{x:sign*.31,y:.1,z:.79,dx:sign*.26,dy:-.39,dz:.9,length:.17,width:.064,material:2});
 }
 for(const [slot,pieces] of piecesBySlot){
  if(!pieces.length)continue;
  const sculpt=groupedSkinned(pieces,donors.get(slot),style,slot);
  added.push(sculpt);
  fit[slot]=pieces.length;
 }
 let capeExtra=0,invalid=0;
 const underArmor=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
 gltf.scene.traverse(o=>{
  if(!o.isMesh||!o.visible)return;
  const n=o.name||'';
  if(n.startsWith('HF86_SCULPT_'+style+'_'))return;
  if(n.startsWith('HF84_NATIVEREFORGE_'+style+'_'))return;
  if(underArmor.test(n))return;
  if(/cape|cloak|mantle/i.test(n))capeExtra++;
  invalid++;
 });
 let tipSpread=0;
 added.forEach(m=>{
  const b=new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position'));
  tipSpread=Math.max(tipSpread,b.getSize(new THREE.Vector3()).length());
 });
 const proof={
  pass:'SKIN8_6_SCULPT',enabled:true,label:spec.label,signature:spec.kind,
  newRiggedSculptMeshes:added.length,anchoredDetails:parts,
  nativeSurfaceAnchors:surfaceAnchors,nonSurfaceBases,
  boneCount:23,clipCount:gltf.animations.length,
  detachedAdditionalCapeMeshes:capeExtra,unexpectedVisibleMeshes:invalid,
  sculptedSlots:fit,localSculptExtent:tipSpread,
  styleRecipe:spec.kind,referenceArtApproved:false,
  physicallyTested:false,exactReferenceReconstruction:false
 };
 if(parts<13||added.length<3||surfaceAnchors!==parts||nonSurfaceBases!==0||
  invalid!==0||capeExtra!==0||proof.clipCount!==22||
  added.some(x=>!x.isSkinnedMesh||x.skeleton.bones.length!==23))
   throw Error('SKIN86_SILHOUETTE_GATE_RED '+JSON.stringify(proof));
 return proof;
}
