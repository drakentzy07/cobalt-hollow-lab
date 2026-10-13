/**
 * HIGHFLY SKIN 8.3 — FIVE REFERENCE ARMOR FUSION (experimental 3D authoring).
 * The user-supplied four-view artworks guide palette / silhouette, NOT exact meshes.
 * Reuse the 11 canonical Paladin slots and the same Rig_Medium (23 bones / 22 clips).
 * One SKINNED, material-grouped geometry assembly per original armor slot,
 * rather than disconnected individual ornament SkinnedMeshes.
 * Existing original GLB and animations remain byte-for-byte unchanged.
 */
import * as THREE from 'three';

export const REFERENCE_83=Object.freeze({
 violet:{name:'Obsidiana Violeta · Referencia',plate:0x15151f,dark:0x080a13,trim:0xb8b9d4,light:0x9738f9,accent:0x433063,cape:0x371b5d,mode:'dark-saint'},
 berserker:{name:'Infernal Cataclismo · Referencia',plate:0x232025,dark:0x151011,trim:0x8d756c,light:0xff4915,accent:0x942e22,cape:0x55171b,mode:'infernal'},
 dragon:{name:'Dragón Rojo Escamado · Referencia',plate:0x702020,dark:0x211015,trim:0xffc36c,light:0xff5714,accent:0xb43a28,cape:0x781d1b,mode:'dragon'},
 celestial:{name:'Saint Celestial · Referencia',plate:0xe9eaf0,dark:0x7b839d,trim:0xf3be5e,light:0x64caff,accent:0xb7c9e3,cape:0xfff7ed,mode:'celestial'},
 arcane:{name:'Arcane Astral · Referencia',plate:0xb5bbc9,dark:0x1b2746,trim:0xe4e7ff,light:0x168aff,accent:0x305fc0,cape:0x172b87,mode:'astral'}
});
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
function collectDonors(scene){
 const m=new Map(SLOTS.map(s=>[s,[]]));
 scene.traverse(o=>{
  const slot=o.name?.startsWith('Armor_paladin_')?o.name.slice('Armor_paladin_'.length):null;
  if(!m.has(slot))return;
  o.traverse(c=>{
   if(c.isSkinnedMesh&&c.name?.startsWith('Armor_paladin_')&&!m.get(slot).includes(c))m.get(slot).push(c);
  });
 });
 if([...m.values()].some(a=>!a.length)||[...m.values()].flat().length!==17)throw Error('SKIN83_NATIVE_17_TRUTH_RED');
 return new Map([...m].map(([slot,a])=>[slot,a.sort((u,v)=>v.geometry.attributes.position.count-u.geometry.attributes.position.count)[0]]));
}
function stats(mesh){
 const b=new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute('position'));
 return {b,c:b.getCenter(new THREE.Vector3()),s:b.getSize(new THREE.Vector3()),front:b.max.z,back:b.min.z};
}
function mat(c,met=.7,rough=.32,em=0){
 return new THREE.MeshStandardMaterial({color:c,metalness:met,roughness:rough,emissive:em||0,emissiveIntensity:em?.68:0,side:THREE.DoubleSide});
}
function materials(r){
 return [mat(r.plate),mat(r.dark,.4,.5),mat(r.trim,.81,.28),
  mat(r.light,.36,.23,r.light),mat(r.accent,.68,.32),mat(r.cape,.18,.79)];
}
function armorPolygon(poly,w,h,x,y,z,depth){
 const s=new THREE.Shape();poly.forEach(([u,v],i)=>i?s.lineTo(u*w*.5,v*h*.5):s.moveTo(u*w*.5,v*h*.5));s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.007,depth),steps:1,bevelEnabled:true,
  bevelSegments:1,bevelThickness:Math.max(.002,depth*.12),bevelSize:Math.max(.002,Math.min(w,h)*.023),curveSegments:1});
 g.translate(x,y,z-depth*.3);return g;
}
const shield=[[-.92,.64],[-.50,1],[.50,1],[.92,.64],[.83,-.38],[0,-1],[-.83,-.38]];
const facet=[[-.9,.48],[-.42,1],[.42,1],[.9,.48],[.72,-.54],[0,-1],[-.72,-.54]];
const chevron=[[-1,.65],[-.55,1],[0,.18],[.55,1],[1,.65],[0,-1]];
const blade=[[-.46,1],[.46,1],[.70,.30],[0,-1],[-.70,.30]];
const fang=[[-.45,.9],[.45,.9],[.62,-.4],[0,-1],[-.62,-.4]];
function jewel(w,h,d,x,y,z){
 const g=new THREE.OctahedronGeometry(1,0);g.scale(w,h,d);g.translate(x,y,z);return g;
}
function ring(rad,tube,x,y,z){
 const g=new THREE.TorusGeometry(Math.max(.01,rad),Math.max(.002,tube),5,16);
 g.translate(x,y,z);return g;
}
function shortHorn(x,y,z,w,h,dir,curve=.28){
 // Continuous curved bone-blade, not a floating cone or a mushroom-like snout.
 const p=[[-w*.75,-h*.14],[0,0],[dir*curve*w,h*.43],[dir*.65*w,h]];
 return armorPolygon([[-.6,-.7],[.32,-.6],[.62,.18],[.35,.78],[0,1],[-.18,.45],[-.6,-.15]],
  w,h,x+dir*w*.23,y+h*.48,z,w*.28);
}
function mergePieces(pieces){
 let vertices=0;
 for(const item of pieces){const g=item.g.index?item.g.toNonIndexed():item.g;
  item.geo=g;vertices+=g.getAttribute('position').count;
 }
 const p=new Float32Array(vertices*3),n=new Float32Array(vertices*3);
 const result=new THREE.BufferGeometry();let offset=0;
 for(const item of pieces){
  const pg=item.geo.getAttribute('position'),ng=item.geo.getAttribute('normal');
  if(!ng)item.geo.computeVertexNormals();
  const normals=item.geo.getAttribute('normal');
  for(let i=0;i<pg.count;i++){
   const j=(offset+i)*3;
   p[j]=pg.getX(i);p[j+1]=pg.getY(i);p[j+2]=pg.getZ(i);
   n[j]=normals.getX(i);n[j+1]=normals.getY(i);n[j+2]=normals.getZ(i);
  }
  result.addGroup(offset,pg.count,item.m);offset+=pg.count;
  if(item.geo!==item.g)item.geo.dispose();item.g.dispose();
 }
 result.setAttribute('position',new THREE.BufferAttribute(p,3));
 result.setAttribute('normal',new THREE.BufferAttribute(n,3));
 result.computeBoundingSphere();return result;
}
function projectWeights(source,g){
 const sp=source.geometry.getAttribute('position'),si=source.geometry.getAttribute('skinIndex'),sw=source.geometry.getAttribute('skinWeight');
 if(!si||!sw)throw Error('SKIN83_NATIVE_WEIGHTS_MISSING');
 const p=g.getAttribute('position'),inds=new Uint16Array(p.count*4),wts=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let nearest=0,min=Infinity;
  for(let j=0;j<sp.count;j++){
   const dx=x-sp.getX(j),dy=y-sp.getY(j),dz=z-sp.getZ(j),d=dx*dx+dy*dy+dz*dz;
   if(d<min){min=d;nearest=j;}
  }
  let sum=0;
  for(let k=0;k<4;k++){inds[i*4+k]=si.getComponent(nearest,k);wts[i*4+k]=sw.getComponent(nearest,k);sum+=wts[i*4+k];}
  if(sum<=1e-8){inds[i*4]=0;wts[i*4]=1;}else for(let k=0;k<4;k++)wts[i*4+k]/=sum;
 }
 g.setAttribute('skinIndex',new THREE.BufferAttribute(inds,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(wts,4));
}
export function fuseReferenceArmors83(gltf,style){
 if(style==='royal')return {pass:'SKIN8_3_REFERENCE_FUSION',enabled:false,reason:'royal-legacy-held-for-review',artApproved:false};
 const ref=REFERENCE_83[style];if(!ref)throw Error('SKIN83_UNKNOWN_REFERENCE '+style);
 const hosts=collectDonors(gltf.scene),data=new Map([...hosts].map(([s,m])=>[s,stats(m)]));
 const C=data.get('Chest'),H=data.get('Head'),B=data.get('Back'),copies=[];
 let oldHidden=0,shellCount=0,donorHidden=0,underArmorRetained=0;
 const skins=materials(ref);
 // TRUE REPLACEMENT. Keep native bones and underlying articulated gambeson,
 // but NO donor armor or previous HF_DUAL / HF_SKIN8 / HF_DNA mesh may render.
 const underArmor=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const name=o.name||'';
  if(name.startsWith('HF_DUAL_shell_'))shellCount++;
  if(name.startsWith('Armor_paladin_'))donorHidden++;
  if(underArmor.test(name)){o.visible=true;underArmorRetained++;}
  else{if(o.visible)oldHidden++;o.visible=false;}
 });
 const batches=new Map(SLOTS.map(s=>[s,[]]));
 const push=(slot,g,m=0)=>{batches.get(slot).push({g,m});};
 function panel(slot,poly,w,h,x,y,z,d,m=0){
  push(slot,armorPolygon(poly,Math.max(w,.02),Math.max(h,.02),x,y,z,Math.max(d,.008)),m);
 }
 function gem(slot,w,h,d,x,y,z){push(slot,jewel(w,h,d,x,y,z),3);}
 function trim(slot,w,h,x,y,z){panel(slot,chevron,w,h,x,y,z,Math.max(.009,data.get(slot).s.z*.095),2);}
 const t=C.s,fx=C.front+t.z*.06,hy=H.s.y;
 // Continuous NEW 3D envelopes replace the old 17 shells. Each receives
 // the original bone weights via the per-slot SkinMesh composer below.
 let closedEnvelopes=0;
 function envelope(slot,wx,yy,dd,yoff=0,zoff=0,material=0,faceted=false){
  const {s,c}=data.get(slot),g=faceted?new THREE.IcosahedronGeometry(1,2):new THREE.SphereGeometry(1,20,14);
  g.scale(Math.max(.017,s.x*wx),Math.max(.017,s.y*yy),Math.max(.017,s.z*dd));
  g.translate(c.x,c.y+yoff*s.y,c.z+zoff*s.z);
  push(slot,g,material);closedEnvelopes++;
 }
 for(const slot of SLOTS){
  if(slot==='Head')envelope(slot,.47,.43,.46,-.015,-.02,0,true);
  else if(slot==='Chest')envelope(slot,.50,.51,.51,0,-.01,0,false);
  else if(slot==='Back')envelope(slot,.42,.45,.38,0,-.02,5,false);
  else if(slot.startsWith('Arm'))envelope(slot,.53,.52,.46,.01,0,0,true);
  else if(slot.startsWith('Hand'))envelope(slot,.49,.47,.48,0,0,0,false);
  else if(slot.startsWith('Leg'))envelope(slot,.49,.51,.47,0,0,0,false);
  else envelope(slot,.51,.48,.51,0,0,0,true);
 }
 // Chest-weighted neck liner overlaps new head shell and upper breastplate.
 const neckLo=Math.min(H.b.min.y,C.b.max.y),neckHi=Math.max(H.b.min.y,C.b.max.y);
 const neckLen=Math.max(.035,neckHi-neckLo+C.s.y*.18),neckR=Math.min(C.s.x,H.s.x)*.19;
 const neck=new THREE.CylinderGeometry(neckR*.85,neckR,neckLen,16,1);
 neck.translate(H.c.x,(neckLo+neckHi)*.5,C.c.z);push('Chest',neck,1);

 // Long continuous torso frontage, extending under the belt and overlapping
 // the shoulder attachment rather than separated surface slabs.
 panel('Chest',shield,t.x*.94,t.y*.86,C.c.x,C.c.y+t.y*.025,fx,t.z*.24,0);
 panel('Chest',chevron,t.x*.90,t.y*.28,C.c.x,C.c.y+t.y*.35,fx+t.z*.14,t.z*.085,2);
 panel('Chest',facet,t.x*.69,t.y*.38,C.c.x,C.c.y+t.y*.105,fx+t.z*.16,t.z*.105,1);
 trim('Chest',t.x*.73,t.y*.14,C.c.x,C.c.y-t.y*.27,fx+t.z*.22);
 gem('Chest',t.x*.11,t.y*.16,t.z*.095,C.c.x,C.c.y+t.y*.15,fx+t.z*.31);
 for(const side of [-1,1]){
  const sx=C.c.x+side*t.x*.37;
  panel('Chest',blade,t.x*.27,t.y*.50,sx,C.c.y+t.y*.02,fx+t.z*.09,t.z*.12,2);
 }
 // Helmet: compact face visor and eyebrow with continuous faceplate underlay.
 // No protruding nose/ball at all. Mouth slit is a recessed dark V chevron.
 const hz=H.front-H.s.z*.01;
 panel('Head',facet,H.s.x*.66,H.s.y*.48,H.c.x,H.c.y-H.s.y*.13,hz-H.s.z*.07,H.s.z*.105,0);
 panel('Head',chevron,H.s.x*.79,H.s.y*.14,H.c.x,H.c.y+H.s.y*.06,hz+H.s.z*.07,H.s.z*.05,1);
 panel('Head',chevron,H.s.x*.74,H.s.y*.052,H.c.x,H.c.y+H.s.y*.08,hz+H.s.z*.10,H.s.z*.025,3);
 panel('Head',blade,H.s.x*.09,H.s.y*.41,H.c.x,H.c.y+H.s.y*.25,hz+H.s.z*.07,H.s.z*.065,2);
 for(const dir of [-1,1]){
  panel('Head',fang,H.s.x*.26,H.s.y*.45,H.c.x+dir*H.s.x*.36,H.c.y-H.s.y*.06,hz+H.s.z*.06,H.s.z*.13,0);
  gem('Head',H.s.x*.055,H.s.y*.073,H.s.z*.045,H.c.x+dir*H.s.x*.27,H.c.y+H.s.y*.10,hz+H.s.z*.20);
 }
 // Shared waist edge, pelvis guards, breast/skirt transition.
 panel('Chest',shield,t.x*.79,t.y*.18,C.c.x,C.b.min.y+t.y*.14,fx+t.z*.18,t.z*.14,2);
 for(const slot of ['ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR']){
  const d=data.get(slot),s=d.s,p=d.c,z=d.front+s.z*.05;
  const arm=slot.startsWith('Arm'),hand=slot.startsWith('Hand'),foot=slot.startsWith('Foot');
  const ratio=arm?.90:hand?.84:foot?.82:.90;
  const height=arm?.70:hand?.88:foot?.91:.89;
  panel(slot,shield,s.x*ratio,s.y*height,p.x,p.y+s.y*(arm?.07:0),z,s.z*.22,0);
  panel(slot,chevron,s.x*.88,s.y*.16,p.x,p.y+s.y*(arm?.18:.28),z+s.z*.17,s.z*.09,2);
  panel(slot,facet,s.x*.65,s.y*.29,p.x,p.y-s.y*.16,z+s.z*.17,s.z*.09,1);
  if(!hand){
   panel(slot,shield,s.x*.64,s.y*.19,p.x,p.y-s.y*.29,z+s.z*.09,s.z*.08,2);
  }
  if(foot){
   panel(slot,shield,s.x*.90,s.y*.30,p.x,p.y-s.y*.22,z+s.z*.22,s.z*.17,0);
  }
 }
 // Rounded original ball pauldrons are replaced by overlapping angular mantle
 // plates with trim and an anchored joint bridge already covering native arm.
 for(const side of [-1,1]){
  const slot=side<0?'ArmL':'ArmR',d=data.get(slot),s=d.s,p=d.c,z=d.front+s.z*.09;
  panel(slot,shield,s.x*1.22,s.y*.62,p.x,p.y+s.y*.18,z,s.z*.26,0);
  panel(slot,chevron,s.x*1.13,s.y*.24,p.x,p.y+s.y*.35,z+s.z*.17,s.z*.08,2);
  gem(slot,s.x*.15,s.y*.14,s.z*.08,p.x,p.y+s.y*.24,z+s.z*.28);
 }
 // Back: one large articulated skinned silhouette using source back weights.
 const capeTop=Math.min(H.b.min.y,C.b.max.y)-t.y*.05;
 const legBottom=Math.min(data.get('LegL').b.min.y,data.get('LegR').b.min.y);
 const length=Math.max(t.y*.65,capeTop-legBottom-t.y*.13),cx=C.c.x,cz=C.back-t.z*.10;
 // Triangulated center drape. Cloth is rigidly skinned to native Back (no physics).
 panel('Back',[[ -1,1],[1,1],[.91,-.68],[.60,-.88],[.28,-.75],[0,-1],[-.28,-.75],[-.60,-.88],[-.91,-.68]],
  t.x*1.22,length,cx,capeTop-length*.5,cz,t.z*.055,5);
 gem('Back',t.x*.14,t.y*.14,t.z*.07,cx,capeTop-length*.09,cz-t.z*.08);
 // Reference-specific details are contiguous with the geometry they embellish:
 if(style==='violet'||style==='dragon'||style==='berserker'){
  for(const dir of [-1,1]){
   const x=H.c.x+dir*H.s.x*.40;
   const hornColor=style==='violet'?4:style==='dragon'?2:3;
   push('Head',shortHorn(x,H.b.max.y-H.s.y*.13,H.c.z,H.s.x*(style==='dragon'?.32:.25),H.s.y*.32,dir),hornColor);
  }
 }
 if(style==='celestial'){
  // White-gold wing blades replacing old blocky cube ornaments.
  for(const dir of [-1,1]){
   const slot=dir<0?'ArmL':'ArmR',d=data.get(slot),s=d.s;
   for(let i=0;i<3;i++)
    panel(slot,blade,s.x*.28,s.y*(.31+i*.07),d.c.x+dir*s.x*(.29+i*.16),
      d.c.y+s.y*(.30+i*.09),d.front+s.z*.18,s.z*.07,i===0?2:0);
  }
 }
 if(style==='dragon'){
  // Overlapping scale pattern modeled as a single rigged chest assembly.
  for(let row=0;row<3;row++)for(let col=-2;col<=2;col++){
   const px=C.c.x+col*t.x*.145+(row%2)*t.x*.05,py=C.c.y+t.y*.19-row*t.y*.20;
   panel('Chest',facet,t.x*.14,t.y*.19,px,py,fx+t.z*.28,t.z*.05,(row+col+20)%4===0?2:4);
  }
  for(const side of [-1,1])for(let i=0;i<3;i++){
   const slot=side<0?'LegL':'LegR',d=data.get(slot);
   panel(slot,facet,d.s.x*.23,d.s.y*.19,d.c.x+side*d.s.x*.18,
    d.c.y+(i-1)*d.s.y*.19,d.front+d.s.z*.26,d.s.z*.07,4);
  }
 }
 if(style==='berserker'){
  // Infernal melt, not bone snout: molten thin veins are flush with the chest.
  for(let i=-2;i<=2;i++){
   panel('Chest',blade,t.x*.06,t.y*.30,C.c.x+i*t.x*.15,C.c.y+t.y*.01,
    fx+t.z*.30,t.z*.05,3);
  }
  for(const side of [-1,1]){
   const slot=side<0?'ArmL':'ArmR',d=data.get(slot);
   for(let i=0;i<3;i++)
    push(slot,shortHorn(d.c.x+side*d.s.x*(.24+i*.10),d.c.y+d.s.y*.30,d.back,
       d.s.x*.20,d.s.y*(.22+i*.07),side),4);
  }
 }
 if(style==='arcane'){
  for(let i=0;i<7;i++){
   const theta=Math.PI*2*i/7,rr=t.x*.25;
   gem('Chest',t.x*.025,t.y*.046,t.z*.04,C.c.x+Math.cos(theta)*rr,
     C.c.y+Math.sin(theta)*rr,fx+t.z*.31);
  }
  push('Chest',ring(t.x*.27,t.x*.014,C.c.x,C.c.y,fx+t.z*.32),2);
  push('Back',ring(t.x*.22,t.x*.01,cx,capeTop-length*.72,cz-t.z*.08),3);
 }
 let assemblies=0,totalPieces=0,totalVerts=0;
 for(const [slot,pieces] of batches){
  if(!pieces.length)throw Error('SKIN83_SLOT_EMPTY '+slot);
  const host=hosts.get(slot),geometry=mergePieces(pieces);
  projectWeights(host,geometry);
  const mesh=new THREE.SkinnedMesh(geometry,skins);
  mesh.name='HF83_FUSED_'+style+'_'+slot;
  mesh.bind(host.skeleton,host.bindMatrix.clone());
  mesh.frustumCulled=false;host.parent.add(mesh);copies.push(mesh);
  assemblies++;totalPieces+=pieces.length;totalVerts+=geometry.attributes.position.count;
 }
 const proof={
  pass:'SKIN8_4_TRUE_REPLACEMENT',enabled:true,referenceId:style,referenceName:ref.name,
  originalNativeSlots:hosts.size,sourcePrimitivesPreserved:17,sourceBones:23,
  originalClips:gltf.animations.length,skinWeightAssemblies:copies.filter(m=>m.isSkinnedMesh&&m.skeleton.bones.length===23).length,
  assemblies,geometryPiecesCombined:totalPieces,fusedVertices:totalVerts,
  oldFloatingDecorationsHidden:oldHidden,shellCount,sourceImmutable:true,
  trueReplacement:true,legacyDonorMeshesHidden:donorHidden,underArmorRetained,
  closedArmorEnvelopes:closedEnvelopes,styleSpecificReferenceGeometry:true,
  artApproved:false,clippingFullyCertified:false,physicalAndroidCertified:false,
  faithfulImageReconstruction:false
 };
 let visibleLegacyMeshes=0,visibleFusedAssemblies=0,visibleOtherMeshes=0;
 const permittedBody=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
 gltf.scene.traverse(o=>{
  if(!o.isMesh||!o.visible)return;
  if(o.name.startsWith('HF83_FUSED_'+style+'_')){visibleFusedAssemblies++;return;}
  if(permittedBody.test(o.name))return;
  if(/^(HF_DUAL_|HF_DNA_|HF_SKIN8_|HIGHFLY_VIOLET_|Armor_paladin_)/.test(o.name))visibleLegacyMeshes++;
  else visibleOtherMeshes++;
 });
 proof.visibleLegacyMeshes=visibleLegacyMeshes;
 proof.visibleFusedAssemblies=visibleFusedAssemblies;
 proof.visibleOtherMeshes=visibleOtherMeshes;
 if(assemblies!==11||proof.skinWeightAssemblies!==11||shellCount!==17||
   visibleFusedAssemblies!==11||visibleLegacyMeshes!==0||visibleOtherMeshes!==0||
   closedEnvelopes!==11||underArmorRetained<10||proof.originalClips!==22||
   totalPieces<60||totalVerts<3000)
  throw Error('SKIN84_TRUE_REPLACEMENT_GATE_RED '+JSON.stringify(proof));
 gltf.userData.skin83Proof=proof;return proof;
}
