/**
 * HIGHFLY ORIGIN R1-5 / R1-6 P0 — ISOLATED PLAYABLE TRIAL ONLY.
 * Activated exclusively by VITE_HIGHFLY_ORIGIN_PREVIEW=1 at build time.
 * ONE Hunter (legacy Warrior body donor under the hood), no class selection,
 * canonical Sim save/restore, never a web command to grant skills.
 */
import type { CharacterState } from '../sim/character_state';
import { ABILITIES } from '../sim/content/classes';
import { highflyOriginNativeLearnable } from '../sim/highfly_origin_native_spellbook';
import { originCostDecision } from '../sim/highfly_origin_universal_resources';
import type { Sim } from '../sim/sim';

export const ORIGIN_TRIAL_ONLY = import.meta.env.VITE_HIGHFLY_ORIGIN_PREVIEW === '1';
const DB_NAME = 'highfly-origin-trial';
const DB_STORE = 'hunters';
const LAST_NAME_KEY = 'highfly.origin.trial.last-name';
const KEY_PREFIX = 'highfly.origin.trial.v1:';

export interface OriginTrialSave {
  version: 1;
  name: string;
  state: CharacterState;
  appearance: Record<string, unknown> | null;
  savedAt: number;
}

const saveKey = (name: string): string => KEY_PREFIX + encodeURIComponent(name.trim().toLowerCase());
const validName = (name: string): boolean => /^[A-Za-z][A-Za-z' -]{1,15}$/.test(name);

function validSave(x: unknown): x is OriginTrialSave {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const v=x as Partial<OriginTrialSave>;
  return v.version === 1 && typeof v.name === 'string' && validName(v.name) &&
    typeof v.savedAt === 'number' && Number.isFinite(v.savedAt) &&
    !!v.state && typeof v.state === 'object' &&
    v.state.originHunter?.identity === 'origin_hunter';
}

async function db(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  return await new Promise(resolve => {
    try {
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        if (!req.result.objectStoreNames.contains(DB_STORE))
          req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
      req.onblocked=()=>resolve(null);
    } catch {resolve(null);}
  });
}
async function readDb(key:string):Promise<OriginTrialSave | null>{
  const database=await db(); if(!database)return null;
  return await new Promise(resolve=>{
    try{
      const tx=database.transaction(DB_STORE,'readonly');
      const req=tx.objectStore(DB_STORE).get(key);
      req.onsuccess=()=>resolve(validSave(req.result)?req.result:null);
      req.onerror=()=>resolve(null);
      tx.oncomplete=()=>database.close();
      tx.onerror=()=>database.close();
    }catch{database.close();resolve(null);}
  });
}
async function writeDb(key:string,save:OriginTrialSave):Promise<void>{
  const database=await db();if(!database)return;
  await new Promise<void>(resolve=>{
    try{
      const tx=database.transaction(DB_STORE,'readwrite');
      tx.objectStore(DB_STORE).put(save,key);
      tx.oncomplete=()=>{database.close();resolve();};
      tx.onerror=()=>{database.close();resolve();};
      tx.onabort=()=>{database.close();resolve();};
    }catch{database.close();resolve();}
  });
}
export async function loadOriginTrialSave(name:string):Promise<OriginTrialSave|null>{
  if(!ORIGIN_TRIAL_ONLY||!validName(name))return null;
  let local:OriginTrialSave|null=null;
  try {
    const raw=localStorage.getItem(saveKey(name));
    if(raw){const parsed:unknown=JSON.parse(raw);if(validSave(parsed))local=parsed;}
  }catch{/* fallback IndexedDB */}
  const stored=await readDb(saveKey(name));
  return local && (!stored||local.savedAt>=stored.savedAt)?local:stored;
}

export function saveOriginTrial(s:OriginTrialSave):void{
  if(!ORIGIN_TRIAL_ONLY||!validSave(s))return;
  try{
    localStorage.setItem(LAST_NAME_KEY,s.name);
    // localStorage may fail on large inventories, IDB is the primary persistence.
    if(JSON.stringify(s).length<1_500_000)
      localStorage.setItem(saveKey(s.name),JSON.stringify(s));
  }catch{/* IDB fallback */}
  void writeDb(saveKey(s.name),s);
}

export function startOriginTrialAutosave(sim:Sim,name:string):()=>void{
  if(!ORIGIN_TRIAL_ONLY)return ()=>{};
  const snapshot=()=>{
    const state=sim.serializeCharacter(sim.playerId);
    const player=sim.entities.get(sim.playerId);
    if(!state?.originHunter||!player)return;
    saveOriginTrial({
      version:1,name,state,
      appearance:(player.modularAppearance as Record<string,unknown> | undefined)??null,
      savedAt:Date.now(),
    });
  };
  const id=window.setInterval(snapshot,4000);
  const onVisibility=()=>{if(document.visibilityState==='hidden')snapshot();};
  document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pagehide',snapshot);
  snapshot();
  return ()=>{window.clearInterval(id);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',snapshot);snapshot();};
}
function button(label:string):HTMLButtonElement{
  const btn=document.createElement('button');
  btn.type='button';btn.textContent=label;
  btn.style.cssText='touch-action:manipulation;background:#284876;color:#fff;border:1px solid #80a7e9;border-radius:9px;padding:11px 13px;font-weight:750;font-size:14px;cursor:pointer;';
  return btn;
}
export function installOriginTrialEntrance(onStart:(name:string)=>void):void{
  if(!ORIGIN_TRIAL_ONLY)return;
  const host=document.querySelector('#mode-select');
  if(!host||document.getElementById('hf-origin-entry'))return;
  const section=document.createElement('section');
  section.id='hf-origin-entry';
  section.style.cssText='max-width:460px;margin:14px auto;padding:14px;background:#10192ce9;border:1px solid #5374a3;border-radius:12px;color:#fff;display:grid;gap:10px;z-index:3;position:relative;text-align:left;';
  const title=document.createElement('strong');title.textContent='⚔️ HIGHFLY ORIGIN · PRUEBA DEL HUNTER';
  const desc=document.createElement('span');
  desc.textContent='Un solo Hunter, sin elegir clase. Mismo personaje, HP / MP / stamina y habilidades de distintas disciplinas. Guardado local por nombre.';
  desc.style.fontSize='12px';
  const input=document.createElement('input');
  input.type='text';input.maxLength=16;input.placeholder='Nombre del Hunter';input.autocomplete='off';input.id='hf-origin-name';
  input.style.cssText='min-width:0;padding:12px;border-radius:8px;background:#192945;color:#fff;border:1px solid #5a7398;font-size:16px;';
  try{input.value=localStorage.getItem(LAST_NAME_KEY)||'Hunter';}catch{input.value='Hunter';}
  const start=button('CREAR / CONTINUAR HUNTER ORIGIN');
  const status=document.createElement('small');
  status.style.color='#b3d3ff';
  start.addEventListener('click',()=>{
    const name=input.value.trim();
    if(!validName(name)){status.textContent='Usá entre 2 y 16 letras y espacios (sin números ni símbolos).';return;}
    start.disabled=true;
    status.textContent='Ingresando al mundo...';
    onStart(name);
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter')start.click();});
  section.append(title,desc,input,start,status);host.appendChild(section);
}
export function mountOriginTrialTrainer(sim:Sim):void{
  if(!ORIGIN_TRIAL_ONLY||document.getElementById('hf-origin-training'))return;
  const shell=document.createElement('aside');
  shell.id='hf-origin-training';
  shell.style.cssText='position:fixed;top:12px;right:12px;z-index:9000;color:#f5f8ff;font:13px system-ui,sans-serif;';
  const toggle=button('⚔️ HUNTER · SKILLS');
  const panel=document.createElement('section');
  panel.hidden=true;
  panel.style.cssText='max-height:70dvh;overflow:auto;width:min(360px,82vw);background:#0d1828f5;border:1px solid #5472a0;border-radius:10px;padding:12px;box-shadow:0 8px 25px #000b;';
  const caption=document.createElement('p');
  caption.textContent='LAB de aprendizaje (solo prueba): elegí habilidades nativas. Luego equipalas desde el Libro de Habilidades. No cambia tus stats.';
  const list=document.createElement('div');list.style.cssText='display:grid;gap:6px;';
  const status=document.createElement('p');status.style.color='#9bd5ae';
  const refresh=()=>{
    list.replaceChildren();
    const meta=sim.players.get(sim.playerId);
    if(!meta?.originHunter)return;
    const learnable=Object.values(ABILITIES)
      .filter(def=>highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)!==null)
      .filter(def=>originCostDecision(def).ok)
      .sort((a,b)=>a.class.localeCompare(b.class)||a.id.localeCompare(b.id));
    for(const def of learnable.slice(0,100)){
      const learned=meta.originHunter.learnedSkillIds.includes(def.id);
      const btn=button((learned?'✓ ':'+ ')+def.class.toUpperCase()+' · '+def.name);
      btn.disabled=learned;
      btn.style.cssText+='width:100%;text-align:left;font-size:12px;padding:8px;'+(learned?'opacity:.6;':'');
      btn.addEventListener('click',()=>{
        const ok=sim.learnOriginHunterSkillTrusted(def.id,sim.playerId);
        status.textContent=ok?'Aprendida: '+def.name+'. Agregala a tu barra desde el Libro.':'Bloqueada por requisito original o ya aprendida.';
        refresh();
      });
      list.append(btn);
    }
    if(!learnable.length)status.textContent='Todavía no hay técnicas disponibles para este nivel.';
  };
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)refresh();});
  panel.append(caption,list,status);shell.append(toggle,panel);document.body.append(shell);
}
