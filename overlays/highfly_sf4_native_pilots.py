#!/usr/bin/env python3
"""HIGHFLY SF4: replace the SF3 unsafe all-63 registry with two guarded native pilots.

Prerequisite: the original frozen V9.1 assembly, plus SF2 and SF3 source file
copies applied into an isolated throwaway WebGL build checkout.

NEVER launch a GitHub run, write Pages, or mutate main by executing this script.
The Python operation patches only its *current isolated checkout*.
The opt-in runtime flag VITE_HIGHFLY_SF4=1 must be explicitly supplied later.
"""
from pathlib import Path
import shutil

source = Path("../v9-corrections/game/c1/highfly_sf4_safe_fusions.ts")
destination = Path("src/highfly/sf4_safe_fusions.ts")
if not source.is_file() or destination.exists():
    raise SystemExit("SF4_SOURCE_UNAVAILABLE_OR_DUPLICATED")
if not Path("src/highfly/sf3_skill_catalog.ts").exists():
    raise SystemExit("SF4_DEPENDENCY_SF3_CATALOG_MISSING")
shutil.copyfile(source,destination)

p=Path("src/sim/content/classes.ts")
s=p.read_text(encoding="utf-8")
old_import="import { installHighflySF3Fusions } from '../../highfly/sf3_fusion_runtime';\n"
new_import="import { installSf4NativePilots } from '../../highfly/sf4_safe_fusions';\n"
old_cond="""if (import.meta.env?.VITE_HIGHFLY_SF3 === '1') {
  installHighflySF3Fusions(ABILITIES, CLASSES);
}"""
new_cond="""// SF4: never register the unfinished 61 fusion definitions.
if (import.meta.env?.VITE_HIGHFLY_SF4 === '1') {
  installSf4NativePilots(ABILITIES, CLASSES);
}"""
for before,after in [(old_import,new_import),(old_cond,new_cond)]:
    if s.count(before)!=1:
        raise SystemExit("SF4_FAIL_CLOSED_CLAUDE_ANCHOR_"+str(s.count(before)))
    s=s.replace(before,after,1)
if "installHighflySF3Fusions(ABILITIES, CLASSES)" in s:
    raise SystemExit("SF4_UNSAFE_INSTALLER_STILL_LIVE")
p.write_text(s,encoding="utf-8")
print("HIGHFLY_SF4_TWO_NATIVE_PILOTS_GUARDED_WITHOUT_PUBLIC_GAME_CHANGE=1")
