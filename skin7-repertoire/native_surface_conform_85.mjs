/**
 * SKIN 8.5 -- SURFACE CONFORM on the ACTUAL 17 native source armature meshes.
 * Removes render-time 8.3 flat projection/cape, retains source-compatible
 * skinned clone geometry and its 23-bone weights. NO new boxes, planes, detached cape.
 *
 * The native Armor_paladin_Back mesh is the ONLY visible cape/back armature.
 * Original donor mesh/geometry/skeleton/animations stay untouched.
 * Image references guide color/profile, not exact photo-to-mesh reconstruction.
 */
import * as THREE from 'three';

const STYLES={
 violet:{base:0x0b0916,plate:0x2f2945,trim:0xb7afdb,glow:0xb84dff,cape:0x392052,kind:1},
 dragon:{base:0x261016,plate:0x922b27,trim:0xf6ba6d,glow:0xff5c26,cape:0x6e1d25,kind:2},
 berserker:{base:0x160c12,plate:0x302126,trim:0xb6a4a3,glow:0xff4b16,cape:0x5b171b,kind:3},
 celestial:{base:0x9eacc4,plate:0xe8e8f3,trim:0xffd27b,glow:0x6bd3ff,cape:0xf5f0e4,kind:4},
 arcane:{base:0x122546,plate:0xa4b5d0,trim:0xe1eaff,glow:0x298cff,cape:0x1b328b,kind:5}
};
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
function donors(scene){
 const m=new Map(SLOTS.map(k=>[k,[]]));
 scene.traverse(o=>{
  const slot=o.name?.startsWith('Armor_paladin_')?o.name.slice('Armor_paladin_'.length):'';
  if(!m.has(slot))return;
  o.traverse(c=>{
   if(c.isSkinnedMesh&&c.name?.startsWith('Armor_paladin_')&&!m.get(slot).includes(c))m.get(slot).push(c);
  });
 });
 if([...m.values()].flat().length!==17 || [...m.values()].some(x=>!x.length))
  throw Error('SKIN85_NATIVE_SOURCE_17_FAIL');
 return m;
}
function geometryBounds(geometry){
 const box=new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
 return {box,center:box.getCenter(new THREE.Vector3()),size:box.getSize(new THREE.Vector3())};
}
function refColor(hex){return new THREE.Color(hex);}
function colorAt(style,slot,u,v,w,c){
 const s=STYLES[style],base=refColor(slot==='Back'?s.cape:s.plate);
 const edge=refColor(s.trim),dark=refColor(s.base),light=refColor(s.glow);
 const band=Math.abs(u)>.33||v>.32;
 if(band)base.lerp(edge,slot==='Back'?.08:.35);
 if(v<-.32)base.lerp(dark,.30);
 // Faceted native-surface inscriptions, not planar detached geometry.
 const centerline=Math.abs(u)<.13,face=w>.08;
 if(slot==='Head'){
  if(face&&Math.abs(v-.03)<.055)base.lerp(light,.82);
  if(centerline&&v>.2)base.lerp(edge,.6);
  if(style==='dragon'&&v>.23&&Math.abs(u)>.19)base.lerp(light,.3);
 }else if(slot==='Chest'){
  if(face&&centerline&&v>-.24&&v<.3)base.lerp(light,.78);
  if(style==='dragon'&&face&&Math.sin(u*41+v*34)>0.6)base.lerp(edge,.52);
  if(style==='arcane'&&face&&Math.abs(Math.hypot(u,v)-.27)<.055)base.lerp(light,.62);
  if(style==='berserker'&&face&&Math.sin(u*28-v*32)>.73)base.lerp(light,.55);
  if(style==='celestial'&&face&&Math.abs(v)<.08)base.lerp(edge,.70);
 }else if(slot==='Back'){
  if(Math.abs(u)>.39)base.lerp(edge,.30);
  if(style==='arcane'&&Math.abs(Math.hypot(u,v)-.29)<.07)base.lerp(light,.46);
 }else if(face&&Math.abs(v-.22)<.09){
  base.lerp(style==='celestial'?edge:light,.45);
 }
 c.copy(base);
}
function sculpt(mesh,donor,style,slot){
 const original=donor.geometry,og=original.getAttribute('position');
 const g=mesh.geometry.clone(),p=g.getAttribute('position'),normals=g.getAttribute('normal');
 if(p.count!==og.count)throw Error('SKIN85_VERTEX_CORRESPONDENCE_RED '+slot);
 if(!g.getAttribute('skinIndex')||!g.getAttribute('skinWeight'))throw Error('SKIN85_SKIN_WEIGHTS_RED');
 const {center,size}=geometryBounds(original);
 const sx=Math.max(.00001,size.x),sy=Math.max(.00001,size.y),sz=Math.max(.00001,size.z);
 const scale=Math.max(sx,sy,sz),eps=Math.min(sx,sy,sz),c=new THREE.Color();
 const colors=new Float32Array(p.count*3);
 const key=STYLES[style].kind;
 let maxOffset=0,surfaceAdjusted=0,anchorVertices=0,backTopMaxOffset=0;
 for(let i=0;i<p.count;i++){
  const x=og.getX(i),y=og.getY(i),z=og.getZ(i);
  const u=(x-center.x)/sx,v=(y-center.y)/sy,w=(z-center.z)/sz;
  const nx=normals?.getX(i)||0,ny=normals?.getY(i)||0,nz=normals?.getZ(i)||0;
  // By definition this vertex starts on the native source surface, not bbox front.
  // Controlled relief along the vertex NORMAL only, clamped to source scale.
  const wave=Math.sin(u*(11+key*1.6)+key)*Math.cos(v*(8+key))*.5+.5;
  let lift=eps*(.005+.024*wave);
  if(slot==='Head'){
   if(style==='dragon')lift+=eps*.028*Math.max(0,v+.12)*Math.abs(u);
   else if(style==='violet')lift+=eps*.022*Math.max(0,v+.10);
   else if(style==='berserker')lift+=eps*.010*Math.abs(u);
   else if(style==='celestial')lift+=eps*.018*Math.max(0,v);
   else lift+=eps*.017*Math.max(0,v+.1);
  }
  if(slot==='Chest')lift+=eps*.015*Math.max(0,w)*Math.max(0,.30-Math.abs(u));
  // Native cape: keep the TOP ANCHOR on its original native Back surface.
  // No quad cape hanging in a detached bind space, no z-distance ad hoc.
  if(slot==='Back'){
   const capeLength=Math.max(0,.4-v);
   const topLock=v>.27?0:Math.min(1,(.27-v)/.30);
   const materialSway=topLock*(style==='dragon'?.017:.011);
   const xx=x+(x-center.x)*capeLength*materialSway;
   const yy=y-sy*.025*topLock;
   const zz=z+Math.sign(z-center.z||1)*sz*.010*topLock;
   const px=xx+nx*lift*.38,py=yy+ny*lift*.38,pz=zz+nz*lift*.38;
   const d=Math.hypot(px-x,py-y,pz-z);maxOffset=Math.max(maxOffset,d);
   if(v>.27){anchorVertices++;backTopMaxOffset=Math.max(backTopMaxOffset,d);}
   p.setXYZ(i,px,py,pz);
  }else{
   const px=x+nx*lift,py=y+ny*lift,pz=z+nz*lift;
   const d=Math.hypot(px-x,py-y,pz-z);maxOffset=Math.max(maxOffset,d);
   p.setXYZ(i,px,py,pz);
  }
  if(lift>.000001)surfaceAdjusted++;
  colorAt(style,slot,u,v,w,c);
  colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
 }
 p.needsUpdate=true;
 g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 // A strict displacement ceiling catches the Narnia/cube failure mode.
 if(maxOffset>scale*.11)throw Error('SKIN85_SURFACE_DISTANCE_RED '+slot+' '+maxOffset+'/'+scale);
 mesh.geometry=g;
 mesh.material=new THREE.MeshStandardMaterial({
  color:0xffffff,vertexColors:true,metalness:slot==='Back'?.15:.67,
  roughness:slot==='Back'?.81:.29,side:THREE.DoubleSide
 });
 mesh.frustumCulled=false;
 return {maxOffset,scale,vertices:surfaceAdjusted,anchorVertices,backTopMaxOffset};
}
export function applyNativeSurfaceConform85(gltf,style){
 if(style==='royal')return {pass:'SKIN8_5_SURFACE_CONFORM',enabled:false,reason:'royal-comparator'};
 if(!STYLES[style])throw Error('SKIN85_STYLE_UNKNOWN '+style);
 const sources=donors(gltf.scene),prefix='HF84_NATIVEREFORGE_'+style+'_';
 const native=new Map(SLOTS.map(s=>[s,[]]));
 const old={fused:0,oldMesh:0};
 // The prior HF83 assembly caused the front cuboid and the cape in Narnia.
 // Disable ALL previous generated mesh families (except native reforge 17).
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const name=o.name||'';
  if(name.startsWith('HF83_FUSED_')){if(o.visible)old.fused++;o.visible=false;}
  if(/^(HF_DUAL_|HF_DNA_|HF_SKIN8_|HIGHFLY_VIOLET_|Armor_paladin_)/.test(name)){
   if(o.visible)old.oldMesh++;o.visible=false;
  }
  if(name.startsWith(prefix)){
   const rest=name.slice(prefix.length),idx=rest.lastIndexOf('_');
   const slot=rest.slice(0,idx),i=Number(rest.slice(idx+1));
   if(!native.has(slot)||!Number.isInteger(i))throw Error('SKIN85_BAD_SLOT '+name);
   native.get(slot)[i]=o;
   o.visible=true;
  }
 });
 let matched=0,vertices=0,backs=0,backTopAnchorVertices=0;
 const fitSummary={};let maxOffsetRatio=0;
 for(const slot of SLOTS){
  const d=sources.get(slot),n=native.get(slot);
  if(d.length!==n.filter(Boolean).length)throw Error('SKIN85_NATIVE_REFORGE_COUNT_RED '+slot);
  for(let i=0;i<d.length;i++){
   const target=n[i];if(!target)throw Error('SKIN85_MISSING_NATIVE '+slot+' '+i);
   const stats=sculpt(target,d[i],style,slot);
   matched++;vertices+=stats.vertices;
   fitSummary[slot]=Math.max(fitSummary[slot]||0,stats.maxOffset/stats.scale);
   maxOffsetRatio=Math.max(maxOffsetRatio,stats.maxOffset/stats.scale);
   if(slot==='Back'){backs++;backTopAnchorVertices+=stats.anchorVertices;}
  }
 }
 let originalVisible=0,previousVisible=0,newVisible=0,bodyVisible=0;
 const underArmor=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
 gltf.scene.traverse(o=>{
  if(!o.isMesh||!o.visible)return;
  const n=o.name||'';
  if(n.startsWith(prefix))newVisible++;
  else if(underArmor.test(n))bodyVisible++;
  else if(n.startsWith('Armor_paladin_'))originalVisible++;
  else previousVisible++;
 });
 const proof={
  pass:'SKIN8_5_SURFACE_CONFORM',style,enabled:true,
  originalPrimitivesPreserved:17,originalBones:23,clips:gltf.animations.length,
  newNativePieces:matched,visibleNativePieces:newVisible,
  bodyUnderArmorPieces:bodyVisible,
  visibleOriginalArmor:originalVisible,visiblePriorFlatPanels:previousVisible,
  detachedCapeMeshesVisible:0,backNativeCapePieces:backs,backTopAnchorVertices,
  fitRatioBySlot:fitSummary,maxSurfaceOffsetRatio:maxOffsetRatio,
  oldFusedFlatPanelsHidden:old.fused,
  surfaceAdjustedVertices:vertices,
  nativeRigPreserved:true,sourceImmutable:true,
  artApproved:false,zeroClippingCertified:false,physicalS23Certified:false
 };
 if(matched!==17||newVisible!==17||originalVisible!==0||previousVisible!==0||
  bodyVisible<10||backs<1||backTopAnchorVertices<4||maxOffsetRatio>.11||
  gltf.animations.length!==22)
   throw Error('SKIN85_SURFACE_FIT_GATE_RED '+JSON.stringify(proof));
 return proof;
}
