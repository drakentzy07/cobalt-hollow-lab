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
once(entry,
 "export function installOriginTrialEntrance(onStart:(name:string,gender:'male'|'female')=>void):void{",
 """export function installOriginTrialEntrance(
  onStart:(name:string,appearance:ModularAppearance)=>void,
  initialAppearance:ModularAppearance,
  onAppearanceChange:(appearance:ModularAppearance)=>void,
):void{""")

f=Path(entry);s=f.read_text(encoding='utf8')
start=s.find("  // CLEAN P1: use ClaudeCraft's shipped male/female modular shapes;")
end=s.find("  const start=button('CREAR / CONTINUAR HUNTER ORIGIN');",start)
if start<0 or end<0 or s.count("  const start=button('CREAR / CONTINUAR HUNTER ORIGIN');")!=1:
 raise SystemExit('R36B_OLD_DUPLICATE_GENDER_PICKER_DRIFT')
s=s[:start]+"""  // ORIGINAL ClaudeCraft: actual five-tab body/face/hair/style/share editor,
  // with the same normalized appearance object consumed by its 3D renderer.
  // No separate gender button, no fake second appearance implementation.
  const appearanceHost=document.createElement('div');
  appearanceHost.id='hf-origin-native-appearance';
  appearanceHost.style.cssText='max-height:34vh;overflow:auto;min-height:90px;';
  const originalCustomizer=mountAppearanceCustomizer(appearanceHost,{
    value:normalizeAppearance(initialAppearance),
    onChange:next=>onAppearanceChange(next),
  });
"""+s[end:]
if "genderRow" not in s or "onStart(name,gender);" not in s:raise SystemExit('R36B_OLD_ENTRY_BODY_CHANGED')
s=s.replace("  section.append(title,desc,input,genderRow,start,status);host.appendChild(section);",
            "  section.append(title,desc,input,appearanceHost,start,status);host.appendChild(section);",1)
s=s.replace("    onStart(name,gender);",
 """    const appearance=normalizeAppearance(originalCustomizer.value);
    // An existing name is RESTORE, not a new character. Never rewrite the
    // saved look, inventory, current zone or the player's training stats.
    void loadOriginTrialSave(name).then(saved=>{
      if(saved)status.textContent='Recuperando personaje guardado: la apariencia anterior tiene prioridad.';
      onStart(name,appearance);
    }).catch(()=>onStart(name,appearance));""",1)
if "genderRow" in s or "let gender:'male'|'female'" in s:
 raise SystemExit('R36B_DUPLICATE_GENDER_UI_STILL_PRESENT')
f.write_text(s,encoding='utf8')

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
