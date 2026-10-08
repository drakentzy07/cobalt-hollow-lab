/**
 * HIGHFLY / Skin Factory V3 — isolated NON-DESTRUCTIVE original armor molder.
 *
 * Translates ONLY the useful deformation controls of the old Skin Factory V2.
 * No old code, globals, copies of models, dependency on Sim state, or PF6 changes.
 * Base geometry is always retained by identity; every apply makes a fresh
 * clone of only named native Armor_* meshes. Can rollback to original refs.
 *
 * This is a PREVIEW shape transformation, NOT a production-validated skin.
 */
export const SHAPE_KEYS=Object.freeze(['width','length','depth','taper']);
export const SHAPE_SLOTS=Object.freeze(['head','chest','arms','hands','legs','feet','back']);
export const SHAPE_FAMILIES=Object.freeze(['knight','barbarian','druid','mage','paladin','ranger','rogue']);
export const SHAPE_LIMIT=0.70;
export const ZERO_SHAPE=Object.freeze({width:0,length:0,depth:0,taper:0});

const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
export function validShape(value){
 if(!isObject(value))throw Error('INVALID_SHAPE_OBJECT');
 const keys=Object.keys(value);
 if(keys.length!==4||keys.some(k=>!SHAPE_KEYS.includes(k)))throw Error('INVALID_SHAPE_KEYS');
 const out={};
 for(const k of SHAPE_KEYS){
  if(typeof value[k]!=='number'||!Number.isFinite(value[k])||
     Math.abs(value[k])>SHAPE_LIMIT)throw Error('SHAPE_OUT_OF_SAFE_BOUNDS_'+k);
  out[k]=Object.is(value[k],-0)?0:value[k];
 }
 return out;
}
export function shapeZero(x){const s=validShape(x);return SHAPE_KEYS.every(k=>s[k]===0)}
export function shapeProfile(value,slot){
 const s=validShape(value);
 if(!SHAPE_SLOTS.includes(slot))throw Error('UNKNOWN_SOURCE_SLOT');
 // Real geometry offsets normalized to native mesh bounds rather than world units.
 // Restrictions keep low-poly silhouette and animation safety conservative.
 return {...s,slot};
}
/** Identity-safe source node resolving; ancestor names needed for GLTF
 * scene node hierarchy; we do not scan all meshes and deform the body. */
const ancestorHas=(mesh,root,names)=>{
 for(let p=mesh;p;p=p.parent){
  if(names.has(p.name))return true;
  if(p===root)break;
 }
 return false;
};
/** Return source topology signatures for QA, with untouched weight bytes. */
export function meshTopology(mesh){
 const geometry=mesh.geometry;
 const pos=geometry?.getAttribute?.('position');
 if(!pos)throw Error('MESH_HAS_NO_GEOMETRY');
 const skinIdx=geometry.getAttribute('skinIndex');
 const skinWgt=geometry.getAttribute('skinWeight');
 const read=a=>{
  if(!a)return null;
  const source=a.isInterleavedBufferAttribute?a.data.array:a.array;
  return Array.from(source);
 };
 return {
  vertices:pos.count,indexCount:geometry.index?.count??0,
  morphTargets:geometry.morphAttributes?Object.keys(geometry.morphAttributes).sort():[],
  skinIndex:read(skinIdx),skinWeight:read(skinWgt),
  morphTargetsRelative:!!geometry.morphTargetsRelative,
  isSkinnedMesh:!!mesh.isSkinnedMesh,
  boneNames:mesh.isSkinnedMesh?mesh.skeleton?.bones?.map(b=>b.name)??[]:[]
 };
}
export function createNativeMolder(root){
 if(!root?.traverse)throw Error('INVALID_RIG_ROOT');
 const baseline=new Map();
 root.traverse(mesh=>{
  if((mesh.isMesh||mesh.isSkinnedMesh)&&mesh.geometry?.getAttribute?.('position'))
   baseline.set(mesh,mesh.geometry);
 });
 if(baseline.size<1)throw Error('NO_REAL_GEOMETRY');
 const restore=()=>{
  let count=0;
  for(const [mesh,g] of baseline){
   if(mesh.geometry!==g){mesh.geometry=g;count++}
  }
  return {restoredCount:count,allOriginalGeometryRestored:true};
 };
 const apply=(plan)=>{
  if(!Array.isArray(plan)||plan.length>7)throw Error('BAD_MOLD_PLAN');
  // Validate entire plan BEFORE changing even one mesh.
  const occupied=new Set(),entries=[];
  for(const row of plan){
   if(!isObject(row)||!SHAPE_SLOTS.includes(row.slot)||
      !SHAPE_FAMILIES.includes(row.set)||!Array.isArray(row.nodes))
     throw Error('INVALID_MOLD_SOURCE');
   if(occupied.has(row.slot))throw Error('DUPLICATE_MOLD_SLOT');
   occupied.add(row.slot);
   const allowed=row.nodes.every(n=>typeof n==='string'&&n.startsWith('Armor_'));
   if(!allowed)throw Error('NON_ARMOR_BODY_MOLD_FORBIDDEN');
   const shape=validShape(row.shape??ZERO_SHAPE);
   entries.push({...row,shape});
  }
  restore();
  let edited=0,vertices=0;
  const slotReports=[];
  try{
   for(const entry of entries){
    const {slot,set,nodes,shape}=entry;
    const names=new Set(nodes);
    if(!nodes.length||shapeZero(shape)){
     slotReports.push({slot,set,changed:0,vertices:0,sourceMissing:nodes.length===0});continue;
    }
    let count=0,slotVerts=0;
    for(const [mesh,original] of baseline){
     if(!ancestorHas(mesh,root,names))continue;
     // Verified native scene node names, never positional guesses.
     const clone=original.clone();
     const position=clone.getAttribute('position');
     if(!position||position.itemSize!==3)throw Error('NO_VEC3_POSITION');
     if(original.getAttribute('position')===position)throw Error('SOURCE_ATTRIBUTE_SHARED');
     if(!mesh.isSkinnedMesh)throw Error('ARMOR_PART_NOT_SKINNED');
     const {min,max}={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
     for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      if(![x,y,z].every(Number.isFinite))throw Error('SOURCE_VERTEX_NONFINITE');
      for(const [k,v] of [[0,x],[1,y],[2,z]]){
       min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);
      }
     }
     const center=min.map((x,j)=>(x+max[j])/2);
     const ranges=min.map((x,j)=>Math.max(1e-6,max[j]-x));
     for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      const ny=(y-min[1])/ranges[1],top=smooth((ny-.38)/.62),low=1-smooth((ny-.12)/.58);
      // Molder from V2 creative intent with deliberately tighter V3 safeguards.
      const sx=1+shape.width*.20*(.62+.38*top)-shape.taper*.14*low;
      let xx=center[0]+(x-center[0])*sx;
      let yy=center[1]+(y-center[1])*(1+shape.length*(slot==='back'?.25:.19));
      let zz=center[2]+(z-center[2])*(1+shape.depth*.18);
      if(slot==='head'&&z>center[2])zz+=(z-center[2])*shape.depth*.09*(.55+.45*top);
      if(['arms','hands','feet'].includes(slot))
       xx=center[0]+(xx-center[0])*(1+shape.width*.10-shape.taper*.06*low);
      if(![xx,yy,zz].every(Number.isFinite))throw Error('GENERATED_VERTEX_NONFINITE');
      position.setXYZ(i,xx,yy,zz);
     }
     position.needsUpdate=true;
     clone.computeBoundingBox();clone.computeBoundingSphere();
     clone.computeVertexNormals?.();
     // Original geometry pointer, index/weights/bones are never rewritten.
     mesh.geometry=clone;count++;slotVerts+=position.count;
    }
    if(!count)throw Error('SOURCE_ARMOR_NODES_NOT_FOUND_'+slot);
    edited+=count;vertices+=slotVerts;
    slotReports.push({slot,set,changed:count,vertices:slotVerts,sourceMissing:false});
   }
   return {changedMeshes:edited,changedVertices:vertices,slots:slotReports,
     originalGeometriesRetained:baseline.size,sourceRigUntouched:true};
  }catch(err){restore();throw err}
 };
 const state=()=>({
  currentCloned:[...baseline].filter(([m,g])=>m.geometry!==g).length,
  originalSourceCount:baseline.size
 });
 return {apply,restore,state,baselineEntries:()=>[...baseline]};
}
