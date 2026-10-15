#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-2C: temporary server cast admission until R1-4 HP/MP/Stamina.
Never convert Mage mana cost to Warrior rage. Already learned skills remain
known. Their casts fail closed before any resource billing or combat side-effect.
Legacy nine-class casting is untouched.
"""
from pathlib import Path
import shutil
def once(path, anchor, replacement):
    file=Path(path)
    text=file.read_text(encoding='utf-8')
    n=text.count(anchor)
    if n!=1: raise SystemExit(f'HIGHFLY_ORIGIN_R12C_SOURCE_DRIFT {path} count={n}: {anchor[:100]!r}')
    file.write_text(text.replace(anchor,replacement,1),encoding='utf-8')

p=Path('src/sim/highfly_origin_resource_admission.ts')
if p.exists(): raise SystemExit('HIGHFLY_ORIGIN_R12C_DUPLICATE_MODULE')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_resource_admission.ts',p)

once('src/sim/combat/casting_lifecycle.ts',
     "import { isDispellableAura } from '../aura_classify';",
     "import { originResourceAdmission } from '../highfly_origin_resource_admission';\n"
     "import { isDispellableAura } from '../aura_classify';")
once('src/sim/combat/casting_lifecycle.ts',
     "  const ability = res.def;\n  if (cancelRecedingShell(ctx, p, meta, ability.id)) return;",
     """  const ability = res.def;
  // R1-2C: a Hunter may LEARN a spell from a different legacy class without
  // paying that spell's MP cost with the carrier's rage/energy/focus bar.
  // The R1-4 triple-resource bridge replaces this temporary fail-closed gate
  // with explicit, server-owned pools. All nine legacy classes bypass it.
  if (meta.originHunter) {
    const admission = originResourceAdmission(ability, p.resourceType);
    if (!admission.allowed) {
      ctx.error(p.id, 'HIGHFLY ORIGIN: Requires ' + admission.required +
        ' resource. HP/MP/Stamina bridge pending.');
      return;
    }
  }
  if (cancelRecedingShell(ctx, p, meta, ability.id)) return;""")
assert 'const admission = originResourceAdmission(ability, p.resourceType);' in Path('src/sim/combat/casting_lifecycle.ts').read_text()
print('HIGHFLY_ORIGIN_R12C_SERVER_RESOURCE_GUARD_GREEN=1')
