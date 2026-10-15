/** HIGHFLY R18: one-tap loadout editor for the REAL mobile action bar.
 * The native hotbar stores every assignment; this panel only sends commands.
 */
import { ABILITIES } from '../sim/content/classes';
import type { Sim } from '../sim/sim';
import { originSkillRole, type OriginSkillRole } from './highfly_origin_r17_hud';
type State={slots:(string|null)[];priority:'nearest'|'lowest-hp'};
const fire=(kind:string,slot?:number,id?:string,priority?:string)=>
  document.dispatchEvent(new CustomEvent('hf-origin-command',{detail:{kind,slot,id,priority}}));
function btn(label:string):HTMLButtonElement{
 const b=document.createElement('button');b.type='button';b.textContent=label;
 b.style.cssText='touch-action:manipulation;min-height:33px;padding:6px;border:1px solid #537da5;border-radius:7px;background:#203c62;color:white;font:600 12px system-ui;cursor:pointer;';
 return b;
}
export function mountOriginR18Editor(
 sim:Sim,panel:HTMLElement,learnList:HTMLElement,referencePanel:HTMLElement,
 status:HTMLElement,refreshTrainer:()=>void
):void{
 const shell=document.getElementById('hf-origin-training');
 if(!shell||panel.dataset.r18)return;
 panel.dataset.r18='1';
 shell.style.cssText='position:fixed;top:8px;right:8px;z-index:9000;color:#f5f8ff;font:12px system-ui,sans-serif;';
 panel.style.cssText='max-height:min(80dvh,440px);overflow:auto;width:min(385px,86vw);background:#0d1828fa;border:1px solid #5472a0;border-radius:10px;padding:9px;box-shadow:0 8px 25px #000b;';
 const heading=document.createElement('strong');heading.textContent='CONFIGURACIÓN DEL HUNTER';
 const hint=document.createElement('small');
 hint.textContent='Tocá un slot, elegí una técnica. La X la quita. Las técnicas se guardan en la barra nativa.';
 hint.style.cssText='color:#bddaff;display:block;';
 const tabs=document.createElement('div');tabs.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:5px;';
 const combat=btn('⚔ S1–S10'),support=btn('🛡 B1–B8');
 tabs.append(combat,support);
 const search=document.createElement('input');search.type='search';search.placeholder='Buscar habilidad aprendida…';
 search.style.cssText='width:100%;box-sizing:border-box;background:#14243b;color:#fff;border:1px solid #45678d;border-radius:7px;padding:8px;';
 const rows=document.createElement('div');rows.style.cssText='display:grid;gap:4px;';
 const preset=btn('Ordenar automáticamente (reemplaza el orden)');
 const sortConfirm=document.createElement('div');sortConfirm.hidden=true;
 const yes=btn('Sí, reemplazar'),no=btn('Cancelar');
 sortConfirm.append('¿Reemplazar tu distribución actual? ',yes,no);
 preset.onclick=()=>{sortConfirm.hidden=false;};
 yes.onclick=()=>{fire('autopack');sortConfirm.hidden=true;};
 no.onclick=()=>{sortConfirm.hidden=true;};
 const aimLabel=document.createElement('small');aimLabel.textContent='APUNTADO AUTOMÁTICO AL TOCAR';
 const aimRow=document.createElement('div');aimRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:5px;';
 const near=btn('Más cercano'),low=btn('Menor % vida');
 near.onclick=()=>fire('priority',undefined,undefined,'nearest');
 low.onclick=()=>fire('priority',undefined,undefined,'lowest-hp');
 aimRow.append(near,low);
 const training=document.createElement('details');
 const ts=document.createElement('summary');ts.textContent='📚 Aprender nuevas técnicas nativas';
 training.append(ts,learnList);
 training.addEventListener('toggle',()=>{if(training.open)refreshTrainer();});
 referencePanel.style.cssText='margin-top:5px;border-top:1px solid #496688;padding:6px;';
 status.style.cssText='color:#a4d9b4;min-height:16px;';
 panel.replaceChildren(heading,hint,tabs,search,rows,preset,sortConfirm,aimLabel,aimRow,training,referencePanel,status);
 let group:OriginSkillRole='combat';
 let expanded=-1;
 let state:State={slots:Array(18).fill(null),priority:'nearest'};
 const learned=()=>sim.known.map(k=>k.def).filter(def=>originSkillRole(def.id)===group);
 const paint=()=>{
   combat.style.background=group==='combat'?'#3979a9':'#203c62';
   support.style.background=group==='support'?'#3979a9':'#203c62';
   near.style.background=state.priority==='nearest'?'#3979a9':'#203c62';
   low.style.background=state.priority==='lowest-hp'?'#3979a9':'#203c62';
   rows.replaceChildren();
   const first=group==='combat'?1:11,last=group==='combat'?10:18;
   const choices=learned().filter(d=>d.name.toLowerCase().includes(search.value.toLowerCase()));
   for(let slot=first;slot<=last;slot++){
     const assigned=state.slots[slot-1];
     const line=document.createElement('div');
     line.style.cssText='display:grid;grid-template-columns:1fr 37px;gap:4px;';
     const select=btn((slot<=10?'S'+slot:'B'+(slot-10))+' · '+(assigned?ABILITIES[assigned]?.name??assigned:'VACÍO — elegir'));
     select.style.textAlign='left';
     select.onclick=()=>{expanded=expanded===slot?-1:slot;paint();};
     const clear=btn('✕');clear.title='Quitar de '+(slot<=10?'S':'B')+slot;
     clear.disabled=!assigned;clear.style.opacity=assigned?'1':'.45';
     clear.onclick=()=>{fire('clear',slot);expanded=-1;};
     line.append(select,clear);rows.appendChild(line);
     if(expanded===slot){
       const options=document.createElement('div');
       options.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#12233d;border-radius:8px;';
       for(const def of choices){
         const option=btn(def.name);
         option.style.cssText+='text-align:left;font-size:11px;';
         option.onclick=()=>{fire('set',slot,def.id);expanded=-1;};
         options.appendChild(option);
       }
       if(!choices.length){const msg=document.createElement('small');msg.textContent='No hay técnicas aprendidas en este grupo.';options.appendChild(msg);}
       rows.appendChild(options);
     }
   }
 };
 combat.onclick=()=>{group='combat';expanded=-1;paint();};
 support.onclick=()=>{group='support';expanded=-1;paint();};
 search.oninput=paint;
 document.addEventListener('hf-origin-loadout-state',event=>{
   const next=(event as CustomEvent<State>).detail;
   if(!next?.slots)return;
   state={slots:next.slots,priority:next.priority??'nearest'};
   paint();
 });
 // Support buttons live close to GEM / consumables and do not cover the native attack ring.
 const bank=document.getElementById('hf-origin-utility-row');
 if(bank){
   bank.setAttribute('aria-label','Soporte del Hunter');
   bank.querySelectorAll('button').forEach((node,i)=>{
     const b=node as HTMLButtonElement;
     b.title='B'+(i+1)+' · Soporte';
     b.style.borderRadius='8px';
   });
 }
 paint();
 fire('sync');
}
