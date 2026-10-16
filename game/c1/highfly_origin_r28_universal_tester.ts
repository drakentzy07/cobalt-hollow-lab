/** Compact R28 universal tester: ONE temporary native skill on ATK.
 * Builds only DOM and shares the existing renderer, R20 geometry, R21 aim and
 * authoritative original Sim; never runs its own damage/FX/target resolver.
 */
import * as THREE from 'three';
import { ABILITIES } from '../sim/content/classes';
import type { Sim } from '../sim/sim';
import { r28UniversalCatalog, r28Selectable, type R28Item } from '../sim/highfly_origin_r28_universal_catalog';
import { r28Select,r28Selected } from '../sim/highfly_origin_r28_session';
import { HighflyAimVisual,highflyAimSpec } from './highfly_origin_r20_premium_aim';
import { highflyManualAim,highflyManualRayTarget,highflyEffectiveAimRange } from './highfly_origin_r21_aim_intent';
import { originAimSelect } from './highfly_origin_r17_hud';
import { ORIGIN_FREE_SKILLS } from '../sim/highfly_origin_r24a_skillshot_physics';

export interface R28Hooks{
 sim:Sim;attackButton:HTMLButtonElement|null;scene:THREE.Scene;
 terrain:(x:number,z:number)=>number;
 project:(x:number,y:number,z:number)=>{x:number;y:number;behind:boolean};
 cameraYaw:()=>number;
 iconUrl:(id:string)=>string;
}
const mini=<T extends HTMLElement>(el:T,css:string):T=>{el.style.cssText=css;return el;};
export function mountR28UniversalTester(h:R28Hooks):()=>void{
 const list=r28UniversalCatalog();
 const native=list.filter(x=>x.kind==='native');
 const body=document.body;
 const visual=new HighflyAimVisual(h.scene,h.terrain);
 let selected=r28Selected(h.sim);
 let category:'native'|'premium'|'support'='native';
 let search='',school='all',shape='all',shown=48;
 let active:{pointerId:number;x:number;y:number;dx:number;dy:number;drag:boolean}|null=null;
 const root=mini(document.createElement('div'),
  'position:fixed;right:8px;top:max(7px,env(safe-area-inset-top));z-index:13000;font:12px system-ui,sans-serif;color:#e9f4ff;pointer-events:auto');
 root.id='hf-r28-universal-tester';
 const trigger=mini(document.createElement('button'),
  'height:33px;max-width:160px;min-width:108px;padding:3px 11px;border:1px solid #79c5ed;border-radius:17px;background:#112c42ed;color:#e5f6ff;font-weight:800;box-shadow:0 3px 14px #0009;white-space:nowrap;overflow:hidden;text-overflow:ellipsis');
 trigger.textContent='📖 SKILLS ▾';trigger.setAttribute('aria-label','Abrir grimorio universal');
 const panel=mini(document.createElement('div'),
  'display:none;margin-top:5px;width:min(340px,39vw);min-width:240px;max-height:min(70vh,410px);border:1px solid #7390a8;border-radius:11px;padding:7px;background:#101b2afa;box-shadow:0 9px 30px #000c;overflow:hidden;flex-direction:column;gap:5px');
 panel.id='hf-r28-grimoire';
 const info=mini(document.createElement('div'),'font-weight:800;font-size:12px;color:#fff');
 info.textContent='GRIMORIO · PROBAR EN ATK';
 const tabs=mini(document.createElement('div'),'display:flex;gap:3px');
 const tab=(label:string,k:typeof category)=>{
  const b=mini(document.createElement('button'),'flex:1;padding:5px 2px;border-radius:7px;border:1px solid #446079;background:#18304a;color:#fff;font-size:10px');
  b.textContent=label;b.onclick=()=>{category=k;shown=48;render();};tabs.appendChild(b);return b;
 };
 const ta=tab('CLAUDE ORIGINAL','native'),tb=tab('PREMIUM · 23','premium'),tc=tab('BUFFS','support');
 const input=mini(document.createElement('input'),'width:100%;height:30px;box-sizing:border-box;border:1px solid #6586a0;border-radius:6px;background:#203449;color:#fff;padding:4px 8px;font-size:12px');
 input.placeholder='Buscar habilidad / ID...';input.setAttribute('aria-label','Buscar habilidades');
 input.oninput=()=>{search=input.value.toLowerCase().trim();shown=48;render();};
 const filters=mini(document.createElement('div'),'display:flex;gap:5px');
 const schools=mini(document.createElement('select'),'flex:1;min-width:0;padding:4px;border-radius:5px;color:#fff;background:#243950;font-size:11px');
 for(const key of ['all','warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid']){
  const opt=document.createElement('option');opt.value=key;opt.textContent=key==='all'?'9 escuelas':key.toUpperCase();schools.appendChild(opt);
 }
 schools.onchange=()=>{school=schools.value;shown=48;render();};
 const shapes=mini(document.createElement('select'),'flex:1;min-width:0;padding:4px;border-radius:5px;color:#fff;background:#243950;font-size:11px');
 for(const key of ['all','LINE','CONE','CIRCLE','TARGET','DASH','SELF','RING','GATE','SCRIBE']){
  const opt=document.createElement('option');opt.value=key;opt.textContent=key==='all'?'Apuntados':key;shapes.appendChild(opt);
 }
 shapes.onchange=()=>{shape=shapes.value;shown=48;render();};
 filters.append(schools,shapes);
 const selectedLine=mini(document.createElement('div'),'font-size:11px;color:#a9e9ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis');
 const scroll=mini(document.createElement('div'),'overflow-y:auto;overscroll-behavior:contain;min-height:75px;max-height:220px;touch-action:pan-y;display:flex;flex-direction:column;gap:4px;padding-right:2px');
 scroll.id='hf-r28-scroll';
 const bottom=mini(document.createElement('div'),'display:flex;align-items:center;justify-content:space-between;gap:5px');
 const restore=mini(document.createElement('button'),'background:#26394c;border:1px solid #60798b;border-radius:7px;color:#fff;padding:6px 8px;font-size:10px;white-space:nowrap');
 restore.textContent='↩ VOLVER A ATK NORMAL';
 const close=mini(document.createElement('button'),'background:#243950;color:#fff;border:1px solid #60798b;border-radius:7px;padding:6px;font-size:10px');
 close.textContent='CERRAR';
 const state=mini(document.createElement('div'),'font-size:10px;color:#9fd7f5;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px');
 root.append(trigger,panel,state);body.appendChild(root);
 panel.append(info,tabs,input,filters,selectedLine,scroll,bottom);
 bottom.append(restore,close);
 const attack=h.attackButton;
 const tile=attack?mini(document.createElement('span'),
   'position:absolute;left:3px;right:3px;bottom:1px;font:800 9px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px #000;color:#fff;background:#112a43cc;border-radius:4px;pointer-events:none'):null;
 if(tile&&attack){attack.appendChild(tile);attack.style.position='relative';attack.style.touchAction='none';}
 const icon=attack?mini(document.createElement('span'),
  'position:absolute;inset:2px 3px 13px 3px;background-size:contain;background-position:center;background-repeat:no-repeat;pointer-events:none'):null;
 if(icon&&attack)attack.appendChild(icon);
 const updateATK=()=>{
  const data=selected?list.find(e=>e.id===selected):null;
  if(tile)tile.textContent=data?('▶ '+data.name).slice(0,17):'';
  if(icon)icon.style.backgroundImage=selected?'url("'+h.iconUrl(selected)+'")':'';
  if(attack){
   attack.dataset.r28Skill=selected??'';
   attack.title=data?'ATK · '+data.name+' [CLAUDE ORIGINAL]':'ATK normal';
  }
  trigger.textContent=data?'📖 '+data.name.slice(0,13)+' ▾':'📖 SKILLS ▾';
  selectedLine.textContent=data?'EN ATK: '+data.name+' [CLAUDE ORIGINAL]':'ATK MANUAL ORIGINAL ACTIVO';
 };
 const show=(open:boolean)=>{panel.style.display=open?'flex':'none';trigger.setAttribute('aria-expanded',String(open));};
 trigger.onclick=()=>{show(panel.style.display!=='flex');if(panel.style.display==='flex')render();};
 close.onclick=()=>show(false);
 restore.onclick=()=>{r28Select(h.sim,null);selected=null;updateATK();render();show(false);state.textContent='ATK NORMAL · combo original restaurado';};
 const render=()=>{
  ta.style.borderColor=category==='native'?'#b0e9ff':'#446079';
  tb.style.borderColor=category==='premium'?'#b0e9ff':'#446079';
  tc.style.borderColor=category==='support'?'#b0e9ff':'#446079';
  let rows=category==='native'?native:category==='premium'?list.filter(x=>x.kind==='premium'):
   native.filter(x=>x.shape==='SELF'||x.effect==='holy');
  if(category==='native'||category==='support'){
    if(school!=='all')rows=rows.filter(x=>x.group===school);
  }
  if(shape!=='all')rows=rows.filter(x=>x.shape===shape);
  if(search)rows=rows.filter(x=>(x.name+' '+x.originalName+' '+x.id).toLowerCase().includes(search));
  scroll.replaceChildren();
  for(const item of rows.slice(0,shown)){
   const row=mini(document.createElement('button'),
    'text-align:left;display:flex;flex-direction:column;gap:1px;border:1px solid #45637b;background:#192d40;color:#edf7ff;border-radius:7px;padding:6px;min-height:43px;font-size:11px;flex-shrink:0');
   const works=item.kind==='native'&&r28Selectable(item.id);
   const title=document.createElement('strong');
   title.textContent=item.name+(item.id===selected?' ✓ ATK':'');
   const sub=mini(document.createElement('small'),'font-size:9px;color:#a1c1d6');
   sub.textContent=(item.kind==='native'?'CLAUDE ORIGINAL':'PREMIUM PROTOTIPO')+' · '+item.group.toUpperCase()+' · '+item.shape+' · '+
    (item.pool?item.cost+' '+(item.pool==='mana'?'MP':'STA'):'—')+' · '+
    (item.cooldown===null?'CD pendiente':item.cooldown+'s CD');
   const status=mini(document.createElement('small'),'font-size:9px;color:'+(works?'#a9efc3':'#ffc98e'));
   status.textContent=works?'TOCAR PARA PROBAR EN ATK':item.note;
   row.append(title,sub,status);
   if(works)row.onclick=()=>{
    if(r28Select(h.sim,item.id)){
      selected=item.id;updateATK();show(false);
      state.textContent='ATK → '+item.name+' · '+item.shape;
      visual.hide();
    }
   };
   else row.disabled=true;
   scroll.appendChild(row);
  }
  if(rows.length>shown){
   const more=mini(document.createElement('button'),'padding:8px;color:#fff;background:#294866;border:1px solid #5d8aab;border-radius:6px');
   more.textContent='MOSTRAR MÁS ('+(rows.length-shown)+')';
   more.onclick=()=>{shown+=48;render();};scroll.appendChild(more);
  }
  info.textContent='GRIMORIO · '+rows.length+' '+(category==='premium'?'PROTOTIPOS':'HABILIDADES');
  updateATK();
 };
 render();
 type Aim={point:{x:number;z:number};dir:{x:number;z:number}};
 const cast=(ev:PointerEvent,p:NonNullable<typeof active>)=>{
  if(!selected)return;
  const id=selected,def=ABILITIES[id],spec=highflyAimSpec(id);
  if(!def||!spec)return;
  const actor=h.sim.player;
  const units=Array.from(h.sim.entities.values());
  const distance=Math.max(0.5,spec.range||highflyEffectiveAimRange(def));
  const chosen=originAimSelect(actor,units,null,distance,'nearest',h.cameraYaw());
  const auto=chosen!==null?units.find(x=>x.id===chosen):null;
  const manual=p.drag?highflyManualAim(actor.pos,p.dx,p.dy,distance,spec.shape,h.project,h.cameraYaw()):null;
  const aimed:Aim=manual??{
   point:auto?.pos??{x:actor.pos.x+Math.sin(actor.facing)*distance,z:actor.pos.z+Math.cos(actor.facing)*distance},
   dir:{x:Math.sin(actor.facing),z:Math.cos(actor.facing)}
  };
  const dx=aimed.point.x-actor.pos.x,dz=aimed.point.z-actor.pos.z;
  if(Math.hypot(dx,dz)>0.1)actor.facing=Math.atan2(dx,dz);
  if(def.targetMode==='position'){
   h.sim.castAbilityAt(id,aimed.point);
  }else if(ORIGIN_FREE_SKILLS.has(id)){
   h.sim.castAbilityAt(id,aimed.point);
  }else if(def.requiresTarget){
   const targetId=manual?highflyManualRayTarget(actor.pos,units,manual.dir,
     highflyEffectiveAimRange(def),1.2,def.minRange??0):auto?.id??null;
   if(targetId===null){state.textContent='SIN OBJETIVO VÁLIDO · lanzamiento cancelado';return;}
   h.sim.targetEntity(targetId);h.sim.castAbility(id);
  }else h.sim.castAbility(id);
  state.textContent='SIM NATIVO · '+def.name+' · comprobar efecto/daño';
 };
 const matches=(target:EventTarget|null):boolean=>
  !!attack&&target instanceof Node&&(target===attack||attack.contains(target));
 const start=(ev:PointerEvent)=>{
  if(!selected||!matches(ev.target)||active)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  active={pointerId:ev.pointerId,x:ev.clientX,y:ev.clientY,dx:0,dy:0,drag:false};
  const spec=highflyAimSpec(selected);
  if(spec){
    const a=h.sim.player,pos=a.pos;
    const target={x:pos.x+Math.sin(a.facing)*Math.max(.5,spec.range),
       z:pos.z+Math.cos(a.facing)*Math.max(.5,spec.range)};
    visual.show(spec.selfCentered?{...spec,shape:'circle',range:0.5}:spec,pos,
      spec.selfCentered?pos:target,true);
  }
 };
 const move=(ev:PointerEvent)=>{
  if(!active||ev.pointerId!==active.pointerId||!selected)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  active.dx=ev.clientX-active.x;active.dy=ev.clientY-active.y;
  active.drag=Math.hypot(active.dx,active.dy)>=12;
  const spec=highflyAimSpec(selected);
  if(!spec)return;
  const a=h.sim.player, def=ABILITIES[selected];
  const direction=highflyManualAim(a.pos,active.dx,active.dy,
    Math.max(.5,spec.range),spec.shape,h.project,h.cameraYaw());
  const target=spec.selfCentered?a.pos:direction.point;
  const valid=!def.requiresTarget||ORIGIN_FREE_SKILLS.has(selected)||
    highflyManualRayTarget(a.pos,Array.from(h.sim.entities.values()),direction.dir,
      highflyEffectiveAimRange(def),1.2,def.minRange??0)!==null;
  visual.show(spec.selfCentered?{...spec,shape:'circle',range:.5}:spec,a.pos,target,valid);
 };
 const end=(ev:PointerEvent)=>{
  if(!active||ev.pointerId!==active.pointerId)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  const p=active;active=null;visual.hide();
  // Top-center cancellation, no cast, no cost.
  const cancel=ev.clientY<56&&ev.clientX>innerWidth*.41&&ev.clientX<innerWidth*.59;
  if(!cancel)cast(ev,p);else state.textContent='APUNTADO CANCELADO · sin lanzamiento';
 };
 const canceled=(ev:PointerEvent)=>{
  if(active?.pointerId===ev.pointerId){active=null;visual.hide();}
 };
 const blockClick=(ev:MouseEvent)=>{
  if(!selected||!matches(ev.target))return;
  ev.preventDefault();ev.stopImmediatePropagation();
 };
 document.addEventListener('pointerdown',start,true);
 document.addEventListener('pointermove',move,true);
 document.addEventListener('pointerup',end,true);
 document.addEventListener('pointercancel',canceled,true);
 document.addEventListener('click',blockClick,true);
 return ()=>{
  document.removeEventListener('pointerdown',start,true);
  document.removeEventListener('pointermove',move,true);
  document.removeEventListener('pointerup',end,true);
  document.removeEventListener('pointercancel',canceled,true);
  document.removeEventListener('click',blockClick,true);
  tile?.remove();icon?.remove();root.remove();visual.dispose();
 };
}
