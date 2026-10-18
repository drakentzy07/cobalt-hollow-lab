#!/usr/bin/env python3
"""R36B first isolated Hunter entrance correction after R36A.1:
gender explicitly forwarded to Sim fresh visual; saves immutable; skip
compulsory original tutorial ONLY for fresh R36B Hunter. World positions,
NPC missions, mobility GOLDEN and all other classes are preserved.
"""
from pathlib import Path
def once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8');n=s.count(old)
 if n!=1:raise SystemExit(f'R36B_SOURCE_DRIFT {path}: {n}: {old[:100]!r}')
 p.write_text(s.replace(old,new,1),encoding='utf8')

main='src/main.ts'
# R1-5 origin appends opt-in originHunterTrial; keep all legacy callers
# using their default parameters unchanged.
once(main,
 """  originHunterTrial = false,
): Promise<void> {""",
 """  originHunterTrial = false,
  originHunterChosenGender: 'male'|'female' = 'male',
): Promise<void> {""")

once(main,
 """        return new Sim({...cfg,originHunterEnabled:true});""",
 """        // R36B fresh Origin Hunter: appear in the actual donor world with
        // no compulsory bootcamp. Saved Draken restores use the branch above.
        // No random unverified world coordinate or teleport on restore.
        const r36b=new URLSearchParams(location.search).get('hf_origin_r36b')==='1';
        return new Sim({...cfg,originHunterEnabled:true,
          ...(r36b ? {compulsoryTutorial:false} : {})});
""".rstrip())

once(main,
 """    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;""",
 """    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;
    // The creator's gender selection must flow to the actual Entity whose
    // ModularAppearance is read by Renderer, not just a DOM button or draft.
    // Existing save appearances (including Draken) are restored below, untouched.
    if (originHunterTrial && !trialSave &&
        new URLSearchParams(location.search).get('hf_origin_r36b')==='1') {
      offlinePlayer.modularAppearance=normalizeAppearance({
        ...modularAppearance,gender:originHunterChosenGender,
      }) as unknown as Record<string,unknown>;
    }""")

# The clean P1 callback already receives male/female. It previously updated
# only the draft, while startOffline's asynchronously built Sim could resume
# a different appearance. Forward selection as explicit input to world creation.
once(main,
 """    void startOffline('warrior',name,0,undefined,undefined,undefined,true);""",
 """    void startOffline('warrior',name,0,undefined,undefined,undefined,true,gender);""")

# Loading an existing name is CONTINUATION, not new gender creation.
# We never change the saved modular skin, class inventories, or position.
# Add honest message before launch in the existing Origin entrance.
entry='src/highfly/highfly_origin_trial_runtime.ts'
once(entry,
 """    status.textContent='Ingresando al mundo...';
    onStart(name,gender);""",
 """    status.textContent='Ingresando al mundo...';
    if (new URLSearchParams(location.search).get('hf_origin_r36b')==='1') {
      void loadOriginTrialSave(name).then(existing=>{
        if (existing) {
          // Save truth wins: selecting MUJER when resuming Draken doesn't
          // transform a persisted male into another character.
          status.textContent='Retomando a '+name+' con su apariencia, equipo y progreso guardados.';
        }
        onStart(name,gender);
      }).catch(()=>{
        // No destructive fallback; still preserve the original start path.
        onStart(name,gender);
      });
    } else onStart(name,gender);""")

print('HIGHFLY_ORIGIN_R36B_NEW_MALE_FEMALE_ENTITY_TRUTH_AND_OPTIONAL_TUTORIAL_ISOLATED=1')
