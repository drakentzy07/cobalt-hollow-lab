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
}
export function installHighflyV13SkillLab(hooks:HighflyV13LabHooks):void {
  if (!highflyV13Requested()) return;
  if (document.getElementById('highfly-v13-skill-lab')) return;
  const cls=highflyV13Class();
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
  const header=make('div','HIGHFLY V13 · SKILL LAB · 63/63',
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
  const status=make('div','Seleccioná una habilidad. Se ejecuta el motor ORIGINAL de ClaudeCraft.',
    'padding:6px 10px;color:#bfe8ff;line-height:1.3;');
  const chosen=make('div','Ranura de prueba: S1','padding:7px 10px;background:#10283c;');
  const slots=make('div','','display:flex;gap:3px;padding:0 8px 6px;flex-wrap:wrap;');
  let selectedSlot=1;
  for(let n=1;n<=7;n++){
    const b=make('button','S'+n,
      'padding:6px 8px;border:1px solid #547a9a;border-radius:6px;background:#182e45;color:#fff;');
    b.addEventListener('click',()=>{
      selectedSlot=n;chosen.textContent='Ranura de prueba: S'+n;
      for(const c of Array.from(slots.children)) (c as HTMLElement).style.outline='none';
      b.style.outline='2px solid #4cdfff';
    });
    if(n===1)b.style.outline='2px solid #4cdfff';
    slots.append(b);
  }
  const viewport=make('div','','overflow-y:auto;overscroll-behavior:contain;padding:6px 8px;flex:1;');
  const rowButton=(text:string, id:string, title:string, accent:string)=>{
    const b=make('button',text,
      'border:1px solid '+accent+';border-radius:7px;padding:7px 8px;'+
      'background:#183047;color:white;text-align:left;line-height:1.2;cursor:pointer;');
    b.setAttribute('title',title);
    b.addEventListener('click',()=>{
      if(!hooks.equip(id,selectedSlot)){
        status.textContent='NO EQUIPADA: '+id+' (bloqueo del HUD original).';
        return;
      }
      status.textContent='EQUIPADA '+id+' → S'+selectedSlot+'. Lanzando por HUD original…';
      hooks.cast(selectedSlot);
    });
    return b;
  };
  const specs=HIGHFLY_FUSED_SKILLS[cls];
  for(const spec of specs){
    const d=ABILITIES[spec.id];
    const card=make('section','','padding:8px;margin-bottom:6px;border:1px solid #33536b;border-radius:9px;');
    const label=make('div','S'+spec.slot+' · '+spec.name,
      'font-weight:800;font-size:13px;margin-bottom:6px;');
    const meta=make('div','LV '+spec.unlockLevel+' · CD '+(d?.cooldown??'?')+
      's · alcance '+(d?.range??'?')+' · '+(d?.targetMode??'objetivo'),
      'font-size:11px;color:#9cd0ea;margin-bottom:6px;');
    const btns=make('div','','display:grid;grid-template-columns:1fr;gap:5px;');
    btns.append(rowButton('B · HIGHFLY: PROBAR',spec.id,'Motor nativo de combate','#43a0d9'));
    for(const id of spec.donors){
      const orig=ABILITIES[id];
      btns.append(rowButton('A · '+(orig?.name??id),id,
        'Habilidad original, mismo personaje y dummy','#5e9a7c'));
    }
    card.append(label,meta,btns);
    viewport.append(card);
  }
  const foot=make('div',
    '63 registros SF27 | 7 por clase | VFX: inspección S23 pendiente | Scroll para cambiar habilidad',
    'padding:8px;color:#c1d1df;background:#10283c;font-size:11px;');
  const toggle=make('button','⚔ SKILLS 63',
    'position:fixed;right:12px;top:9px;z-index:9991;padding:10px 13px;'+
    'background:#153b57;color:#fff;border:2px solid #74d9ff;border-radius:10px;display:none;');
  close.addEventListener('click',()=>{root.style.display='none';toggle.style.display='block';});
  toggle.addEventListener('click',()=>{root.style.display='flex';toggle.style.display='none';});
  root.append(header,bar,chosen,slots,status,viewport,foot);
  document.body.append(root,toggle);
}
