#!/usr/bin/env python3
"""Opt-in P09: use MONSTRUOS 6 16 elite/captain MobTemplates in original Sim.
Patch ONLY the native dungeon registry seam, immediately BEFORE DUNGEON_LIST.
No Pages deploy, no new Sim, no user save mutation. Fail closed.
"""
from pathlib import Path
p=Path('src/sim/data.ts')
s=p.read_text(encoding='utf8')
imp="import {promoteHighflyNativeDungeonChallenges} from '../highfly/monsters/hunt_p09_challenges';\n"
if imp in s:
    raise SystemExit('HF_P09_DUPLICATE_IMPORT')
anchor="export const DUNGEON_LIST: DungeonDef[] = Object.values(DUNGEONS).sort((a, b) => a.index - b.index);"
if s.count(anchor)!=1:
    raise SystemExit('HF_P09_NATIVE_DUNGEON_REGISTRY_DRIFT')
s=imp+s
gate="""// HIGHFLY P09 — MONSTRUOS 6 local elites/captains. OPT-IN ONLY.
 // Upgrade TWO native dungeon spawns, not the original map or population.
if (import.meta.env?.VITE_HIGHFLY_NATIVE_HUNT === '1' &&
    import.meta.env?.VITE_HIGHFLY_CHALLENGE_ENCOUNTERS === '1') {
  Object.assign(DUNGEONS, promoteHighflyNativeDungeonChallenges(DUNGEONS,MOBS));
}
"""
s=s.replace(anchor,gate+anchor)
p.write_text(s,encoding='utf8')
print('HF_P09_MONSTER6_ELITE_CAPTAIN_NATIVE_DUNGEONS_OPTIN_REGISTERED=1')
