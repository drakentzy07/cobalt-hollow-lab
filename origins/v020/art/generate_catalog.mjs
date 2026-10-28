#!/usr/bin/env node
// HIGHFLY Art Lab: source-derived 253-icon catalog. No source images copied.
// Original CraftPix images are not licensed to HIGHFLY.
import {readFileSync,writeFileSync,statSync,existsSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
const root=resolve(process.argv[2]||"upstream");
const output=resolve(fileURLToPath(new URL(".",import.meta.url)));
const sharp=createRequire(join(root,"package.json"))("sharp");
const classes=["warrior","paladin","hunter","rogue","priest","shaman","mage","warlock","druid"];
const es={warrior:"Guerrero",paladin:"Paladín",hunter:"Cazador",rogue:"Pícaro",priest:"Sacerdote",shaman:"Chamán",mage:"Mago",warlock:"Brujo",druid:"Druida"};
const hue={physical:"acero y ámbar",fire:"rojo y cobre",frost:"cian y blanco hielo",arcane:"azul y violeta",shadow:"malva y púrpura oscuro",holy:"marfil y oro",nature:"turquesa y verde"};
function json(p){return JSON.parse(readFileSync(join(root,p),"utf8"));}
function quote(x){return '"'+String(x==null?"":Array.isArray(x)?x.join(";"):x).replaceAll('"','""')+'"';}
function md(x){return String(x||"").replaceAll("|","\\|").replaceAll("\n"," ");}
function code(s){return String.fromCharCode(96)+s+String.fromCharCode(96);}
function getAbilityData(){
 const src=readFileSync(join(root,"src/sim/content/classes.ts"),"utf8");
 const start=src.indexOf("export const ABILITIES:");
 const positions=[...src.slice(start).matchAll(/^  ([a-z][a-z_0-9]*): \{\s*$/gm)].map(m=>({id:m[1],at:start+m.index}));
 const out={};
 for(let i=0;i<positions.length;i++){
  const body=src.slice(positions[i].at,positions[i+1]?.at);
  const v=k=>new RegExp("^    "+k+":\\s*['\"]([^'\"\\n]+)['\"]","m").exec(body)?.[1]||"";
  const cut=body.indexOf("    ranks:");
  const fx=[...body.slice(0,cut>0?cut:850).matchAll(/type:\s*'([a-zA-Z_0-9]+)'/g)].map(x=>x[1]);
  out[positions[i].id]={name:v("name"),school:v("school"),desc:v("description"),learnLevel:Number(/^\s*learnLevel:\s*(\d+)/m.exec(body)?.[1]||0),effects:[...new Set(fx)]};
 }
 return out;
}
function skillConcept(name,id,school){
 const v=(name+" "+id).toLowerCase();
 const kinds=[
 [/heal|mend|renew|rejuven|regrowth/,"manos radiantes sanando una herida"],
 [/summon|demon|imp|ritual/,"sello y portal de invocación"],
 [/shield|barrier|armor|ward|defensive|fortitude|protect/,"escudo o armadura envuelta en una barrera"],
 [/fire|flame|cinder|ember|pyro|immolate|scorch/,"llama en movimiento y brasas dinámicas"],
 [/frost|ice|blizzard|freeze|snow/,"cristal de hielo con estela de escarcha"],
 [/lightning|thunder|storm|shock|bolt/,"relámpago y grietas de energía"],
 [/poison|venom|sting|serpent|toxic/,"gota venenosa y colmillo"],
 [/curse|fear|drain|shadow|corrupt|agony|doom/,"glifo oscuro que expulsa bruma"],
 [/stealth|vanish|evasion|sneak|invis/,"máscara oculta tras humo"],
 [/bear|cat_form|wolf|travel_form|feral/,"silueta animal espiritual"],
 [/shot|arrow|aimed|bow/,"punta de flecha atravesando el aire"],
 [/strike|slash|rend|cleave|execute|stab|backstab|eviscerate|maul/,"arma o golpe con corte de energía"],
 [/charge|dash|rush|sprint|speed/,"líneas cinéticas de un avance veloz"],
 [/shout|roar|cry|taunt|scream/,"ondas concéntricas que irradian potencia"],
 [/aura|blessing|seal|mark|aspect/,"sello de aura radial"],
 [/root|thorn|entang|bloom/,"raíces en espiral y espinas brillantes"]
 ];
 const motif=kinds.find(x=>x[0].test(v))?.[1]||"símbolo de combate fantástico específico de la habilidad";
 return "Ilustración HIGHFLY ORIGINAL para «"+name+"»: "+motif+". Gama cromática "+(hue[school]||"azul petróleo y plata")+". Elemento central único, lectura inmediata, pintura digital volumétrica, ninguna imagen existente como referencia visual.";
}
function itemConcept(name,pack,id){
 const s=(name+" "+id).toLowerCase();
 const kinds=[
 [/bread|roll|meat|venison|salt|ration|fish|stew/,"alimento medieval sobre fondo libre"],
 [/ore|ingot|bar|nugget|plate|metal|iron|copper|silver|gold/,"mineral o lingote con superficie texturada"],
 [/hide|pelt|leather|fur|fang|tusk|claw|scale|bone/,"trofeo de caza o material orgánico"],
 [/potion|elixir|flask|water|vial|essence|oil/,"frasco alquímico con contenido"],
 [/herb|flower|leaf|mushroom|wood|log|root/,"hierba o recurso vegetal"],
 [/rune|sigil|cipher|scroll|book|letter|ledger|order|summons/,"pergamino, sello o documento fantástico"],
 [/gem|pearl|shard|crystal|dust|ember/,"gema o fragmento de mineral mágico"],
 [/key|keystone|token|coin|ward|stone/,"amuleto o artefacto de misión"]
 ];
 return "Objeto HIGHFLY ORIGINAL «"+name+"»: "+(kinds.find(x=>x[0].test(s))?.[1]||"objeto medieval reconocible")+"; familia de catálogo «"+pack+"». Vista en 3/4, silueta distinta, textura tangible y un solo elemento, sin copiar la ilustración previa.";
}
const ability=getAbilityData(),records=[];
async function add(meta) {
 const real=join(root,meta.path);
 if(!existsSync(real))throw Error("Original path missing: "+meta.path);
 const img=await sharp(real).metadata();
 const bytes=statSync(real).size;
 records.push({...meta,n:records.length+1,width:img.width,height:img.height,format:img.format,bytes,sha256Original:createHash("sha256").update(readFileSync(real)).digest("hex"),status:"PENDIENTE_ARTE_NUEVO"});
}
for(const klass of classes){
 const manifest=json("public/ui/skills/"+klass+"/mapping.json");
 if(manifest.iconSize!==128||!String(manifest.license).includes("CraftPix"))throw Error("Unexpected mapping: "+klass);
 for(const entry of manifest.abilities){
  const a=ability[entry.abilityId]||{},name=a.name||entry.abilityId.replaceAll("_"," ");
  await add({type:"skill",family:klass,familyEs:es[klass],id:entry.abilityId,displayName:name,path:"public/ui/skills/"+klass+"/"+entry.output,filename:entry.output,contractSize:128,originalSourcePack:entry.sourcePack||"",originalSourceFile:entry.sourceFile||"",category:a.school||"no identificada",descriptionInGame:a.desc||"",effects:a.effects||[],unlockLevel:a.learnLevel||null,newArtBrief:skillConcept(name,entry.abilityId,a.school)});
 }
}
const items=json("public/ui/items/mapping.json");
if(items.iconSize!==128||!String(items.license).includes("CraftPix"))throw Error("Unexpected item mapping");
for(const entry of items.entries){
 await add({type:"item",family:"items",familyEs:"Inventario",id:entry.itemId,displayName:entry.name,path:"public/ui/items/"+entry.itemId+".webp",filename:entry.itemId+".webp",contractSize:128,originalSourcePack:entry.sourcePack||"",originalSourceFile:entry.sourceFile||"",category:entry.sourcePack||"no identificada",descriptionInGame:"",effects:[],unlockLevel:null,newArtBrief:itemConcept(entry.name,entry.sourcePack,entry.itemId)});
}
if(records.length!==253 || records.filter(r=>r.type==="skill").length!==152 || records.filter(r=>r.type==="item").length!==101)throw Error("253 = 152 + 101 invariant violated");
const unique=new Set(records.map(r=>r.path));
if(unique.size!==253)throw Error("Duplicate filenames");
const dim={};for(const r of records){const k=r.width+"x"+r.height+" "+r.format;dim[k]=(dim[k]||0)+1;}
const totalSize=records.reduce((s,r)=>s+r.bytes,0);
let head=[
"# HIGHFLY ORIGIN 0.20 — Catálogo de sustitución de 253 imágenes",
"",
"**Fuente comprobada:** levy-street/world-of-claudecraft v0.20.0, commit 4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25.",
"",
"**152 iconos de skills + 101 de ítems**. Todos existen físicamente y están vinculados al mapping.json original.",
"Contrato de tamaño de todos los mappings: **128 × 128 px**. Verificación BINARIA con Sharp: **"+Object.entries(dim).map(x=>x[0]+": "+x[1]).join("; ")+"**.",
"Peso combinado de archivos originales (no objetivo de los reemplazos): "+(totalSize/1024).toFixed(1)+" KiB.",
"",
"**AVISO:** Los íconos originales fueron comprados por Levy Street bajo licencia CraftPix y NO se distribuyen en este repositorio. Todas las propuestas visuales son conceptos NUEVOS creados desde la semántica, NO descripciones o copias del arte restringido.",
"",
"Cada icono nuevo debe exportarse como maestro PNG 512×512 y final WebP 128×128, respetando exactamente path, nombre e ID. Evitar letras, logos, marcos UI, marcas de agua; una silueta central y lectura a 48 px.",
"",
];
const tableHeader="| # | ID | Nombre verdadero / significado | Escuela o familia | Propuesta de aspecto HIGHFLY original | Tamaño real | Path de reemplazo |";
const tableDivider="|---:|---|---|---|---|---|---|";
const line=r=>"| "+r.n+" | "+code(r.id)+" | "+md(r.displayName)+" | "+md(r.category)+" | "+md(r.newArtBrief)+" | "+r.width+"×"+r.height+" "+r.format+" | "+code(r.path)+" |";
head.push("## SKILLS (152)","");
for(const klass of classes){
 const list=records.filter(r=>r.family===klass);
 head.push("### "+es[klass]+" ("+list.length+")","",tableHeader,tableDivider,...list.map(line),"");
}
head.push("## ITEMS (101)","",tableHeader,tableDivider,...records.filter(r=>r.type==="item").map(line),"");
head.push("## Interpretación del documento","","- Los nombres de habilidades se tomaron del código de clases cuando estaba disponible: el ID no siempre es el nombre visible. No cambiar IDs para la integración.","- La columna escuela se deriva del código; la familia de ítems se deriva de los manifiestos de procedencia gráfica, no es necesariamente una categoría de gameplay.","- El texto «Propuesta de aspecto» NO describe los píxeles de CraftPix: es una consigna para crear un diseño legalmente independiente.","- Otras imágenes, monstruos, audio, panoramas y logos requieren una auditoría separada. Este trabajo solo abarca estos 253 iconos.","");
const keys=["n","type","family","familyEs","id","displayName","path","filename","contractSize","width","height","format","bytes","sha256Original","category","unlockLevel","effects","descriptionInGame","originalSourcePack","originalSourceFile","newArtBrief","status"];
const csv="\ufeff"+keys.join(",")+"\n"+records.map(r=>keys.map(k=>quote(r[k])).join(",")).join("\n")+"\n";
const jsonOut=JSON.stringify({project:"HIGHFLY ORIGIN",version:"v0.20.0",sourceCommit:"4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25",totals:{all:253,skills:152,items:101,totalSourceBytes:totalSize},physicalDimensions:dim,records},null,2)+"\n";
writeFileSync(join(output,"CATALOGO_253.md"),head.join("\n"));
writeFileSync(join(output,"ICONOS_253.csv"),csv);
writeFileSync(join(output,"ICONOS_253.json"),jsonOut);
console.log(JSON.stringify({total:records.length,dimensions:dim,bytes:totalSize,files:["CATALOGO_253.md","ICONOS_253.csv","ICONOS_253.json"]},null,2));
