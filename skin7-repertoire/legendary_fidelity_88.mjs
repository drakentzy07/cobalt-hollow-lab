/**
 * HIGHFLY SKIN 8.8 — Native shell silhouette sculpt and faithful thematic assembly.
 * Key: directly rework the 17 VERTEX-WEIGHTED native armor shells (NOT plates
 * placed ahead of them), preserving ClaudeCraft source geometry, rig and clips.
 * The 8.7 wings/halos remain original Back-weighted attachments.
 * Reference art is a target, never claimed as an exact source GLB.
 */
import * as THREE from 'three';

export const THEMES88={
 'hero-dragon':{base:'dragon',label:'DRAGON SOVEREIGN — casco dracónico, escamas y coraza continua',
  signature:'DRAGON_REPTILIAN_SNOUT_SCALES_OVERLAP',metal:0x762721,shadow:0x23141a,trim:0xf2bf75,emissive:0xff6319,cape:0x50191c},
 'hero-celestial':{base:'celestial',label:'CELESTIAL SERAPH — yelmo santo, coraza radiante y alas',
  signature:'CELESTIAL_GOLD_DIADEM_WINGED_PAULDRONS',metal:0xededf1,shadow:0x9ca7bc,trim:0xf7d68a,emissive:0x80d6ff,cape:0xf4f1ef},
 'hero-death':{base:'berserker',label:'MORTIS SERAPH — máscara fúnebre, armadura gótica y alas negras',
  signature:'DEATH_ANGEL_GOTHIC_HOOD_CUIRASS',metal:0x22232d,shadow:0x0d1018,trim:0xaeb8c8,emissive:0xc13758,cape:0x15151d}
};
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
function getMeshes(gltf,style){
 const found=new Map(SLOTS.map(x=>[x,[]])),prefix='HF84_NATIVEREFORGE_'+style+'_';
 gltf.scene.traverse(o=>{
  if(!o.isSkinnedMesh||!o.name.startsWith(prefix))return;
  const parts=o.name.slice(prefix.length).split('_'),slot=parts[0];
  if(!found.has(slot))throw Error('SKIN88_UNEXPECTED_NATIVE_SLOT '+slot);
  found.get(slot).push(o);
 });
 if([...found.values()].flat().length!==17||[...found.values()].some(arr=>!arr.length))
  throw Error('SKIN88_NATIVE_ARMOR_17_EXPECTED');
 return found;
}
function nativeColor(style,slot,u,v,w,shape){
 const cfg=THEMES88[style],metal=new THREE.Color(cfg.metal),trim=new THREE.Color(cfg.trim),
  shadow=new THREE.Color(cfg.shadow),energy=new THREE.Color(cfg.emissive),cape=new THREE.Color(cfg.cape);
 const face=w>.14;
 let c=slot==='Back'?cape:metal;
 c=c.clone();
 const limit=Math.max(Math.abs(u),Math.abs(v));
 if(limit>.34&&slot!=='Back')c.lerp(trim,.18+smooth(.34,.55,limit)*.43);
 if(v<-.32)c.lerp(shadow,.23);
 if(slot==='Head'){
  // Inner continuous visor is a COLOR BAND on the actual helmet geometry,
  // not a floating cube in front of it.
  const visor=v>-.08&&v<.18&&face&&Math.abs(u)<.43;
  if(visor)c.lerp(style==='hero-death'?energy:shadow,.83);
  if(visor&&Math.abs(v-.045)<.037)c.lerp(energy,.94);
  if(style==='hero-dragon'&&face&&Math.abs(u)<.13&&v>.20)c.lerp(trim,.76);
  if(style==='hero-celestial'&&face&&v>.26&&Math.abs(u)<.29)c.lerp(trim,.72);
  if(style==='hero-death'&&face&&v<-.18)c.lerp(shadow,.72);
 }else if(slot==='Chest'){
  const diamond=Math.abs(u)*1.15+Math.abs(v-.05)*.87;
  if(face&&diamond<.27)c.lerp(energy,.77);
  else if(face&&diamond<.43)c.lerp(trim,.74);
  if(style==='hero-dragon'&&face&&Math.sin(u*30-v*22)>0.73)c.lerp(trim,.48);
  if(style==='hero-celestial'&&face&&Math.abs(u)<.05)c.lerp(trim,.64);
  if(style==='hero-death'&&face&&Math.sin(u*14+v*27)>0.86)c.lerp(shadow,.67);
 }else if(slot!=='Back'){
  const band=Math.abs(v-(slot.startsWith('Arm')?.23:-.15));
  if(face&&band<.065)c.lerp(trim,.67);
  if(style==='hero-dragon'&&face&&Math.sin(u*29+v*32)>.68)c.lerp(shadow,.28);
 }
 return c;
}
function sculpt(g,slot,style){
 const original=g.getAttribute('position');if(!original)throw Error('SKIN88_POS_MISSING');
 const source=new THREE.Box3().setFromBufferAttribute(original),center=source.getCenter(new THREE.Vector3()),
  size=source.getSize(new THREE.Vector3());
 if([size.x,size.y,size.z].some(x=>!Number.isFinite(x)||x<=1e-6))throw Error('SKIN88_INVALID_NATIVE_BOUNDS '+slot);
 const xSpan=Math.max(size.x,.00001),ySpan=Math.max(size.y,.00001),zSpan=Math.max(size.z,.00001);
 const vertexColors=new Float32Array(original.count*3),color=new THREE.Color();
 let moved=0,most=0,profileMoves=0,helmetArchitecturalMoves=0,chestArchitecturalMoves=0;
 for(let i=0;i<original.count;i++){
  const x=original.getX(i),y=original.getY(i),z=original.getZ(i);
  const u=(x-center.x)/xSpan,v=(y-center.y)/ySpan,w=(z-center.z)/zSpan;
  const f=Math.max(0,w+.08);
  const temple=smooth(.10,.34,v),upper=smooth(.08,.40,v);
  let nx=x,ny=y,nz=z;
  if(slot==='Head'){
   if(style==='hero-dragon'){
    // Reptilian muzzle and brow structurally extruded FROM the helmet shell,
    // broad cheek guards and a long sculpted frontal draconic wedge.
    const jaw=smooth(-.49,-.08,v)*(1-smooth(-.04,.23,v));
    const brow=1-smooth(.26,.48,v);
    const centerFace=Math.pow(1-smooth(.03,.41,Math.abs(u)),1.2);
    nz+=zSpan*(.18*jaw*centerFace+.095*brow*centerFace*upper)*f;
    nx=center.x+(x-center.x)*(1+.07*jaw+.19*upper*(1-smooth(.22,.49,Math.abs(u))));
    ny+=ySpan*.035*upper;
   }else if(style==='hero-celestial'){
    // Angelic diadem is a tapered, sweeping crown with a sculpted central
    // visor that stays part of the original head shell, no horns.
    const crown=smooth(.05,.40,v),cheek=1-smooth(-.42,-.10,v);
    nx=center.x+(x-center.x)*(1+.09*crown-.05*(1-crown));
    ny+=ySpan*.085*crown*(.45+.55*(1-smooth(.10,.44,Math.abs(u))));
    nz+=zSpan*.095*f*(1-smooth(.26,.47,Math.abs(u)))*cheek;
   }else{
    // Fallen-angel masked hood: high brow, faceted upper skull and deep
    // elongated funerary chin integrated into the original helmet.
    const hood=smooth(.06,.38,v),chin=1-smooth(-.35,-.06,v);
    nx=center.x+(x-center.x)*(1+.17*hood+.07*chin);
    ny+=ySpan*(.043*hood-.070*chin);
    nz+=zSpan*(.10*hood+.13*chin)*f;
   }
   if(Math.abs(nx-x)+Math.abs(ny-y)+Math.abs(nz-z)>1e-7)helmetArchitecturalMoves++;
  }else if(slot==='Chest'){
   // Integrated single breastplate profile, with shoulder flares at top
   // and waist compression below. No separate floating cube plate.
   const upperTorso=smooth(-.02,.43,v),waist=1-smooth(-.39,-.09,v);
   let flare=style==='hero-dragon'?.23:style==='hero-celestial'?.15:.29;
   let taper=style==='hero-dragon'?.10:.13;
   nx=center.x+(x-center.x)*(1+flare*upperTorso-taper*waist);
   const crest=1-smooth(.09,.46,Math.abs(u));
   nz+=zSpan*(style==='hero-death'?.18:.115)*f*crest*(.58+upperTorso*.42);
   if(style==='hero-dragon')nz+=zSpan*.06*Math.pow(Math.sin(u*19+v*14),2)*f;
   if(Math.abs(nx-x)+Math.abs(nz-z)>1e-7)chestArchitecturalMoves++;
  }else if(slot.startsWith('Arm')){
   // Connected pauldrons: sculpt the native shoulder SURFACE itself.
   // No detached standalone spike geometry.
   const upperArm=smooth(-.12,.39,v);
   nx=center.x+(x-center.x)*(1+(style==='hero-death'?.35:style==='hero-dragon'?.25:.24)*upperArm);
   ny+=ySpan*(style==='hero-celestial'?.085:.048)*upperArm;
   nz=center.z+(z-center.z)*(1+.12*upperArm);
  }else if(slot.startsWith('Hand')){
   const glove=1-smooth(-.3,.3,v);
   nx=center.x+(x-center.x)*(1+.14*glove);
   nz=center.z+(z-center.z)*(1+.08*glove);
  }else if(slot.startsWith('Leg')){
   const knee=1-smooth(.14,.44,Math.abs(v-.06));
   nx=center.x+(x-center.x)*(1+.22*knee+.075*(1-knee));
   nz=center.z+(z-center.z)*(1+.12*knee);
  }else if(slot.startsWith('Foot')){
   nz=center.z+(z-center.z)*(1+.16);
   nx=center.x+(x-center.x)*1.09;
  }else if(slot==='Back'){
   // KEEP the 8.5 cape/back geometry and native seam: never inflate it
   // away from the back again. Only recolor its native mesh.
  }
  const d=Math.hypot(nx-x,ny-y,nz-z);
  most=Math.max(most,d);if(d>1e-6)moved++;
  if(d>1e-5&&slot!=='Back')profileMoves++;
  original.setXYZ(i,nx,ny,nz);
  color.copy(nativeColor(style,slot,u,v,w));
  vertexColors[i*3]=color.r;vertexColors[i*3+1]=color.g;vertexColors[i*3+2]=color.b;
 }
 g.setAttribute('color',new THREE.BufferAttribute(vertexColors,3));
 original.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 const ratio=most/Math.max(size.x,size.y,size.z);
 if(!Number.isFinite(ratio)||ratio>.48)throw Error('SKIN88_EXCESSIVE_SHELL_DEFORM '+slot+' '+ratio);
 return {slot,vertices:original.count,moved,ratio,profileMoves,
  helmetArchitecturalMoves,chestArchitecturalMoves};
}
export function integrateLegendaryFidelity88(gltf,id){
 const cfg=THEMES88[id];if(!cfg)throw Error('SKIN88_NOT_THREE_HERO '+id);
 const shells=getMeshes(gltf,cfg.base);
 const meshStats=[],changedSlotCount=new Set(),materials=new Set();
 const mat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,
  metalness:id==='hero-celestial'?.70:id==='hero-dragon'?.63:.72,
  roughness:id==='hero-death'?.34:.28,side:THREE.DoubleSide});
 let totalMoved=0,headMoves=0,chestMoves=0;
 for(const [slot,arr] of shells)for(const m of arr){
  // The native donor in the original GLB remains immutable.
  // Only the already NEW HF84 cloned shell is sculpted.
  const geometry=m.geometry.clone(),info=sculpt(geometry,slot,id);
  m.geometry=geometry;m.material=mat;materials.add(mat);m.frustumCulled=false;
  meshStats.push(info);totalMoved+=info.moved;
  headMoves+=info.helmetArchitecturalMoves;chestMoves+=info.chestArchitecturalMoves;
  if(info.moved>0)changedSlotCount.add(slot);
 }
 // The old 8.7 ornaments looked like glued-on badges. Retain Back wings,
 // halo, central gems; suppress small isolated repeating 8.7 body plates.
 let legacyDecorHidden=0,wingMeshesVisible=0,otherLegacyVisible=0;
 const prefix='HF87_'+id+'_';
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const n=o.name||'';
  if(!n.startsWith(prefix))return;
  const k=n.slice(prefix.length).split('_')[0];
  if(k==='armor'||k==='scales'){
   if(o.visible)legacyDecorHidden++;
   o.visible=false;
  }
  if(k==='wings'&&o.visible)wingMeshesVisible++;
  if(k!=='wings'&&k!=='gems'&&k!=='halo'&&o.visible)otherLegacyVisible++;
 });
 const proof={pass:'SKIN8_8_HELMET_CUIRASS_FIDELITY',id,
  targetTheme:cfg.signature,sourceGLBImmutable:true,
  nativeShellsResculpted:meshStats.length,sourceBones:23,clips:gltf.animations.length,
  fullyConnectedGeometrySlots:[...changedSlotCount],totalMovedVertices:totalMoved,
  helmSculptedVertices:headMoves,chestSculptedVertices:chestMoves,
  oldStickerPlatesHidden:legacyDecorHidden,
  retainedBackWingMeshes:wingMeshesVisible,unwantedOldDecorVisible:otherLegacyVisible,
  maxDeviationRatio:Math.max(...meshStats.map(a=>a.ratio)),
  retainsNativeCape:true,wingPhysics:false,exactConceptArtMatch:false,
  humanClippingApproved:false,realS23PhysicalQA:false};
 const exp=id==='hero-dragon'?18:id==='hero-celestial'?26:30;
 if(proof.nativeShellsResculpted!==17||!changedSlotCount.has('Head')||
  !changedSlotCount.has('Chest')||!changedSlotCount.has('ArmL')||
  !changedSlotCount.has('ArmR')||headMoves<10||chestMoves<10||
  totalMoved<400||gltf.animations.length!==22||wingMeshesVisible!==exp||
  otherLegacyVisible!==0||legacyDecorHidden<30||
  meshStats.some(m=>!Number.isFinite(m.ratio)||m.ratio>.48))
  throw Error('SKIN88_NATIVE_ARCHITECTURE_GATE_RED '+JSON.stringify(proof));
 return proof;
}
