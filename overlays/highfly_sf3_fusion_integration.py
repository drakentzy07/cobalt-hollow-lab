#!/usr/bin/env python3
"""Highfly SF3 optional 9-class fusion registry integration into ONE original Sim.
Only activated with VITE_HIGHFLY_SF3=1; no release/save/training/monster mutation.
"""
from pathlib import Path
import shutil
root = Path("../v9-corrections/game/c1")
mapping = {
  "highfly_sf3_skill_catalog.ts": "src/highfly/sf3_skill_catalog.ts",
  "highfly_sf3_fusion_runtime.ts": "src/highfly/sf3_fusion_runtime.ts",
}
for filename,dest in mapping.items():
  source=root/filename
  target=Path(dest)
  if not source.is_file() or target.exists():
    raise SystemExit("SF3_MISSING_SOURCE_OR_ALREADY_INSTALLED:"+str(source))
  target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(source,target)
classes=Path("src/sim/content/classes.ts")
s=classes.read_text(encoding="utf-8")
needle="export function abilitiesKnownAt("
if s.count(needle)!=1 or "sf3_fusion_runtime" in s:
  raise SystemExit("SF3_CLASSES_ANCHOR_UNEXPECTED")
# The registered definitions are real native AbilityDefs, learned by the original
# abilitiesKnownAt() and cast by the original Sim. NO second engine is introduced.
s="import { installHighflySF3Fusions } from '../../highfly/sf3_fusion_runtime';\n"+s
s=s.replace(needle,
  """// SF3 lab opt-in only. Production V9.1 and its native 9/9 certification
// stay unchanged unless the explicit variable is set for a new SF3 candidate.
if (import.meta.env?.VITE_HIGHFLY_SF3 === '1') {
  installHighflySF3Fusions(ABILITIES, CLASSES);
}

"""+needle,1)
classes.write_text(s,encoding="utf-8")
assert "HIGHFLY" in classes.read_text()
print("HIGHFLY_SF3_9CLASS_63_NATIVE_ABILITIES_OPTIONAL_REGISTERED=1")
