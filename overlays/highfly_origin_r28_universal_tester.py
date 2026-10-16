/** HIGHFLY R28 P1: compact right-top grimorio; native cast only, session-only. */
import type * as THREE from 'three';
import { ABILITIES } from '../sim/content/classes';
import type { Sim } from '../sim/sim';
import { originR28Availability,originR28NativeCatalog,originR28TrialSelect } from '../sim/highfly_origin_r28_universal_core';
import { R27_PREMIUM_23 } from '../sim/highfly_origin_r27_premium23_catalog';
import { HighflyAimVisual, highflyAimSpec } from './highfly_origin_r20_premium_aim';
import { highflyManualAim,highflyManualRayTarget,highflyEffectiveAimRange,type AimProjection } from './highfly_origin_r21_aim_intent';
type Hooks={
 sim:Sim;attackBtn:HTMLButtonElement;scene:THREE.Scene;
 terrain:(x:number,z:number)=>number;project:AimProjection;cameraYaw:()=>number;
};
const STYLE='font:12px system-ui;color:#f0f5ff;background:#142237;border:1px solid #526d87;border-radius:6px;padding:5px;min-height:29px';
const LABELS:Record<string,string>={
 hf_vfx23_frost_lance:'Frost Lance',hf_vfx23_storm_lance:'Storm Lance',
 hf_vfx23_astral_void_blast:'Astral Void Blast',hf_vfx23_arborists_growth:"Arborist’s Growth"
};
export function installR28UniversalTester(h:Hooks):void{
 if(document.getElementById('hf-r28-launcher'))return;
 let selected:string|null=null,drag:{pointer:number;x:number;y:number}|null=null;
 const root=document.createElement('aside');root.id='hf-r28-launcher';
 root.style.cssText='position:fixed;top:clamp(38px,7vh,60px);right:8px;width:min(255px,30vw);max-width:255px;z-index:12500;pointer-events:auto;font:12px system-ui;color:#fff;';
 const launch=document.createElement('button');
 launch.textContent='📖 SKILLS ▾';
 launch.style.cssText=STYLE+';width:100%;font-weight:700;background:#223950e8;text-align:left';
 const panel=document.createElement('section');
 panel.hidden=true;
 panel.style.cssText='max-height:min(54vh,360px);overflow:hidden;background:#101d2bf4;padding:7px;border:1px solid #5a7895;border-radius:8px;box-shadow:0 8px 20px #0008;display:flex;flex-direction:column;gap:5px';
 const category=document.createElement('select');category.style.cssText=STYLE;
 category.innerHTML='<option value="native">CLAUDE ORIGINAL</option><option value="premium">PREMIUM PROTOTIPO (23)</option>';
 const query=document.createElement('input');query.placeholder='🔎 Buscar habilidad';query.style.cssText=STYLE+';width:100%;box-sizing:border-box';
 const school=document.createElement('select');school.style.cssText=STYLE;
 school.append(new Option('Todas las escuelas',''));
 for(const s of ['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'])school.append(new Option(s.toUpperCase(),s));
 const state=document.createElement('small');state.textContent='ATK normal · prueba sin guardar';state.style.cssText='color:#9deed5';
 const list=document.createElement('div');list.style.cssText='overflow-y:auto;max-height:200px;min-height:40px;display:grid;gap:3px;overscroll-behavior:contain';
 const reset=document.createElement('button');reset.textContent='↩ VOLVER A ATK NORMAL';reset.style.cssText=STYLE+';background:#245044';
 const visual=new HighflyAimVisual(h.scene,h.terrain);
 function label(id:string){return ABILITIES[id]?.name??LABELS[id]??id.replace(/^hf_vfx23_/,'').replaceAll('_',' ');}
 function sync(){state.textContent=selected?'ATK: '+label(selected)+' [CLAUDE ORIGINAL]':'ATK normal · prueba sin guardar';
 h.attackBtn.title=selected?'PROBAR '+label(selected):'ATK NORMAL';
 h.attackBtn.dataset.hfR28Skill=selected??'';
 }
 function render(){
  list.replaceChildren();
  const q=query.value.toLowerCase().trim(),isNative=category.value==='native';
  school.hidden=!isNative;
  if(isNative){
   for(const skill of originR28NativeCatalog()){
    if(school.value&&skill.school!==school.value)continue;
    if(q&&!((skill.name+' '+skill.id).toLowerCase().includes(q)))continue;
    const btn=document.createElement('button');btn.style.cssText=STYLE+';text-align:left';
    btn.textContent=skill.name+' · '+skill.school+' · '+skill.availability;
    btn.disabled=skill.availability!=='native-ready';btn.style.opacity=btn.disabled?'.5':'1';
    btn.title='[CLAUDE ORIGINAL] '+skill.type+' · coste '+skill.cost+' · cooldown '+skill.cooldown;
    btn.onclick=()=>{if(!originR28TrialSelect(h.sim,skill.id))return;selected=skill.id;panel.hidden=true;panel.style.display='none';sync();};
    list.append(btn);
   }
  }else{
   for(const p of R27_PREMIUM_23){
    const name=label(p.id);
    if(q&&!((name+' '+p.id).toLowerCase().includes(q)))continue;
    const btn=document.createElement('button');btn.style.cssText=STYLE+';text-align:left;opacity:.7';
    btn.textContent=name+' [PREMIUM PROTOTIPO] · VFX pendiente';
    btn.title='R27 catálogo solamente; no se permite simular daño falso';btn.disabled=true;
    list.append(btn);
   }
  }
 }
 launch.onclick=()=>{panel.hidden=!panel.hidden;panel.style.display=panel.hidden?'none':'flex';if(!panel.hidden)render();};
 reset.onclick=()=>{selected=null;drag=null;visual.hide();panel.hidden=true;sync();};
 query.oninput=render;category.onchange=render;school.onchange=render;
 panel.append(category,query,school,state,list,reset);panel.style.display='none';root.append(launch,panel);document.body.append(root);
 sync();render();
 const projectPoint=(dx:number,dy:number,range:number,shape:'line'|'cone'|'circle'|'dash'|'target')=>
  highflyManualAim(h.sim.player.pos,dx,dy,range,shape,h.project,h.cameraYaw()).point;
 const aimPoint=(id:string,dx:number,dy:number)=>{
  const spec=highflyAimSpec(id),def=ABILITIES[id];
  const shape=spec?.shape==='dash'?'dash':spec?.shape==='circle'?'circle':spec?.shape==='cone'?'cone':spec?.shape==='target'?'target':'line';
  return projectPoint(dx,dy,Math.max(1,spec?.range??highflyEffectiveAimRange(def)),shape);
 };
 const bestTarget=(range:number)=>{
  const p=h.sim.player;
  return [...h.sim.entities.values()].filter(e=>e.id!==p.id&&!e.dead&&e.hp>0&&e.hostile)
   .map(e=>({id:e.id,d:Math.hypot(e.pos.x-p.pos.x,e.pos.z-p.pos.z)}))
   .filter(e=>e.d<=range).sort((a,b)=>a.d-b.d)[0]?.id??null;
 };
 function cast(id:string,dx:number,dy:number,isDrag:boolean){
  const def=ABILITIES[id],actor=h.sim.player,spec=highflyAimSpec(id);
  if(!def||!h.sim.known.some(k=>k.def.id===id))return;
  const pt=aimPoint(id,dx,dy);
  const range=highflyEffectiveAimRange(def);
  const target=isDrag
   ?highflyManualRayTarget(actor.pos,[...h.sim.entities.values()],{
      x:(pt.x-actor.pos.x)/Math.max(.001,Math.hypot(pt.x-actor.pos.x,pt.z-actor.pos.z)),
      z:(pt.z-actor.pos.z)/Math.max(.001,Math.hypot(pt.x-actor.pos.x,pt.z-actor.pos.z))
     },range,1.2,def.minRange??0)
   :bestTarget(range);
  const destination=(!isDrag&&target!==null)?h.sim.entities.get(target)?.pos??pt:pt;
  if(!def.selfCentered){const dX=destination.x-actor.pos.x,dZ=destination.z-actor.pos.z;if(Math.hypot(dX,dZ)>.1)actor.facing=Math.atan2(dX,dZ);}
  if(def.targetMode==='position'&&!def.selfCentered){h.sim.castAbilityAt(id,destination);return;}
  if((id==='shadow_bolt'||id==='fireball')&&isDrag){h.sim.castAbilityAt(id,destination);return;}
  if(def.requiresTarget){if(target!==null){h.sim.targetEntity(target);h.sim.castAbility(id);}return;}
  h.sim.castAbility(id);
  if(def.empowerStages)h.sim.releaseEmpoweredAbility(id);
  void spec;
 }
 const down=(e:PointerEvent)=>{
  if(!selected||!(e.target instanceof Node)||!h.attackBtn.contains(e.target))return;
  if(drag)return;e.preventDefault();e.stopImmediatePropagation();
  drag={pointer:e.pointerId,x:e.clientX,y:e.clientY};
  const spec=highflyAimSpec(selected);
  if(spec)visual.show(spec,h.sim.player.pos,aimPoint(selected,0,0),true);
 };
 const move=(e:PointerEvent)=>{
  if(!drag||drag.pointer!==e.pointerId||!selected)return;
  e.preventDefault();e.stopImmediatePropagation();
  const spec=highflyAimSpec(selected);if(spec)visual.show(spec,h.sim.player.pos,aimPoint(selected,e.clientX-drag.x,e.clientY-drag.y),true);
 };
 const up=(e:PointerEvent)=>{
  if(!drag||drag.pointer!==e.pointerId||!selected)return;
  e.preventDefault();e.stopImmediatePropagation();
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  const cancel=e.clientY<56&&e.clientX>innerWidth*.4&&e.clientX<innerWidth*.6;
  visual.hide();drag=null;
  if(!cancel)cast(selected,dx,dy,Math.hypot(dx,dy)>12);
 };
 document.addEventListener('pointerdown',down,true);
 document.addEventListener('pointermove',move,true);
 document.addEventListener('pointerup',up,true);
 document.addEventListener('pointercancel',e=>{if(drag?.pointer===e.pointerId){drag=null;visual.hide();}},true);
}
