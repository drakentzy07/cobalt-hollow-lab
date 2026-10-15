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

# No Paladin-specific Devotion in universal Hunter. Divine Ascension stays reference-only.

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
import { installOriginAimAndLoadout, originSkillRole } from '../highfly/highfly_origin_r17_hud';""")
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
          if (id && (!this.sim.known.some(known => known.def.id === id) || originSkillRole(id) === 'reference')) return;
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
        cameraYaw: () => this.renderer.camYaw,
        ringSlot: (i) => this.mobileSourceSlotForButton(i,'center'),
      });
    }""")

# Native learn path -> optional slot layout. No new abilities, levels, costs.
once('src/highfly/highfly_origin_trial_runtime.ts',
     "import { ABILITIES } from '../sim/content/classes';",
     """import { ABILITIES } from '../sim/content/classes';
import { originUtilitySkill, originSkillRole } from './highfly_origin_r17_hud';""")
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
  const targetPriority=document.createElement('select');
  targetPriority.style.cssText=skillSelect.style.cssText;
  [{value:'nearest',label:'AUTO: ENEMIGO MÁS CERCANO'},
   {value:'lowest-hp',label:'AUTO: ENEMIGO CON MENOR % DE VIDA'}].forEach(opt=>{
    const node=document.createElement('option');node.value=opt.value;
    node.textContent=opt.label;targetPriority.appendChild(node);
  });
  targetPriority.addEventListener('change',()=>document.dispatchEvent(new CustomEvent('hf-origin-command',{
    detail:{kind:'priority',priority:targetPriority.value}
  })));
  const removeShield=button('QUITAR ESCUDO DEL HUNTER');
  removeShield.addEventListener('click',()=>{
    const ok=sim.unequipItem('offhand');
    status.textContent=ok
      ? 'Escudo guardado en el inventario. La espada sigue disponible.'
      : 'No hay escudo equipado o no hay espacio para desequiparlo.';
  });
  const slotState=document.createElement('small');
  slotState.style.cssText='display:block;color:#ace0ff;word-wrap:break-word;';
  const utility=document.createElement('div');
  utility.id='hf-origin-utility-row';
  utility.style.cssText='position:fixed;bottom:6px;left:39%;width:min(27vw,212px);z-index:8500;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:3px;border-radius:8px;background:#111c2ade;touch-action:manipulation;';
  const utilityBtns:HTMLButtonElement[]=[];
  for(let n=11;n<=18;n++){
    const b=button('B'+(n-10));
    b.style.cssText+='font-size:10px;min-width:0;padding:2px 0;height:27px;max-height:27px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;';
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
      +' | Consulta otras técnicas en Biblioteca';
    utilityBtns.forEach((b,i)=>{
      const id=data.slots[i+10];
      const name=id?ABILITIES[id]?.name??id:'';
      b.textContent=id?'B'+(i+1)+' · '+name.slice(0,3):'B'+(i+1);
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
     """  panel.append(caption,barNote,skillSelect,slotSelect,controlRow,autoButton,targetPriority,removeShield,slotState,list,status);
  shell.append(toggle,panel);document.body.append(shell);
  dispatch('sync');""")


# Restrict the native learning panel to fully admitted abilities and include a
# searchable-by-name read-only library for the rest.
once('src/highfly/highfly_origin_trial_runtime.ts',
     """  const list=document.createElement('div');list.style.cssText='display:grid;gap:6px;';""",
     """  const list=document.createElement('div');list.style.cssText='display:grid;gap:6px;';
  const referencePanel=document.createElement('details');
  const refTitle=document.createElement('summary');
  refTitle.textContent='📖 BIBLIOTECA · CONSULTA (NO EQUIPABLE)';
  const referenceList=document.createElement('div');
  referenceList.style.cssText='max-height:155px;overflow:auto;font-size:11px;';
  referencePanel.append(refTitle,referenceList);""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """    const learnable=Object.values(ABILITIES)
      .filter(def=>highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)!==null)
      .filter(def=>originCostDecision(def).ok)
      .sort((a,b)=>a.class.localeCompare(b.class)||a.id.localeCompare(b.id));""",
     """    const catalog=Object.values(ABILITIES)
      .filter(def=>highflyOriginNativeLearnable(def.id,sim.player.level,meta.questsDone)!==null)
      .sort((a,b)=>a.class.localeCompare(b.class)||a.id.localeCompare(b.id));
    const learnable=catalog.filter(def=>originCostDecision(def).ok&&originSkillRole(def.id)!=='reference');
    const references=catalog.filter(def=>!originCostDecision(def).ok||originSkillRole(def.id)==='reference');
    referenceList.replaceChildren();
    for(const def of references.slice(0,80)){
      const item=document.createElement('div');
      item.textContent='📖 '+def.class.toUpperCase()+' · '+def.name+' — no equipable';
      item.title=def.description||'Requiere adaptación funcional';
      item.style.cssText='padding:3px;border-bottom:1px solid #34475d;opacity:.8';
      referenceList.appendChild(item);
    }""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """  panel.append(caption,barNote,skillSelect,slotSelect,controlRow,autoButton,targetPriority,removeShield,slotState,list,status);""",
     """  panel.append(caption,barNote,skillSelect,slotSelect,controlRow,autoButton,targetPriority,removeShield,slotState,list,referencePanel,status);""")

new_ui=Path('../v9-corrections/game/c1/highfly_origin_r18_loadout.ts')
ui_target=Path('src/highfly/highfly_origin_r18_loadout.ts')
if ui_target.exists():raise SystemExit('OR18_MODULE_ALREADY_INSTALLED')
shutil.copy2(new_ui,ui_target)
once('src/highfly/highfly_origin_trial_runtime.ts',
     "import { originUtilitySkill, originSkillRole } from './highfly_origin_r17_hud';",
     "import { originUtilitySkill, originSkillRole } from './highfly_origin_r17_hud';\nimport { mountOriginR18Editor } from './highfly_origin_r18_loadout';")
once('src/highfly/highfly_origin_trial_runtime.ts',
     "  dispatch('sync');\n}",
     "  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);\n  dispatch('sync');\n}")

for path,required in {
  'src/highfly/highfly_origin_trial_runtime.ts':[
    'hf-origin-utility-row','ORDENAR SKILLS / BUFFS','hf-origin-command'],
  'src/ui/hud.ts':['installOriginAimAndLoadout({'],
}.items():
    data=Path(path).read_text(encoding='utf8')
    for needle in required:
        if needle not in data:raise SystemExit('OR17_MISSING '+path+' '+needle)
print('ORIGIN_R17_SKILL_REFERENCE_LIBRARY_18_SLOT_HUD_AND_TARGET_DRAG=1')
