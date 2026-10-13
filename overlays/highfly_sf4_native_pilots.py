#!/usr/bin/env python3
"""HIGHFLY SF4: replace the SF3 unsafe all-63 registry with ten guarded native pilots.

Prerequisite: the original frozen V9.1 assembly, plus SF2 and SF3 source file
copies applied into an isolated throwaway WebGL build checkout.

NEVER launch a GitHub run, write Pages, or mutate main by executing this script.
The Python operation patches only its *current isolated checkout*.
The opt-in runtime flag VITE_HIGHFLY_SF4=1 must be explicitly supplied later.
"""
from pathlib import Path
import shutil

if not Path("src/highfly/sf3_skill_catalog.ts").exists():
    raise SystemExit("SF4_DEPENDENCY_SF3_CATALOG_MISSING")
for filename in ["highfly_sf4_safe_fusions.ts", "highfly_sf4_diagnostics.ts", "highfly_sf5_native_adapters.ts", "highfly_sf6_missing_three_adapters.ts"]:
    source = Path("../v9-corrections/game/c1") / filename
    destination = Path("src/highfly") / filename.replace("highfly_sf4_", "sf4_").replace("highfly_sf5_", "sf5_").replace("highfly_sf6_", "sf6_")
    if not source.is_file() or destination.exists():
        raise SystemExit("SF4_SOURCE_UNAVAILABLE_OR_DUPLICATED:" + str(source))
    shutil.copyfile(source,destination)

# Stage a real original-Sim cast test, not just registry shape checks.
# This creates no run: a future authorized isolated workflow must execute it.
test_source = Path("../v9-corrections/game/c1/highfly_sf4_real_sim.test.ts")
test_destination = Path("tests/highfly_sf4_real_sim.test.ts")
if not test_source.is_file() or test_destination.exists():
    raise SystemExit("SF4_SIM_TEST_UNAVAILABLE_OR_DUPLICATE:" + str(test_source))
shutil.copyfile(test_source, test_destination)

# SF7: prove the ORIGINAL spellbook/actionbar data flow and all 10 native casts
# through level 99. This test does not enable fusion skills in production.
sf7_test_source = Path("../v9-corrections/game/c1/highfly_sf7_spellbook_actionbar_runtime.test.ts")
sf7_test_dest = Path("tests/highfly_sf7_spellbook_actionbar_runtime.test.ts")
if not sf7_test_source.is_file() or sf7_test_dest.exists():
    raise SystemExit("SF7_NATIVE_HUD_TEST_MISSING_OR_DUPLICATED")
shutil.copyfile(sf7_test_source, sf7_test_dest)

# Stage the complete read-only 9×7 donor unlock planner and its unit contract.
stages_source = Path("../v9-corrections/game/c1/highfly_sf5_unlock_stages.ts")
stages_dest = Path("src/highfly/highfly_sf5_unlock_stages.ts")
stages_test_source = Path("../v9-corrections/game/c1/highfly_sf5_unlock_stages.test.ts")
stages_test_dest = Path("tests/highfly_sf5_unlock_stages.test.ts")
for source, destination in [
    (stages_source, stages_dest), (stages_test_source, stages_test_dest)
]:
    if not source.is_file() or destination.exists():
        raise SystemExit("SF5_UNLOCK_SOURCE_UNAVAILABLE_OR_DUPLICATE:" + str(source))
    shutil.copyfile(source, destination)

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
print("HIGHFLY_SF6_TEN_NATIVE_PILOTS_NINE_CLASSES_GUARDED_NO_PUBLIC_CHANGE=1")
