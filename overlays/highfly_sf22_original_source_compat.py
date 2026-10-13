#!/usr/bin/env python3
"""HIGHFLY SF22: exact-ID compat for frozen ORIGINAL ClaudeCraft only.

Applied to the disposable upstream worktree. No new Sim, no renderer/VFX,
no public Pages change. Fail CLOSED when pinned donor code changes.
"""
from pathlib import Path

changes = {
    Path('src/sim/combat/effect_dispatch.ts'): [
        ("ability.id === FINAL_EDICT_ID ? sunVerdictMarkForHit(strikeTarget, p.id) : null;",
         "(ability.id === FINAL_EDICT_ID || ability.id === 'hf_paladin_u1') ? sunVerdictMarkForHit(strikeTarget, p.id) : null;"),
        ("const aoeCenter = p.castAim ?? p.pos;",
         "const aoeCenter = ability.id === 'hf_hunter_s4' && target ? target.pos : (p.castAim ?? p.pos);"),
        ("} else if (p.castAim && !hasAuthoredMeteorImpact) {",
         "} else if ((p.castAim || (ability.id === 'hf_hunter_s4' && target)) && !hasAuthoredMeteorImpact) {"),
        ("} else if (!p.castAim) {",
         "} else if (!p.castAim && ability.id !== 'hf_hunter_s4') {"),
    ],
    Path('src/sim/combat/paladin_sun_verdict.ts'): [
        ("(abilityId !== FINAL_EDICT_ID && abilityId !== DAWNFALL_ID)",
         "(abilityId !== FINAL_EDICT_ID && abilityId !== DAWNFALL_ID && abilityId !== 'hf_paladin_u1')"),
        ("(triggeringAbilityId !== FINAL_EDICT_ID && triggeringAbilityId !== DAWNFALL_ID)",
         "(triggeringAbilityId !== FINAL_EDICT_ID && triggeringAbilityId !== DAWNFALL_ID && triggeringAbilityId !== 'hf_paladin_u1')"),
        ("if (triggeringAbilityId === FINAL_EDICT_ID) {",
         "if (triggeringAbilityId === FINAL_EDICT_ID || triggeringAbilityId === 'hf_paladin_u1') {"),
    ],
}
for path, pairs in changes.items():
    original = path.read_text(encoding='utf-8')
    updated = original
    for before, after in pairs:
        if updated.count(before) != 1:
            raise SystemExit(f'SF22_FROZEN_SOURCE_DRIFT:{path}:{before[:35]}')
        updated = updated.replace(before, after, 1)
    path.write_text(updated, encoding='utf-8')
print('HF_SF22_ORIGINAL_SIM_SMALL_SOURCE_COMPAT_GREEN=1')
