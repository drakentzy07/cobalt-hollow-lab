/** Mobile DrakenLAB-only actual level control. No world/production access. */
import type { Sim } from '../../sim/sim';
import { highflyOriginClampLevel } from './progression99';
export function mountHighflyLabLevelPanel(sim: Sim): void {
  document.getElementById('hf-lab-level-panel')?.remove();
  const root=document.createElement('section'); root.id='hf-lab-level-panel';
  root.setAttribute('aria-label','Nivel de pruebas DrakenLAB');
  root.style.cssText='position:fixed;top:8px;right:8px;z-index:16000;font:600 12px system-ui;color:#fff;pointer-events:auto';
  const toggle=document.createElement('button');toggle.id='hf-lab-level-toggle';toggle.type='button';
  toggle.style.cssText='min-width:96px;min-height:40px;border-radius:12px;border:2px solid #e5b969;background:#314d70;color:#fff;touch-action:manipulation';
  const box=document.createElement('div');box.id='hf-lab-level-controls';box.hidden=true;
  box.style.cssText='position:absolute;right:0;top:46px;width:min(300px,85vw);max-height:68vh;overflow-y:auto;padding:12px;border:1px solid #c9ac69;border-radius:12px;background:rgba(12,28,46,.98);box-shadow:0 6px 24px #000a';
  const title=document.createElement('p');title.textContent='DRAKENLAB · NIVEL REAL';title.style.margin='0 0 10px';
  const value=document.createElement('strong');value.id='hf-lab-level-value';
  const range=document.createElement('input');range.id='hf-lab-level-range';range.type='range';range.min='1';range.max='99';range.step='1';range.style.cssText='width:100%;height:42px;display:block;touch-action:pan-x';
  const presets=document.createElement('div');presets.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:10px';
  const update=()=>{const level=sim.player.level;toggle.textContent='LAB · LV'+level;value.textContent='NIVEL '+level+' / 99';range.value=String(level);};
  const set=(level:number)=>{sim.setPlayerLevel(highflyOriginClampLevel(level,true),sim.playerId);update();};
  for(const n of [1,20,30,50,70,99]){const button=document.createElement('button');button.type='button';button.dataset.labLevel=String(n);button.textContent='LV'+n;button.style.cssText='min-height:40px;min-width:42px;border-radius:8px;border:1px solid #c9ac69;background:#263c55;color:#fff;touch-action:manipulation';button.addEventListener('click',()=>set(n));presets.append(button);}
  const note=document.createElement('p');note.textContent='Solo pruebas: Draken original permanece intacto.';note.style.cssText='font:11px system-ui;color:#dcd0bc;margin:10px 0 0';
  range.addEventListener('input',()=>set(Number(range.value)));
  toggle.addEventListener('click',()=>{box.hidden=!box.hidden;update();});
  box.append(title,value,range,presets,note);root.append(toggle,box);document.body.append(root);update();
}
