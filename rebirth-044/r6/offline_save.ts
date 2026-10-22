/** REBIRTH R6 — character save using native CharacterState, isolated keys. */
import type {PlayerClass,Entity} from '../../sim/types';
import type {CharacterState} from '../../sim/character_state';
import type {Sim} from '../../sim/sim';
interface Slot {version:1;origin:'highfly.rebirth044';cls:PlayerClass;name:string;character:CharacterState;
 appearance:Record<string,unknown>|null;helmHidden:boolean;skin:number;savedAt:number}
export const saveKey=(cls:PlayerClass,name:string)=>
 'highfly.rebirth044.offline.r6:'+encodeURIComponent(cls)+':'+encodeURIComponent(name.trim().toLowerCase());
export function validSlot(v:unknown,cls:PlayerClass,name:string):v is Slot {
 if(!v||typeof v!=='object')return false;
 const a=v as Partial<Slot>,s=a.character as Partial<CharacterState>|undefined;
 return a.version===1&&a.origin==='highfly.rebirth044'&&a.cls===cls&&
 a.name===name.trim().toLowerCase()&&!!s&&typeof s.level==='number'&&
 Number.isInteger(s.level)&&s.level>=1&&s.level<=20&&Number.isFinite(s.xp)&&
 Number.isFinite(s.resource)&&Number.isFinite(s.hp)&&
 !!s.pos&&Number.isFinite(s.pos.x)&&Number.isFinite(s.pos.z)&&
 Number.isFinite(s.facing)&&Array.isArray(s.inventory)&&Array.isArray(s.questLog)&&
 Array.isArray(s.questsDone)&&!!s.equipment&&typeof s.equipment==='object'&&
 Number.isFinite(a.skin)&&typeof a.helmHidden==='boolean';
}
export function loadSlot(cls:PlayerClass,name:string):Slot|null {
 try{const raw=localStorage.getItem(saveKey(cls,name));if(!raw)return null;
  const s:unknown=JSON.parse(raw);return validSlot(s,cls,name)?s:null;
 }catch{return null}
}
let active:{sim:Sim;cls:PlayerClass;name:string}|null=null;
let listeners=false;
export function saveNow():boolean {
 if(!active)return false;
 const {sim,cls,name}=active,character=sim.serializeCharacter(sim.playerId);
 if(!character)return false;
 const e:Entity=sim.player;
 const s:Slot={version:1,origin:'highfly.rebirth044',cls,name:name.trim().toLowerCase(),
  character,appearance:e.modularAppearance??null,helmHidden:!!e.helmHidden,
  skin:e.skin,savedAt:Date.now()};
 try{localStorage.setItem(saveKey(cls,name),JSON.stringify(s));return true}catch{return false}
}
export function activateSave(sim:Sim,cls:PlayerClass,name:string):void {
 active={sim,cls,name};
 if(listeners)return;
 listeners=true;
 window.addEventListener('pagehide',()=>{saveNow()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});
}
let lastTick=-1;
export function autosave(sim:Sim):void {
 if(active?.sim!==sim||sim.tickCount<200||sim.tickCount%400!==0||lastTick===sim.tickCount)return;
 lastTick=sim.tickCount;saveNow();
}
