#!/usr/bin/env python3
"""ORIGIN R1-7 preview-only: restore Paladin Devotion for mixed Hunter,
native hotbar assign/clear, utility row, and targeted touch drag.
Applied AFTER R1-5 on the disposable donor worktree. No legacy impact.
"""
from pathlib import Path
import shutil

def once(path, before, after):
    p=Path(path)
    data=p.read_text(encoding="utf8")
    n=data.count(before)
    if n!=1:raise SystemExit(f"OR17_SOURCE_DRIFT {path} count={n}: {before[:100]!r}")
    p.write_text(data.replace(before,after,1),encoding="utf8")

source=Path('../v9-corrections/game/c1/highfly_origin_r17_hud.ts')
dest=Path('src/highfly/highfly_origin_r17_hud.ts')
if dest.exists():raise SystemExit('OR17_MODULE_ALREADY_INSTALLED')
shutil.copy2(source,dest)

# The original Paladin ability requires a native Devotion resource. Carrier
# Warrior was never initialized with it, and Paladin's state() rejected it.
# Accept only an authenticated opt-in Origin entity with the owner-only MP
# projection: normal warriors remain untouched, no free Devotion is granted.
once('src/sim/paladin_devotion.ts',
     "e.kind === 'player' && e.templateId === 'paladin' ? (e.paladinDevotion ?? null) : null",
     "(e.kind === 'player' && (e.templateId === 'paladin' || e.originResources !== undefined)) ? (e.paladinDevotion ?? null) : null")
once('src/sim/sim.ts',
     "    if (meta.originHunter) player.originResources = meta.originHunter.resources;",
     """    if (meta.originHunter) {
      player.originResources = meta.originHunter.resources;
      // OR17: initialize the ORIGINAL Paladin Devotion cycle on the
      // cross-discipline Hunter; it starts at ZERO and earns naturally.
      // This does not reclass the underlying Warrior rig/animations.
      player.paladinDevotion ??= {
        value: 0, ascensionCharges: 0, ascensionRemaining: 0,
        outOfCombatTime: 0, decayProgress: 0, blockIcdRemaining: 0,
      };
    }""")

# Fresh trials start without the default Warrior shield; the training sword
# stays because native melee-weapon checks need a valid equipped mainhand.
# Existing saved Hunter equipment is NEVER changed on resume.
once('src/main.ts',
     "        return new Sim({...cfg,originHunterEnabled:true});",
     """        const hunter = new Sim({...cfg,originHunterEnabled:true});
        hunter.unequipItem('offhand'); // original native bag move
        return hunter;""")

# Listen only on the preview Hunter, and pass all changes into the original
# action-bar controller, slot serializer and native Sim.targetEntity/castSlot.
once('src/ui/hud.ts',
     "import { audio } from '../game/audio';",
     """import { audio } from '../game/audio';
import { installOriginAimAndLoadout } from '../highfly/highfly_origin_r17_hud';""")
once('src/ui/hud.ts',
     "    hydrateCrestImageFallbacks(document);",
     """    hydrateCrestImageFallbacks(document);
    if (import.meta.env.VITE_HIGHFLY_ORIGIN_PREVIEW === '1' && this.sim.player.originResources) {
      installOriginAimAndLoadout({
        getSlot: (slot) => {
          const action = this.actionForSlot(slot);
          return action?.type === 'ability' ? action.id : null;
        },
        setSlot: (slot, id) => {
          if (slot < 1 || slot > 18) return;
          if (id && !this.sim.known.some(known => known.def.id === id)) return;
          this.commitHotbarActions(
            id ? placeAbilityOnSlot(this.hotbarActions, id, slot - 1)
               : clearHotbarSlot(this.hotbarActions, slot - 1)
          );
        },
        castSlot: (slot) => this.castSlot(slot),
        learned: (id) => this.sim.known.some(k => k.def.id === id),
        target: (id) => this.sim.targetEntity(id),
        player: () => this.sim.player,
        targets: () => Array.from(this.sim.entities.values()),
      });
    }""")

# Native learn path -> optional slot layout. No new abilities, levels, costs.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "import { ABILITIES } from '../sim/content/classes';",
     """import { ABILITIES } from '../sim/content/classes';
import { originUtilitySkill } from './highfly_origin_r17_hud';""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  const list=document.createElement('div');list.style.cssText='display:grid;gap:6px;';",
     """  const list=document.createElement('div');list.style.cssText='display:grid;gap:6px;';
  const barNote=document.createElement('small');
  barNote.textContent='S1–S10: combate. B1–B8: buffs, curas, escudos. Mantené/arrastrá una skill ofensiva para seleccionar objetivo (prueba).';
  const skillSelect=document.createElement('select');
  const slotSelect=document.createElement('select');
  skillSelect.style.cssText='width:100%;padding:7px;color:#fff;background:#172843;';
  slotSelect.style.cssText=skillSelect.style.cssText;
  for(let n=1;n<=18;n++){
    const opt=document.createElement('option');opt.value=String(n);
    opt.textContent=n<=10?'S'+n:'B'+(n-10);
    slotSelect.appendChild(opt);
  }
  const setButton=button('EQUIPAR EN SLOT');
  const clearButton=button('QUITAR DEL SLOT');
  const autoButton=button('ORDENAR SKILLS / BUFFS');
  const dispatch=(kind:string,id?:string)=>document.dispatchEvent(new CustomEvent('hf-origin-command',{
    detail:{kind,slot:Number(slotSelect.value),id}
  }));
  const controlRow=document.createElement('div');
  controlRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:5px;';
  controlRow.append(setButton,clearButton);
  setButton.addEventListener('click',()=>dispatch('set',skillSelect.value));
  clearButton.addEventListener('click',()=>dispatch('clear'));
  autoButton.addEventListener('click',()=>dispatch('autopack'));
  const slotState=document.createElement('small');
  slotState.style.cssText='display:block;color:#ace0ff;word-wrap:break-word;';
  const utility=document.createElement('div');
  utility.id='hf-origin-utility-row';
  utility.style.cssText='position:fixed;bottom:8px;left:44%;width:188px;z-index:8500;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;border-radius:8px;background:#111c2acb;touch-action:manipulation;';
  const utilityBtns:HTMLButtonElement[]=[];
  for(let n=11;n<=18;n++){
    const b=button('B'+(n-10));
    b.style.cssText+='font-size:10px;min-width:0;padding:5px 1px;height:32px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;';
    b.title='B'+(n-10)+' sin asignar';
    b.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('hf-origin-command',{
      detail:{kind:'cast',slot:n}
    })));
    utility.appendChild(b);utilityBtns.push(b);
  }
  document.body.appendChild(utility);
  document.addEventListener('hf-origin-loadout-state',event=>{
    const data=(event as CustomEvent<{slots:(string|null)[];devotion:number}>).detail;
    if(!data?.slots)return;
    slotState.textContent=data.slots.map((id,i)=>id?(i<10?'S'+(i+1):'B'+(i-9))+': '+(ABILITIES[id]?.name??id):null).filter(Boolean).join(' · ')
      +' | Devotion '+(data.devotion??0)+'/20';
    utilityBtns.forEach((b,i)=>{
      const id=data.slots[i+10];
      const name=id?ABILITIES[id]?.name??id:'';
      b.textContent=id?name.slice(0,5):'B'+(i+1);
      b.title=id?name:'B'+(i+1)+' libre';
      b.style.opacity=id?'1':'.65';
    });
  });""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """    for(const def of learnable.slice(0,100)){""",
     """    const selectedSkill=skillSelect.value;
    skillSelect.replaceChildren();
    for(const def of learnable.filter(d=>meta.originHunter!.learnedSkillIds.includes(d.id))){
      const opt=document.createElement('option');opt.value=def.id;
      opt.textContent=(originUtilitySkill(def.id)?'🛡 ':'⚔ ')+def.name;
      skillSelect.appendChild(opt);
    }
    if(selectedSkill && Array.from(skillSelect.options).some(o=>o.value===selectedSkill))
      skillSelect.value=selectedSkill;
    for(const def of learnable.slice(0,100)){""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """        status.textContent=ok?'Aprendida: '+def.name+'. Agregala a tu barra desde el Libro.':'Bloqueada por requisito original o ya aprendida.';
        refresh();""",
     """        status.textContent=ok?'Aprendida: '+def.name+'. Se agregó al grupo correspondiente.':'Bloqueada por requisito original o ya aprendida.';
        if(ok)dispatch('learned',def.id);
        refresh();""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)refresh();});",
     """  toggle.addEventListener('click',()=>{
    panel.hidden=!panel.hidden;
    if(!panel.hidden){
      refresh();
      dispatch('sync');
    }
  });""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  panel.append(caption,list,status);shell.append(toggle,panel);document.body.append(shell);",
     """  panel.append(caption,barNote,skillSelect,slotSelect,controlRow,autoButton,slotState,list,status);
  shell.append(toggle,panel);document.body.append(shell);
  dispatch('sync');""")

for path,required in {
  'src/highfly/highfly_origin_trial_runtime.ts':[
    'hf-origin-utility-row','ORDENAR SKILLS / BUFFS','hf-origin-command'],
  'src/sim/sim.ts':['player.paladinDevotion ??='],
  'src/sim/paladin_devotion.ts':['e.originResources !== undefined'],
  'src/ui/hud.ts':['installOriginAimAndLoadout({'],
}.items():
    data=Path(path).read_text(encoding='utf8')
    for needle in required:
        if needle not in data:raise SystemExit('OR17_MISSING '+path+' '+needle)
print('ORIGIN_R17_DIVINE_ASCENSION_NATIVE_DEVOTION_PLUS_18_SLOT_HUD_AND_TARGET_DRAG=1')
