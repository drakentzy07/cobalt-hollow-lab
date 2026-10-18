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

# R15's initial Sim expression is changed by other frozen overlays before
# R36B executes. Scope this to startOffline's ORIGIN fresh branch rather than
# assuming identical text across 72 prior patches.
import re
file=Path(main)
source=file.read_text(encoding='utf8')
start=source.find('async function startOffline(')
if start<0:raise SystemExit('R36B_MISSING_STARTOFFLINE')
end=source.find('// Online flow:',start)
if end<0:raise SystemExit('R36B_MISSING_END_OF_STARTOFFLINE')
segment=source[start:end]
# The constructor might now contain level/stat/resource flags; preserve all
# other named settings, and inject the one opt-in override last.
pattern=r'return new Sim\(\{(?P<args>[^{};]*originHunterEnabled\s*:\s*true[^{};]*)\}\);'
matches=list(re.finditer(pattern,segment))
if len(matches)!=1:
    near=segment.find('originHunterEnabled')
    excerpt=segment[max(0,near-280):near+460] if near>=0 else 'no originHunterEnabled in startOffline'
    raise SystemExit('R36B_FRESH_CONSTRUCTOR_DRIFT count='+str(len(matches))+' excerpt='+repr(excerpt))
match=matches[0]
args=match.group('args').rstrip().rstrip(',')
replacement="""// R36B: only FRESH Origin Hunter can skip compulsory tutorial.
        // Restored Draken always uses the untouched load-save branch.
        // No teleporting or changing the saved player profile.
        const r36b=new URLSearchParams(location.search).get('hf_origin_r36b')==='1';
        return new Sim({"""+args+""",
          ...(r36b ? {compulsoryTutorial:false} : {}),
        });"""
segment=segment[:match.start()]+replacement+segment[match.end():]
file.write_text(source[:start]+segment+source[end:],encoding='utf8')

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
