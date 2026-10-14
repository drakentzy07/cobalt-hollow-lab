/**
 * HIGHFLY SKIN 8.9 — three NEW native-rigged armor prototypes in real Three.js.
 * The helm and breastplate are closed, separately GENERATED TOPOLOGIES (not
 * recolors or sticky geometry attached to the old Paladin helmet).
 * All vertices are transferred to the verified ClaudeCraft donor skin weights.
 * Visual fidelity to supplied concept renders is aspirational, not certified.
 */
import * as THREE from 'three';

export const SUPREME89=Object.freeze({
 'supreme-obsidian':{label:'OBSIDIAN MONARCH · Monarca Obsidiana',base:'violet',
   metal:0x171725,trim:0xc2c2d4,dark:0x0b0a15,glow:0xa744ff,style:0,
   signature:'OBSIDIAN_CROWN_ANGULAR_VISOR_DEEP_VIOLET'},
 'supreme-solar':{label:'SOLAR AEGIS · Guardián del Alba',base:'celestial',
   metal:0xe4e4e8,trim:0xe4b45c,dark:0x33374a,glow:0x37aaff,style:1,
   signature:'SOLAR_GOLDEN_ARCS_IVORY_BREASTPLATE'},
 'supreme-crimson':{label:'CRIMSON DRAGON EMPEROR · Emperador Dragón',base:'dragon',
   metal:0x78251e,trim:0xefb365,dark:0x1b1013,glow:0xff5b19,style:2,
   signature:'DRACONIC_SNOUT_SCALED_ARMOR_CRIMSON'});
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const color=(v)=>new THREE.Color(v);
function sources(gltf){
 const out=new Map(SLOTS.map(s=>[s,[]]));
 gltf.scene.traverse(root=>{
  const slot=root.name?.startsWith('Armor_paladin_')?root.name.slice(14):null;
  if(!out.has(slot))return;
  root.traverse(mesh=>{
   if(mesh.isSkinnedMesh&&mesh.name?.startsWith('Armor_paladin_')&&!out.get(slot).includes(mesh))
    out.get(slot).push(mesh);
  });
 });
 if([...out.values()].flat().length!==17||[...out.values()].some(arr=>!arr.length))
  throw Error('SKIN89_ORIGINAL_17_MISSING');
 for(const m of [...out.values()].flat())
  if(m.skeleton.bones.length!==23)throw Error('SKIN89_ORIGINAL_RIG_CHANGED');
 return out;
}
function boxes(meshes){
 const bbox=new THREE.Box3();
 for(const m of meshes)bbox.union(new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position')));
 const center=bbox.getCenter(new THREE.Vector3()), size=bbox.getSize(new THREE.Vector3());
 if([...center,...size].some(x=>!Number.isFinite(x))||[size.x,size.y,size.z].some(x=>x<1e-5))
  throw Error('SKIN89_INVALID_ORIGINAL_BOUNDS');
 return {center,size,bbox};
}
function skinTransfer(donor,geometry){
 const src=donor.geometry.getAttribute('position'),indices=donor.geometry.getAttribute('skinIndex'),weights=donor.geometry.getAttribute('skinWeight');
 const p=geometry.getAttribute('position');if(!indices||!weights||!p)throw Error('SKIN89_WEIGHTS_MISSING');
 const si=new Uint16Array(p.count*4),sw=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++){
  let jBest=0,best=Infinity;
  for(let j=0;j<src.count;j++){
   const dx=p.getX(i)-src.getX(j),dy=p.getY(i)-src.getY(j),dz=p.getZ(i)-src.getZ(j);
   const d=dx*dx+dy*dy+dz*dz;
   if(d<best){best=d;jBest=j;}
  }
  let sum=0;
  for(let k=0;k<4;k++){si[i*4+k]=indices.getComponent(jBest,k);sw[i*4+k]=weights.getComponent(jBest,k);sum+=sw[i*4+k];}
  if(sum<1e-6)throw Error('SKIN89_ORIGINAL_ZERO_WEIGHTS');
  for(let k=0;k<4;k++)sw[i*4+k]/=sum;
 }
 geometry.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));
 geometry.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));
 return geometry;
}
function vertexColor(cfg,kind,u,t,front,slope=0){
 const base=color(cfg.metal),edge=color(cfg.trim),deep=color(cfg.dark),glow=color(cfg.glow);
 if(t<.15)base.lerp(deep,.60);
 if(t>.87)base.lerp(edge,.22);
 const ang=Math.abs(u),isFront=front>.70;
 if(kind==='helmet'){
  const eye=Math.abs(t-.52)<.056&&isFront&&ang<.73;
  if(eye)base.lerp(glow,.96);
  if(Math.abs(t-.64)<.075&&isFront)base.lerp(edge,.73);
  if(isFront&&ang<.20&&t>.73)base.lerp(edge,.83);
  if(cfg.style===2&&t<.43&&isFront&&ang<.30)base.lerp(deep,.57);
  if(cfg.style===1&&t>.80)base.lerp(edge,.62);
  if(cfg.style===0&&Math.abs(u)>.60)base.lerp(deep,.42);
 }else{
  const chevron=Math.abs(t-(.72-.19*ang));
  if(isFront&&chevron<.075)base.lerp(edge,.80);
  if(isFront&&ang<.15&&t>.37&&t<.79)base.lerp(glow,.73);
  if(cfg.style===2&&isFront&&Math.sin(t*49+ang*28)>0.53)base.lerp(deep,.42);
  if(cfg.style===1&&isFront&&Math.abs(t-.55)<.08)base.lerp(edge,.64);
  if(cfg.style===0&&isFront&&Math.abs(slope)>.06)base.lerp(deep,.24);
 }
 return base;
}
/**
 * A continuous loft, with topology unique to the requested helm/cuirass.
 * Unlike old bbox-attached ornaments, all silhouette features are vertices
 * in a single skinned surface. +/-Z is front/back on ClaudeCraft donors.
 */
function loft(donors,kind,cfg){
 const {center:c,size:s}=boxes(donors);
 const rings=kind==='helmet'?20:16, sides=32;
 const positions=[],colors=[],indices=[];
 const out=new THREE.Color();
 for(let iy=0;iy<=rings;iy++){
  const t=iy/rings;
  for(let ix=0;ix<=sides;ix++){
   const a=ix/sides*Math.PI*2,ux=Math.sin(a),front=Math.cos(a);
   const absX=Math.abs(ux);
   let y=c.y+(t-.5)*s.y,rx=1,rz=1;
   if(kind==='helmet'){
    // Open throat taper, sculpted jaw, brow, upper crown and draconic muzzle.
    rx=.75+.25*Math.sin(Math.PI*t*.88);
    rz=.83+.16*Math.sin(Math.PI*t*.9);
    if(t<.30){rx*=.79+.22*t/.30;rz*=.78+.20*t/.30;}
    if(cfg.style===0){
     rx*=1+.055*Math.cos(a*8)+.09*smooth(.65,.97,t);
     rz*=1+.08*smooth(.35,.75,t)*Math.max(0,front);
     // Three angular crown ridges are cut into the SAME helmet topology.
     if(t>.79)y+=s.y*.15*smooth(.79,1,t)*Math.pow(Math.max(0,Math.cos(a*3)),10);
    }else if(cfg.style===1){
     rx*=.89+.08*smooth(.50,.86,t);
     rz*=.93;
     // Golden saint's swept crown: two side arches and central crest.
     if(t>.75)y+=s.y*.17*smooth(.75,1,t)*
      (Math.pow(Math.max(0,Math.cos(a)),18)*.72+
       Math.pow(Math.abs(Math.sin(a)),22)*.77);
    }else{
     rx*=.95+.055*Math.cos(a*6);
     rz*=1+.20*Math.max(0,front)*smooth(.12,.43,t)*(1-smooth(.46,.75,t));
     // Draconic snout is integral to the face shell, not a box over it.
     if(front>.4&&t<.52)rz+=.18*smooth(.40,.92,front)*(1-smooth(.39,.62,t));
     // Rearward horn silhouette is lofted from the helmet crown itself.
     if(t>.77)y+=s.y*.15*smooth(.77,1,t)*
       Math.pow(Math.max(0,-front),7)*(1-.3*absX);
    }
    // Continuous front central nasal ridge and angular cheek deflectors.
    rz+=.08*Math.pow(Math.max(front,0),7)*(1-absX)*smooth(.15,.47,t);
   }else{
    // Hourglass cuirass instead of the donor's pre-existing 3D topology.
    const upper=smooth(.48,.99,t),waist=1-smooth(.10,.38,t);
    rx=.72+.23*upper-.10*waist;
    rz=.72+.14*upper-.055*waist;
    if(cfg.style===0){
     rx+=.07*upper;rz+=.105*Math.pow(Math.max(0,front),4);
    }else if(cfg.style===1){
     rx+=.035*upper;rz+=.115*Math.pow(Math.max(0,front),3)*(1-absX);
    }else{
     rx+=.10*upper;
     rz+=.09*Math.pow(Math.max(0,front),4)+.038*Math.sin(t*39)*Math.max(front,0);
    }
    // Fitted V-chevron plating pressed INTO the breastplate silhouette.
    rz+=.075*Math.pow(Math.max(0,front),5)*
        Math.max(0,1-Math.abs(t-(.73-.19*absX))/.15);
   }
   const facet=1+.032*Math.cos(a*8);
   const x=c.x+ux*s.x*.54*rx*facet;
   const z=c.z+front*s.z*.54*rz*facet;
   positions.push(x,y,z);
   const tint=vertexColor(cfg,kind,ux,t,front,rz);
   colors.push(tint.r,tint.g,tint.b);
  }
 }
 for(let iy=0;iy<rings;iy++)for(let ix=0;ix<sides;ix++){
  const a=iy*(sides+1)+ix,b=a+sides+1;
  indices.push(a,a+1,b, a+1,b+1,b);
 }
 // Shape is watertight in full 3D: caps are joined to the same geometry.
 const bottom=positions.length/3;
 positions.push(c.x,c.y-s.y*.5,c.z);
 colors.push(...new THREE.Color(cfg.dark).toArray());
 const top=positions.length/3;
 positions.push(c.x,c.y+s.y*(kind==='helmet'?.66:.50),c.z);
 colors.push(...new THREE.Color(cfg.trim).toArray());
 for(let ix=0;ix<sides;ix++){
  indices.push(bottom,ix+1,ix);
  const a=rings*(sides+1)+ix;
  indices.push(top,a,a+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 return geo;
}
function repaint(mesh,slot,cfg){
 const g=mesh.geometry.clone(),p=g.getAttribute('position'),{center:c,size:s}=boxes([mesh]),cols=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const u=(x-c.x)/s.x,v=(y-c.y)/s.y,w=(z-c.z)/s.z;
  const top=smooth(-.03,.43,v),wide=slot.startsWith('Arm')?.20:slot.startsWith('Leg')?.10:.045;
  p.setXYZ(i,c.x+(x-c.x)*(1+wide*top),y,c.z+(z-c.z)*(1+.065*top));
  let tone=color(cfg.metal),gold=color(cfg.trim),dark=color(cfg.dark),energy=color(cfg.glow);
  if(Math.abs(u)>.35||v>.37)tone.lerp(gold,.56);
  if(v<-.34)tone.lerp(dark,.49);
  if(w>.16&&Math.abs(v-.14)<.055)tone.lerp(gold,.71);
  if(w>.2&&Math.abs(u)<.12&&Math.abs(v-.05)<.18)tone.lerp(energy,.70);
  if(cfg.style===2&&w>.12&&Math.sin(u*37+v*25)>.55)tone.lerp(dark,.40);
  cols.set(tone.toArray(),i*3);
 }
 g.setAttribute('color',new THREE.BufferAttribute(cols,3));
 g.computeVertexNormals();g.computeBoundingSphere();
 mesh.geometry=g;mesh.material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,metalness:.73,roughness:.31,side:THREE.DoubleSide,flatShading:true});
 mesh.frustumCulled=false;
}
export function forgeSupreme89(gltf,id){
 const cfg=SUPREME89[id];if(!cfg)throw Error('SKIN89_UNKNOWN_STYLE '+id);
 const donor=sources(gltf);
 const prefix='HF84_NATIVEREFORGE_'+cfg.base+'_';
 const shells=new Map(SLOTS.map(k=>[k,[]]));
 gltf.scene.traverse(m=>{
  if(!m.isSkinnedMesh||!m.name.startsWith(prefix))return;
  const part=m.name.slice(prefix.length).split('_')[0];
  if(!shells.has(part))throw Error('SKIN89_BAD_SLOT '+part);
  shells.get(part).push(m);
 });
 const original= [...donor.values()].flat(),list=[...shells.values()].flat();
 if(list.length!==17||[...shells.values()].some(a=>!a.length))
  throw Error('SKIN89_NEEDS_17_NATIVE_SHELLS');
 let shellHidden=0,repainted=0;
 for(const [slot,ms] of shells)for(const m of ms){
  if(slot==='Head'||slot==='Chest'||slot==='Back'){m.visible=false;shellHidden++;}
  else{repaint(m,slot,cfg);repainted++;}
 }
 // New meshes replace the complete visible head and breastplate, not overlays.
 const generated=[];
 for(const slot of ['Head','Chest']){
  const parts=donor.get(slot),d=[...parts].sort((a,b)=>
   b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
  const geometry=skinTransfer(d,loft(parts,slot==='Head'?'helmet':'cuirass',cfg));
  const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,metalness:.73,roughness:.27,
   side:THREE.DoubleSide,flatShading:true});
  const mesh=new THREE.SkinnedMesh(geometry,material);
  mesh.name='HF89_'+id+'_'+slot+'_FULL_REPLACEMENT';
  mesh.bind(d.skeleton,d.bindMatrix.clone());mesh.frustumCulled=false;
  d.parent.add(mesh);generated.push(mesh);
 }
 const visibleWings=[];
 gltf.scene.traverse(o=>{
  if(o.isMesh&&(o.name.startsWith('HF87_')||o.name.includes('_wings_'))&&o.visible){
   visibleWings.push(o.name);o.visible=false;
  }
 });
 const visibleOldHelmet=[...shells.get('Head'),...donor.get('Head')].filter(m=>m.visible).length;
 const visibleOldChest=[...shells.get('Chest'),...donor.get('Chest')].filter(m=>m.visible).length;
 const actual=[...generated,...list.filter(m=>m.visible)];
 const qa={pass:'SKIN89_NEW_TOPOLOGY_RIGGED_3D',id,style:cfg.signature,
  helmetMode:'CLOSED_SINGLE_MESH_FULL_REPLACEMENT',
  cuirassMode:'CONTINUOUS_SINGLE_MESH_FULL_REPLACEMENT',
  helmetTriangles:generated[0].geometry.index.count/3,
  cuirassTriangles:generated[1].geometry.index.count/3,
  generatedSkinnedMeshes:generated.length,sourceDonorMeshes:original.length,
  nativeBodyMeshesReworked:repainted,hiddenOldNativeShells:shellHidden,
  oldHelmetVisible:visibleOldHelmet,oldChestVisible:visibleOldChest,
  wingMeshesVisible:visibleWings.length,sourceBones:23,clips:gltf.animations.length,
  weightedMeshes:actual.filter(o=>o.isSkinnedMesh&&o.skeleton.bones.length===23).length,
  noWingsByDesign:true,sourceGLBImmutable:true,exactConceptArtMatch:false,
  physicalAndroidValidated:false,artisticApproval:false};
 if(qa.generatedSkinnedMeshes!==2||qa.sourceDonorMeshes!==17||
    qa.nativeBodyMeshesReworked<10||qa.oldHelmetVisible!==0||qa.oldChestVisible!==0||
    qa.wingMeshesVisible!==0||qa.clips!==22||qa.weightedMeshes!==actual.length||
    qa.helmetTriangles<900||qa.cuirassTriangles<800)
    throw Error('SKIN89_FULL_ARMOR_RED '+JSON.stringify(qa));
 return qa;
}
