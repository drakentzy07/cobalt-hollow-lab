#!/usr/bin/env python3
"""P04: opt-in eight real native dungeon expeditions in SAME PR19 game host.
Fail closed if ClaudeCraft/PR19 seams diverge. No Sim/core save modification.
"""
from pathlib import Path

d=Path('src/sim/data.ts')
s=d.read_text(encoding='utf-8')
header="export const DUNGEONS: Record<string, DungeonDef> = {"
assert s.count(header)==1, 'P04 refuse non-original dungeon data seam'
insert="import { buildHighflyNativeHuntDungeons } from '../highfly/monsters/hunt_dungeon_registry';\n"
assert insert not in s
s=insert+s
anchor="export const DUNGEON_LIST: DungeonDef[] = Object.values(DUNGEONS).sort((a, b) => a.index - b.index);"
assert s.count(anchor)==1, 'P04 missing DUNGEON_LIST canonical registration'
s=s.replace(anchor,'''// P04 opt-in only. Register BEFORE donor builds DUNGEON_LIST + byIndex lookup.
if (import.meta.env?.VITE_HIGHFLY_NATIVE_HUNT === '1') {
  Object.assign(DUNGEONS, buildHighflyNativeHuntDungeons(DUNGEONS));
}
''' + anchor)
d.write_text(s,encoding='utf-8')

p=Path('src/highfly/game_c1_runtime.ts')
s=p.read_text(encoding='utf-8')
base="import '../styles/hf_game_c1.css';"
assert s.count(base)==1, 'P04 expects PR19 game runtime'
s=s.replace(base,base+'''
import { HIGHFLY_HUNT_SCENARIOS } from './monsters/hunt_scenarios';
import { highflyMonsterId } from './monsters/level99';
import { highflyNativeHuntDungeonId } from './monsters/hunt_dungeon_registry';
import { admitHighflyNativeDungeonWave } from './monsters/hunt_native_dungeon';
''',1)
anchor="function ensureUtilityLane(): void {"
assert s.count(anchor)==1, 'P04 missing original PR19 More/menu hook'
code=r"""
/** P04 only: a discoverable door onto the ORIGINAL Sim + native instances.
 * Eight tiered dungeon prototypes, not the final authored outdoor biomes.
 * Never creates a second Hunter, awards resources or raises level.
 */
function ensureHighflyNativeHuntMore(): void {
  if (import.meta.env.VITE_HIGHFLY_NATIVE_HUNT !== '1') return;
  const grid = document.getElementById('mobile-extra-grid');
  if (!grid || document.getElementById('hf-v403-hunt-more')) return;
  const button=document.createElement('button');
  button.type='button';
  button.id='hf-v403-hunt-more';
  button.className='mobile-btn';
  button.title='Expediciones LV21–99 con tu Hunter actual';
  const icon=document.createElement('span');
  icon.textContent='⚔';
  icon.setAttribute('aria-hidden','true');
  const label=document.createElement('span');
  label.className='mobile-label';
  label.textContent='Cacerías';
  button.append(icon,label);
  button.addEventListener('click',()=>{
    document.querySelector<HTMLElement>('#mobile-extra-controls .panel-title .x-btn')?.click();
    const g=game(),sim=g?.sim;
    if (!sim || !Number.isInteger(sim.playerId)) return;
    const p=sim.entities.get(sim.playerId);
    if(!p || p.kind!=='player'||p.dead||p.ghost)return;
    document.getElementById('hf-v403-hunt-panel')?.remove();
    const panel=document.createElement('div');
    panel.id='hf-v403-hunt-panel';
    panel.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:11000;width:min(460px,92vw);max-height:90vh;overflow:auto;background:#141e2e;color:#f8eaca;padding:14px;border:2px solid #b89b66;border-radius:12px;box-shadow:0 0 0 100vmax #0009;display:grid;gap:9px;font:14px system-ui';
    const heading=document.createElement('strong');
    heading.textContent='⚔ Expediciones HIGHFLY';
    const note=document.createElement('div');
    note.textContent='Tu mismo Hunter. Mazmorras nativas de prueba, no mapas finales.';
    const select=document.createElement('select');
    select.id='hf-v403-hunt-select';
    select.style.cssText='width:100%;min-height:44px;color:#fff;background:#24374e;border:1px solid #ba995b;padding:8px;border-radius:7px';
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      const option=document.createElement('option');
      option.value=s.id;
      option.textContent='LV '+s.minLevel+'–'+s.maxLevel+' · '+s.title;
      option.disabled=p.level<s.minLevel;
      select.append(option);
    }
    const available=[...select.options].find(o=>!o.disabled);
    if(available)select.value=available.value;
    const status=document.createElement('div');
    status.id='hf-v403-hunt-status';
    status.textContent=available?'Elegí una expedición.':'Desbloquea cacerías en nivel 21.';
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:8px';
    const go=document.createElement('button');
    go.type='button';go.textContent='Ingresar';
    go.disabled=!available;
    go.style.cssText='flex:1;min-height:44px;color:#fff;background:#3f583a;border-radius:7px';
    const cancel=document.createElement('button');
    cancel.type='button';cancel.textContent='Cerrar';
    cancel.style.cssText='flex:1;min-height:44px;color:#fff;background:#4b3340;border-radius:7px';
    cancel.addEventListener('click',()=>panel.remove());
    go.addEventListener('click',()=>{
      const s=HIGHFLY_HUNT_SCENARIOS.find(x=>x.id===select.value);
      const original=game()?.sim;
      const pid=original?.playerId;
      const hunter=original?.entities.get(pid);
      if(!s||!hunter||hunter.level<s.minLevel||hunter.dead||hunter.ghost){
        status.textContent='Acceso denegado: nivel insuficiente o Hunter no disponible.';
        return;
      }
      const id=highflyNativeHuntDungeonId(s.id);
      if(!original.enterDungeon(id,pid)){
        status.textContent='ClaudeCraft no autorizó la entrada.';
        return;
      }
      const result=admitHighflyNativeDungeonWave(original,pid,{
        scenarioId:s.id,dungeonId:id,
        level:Math.min(s.maxLevel,hunter.level),
        mobIds:s.families.slice(0,4).map(f=>highflyMonsterId(f,s.minLevel)),
      });
      if(!result.ok){
        status.textContent='Entrada nativa, enemigos no admitidos: '+result.reason;
        return;
      }
      panel.remove();
    });
    actions.append(go,cancel);
    panel.append(heading,note,select,status,actions);
    document.body.append(panel);
  });
  grid.prepend(button);
}

"""
s=s.replace(anchor,code+anchor,1)
# Keep original sync and add one idempotent shortcut at end of utility paint.
anchor="  ensureHighflyCraftingTouchLayout();\n}"
assert s.count(anchor)==1, 'P04 PR19 original utility lane does not match'
s=s.replace(anchor,"  ensureHighflyCraftingTouchLayout();\n  ensureHighflyNativeHuntMore();\n}",1)
p.write_text(s,encoding='utf-8')
print('HIGHFLY_P04_8_NATIVE_DUNGEONS_SAME_PR19_HUNTER_MENU=1')
