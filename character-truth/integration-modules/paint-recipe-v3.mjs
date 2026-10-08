/**
 * HIGHFLY SKIN FACTORY — V3 paint + seven-slot recipe (source-isolated).
 * Rebuilds useful V2 material-color logic over SKIN3 identity, NOT a V2 copy.
 * Owns no global, server, Sim state, GLTF skeleton, mesh geometry or assets.
 * All original models remain referenced; no new proxy geometry.
 */
export const PARTS=Object.freeze(['head','chest','arms','hands','legs','feet','back']);
export const FAMILIES=Object.freeze(['knight','barbarian','druid','mage','paladin','ranger','rogue']);
export const SOURCE_REV='9b57e49c9676d75962700f828cc00a50a9a988b5';
export const STYLES=Object.freeze({
 source:null,
 graphite:{color:'#101118',accent:'#5b21b6',metalness:0.72,roughness:0.24},
 raven:{color:'#19141f',accent:'#8b5cf6',metalness:0.58,roughness:0.32}
});
const DANGEROUS=['__proto__','constructor','prototype'];
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validColor(c){return typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function rawShape(value){
 if(typeof value==='string')return JSON.parse(value);
 return value;
}
export function emptyDesign(gender='male'){
 if(!['male','female'].includes(gender))throw Error('INVALID_GENDER');
 return {schemaVersion:3,rig:'Rig_Medium',sourceRevision:SOURCE_REV,gender,parts:{}};
}
function checkPart(raw){
 if(!obj(raw)||typeof raw.set!=='string'||!FAMILIES.includes(raw.set))throw Error('INVALID_ARMOR_SOURCE');
 const paint=raw.paint;
 if(paint===null||paint===undefined)return {set:raw.set,paint:null};
 if(!obj(paint)||!validColor(paint.color)||!validColor(paint.accent))throw Error('INVALID_PAINT');
 if(!Number.isFinite(paint.metalness)||paint.metalness<0||paint.metalness>1 ||
    !Number.isFinite(paint.roughness)||paint.roughness<0||paint.roughness>1)
   throw Error('INVALID_MATERIAL_RANGE');
 return {set:raw.set,paint:{
  color:paint.color.toLowerCase(),accent:paint.accent.toLowerCase(),
  metalness:paint.metalness,roughness:paint.roughness
 }};
}
export function readDesign(serialized){
 const x=rawShape(serialized);
 if(!obj(x)||x.schemaVersion!==3||x.rig!=='Rig_Medium'||
    x.sourceRevision!==SOURCE_REV||!['male','female'].includes(x.gender)||
    !obj(x.parts))throw Error('INVALID_RECIPE_VERSION_OR_SOURCE');
 if(Object.keys(x.parts).length>7)throw Error('TOO_MANY_PARTS');
 const out=emptyDesign(x.gender);
 for(const key of Object.keys(x.parts)){
  if(DANGEROUS.includes(key)||!PARTS.includes(key))throw Error('UNKNOWN_PART');
  out.parts[key]=checkPart(x.parts[key]);
 }
 return out;
}
export function saveDesign(design){return JSON.stringify(readDesign(design));}
export function paintPreset(name){
 if(name==='source')return null;
 const p=STYLES[name];
 if(!p)throw Error('UNKNOWN_PAINT_PRESET');
 return {...p};
}
export function withPart(design,slot,set,paint=null){
 const x=readDesign(design);
 if(!PARTS.includes(slot))throw Error('INVALID_SLOT');
 x.parts[slot]=checkPart({set,paint});return x;
}
export function withoutPart(design,slot){
 const x=readDesign(design);
 if(!PARTS.includes(slot))throw Error('INVALID_SLOT');
 delete x.parts[slot];return x;
}
export function withGender(design,gender){
 const x=readDesign(design);
 if(!['male','female'].includes(gender))throw Error('INVALID_GENDER');
 x.gender=gender;return x;
}
/** Explicit one-way migration: v2 recipe has exactly ONE edited slot.
 * Unknown versions/properties are rejected, and NONE of the other six
 * new slots will be auto-filled. The old localStorage record is never edited.
 */
export function migrateSinglePartV2(legacy,gender='male'){
 const x=rawShape(legacy);
 if(!obj(x)||x.version!==2||!PARTS.includes(x.slot)||
    !FAMILIES.includes(x.set)||!validColor(x.color)||
    !['mate','metal','glow'].includes(x.material))throw Error('INVALID_LEGACY_V2');
 if(x.specialSkin!==undefined&&x.specialSkin!==null)
   throw Error('SPECIAL_SKIN_REQUIRES_SEPARATE_LICENSED_ASSET_MIGRATION');
 const d=emptyDesign(gender);
 const accent=x.color;
 const metal=x.material==='metal'?0.78:x.material==='glow'?0.32:0.12;
 return withPart(d,x.slot,x.set,{
  color:x.color,accent,metalness:metal,roughness:x.material==='metal'?0.25:0.75
 });
}
/** Read-only armor selection from design; the game's equipment stays authoritative. */
export function loadoutOf(design){
 const r=readDesign(design);const slots={};
 for(const slot of PARTS)slots[slot]=r.parts[slot]?.set??null;
 return slots;
}
export function paintInstructions(design,modularPartNames,normalizeAppearance){
 const d=readDesign(design);
 const app=normalizeAppearance?normalizeAppearance({gender:d.gender}):{gender:d.gender};
 const plan=[];
 for(const slot of PARTS){
  const source=d.parts[slot];
  if(!source)continue;
  const full=modularPartNames(app,{[slot]:source.set});
  const nodes=full.filter(n=>n.startsWith('Armor_'));
  if(!nodes.length){plan.push({slot,set:source.set,nodes:[],paint:source.paint,emptyNativeSlot:true});continue}
  plan.push({slot,set:source.set,nodes,paint:source.paint,emptyNativeSlot:false});
 }
 return plan;
}
/** Non-destructive THREE material session; original material objects restored
 * on every update. Respects maps, keeps geometry, rig, weights & clips intact.
 * Source node identity may be carried on a group ancestor.
 */
export function makePainter(root){
 if(!root?.traverse)throw Error('INVALID_RIG_ROOT');
 const original=new Map();
 root.traverse(mesh=>{
  if(!mesh.isMesh&&!mesh.isSkinnedMesh)return;
  original.set(mesh,mesh.material);
 });
 const restore=()=>{
  for(const [mesh,material] of original)mesh.material=material;
 };
 const ancestors=mesh=>{
  const names=[];for(let node=mesh;node;node=node.parent){
   names.push(node.name);
   if(node===root)break;
  }return names;
 };
 const apply=(plan)=>{
  if(!Array.isArray(plan)||plan.length>7)throw Error('INVALID_PAINT_PLAN');
  restore();
  const touched=new Set(),result=[];
  try{
   for(const entry of plan){
    if(!PARTS.includes(entry.slot)||!FAMILIES.includes(entry.set))throw Error('BAD_PAINT_PLAN_SLOT');
    if(entry.paint===null||entry.paint===undefined||entry.emptyNativeSlot){
     result.push({slot:entry.slot,modifiedMeshes:0,modifiedMaterials:0});continue;
    }
    const color=entry.paint.color,accent=entry.paint.accent;
    if(!validColor(color)||!validColor(accent))throw Error('INVALID_RGB');
    const nodes=new Set(entry.nodes);
    let meshes=0,materials=0;
    for(const [mesh,originalMat] of original){
     if(!ancestors(mesh).some(n=>nodes.has(n)))continue;
     if(touched.has(mesh))throw Error('OVERLAPPING_PAINT_SLOTS');
     const old=Array.isArray(originalMat)?originalMat:[originalMat];
     const next=old.map((src,i)=>{
      if(!src?.clone)throw Error('MISSING_MATERIAL_CLONE');
      const mat=src.clone();
      // Same artistic language as V2; not its unsafe global render mutation.
      const THREEColor=mat.color?.constructor;
      if(mat.color&&THREEColor){
       const primary=new THREEColor(color),secondary=new THREEColor(accent);
       mat.color.copy(primary).lerp(secondary,(i%3===1)?0.28:0.04);
      }
      if(mat.emissive?.set)mat.emissive.set(accent).multiplyScalar(0.07);
      if('metalness' in mat)mat.metalness=clamp(entry.paint.metalness,0,1);
      if('roughness' in mat)mat.roughness=clamp(entry.paint.roughness,0,1);
      mat.needsUpdate=true;materials++;return mat;
     });
     mesh.material=Array.isArray(originalMat)?next:next[0];
     touched.add(mesh);meshes++;
    }
    if(nodes.size&&!meshes)throw Error('ARMOR_MESH_NOT_FOUND_'+entry.slot);
    result.push({slot:entry.slot,modifiedMeshes:meshes,modifiedMaterials:materials});
   }
   return {totalMeshes:touched.size,slots:result,sourceRigUntouched:true};
  }catch(e){restore();throw e}
 };
 return {apply,restore,originalCount:original.size};
}
