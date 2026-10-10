/**
 * HIGHFLY SKIN7 ARTISAN GEOMETRY ENGINE
 * Full 3D geometry editing; Blender authored topology remains source authority.
 * Both GPU preview and GLB export use the identical affine vertex transform.
 * Does NOT change source bones, original body, topology, JOINTS_0 or WEIGHTS_0.
 * No network, no image-generation claim. Additive to the frozen V20 studio.
 */
export const VERSION='skin7.artisan.1';
export const CONTROLS=Object.freeze({
 shoulderLeft:{label:'Hombrera izquierda · anchura',min:.72,max:1.5,step:.02,default:1},
 shoulderRight:{label:'Hombrera derecha · anchura',min:.72,max:1.5,step:.02,default:1},
 chestDepth:{label:'Pechera · volumen',min:.78,max:1.32,step:.02,default:1},
 waistFlare:{label:'Faldones · apertura',min:.78,max:1.48,step:.02,default:1},
 backDepth:{label:'Espalda · relieve',min:.78,max:1.32,step:.02,default:1},
 armThickness:{label:'Brazos · volumen',min:.8,max:1.32,step:.02,default:1},
 legThickness:{label:'Piernas · volumen',min:.8,max:1.32,step:.02,default:1},
 hornLength:{label:'Cuernos · altura',min:.7,max:1.6,step:.02,default:1}
});
export const GROUPS=Object.freeze(['HEAD','SHOULDER_L','SHOULDER_R','CHEST','WAIST','BACK','ARM','LEG']);
const keys=Object.keys(CONTROLS);
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export function defaults(){
 return {controls:Object.fromEntries(keys.map(k=>[k,CONTROLS[k].default])),
 visible:Object.fromEntries(GROUPS.map(g=>[g,true])),
 palette:{primary:'#a82739',trim:'#c6a05a',accent:'#25cce2'},
 title:'Armadura del Hunter'};
}
const isHex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
export function normalizeDesign(d){
 if(!d||typeof d!=='object')throw Error('SKIN7_DESIGN_REQUIRED');
 const base=defaults(),ret={controls:{},visible:{},palette:{},title:''};
 for(const [k,def] of Object.entries(CONTROLS)){
  let v=d.controls?.[k]??base.controls[k];
  if(typeof v!=='number'||!Number.isFinite(v))throw Error('SKIN7_CONTROL_NONFINITE_'+k);
  if(v<def.min||v>def.max)throw Error('SKIN7_CONTROL_OUT_OF_SAFE_RANGE_'+k);
  ret.controls[k]=+v.toFixed(3);
 }
 for(const k of GROUPS)ret.visible[k]=typeof d.visible?.[k]==='boolean'?d.visible[k]:true;
 for(const k of ['primary','trim','accent']){
  const val=d.palette?.[k]??base.palette[k];if(!isHex(val))throw Error('SKIN7_COLOR_INVALID_'+k);
  ret.palette[k]=val.toLowerCase();
 }
 ret.title=String(d.title??base.title).trim().slice(0,90);
 if(ret.title.length<3)throw Error('SKIN7_TITLE_REQUIRED');
 return ret;
}
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function recipeFromText(prompt){
 if(typeof prompt!=='string'||prompt.trim().length<12||prompt.length>1800)throw Error('SKIN7_PROMPT_INVALID');
 const t=normalize(prompt);
 const d=defaults();
 const set=(k,v)=>{d.controls[k]=clamp(v,CONTROLS[k].min,CONTROLS[k].max)};
 // A deliberately transparent rule-based STRUCTURAL recipe. Advanced freeform modeling
 // belongs in the Blender authoring stage, not fictitious browser "AI".
 if(/(gigante|enorme|masiva|ultra|xl|colosal)/.test(t)){
  if(/(izquierd|asimetr)/.test(t))set('shoulderLeft',1.38);
  else if(/derech/.test(t))set('shoulderRight',1.38);
  else {set('shoulderLeft',1.26);set('shoulderRight',1.26)}
 }
 if(/(asimetr|hombro izquierdo|hombrera izquierda)/.test(t)){
  set('shoulderLeft',1.38);set('shoulderRight',.87);
 }
 if(/(pechera|torso|pecho).*(heroic|grande|reforz|pesad|volumen)/.test(t))set('chestDepth',1.22);
 if(/(faldon|falda|kusazuri|tasset).*(largo|anch|capas|segmentad)/.test(t))set('waistFlare',1.28);
 if(/(espaldar|espalda|dorsal|guardia dorsal)/.test(t))set('backDepth',1.21);
 if(/(cuerno|horn).*(grande|gigante|alto|larg)/.test(t))set('hornLength',1.47);
 if(/(brazo|guantelet|brazal).*(grande|grueso|pesad)/.test(t))set('armThickness',1.22);
 if(/(pierna|greba).*(grande|grues|pesad)/.test(t))set('legThickness',1.18);
 if(/(azul|platead|guardian)/.test(t))d.palette={primary:'#202c46',trim:'#a5b6cb',accent:'#924ada'};
 if(/(rojo|carmesi|oni|samurai)/.test(t))d.palette={primary:'#a82739',trim:'#c6a05a',accent:'#25cce2'};
 d.title=/(samurai|oni)/.test(t)?'Crimson Tech Oni':/(guardian|caballero)/.test(t)?'Shadow Guardian':'Armadura original HIGHFLY';
 return normalizeDesign(d);
}
export function groupFor(name){
 if(typeof name!=='string'||!/^HF7_[MF]_/.test(name))return null;
 if(/_HEAD_/.test(name))return 'HEAD';
 if(/_SHOULDER_L_/.test(name))return 'SHOULDER_L';
 if(/_SHOULDER_R_/.test(name))return 'SHOULDER_R';
 if(/_CHEST_/.test(name))return 'CHEST';
 if(/_WAIST_/.test(name))return 'WAIST';
 if(/_BACK_/.test(name))return 'BACK';
 if(/_ARM_/.test(name))return 'ARM';
 if(/_LEG_/.test(name))return 'LEG';
 return null;
}
export function axesFor(name,d){
 const g=groupFor(name);
 const c=normalizeDesign(d).controls;
 if(g==='SHOULDER_L')return {sx:c.shoulderLeft,sy:1,sz:1};
 if(g==='SHOULDER_R')return {sx:c.shoulderRight,sy:1,sz:1};
 if(g==='CHEST')return {sx:1,sy:c.chestDepth,sz:1};
 if(g==='WAIST')return {sx:c.waistFlare,sy:1,sz:1};
 if(g==='BACK')return {sx:1,sy:c.backDepth,sz:1};
 if(g==='ARM')return {sx:c.armThickness,sy:c.armThickness,sz:1};
 if(g==='LEG')return {sx:c.legThickness,sy:c.legThickness,sz:1};
 if(g==='HEAD')return /_HORN_/.test(name)?{sx:1,sy:1,sz:c.hornLength}:{sx:1,sy:1,sz:1};
 return {sx:1,sy:1,sz:1};
}
function boundCenter(array,count,get){
 if(count<=0)throw Error('SKIN7_EMPTY_GEOMETRY');
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<count;i++){
  const a=get(i);for(let j=0;j<3;j++){min[j]=Math.min(min[j],a[j]);max[j]=Math.max(max[j],a[j])}
 }
 if(min.some(v=>!Number.isFinite(v)))throw Error('SKIN7_NONFINITE_GEOMETRY');
 return {min,max,center:min.map((x,i)=>(x+max[i])*.5)};
}
function update(x,c,s){
 return [c[0]+(x[0]-c[0])*s.sx,c[1]+(x[1]-c[1])*s.sy,c[2]+(x[2]-c[2])*s.sz];
}
export function transformPositions(src,name,design){
 if(!src||src.length%3!==0)throw Error('SKIN7_BAD_POSITIONS');
 const out=new Float32Array(src.length),s=axesFor(name,design),count=src.length/3;
 const {center,min,max}=boundCenter(src,count,i=>[src[3*i],src[3*i+1],src[3*i+2]]);
 // Waist extension keeps top attachment; horns remain anchored at base.
 const pivot=[...center];
 if(groupFor(name)==='HEAD'&&/_HORN_/.test(name))pivot[2]=min[2];
 for(let i=0;i<count;i++){
  const p=update([src[3*i],src[3*i+1],src[3*i+2]],pivot,s);
  for(let j=0;j<3;j++)out[i*3+j]=p[j];
 }
 return out;
}
export function transformNormals(src,name,design){
 const s=axesFor(name,design),out=new Float32Array(src.length);
 for(let i=0;i<src.length;i+=3){
  const a=src[i]/s.sx,b=src[i+1]/s.sy,c=src[i+2]/s.sz;
  const len=Math.hypot(a,b,c)||1;out[i]=a/len;out[i+1]=b/len;out[i+2]=c/len;
 }return out;
}
export function applyDesignToMeshes(meshes,design,baseline){
 const d=normalizeDesign(design);
 for(const mesh of meshes){
  const g=groupFor(mesh.name);if(!g)continue;
  const geo=mesh.geometry,pos=geo.getAttribute('position');
  const id=mesh.name;
  if(!baseline.has(id)){
   baseline.set(id,{pos:new Float32Array(pos.array),norm:geo.getAttribute('normal')?
    new Float32Array(geo.getAttribute('normal').array):null});
  }
  const base=baseline.get(id);
  pos.array.set(transformPositions(base.pos,id,d));pos.needsUpdate=true;
  const norm=geo.getAttribute('normal');
  if(norm&&base.norm){norm.array.set(transformNormals(base.norm,id,d));norm.needsUpdate=true;}
  geo.computeBoundingBox();geo.computeBoundingSphere();
  mesh.visible=d.visible[g];
 }
 return d;
}
export function compareGeometry(a,b,name,points){
 const first=transformPositions(points,name,a),other=transformPositions(points,name,b);
 let changed=0;for(let i=0;i<first.length;i++)if(Math.abs(first[i]-other[i])>1e-6)changed++;
 return changed;
}
const ENCODER=new TextEncoder(),DECODER=new TextDecoder();
const align4=x=>(x+3)&~3;
function glbParse(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<28||view.getUint32(0,true)!==0x46546c67||
    view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.length)
    throw Error('SKIN7_INVALID_GLB_HEADER');
 const jsonLen=view.getUint32(12,true);
 if(jsonLen<32||jsonLen>bytes.length-28||view.getUint32(16,true)!==0x4e4f534a)
    throw Error('SKIN7_INVALID_GLB_JSON');
 const doc=JSON.parse(DECODER.decode(bytes.subarray(20,20+jsonLen)).trim());
 const binStart=20+jsonLen;
 if(binStart+8>bytes.length||view.getUint32(binStart+4,true)!==0x004e4942)
    throw Error('SKIN7_MISSING_GLB_BINARY');
 const binLength=view.getUint32(binStart,true);
 if(binStart+8+binLength>bytes.length)throw Error('SKIN7_BAD_BIN_LENGTH');
 return {doc,bytes,newBin:new Uint8Array(bytes.subarray(binStart+8,binStart+8+binLength))};
}
function accessor(doc,bin,index){
 const acc=doc.accessors?.[index];const bv=doc.bufferViews?.[acc?.bufferView];
 if(!acc||!bv||acc.componentType!==5126||acc.type!=='VEC3'||!Number.isInteger(acc.count))
  throw Error('SKIN7_ACCESSOR_NOT_FLOAT_VEC3');
 if(bv.buffer!==0||acc.sparse)throw Error('SKIN7_UNSUPPORTED_INTERLEAVED_ACCESSOR');
 const stride=bv.byteStride||12;
 if(stride<12||stride%4)throw Error('SKIN7_UNSAFE_STRIDE');
 const begin=(bv.byteOffset||0)+(acc.byteOffset||0);
 if(begin<0||begin+Math.max(acc.count-1,0)*stride+12>bin.byteLength)
   throw Error('SKIN7_ACCESSOR_BIN_OUT_OF_RANGE');
 const view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 const data=new Float32Array(acc.count*3);
 for(let i=0;i<acc.count;i++)for(let j=0;j<3;j++)
  data[i*3+j]=view.getFloat32(begin+i*stride+j*4,true);
 return {acc,data,write(next){
  if(next.length!==data.length)throw Error('SKIN7_ACCESSOR_LENGTH_CHANGED');
  for(let i=0;i<acc.count;i++)for(let j=0;j<3;j++)
   view.setFloat32(begin+i*stride+j*4,next[i*3+j],true);
  const mm=boundCenter(next,acc.count,i=>[next[3*i],next[3*i+1],next[3*i+2]]);
  acc.min=mm.min;acc.max=mm.max;
 }};
}
function setColors(doc,name,d){
 // Original PBR palette is replaced on explicitly authored HF7 materials,
 // not original Nightfall source body materials. Keep same shader graph/skins.
 const pal=d.palette;
 const paletteFor=(n)=>{
  if(/GOLD|TRIM/i.test(n))return pal.trim;
  if(/ENERGY|NUCLEUS/i.test(n))return pal.accent;
  return pal.primary;
 };
 for(const m of doc.materials||[]){
  if(!/^HF7_/.test(m.name||''))continue;
  const color=paletteFor(m.name);
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
  if(!m.pbrMetallicRoughness)m.pbrMetallicRoughness={};
  m.pbrMetallicRoughness.baseColorFactor=[...rgb,1];
  if(/ENERGY|NUCLEUS/i.test(m.name))m.emissiveFactor=rgb;
 }
}
export function rewriteGlb(input,design){
 const d=normalizeDesign(design);
 const {doc,bytes,newBin}=glbParse(input);
 if(doc.asset?.version!=='2.0'||!Array.isArray(doc.skins)||!doc.skins.length)
  throw Error('SKIN7_RIGGED_GLB_REQUIRED');
 const edited=new Set(),hiddenNodes=new Set();
 for(let ni=0;ni<(doc.nodes||[]).length;ni++){
  const node=doc.nodes[ni],name=node.name||'',group=groupFor(name);
  if(!group||!Number.isInteger(node.mesh))continue;
  if(!d.visible[group])hiddenNodes.add(ni);
  const mesh=doc.meshes[node.mesh];
  if(!mesh)throw Error('SKIN7_GLTF_MESH_MISSING');
  for(const p of mesh.primitives){
   if(!Number.isInteger(p.attributes?.JOINTS_0)||!Number.isInteger(p.attributes?.WEIGHTS_0))
    throw Error('SKIN7_NEVER_EXPORT_UNSKINNED_ARMOR');
   const key=node.mesh+'/'+p.attributes.POSITION;
   if(edited.has(key))throw Error('SKIN7_SHARED_VERTEX_MESH_DIFFERENT_NODES');
   edited.add(key);
   const pos=accessor(doc,newBin,p.attributes.POSITION);
   pos.write(transformPositions(pos.data,name,d));
   if(Number.isInteger(p.attributes.NORMAL)){
    const norm=accessor(doc,newBin,p.attributes.NORMAL);
    norm.write(transformNormals(norm.data,name,d));
    // NORMAL is unit-vector field; don't leave obsolete bounds.
    delete norm.acc.min;delete norm.acc.max;
   }
  }
 }
 if(!edited.size)throw Error('SKIN7_NO_NEW_FORGED_MESHES_TO_EDIT');
 for(const node of doc.nodes||[]){
  if(Array.isArray(node.children))node.children=node.children.filter(n=>!hiddenNodes.has(n));
 }
 for(const scene of doc.scenes||[]){
  if(Array.isArray(scene.nodes))scene.nodes=scene.nodes.filter(n=>!hiddenNodes.has(n));
 }
 setColors(doc,'',d);
 doc.asset.generator='HIGHFLY SKIN7 Blender original authored topology / versioned artisan geometry editor';
 doc.extras={...(doc.extras||{}),highflySkin7:{
  schema:VERSION,design:d,modifiedOriginalBlenderAuthoredGeometry:true,
  sourceRigUnmodified:true,noGamePublication:true,editedPrimitives:edited.size,hiddenMeshNodes:hiddenNodes.size}};
 let json=ENCODER.encode(JSON.stringify(doc));
 const jsonPad=align4(json.length),binPad=align4(newBin.byteLength);
 const total=12+8+jsonPad+8+binPad;
 const out=new Uint8Array(total);const v=new DataView(out.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,total,true);
 v.setUint32(12,jsonPad,true);v.setUint32(16,0x4e4f534a,true);out.set(json,20);
 out.fill(32,20+json.length,20+jsonPad);
 const off=20+jsonPad;v.setUint32(off,binPad,true);v.setUint32(off+4,0x004e4942,true);
 out.set(newBin,off+8);
 return {bytes:out,report:{editedPrimitives:edited.size,hiddenParts:hiddenNodes.size,
   nativeSkinCount:doc.skins.length,editorGeometryExported:true,sourceRigUnmodified:true}};
}
