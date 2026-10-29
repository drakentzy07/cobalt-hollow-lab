#!/usr/bin/env node
// HIGHFLY P7-E original-world exploration UI (no import of unsafe new assets).
import fs from 'node:fs';
import path from 'node:path';
const file=path.join(path.resolve(process.argv[2]||'upstream'),'src/main.ts');
let text=fs.readFileSync(file,'utf8');
const anchor='  mobileControls.start();\n';
const insert=[
'  mobileControls.start();',
"  if(offlineSim && new URLSearchParams(location.search).get('highfly_origin')==='1'){",
"    document.body.classList.add('highfly-p7');",
"    const button=document.createElement('button');button.type='button';button.id='highfly-p7-world-button';button.textContent='MUNDO';",
"    const panel=document.createElement('section');panel.id='highfly-p7-world-panel';panel.hidden=true;",
"    const head=document.createElement('div');head.className='highfly-p7-panel-head';",
"    const title=document.createElement('strong');title.textContent='HIGHFLY · EXPLORACIÓN';",
"    const close=document.createElement('button');close.type='button';close.textContent='✕';",
"    close.onclick=()=>{panel.hidden=true;};head.append(title,close);",
"    const actions=document.createElement('div');actions.className='highfly-p7-panel-actions';",
"    const menus:[string,()=>void][]=[['MAPA',()=>hud.toggleMap()],['INVENTARIO',()=>hud.toggleBags()],",
"      ['HABILIDADES',()=>hud.toggleSpellbook()],['PERSONAJE',()=>hud.toggleChar()]];",
"    for(const [label,fn] of menus){",
"      const b=document.createElement('button');b.type='button';b.textContent=label;",
"      b.onclick=()=>{panel.hidden=true;fn();};actions.append(b);",
"    }",
"    const nearby=document.createElement('div');nearby.id='highfly-p7-nearby-list';",
"    panel.append(head,actions,nearby);document.body.append(button,panel);",
"    button.onclick=()=>{",
"      panel.hidden=!panel.hidden;if(panel.hidden)return;",
"      nearby.replaceChildren();",
"      const intro=document.createElement('p');intro.textContent='NPC y monstruos del mundo original';nearby.append(intro);",
"      const me=world.player;",
"      const found=[...world.entities.values()].filter(e=>e.kind==='mob'||e.kind==='npc')",
"        .map(e=>({e,d:Math.hypot(e.pos.x-me.pos.x,e.pos.z-me.pos.z)}))",
"        .sort((a,b)=>a.d-b.d).slice(0,12);",
"      for(const {e,d} of found){",
"        const line=document.createElement('div');line.className='highfly-p7-nearby-row';",
"        line.textContent=(e.kind==='mob'?'ENEMIGO':'NPC')+' · '+",
"          (e.name||e.templateId||'Criatura')+' · nivel '+(e.level||1)+' · '+Math.round(d)+' m';",
"        nearby.append(line);",
"      }",
"      if(!found.length){const t=document.createElement('p');t.textContent='No hay NPC o monstruos cerca.';nearby.append(t);}",
"    };",
"  }"
].join('\n')+'\n';
if(text.split(anchor).length!==2)throw Error('[P7E] unique start anchor missing');
text=text.replace(anchor,insert);
fs.writeFileSync(file,text);
console.log('HIGHFLY_P7E_WORLD_PANEL=PASS');