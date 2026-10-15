#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-5 + R1-6 P0: PLAYABLE opt-in offline Hunter trial.
Preview-entry compile gated by VITE_HIGHFLY_ORIGIN_PREVIEW=1.
No production offline mode opened, no original class creator fork, no
server unlock commands, no public Pages deploy, no replacement of legacy saves.
"""
from pathlib import Path
import shutil
def once(path,old,new):
    f=Path(path);s=f.read_text(encoding='utf8');n=s.count(old)
    if n!=1:raise SystemExit(f'ORIGIN_R15_SOURCE_DRIFT {path} {n}: {old[:110]!r}')
    f.write_text(s.replace(old,new,1),encoding='utf8')

dest=Path('src/highfly/highfly_origin_trial_runtime.ts')
if dest.exists():raise SystemExit('ORIGIN_R15_ALREADY_INSTALLED')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_trial_runtime.ts',dest)

once('src/main.ts',
     "import { offlineWorldConfig } from './game/offline_world_config';",
     """import { offlineWorldConfig } from './game/offline_world_config';
import {
  installOriginTrialEntrance,
  loadOriginTrialSave,
  mountOriginTrialTrainer,
  startOriginTrialAutosave,
} from './highfly/highfly_origin_trial_runtime';""")
# Multiple certified HIGHFLY overlays extend the native startOffline
# signature. Append only OUR parameter at the end, preserving all prior args.
import re
main=Path('src/main.ts')
main_data=main.read_text(encoding='utf8')
sig=re.search(r'(async function startOffline\s*\()([\s\S]*?)(\)\s*:\s*Promise<void>\s*\{)',main_data)
if not sig:
    raise SystemExit('ORIGIN_R15_MISSING_NATIVE_START_OFFLINE_FUNCTION')
params=sig.group(2).rstrip()
if 'originHunterTrial' in params:
    raise SystemExit('ORIGIN_R15_DUPLICATE_ORIGIN_PARAMETER')
if params and not params.endswith(','):
    params+=','
params+='\n  originHunterTrial = false,\n'
main_data=main_data[:sig.start(2)]+params+main_data[sig.end(2):]
main.write_text(main_data,encoding='utf8')
# Do not replace an OLD frozen Sim block: CLEAN V1 already updated that
# block for offline autosave/resume. Wrap its existing expression so the entire
# original path is byte-for-byte preserved for every classic character.
main=Path('src/main.ts')
code=main.read_text(encoding='utf8')
method_start=code.index('async function startOffline(')
method_end=code.find('// Online flow:',method_start)
if method_end<0: method_end=code.index('const api = new Api()',method_start)
method=code[method_start:method_end]
anchor="  const sim = loadSpan("
if method.count(anchor)!=1:
    raise SystemExit(f'ORIGIN_R15_EXPECT_SINGLE_NATIVE_SIM_BUILD count={method.count(anchor)}')
trial_branch="""  // HIGHFLY ORIGIN preview is an ISOLATED second build path; legacy offline
  // save/restore and character skin still execute from the untouched ELSE arm.
  const trialSave = originHunterTrial ? await loadOriginTrialSave(name) : null;
  const sim = originHunterTrial
    ? loadSpan('origin-sim-build', () => {
        const cfg=offlineWorldConfig({
          playerClass,name,world,seedOverride,devCommands:import.meta.env.DEV,
        });
        if (trialSave?.state.originHunter) {
          const restored=new Sim({...cfg,noPlayer:true,compulsoryTutorial:false});
          restored.addPlayer(playerClass,name,{
            state:trialSave.state,
            appearance:trialSave.appearance,
            localGathererIdentity:cfg.gathererIdentity??null,
          });
          return restored;
        }
        return new Sim({...cfg,originHunterEnabled:true});
      })
    : loadSpan("""
method=method.replace(anchor,trial_branch,1)
main.write_text(code[:method_start]+method+code[method_end:],encoding='utf8')

# Keep the existing legacy appearance restoration; Origin overrides ONLY
# its own saved modular appearance after the native fallback completes.
once('src/main.ts',
     """  // Dev convenience: ?mech drops an offline session""",
     """  if (originHunterTrial && trialSave?.appearance && offlinePlayer)
    offlinePlayer.modularAppearance = trialSave.appearance;
  // Dev convenience: ?mech drops an offline session""")

once('src/main.ts',
     """  void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);""",
     """  if (originHunterTrial) {
    // TEST CHANNEL: owner-only local autosave, trainer sandbox and ORIGINAL
    // game renderer. Native 10-slot spellbook/hotbar takes learned IDs directly.
    startOriginTrialAutosave(sim,name);
    void startGame(sim,sim,null,`highfly:origin:${name}`,true)
      .then(()=>mountOriginTrialTrainer(sim))
      .catch((error:unknown)=>console.error('HIGHFLY_ORIGIN_TRIAL_START_FAILED',error));
  } else {
    void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);
  }""")
once('src/main.ts',
     """  const offlineAvailable = isOfflineModeAvailable(import.meta.env.DEV);

  const goToLoggedInPlay = () => {""",
     """  const offlineAvailable = isOfflineModeAvailable(import.meta.env.DEV);
  // Separate from legacy offline mode; ONLY the isolated Origin preview build
  // offers the entry. No server token / real-money profile / public mutation.
  installOriginTrialEntrance((name)=>{
    audio.init();music.init();sfx.init();
    void startOffline('warrior',name,0,undefined,undefined,true);
  });

  const goToLoggedInPlay = () => {""")

assert 'originHunterEnabled:true' in Path('src/main.ts').read_text()
assert 'startOriginTrialAutosave(sim,name)' in Path('src/main.ts').read_text()
assert 'installOriginTrialEntrance((name)=>' in Path('src/main.ts').read_text()
assert 'originHunterTrial ? await loadOriginTrialSave(name) : null' in Path('src/main.ts').read_text()
print('HIGHFLY_ORIGIN_R15_R16_P0_PLAYABLE_SINGLE_HUNTER_LOCAL_TRIAL_ENTRY_SAVE_SKILL_TRAINER_WIRED=1')
