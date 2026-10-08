#!/usr/bin/env python3
"""PR-1: narrowly wire HIGHFLY's optional career JSONB field into donor save/load.

Runs only on a sparse, frozen ClaudeCraft checkout after CLEAN+PF-6 replay.
Guards every seam. Never changes profession gameplay, Training or stat paths.
"""
from pathlib import Path

state_file = Path("src/sim/character_state.ts")
sim_file = Path("src/sim/sim.ts")
state = state_file.read_text(encoding="utf-8")
sim = sim_file.read_text(encoding="utf-8")

def insert_once(source: str, anchor: str, replacement: str, label: str) -> str:
    if source.count(anchor) != 1:
        raise SystemExit(f"PR-1 refused: {label} anchor drifted ({source.count(anchor)})")
    if replacement in source:
        raise SystemExit(f"PR-1 refused: {label} already active")
    return source.replace(anchor, replacement, 1)

state = insert_once(
    state,
    "import type { ArchetypeState } from './professions/archetype';",
    "import type { ArchetypeState } from './professions/archetype';\n"
    "import type { SavedHighflyProfessionStateV1 } from './professions/highfly_profession_state';",
    "CharacterState type import",
)
state = insert_once(
    state,
    "  craftSkills?: Record<string, number>;\n",
    "  // HIGHFLY PR-1: separate, optional career metadata. Never duplicates\n"
    "  // Claude's authoritative craftSkills/recipes/archetypes/gathering.\n"
    "  highflyProfessions?: SavedHighflyProfessionStateV1;\n"
    "  craftSkills?: Record<string, number>;\n",
    "CharacterState schema",
)

sim = insert_once(
    sim,
    "import type { CharacterState, PetState } from './character_state';",
    "import type { CharacterState, PetState } from './character_state';\n"
    "import { normalizeHighflyProfessionState, savedHighflyProfessionFragment } "
    "from './professions/highfly_profession_state';\n"
    "import type { SavedHighflyProfessionStateV1 } "
    "from './professions/highfly_profession_state';",
    "Sim import",
)
sim = insert_once(
    sim,
    "  craftSkills: Record<string, number>;\n",
    "  // Absent until HIGHFLY career metadata is actually earned/restored.\n"
    "  highflyProfessions?: SavedHighflyProfessionStateV1;\n"
    "  craftSkills: Record<string, number>;\n",
    "PlayerMeta optional field",
)
sim = insert_once(
    sim,
    "      meta.craftSkills = normalizeCraftSkills(s.craftSkills);\n",
    "      // Sparse additive career metadata; loading an old save adds NO field.\n"
    "      const restoredHighflyProfessions = normalizeHighflyProfessionState(s.highflyProfessions);\n"
    "      if (restoredHighflyProfessions) meta.highflyProfessions = restoredHighflyProfessions;\n"
    "      meta.craftSkills = normalizeCraftSkills(s.craftSkills);\n",
    "real addPlayer load",
)
sim = insert_once(
    sim,
    "      craftSkills: { ...meta.craftSkills },\n",
    "      // A valid, nonempty career fragment only; never writes empty defaults.\n"
    "      ...savedHighflyProfessionFragment(meta.highflyProfessions),\n"
    "      craftSkills: { ...meta.craftSkills },\n",
    "real serializeCharacter save",
)

# Only write once EVERY guard has passed.
state_file.write_text(state, encoding="utf-8")
sim_file.write_text(sim, encoding="utf-8")
print("HIGHFLY_PR1_CHARACTERSTATE_SCHEMA_WIRED=1")
print("HIGHFLY_PR1_ADDPLAYER_SAVELOAD_WIRED=1")
