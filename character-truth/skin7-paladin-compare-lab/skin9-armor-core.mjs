// HIGHFLY SKIN 9-A — deterministic intent-to-recipe compiler for the REAL
// ClaudeCraft skinned armor. No fake AI or arbitrary-image-to-3D claims.
// The visible preview stays bounded; novel sculpt shapes go to Blender candidates.
import {commissionRecipe} from './commission-recipe-v2.mjs';
export const ARMOR_SCHEMA='highfly.skin9.armor-intent-recipe/1';
const KEYS=['head','chest','arms','hands','legs','feet','back'];
const DEFAULT={head:.91,chest:.97,arms:1.05,hands:.88,legs:.93,feet:.86,back:.89};
const THEMES=[
 ['dragon',/drag[oó]n|drac[oó]nic|wyvern|escamas|drag(?:on)?/i,{enamel:'#385348',metal:'#af8752',accent:'#dc7048'}],
 ['demon',/demon|infernal|diabl|abyss|abisal/i,{enamel:'#291e2b',metal:'#b87667',accent:'#e53b49'}],
 ['celestial',/celestial|angel|[áa]ngel|sagrad|divin|santo|holy/i,{enamel:'#dce8ef',metal:'#d8b76b',accent:'#70caee'}],
 ['royal',/rey|reina|real|imperial|corona|royal/i,{enamel:'#36304c',metal:'#d8b169',accent:'#c73f75'}],
 ['frost',/hielo|escarcha|glacial|nieve|[áa]rtic|frost/i,{enamel:'#b3d7e6',metal:'#d9eaf1',accent:'#64ccea'}],
 ['storm',/rayo|el[eé]ctric|tormenta|thunder|rel[aá]mpago/i,{enamel:'#25334b',metal:'#a9bed8',accent:'#ecc95d'}],
 ['nature',/bosque|hojas|druid|naturaleza|madera|forest/i,{enamel:'#344e3b',metal:'#a8956c',accent:'#9ccc78'}],
 ['samurai',/samur[aá]i|shogun|ronin|katana|oriental/i,{enamel:'#342c35',metal:'#c19c64',accent:'#a8444d'}],
 ['tech',/futurist|tecnol[oó]g|cibern[eé]tic|robot|mecha|sci.fi/i,{enamel:'#273a4b',metal:'#819cae',accent:'#42cced'}],
 ['shadow',/oscuro|sombr[íi]o|tinieblas|negro|shadow|night/i,{enamel:'#232631',metal:'#979ca9',accent:'#a44bb6'}],
 ['crystal',/cristal|gema|crystal|diamante|prism/i,{enamel:'#444274',metal:'#b2bfe0',accent:'#bb86e3'}],
 ['warrior',/guerrero|vikingo|b[aá]rbaro|berserker|brutal/i,{enamel:'#4e3932',metal:'#ac8f74',accent:'#de8151'}]
];
const FOCUS=[
 ['head',/casco|yelmo|visera|corona|cuernos|helmet|cabeza|m[aá]scara/i],
 ['chest',/pechera|torso|peto|coraza|chest|n[uú]cleo|coraz[oó]n/i],
 ['arms',/hombrera|hombro|brazal|pauldron|shoulder|ala(?:s)?/i],
 ['hands',/guante|mano|garras|gauntlet/i],
 ['legs',/pierna|rodilla|greba|rodillera/i],
 ['feet',/bota|pie|garra.*pie|boot/i],
 ['back',/espalda|capa|cola|aleta|plumas|dorsal|wing|back/i]
];
const COLORS=[['#171922',/negro|azabache|obsidiana/i],['#e1e5e9',/blanco|marfil|perla/i],
 ['#b83735',/rojo|carmes[ií]|escarlata/i],['#446fb2',/azul/i],['#477457',/verde/i],
 ['#d6a74e',/dorado|oro|gold/i],['#c4c9d0',/plateado|plata|silver/i],['#8d4eb0',/violeta|morado|p[uú]rpura/i],
 ['#47b6cd',/celeste|turquesa/i],['#ce783a',/naranja|cobre/i]];
const SHAPES={
 head:[['closed-visor',/cerrad|visor|sin mostrar rostro/i],['horned-helm',/cuerno|cornamenta|horn/i],
  ['crown',/corona|crown/i],['beaked',/pico|aviar|ave/i],['dragon-maw',/mand[ií]bula|fauces/i]],
 chest:[['heart-core',/n[uú]cleo|coraz[oó]n|gema|cristal/i],['segmented-plating',/placas|escamas|segmentad/i]],
 arms:[['wing-pauldron',/alas|plumas|ala plegad/i],['scale-pauldron',/escamas|drag[oó]n/i],
  ['oversized-pauldron',/gigante|enorme|colosal|masiv/i]],
 hands:[['claw-gauntlet',/garras|claws/i]],
 legs:[['layered-greaves',/escamas|placas|grebas/i]],
 feet:[['clawed-boots',/garras|drag[oó]n/i]],
 back:[['wing-back',/alas|wing/i],['spined-back',/espinas|aletas|placas dorsales/i],['mantle',/capa|manto/i]]
};
const clamp=n=>Math.round(Math.max(.15,Math.min(1.30,n))*100)/100;
function validatePalette(x){
 if(!x||Object.keys(x).sort().join()!=='accent,enamel,metal'||
   Object.values(x).some(v=>typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v)))
  throw new Error('Paleta no válida');
 return {...x};
}
export function parseArmorIntent(prompt,{imagePalette=null}={}){
 const brief=String(prompt??'').replace(/\s+/g,' ').trim();
 if(brief.length<12||brief.length>1000)throw new Error('Describí la armadura con 12 a 1000 caracteres');
 const themes=THEMES.filter(([,re])=>re.test(brief)).map(([name])=>name);
 const mood=/[ée]pic|imponente|gigantesc|enorme|colosal|legendari/i.test(brief)?'epic':
  /liger|elegante|sutil|delicad|minimal/i.test(brief)?'light':'balanced';
 const materials=['metal','enamel'];
 if(/hueso|[óo]seo/i.test(brief))materials.push('bone');
 if(/escamas/i.test(brief))materials.push('scales');
 if(/cristal|gema/i.test(brief))materials.push('crystal');
 if(/cuero|piel/i.test(brief))materials.push('leather');
 const focus=FOCUS.filter(([,re])=>re.test(brief)).map(([key])=>key);
 const slotShapes=Object.fromEntries(KEYS.map(k=>[k,SHAPES[k].filter(([,re])=>re.test(brief)).map(([s])=>s)]));
 const intensity={...DEFAULT};
 const baseMood=mood==='epic'?.10:mood==='light'?-.08:0;
 for(const k of KEYS){intensity[k]=clamp(intensity[k]+baseMood*.5+(focus.includes(k)?.095:0))}
 // The live preview uses only bounded geometry deformation. The slotShapes
 // above are authored intent for NEW native Blender topology, NOT present GLB meshes.
 const primary=THEMES.find(([k])=>k===themes[0]);
 const palette=primary?{...primary[2]}:{enamel:'#314f74',metal:'#d4a953',accent:'#70d5e6'};
 const explicit=COLORS.filter(([,re])=>re.test(brief)).map(([c])=>c);
 if(explicit.length){palette.enamel=explicit[0];if(explicit[1])palette.metal=explicit[1];if(explicit[2])palette.accent=explicit[2]}
 if(imagePalette)Object.assign(palette,validatePalette(imagePalette));
 return {
  schema:ARMOR_SCHEMA,brief,themes:themes.length?themes:['original-request'],mood,
  materials:[...new Set(materials)],focus,slotShapes,intensity,palette,
  sourceRig:'Rig_Medium',sourceBody:'ClaudeCraft native modular',nativeOriginalClips:22,
  imagePaletteUsed:!!imagePalette,
  previewMethod:'existing-eleven-skinned-meshes-bounded-preview',
  actualNewMeshRequired:KEYS.some(k=>slotShapes[k].length>0)||themes.length>0,
  confidence:{textKeywordsRecognized:themes.length+focus.length+KEYS.reduce((n,k)=>n+slotShapes[k].length,0),
    imageGeometryInterpretation:'not-supported',photoTo3D:'not-implemented'},
  artistApproved:false,gameDeployAllowed:false
 };
}
export function mutateArmorIntent(intent,operation){
 if(!intent||intent.schema!==ARMOR_SCHEMA)throw new Error('Receta SKIN 9 inválida');
 const allowed=['epic','dark','light','heavy','holy','ferocious','clean'];
 if(!allowed.includes(operation))throw new Error('Mutación desconocida');
 const result=structuredClone(intent);
 const delta=operation==='epic'||operation==='heavy'||operation==='ferocious'?.11:
  operation==='light'||operation==='clean'?-.10:0;
 result.intensity=Object.fromEntries(KEYS.map(k=>[k,clamp(result.intensity[k]+delta)]));
 if(operation==='dark'){result.palette.enamel='#22232e';result.palette.accent='#ab5267'}
 if(operation==='holy'){result.palette.enamel='#e2e4dd';result.palette.metal='#d5b767'}
 result.brief=(result.brief+' · mutación '+operation).slice(0,1000);
 result.mutation=operation;result.artistApproved=false;result.gameDeployAllowed=false;
 return result;
}
export function makeBlenderCandidate(intent){
 if(!intent||intent.schema!==ARMOR_SCHEMA||intent.artistApproved!==false||intent.gameDeployAllowed!==false)
   throw new Error('No se admite exportación aprobada automáticamente');
 const blender=commissionRecipe(intent.brief,{intensity:intent.intensity,palette:intent.palette});
 return {schema:'highfly.skin9.blender-candidate/1',sourceIntent:intent,
   // V2 runner currently builds its known shapes only. Novel slotShapes require
   // assistant-authored Blender modeling, weighting and human visual QA.
   executablePrototypeRecipe:blender,needsOriginalModelSculpt:true,
   status:'CANDIDATE_NOT_GENERATED',rig:'Rig_Medium',targetClips:22,
   artistApproved:false,gameDeployAllowed:false};
}
