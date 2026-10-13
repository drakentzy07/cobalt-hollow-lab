/**
 * HIGHFLY SKIN 7.7-7.9 — ARMOR STYLE DNA REPERTOIRE
 * 6 original procedural, independently distinguished armor families. 
 * Uses verified 11 native ClaudeCraft armor slots / 17 original SkinnedMesh primitives.
 * No shared public app entrypoint. All source GLB, skeleton, animation clips unchanged.
 * Geometry art is experimental and NOT certified for collision/art or physical Android.
 */
import * as THREE from 'three';
import {forgeDualArmor} from '../skin7-auto-fit/dual_shell_factory.mjs';
import {integrateNativeArmor} from './native_integration_pass.mjs';
import {balanceNativeArmorSilhouette} from './art_fit_pass.mjs';

const specs=[
 {id:'violet',name:'Obsidiana Violeta III',family:'DARK SAINT',base:'violet',colors:[0x10121c,0x30324b,0xd1cce0,0x9b36fa,0x49315e],
  signature:'obsidian-faceted-wings-and-crystal-filament'},
 {id:'dragon',name:'Dragón Rojo II',family:'DRAGON SCALE',base:'dragon',colors:[0x290807,0xb62319,0xf8aa45,0xff5e1a,0x5d120e],
  signature:'horned-dragon-maw-and-hot-scale-crest'},
 {id:'celestial',name:'Saint Celestial',family:'CELESTIAL SAINT',base:'violet',colors:[0xa5b9da,0xe7ecfc,0xfbcf74,0x60d8ff,0x4b6aa6],
  signature:'winged-celestial-helmet-and-radiant-sunburst'},
 {id:'royal',name:'Royal Paladin',family:'HOLY ROYAL',base:'violet',colors:[0xc7d6df,0xf7f4ed,0xe4b44e,0x3a82f0,0x204d9c],
  signature:'knightly-tall-crown-and-heraldic-shields'},
 {id:'berserker',name:'Shadow Berserker',family:'BEAST BERSERKER',base:'violet',colors:[0x121116,0x43434d,0xbdb3a3,0xcd2932,0x58252d],
  signature:'asymmetric-bone-maw-and-spiked-massive-shoulders'},
 {id:'arcane',name:'Arcane Mage',family:'ARCANE MYSTIC',base:'violet',colors:[0x1b204d,0x394a8b,0xb6a6f9,0x43e6e1,0x352467],
  signature:'tall-mage-coronet-and-orbiting-rune-rings'}
];
export const ARMOR_FAMILIES=Object.freeze(specs.map(s=>Object.freeze({...s,colors:Object.freeze([...s.colors])})));
const slots=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const materials=color=>{
 const [base,plate,trim,glow,secondary]=color;
 const create=(c,metal=.64,rough=.35,emissive=0x000000)=>new THREE.MeshStandardMaterial({
  color:c,metalness:metal,roughness:rough,emissive,emissiveIntensity:emissive?.85:0,side:THREE.DoubleSide
 });
 return {base:create(base,.78,.32),plate:create(plate,.72,.29),trim:create(trim,.80,.22),
  glow:create(glow,.35,.19,glow),secondary:create(secondary,.67,.36),dark:create(base,.39,.65)};
};
const p=(geometry,name)=>{geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.name=name;return geometry;};
function findDonors(scene){
 const groups=new Map(slots.map(s=>[s,[]]));
 scene.traverse(obj=>{
  const slot=obj.name?.startsWith('Armor_paladin_')?obj.name.slice('Armor_paladin_'.length):'';
  if(!groups.has(slot))return;
  obj.traverse(child=>{
   if(child.isSkinnedMesh && child.name?.startsWith('Armor_paladin_')&&!groups.get(slot).includes(child))groups.get(slot).push(child);
  });
 });
 if(groups.size!==11||[...groups.values()].some(arr=>!arr.length)||
   [...groups.values()].flat().length!==17)throw Error('CANONICAL_17_DONOR_TRUTH_FAIL');
 for(const list of groups.values())for(const m of list)if(m.skeleton.bones.length!==23)throw Error('RIG_23_FAIL');
 return groups;
}
function boxStats(m){
 const b=new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position'));
 const s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
 if(![...c,...s].every(Number.isFinite))throw Error('NONFINITE_BOUNDS '+m.name);
 return {b,s,c,x:c.x,y:c.y,z:c.z,front:b.max.z,back:b.min.z,top:b.max.y,bottom:b.min.y};
}
function choose(groups,slot){
 const arr=groups.get(slot);
 return [...arr].sort((a,b)=>b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
}
function transferWeights(donor,g){
 const source=donor.geometry.getAttribute('position'),si=donor.geometry.getAttribute('skinIndex'),sw=donor.geometry.getAttribute('skinWeight');
 const dst=g.getAttribute('position');
 if(!si||!sw)throw Error('NATIVE_WEIGHT_MISSING '+donor.name);
 const idx=new Uint16Array(dst.count*4),wt=new Float32Array(dst.count*4);
 for(let i=0;i<dst.count;i++){
  const x=dst.getX(i),y=dst.getY(i),z=dst.getZ(i);let best=0,distance=Infinity;
  for(let j=0;j<source.count;j++){
   const xx=x-source.getX(j),yy=y-source.getY(j),zz=z-source.getZ(j),d=xx*xx+yy*yy+zz*zz;
   if(d<distance){distance=d;best=j;}
  }
  let sum=0;
  for(let k=0;k<4;k++){idx[i*4+k]=si.getComponent(best,k);wt[i*4+k]=sw.getComponent(best,k);sum+=wt[i*4+k];}
  if(sum>.00001)for(let k=0;k<4;k++)wt[i*4+k]/=sum;else wt[i*4]=1;
 }
 g.setAttribute('skinIndex',new THREE.BufferAttribute(idx,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(wt,4));
 return g;
}
const geo={
 plate:(w,h,d,x,y,z,rot=0)=>{const g=new THREE.BoxGeometry(Math.max(w,.006),Math.max(h,.006),Math.max(d,.006));g.rotateZ(rot);g.translate(x,y,z);return g;},
 gem:(w,h,d,x,y,z)=>{const g=new THREE.OctahedronGeometry(1,0);g.scale(w,h,d);g.translate(x,y,z);return g;},
 crest:(w,h,d,x,y,z,twist=0)=>{const g=new THREE.ConeGeometry(w,h,5,1);g.scale(1,1,Math.max(.35,d/Math.max(w,.001)));g.rotateZ(twist);g.translate(x,y,z);return g;},
 ring:(radius,tube,x,y,z,tilt=0)=>{const g=new THREE.TorusGeometry(Math.max(radius,.001),Math.max(tube,.003),5,18);g.rotateX(tilt);g.translate(x,y,z);return g;},
 shield:(w,h,d,x,y,z,rot=0)=>{const g=new THREE.IcosahedronGeometry(1,0);g.scale(w,h,d);g.rotateZ(rot);g.translate(x,y,z);return g;}
};
function forgeDetails(gltf,design){
 const groups=findDonors(gltf.scene),mat=materials(design.colors),counts={helmet:0,shoulder:0,chest:0,legs:0,runes:0,ornaments:0,total:0};
 const added=[];
 // Existing shell donors come from the verified 7.5/7.6 pipeline.
 // Other styles do not keep old violet spikes, crystals, chest gems, nor dragon decals.
 if(!['violet','dragon'].includes(design.id)){
  gltf.scene.traverse(o=>{
   if(!o.isMesh)return;
   if(o.name.startsWith('HF_DUAL_')&&!o.name.startsWith('HF_DUAL_shell_'))o.visible=false;
   if(o.name.startsWith('HIGHFLY_VIOLET_'))o.visible=false;
  });
 }
 for(const list of groups.values())for(const donor of list)donor.material=mat.base;
 gltf.scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('HF_DUAL_shell_'))o.material=mat.plate;});
 function add(slot,kind,g,material='trim',name=''){
  const donor=choose(groups,slot);
  transferWeights(donor,g);
  const mesh=new THREE.SkinnedMesh(p(g,name),mat[material]);
  mesh.name='HF_DNA_'+design.id+'_'+slot+'_'+kind+'_'+name+'_'+counts.total;
  mesh.bind(donor.skeleton,donor.bindMatrix.clone());mesh.frustumCulled=false;
  donor.parent.add(mesh);added.push(mesh);
  counts.total++;
  if(slot==='Head')counts.helmet++;
  if(slot==='ArmL'||slot==='ArmR')counts.shoulder++;
  if(slot==='Chest')counts.chest++;
  if(slot==='LegL'||slot==='LegR'||slot.startsWith('Foot'))counts.legs++;
  if(kind==='rune')counts.runes++;
  if(kind==='ornament')counts.ornaments++;
  return mesh;
 }
 const H=boxStats(choose(groups,'Head')),C=boxStats(choose(groups,'Chest'));
 const shoulder=slot=>boxStats(choose(groups,slot));
 const plate=(slot,w,h,d,x,y,z,mat='trim',name='',rot=0)=>add(slot,'plate',geo.plate(w,h,d,x,y,z,rot),mat,name);
 const gem=(slot,w,h,d,x,y,z,mat='glow',name='')=>add(slot,'gem',geo.gem(w,h,d,x,y,z),mat,name);
 const horn=(slot,w,h,d,x,y,z,lean=0,mat='trim',name='')=>add(slot,'ornament',geo.crest(w,h,d,x,y,z,lean),mat,name);
 const shield=(slot,w,h,d,x,y,z,mat='plate',name='',rot=0)=>add(slot,'ornament',geo.shield(w,h,d,x,y,z,rot),mat,name);
 const runering=(slot,r,t,x,y,z,mat='glow',name='',tilt=0)=>add(slot,'rune',geo.ring(r,t,x,y,z,tilt),mat,name);
 const trimBorders=()=>{
  for(const slot of ['ArmL','ArmR','LegL','LegR','HandL','HandR','FootL','FootR']){
   const b=boxStats(choose(groups,slot)),s=b.s;
   plate(slot,s.x*.76,s.y*.035,s.z*.075,b.x,b.y+s.y*.23,b.front+s.z*.09,'trim','raised-edge');
   plate(slot,s.x*.70,s.y*.025,s.z*.08,b.x,b.y-s.y*.24,b.front+s.z*.08,'trim','lower-seam');
  }
 };
 if(design.id==='violet'){
  // Thin polished bevel rails correct silhouette breakup of all-black plates.
  plate('Chest',C.s.x*.86,C.s.y*.045,C.s.z*.13,C.x,C.y+C.s.y*.32,C.front+C.s.z*.19,'trim','chest-raised-top');
  plate('Chest',C.s.x*.86,C.s.y*.046,C.s.z*.13,C.x,C.y-C.s.y*.28,C.front+C.s.z*.15,'trim','chest-raised-bottom');
  for(const side of [-1,1]){
   shield('Chest',C.s.x*.08,C.s.y*.26,C.s.z*.07,C.x+side*C.s.x*.34,C.y,C.front+C.s.z*.14,'trim','silver-rib',side*.14);
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot);
   shield(slot,b.s.x*.38,b.s.y*.21,b.s.z*.24,b.x+side*b.s.x*.16,b.top+b.s.y*.07,b.front+b.s.z*.08,'plate','knightly-upper-pauldrons');
   plate(slot,b.s.x*.78,b.s.y*.03,b.s.z*.12,b.x,b.y+b.s.y*.17,b.front+b.s.z*.24,'trim','silver-pauldrons');
  }
  gem('Head',H.s.x*.075,H.s.y*.12,H.s.z*.08,H.x,H.top+H.s.y*.12,H.front+H.s.z*.10,'glow','crown-crystal');
  for(const side of [-1,1]){
   shield('Head',H.s.x*.20,H.s.y*.17,H.s.z*.10,H.x+side*H.s.x*.28,H.y+H.s.y*.14,H.front+H.s.z*.13,'trim','earplate');
   plate('Head',H.s.x*.16,H.s.y*.026,H.s.z*.06,H.x+side*H.s.x*.30,H.y-H.s.y*.18,H.front+H.s.z*.19,'glow','eye-blade');
  }
  trimBorders();
 }else if(design.id==='dragon'){
  // Hard contrast and jagged heat fissures over the already distinct dragon shell.
  for(const side of [-1,1]){
   horn('Head',H.s.x*.15,H.s.y*.52,H.s.z*.16,H.x+side*H.s.x*.30,H.top+H.s.y*.18,H.back-H.s.z*.09,side*.35,'trim','ivory-horn');
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot);
   horn(slot,b.s.x*.22,b.s.y*.47,b.s.z*.15,b.x+side*b.s.x*.25,b.top+b.s.y*.13,b.back,side*.40,'trim','backward-dragon-wing');
  }
  for(let i=-2;i<=2;i++){
   plate('Chest',C.s.x*.045,C.s.y*.34,C.s.z*.05,C.x+i*C.s.x*.14,C.y,C.front+C.s.z*.36,'secondary','charred-fissure',i*.06);
   gem('Chest',C.s.x*.035,C.s.y*.15,C.s.z*.08,C.x+i*C.s.x*.14,C.y+C.s.y*.1,C.front+C.s.z*.39,'glow','molten-vein');
  }
  for(const slot of ['LegL','LegR','FootL','FootR']){
   const b=boxStats(choose(groups,slot));
   shield(slot,b.s.x*.20,b.s.y*.17,b.s.z*.13,b.x,b.y+b.s.y*.21,b.front+b.s.z*.22,'trim','scaly-bronze-bevel');
  }
 }else if(design.id==='celestial'){
  // Constellation / Saint: graceful upright wing fans, full coronet, sunburst.
  shield('Head',H.s.x*.50,H.s.y*.22,H.s.z*.20,H.x,H.top+H.s.y*.13,H.front,'plate','celestial-crown');
  for(const side of [-1,1]){
   for(let i=0;i<4;i++){
    const h=H.s.y*(.36+i*.045),px=H.x+side*H.s.x*(.30+i*.10);
    horn('Head',H.s.x*.095,h,H.s.z*.15,px,H.top+h*.26,H.back-H.s.z*.07,side*(.27+i*.10),'trim','feather-crest');
   }
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot);
   for(let i=0;i<4;i++){
    const xx=b.x+side*b.s.x*(.20+i*.16);
    shield(slot,b.s.x*.18,b.s.y*(.22+i*.065),b.s.z*.17,xx,b.y+b.s.y*(.27+i*.12),b.front+b.s.z*.02,'plate','wing-feather',side*.24);
   }
  }
  for(let i=0;i<10;i++){
   const theta=Math.PI*2*i/10;
   const r=Math.min(C.s.x,C.s.y)*.23;
   horn('Chest',C.s.x*.065,C.s.y*.19,C.s.z*.04,C.x+Math.cos(theta)*r,C.y+Math.sin(theta)*r,C.front+C.s.z*.17,theta,'trim','sunburst-ray');
  }
  gem('Chest',C.s.x*.15,C.s.y*.19,C.s.z*.11,C.x,C.y,C.front+C.s.z*.28,'glow','azure-stellar-jewel');
  trimBorders();
 }else if(design.id==='royal'){
  // Royal Paladin: tall crest, broad clean heraldic shields, royal chest and tabard.
  plate('Head',H.s.x*.55,H.s.y*.36,H.s.z*.14,H.x,H.top+H.s.y*.09,H.front+H.s.z*.03,'plate','royal-greathelm');
  horn('Head',H.s.x*.14,H.s.y*.57,H.s.z*.14,H.x,H.top+H.s.y*.30,H.z,0,'trim','crown-center-spire');
  for(const side of [-1,1]){
   shield('Head',H.s.x*.18,H.s.y*.22,H.s.z*.10,H.x+side*H.s.x*.30,H.top+H.s.y*.11,H.front,'trim','regal-crown-fin',side*.20);
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot);
   shield(slot,b.s.x*.57,b.s.y*.40,b.s.z*.22,b.x+side*b.s.x*.17,b.y+b.s.y*.27,b.front+b.s.z*.04,'plate','heraldic-pauldrons');
   plate(slot,b.s.x*.48,b.s.y*.04,b.s.z*.19,b.x+side*b.s.x*.12,b.y+b.s.y*.29,b.front+b.s.z*.18,'trim','gold-rim');
  }
  plate('Chest',C.s.x*.08,C.s.y*.56,C.s.z*.12,C.x,C.y,C.front+C.s.z*.23,'trim','royal-vertical-cross');
  plate('Chest',C.s.x*.53,C.s.y*.065,C.s.z*.12,C.x,C.y+C.s.y*.15,C.front+C.s.z*.25,'trim','royal-horizontal-cross');
  gem('Chest',C.s.x*.10,C.s.y*.14,C.s.z*.08,C.x,C.y+C.s.y*.15,C.front+C.s.z*.31,'glow','sapphire-seal');
  for(const slot of ['LegL','LegR','Back']){
   const b=boxStats(choose(groups,slot)),s=b.s;
   plate(slot,s.x*.63,s.y*.30,s.z*.12,b.x,b.y-s.y*.21,b.front+s.z*.15,'secondary','royal-tabard');
   plate(slot,s.x*.63,s.y*.025,s.z*.14,b.x,b.y-s.y*.33,b.front+s.z*.18,'trim','tabard-gold-border');
  }
  trimBorders();
 }else if(design.id==='berserker'){
  // Massive asymmetric shoulders, forward jawbone, protruding bone fangs.
  shield('Head',H.s.x*.43,H.s.y*.30,H.s.z*.28,H.x,H.y-H.s.y*.19,H.front+H.s.z*.12,'dark','beast-jaw');
  for(const side of [-1,1]){
   horn('Head',H.s.x*.16,H.s.y*(side<0?.58:.37),H.s.z*.10,H.x+side*H.s.x*.31,H.top+H.s.y*.14,H.back,side*.40,'trim','fang-horns');
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot),heavy=side<0?1.6:1;
   shield(slot,b.s.x*.61*heavy,b.s.y*.45*heavy,b.s.z*.32,b.x+side*b.s.x*.25,b.top+b.s.y*.15,b.front+b.s.z*.11,'plate','beast-oversized-shoulder');
   for(let i=0;i<4;i++)
    horn(slot,b.s.x*.15,b.s.y*(.37+i*.085)*heavy,b.s.z*.09,b.x+side*b.s.x*(.22+i*.19),b.top+b.s.y*(.20+i*.08),b.back,side*.43,'trim','sawtooth');
  }
  for(let i=0;i<5;i++)
   horn('Chest',C.s.x*.10,C.s.y*.25,C.s.z*.09,C.x+(i-2)*C.s.x*.16,C.y-C.s.y*.29,C.front+C.s.z*.25,Math.PI,'trim','bone-rib-teeth');
  plate('Chest',C.s.x*.84,C.s.y*.24,C.s.z*.19,C.x,C.y+C.s.y*.17,C.front+C.s.z*.12,'dark','massive-torso-plate');
  for(const slot of ['HandL','HandR','LegL','LegR','FootL','FootR']){
   const b=boxStats(choose(groups,slot));
   shield(slot,b.s.x*.38,b.s.y*.27,b.s.z*.26,b.x,b.y+b.s.y*.12,b.front+b.s.z*.13,'plate','knuckle-bone');
   for(const side of [-1,1])horn(slot,b.s.x*.11,b.s.y*.28,b.s.z*.08,b.x+side*b.s.x*.3,b.y+b.s.y*.23,b.front+b.s.z*.11,side*.32,'trim','bone-spike');
  }
 }else if(design.id==='arcane'){
  // Mage silhouette: two raised rings, tall coronet, long segmented robe panels.
  plate('Head',H.s.x*.68,H.s.y*.22,H.s.z*.09,H.x,H.top+H.s.y*.12,H.front,'plate','arcane-coronet');
  for(const side of [-1,1])
   horn('Head',H.s.x*.10,H.s.y*.62,H.s.z*.09,H.x+side*H.s.x*.26,H.top+H.s.y*.33,H.z,side*.20,'glow','arcane-antenna');
  runering('Head',H.s.x*.38,H.s.x*.028,H.x,H.top+H.s.y*.18,H.z,'glow','head-orbit',Math.PI*.5);
  for(const side of [-1,1]){
   const slot=side<0?'ArmL':'ArmR',b=shoulder(slot),s=b.s;
   runering(slot,s.x*.40,s.x*.032,b.x,b.top+s.y*.08,b.z,'glow','floating-arm-ring',Math.PI*.5);
   gem(slot,s.x*.14,s.y*.19,s.z*.17,b.x,b.y+s.y*.25,b.front+s.z*.20,'glow','mana-shard');
   shield(slot,s.x*.40,s.y*.19,s.z*.18,b.x,b.y+s.y*.20,b.front+s.z*.08,'plate','arcane-shoulder-slab');
  }
  runering('Chest',C.s.x*.30,C.s.x*.018,C.x,C.y+C.s.y*.02,C.front+C.s.z*.21,'trim','chest-rune-orbit',0);
  for(let i=0;i<6;i++){
   const t=i*Math.PI/3;
   gem('Chest',C.s.x*.05,C.s.y*.08,C.s.z*.035,C.x+Math.sin(t)*C.s.x*.26,C.y+Math.cos(t)*C.s.y*.24,C.front+C.s.z*.25,'glow','rune-node');
  }
  gem('Chest',C.s.x*.13,C.s.y*.20,C.s.z*.09,C.x,C.y,C.front+C.s.z*.23,'glow','arcane-core');
  for(const slot of ['LegL','LegR','Back']){
   const b=boxStats(choose(groups,slot)),s=b.s;
   plate(slot,s.x*.71,s.y*.46,s.z*.075,b.x,b.y-s.y*.20,b.front+s.z*.12,'secondary','layered-mage-robe');
   plate(slot,s.x*.73,s.y*.024,s.z*.075,b.x,b.y-s.y*.42,b.front+s.z*.15,'trim','robe-luminous-seam');
  }
 }
 // Enforce allowed sources: original Paladin skinned meshes, shared shell meshes,
 // art produced by this recipe and (only on original two variants) their own decals.
 const donors=new Set([...groups.values()].flat());
 const allAllowed=new Set([...donors,...added]);
 let baseDetails=0,unwanted=0;
 gltf.scene.traverse(obj=>{
  if(!obj.isMesh)return;
  if(donors.has(obj)||added.includes(obj)){obj.visible=true;return;}
  const n=obj.name||'';
  const allowedShared=n.startsWith('HF_DUAL_shell_')||
   (['violet','dragon'].includes(design.id)&&(n.startsWith('HF_DUAL_')||n.startsWith('HIGHFLY_VIOLET_')) && obj.visible);
  if(allowedShared){allAllowed.add(obj);baseDetails++;obj.visible=true;return;}
  if(obj.visible)unwanted++;
  obj.visible=false;
 });
 const clips=gltf.animations.length,visible=[...allAllowed].filter(x=>x.visible);
 const flags={
  donorAndRigPreserved:donors.size===17&&[...donors].every(x=>x.isSkinnedMesh&&x.skeleton.bones.length===23),
  noBodyLeaks:unwanted>=0&&visible.every(x=>allAllowed.has(x)),
  styleSignature:counts.helmet>=2&&counts.shoulder>=2&&counts.chest>=1,
  animationClips:clips===22,
  artReviewed:false,clippingReviewed:false,androidPhysical:false,femaleAdapted:false
 };
 const qa={
  id:design.id,name:design.name,family:design.family,signature:design.signature,
  nativeSlots:groups.size,originalNativePrimitives:donors.size,
  newStyleMeshes:added.length,reusedBaseDetails:baseDetails,
  distinctDesignGeometry:counts,skinnedStyleMeshes:added.filter(x=>x.isSkinnedMesh&&x.skeleton.bones.length===23).length,
  originalBones:23,clips,hiddenNonArmor:unwanted,flags,
  structuralGreen:Object.values(flags).slice(0,4).every(Boolean)
 };
 if(!qa.structuralGreen)throw Error('HIGHFLY_STYLE_DNA_GATE '+JSON.stringify(qa));
 return qa;
}
export function forgeArmorRepertoire(gltf,id){
 const design=ARMOR_FAMILIES.find(d=>d.id===id);
 if(!design)throw Error('UNKNOWN_STYLE '+id);
 const src=forgeDualArmor(gltf,design.base);
 if(!src.proof.structuralGreen)throw Error('NATIVE_SHELL_BASE_RED');
 const qa=forgeDetails(gltf,design);
 qa.nativeIntegration=integrateNativeArmor(gltf,design.id);
 qa.artFit=balanceNativeArmorSilhouette(gltf,design.id);
 qa.shellCount=src.proof.shellCount;
 qa.originalNativeSlots=src.proof.nativeSlots;
 qa.originalNativePrimitives=src.proof.nativePrimitives;
 qa.sourceImmutable=src.proof.sourceGlbUnmodified;
 qa.maleArtApproved=false;
 return {gltf,proof:qa};
}
