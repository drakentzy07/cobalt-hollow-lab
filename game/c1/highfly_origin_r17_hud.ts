/**
 * HIGHFLY ORIGIN R1-7: preview-only tactical target drag + native hotbar bridge.
 * Zero skill reimplementation: casts go through Hud.castSlot (native Sim).
 * The preview target arc is player-facing-relative; full camera projection,
 * AOEs and charge indicators remain separate later QA gates.
 */
import { ABILITIES } from '../sim/content/classes';
import { originCostDecision } from '../sim/highfly_origin_universal_resources';

type Unit = {
  id:number; kind:string; dead:boolean; hostile?:boolean;
  hp:number; maxHp:number; pos:{x:number;z:number};
};
type Player = Unit & {facing:number;targetId:number|null};
export type OriginAimPriority = 'nearest' | 'lowest-hp';
export interface OriginAimHooks {
  getSlot:(slot:number)=>string|null;
  setSlot:(slot:number,id:string|null)=>void;
  castSlot:(slot:number)=>void;
  learned:(id:string)=>boolean;
  target:(id:number)=>void;
  player:()=>Player;
  targets:()=>Unit[];
}
export function originUtilitySkill(id:string):boolean {
  const def=ABILITIES[id];
  if(!def)return false;
  if(id==='holy_light'||id==='flash_of_light')return true;
  const utility=/blessing|ward|aura|shield|armor|armour|protection|healing|heal|renew|barrier|regeneration|invocation|fortify|fortitude|might|sanctuary|covenant|bulwark|resurrection|resurrect|rebirth|dispel|purify|cleanse|rejuvenation|lay_on_hands|buff/i;
  // Avoid putting explicitly offensive strikes in a passive slot just
  // because their name happens to mention a shield or holy effect.
  const offensive=/strike|smash|bash|slash|shot|stab|bolt|missile|leap|thrust|charge|cleave|judgment|execute|attack|whirl/i;
  return utility.test(id) && !offensive.test(id);
}
export type OriginSkillRole='combat'|'support'|'reference';
/** Reference-only skills are visible for learning, never presented as working skills. */
export function originSkillRole(id:string):OriginSkillRole {
  const def=ABILITIES[id];
  if(!def||def.passive||def.hiddenFromPlayer||id==='divine_ascension'
    ||!originCostDecision(def).ok||def.requiresShield)return 'reference';
  return originUtilitySkill(id)?'support':'combat';
}
export function originAimSelect(
  actor:{pos:{x:number;z:number};facing:number},
  units:readonly Unit[],
  offset:{dx:number;dy:number}|null,
  maxRange:number,
  priority:OriginAimPriority,
):number|null {
  const len=offset?Math.hypot(offset.dx,offset.dy):0;
  const fx=Math.sin(actor.facing),fz=Math.cos(actor.facing);
  const rx=Math.cos(actor.facing),rz=-Math.sin(actor.facing);
  const wantedX=len>0?rx*(offset!.dx/len)-fx*(offset!.dy/len):0;
  const wantedZ=len>0?rz*(offset!.dx/len)-fz*(offset!.dy/len):0;
  const candidates=units.flatMap(e=>{
    if(e.dead||!e.hostile||e.hp<=0||e.kind==='player')return [];
    const x=e.pos.x-actor.pos.x,z=e.pos.z-actor.pos.z;
    const distance=Math.hypot(x,z);
    if(distance<=0.1||distance>Math.max(1,maxRange))return [];
    const dot=len>18?(x*wantedX+z*wantedZ)/distance:1;
    if(len>18 && dot<0.45)return [];
    return [{id:e.id,distance,hpFrac:e.hp/Math.max(1,e.maxHp),dot}];
  });
  candidates.sort((a,b)=>priority==='lowest-hp'
    ? a.hpFrac-b.hpFrac||b.dot-a.dot||a.distance-b.distance
    : b.dot-a.dot||a.distance-b.distance);
  return candidates[0]?.id??null;
}
type Cmd={kind:'set'|'clear'|'cast'|'sync'|'learned'|'autopack'|'priority';slot?:number;id?:string;priority?:OriginAimPriority};
let disposeLast:(()=>void)|null=null;
export function installOriginAimAndLoadout(h:OriginAimHooks):void {
  disposeLast?.();
  if(import.meta.env.VITE_HIGHFLY_ORIGIN_PREVIEW!=='1'||!h.player().kind)return;
  let priority:OriginAimPriority='nearest';
  let pending:{id:number;slot:number;startX:number;startY:number;dx:number;dy:number;drag:boolean}|null=null;
  let consumed:{slot:number;at:number}|null=null;
  const indicator=document.createElement('div');
  indicator.id='hf-origin-aim-marker';
  indicator.style.cssText='display:none;position:fixed;z-index:12000;pointer-events:none;padding:7px 12px;border:2px solid #8ee6ff;border-radius:30px;background:#10233cf0;color:#fff;font:700 12px system-ui;text-shadow:0 1px #000;white-space:nowrap;';
  document.body.appendChild(indicator);
  const publish=()=>document.dispatchEvent(new CustomEvent('hf-origin-loadout-state',{
    detail:{slots:Array.from({length:18},(_,i)=>h.getSlot(i+1)),priority,
      devotion:(h.player() as Player&{paladinDevotion?:{value:number}}).paladinDevotion?.value??0}
  }));
  const command=(ev:Event)=>{
    const d=(ev as CustomEvent<Cmd>).detail;
    if(!d)return;
    if(d.kind==='priority'){
      if(d.priority==='nearest'||d.priority==='lowest-hp')priority=d.priority;
      publish();return;
    }
    if(d.kind==='sync'){publish();return;}
    if(d.kind==='autopack'){
      const learned=Object.keys(ABILITIES).filter(id=>h.learned(id));
      const attacks=learned.filter(id=>originSkillRole(id)==='combat').slice(0,10);
      const utility=learned.filter(id=>originSkillRole(id)==='support').slice(0,8);
      for(let slot=1;slot<=18;slot++)h.setSlot(slot,null);
      attacks.forEach((id,i)=>h.setSlot(i+1,id));
      utility.forEach((id,i)=>h.setSlot(i+11,id));
      publish();return;
    }
    if(d.kind==='learned'&&typeof d.id==='string'&&h.learned(d.id)&&originSkillRole(d.id)!=='reference'){
      const group=originUtilitySkill(d.id)?[11,18]:[1,10];
      if(!Array.from({length:18},(_,i)=>h.getSlot(i+1)).includes(d.id)){
        for(let slot=group[0];slot<=group[1];slot++)if(!h.getSlot(slot)){h.setSlot(slot,d.id);break;}
      }
      publish();return;
    }
    if(!Number.isInteger(d.slot)||d.slot!<1||d.slot!>18)return;
    if(d.kind==='cast'){
      const id=h.getSlot(d.slot!);
      if(id&&originSkillRole(id)!=='reference')h.castSlot(d.slot!);
    }
    if(d.kind==='clear')h.setSlot(d.slot!,null);
    if(d.kind==='set'&&d.id&&h.learned(d.id)&&originSkillRole(d.id)!=='reference')h.setSlot(d.slot!,d.id);
    publish();
  };
  const down=(ev:PointerEvent)=>{
    if(ev.pointerType!=='touch'||pending)return; // right thumb works alongside joystick
    const el=(ev.target as HTMLElement).closest<HTMLButtonElement>('.action-btn[data-hotbar-slot]');
    if(!el)return;
    const slot=Number(el.dataset.hotbarSlot);
    if(slot<1||slot>10)return;
    const id=h.getSlot(slot),def=id?ABILITIES[id]:null;
    if(!def||originSkillRole(id!)!=='combat'||!def.requiresTarget||def.empowerStages)return;
    pending={id:ev.pointerId,slot,startX:ev.clientX,startY:ev.clientY,dx:0,dy:0,drag:false};
  };
  const move=(ev:PointerEvent)=>{
    if(!pending||pending.id!==ev.pointerId)return;
    const p=pending;
    p.dx=ev.clientX-p.startX;p.dy=ev.clientY-p.startY;
    if(Math.hypot(p.dx,p.dy)<20)return;
    p.drag=true;
    const id=h.getSlot(p.slot),def=id?ABILITIES[id]:null;
    const selected=originAimSelect(h.player(),h.targets(),{dx:p.dx,dy:p.dy},def?.range??30,priority);
    indicator.textContent=p.dx>120 && p.dy< -95
      ? '✕ CANCELAR' : selected===null?'Sin objetivo válido':'◎ OBJETIVO '+selected;
    indicator.style.display='block';
    indicator.style.left=Math.min(innerWidth-140,Math.max(8,ev.clientX+15))+'px';
    indicator.style.top=Math.min(innerHeight-35,Math.max(8,ev.clientY-38))+'px';
  };
  const clear=()=>{pending=null;indicator.style.display='none';};
  const up=(ev:PointerEvent)=>{
    if(!pending||ev.pointerId!==pending.id)return;
    const p=pending;
    if(!p.drag){clear();return;}
    // On a DRAG ONLY, consume native pointer-up and its synthetic click so
    // a target never gets two casts. Ordinary taps/empowered holds are native.
    ev.preventDefault();ev.stopImmediatePropagation();
    consumed={slot:p.slot,at:Date.now()};
    const canceled=p.dx>120 && p.dy< -95;
    if(!canceled){
      const id=h.getSlot(p.slot),def=id?ABILITIES[id]:null;
      const target=originAimSelect(h.player(),h.targets(),{dx:p.dx,dy:p.dy},def?.range??30,priority);
      if(target!==null&&id&&originSkillRole(id)==='combat'){h.target(target);h.castSlot(p.slot);}
    }
    clear();
  };
  const click=(ev:MouseEvent)=>{
    if(!consumed||Date.now()-consumed.at>850){consumed=null;return;}
    const el=(ev.target as HTMLElement).closest<HTMLElement>('[data-hotbar-slot]');
    if(Number(el?.dataset.hotbarSlot)===consumed.slot){
      ev.preventDefault();ev.stopImmediatePropagation();consumed=null;
    }
  };
  const cancel=(ev:PointerEvent)=>{if(pending?.id===ev.pointerId)clear();};
  const pagehide=()=>clear();
  document.addEventListener('hf-origin-command',command);
  document.addEventListener('pointerdown',down,true);
  document.addEventListener('pointermove',move,true);
  document.addEventListener('pointerup',up,true);
  document.addEventListener('pointercancel',cancel,true);
  document.addEventListener('click',click,true);
  window.addEventListener('blur',pagehide);
  disposeLast=()=>{
    document.removeEventListener('hf-origin-command',command);
    document.removeEventListener('pointerdown',down,true);
    document.removeEventListener('pointermove',move,true);
    document.removeEventListener('pointerup',up,true);
    document.removeEventListener('pointercancel',cancel,true);
    document.removeEventListener('click',click,true);
    window.removeEventListener('blur',pagehide);
    indicator.remove();
  };
}
