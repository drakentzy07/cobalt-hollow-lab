/** R28 universal catalog. Original definitions remain immutable; Premium 23 are
 * data-only until their real procedural VFX and native gameplay bridge are built.
 */
import { ABILITIES } from './content/classes';
import { originCostDecision } from './highfly_origin_universal_resources';
import { R27_PREMIUM_23 } from './highfly_origin_r27_premium23_catalog';

export type R28Kind='native'|'premium';
export type R28Status='ready-to-test'|'conditional'|'passive'|'blocked'|'catalog-only';
export interface R28Item {
 id:string; name:string; originalName:string; group:string; kind:R28Kind;
 shape:string; effect:string; cost:number|null; pool:'mana'|'stamina'|null;
 cooldown:number|null; status:R28Status; note:string;
}
const translated:Record<string,string>={
 shadow_bolt:'Descarga de Sombras',meteor:'Meteoro',
 dragons_breath:'Aliento de Dragón',sinister_strike:'Golpe Siniestro',
 heroic_leap:'Salto Heroico',bladestorm:'Torbellino de Espadas',
 fear:'Miedo',fireball:'Bola de Fuego',lightning_bolt:'Rayo',
 blizzard:'Ventisca',frost_armor:'Armadura de Escarcha'
};
function aimShape(id:string):string{
 const d=ABILITIES[id];
 if(!d)return 'N/A';
 const types=d.effects.map(x=>x.type);
 if(types.includes('empoweredCone'))return 'CONE';
 if(types.includes('repositionToAim')||types.includes('blinkForward'))return 'DASH';
 if(d.targetMode==='position')return 'CIRCLE';
 if(!d.requiresTarget&&d.range===0)return 'SELF';
 if(['fireball','shadow_bolt','arcane_shot','lightning_bolt','venom_dart','wrath'].includes(id))return 'LINE';
 if(d.requiresTarget)return 'TARGET';
 return d.selfCentered?'SELF':'TARGET';
}
export function r28NativeStatus(id:string):{status:R28Status;note:string}{
 const d=ABILITIES[id];
 if(!d)return {status:'blocked',note:'No registrado'};
 if(d.passive||d.hiddenFromPlayer)return {status:'passive',note:'No es una acción lanzable'};
 const admission=originCostDecision(d);
 if(!admission.ok)return {status:'blocked',note:admission.reason};
 if(d.requiresShield)return {status:'conditional',note:'Exige escudo equipado'};
 if(d.requiresStealth)return {status:'conditional',note:'Exige sigilo'};
 if(d.empowerStages||d.effects.some(x=>x.type==='empoweredCone'))
   return {status:'conditional',note:'Carga nativa: gesto todavía requiere verificación'};
 return {status:'ready-to-test',note:'Circuito nativo de Sim; validar efectos en Android'};
}
export function r28UniversalCatalog():R28Item[]{
 const native=Object.values(ABILITIES).map(def=>{
  const d=originCostDecision(def);
  const x=r28NativeStatus(def.id);
  return {
   id:def.id,name:translated[def.id]??def.name,originalName:def.name,
   group:def.class,kind:'native' as const,shape:aimShape(def.id),
   effect:def.school,cost:def.cost,pool:d.ok?d.pool:null,
   cooldown:def.cooldown,status:x.status,note:x.note
  };
 });
 const premium=R27_PREMIUM_23.map(def=>({
  id:def.id,name:def.id.replace(/^hf_vfx23_/,'').replace(/_/g,' ').replace(/\b\w/g,s=>s.toUpperCase()),
  originalName:def.sourceId,group:def.source,kind:'premium' as const,
  shape:def.aim.toUpperCase(),effect:def.role,cost:null,pool:null,cooldown:null,
  status:'catalog-only' as const,
  note:'R27: registro sin VFX ni daño nativo; no seleccionable hasta P2'
 }));
 return [...native,...premium];
}
export function r28Selectable(id:string):boolean{
 const status=r28NativeStatus(id).status;
 return status==='ready-to-test'||status==='conditional';
}
