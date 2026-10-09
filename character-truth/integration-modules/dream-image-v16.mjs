/**
 * V16 Image-to-Skin: real browser pixels -> transparent 2D reference analysis
 * -> existing V15 recipe/PBR/actual-skinned V14 GLB.
 * Not trained image recognition; visual shape identity requires an artist.
 */
import {createTextSkinRecipe,validateTextSkinRecipe} from './dream-recipe-v15.mjs';
import {validPremiumPaint,PREMIUM_PAINT_SCHEMA} from './premium-paint-v13.mjs';
export const IMAGE_SCHEMA='highfly.dream.image-reference/v16';
const hex=rgb=>'#'+rgb.map(c=>Math.max(0,Math.min(255,c)).toString(16).padStart(2,'0')).join('');
const near=(a,b)=>Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0));
const luma=a=>.2126*a[0]+.7152*a[1]+.0722*a[2];
const saturation=a=>(Math.max(...a)-Math.min(...a))/Math.max(...a,1);
function centerColor(img,x,y){
 const o=(y*img.width+x)*4;return [...img.data.slice(o,o+3)];
}
export function analyzeReferencePixels(img){
 if(!img||!Number.isInteger(img.width)||!Number.isInteger(img.height)||
    img.width<16||img.height<16||img.width*img.height>512*512||
    !img.data||img.data.length!==img.width*img.height*4)
  throw Error('V16_INVALID_IMAGE_BUFFER');
 const {width:w,height:h,data}=img;
 const corners=[centerColor(img,0,0),centerColor(img,w-1,0),
  centerColor(img,0,h-1),centerColor(img,w-1,h-1)];
 const bg=[0,1,2].map(k=>Math.round(corners.reduce((s,c)=>s+c[k],0)/4));
 const clusters=new Map(),bounds={x0:w,y0:h,x1:0,y1:0},bands=[0,0,0],rows=new Uint16Array(h);
 let visible=0,occupied=0;
 const stride=Math.max(1,Math.floor(Math.max(w,h)/250));
 for(let y=0;y<h;y+=stride)for(let x=0;x<w;x+=stride){
  const i=(y*w+x)*4;if(data[i+3]<48)continue;visible++;
  const rgb=[data[i],data[i+1],data[i+2]];
  if(near(rgb,bg)<34)continue;
  occupied++;bounds.x0=Math.min(bounds.x0,x);bounds.y0=Math.min(bounds.y0,y);
  bounds.x1=Math.max(bounds.x1,x);bounds.y1=Math.max(bounds.y1,y);
  bands[Math.min(2,Math.floor(y/h*3))]++;rows[y]++;
  const quant=rgb.map(c=>Math.min(255,Math.floor(c/24)*24+12));
  const k=quant.join(',');
  clusters.set(k,(clusters.get(k)||0)+1);
 }
 if(occupied<25||visible<40)throw Error('V16_NO_CLEAR_FOREGROUND_SILHOUETTE');
 const tones=[...clusters].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,count])=>({
  rgb:k.split(',').map(Number),count
 }));
 const dominant=tones.slice(0,8).map(x=>({...x,color:hex(x.rgb)}));
 const dark=dominant.filter(x=>luma(x.rgb)<160)[0]||dominant[0];
 const metallic=dominant.find(x=>luma(x.rgb)>155&&saturation(x.rgb)<.26)||dominant.find(x=>luma(x.rgb)>130)||dominant[0];
 const accent=dominant.filter(x=>saturation(x.rgb)>.30)
  .sort((a,b)=>saturation(b.rgb)-saturation(a.rgb))[0]||dominant[Math.min(1,dominant.length-1)];
 const palette={base:dark.color,trim:metallic.color,accent:accent.color};
 const imageOccupancy=occupied/Math.max(visible,1);
 return {schema:'highfly.image.pixel-analysis/v16',width:w,height:h,
  background:hex(bg),boundsNormalized:{
   x0:+(bounds.x0/w).toFixed(3),y0:+(bounds.y0/h).toFixed(3),
   x1:+(bounds.x1/w).toFixed(3),y1:+(bounds.y1/h).toFixed(3)},
  coverage:+imageOccupancy.toFixed(4),bands:bands.map(v=>+(v/occupied).toFixed(4)),
  dominant,palette,interpretation:'2d-pixels-and-foreground-heuristic-only',
  confidence:{palette:'approximate',silhouette:'2D background dependent',geometry:'unknown'}};
}
export function imageToSkinRecipe(analysis,catalog,notes='armadura de fantasia oscura'){
 if(!analysis||analysis.schema!=='highfly.image.pixel-analysis/v16'||
    !Array.isArray(analysis.dominant)||analysis.dominant.length<1||
    !analysis.palette||!['base','trim','accent'].every(k=>/^#[0-9a-f]{6}$/i.test(analysis.palette[k]||'')))
  throw Error('V16_REFERENCE_ANALYSIS_REQUIRED');
 const text=createTextSkinRecipe(notes.length>=12?notes:'armadura de fantasia oscura',catalog);
 const {base,trim,accent}=analysis.palette;
 const paints=text.paint.paints.map(p=>{
  const k=p.key;
  const color=/(?:RUNE|VIOLET|BAND|EMBLEM)/.test(k)?accent:
    /(?:EDGE|TRIM|BUCKLE|RIM|BRACER|GREAVE|SABATON)/.test(k)?trim:base;
  return {...p,color};
 });
 const recipe=validateTextSkinRecipe({...text,
  paint:validPremiumPaint({schema:PREMIUM_PAINT_SCHEMA,paints}),
  pending:[...text.pending,
   'Una imagen no revela partes ocultas, profundidad, rigging ni medidas fisicas.',
   'Paleta extraida por heuristicas RGB; no equivale a interpretacion visual semantica.',
   'Geometria no presente en Nightfall requiere modelado Blender separado.']
 },catalog);
 return {schema:IMAGE_SCHEMA,version:'16.0.0',analysis,textRecipe:recipe,
  geometryConfidence:'manual-review-required',newGeometryFabricated:false,
  realNativeGlbExportVia:'V14 bakeNativeShapeV14',sourceImageEmbedded:false};
}
