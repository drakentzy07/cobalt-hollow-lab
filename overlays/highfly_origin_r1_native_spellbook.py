#!/usr/bin/env python3
"""HIGHFLY ORIGIN R1-2A: source-backed Hunter spellbook.
The ONLY admission is a trusted Sim method, never a client-supplied unlock.
Do not replace nine native class kits or modify any V15.2 legacy characters.
"""
from pathlib import Path
import shutil

def once(path: str, a: str, b: str) -> None:
    p=Path(path)
    src=p.read_text(encoding='utf-8')
    n=src.count(a)
    if n != 1: raise SystemExit(f'HIGHFLY_ORIGIN_R1_2_SOURCE_DRIFT {path}: {n} matches {a[:90]!r}')
    p.write_text(src.replace(a,b,1),encoding='utf-8')

dest=Path('src/sim/highfly_origin_native_spellbook.ts')
if dest.exists(): raise SystemExit('HIGHFLY_ORIGIN_R1_2_DUPLICATE')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_native_spellbook.ts',dest)

once('src/sim/sim.ts',
  "import {\n  newOriginHunterProfile,",
  "import { highflyOriginKnownAbilities, highflyOriginNativeLearnable } from './highfly_origin_native_spellbook';\n"
  "import {\n  newOriginHunterProfile,")
once('src/sim/sim.ts',
  "    meta.known = abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);",
  """    // R1-2A: Hunters have NO free abilities from their temporary legacy
    // carrier class. Only their server-owned, previously learned skill IDs
    // become known, and every ID rechecks the original level/quest/spec rules.
    // Legacy characters retain the original 9/9 class paths unchanged.
    meta.known = meta.originHunter
      ? highflyOriginKnownAbilities(meta.originHunter, e.level, meta.questsDone)
      : abilitiesKnownAt(meta.cls, e.level, meta.talentMods, meta.questsDone);""")
once('src/sim/sim.ts',
  "  private refreshKnownAbilities(meta: PlayerMeta, announce: boolean): void {",
  """  /** Explicit authoritative learning admission. Not reachable by client
   * commands: a trainer/book/quest service must validate its costs before
   * calling this API in R1-2B. Never grant stats, mana, recipes or mastery. */
  learnOriginHunterSkillTrusted(abilityId: string, pid?: number): boolean {
    const r = this.resolve(pid);
    if (!r?.meta.originHunter || !/^[a-z0-9_:-]{1,128}$/.test(abilityId)) return false;
    const profile = r.meta.originHunter;
    if (profile.learnedSkillIds.includes(abilityId) || profile.learnedSkillIds.length >= 256)
      return false;
    if (!highflyOriginNativeLearnable(abilityId, r.e.level, r.meta.questsDone))
      return false;
    profile.learnedSkillIds.push(abilityId);
    profile.learnedSkillIds.sort();
    this.refreshKnownAbilities(r.meta, true);
    return true;
  }

  private refreshKnownAbilities(meta: PlayerMeta, announce: boolean): void {""")
sim=Path('src/sim/sim.ts').read_text()
assert 'meta.known = meta.originHunter' in sim
assert 'learnOriginHunterSkillTrusted(abilityId: string' in sim
assert 'this.refreshKnownAbilities(r.meta, true)' in sim
assert "this.onHighflyBasicAttack?.(next)" not in sim # HUD owns the combo, not Sim
print('HIGHFLY_ORIGIN_R1_2A_NO_FREE_CLASS_SKILLS_SERVER_OWNED_BOOK_WIRED=1')
