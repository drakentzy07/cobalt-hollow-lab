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
  root.style.cssText = 'position:fixed;left:max(12px,env(safe-area-inset-left));top:55px;z-index:45;color:#fff;font:600 12px system-ui;pointer-events:none;max-width:245px';
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
  const guide = node('div', '', 'hf-origin-f1-guide');
  guide.style.cssText='display:none;pointer-events:auto;margin-top:10px;padding:12px;background:#111e30eb;border:1px solid #cca96f;border-radius:12px;max-width:245px';
  const title=node('div', 'Veterano del Camino');
  title.style.cssText='font-size:14px;font-weight:750;color:#f1d29b';
  const caption=node('p','¿Viajás sin armas? Elegí una si querés. También podés seguir a puño limpio.');
  caption.style.cssText='margin:7px 0;font-weight:400;line-height:1.4';
  const talk=node('button','HABLAR · ELECCIÓN OPCIONAL');
  talk.type='button';
  talk.style.cssText='background:#bd9459;color:#091725;border:0;border-radius:7px;padding:9px;font-weight:800;cursor:pointer;max-width:100%';
  const options=node('div','');
  options.style.cssText='display:none;gap:6px;flex-wrap:wrap;margin-top:8px';
  const status=node('div','');
  status.setAttribute('role','status');
  status.style.cssText='font-size:11px;padding-top:5px';
  guide.append(title,caption,talk,options,status);
  root.append(guide);
  document.body.append(root);
  let current=structuredClone(initial);
  let last=performance.now();
  let open=false;
  talk.addEventListener('click',()=>{
    open=!open;
    options.style.display=open?'flex':'none';
  });
  for(const item of ORIGIN_STARTER_WEAPONS){
    const b=node('button',item.label);
    b.type='button';
    b.style.cssText='padding:7px;border:1px solid #8395ab;border-radius:6px;background:#33465d;color:white;cursor:pointer';
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
  },120);
  return {
    save:()=>structuredClone(current),
    close:()=>{window.clearInterval(timer);root.remove();}
  };
}
