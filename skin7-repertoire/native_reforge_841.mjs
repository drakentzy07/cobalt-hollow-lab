/**
 * HIGHFLY SKIN 8.4.1 — NATIVE FORGE, not a visual donor overlay.
 * Reforge all 17 original Paladin weighted shell primitives as NEW geometry:
 * clone each BufferGeometry, resculpt POSITION/NORMAL and vertex colors,
 * preserve original skinIndices, skinWeights, skeleton/bindMatrix and clips.
 * Originals stay hidden, unchanged, and only used as donors.
 * Source images guide colors/silhouettes; not a photo-to-mesh reconstruction.
 */
import * as THREE from 'three';
const slots=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const PALETTES={
 violet:{base:0x15111e,plate:0x2d2a3d,trim:0xc2c0cc,energy:0x9d29ff,side:0x342654},
 dragon:{base:0x221213,plate:0xa52b1d,trim:0xf7bd67,energy:0xff5510,side:0x6c231b},
 berserker:{base:0x100c11,plate:0x292023,trim:0xa38b7a,energy:0xfc470d,side:0x581a18},
 celestial:{base:0xa2b0c1,plate:0xe3e5ed,trim:0xffd887,energy:0x52bfff,side:0xbac6df},
 arcane:{base:0x1a2742,plate:0xa8b9d1,trim:0xe3e9ff,energy:0x168af0,side:0x253e88}
};
function groupSource(scene){
 const map=new Map(slots.map(slot=>[slot,[]]));
 scene.traverse(root=>{
  const s=root.name?.startsWith('Armor_paladin_')?root.name.slice('Armor_paladin_'.length):null;
  if(!map.has(s))return;
  root.traverse(m=>{
   if(m.isSkinnedMesh&&m.name?.startsWith('Armor_paladin_')&&!map.get(s).includes(m))map.get(s).push(m);
  });
 });
 if([...map.values()].flat().length!==17 || [...map.values()].some(v=>!v.length))
  throw Error('SKIN841_NATIVE_DONOR_TRUTH_RED');
 return map;
}
function motion(slot,style){
 const helmet=slot==='Head',arm=slot.startsWith('Arm'),leg=slot.startsWith('Leg'),foot=slot.startsWith('Foot');
 const variants={
  violet:{x:1.01,y:helmet?.94:1.04,z:1.01,bevel:.06},
  dragon:{x:helmet?.99:1.04,y:1.03,z:1.04,bevel:.085},
  berserker:{x:arm?1.15:1.01,y:helmet?.94:1.05,z:1.06,bevel:.06},
  celestial:{x:helmet?.97:1.02,y:1.04,z:.99,bevel:.035},
  arcane:{x:helmet?.98:1,y:helmet?1.06:1.02,z:.98,bevel:.04}
 }[style];
 const taper=helmet?.07:arm?.13:leg?.09:foot?.05:.08;
 return {...variants,taper};
}
function reforge(src,slot,style,colors){
 const original=src.geometry,pos0=original.getAttribute('position');
 if(!pos0||!original.getAttribute('skinIndex')||!original.getAttribute('skinWeight'))throw Error('SKIN841_SOURCE_WEIGHTS_MISSING');
 const g=original.clone(),p=g.getAttribute('position');
 const bounds=new THREE.Box3().setFromBufferAttribute(pos0),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 const sx=Math.max(size.x,.0001),sy=Math.max(size.y,.0001),sz=Math.max(size.z,.0001),fit=motion(slot,style),c=new THREE.Color();
 const col=new Float32Array(p.count*3),materialCol=new THREE.Color(colors.plate);
 const edge=new THREE.Color(colors.trim),base=new THREE.Color(colors.base),glow=new THREE.Color(colors.energy),side=new THREE.Color(colors.side);
 let verticesMoved=0,metalEdges=0,glowVertices=0;
 for(let i=0;i<p.count;i++){
  const x=pos0.getX(i),y=pos0.getY(i),z=pos0.getZ(i);
  const u=(x-center.x)/sx,v=(y-center.y)/sy,w=(z-center.z)/sz;
  // Sculpt by slope of native plates; support material shifts and deformation.
  const crown=slot==='Head'?Math.max(0,v+.1):0;
  const flare=Math.max(0,(v+.14))*(slot.startsWith('Arm')?.16:slot.startsWith('Leg')?.07:.03);
  const x1=center.x+(x-center.x)*(fit.x+flare+fit.taper*Math.max(0,-v))+
   (slot==='Head'?Math.sign(u)*sx*fit.bevel*Math.max(0,v):0);
  const y1=center.y+(y-center.y)*fit.y+
   (slot==='Head'&&style==='dragon'?crown*crown*sy*.025:0);
  const z1=center.z+(z-center.z)*(fit.z+Math.abs(u)*fit.bevel*2)+
   ((slot==='Chest')?Math.max(0,w)*sz*.035:0);
  if(Math.abs(x-x1)+Math.abs(y-y1)+Math.abs(z-z1)>1e-5)verticesMoved++;
  p.setXYZ(i,x1,y1,z1);
  // Color is baked into the NEW source-cloned geometry, not a painted overlay.
  c.copy(materialCol);
  const front=w>.16,centerline=Math.abs(u)<.115,edgeBand=Math.abs(u)>.32 || v>.34;
  if(v<-.39)c.lerp(base,.45);
  if(edgeBand){c.lerp(edge,.52);metalEdges++;}
  if(front&&centerline&&Math.abs(v)<.30){c.lerp(glow,.65);glowVertices++;}
  if(w<-.29)c.lerp(side,.50);
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
 }
 p.needsUpdate=true;
 g.setAttribute('color',new THREE.BufferAttribute(col,3));
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 return {geometry:g,verticesMoved,metalEdges,glowVertices,originalVertexCount:pos0.count};
}
export function forgeNativeReferenceShells841(gltf,style){
 if(style==='royal')return {pass:'SKIN8_4_1_NATIVE_REFORGE',enabled:false,artApproved:false};
 const colors=PALETTES[style];if(!colors)throw Error('SKIN841_STYLE_UNKNOWN');
 const source=groupSource(gltf.scene),seen=new Set();
 const material=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.68,roughness:.31,vertexColors:true,side:THREE.DoubleSide});
 let parts=0,weighted=0,changed=0,colorEdges=0,glowVertices=0,allInvisible=true;
 const morphSlots=[];
 for(const [slot,donors] of source){
  let index=0;
  for(const donor of donors){
   if(seen.has(donor))throw Error('SKIN841_DUPLICATE_DONOR');seen.add(donor);
   const {geometry,verticesMoved,metalEdges,glowVertices:glow}=reforge(donor,slot,style,colors);
   const newMesh=new THREE.SkinnedMesh(geometry,material);
   newMesh.name='HF84_NATIVEREFORGE_'+style+'_'+slot+'_'+index++;
   newMesh.bind(donor.skeleton,donor.bindMatrix.clone());
   newMesh.frustumCulled=false;
   donor.parent.add(newMesh);
   donor.visible=false;
   parts++;weighted+=newMesh.skeleton.bones.length===23?1:0;
   changed+=verticesMoved;colorEdges+=metalEdges;glowVertices+=glow;
  }
  morphSlots.push(slot);
 }
 gltf.scene.traverse(m=>{
  if(m.isMesh&&(/^(HF_DUAL_|HF_DNA_|HF_SKIN8_|HIGHFLY_VIOLET_|Armor_paladin_)/.test(m.name||''))&&m.visible)allInvisible=false;
 });
 const proof={pass:'SKIN8_4_1_NATIVE_REFORGE',enabled:true,style,
  sourceOriginalInvisible:allInvisible,sourceOriginalPrimitivesPreserved:17,
  resculptedNewMeshes:parts,weightedMeshes:weighted,originalBones:23,
  clips:gltf.animations.length,slotCoverage:morphSlots,
  verticesResculpted:changed,edgeColorVertices:colorEdges,emissiveColorVertices:glowVertices,
  exactReferenceReconstruction:false,sourceImmutable:true,artApproved:false,clippingFullyReviewed:false};
 if(!allInvisible||parts!==17||weighted!==17||morphSlots.length!==11||changed<500||
   proof.clips!==22)throw Error('SKIN841_NATIVE_REFORGE_GATE_RED '+JSON.stringify(proof));
 return proof;
}
