/**
 * V13 — direct paint on TRUE Blender-generated Nightfall SkinnedMesh.
 * No writes to KayKit originals; recipe changes editable forged material only.
 * Preview JSON is NOT a baked/exported modified GLB.
 */
export const PREMIUM_PAINT_SCHEMA='highfly.skin.nightfall.paint/v13';
const MESH=/^HFV(?:8|12)_[MF]_(CHEST|ARMS|HANDS|LEGS|FEET|BACK)_[A-Z0-9_]+$/;
const KEY=/^HFV(?:8|12)_(CHEST|ARMS|HANDS|LEGS|FEET|BACK)_[A-Z0-9_]+$/;
const COLOR=/^#[0-9a-fA-F]{6}$/;
export function forgedPaintKey(name){
 if(typeof name!=='string'||!MESH.test(name))return null;
 return name.replace(/^(HFV(?:8|12))_[MF]_/, '$1_');
}
export function validPremiumPaint(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.getPrototypeOf(raw)!==Object.prototype||
    raw.schema!==PREMIUM_PAINT_SCHEMA||!Array.isArray(raw.paints)||
    raw.paints.length>140||Object.keys(raw).some(k=>!['schema','paints'].includes(k)))
    throw Error('V13_PAINT_SCHEMA_REJECTED');
 const seen=new Set();
 return {schema:PREMIUM_PAINT_SCHEMA,paints:raw.paints.map(p=>{
   if(!p||typeof p!=='object'||Array.isArray(p)||
      Object.getPrototypeOf(p)!==Object.prototype||
      Object.keys(p).some(k=>!['key','color','metalness','roughness'].includes(k))||
      !KEY.test(p.key||'')||seen.has(p.key)||!COLOR.test(p.color||'')||
      typeof p.metalness!=='number'||!Number.isFinite(p.metalness)||
      p.metalness<0||p.metalness>1||
      typeof p.roughness!=='number'||!Number.isFinite(p.roughness)||
      p.roughness<.04||p.roughness>1)
     throw Error('V13_UNSAFE_PAINT_ENTRY');
   seen.add(p.key);
   return {key:p.key,color:p.color.toLowerCase(),
     metalness:+p.metalness.toFixed(3),roughness:+p.roughness.toFixed(3)};
 })};
}
export function createPremiumPaintV13({getMeshes,THREE,redraw}){
 if(typeof getMeshes!=='function'||!THREE||typeof redraw!=='function')
   throw Error('V13_EDITOR_REQUIRES_THREE_AND_FORGED_MESH_AUTHORITY');
 let selected=null,lastMeshes=[],originalMaterials=new Map(),paints=new Map();
 const meshes=()=>getMeshes().filter(m=>m.isSkinnedMesh&&forgedPaintKey(m.name));
 function sync(){
   const current=meshes();
   if(current.length===0)return current;
   if(lastMeshes.length!==current.length||lastMeshes.some((m,i)=>m!==current[i])){
    lastMeshes=current.slice();
    originalMaterials.clear();
    for(const mesh of current){
      if(Array.isArray(mesh.material)||!mesh.material?.isMeshStandardMaterial)
        throw Error('V13_REQUIRES_PBR_SKINNED_FORGED_MATERIAL_'+mesh.name);
      originalMaterials.set(mesh,mesh.material);
      mesh.material=mesh.material.clone(); // no shared M/F or input material mutation.
    }
    for(const p of paints.values())apply(p,false);
    redraw();
   }
   return current;
 }
 function select(mesh){
   sync();
   if(!meshes().includes(mesh))throw Error('V13_SELECT_FORGED_3D_PART_ONLY');
   selected=forgedPaintKey(mesh.name);
   return {key:selected,name:mesh.name,gender:mesh.name.match(/^HFV(?:8|12)_([MF])_/)[1]};
 }
 function apply(p,update=true){
   const matches=meshes().filter(m=>forgedPaintKey(m.name)===p.key);
   if(!matches.length)throw Error('V13_UNKNOWN_FORGED_PART_'+p.key);
   for(const mesh of matches){
     mesh.material.color.set(p.color);
     mesh.material.metalness=p.metalness;
     mesh.material.roughness=p.roughness;
     mesh.material.needsUpdate=true;
   }
   paints.set(p.key,p);
   if(update)redraw();
   return matches.length;
 }
 function paint(color,metalness,roughness){
   if(!selected)throw Error('V13_SELECT_REAL_ARMOR_PART_FIRST');
   sync();
   const checked=validPremiumPaint({schema:PREMIUM_PAINT_SCHEMA,
     paints:[{key:selected,color,metalness,roughness}]}).paints[0];
   return {key:selected,meshCount:apply(checked)};
 }
 function recipe(){return validPremiumPaint({schema:PREMIUM_PAINT_SCHEMA,paints:[...paints.values()]})}
 function restore(raw){
   const data=validPremiumPaint(raw),available=new Set(meshes().map(m=>forgedPaintKey(m.name)));
   if(!available.size||data.paints.some(p=>!available.has(p.key)))throw Error('V13_SOURCE_MESHES_NOT_MOUNTED');
   sync();reset();
   for(const p of data.paints)apply(p,false);
   redraw();return recipe();
 }
 function reset(){
   for(const [mesh,base] of originalMaterials){
     if(mesh.material!==base)mesh.material=base.clone();
   }
   paints.clear();selected=null;redraw();
 }
 return Object.freeze({
  meshes:()=>sync().filter(m=>m.visible),
  select,paint,recipe,restore,reset,
  state:()=>({mounted:meshes().length>=80,paintedPieces:paints.size,
     selected,exportedBakedGLB:false,sourceHunterUntouched:true,
     changedMaterialsOnly:true,sourceRig:'Rig_Medium'})
 });
}
