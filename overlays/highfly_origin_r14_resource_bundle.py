#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-4 AB bundled: persistent independent MP+Stamina for
skills, native HP for damage/healing; legacy nine-class system preserved.
Runs after R1-1 Hunter profile, R1-2A learned spellbook, R1-2C cast guard.
Unported native exceptional resource/utility mechanics fail closed.
"""
from pathlib import Path
import shutil

def once(file, old, new):
    path=Path(file)
    source=path.read_text(encoding='utf8')
    count=source.count(old)
    if count!=1:
        raise SystemExit(f'HIGHFLY_ORIGIN_R14_SOURCE_DRIFT {file}: {count}: {old[:110]!r}')
    path.write_text(source.replace(old,new,1),encoding='utf8')

dest=Path('src/sim/highfly_origin_universal_resources.ts')
if dest.exists(): raise SystemExit('HIGHFLY_ORIGIN_R14_ALREADY_APPLIED')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_universal_resources.ts',dest)

# Profile extension is backwards compatible: earlier ORIGIN saves lacking these
# vitals migrate ONCE to the full baseline; new saves include the values.
once('src/sim/highfly_origin_hunter_profile.ts',
  'export interface OriginHunterProfileV1 {',
  """import {
  originFreshResources,
  originRestoreResources,
  type OriginHunterResourcesV1,
} from './highfly_origin_universal_resources';

export interface OriginHunterProfileV1 {
  /** ORIGIN R1-4: independent from legacy character's rage/energy/focus. */
  resources: OriginHunterResourcesV1;""")
once('src/sim/highfly_origin_hunter_profile.ts',
  """    version: 1,
    identity: 'origin_hunter',
    learnedSkillIds: [],""",
  """    version: 1,
    identity: 'origin_hunter',
    resources: originFreshResources(),
    learnedSkillIds: [],""")
once('src/sim/highfly_origin_hunter_profile.ts',
  "  return { version: 1, identity: 'origin_hunter', learnedSkillIds, skillMastery, unlocks };",
  """  return {
    version: 1,
    identity: 'origin_hunter',
    resources: v.resources === undefined
      ? originFreshResources()
      : originRestoreResources(v.resources),
    learnedSkillIds,
    skillMastery,
    unlocks,
  };""")

# Exact original R1-2C fail-closed gate is replaced. Never cast a non-audited
# special resource ability simply because it appears in learnedSkillIds.
once('src/sim/combat/casting_lifecycle.ts',
  "import { originResourceAdmission } from '../highfly_origin_resource_admission';",
  """import {
  originAvailable,
  originCostDecision,
  originSpend,
} from '../highfly_origin_universal_resources';""")
once('src/sim/combat/casting_lifecycle.ts',
  """  // R1-2C: a Hunter may LEARN a spell from a different legacy class without
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
  }""",
  """  // R1-4: ORIGIN Hunter pays physical skills from stamina, magic from MP.
  // Prevent exceptional native utility/resource- and shapeshift-specific effects
  // until individually ported; legacy classes bypass this completely.
  if (meta.originHunter) {
    const admission = originCostDecision(ability);
    if (!admission.ok) {
      ctx.error(p.id, 'HIGHFLY ORIGIN: ' + admission.reason);
      return;
    }
  }""")
once('src/sim/combat/casting_lifecycle.ts',
  "  const castingPool = autoUnshift && p.resourceType !== 'mana' ? p.savedMana : p.resource;",
  """  const castingPool = meta.originHunter
    ? originAvailable(meta.originHunter, ability)
    : autoUnshift && p.resourceType !== 'mana' ? p.savedMana : p.resource;""")
once('src/sim/combat/casting_lifecycle.ts',
  "    (entryPool ?? castingPool) < payableCost &&",
  "    (meta.originHunter ? castingPool : (entryPool ?? castingPool)) < payableCost &&")
once('src/sim/combat/casting_lifecycle.ts',
  "  if (p.resource < payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {",
  """  if ((meta.originHunter ? originAvailable(meta.originHunter, ability) : p.resource) <
      payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {""")
once('src/sim/combat/casting_lifecycle.ts',
  """  if (isToggleBuff(res.def) && p.auras.some((a) => a.id === res.def.id)) return;
  if (res.def.devotionCost) spendDevotion(p, res.def.devotionCost);""",
  """  if (isToggleBuff(res.def) && p.auras.some((a) => a.id === res.def.id)) return;
  // R1-4 authoritative settlement: committed damage/heals/cooldowns only use
  // the independent Origin MP/Stamina pools. No legacy rage/focus/energy spend.
  if (meta.originHunter) {
    if (!originSpend(meta.originHunter, res.def, res.cost))
      throw new Error('HIGHFLY_ORIGIN_RESOURCE_SETTLEMENT_DRIFT');
    return;
  }
  if (res.def.devotionCost) spendDevotion(p, res.def.devotionCost);""")

# HP remains the native Entity value, and Origin MP+Stamina regenerate
# independently. No item/ability alters real training stats.
once('src/sim/sim.ts',
  "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';",
  """import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';
import { originRegen } from './highfly_origin_universal_resources';""")
once('src/sim/sim.ts',
  """        updateRegen(this.ctx, p, meta);
        // Rested XP feeds one one-shot deed predicate,""",
  """        updateRegen(this.ctx, p, meta);
        if (meta.originHunter) originRegen(meta.originHunter, DT);
        // Rested XP feeds one one-shot deed predicate,""")

for path,tokens in {
    'src/sim/highfly_origin_hunter_profile.ts':['resources: OriginHunterResourcesV1','resources: originFreshResources()','originRestoreResources(v.resources)'],
    'src/sim/combat/casting_lifecycle.ts':['originCostDecision(ability)','originAvailable(meta.originHunter, ability)','originSpend(meta.originHunter, res.def, res.cost)'],
    'src/sim/sim.ts':['if (meta.originHunter) originRegen(meta.originHunter, DT)'],
}.items():
    content=Path(path).read_text()
    for token in tokens:
        if token not in content: raise SystemExit(f'HIGHFLY_R14_MISSING {path}: {token}')
print('HIGHFLY_ORIGIN_R14_AB_HP_MP_STAMINA_SAVE_CAST_SETTLEMENT_REGEN_BUNDLE_CONNECTED=1')
