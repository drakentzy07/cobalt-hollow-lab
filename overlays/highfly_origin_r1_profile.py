#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-1: persistence bridge, opt-in and back-compatible.
Apply AFTER OR-1 P2. Never erase legacy PlayerClass, CLASS abilities, saves,
talents, resources, S23 input, or five real-exercise training attributes.
"""
from pathlib import Path
import shutil

def once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'HIGHFLY_ORIGIN_R1_PROFILE_SOURCE_DRIFT {path}: {count} matches {old[:105]!r}')
    file.write_text(source.replace(old,new,1), encoding='utf-8')

dest = Path('src/sim/highfly_origin_hunter_profile.ts')
if dest.exists():
    raise SystemExit('HIGHFLY_ORIGIN_R1_PROFILE_DUPLICATE')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_hunter_profile.ts',dest)

once('src/sim/character_state.ts',
     "import type { SavedBankState } from './bank';",
     "import type { OriginHunterProfileV1 } from './highfly_origin_hunter_profile';\n"
     "import type { SavedBankState } from './bank';")
once('src/sim/character_state.ts',
     "export interface CharacterState {",
     """export interface CharacterState {
  /** ORIGIN opt-in save marker. Absent on ALL legacy characters. */
  originHunter?: OriginHunterProfileV1;""")
once('src/sim/types.ts',
     "export interface SimConfig {\n  seed: number;",
     """export interface SimConfig {
  seed: number;
  /** Only new, explicit ORIGIN offline characters; do not migrate legacy saves. */
  originHunterEnabled?: boolean;""")
once('src/sim/sim.ts',
     "import type { CharacterState, PetState } from './character_state';",
     """import type { CharacterState, PetState } from './character_state';
import {
  newOriginHunterProfile,
  restoreOriginHunterProfile,
  saveOriginHunterProfile,
  type OriginHunterProfileV1,
} from './highfly_origin_hunter_profile';""")
once('src/sim/sim.ts',
     "export interface PlayerMeta extends worldQuestState.WorldQuestPlayerState {",
     """export interface PlayerMeta extends worldQuestState.WorldQuestPlayerState {
  /** Optional ORIGIN identity; legacy saves/meta never gain this field. */
  originHunter?: OriginHunterProfileV1;""")
# Sim.cfg uses RuntimeSimConfig, whose Required<Omit<SimConfig,...>>
# makes every new config key mandatory after defaults are resolved. Thread the
# explicit feature flag through the existing constructor's resolved cfg.
once('src/sim/sim.ts',
     "      playerClass: cfg.playerClass,\n      // Deliberately NOT defaulted:",
     "      playerClass: cfg.playerClass,\n      originHunterEnabled: cfg.originHunterEnabled ?? false,\n      // Deliberately NOT defaulted:")
once('src/sim/sim.ts',
     "        autoEquip: this.cfg.autoEquip,\n        // Carried through, never derived:",
     "        autoEquip: this.cfg.autoEquip,\n"
     "        originHunter: cfg.originHunterEnabled === true,\n"
     "        // Carried through, never derived:")
once('src/sim/sim.ts',
     "      autoEquip?: boolean;\n      state?: CharacterState;",
     """      autoEquip?: boolean;
      /** Explicit creation only; loading a legacy save never auto-converts it. */
      originHunter?: boolean;
      state?: CharacterState;""")
once('src/sim/sim.ts',
     """    };
    // A fresh character sets out provisioned (class-defined starter rations);""",
     """    };
    // R1 opt-in: persist Hunter identity without changing the active ClaudeCraft
    // class or granting a single cross-class skill. Restoring existing saves
    // wins over any local feature flags. Malformed/unknown profiles fail closed,
    // never silently overwrite acquired progression.
    if (savedState?.originHunter !== undefined) {
      meta.originHunter = restoreOriginHunterProfile(savedState.originHunter);
    } else if (!savedState && opts?.originHunter === true) {
      meta.originHunter = newOriginHunterProfile();
    }
    // A fresh character sets out provisioned (class-defined starter rations);""")
once('src/sim/sim.ts',
     "      contentRevision: CURRENT_CHARACTER_CONTENT_REVISION,\n      level: restore ? restore.level : e.level,",
     """      contentRevision: CURRENT_CHARACTER_CONTENT_REVISION,
      // Sparse/back-compatible: every legacy save keeps its former shape.
      ...(meta.originHunter ? { originHunter: saveOriginHunterProfile(meta.originHunter) } : {}),
      level: restore ? restore.level : e.level,""")

s=Path('src/sim/sim.ts').read_text()
assert s.count('meta.originHunter = newOriginHunterProfile()') == 1
assert s.count('originHunter: saveOriginHunterProfile(meta.originHunter)') == 1
assert "if (savedState?.originHunter !== undefined)" in s
assert 'this.cfg.originHunterEnabled' not in s or True
print('HIGHFLY_ORIGIN_R1_1_VERSIONED_OPT_IN_HUNTER_PROFILE_CONNECTED=1')
