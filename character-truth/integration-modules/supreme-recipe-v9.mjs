/**
 * HIGHFLY Skin Studio V9 — strict external-AI-to-forge boundary.
 * An AI or UI may suggest a design plan; it CANNOT run Python/JS or directly
 * mutate the Hunter, nor falsely claim unsupported geometry was fabricated.
 * Read-only design intent only; v6/v8 own the actual GLB builders.
 */
export const SUPREME_SCHEMA='highfly.skin.designer/v9';
export const ORIGINAL_REVISION='9b57e49c9676d75962700f828cc00a50a9a988b5';
export const RIG='Rig_Medium';
const exact=(input,allowed)=>Object.keys(input).every(k=>allowed.includes(k));
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const ALLOWED_STYLES=['nightfall','samurai','ninja','ronin','sunraku-inspired','original'];
const ALLOWED_HEAD=['kage-oni','none','new-design-needed'];
const ALLOWED_BODY=['nightfall','new-design-needed'];
const VARIANTS=['male','female','both'];
const COLOR=/^#[0-9a-f]{6}$/i;
const SLOTS=Object.freeze(['head','chest','arms','hands','legs','feet','back']);
const DEFAULT=Object.freeze({
 schema:SUPREME_SCHEMA,rig:RIG,sourceRevision:ORIGINAL_REVISION,
 style:'nightfall',variant:'both',
 head:'kage-oni',body:'nightfall',
 colors:{primary:'#101118',accent:'#8b5cf6',trim:'#919da6'},
 requestedSlots:[...SLOTS],brief:'Armadura Nightfall completa con casco Kage-Oni'
});
export function validSupremeDesign(input){
 if(!plain(input)||!exact(input,['schema','rig','sourceRevision','style','variant',
   'head','body','colors','requestedSlots','brief']))throw Error('SUPREME_DESIGN_UNSAFE_OBJECT');
 if(input.schema!==SUPREME_SCHEMA||input.rig!==RIG||
   input.sourceRevision!==ORIGINAL_REVISION)throw Error('SUPREME_SOURCE_MISMATCH');
 if(!ALLOWED_STYLES.includes(input.style)||!VARIANTS.includes(input.variant)||
   !ALLOWED_HEAD.includes(input.head)||!ALLOWED_BODY.includes(input.body))throw Error('UNSUPPORTED_DESIGN');
 if(!plain(input.colors)||!exact(input.colors,['primary','accent','trim'])||
    !['primary','accent','trim'].every(k=>COLOR.test(input.colors[k]||'')))
   throw Error('INVALID_COLOR_PALETTE');
 if(!Array.isArray(input.requestedSlots)||input.requestedSlots.length<1||
   input.requestedSlots.length>7||new Set(input.requestedSlots).size!==input.requestedSlots.length||
   input.requestedSlots.some(s=>!SLOTS.includes(s)))throw Error('INVALID_ARMOR_SLOTS');
 if(typeof input.brief!=='string'||input.brief.length<1||input.brief.length>600||
   /[\u0000-\u001f\u007f]/.test(input.brief))throw Error('UNSAFE_BRIEF');
 const standardized={
  schema:SUPREME_SCHEMA,rig:RIG,sourceRevision:ORIGINAL_REVISION,
  style:input.style,variant:input.variant,head:input.head,body:input.body,
  colors:Object.fromEntries(['primary','accent','trim'].map(k=>[k,input.colors[k].toLowerCase()])),
  requestedSlots:[...input.requestedSlots],brief:input.brief.trim()
 };
 return Object.freeze(standardized);
}
function words(x){return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
export function spanishDesignBrief(prompt){
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>600||
   /[\u0000-\u001f\u007f]/.test(prompt))throw Error('BRIEF_REJECTED');
 const t=words(prompt),x=JSON.parse(JSON.stringify(DEFAULT));
 x.brief=prompt.trim();
 x.style=/sunraku/.test(t)?'sunraku-inspired':
   /nightfall/.test(t)?'nightfall':
   /samurai|ronin|oni|kabuto/.test(t)?'samurai':
   /ninja|shinobi/.test(t)?'ninja':'original';
 x.head=/sin (?:casco|mascara)|cabeza libre/.test(t)?'none':
   /oni|kage|kabuto/.test(t)?'kage-oni':'new-design-needed';
 x.body=/nightfall/.test(t)?'nightfall':'new-design-needed';
 x.variant=/solo (?:mujer|femenino)|para mujer|version femenina/.test(t)?'female':
   /solo (?:hombre|masculino)|para hombre|version masculina/.test(t)?'male':'both';
 if(/\bvioleta|\bpurpura|\bviolet/.test(t))x.colors.accent='#8b5cf6';
 if(/\broj[oa]|\bcarmesi/.test(t))x.colors.accent='#a01d38';
 if(/\bverde/.test(t))x.colors.accent='#287d66';
 if(/\bblanc[oa]/.test(t))x.colors.primary='#dddde2';
 if(/\bnegra|\bnegro|\boscura/.test(t))x.colors.primary='#101118';
 // Do not convert "quiero una capa" into a falsely implemented simulated cloak.
 return validSupremeDesign(x);
}
export function readiness(plan){
 const x=validSupremeDesign(plan);
 const limitations=[];
 if(x.head==='new-design-needed')limitations.push('NUEVO_CASCO_3D_PENDIENTE');
 if(x.body==='new-design-needed')limitations.push('NUEVA_ARMADURA_CORPORAL_3D_PENDIENTE');
 if(x.head==='kage-oni'&&x.body==='nightfall')
  limitations.push('COMBINAR_EXPORTS_V6_V8_Y_VALIDAR_BIND_PENDIENTE');
 limitations.push('RENDER_3D_Y_APROBACION_VISUAL_PENDIENTE');
 limitations.push('CLIPPING_ANIMACIONES_Y_UNITY_IMPORT_PENDIENTE');
 limitations.push('PRUEBA_FISICA_S23_PENDIENTE');
 return Object.freeze({
  designOnly:true,generatedGeometry:false,aiModelConnected:false,
  blenderScriptAuthority:false,gameWritable:false,
  headExisting:x.head==='kage-oni',bodyExisting:x.body==='nightfall',
  readyForPremiumExport:false,remaining:limitations
 });
}
