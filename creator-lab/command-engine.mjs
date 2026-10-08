// HIGHFLY Creator guided automation v1 — NO generative AI API connected.
// JSON plans are safe, bounded and reversible. This is the exact contract
// that a future approved LLM can produce; never evaluate arbitrary JS or shell.
const LABELS={
  visor:'visor',ojos:'visor',ojo:'visor',pico:'beak',
  carcasa:'shell',casco:'shell',mascara:'mask',boca:'mask',
  bordes:'trim',borde:'trim',cejas:'trim',
  mejillas:'cheeks',pomulos:'cheeks',
  cresta:'crest',plumas:'crest',plumaje:'crest',
  nuca:'nape',cristal:'gem',gema:'gem'
};
const KNOBS={pico:['beak',70,140],plumaje:['crest',50,165],cresta:['crest',50,165],
  brillo:['glow',0,200],ojos:['eyeOffset',-35,35]};
export const CONTRACT_VERSION='highfly-forge-action/1';
function words(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
export function parseGuidedCommand(raw){
  if(typeof raw!=='string'||raw.length>200)throw Error('Comando demasiado largo');
  const t=words(raw);
  if(/^(auditar|revisar|verificar)( malla| modelo)?$/.test(t))
    return {schema:CONTRACT_VERSION,action:'inspect'};
  if(/^(mostrar|activar|aplicar) casco$/.test(t))
    return {schema:CONTRACT_VERSION,action:'toggle_helmet',enabled:true};
  if(/^(ocultar|quitar) casco$/.test(t))
    return {schema:CONTRACT_VERSION,action:'toggle_helmet',enabled:false};
  const paint=t.match(/^(?:pintar|colorear)\s+([a-z]+)\s+(#[0-9a-f]{6})$/);
  if(paint&&LABELS[paint[1]])
    return {schema:CONTRACT_VERSION,action:'paint_zone',zone:LABELS[paint[1]],color:paint[2]};
  const param=t.match(/^([a-z]+)\s*(-?\d{1,3})$/);
  if(param&&KNOBS[param[1]]){
    const [key,min,max]=KNOBS[param[1]],value=Number(param[2]);
    if(value<min||value>max)throw Error('Valor fuera de rango: '+min+' a '+max);
    return {schema:CONTRACT_VERSION,action:'helmet_parameter',key,value:value/100};
  }
  throw Error('No reconozco esa orden. Probá «pico 120», «ojos -12», «pintar visor #ae65ff» o «auditar».');
}
const ALLOWED_ZONES=new Set(['shell','mask','beak','visor','trim','cheeks','crest','nape','gem']);
const LIMITS={beak:[.7,1.4],crest:[.5,1.65],glow:[0,2],eyeOffset:[-.35,.35]};
export function validateCommandPlan(plan){
  if(!plan||typeof plan!=='object'||Array.isArray(plan)||plan.schema!==CONTRACT_VERSION)
    throw Error('Contrato de comando incompatible');
  const action=plan.action;
  if(action==='inspect')return Object.freeze({action});
  if(action==='toggle_helmet'&&typeof plan.enabled==='boolean')
    return Object.freeze({action,enabled:plan.enabled});
  if(action==='paint_zone'&&ALLOWED_ZONES.has(plan.zone)&&/^#[0-9a-fA-F]{6}$/.test(plan.color))
    return Object.freeze({action,zone:plan.zone,color:plan.color.toLowerCase()});
  if(action==='helmet_parameter'&&Object.hasOwn(LIMITS,plan.key)&&Number.isFinite(plan.value)){
    const [min,max]=LIMITS[plan.key];
    if(plan.value>=min&&plan.value<=max)
      return Object.freeze({action,key:plan.key,value:plan.value});
  }
  throw Error('Plan rechazado. Solo ajustes seguros, limitados y reversibles del Creator Lab.');
}
export function applyGuidedCommand(recipe,plan){
  const safe=validateCommandPlan(plan);
  const updated=structuredClone(recipe);
  if(safe.action==='inspect')return {recipe:updated,changed:false,note:'Auditoría de malla'};
  if(safe.action==='toggle_helmet')updated.helmet.enabled=safe.enabled;
  if(safe.action==='paint_zone')updated.helmet.colors[safe.zone]=safe.color;
  if(safe.action==='helmet_parameter')updated.helmet[safe.key]=safe.value;
  return {recipe:updated,changed:true,note:'Comando aplicado: '+safe.action};
}
