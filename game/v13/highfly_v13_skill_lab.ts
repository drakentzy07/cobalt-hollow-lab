/** HIGHFLY V13 — opt-in browser-native skill selector on the REAL ClaudeCraft renderer/Sim.
 * All casts enter original Hud.castSlot: NEVER fake projectile, damage or VFX.
 * This UI is a selectable playtest harness, NOT proof of the visual quality.
 */
import { HIGHFLY_FUSED_SKILLS, type HighflyClass } from './sf3_skill_catalog';
import { ABILITIES } from '../sim/content/classes';

const CLASS_NAMES: Record<HighflyClass,string> = {
  warrior:'Warrior',paladin:'Paladin',hunter:'Hunter',rogue:'Rogue',
  priest:'Priest',shaman:'Shaman',mage:'Mage',warlock:'Warlock',druid:'Druid',
};
const CLASS_IDS = Object.keys(CLASS_NAMES) as HighflyClass[];
// A separate testing mode, never a gameplay rule. Enabled only after V13 UI mounts.
let v13PreviewResourcesEnabled=false;
export function highflyV13ResourceRefillEnabled():boolean {
  return v13PreviewResourcesEnabled;
}
export function highflyV13PickSmartTarget(
  entities:Iterable<{id:number;pos:{x:number;z:number}}>,
  origin:{x:number;z:number}, cameraYaw:number, range:number,
  attackable:(id:number)=>boolean,
):number|null {
  const sx=Math.sin(cameraYaw),sz=Math.cos(cameraYaw);
  let best:number|null=null,bestScore=Infinity;
  for(const e of entities){
    if(!attackable(e.id))continue;
    const x=e.pos.x-origin.x,z=e.pos.z-origin.z;
    const d=Math.hypot(x,z);
    if(!(d>0.001 && d<=range))continue;
    const dot=(sx*x+sz*z)/d;
    // Taps prefer a nearby visible-front target, but can turn toward the only
    // valid target behind the player (as requested for HIGHFLY soft aim).
    const penalty=dot<0?range+10:(1-dot)*2;
    const score=d+penalty;
    if(score<bestScore || (score===bestScore && (best===null || e.id<best))){
      best=e.id;bestScore=score;
    }
  }
  return best;
}
export function highflyV13Requested():boolean {
  return new URLSearchParams(location.search).get('hf-v13')==='1';
}
export function highflyV13Class():HighflyClass {
  const value = new URLSearchParams(location.search).get('hf-v13-class');
  return CLASS_IDS.includes(value as HighflyClass) ? value as HighflyClass : 'warrior';
}
export interface HighflyV13LabHooks {
  equip(id:string,slot:number):boolean;
  cast(slot:number):void;
  aim(slot:number,sx:number,sy:number,x:number,y:number,drag:boolean):boolean;
  readResource():{type:string;current:number;max:number};
}
export function installHighflyV13SkillLab(hooks:HighflyV13LabHooks):void {
  if (!highflyV13Requested()) return;
  if (document.getElementById('highfly-v13-skill-lab')) return;
  const cls=highflyV13Class();
  v13PreviewResourcesEnabled=true;
  const root=document.createElement('aside');
  root.id='highfly-v13-skill-lab';
  root.setAttribute('aria-label','HIGHFLY V13 selector de 63 habilidades');
  Object.assign(root.style,{
    position:'fixed',zIndex:'9990',right:'max(8px, env(safe-area-inset-right))',
    top:'8px',width:'min(330px, 48vw)',maxHeight:'min(83vh, 680px)',
    overflow:'hidden',border:'1px solid #7abbd9',borderRadius:'13px',
    boxShadow:'0 8px 28px #000b',background:'rgba(8,17,33,.96)',
    color:'#f2f8ff',font:'12px system-ui,sans-serif',display:'flex',
    flexDirection:'column',touchAction:'pan-y',
  });
  const make=(tag:string,label:string,css='')=>{
    const el=document.createElement(tag);
    el.textContent=label;
    el.setAttribute('style',css);
    return el;
  };
  const header=make('div','HIGHFLY V13 · 7 SKILLS NUEVAS / CLASE',
    'padding:10px 12px;font-weight:900;font-size:13px;background:#1c3952;');
  const bar=make('div','','display:flex;gap:6px;padding:7px;align-items:center;');
  const select=document.createElement('select');
  select.setAttribute('aria-label','Elegir clase HIGHFLY');
  Object.assign(select.style,{background:'#20374d',color:'#fff',flex:'1',minWidth:'0',padding:'7px',borderRadius:'7px'});
  CLASS_IDS.forEach(id=>{
    const o=document.createElement('option');o.value=id;o.textContent=CLASS_NAMES[id];o.selected=id===cls;
    select.append(o);
  });
  select.addEventListener('change',()=>{
    const url=new URL(location.href);
    url.searchParams.set('hf-v13','1');
    url.searchParams.set('hf-v13-class',select.value);
    url.searchParams.set('hf-manual-aim','1');
    location.assign(url.href);
  });
  bar.append(select);
  const close=make('button','OCULTAR','border:0;border-radius:7px;padding:7px;background:#324b69;color:white;');
  bar.append(close);
  const status=make('div','Preparando las 7 habilidades nuevas de esta clase…',
    'padding:6px 10px;color:#bfe8ff;line-height:1.3;');
  const resourceMode=make('button','♾ RECURSOS VFX · RECARGA AUTOMÁTICA ACTIVA',
    'margin:0 8px 6px;border:1px solid #55ba85;background:#133c36;color:#e6fff3;padding:8px;border-radius:7px;font-weight:800;');
  resourceMode.addEventListener('click',()=>{
    v13PreviewResourcesEnabled=!v13PreviewResourcesEnabled;
    const resource=hooks.readResource();
    resourceMode.textContent=v13PreviewResourcesEnabled
      ? '♾ RECURSOS VFX · RECARGA AUTOMÁTICA ACTIVA'
      : '⚖ RECURSOS REALES · '+resource.type.toUpperCase()+' (SIN RECARGA)';
    status.textContent=v13PreviewResourcesEnabled
      ? 'MODO VFX: '+resource.type+' lleno en cada tick; daño/cooldowns/condiciones siguen siendo nativos.'
      : 'MODO REAL: '+resource.type+' y costes auténticos. Con ATK normal OFF, la ira no se genera por golpes básicos.';
  });
  const viewport=make('div','','overflow-y:auto;overscroll-behavior:contain;padding:6px 8px;flex:1;');
  const rowButton=(text:string, id:string, slot:number, title:string, accent:string)=>{
    const b=make('button',text,
      'border:1px solid '+accent+';border-radius:7px;padding:7px 8px;'+
      'background:#183047;color:white;text-align:left;line-height:1.2;cursor:pointer;');
    b.setAttribute('title',title);
    b.addEventListener('click',()=>{
      if(!hooks.equip(id,slot)){
        status.textContent='NO EQUIPADA: '+id+' (bloqueo del HUD original).';
        return;
      }
      status.textContent='PROBANDO '+id+' → S'+slot+'. Revisá el efecto en el mundo.';
      hooks.cast(slot);
    });
    return b;
  };
  const specs=HIGHFLY_FUSED_SKILLS[cls];
  // Equip all seven HIGHFLY fusions BEFORE the player touches the action ring.
  // Original Hud enforces real known-ability eligibility; no fake cast shortcuts.
  const equipSeven=():{ok:number;failed:string[]}=>{
    const failed:string[]=[];
    for(const spec of specs){
      if(!hooks.equip(spec.id,spec.slot))failed.push(spec.name);
    }
    const ok=specs.length-failed.length;
    root.dataset.highflyV13Equipped=String(ok);
    root.dataset.highflyV13Class=cls;
    status.textContent=failed.length
      ? 'EQUIPADAS '+ok+'/7 · FALLARON: '+failed.join(', ')+
        '. Probá RESTAURAR 7 y avisame de este mensaje.'
      : '✓ 7/7 NUEVAS EQUIPADAS · ATK NORMAL OFF · Grabá solo VFX de S1–S7.';
    if(failed.length)console.warn('[HIGHFLY V13] 7/7 autoloadout incomplete',cls,failed);
    return {ok,failed};
  };
  equipSeven();
  const restore=make('button','↺ RESTAURAR LAS 7 NUEVAS AL HUD',
    'margin:0 8px 6px;border:1px solid #55aad3;background:#19405b;color:#fff;padding:9px;border-radius:7px;font-weight:800;');
  restore.addEventListener('click',()=>{equipSeven();});
  const originalsGroups:HTMLElement[]=[];
  let showOriginals=false;
  for(const spec of specs){
    const d=ABILITIES[spec.id];
    const card=make('section','','padding:8px;margin-bottom:6px;border:1px solid #33536b;border-radius:9px;');
    const label=make('div','NUEVA '+spec.slot+' / 7 · '+spec.name,
      'font-weight:800;font-size:13px;margin-bottom:6px;');
    const meta=make('div','LV '+spec.unlockLevel+' · CD '+(d?.cooldown??'?')+
      's · alcance '+(d?.range??'?')+' · '+(d?.targetMode??'objetivo'),
      'font-size:11px;color:#9cd0ea;margin-bottom:6px;');
    const btns=make('div','','display:grid;grid-template-columns:1fr;gap:5px;');
    btns.append(rowButton('⚔ PROBAR NUEVA · '+spec.name,spec.id,spec.slot,
      'Nueva habilidad HIGHFLY: motor nativo de combate','#43a0d9'));
    const originals=make('div','','display:none;flex-direction:column;gap:5px;padding-top:6px;');
    for(const id of spec.donors){
      const orig=ABILITIES[id];
      originals.append(rowButton('A · ORIGINAL · '+(orig?.name??id),id,spec.slot,
        'ClaudeCraft original, comparación opcional','#5e9a7c'));
    }
    originalsGroups.push(originals);
    card.append(label,meta,btns,originals);
    viewport.append(card);
  }
  const oldToggle=make('button','MOSTRAR ORIGINALES (OPCIONAL)',
    'margin:0 8px 6px;border:1px solid #526d83;background:#1e344a;color:#e0edf7;padding:7px;border-radius:7px;');
  oldToggle.addEventListener('click',()=>{
    showOriginals=!showOriginals;
    oldToggle.textContent=showOriginals?'OCULTAR ORIGINALES':'MOSTRAR ORIGINALES (OPCIONAL)';
    originalsGroups.forEach(group=>{group.style.display=showOriginals?'flex':'none';});
  });
  const foot=make('div',
    'ATK NORMAL DESACTIVADO (SOLO V13) · SKILLS S1–S7 · VFX sin golpes básicos',
    'padding:8px;color:#c1d1df;background:#10283c;font-size:11px;');
  const toggle=make('button','⚔ SKILLS 63',
    'position:fixed;right:12px;top:9px;z-index:9991;padding:10px 13px;'+
    'background:#153b57;color:#fff;border:2px solid #74d9ff;border-radius:10px;display:none;');
  close.addEventListener('click',()=>{root.style.display='none';toggle.style.display='block';});
  toggle.addEventListener('click',()=>{root.style.display='flex';toggle.style.display='none';});
  root.append(header,bar,status,resourceMode,restore,oldToggle,viewport,foot);
  // Mobile Legends inspired V13 ONLY: seven direct thumb skills; tap auto-selects,
  // drag previews a direction/area, release commits the ORIGINAL native cast.
  // The legacy petal/radial input is hidden exclusively in this isolated lab.
  const deck=make('div','','position:fixed;z-index:9961;right:max(120px,11vw);bottom:20px;'+
    'width:min(344px,46vw);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));'+
    'gap:7px;touch-action:none;');
  deck.id='highfly-v13-seven-skill-deck';
  const canvas=document.createElement('canvas');
  canvas.id='highfly-v13-aim-preview';
  Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',
    zIndex:'9959',pointerEvents:'none',display:'none'});
  const ctx=canvas.getContext('2d');
  const resetAim=()=>{
    canvas.style.display='none';
    ctx?.clearRect(0,0,innerWidth,innerHeight);
  };
  const preview=(sx:number,sy:number,x:number,y:number,slot:number)=>{
    if(!ctx)return;
    canvas.style.display='block';
    canvas.width=Math.max(1,Math.floor(innerWidth*devicePixelRatio));
    canvas.height=Math.max(1,Math.floor(innerHeight*devicePixelRatio));
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.lineWidth=4;ctx.strokeStyle='rgba(91,221,255,.95)';
    ctx.fillStyle='rgba(91,221,255,.14)';ctx.setLineDash([10,6]);
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';
    ctx.fillText('S'+slot+' · SOLTAR PARA LANZAR',Math.max(5,x-92),Math.max(18,y-25));
  };
  for(const spec of specs){
    const btn=make('button','S'+spec.slot+'\n'+spec.name,
      'display:flex;flex-direction:column;justify-content:center;align-items:center;'+
      'white-space:pre-line;text-align:center;line-height:1.1;min-height:64px;'+
      'padding:6px 3px;border-radius:12px;border:2px solid #57bdec;'+
      'background:rgba(9,37,60,.94);color:white;font:600 10px system-ui;'+
      'touch-action:none;user-select:none;-webkit-user-select:none;');
    // Native touch-owner ledger MUST classify V13 buttons as combat controls,
    // never as camera drags, including S23 Ultra joystick multitouch.
    btn.classList.add('mobile-btn');
    btn.setAttribute('aria-label','S'+spec.slot+' '+spec.name+' · tocar o arrastrar');
    btn.title='TOCAR: autoapuntar y lanzar · ARRASTRAR: apuntado manual';
    let active:{id:number;sx:number;sy:number}|null=null;
    btn.addEventListener('pointerdown',(e)=>{
      if(active)return;
      e.preventDefault();e.stopPropagation();
      active={id:e.pointerId,sx:e.clientX,sy:e.clientY};
      btn.setPointerCapture(e.pointerId);
      btn.style.borderColor='#ffe88b';
    });
    btn.addEventListener('pointermove',(e)=>{
      if(!active||active.id!==e.pointerId)return;
      e.preventDefault();e.stopPropagation();
      if(Math.hypot(e.clientX-active.sx,e.clientY-active.sy)>16)
        preview(active.sx,active.sy,e.clientX,e.clientY,spec.slot);
    });
    btn.addEventListener('pointerup',(e)=>{
      if(!active||active.id!==e.pointerId)return;
      e.preventDefault();e.stopPropagation();
      const a=active;active=null;resetAim();
      btn.style.borderColor='#57bdec';
      const drag=Math.hypot(e.clientX-a.sx,e.clientY-a.sy)>20;
      const ok=hooks.aim(spec.slot,a.sx,a.sy,e.clientX,e.clientY,drag);
      status.textContent=ok
        ? 'S'+spec.slot+' '+spec.name+(drag?' · APUNTADO MANUAL':' · AUTOAPUNTADO')+
          (v13PreviewResourcesEnabled?' · RECURSO VFX ∞':' · RECURSO REAL')
        : 'S'+spec.slot+': objetivo inválido o fuera de alcance. Probá apuntar al dummy.';
    });
    btn.addEventListener('pointercancel',()=>{active=null;resetAim();btn.style.borderColor='#57bdec';});
    deck.append(btn);
  }
  document.body.append(root,toggle,deck,canvas);
  document.body.dataset.highflyV13NormalAttack='disabled';
  document.body.dataset.highflyV13SkillAim='seven-direct-buttons';
  // Native radial icons would compete for the same right-thumb gestures.
  const nativeRing=document.getElementById('mobile-action-ring');
  if(nativeRing)nativeRing.style.setProperty('display','none','important');
  const nativeRadial=document.getElementById('mobile-action-radial');
  if(nativeRadial)nativeRadial.style.setProperty('display','none','important');
  // Only this isolated V13 HUD: ordinary ATK is disabled, not skill strikes.
  const normalAtk=document.getElementById('mobile-action-attack') as HTMLButtonElement|null;
  if(normalAtk){
    normalAtk.disabled=true;
    normalAtk.setAttribute('aria-label','ATK normal desactivado en el laboratorio V13');
    normalAtk.style.opacity='.3';
    normalAtk.style.filter='grayscale(1)';
  }
}
