/** HIGHFLY V20.1 — deterministic premium full-armor specification.
 * Not an LLM and does not infer hidden 3D geometry from 2D pixels.
 * Produces a safe, reproducible design contract used to recolor/export REAL V19 geometry.
 */
export const SCHEMA='highfly.supreme.armor/v20.1';
const choices={
 theme:[['samurai',['samurai','samurái','kabuto','ronin']],['oni',['oni','demonio','demoníaco','demonica']],['knight',['caballero','paladin','paladín','knight']],['dragon',['dragon','dragón','draconic']]],
 shoulder:[['asymmetric',['asimetr','izquierda','derecha','izquierdo','derecho']],['massive',['enorme','gigante','grande','masiva','xl','heroica']],['layered',['capas','segmentada','segmentado']]],
 helmet:[['horned',['cuernos','cuerno','astas','cuerno curvado']],['mask',['máscara','mascara','rostro','cara']],['kabuto',['kabuto','samurai','samurái']]],
 torso:[['core',['núcleo','nucleo','gema','cristal','reactor','brillante']],['plated',['pechera','coraza','placas','segmentada','blindaje']]],
 waist:[['fauld',['faldones','faldón','faldon','faulds','kusazuri','tassets']],['belt',['cinturón','cinturon','hebilla']]],
 back:[['mantle',['espalda','espaldar','capa','aletas','alas','manto']]],
 arms:[['gauntlets',['brazales','guanteletes','brazos','antebrazos']]],
 legs:[['greaves',['piernas','grebas','botas','rodilleras']]],
 accessory:[['katana',['katana','espada','sable']]]
};
const colors={
 red:['rojo','roja','carmesí','carmesi','escarlata','crimson'],
 black:['negro','negra','carbon','carbón','obsidiana','grafito'],
 gold:['dorado','dorada','oro','bronce'],
 silver:['plateado','plateada','plata','acero'],
 cyan:['cian','celeste','turquesa','cyan'],
 purple:['violeta','morado','morada','púrpura','purpura'],
 blue:['azul'],
 green:['verde'],
 white:['blanco','blanca']
};
const hex={red:'#ac2533',black:'#191622',gold:'#cba45e',silver:'#bbc5d7',cyan:'#36d9eb',purple:'#8b5cf6',blue:'#2968cc',green:'#3c9973',white:'#e6e9ec'};
const clean=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const has=(s,p)=>p.some(w=>clean(s).includes(clean(w)));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function paletteFromText(text){
 const hits=[];
 for(const [name,words] of Object.entries(colors)){
  const i=words.map(w=>clean(text).indexOf(clean(w))).filter(i=>i>=0).sort((a,b)=>a-b)[0];
  if(i!==undefined)hits.push({name,i});
 }
 hits.sort((a,b)=>a.i-b.i);
 const names=hits.map(x=>x.name);
 const primary=names[0]||'black';
 const trim=names.find(x=>['gold','silver','white'].includes(x)&&x!==primary)||'silver';
 const glow=names.find(x=>['cyan','purple','blue','green'].includes(x))||'purple';
 return {base:hex[primary],trim:hex[trim],accent:hex[glow],source:'explicit-text-or-default'};
}
export function validateRecipe(v){
 if(!v||v.schema!==SCHEMA||v.version!=='20.1.0'||v.rig!=='Rig_Medium'||
   v.originalBodyMeshesBundled!==false||v.generatedNewMeshes!==false)
  throw Error('V20_AUTHENTIC_SOURCE_OR_SCHEMA_MISMATCH');
 if(typeof v.prompt!=='string'||v.prompt.length<12||v.prompt.length>1800)
  throw Error('V20_DESCRIPTION_REQUIRED');
 if(!v.palette||!['base','trim','accent'].every(k=>/^#[0-9a-f]{6}$/i.test(v.palette[k]||'')))
  throw Error('V20_PALETTE_INVALID');
 if(!v.pieces||Object.keys(choices).some(k=>!Array.isArray(v.pieces[k])||
   v.pieces[k].length>4))throw Error('V20_PARTS_INVALID');
 if(!v.geometry||!Number.isFinite(v.geometry.shoulderScale)||
   v.geometry.shoulderScale<1||v.geometry.shoulderScale>1.12)
  throw Error('V20_BOUNDED_SHOULDER_GEOMETRY_ONLY');
 if(!['M','F','both'].includes(v.targetGender))throw Error('V20_SEX_INVALID');
 return v;
}
export function buildRecipe(prompt,{analysis=null,targetGender='both'}={}){
 if(typeof prompt!=='string'||prompt.trim().length<12||prompt.length>1800)
  throw Error('V20_TEXT_12_TO_1800_CHARS');
 const pieces={};
 for(const [slot,tags] of Object.entries(choices))
  pieces[slot]=tags.filter(([,words])=>has(prompt,words)).map(([name])=>name);
 const pal=paletteFromText(prompt);
 if(analysis!==null){
  if(analysis.schema!=='highfly.image.pixel-analysis/v16'||!analysis.palette||
     !['base','trim','accent'].every(k=>/^#[0-9a-f]{6}$/i.test(analysis.palette[k]||'')))
   throw Error('V20_IMAGE_PIXEL_ANALYSIS_NOT_VALID');
  Object.assign(pal,{...analysis.palette,source:'V16-heuristic-pixels-plus-user-description'});
 }
 const big=pieces.shoulder.includes('massive');
 const shape=pieces.shoulder.includes('asymmetric')?'asymmetric':'symmetric';
 const recipe={schema:SCHEMA,version:'20.1.0',name:'HIGHFLY Supreme Armor',prompt:prompt.trim(),
   rig:'Rig_Medium',targetGender,originalBodyMeshesBundled:false,
   sourceGeometry:'HFV8/HFV12 Nightfall + 32 HFV19 original Blender-authored meshes',
   generatedNewMeshes:false,geometry:{
    shoulderScale:big?1.10:1,
    shoulderProfile:shape,
    authoredOverlayCount:32,
    actualGeometryScope:'bound scale of existing genuine Blender weighted armor, not arbitrary new mesh'
   },pieces,palette:pal,
   implementation:{
    ready:['real V19 skinned ornaments','Nightfall V12 armor','PBR materials',
      'actual GLB recolor export','bounded shoulder scale'],
    requiresNextForge:['custom helmet/horns from supplied reference','full adaptive geometry from image',
      'asymmetric independent shoulder sculpting','real physical Samsung and Unity gate',
      'mesh intersection/clipping certification']},
   confidence:{textKeywords:'rule-based',imageSemantics:analysis?'not inferred; use written notes':'not supplied',
    colors:analysis?'heuristic sampled pixels':'explicit text/default',geometry:'preauthored V19 only'}
 };
 return validateRecipe(recipe);
}
/** Safe GLB material and rigged-mesh-node transformation: binary vertex and skeleton buffers unchanged. */
export function styleGlb(bytes,recipe){
 validateRecipe(recipe);
 const buf=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 if(buf.byteLength<12000||buf.byteLength>9000000)throw Error('V20_GLB_BINARY_SIZE_REJECTED');
 const view=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||
   view.getUint32(8,true)!==buf.length)throw Error('V20_INVALID_GLB_HEADER');
 const txtLen=view.getUint32(12,true),typ=view.getUint32(16,true);
 if(typ!==0x4e4f534a||txtLen>buf.length-20)throw Error('V20_BAD_JSON_CHUNK');
 const doc=JSON.parse(new TextDecoder().decode(buf.subarray(20,20+txtLen)).trim());
 if(!Array.isArray(doc.nodes)||!Array.isArray(doc.meshes)||!Array.isArray(doc.materials)||
    !Array.isArray(doc.skins))throw Error('V20_REAL_RIGGED_GLB_REQUIRED');
 const toLinear=c=>{const x=parseInt(c,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
 const rgba=h=>[toLinear(h.slice(1,3)),toLinear(h.slice(3,5)),toLinear(h.slice(5,7)),1];
 const newMats=new Map();
 let affected=0,scaled=0;
 for(const node of doc.nodes){
  if(node.mesh===undefined)continue;
  const name=node.name||doc.meshes[node.mesh]?.name||'';
  if(!/^HFV(?:8|12|19)_[MF]_(?:CHEST|BACK|ARMS|HANDS|LEGS|FEET)_/.test(name))continue;
  const role=/(?:RUNE|VIOLET|HEART|EMBER|STITCH)/.test(name)?'accent':
   /(?:EDGE|TRIM|BRACER|CUISSE_VIOLET_BAND|BUCKLE|SILVER|CRESCENT|SPIKE|GREAVE|SABATON)/.test(name)?'trim':'base';
  const mesh=doc.meshes[node.mesh];
  if(!mesh?.primitives?.length)throw Error('V20_BROKEN_WEIGHTED_GEOMETRY');
  for(const p of mesh.primitives){
   if(p.material===undefined)continue;
   const old=doc.materials[p.material];
   if(!old)throw Error('V20_MISSING_ORIGINAL_MATERIAL');
   const key=p.material+':'+role;
   if(!newMats.has(key)){
    const m=JSON.parse(JSON.stringify(old));
    m.name='HFV20_'+role+'_'+p.material;
    m.pbrMetallicRoughness??={};
    m.pbrMetallicRoughness.baseColorFactor=rgba(recipe.palette[role]);
    m.pbrMetallicRoughness.metallicFactor=role==='base'?.77:.82;
    m.pbrMetallicRoughness.roughnessFactor=role==='base'?.32:.24;
    delete m.pbrMetallicRoughness.baseColorTexture;
    if(role==='accent'){m.emissiveFactor=rgba(recipe.palette.accent).slice(0,3).map(v=>v*.22);delete m.emissiveTexture}
    const idx=doc.materials.push(m)-1;newMats.set(key,idx);
   }
   // A glTF mesh can be instanced; this GLB's weighted Nightfall parts must not be instanced
   // across different roles. Their names are original distinct exported Blender pieces.
   p.material=newMats.get(key);affected++;
  }
  if(/^HFV19_[MF]_ARMS_DRAGON_SPIKE_/.test(name)&&recipe.geometry.shoulderScale>1){
   const mult=recipe.geometry.shoulderScale;
   const prior=node.scale||[1,1,1];
   node.scale=prior.map(x=>Math.max(.01,Math.min(2,x*mult)));
   scaled++;
  }
 }
 if(affected<60||scaled>8)throw Error('V20_EXPECTED_REAL_V19_WITH_NIGHTFALL');
 doc.asset??={version:'2.0'};
 doc.asset.generator='HIGHFLY V20.1 safely restyled existing Nightfall V12 and original Blender V19';
 const jsonBytes=new TextEncoder().encode(JSON.stringify(doc));
 const pad=(4-jsonBytes.length%4)%4;
 const rest=buf.subarray(20+txtLen);
 const total=12+8+jsonBytes.length+pad+rest.length;
 if(total>11000000)throw Error('V20_STYLED_BINARY_EXCEEDS_LIMIT');
 const dst=new Uint8Array(total);const dv=new DataView(dst.buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,total,true);
 dv.setUint32(12,jsonBytes.length+pad,true);dv.setUint32(16,0x4e4f534a,true);
 dst.set(jsonBytes,20);dst.fill(32,20+jsonBytes.length,20+jsonBytes.length+pad);
 dst.set(rest,20+jsonBytes.length+pad);
 return {bytes:dst,summary:{affectedPrimitives:affected,newMaterials:newMats.size,
    shoulderNodesScaled:scaled,originalBodyMeshesCopied:false,sourceRigPreserved:true,
    generatedNewMeshes:false}};
}
