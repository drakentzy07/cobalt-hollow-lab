/**
 * Minimal C2-04 offline Training UI, placed in native "More" controls when
 * present. No dependencies, no global canvas, no change to the native HUD.
 * Future full HIGHFLY HUD can wrap the same HunterTrainingJournal API.
 */
import type {HunterTrainingJournal,TrainingKind,TrainingProof} from './c204_training_journal.ts';
import type {UniversalStat} from './c2_universal_stats.ts';

const KINDS:readonly [TrainingKind,string][]=[
 ['strength','Fuerza (STR)'],['agility','Agilidad (AGI)'],
 ['cardio','Resistencia (VIT)'],['perception','Percepción (PER)'],
 ['study','Estudio (INT)']
];
const STATS:readonly UniversalStat[]=['STR','AGI','VIT','PER','INT'];
const inputNum=(caption:string,value:string,min:string,max:string)=>{
 const wrap=document.createElement('label');wrap.style.cssText='display:flex;flex-direction:column;gap:4px;font-size:13px';
 wrap.textContent=caption;
 const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step='any';input.value=value;
 input.style.cssText='background:#121923;color:white;border:1px solid #7a8595;border-radius:6px;padding:6px;width:100%;box-sizing:border-box';
 wrap.append(input);return {wrap,input};
};
export function mountHighflyTrainingPanel(
 journal:HunterTrainingJournal,
 onStatsChanged:()=>void
):()=>void {
 document.getElementById('highfly-clean-training-button')?.remove();
 document.getElementById('highfly-clean-training-panel')?.remove();
 const launcher=document.createElement('button');
 launcher.id='highfly-clean-training-button';launcher.type='button';
 launcher.textContent='🏋️ Entrenamiento';
 launcher.style.cssText='padding:8px 12px;color:#fff;background:#27384d;border:1px solid #61799e;border-radius:9px;font-weight:bold;cursor:pointer;touch-action:manipulation;';
 const nativeMore=document.querySelector('#mobile-extra-controls');
 if(nativeMore) nativeMore.append(launcher);
 else {
   launcher.style.cssText+='position:fixed;right:16px;top:90px;z-index:400;';
   document.body.append(launcher);
 }
 const modal=document.createElement('section');
 modal.id='highfly-clean-training-panel';
 modal.setAttribute('role','dialog');
 modal.setAttribute('aria-label','Entrenamiento HIGHFLY');
 modal.style.cssText='display:none;box-sizing:border-box;position:fixed;inset:10% max(12px,8vw);overflow:auto;max-width:470px;max-height:80dvh;margin:auto;padding:15px;border:1px solid #687d9c;border-radius:14px;background:#111925;color:#fff;z-index:99999;box-shadow:0 12px 45px #000b;font:14px system-ui';
 document.body.append(modal);
 const row=(gap='8px')=>{const el=document.createElement('div');el.style.cssText='display:flex;gap:'+gap+';align-items:center;flex-wrap:wrap;margin-bottom:10px';return el};
 const header=row();const title=document.createElement('strong');title.textContent='HIGHFLY · Training Core';title.style.cssText='font-size:18px;flex:1';
 const close=document.createElement('button');close.type='button';close.textContent='✕ Cerrar';close.style.cssText='padding:7px 10px;color:white;background:#384558;border-radius:8px;border:0';
 close.onclick=()=>{modal.style.display='none'};
 header.append(title,close);modal.append(header);
 const summary=document.createElement('p');modal.append(summary);
 const status=document.createElement('p');status.setAttribute('aria-live','polite');
 status.style.cssText='min-height:18px;color:#d5e6fa;white-space:pre-wrap';
 modal.append(status);
 const statsPanel=row();modal.append(statsPanel);
 const prompt=document.createElement('p');prompt.textContent='Registrar entrenamiento (autodeclarado, no verificado por sensores).';modal.append(prompt);
 const mode=document.createElement('select');mode.setAttribute('aria-label','Tipo de entrenamiento');
 mode.style.cssText='background:#162437;color:white;padding:7px;border-radius:8px;max-width:100%';
 for(const [k,v] of KINDS){const opt=document.createElement('option');opt.value=k;opt.textContent=v;mode.append(opt)}
 modal.append(mode);
 const numbers=row();const sets=inputNum('Series','3','1','12'),reps=inputNum('Repeticiones','12','1','50');
 const kg=inputNum('Carga kg (fuerza)','25','0','500'),minutes=inputNum('Minutos','45','5','240');
 for(const f of [sets,reps,kg,minutes]){f.wrap.style.width='calc(50% - 4px)';numbers.append(f.wrap)}
 modal.append(numbers);
 const save=document.createElement('button');save.type='button';save.textContent='Registrar sesión';
 save.style.cssText='background:#295b43;border:0;border-radius:8px;padding:10px 16px;color:white;font-weight:bold;touch-action:manipulation';
 modal.append(save);
 function render(){
   const state=journal.snapshot;const p=state.profile;
   summary.textContent=journal.hunterName+' · '+(journal.world==='lab'?'Laboratorio':'Mundo')+
     ' · LV '+p.level+' · Puntos entrenamiento: '+p.availableTrainingPoints+' / '+p.trainingPointsEarned;
   statsPanel.replaceChildren();
   for(const stat of STATS){
     const cell=document.createElement('button');cell.type='button';
     cell.textContent=stat+' '+p.allocated[stat]+' (+)';
     cell.title='Asignar 1 punto a '+stat;
     cell.disabled=p.availableTrainingPoints<=0;
     cell.style.cssText='padding:8px;background:#24344d;color:white;border:1px solid #506682;border-radius:8px;touch-action:manipulation';
     cell.onclick=()=>{
       try{journal.allocate(stat,1);onStatsChanged();status.textContent='Asignado 1 punto a '+stat}
       catch(e){status.textContent=String(e)}
     };
     statsPanel.append(cell);
   }
 }
 save.onclick=()=>{
   try{
     const entry:TrainingProof={
       sessionId:(typeof crypto!=='undefined'&&'randomUUID' in crypto)?crypto.randomUUID():'hf-'+Date.now()+'-'+Math.random().toString(36).slice(2),
       kind:mode.value as TrainingKind,
       sets:Number(sets.input.value),
       reps:Number(reps.input.value),
       loadKg:Number(kg.input.value),
       minutes:Number(minutes.input.value),
       performedAt:new Date().toISOString()
     };
     journal.logWorkout(entry);
     status.textContent='Sesión registrada. +1 punto de entrenamiento disponible (autodeclarado).';
   }catch(e){status.textContent='No se registró: '+String(e)}
 };
 launcher.onclick=()=>{modal.style.display='block';render()};
 const unsubscribe=journal.onChange(()=>render());render();
 return ()=>{
   unsubscribe();launcher.remove();modal.remove();
 };
}
