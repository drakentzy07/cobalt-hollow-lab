/** REBIRTH-only offline 3-resource unit frame, backed by live Sim pools. */
import type {Entity,PlayerClass} from '../../sim/types';
import {rebirthInitializeVitals,rebirthMirrorNativeVitals,type RebirthVitalPools} from './vitals_core';
let current:Entity|null=null;
let saveKey='';
let nextSaveMs=0;
const rootKey=(cls:PlayerClass,name:string)=>
  'highfly.rebirth044.vitals.r3:'+encodeURIComponent(cls)+':'+encodeURIComponent(name.trim().toLowerCase());
function saveVitals():void {
  if(!current||!saveKey)return;
  const v=rebirthMirrorNativeVitals(current);
  if(!v)return;
  try{localStorage.setItem(saveKey,JSON.stringify(v))}catch{/* isolated and optional */}
}
function loadVitals(key:string):Partial<RebirthVitalPools>|null {
  try{const s=localStorage.getItem(key);return s?JSON.parse(s) as Partial<RebirthVitalPools>:null}catch{return null}
}
export function rebirthStartVitals(player:Entity,cls:PlayerClass,name:string):void {
  saveKey=rootKey(cls,name);current=player;
  rebirthInitializeVitals(player,loadVitals(saveKey));
  window.addEventListener('pagehide',saveVitals,{once:false});
}
function paint(id:string,value:number,max:number):void {
  const bar=document.getElementById(id);
  if(!bar)return;
  bar.style.width=Math.max(0,Math.min(100,100*value/Math.max(1,max)))+'%';
  const label=document.getElementById(id+'-label');
  if(label)label.textContent=Math.round(value)+'/'+Math.round(max);
}
function ensureFrame():boolean {
  const original=document.getElementById('pf-resource');
  if(!original?.parentElement)return false;
  if(!document.getElementById('hf-r3-vitals')){
    const wrap=document.createElement('div');
    wrap.id='hf-r3-vitals';
    wrap.setAttribute('aria-label','Maná y Energía HIGHFLY');
    wrap.innerHTML=
      '<div class="hf-vital-line hf-mana"><span>MP</span><div class="hf-vital-track"><div id="hf-mp-fill"></div></div><b id="hf-mp-fill-label"></b></div>'+
      '<div class="hf-vital-line hf-energy"><span>EN</span><div class="hf-vital-track"><div id="hf-en-fill"></div></div><b id="hf-en-fill-label"></b></div>';
    original.insertAdjacentElement('afterend',wrap);
  }
  return true;
}
export function rebirthUpdateVitalsHud(p:Entity):void {
  if(!current||p!==current||!p.highflyVitals)return;
  const v=rebirthMirrorNativeVitals(p);
  if(!v||!ensureFrame())return;
  paint('hf-mp-fill',v.mana,v.maxMana);
  paint('hf-en-fill',v.energy,v.maxEnergy);
  const now=performance.now();
  if(now>=nextSaveMs){nextSaveMs=now+3000;saveVitals();}
}
