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
  const status=make('div','Tocá PROBAR para lanzar una habilidad NUEVA HIGHFLY (B).',
    'padding:6px 10px;color:#bfe8ff;line-height:1.3;');
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
    'SOLO SKILLS NUEVAS · 7 por clase / 63 total · VFX: revisión visual S23 pendiente',
    'padding:8px;color:#c1d1df;background:#10283c;font-size:11px;');
  const toggle=make('button','⚔ SKILLS 63',
    'position:fixed;right:12px;top:9px;z-index:9991;padding:10px 13px;'+
    'background:#153b57;color:#fff;border:2px solid #74d9ff;border-radius:10px;display:none;');
  close.addEventListener('click',()=>{root.style.display='none';toggle.style.display='block';});
  toggle.addEventListener('click',()=>{root.style.display='flex';toggle.style.display='none';});
  root.append(header,bar,status,oldToggle,viewport,foot);
  document.body.append(root,toggle);
}
