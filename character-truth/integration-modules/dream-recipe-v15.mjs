/**
 * HIGHFLY V15 - reproducible, deterministic Spanish Text to Skin.
 * This IS NOT an AI image generator and does not claim to forge arbitrary meshes.
 * Source catalog is read from the real Blender Nightfall GLB, never invented.
 */
import {forgedPaintKey,validPremiumPaint,PREMIUM_PAINT_SCHEMA} from './premium-paint-v13.mjs';
import {validPremiumShape,defaultShape,PREMIUM_SHAPE_SCHEMA} from './native-shape-v14.mjs';
import {inspectNightfallGlb} from './bake-nightfall-v13-1.mjs';
export const DREAM_V15_SCHEMA='highfly.dream.text-to-skin/v15';
const COLORS={negro:'#19141f',negra:'#19141f',grafito:'#28272d',
 blanco:'#eeeeef',blanca:'#eeeeef',plateado:'#c7c8d1',plateada:'#c7c8d1',
 plata:'#c7c8d1',violeta:'#8b5cf6',violetas:'#8b5cf6',
 morado:'#8b5cf6',morada:'#8b5cf6',rojo:'#9f243d',roja:'#9f243d',
 azul:'#2563eb',azuladas:'#2563eb',dorado:'#c7a35c',dorada:'#c7a35c',
 verde:'#367f60',verdes:'#367f60',hielo:'#acddea'};
const sorted=(a,b)=>a.localeCompare(b,'en');
export function catalogFromNightfallGlb(bytes){
 const glb=inspectNightfallGlb(bytes);
 if(!Array.isArray(glb.json.skins)||glb.json.skins.length<1)throw Error('V15_REAL_SKINNED_NIGHTFALL_REQUIRED');
 const counts=new Map();
 for(const n of glb.nodes){
  const name=n.name||glb.json.meshes[n.mesh]?.name||'';
  const key=forgedPaintKey(name);
  if(key)counts.set(key,(counts.get(key)||0)+1);
 }
 const catalog=[...counts].filter(([key,count])=>count===2).map(([key])=>key).sort(sorted);
 if(catalog.length<30)throw Error('V15_INCOMPLETE_TWO_GENDER_BLENDER_CATALOG');
 return catalog;
}
function norm(s){return s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
const has=(t,s)=>s.some(x=>new RegExp('(?:^|[^a-z])'+x+'(?:[^a-z]|$)','i').test(t));
function colors(t){
 const words=t.match(/#[0-9a-f]{6}|[a-z]+/g)||[],found=[];
 for(const w of words){
  const color=w.startsWith('#')?w:COLORS[w];
  if(color&&!found.includes(color))found.push(color);
 }
 return {base:found[0]||'#19141f',
  trim:found.find(c=>c==='#c7c8d1'||c==='#c7a35c')||'#c7c8d1',
  accent:found.find(c=>c==='#8b5cf6'||c==='#9f243d'||c==='#2563eb')||'#8b5cf6',
  explicit:found.length>0};
}
export function createTextSkinRecipe(description,catalog){
 if(typeof description!=='string'||description.trim().length<12||description.length>1800)
  throw Error('V15_DESCRIPTION_12_TO_1800_CHARS_REQUIRED');
 if(!Array.isArray(catalog)||catalog.length<30||catalog.some(x=>typeof x!=='string'))
  throw Error('V15_AUTHENTIC_MESH_CATALOG_REQUIRED');
 const allowed=new Set(catalog);
 if(allowed.size!==catalog.length)throw Error('V15_DUPLICATED_ORIGINAL_MESH_KEY');
 const text=norm(description),palette=colors(text);
 const oni=has(text,['oni','demon','demonio','samurai','kabuto']);
 const giant=has(text,['enorme','enormes','gigante','gigantes','masivas','sobredimensionadas']);
 const shoulders=has(text,['hombrera','hombreras','pauldron','hombros']);
 const segmented=has(text,['segmentado','segmentada','segmentadas','placas','pechera']);
 const horns=has(text,['cuerno','cuernos','asta','astas']);
 const mask=has(text,['mascara','casco','rostro','faceplate']);
 const designs=[...allowed].sort(sorted);
 const paint=designs.map(key=>{
  const decorative=/(?:EDGE|TRIM|BUCKLE|RIM|BRACER|GREAVE|SABATON)/.test(key);
  const rune=/(?:RUNE|VIOLET|BAND|EMBLEM)/.test(key);
  const color=rune?palette.accent:decorative?palette.trim:palette.base;
  return {key,color,metalness:decorative?.86:.65,roughness:decorative?.26:.4};
 });
 const shapes=giant&&shoulders?designs.filter(key=>key.includes('ARMS_PAULDRON')).map(key=>({
  ...defaultShape(key),width:1.22,height:1.18,depth:1.18
 })):[];
 const ingredients=[
  {piece:'Nightfall torso/brazos/piernas/espalda',source:'V12 Blender skinned',
   status:'implemented',method:'V13 PBR + V14 geometry bake'},
  {piece:'Hunter original',source:'ClaudeCraft Rig_Medium',
   status:'preserved',method:'Read-only source skeleton'}
 ];
 const pending=[];
 if(oni||mask){
  ingredients.push({piece:'Casco Oni/Kabuto',source:'Kage-Oni V6 Blender GLB',
   status:'existing-manual-fit',method:'V14.1 rigid inverse-bind attachment'});
  pending.push('Encastre y escala artisticos Kage-Oni pendientes; V15 no los presenta como resueltos.');
 }
 if(horns){
  pending.push('Color/material individual de cuernos sobre el casco Kage-Oni no esta conectado al pintor Nightfall.');
 }
 if(segmented){
  ingredients.push({piece:'Pechera y abdomen segmentados',
   source:'HFV12_CHEST_SEGMENTED_ABDOMEN y FAULD',status:'implemented',
   method:'Reutilizacion de mallas reales V12'});
 }
 if(!palette.explicit)pending.push('Paleta inferida por defecto, requiere aprobacion visual.');
 if(/ala|aleta|pluma|capa|cola|tentaculo|espina|alas/.test(text))
  pending.push('Detalles especiales fuera del catalogo V12 requieren forja Blender y validacion de pesos.');
 const out={
  schema:DREAM_V15_SCHEMA,version:'15.0.0',description:description.trim(),
  source:{kind:'Blender Nightfall V12',rig:'Rig_Medium',catalogKeys:designs.length,
    originalHunterMeshesBundled:false},
  palette,signals:{oni,giantShoulders:giant&&shoulders,segmented,horns,mask},
  paint:validPremiumPaint({schema:PREMIUM_PAINT_SCHEMA,paints:paint}),
  shape:validPremiumShape({schema:PREMIUM_SHAPE_SCHEMA,shapes}),
  ingredients,pending,capability:'deterministic-real-geometry-recipe-not-freeform-mesh-generation'
 };
 return validateTextSkinRecipe(out,catalog);
}
export function validateTextSkinRecipe(raw,catalog){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
   raw.schema!==DREAM_V15_SCHEMA||raw.version!=='15.0.0'||
   typeof raw.description!=='string'||raw.description.length>1800||
   raw.source?.rig!=='Rig_Medium'||raw.source?.catalogKeys!==catalog.length)
  throw Error('V15_RECIPE_SOURCE_IDENTITY_INVALID');
 const good=new Set(catalog);
 const paint=validPremiumPaint(raw.paint),shape=validPremiumShape(raw.shape);
 if(paint.paints.some(p=>!good.has(p.key))||shape.shapes.some(s=>!good.has(s.key)))
  throw Error('V15_RECIPE_REFERENCES_NONEXISTENT_REAL_MESH');
 if(!Array.isArray(raw.pending)||raw.pending.length>25||
    !Array.isArray(raw.ingredients)||raw.ingredients.length>25)
  throw Error('V15_RECIPE_WORK_ORDER_REJECTED');
 return {...raw,paint,shape};
}
