#!/usr/bin/env python3
"""P07 opt-in native open-world danger pockets. Additive, no ClaudeCraft rewrite.
Apply AFTER P06 so the eight native dungeon defs already exist.
"""
from pathlib import Path
p=Path('src/sim/data.ts')
s=p.read_text('utf-8')
imp="import {prepareHighflyOpenWorldHabitats} from '../highfly/monsters/hunt_open_world';\n"
assert imp not in s,'P07 already applied?'
s=imp+s
anchor="export const DUNGEON_LIST: DungeonDef[] = Object.values(DUNGEONS).sort((a, b) => a.index - b.index);"
assert s.count(anchor)==1,'P07 donor/native P06 registry moved; refuse'
s=s.replace(anchor,anchor+"""
// P07: optional open-world HF mobs, using original donor camp spawn/AI/loot.
// Must run AFTER P06 registered physical doors and BEFORE any Sim is created.
// Preserve BUILTIN_WORLD object identity and all original ZONES and CAMPS.
if (import.meta.env?.VITE_HIGHFLY_OPEN_WORLD_HUNTS === '1') {
  const candidate=prepareHighflyOpenWorldHabitats(BUILTIN_WORLD,DUNGEONS,MOBS);
  Object.assign(BUILTIN_WORLD,candidate.world);
}
""",1)
p.write_text(s,'utf-8')
print('V403_P07_NATIVE_OUTDOOR_HABITATS_REGISTERED=1')
