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
once('src/main.ts',
     """  seedOverride?: number,
): Promise<void> {
  stopShaderWarmup();""",
     """  seedOverride?: number,
  originHunterTrial = false,
): Promise<void> {
  stopShaderWarmup();""")
once('src/main.ts',
     """  const sim = loadSpan(
    'sim-build',
    () =>
      new Sim(
        offlineWorldConfig({
          playerClass,
          name,
          world,
          seedOverride,
          devCommands: import.meta.env.DEV,
        }),
      ),
  );
  sim.setPlayerSkin(sim.playerId, skin);""",
     """  // R1-5 preview-only. The user never selects a legacy class: Warrior is
  // exclusively the internal Rig_Medium / bootstrap carrier until true native
  // Hunter creation; all skills and MP/stamina belong to ORIGIN identity.
  const trialSave = originHunterTrial ? await loadOriginTrialSave(name) : null;
  const originCfg = offlineWorldConfig({
    playerClass,
    name,
    world,
    seedOverride,
    devCommands: import.meta.env.DEV,
  });
  const sim = loadSpan('sim-build', () => {
    if (originHunterTrial && trialSave?.state.originHunter) {
      const restored=new Sim({
        ...originCfg,
        noPlayer:true,
        compulsoryTutorial:false,
      });
      restored.addPlayer(playerClass,name,{
        state:trialSave.state,
        appearance:trialSave.appearance,
        localGathererIdentity:originCfg.gathererIdentity??null,
      });
      return restored;
    }
    return new Sim(originHunterTrial
      ? {...originCfg,originHunterEnabled:true}
      : originCfg);
  });
  if (!trialSave) sim.setPlayerSkin(sim.playerId, skin);""")
once('src/main.ts',
     """    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;""",
     """    offlinePlayer.modularAppearance = originHunterTrial && trialSave?.appearance
      ? trialSave.appearance
      : modularAppearance as unknown as Record<string, unknown>;
    if (!originHunterTrial || !trialSave) offlinePlayer.helmHidden = !creationHelm;""")
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
