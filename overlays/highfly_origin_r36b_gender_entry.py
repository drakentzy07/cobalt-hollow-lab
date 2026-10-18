#!/usr/bin/env python3
"""R36B REUSE FIRST: use the REAL ClaudeCraft AppearanceCustomizer, not a
parallel male/female button. Forward its full ModularAppearance into the
fresh ORIGIN Entity and renderer. Never alter a restored Hunter or native
class creator. P2 already bypasses compulsory new-Hunter tutorial.
"""
from pathlib import Path
def once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8')
 n=s.count(old)
 if n!=1:raise SystemExit(f'R36B_SOURCE_DRIFT {path}: {n}: {old[:140]!r}')
 p.write_text(s.replace(old,new,1),encoding='utf8')

main='src/main.ts'
entry='src/highfly/highfly_origin_trial_runtime.ts'

# Reuse source (not a clone) of both World of ClaudeCraft's appearance editor
# and the exact ModularAppearance property that its 3D renderer consumes.
once(entry,
 "import type { CharacterState } from '../sim/character_state';",
 """import type { CharacterState } from '../sim/character_state';
import {mountAppearanceCustomizer} from '../ui/appearance_customizer';
import {type ModularAppearance, normalizeAppearance} from '../render/characters/modular';""")
# Swap ONLY our isolated optional Origin trial entrance; never patch the
# native ClaudeCraft character creator or depend on P1's gender row markers.
# P1 and P2 may have already changed the contents of this entry, so use the
# TWO exported function boundaries as structural guards instead.
f=Path(entry)
s=f.read_text(encoding='utf8')
begin=s.find('export function installOriginTrialEntrance(')
finish=s.find('export function mountOriginTrialTrainer(',begin)
if begin<0 or finish<=begin or s.count('export function installOriginTrialEntrance(')!=1 or s.count('export function mountOriginTrialTrainer(')!=1:
 raise SystemExit('R36B_ORIGIN_ENTRY_EXPORT_BOUNDARY_DRIFT')
old=s[begin:finish]
if "hf-origin-entry" not in old or "loadOriginTrialSave" not in s:
 raise SystemExit('R36B_ORIGIN_ENTRY_SAFETY_GUARD_FAILED')
native_entry="""export function installOriginTrialEntrance(
  onStart:(name:string,appearance:ModularAppearance)=>void,
  initialAppearance:ModularAppearance,
  onAppearanceChange:(appearance:ModularAppearance)=>void,
):void{
  if(!ORIGIN_TRIAL_ONLY)return;
  const host=document.querySelector('#mode-select');
  if(!host||document.getElementById('hf-origin-entry'))return;
  const section=document.createElement('section');
  section.id='hf-origin-entry';
  section.style.cssText='max-width:560px;margin:10px auto;padding:12px;background:#10192ce9;border:1px solid #5374a3;border-radius:12px;color:#fff;display:grid;gap:8px;z-index:3;position:relative;text-align:left;';
  const title=document.createElement('strong');
  title.textContent='⚔️ HIGHFLY ORIGIN · CREA TU HUNTER';
  const desc=document.createElement('span');
  desc.textContent='Usamos el creador original: cuerpo, rostro, cabello y estilo. Una sola identidad, sin clase obligatoria.';
  desc.style.fontSize='12px';
  const input=document.createElement('input');
  input.type='text';input.maxLength=16;input.placeholder='Nombre del Hunter';
  input.autocomplete='off';input.id='hf-origin-name';
  input.style.cssText='min-width:0;padding:9px;border-radius:8px;background:#192945;color:#fff;border:1px solid #5a7398;font-size:16px;';
  try{input.value=localStorage.getItem(LAST_NAME_KEY)||'Hunter';}catch{input.value='Hunter';}
  // REUSE FIRST: the ONE official ClaudeCraft customizer implements BOTH
  // modular body morphs and the male/female toggle (no parallel gender row).
  const appearanceHost=document.createElement('div');
  appearanceHost.id='hf-origin-native-appearance';
  appearanceHost.style.cssText='max-height:38vh;min-height:110px;overflow-y:auto;overscroll-behavior:contain;';
  const originalCustomizer=mountAppearanceCustomizer(appearanceHost,{
    value:normalizeAppearance(initialAppearance),
    onChange:next=>onAppearanceChange(next),
  });
  const start=button('CREAR / CONTINUAR HUNTER ORIGIN');
  const status=document.createElement('small');
  status.style.color='#b3d3ff';
  start.addEventListener('click',()=>{
    const name=input.value.trim();
    if(!validName(name)){
      status.textContent='Usá entre 2 y 16 letras y espacios (sin números ni símbolos).';
      return;
    }
    start.disabled=true;
    status.textContent='Ingresando al mundo...';
    const appearance=normalizeAppearance(originalCustomizer.value);
    // Restoring a known name always loads its saved character, not this draft.
    void loadOriginTrialSave(name).then(saved=>{
      if(saved)status.textContent='Restaurando Hunter guardado sin cambiar su apariencia.';
      onStart(name,appearance);
    }).catch(()=>onStart(name,appearance));
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter')start.click();});
  section.append(title,desc,input,appearanceHost,start,status);
  host.appendChild(section);
}
"""
f.write_text(s[:begin]+native_entry+s[finish:],encoding='utf8')

# Preserve the original native class creator (unchanged), its style storage,
# appearance-normalization, and KayKit animation skeleton.
once(main,
 """  originHunterTrial = false,
): Promise<void> {""",
 """  originHunterTrial = false,
  originHunterChosenLook: ModularAppearance | null = null,
): Promise<void> {""")
once(main,
 """    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;""",
 """    // Original ClaudeCraft editor -> real Hunter Entity -> renderer visual.
    // Existing saves are explicitly restored below and MUST win.
    const r36bFresh=originHunterTrial && !trialSave &&
      new URLSearchParams(location.search).get('hf_origin_r36b')==='1';
    offlinePlayer.modularAppearance = (
      r36bFresh ? normalizeAppearance(originHunterChosenLook??modularAppearance)
                 : modularAppearance
    ) as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;""")
once(main,
 """  installOriginTrialEntrance((name,gender)=>{
    // NEW Hunter look: only the selected gender changes, all donor 3D
    // material/morph/tint values remain from the existing modular draft.
    modularAppearance=normalizeAppearance({...modularAppearance,gender});
    audio.init();music.init();sfx.init();
    void startOffline('warrior',name,0,undefined,undefined,undefined,true);
  });""",
 """  installOriginTrialEntrance((name,chosenLook)=>{
    // Reuse exactly the original creator's result, not a separate body picker.
    modularAppearance=normalizeAppearance(chosenLook);
    storeAppearance(modularAppearance);
    audio.init();music.init();sfx.init();
    void startOffline('warrior',name,0,undefined,undefined,undefined,true,
      modularAppearance);
  },modularAppearance,next=>{
    modularAppearance=normalizeAppearance(next);
    storeAppearance(modularAppearance);
    characterPreview?.setModular(modularAppearance,creationLoadout('warrior'),'warrior');
  });""")
print('HIGHFLY_R36B_REUSE_NATIVE_CLAUDECRAFT_APPEARANCE_CUSTOMIZER_REAL_HUNTER_SAVE_SAFE=1')
