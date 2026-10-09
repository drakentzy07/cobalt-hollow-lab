/**
 * V14 true geometry authoring on only the authentic V8/V12 Nightfall
 * SkinnedMeshes. Non-destructive mesh-local vertex transforms: base
 * geometry + skinIndex/skinWeight remain untouched.
 *
 * Axis convention verified against original Blender GLB: X width,
 * Y vertical, Z depth. Offsets are world-bind local centimeters-scale.
 * Limited sculpt range prevents unbounded deformation.
 */
import {forgedPaintKey} from './premium-paint-v13.mjs';
export const PREMIUM_SHAPE_SCHEMA='highfly.skin.nightfall.shape/v14';
const AXES=['width','height','depth','x','y','z'];
const SHAPE_KEY=/^HFV(?:8|12)_(?:CHEST|ARMS|HANDS|LEGS|FEET|BACK)_[A-Z0-9_]+$/;
const LIMITS={width:[.75,1.35],height:[.75,1.35],depth:[.75,1.35],
 x:[-.08,.08],y:[-.08,.08],z:[-.08,.08]};
export function validPremiumShape(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.getPrototypeOf(raw)!==Object.prototype||
    raw.schema!==PREMIUM_SHAPE_SCHEMA||!Array.isArray(raw.shapes)||
    raw.shapes.length>80||Object.keys(raw).some(k=>!['schema','shapes'].includes(k)))
     throw Error('V14_SHAPE_SCHEMA_REJECTED');
 const used=new Set();
 return {schema:PREMIUM_SHAPE_SCHEMA,shapes:raw.shapes.map(s=>{
  if(!s||typeof s!=='object'||Array.isArray(s)||
    Object.getPrototypeOf(s)!==Object.prototype||
    Object.keys(s).some(k=>!['key',...AXES].includes(k))||
    !SHAPE_KEY.test(s.key||'')||used.has(s.key))throw Error('V14_SHAPE_KEY_REJECTED');
  used.add(s.key);
  const out={key:s.key};
  for(const a of AXES){
   const v=s[a],lo=LIMITS[a][0],hi=LIMITS[a][1];
   if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)
     throw Error('V14_SHAPE_AXIS_OUT_OF_RANGE_'+a);
   out[a]=+v.toFixed(4);
  }
  return out;
 })};
}
export const defaultShape=(key)=>({
 key,width:1,height:1,depth:1,x:0,y:0,z:0
});
export function vertexShape(p,center,shape){
 return [(p[0]-center[0])*shape.width+center[0]+shape.x,
         (p[1]-center[1])*shape.height+center[1]+shape.y,
         (p[2]-center[2])*shape.depth+center[2]+shape.z];
}
export function normalShape(n,shape){
 const v=[n[0]/shape.width,n[1]/shape.height,n[2]/shape.depth];
 const l=Math.hypot(...v);
 if(!l||!Number.isFinite(l))return [0,0,1];
 return v.map(x=>x/l);
}
export function createNativeShapeV14({getMeshes,THREE,redraw}){
 if(typeof getMeshes!=='function'||!THREE||typeof redraw!=='function')
  throw Error('V14_REAL_NATIVE_SHAPE_AUTHORITY_REQUIRED');
 let original=new Map(),last=[],selected=null,changes=new Map();
 const meshes=()=>getMeshes().filter(m=>m.isSkinnedMesh&&forgedPaintKey(m.name));
 function sync(){
  const current=meshes();
  if(!current.length)return;
  if(last.length===current.length&&last.every((m,i)=>m===current[i]))return;
  // Changing armor: release any old locally generated geometry only.
  for(const [mesh,geometry] of original)if(mesh.geometry!==geometry)mesh.geometry.dispose();
  original=new Map();
  for(const m of current)original.set(m,m.geometry);
  last=current.slice();
  changes.clear();selected=null;
 }
 function select(mesh){
  sync();
  if(!original.has(mesh))throw Error('V14_SELECT_NEW_FORGED_ARMOR_ONLY');
  selected=forgedPaintKey(mesh.name);
  return {key:selected,source:mesh.name};
 }
 function apply(shape,draw=true){
  sync();
  const validated=validPremiumShape({schema:PREMIUM_SHAPE_SCHEMA,shapes:[shape]}).shapes[0];
  const matches=last.filter(m=>forgedPaintKey(m.name)===validated.key);
  if(matches.length!==2)throw Error('V14_SHAPE_REQUIRES_TWO_NATIVE_GENDERS');
  for(const m of matches){
   const base=original.get(m),p=base?.getAttribute('position');
   const originalNormals=base?.getAttribute('normal');
   if(!p||!originalNormals||p.count!==originalNormals.count||p.count>5000)
    throw Error('V14_ORIGINAL_GEOMETRY_UNAVAILABLE');
   const g=base.clone(),pos=g.getAttribute('position'),n=g.getAttribute('normal');
   base.computeBoundingBox();
   const bounds=base.boundingBox;
   const center=[(bounds.min.x+bounds.max.x)/2,
     (bounds.min.y+bounds.max.y)/2,(bounds.min.z+bounds.max.z)/2];
   for(let i=0;i<pos.count;i++){
    const point=vertexShape([p.getX(i),p.getY(i),p.getZ(i)],center,validated);
    const norm=normalShape([originalNormals.getX(i),originalNormals.getY(i),
      originalNormals.getZ(i)],validated);
    pos.setXYZ(i,...point);n.setXYZ(i,...norm);
   }
   pos.needsUpdate=true;n.needsUpdate=true;
   g.computeBoundingBox();g.computeBoundingSphere();
   if(m.geometry!==base)m.geometry.dispose();
   m.geometry=g;
  }
  changes.set(validated.key,validated);
  if(draw)redraw();
  return {key:validated.key,changedMeshes:matches.length,sourceGeometryUntouched:true};
 }
 function reshape(settings){
  if(!selected)throw Error('V14_FIRST_SELECT_FORGED_PLATE');
  return apply({...defaultShape(selected),...settings,key:selected});
 }
 function reset(){
  for(const [m,source] of original){
   if(m.geometry!==source){m.geometry.dispose();m.geometry=source}
  }
  changes.clear();selected=null;redraw();
 }
 function recipe(){return validPremiumShape({schema:PREMIUM_SHAPE_SCHEMA,shapes:[...changes.values()]})}
 function restore(raw){
  const receipt=validPremiumShape(raw);
  sync();
  const available=new Set(last.map(m=>forgedPaintKey(m.name)));
  if(receipt.shapes.some(s=>!available.has(s.key)))throw Error('V14_UNKNOWN_NATIVE_FORGE_PART');
  reset();for(const shape of receipt.shapes)apply(shape,false);
  redraw();return recipe();
 }
 return Object.freeze({
  select,reshape,reset,recipe,restore,
  state:()=>({mounted:meshes().length===92,selected,modifiedPieces:changes.size,
     sourceMeshesPreserved:true,sourceSkinWeightsUntouched:true,
     geometryChangesLive:true,exportStatus:'separate GLB geometry baker'})
 });
}
