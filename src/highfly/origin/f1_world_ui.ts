/** HIGHFLY ORIGIN F1 — in-world optional weapon-guide and unified resource view.
 * Player interaction and rewards use the ONE native Sim. This module never
 * teleports the actor, creates a second player, or alters quest progression.
 */
import type { Sim } from '../../sim/sim';
import { PLAYER_START } from '../../sim/data';
import {
  claimOriginStarter,
  ORIGIN_STARTER_WEAPONS,
  tickF1Resources,
  type OriginF1Save,
} from './f1_core';

export const ORIGIN_GUIDE_ID = 'hf_origin_wayfarer';
export const ORIGIN_GUIDE_POS = { x: PLAYER_START.x + 5, z: PLAYER_START.z + 2 };

export interface OriginF1WorldUi {
  save(): OriginF1Save;
  close(): void;
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, cls = ''):
    HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}

export function mountOriginF1WorldUi(
  sim: Sim, initial: OriginF1Save, onStarterGranted: () => void,
): OriginF1WorldUi {
  document.getElementById('hf-origin-f1-hud')?.remove();
  const root = node('aside', '', 'hf-origin-f1-hud');
  root.id = 'hf-origin-f1-hud';
  root.setAttribute('aria-label', 'Hunter: recursos y guía de inicio');
  root.style.cssText = 'position:fixed;left:max(12px,env(safe-area-inset-left));top:55px;z-index:2147483000;color:#fff;font:600 12px system-ui;pointer-events:none;max-width:245px';
  const meter = node('div', '', 'hf-origin-f1-resource-meter');
  meter.style.cssText = 'background:#0b1923d9;border:1px solid #63828a;border-radius:12px;padding:9px 12px;box-shadow:0 3px 15px #0007';
  root.append(meter);
  const renderBars: Record<'hp'|'mana'|'stamina', {wrap:HTMLDivElement;fill:HTMLDivElement;label:HTMLSpanElement}> =
    {} as Record<'hp'|'mana'|'stamina', {wrap:HTMLDivElement;fill:HTMLDivElement;label:HTMLSpanElement}>;
  for (const [key, title, color] of [
    ['hp','HP','#df5266'],['mana','MP','#4e98e8'],['stamina','ST','#54c48e'],
  ] as const) {
    const row = node('div', '', '');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:3px 0';
    const lab = node('span', title);
    lab.style.width = '24px';
    const track = node('div', '');
    track.style.cssText='background:#364250;flex:1;width:150px;height:7px;border-radius:7px;overflow:hidden';
    const fill = node('div', '');
    fill.style.cssText = `height:100%;background:${color};width:100%;border-radius:7px`;
    track.append(fill);
    const value = node('span', '—');
    value.style.cssText='width:66px;text-align:right;font-size:10px';
    row.append(lab,track,value);
    meter.append(row);
    renderBars[key] = {wrap:row,fill,label:value};
  }
  // Compact proximity CTA remains above the battlefield, never covering the
  // movement joystick. Weapon choices open in their own true modal layer.
  // The old left-aligned floating guide clipped options beneath mobile controls.
  const guide = node('div', '', 'hf-origin-f1-guide');
  guide.id = 'hf-origin-f1-guide';
  guide.style.cssText='display:none;position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(340px,74vw);pointer-events:auto;z-index:190';
  const talk=node('button','VETERANO DEL CAMINO · ELEGIR ARMA');
  talk.id='hf-origin-f1-open';
  talk.type='button';
  talk.style.cssText='display:block;width:100%;min-height:42px;background:#bd9459;color:#091725;border:2px solid #f2d29a;border-radius:12px;padding:8px;font:750 12px system-ui;cursor:pointer;box-shadow:0 3px 14px #000a';
  guide.append(talk);
  root.append(guide);

  const backdrop=node('div','','hf-origin-f1-modal-backdrop');
  backdrop.id='hf-origin-f1-modal-backdrop';
  backdrop.style.cssText='display:none;position:fixed;inset:0;width:100vw;height:100dvh;z-index:200;background:#000a;align-items:center;justify-content:center;pointer-events:auto;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box';
  const modal=node('section','','hf-origin-f1-weapon-dialog');
  modal.id='hf-origin-f1-weapon-dialog';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','Elegir arma inicial');
  modal.style.cssText='box-sizing:border-box;width:min(490px,100%);max-height:100%;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;background:#111e30;border:2px solid #cca96f;border-radius:16px;padding:14px;color:#fff;box-shadow:0 10px 32px #000b;font:500 14px system-ui';
  const title=node('div','Veterano del Camino');
  title.style.cssText='font-size:18px;font-weight:800;color:#f1d29b;margin:0 0 6px';
  const caption=node('p','Elegí un arma inicial, o seguí a puño limpio. Es opcional.');
  caption.style.cssText='margin:0 0 10px;line-height:1.35';
  const options=node('div','','hf-origin-f1-options');
  options.id='hf-origin-f1-options';
  options.style.cssText='display:flex;flex-direction:column;gap:8px';
  const status=node('div','');
  status.setAttribute('role','status');
  status.style.cssText='min-height:0;font-size:12px;padding-top:5px;color:#ffd38f';
  const closeButton=node('button','VOLVER AL MUNDO');
  closeButton.id='hf-origin-f1-close';
  closeButton.type='button';
  closeButton.style.cssText='display:block;width:100%;min-height:40px;margin-top:8px;background:#28394f;border:1px solid #a8b2c0;border-radius:9px;color:#fff;font:700 12px system-ui;cursor:pointer';
  modal.append(title,caption,options,status,closeButton);
  backdrop.append(modal);
  root.append(backdrop);
  document.body.append(root);
  let current=structuredClone(initial);
  let last=performance.now();
  let open=false;
  const setOpen=(next:boolean)=>{
    open=next;
    backdrop.style.display=open?'flex':'none';
    talk.setAttribute('aria-expanded',String(open));
    if(open)closeButton.focus({preventScroll:true});
  };
  talk.addEventListener('click',()=>setOpen(true));
  closeButton.addEventListener('click',()=>setOpen(false));
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)setOpen(false)});
  for(const item of ORIGIN_STARTER_WEAPONS){
    const b=node('button',item.label);
    b.type='button';
    b.dataset.starter=item.id;
    b.style.cssText='width:100%;min-height:44px;padding:10px 12px;border:1px solid #8395ab;border-radius:9px;background:#33465d;color:white;text-align:center;font:700 13px system-ui;cursor:pointer;touch-action:manipulation';
    b.addEventListener('click',()=>{
      if (current.starterClaimed) return;
      const next=claimOriginStarter(current,item.id);
      if (!next || !sim.canAddItem(item.id,1,sim.playerId)) {
        status.textContent='No hay espacio en el inventario.';
        return;
      }
      sim.addItem(item.id,1,sim.playerId);
      sim.equipItem(item.id,sim.playerId);
      const equipped=sim.players.get(sim.playerId)?.equipment.mainhand===item.id;
      if (!equipped) {
        sim.removeItem(item.id,1,sim.playerId);
        status.textContent='Esta arma aún requiere adaptación al Hunter.';
        return;
      }
      current=next;
      setOpen(false);
      onStarterGranted();
      guide.style.display='none';
    });
    options.append(b);
  }
  const timer=window.setInterval(()=>{
    if(!root.isConnected) {window.clearInterval(timer);return;}
    const now=performance.now();
    current={...current,resources:tickF1Resources(current.resources,(now-last)/1000)};
    last=now;
    const p=sim.player;
    for(const [key,cur,max] of [
      ['hp', p.hp, p.maxHp],
      ['mana',current.resources.mana,current.resources.maxMana],
      ['stamina',current.resources.stamina,current.resources.maxStamina],
    ] as const){
      const bar=renderBars[key];
      bar.fill.style.width = `${Math.round(100*Math.max(0,Math.min(1,max>0?cur/max:0)))}%`;
      bar.label.textContent = `${Math.round(cur)} / ${Math.round(max)}`;
    }
    const dx=p.pos.x-ORIGIN_GUIDE_POS.x, dz=p.pos.z-ORIGIN_GUIDE_POS.z;
    const nearby=(dx*dx+dz*dz)<(8*8);
    guide.style.display = nearby&&!current.starterClaimed?'block':'none';
    if (!nearby || current.starterClaimed) {
      if (open) setOpen(false);
    }
  },120);
  return {
    save:()=>structuredClone(current),
    close:()=>{window.clearInterval(timer);root.remove();}
  };
}
