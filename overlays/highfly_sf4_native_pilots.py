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

# SF8: 10 fusion mechanics at the exact HIGHFLY unlock LV and at LV99,
# including direct/periodic damage, self buffs, heal, shield, teleport.
sf8_source=Path("../v9-corrections/game/c1/highfly_sf8_nine_class_real_combat_effects.test.ts")
sf8_dest=Path("tests/highfly_sf8_nine_class_real_combat_effects.test.ts")
if not sf8_source.is_file() or sf8_dest.exists():
    raise SystemExit("SF8_NATIVE_COMBAT_OUTCOME_TEST_MISSING_OR_DUPLICATED")
shutil.copyfile(sf8_source,sf8_dest)

# SF9A: nine authentic LV99 full-HP/AI enemy encounters with a MIXED
# HIGHFLY+original skill rotation, legal source gear, and Training immutability.
# Its win/loss diagnostic is NOT the Captain fused-rotation certification.
sf9_source=Path("../v9-corrections/game/c1/highfly_sf9_mixed_native_combat_rotations.test.ts")
sf9_dest=Path("tests/highfly_sf9_mixed_native_combat_rotations.test.ts")
if not sf9_source.is_file() or sf9_dest.exists():
    raise SystemExit("SF9_MIXED_NATIVE_COMBAT_TEST_MISSING_OR_DUPLICATED")
shutil.copyfile(sf9_source,sf9_dest)

# SF9B: demand 9/9 full-HP native wolf wins and genuine original ranged
# ability damage for Hunter (plus 60s Druid diagnostic). No enemy stat edits.
sf9b_src=Path("../v9-corrections/game/c1/highfly_sf9b_hunter_druid_9class_native_rotation.test.ts")
sf9b_dst=Path("tests/highfly_sf9b_hunter_druid_9class_native_rotation.test.ts")
if not sf9b_src.is_file() or sf9b_dst.exists():
    raise SystemExit("SF9B_NATIVE_FULL_ROTATION_TEST_MISSING_OR_DUPLICATED")
shutil.copyfile(sf9b_src,sf9b_dst)

# SF10 - opt-in THREE audited native compositions; the first ten remain
# unchanged and 50 other SF3 designs remain unregistered. All tests run in
# isolated original Sim without any mutation of Pages, training or main.
sf10_src=Path("../v9-corrections/game/c1/highfly_sf10_three_native_reuses.ts")
sf10_dst=Path("src/highfly/sf10_three_native_reuses.ts")
sf10_test_src=Path("../v9-corrections/game/c1/highfly_sf10_three_native_reuses.test.ts")
sf10_test_dst=Path("tests/highfly_sf10_three_native_reuses.test.ts")
for source,destination in [(sf10_src,sf10_dst),(sf10_test_src,sf10_test_dst)]:
    if not source.is_file() or destination.exists():
        raise SystemExit("SF10_NATIVE_FUSION_SOURCE_MISSING_OR_DUPLICATE:"+str(source))
    shutil.copyfile(source,destination)

# SF11: read-only 63 donor contract and complete offline internal inspector.
# Explicitly separate 13 real fusions from 50 still designs; no VFX claims.
sf11_source=Path("../v9-corrections/game/c1/highfly_sf11_internal_63_inspection.test.ts")
sf11_dest=Path("tests/highfly_sf11_internal_63_inspection.test.ts")
if not sf11_source.is_file() or sf11_dest.exists():
    raise SystemExit("SF11_INTERNAL_63_AUDIT_TEST_MISSING_OR_DUPLICATED")
shutil.copyfile(sf11_source,sf11_dest)

# SF12: additional hand-audited native Warrior, Paladin and Mage mechanics.
# Stage code and tests; opt-in second flag keeps public Pages unaffected.
sf12_pairs=[
 ("highfly_sf12_three_native_mechanics.ts","src/highfly/sf12_three_native_mechanics.ts"),
 ("highfly_sf12_three_native_mechanics.test.ts","tests/highfly_sf12_three_native_mechanics.test.ts"),
]
for name,dest in sf12_pairs:
    src=Path("../v9-corrections/game/c1") / name
    target=Path(dest)
    if not src.is_file() or target.exists():
        raise SystemExit("SF12_SOURCE_MISSING_OR_DUPLICATE:"+name)
    shutil.copyfile(src,target)

# SF13 strict lab-only native fusion gate. Must be imported after the 16 pilots.
sf13_src=Path('../v9-corrections/game/c1/highfly_sf13_mass_native_gate.ts')
sf13_dst=Path('src/highfly/sf13_mass_native_gate.ts')
if not sf13_src.is_file() or sf13_dst.exists():
    raise SystemExit('SF13_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf13_src,sf13_dst)

# SF14 native hand adapters and opt-in integration (NO public deploy).
sf14_src=Path('../v9-corrections/game/c1/highfly_sf14_hand_native_adapters.ts')
sf14_dst=Path('src/highfly/sf14_hand_native_adapters.ts')
if not sf14_src.is_file() or sf14_dst.exists():
    raise SystemExit('SF14_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf14_src,sf14_dst)

# SF15 reusable 8-skill hand adapter, staged ONLY inside disposable native checkout.
sf15_src=Path('../v9-corrections/game/c1/highfly_sf15_eight_native_batch.ts')
sf15_dst=Path('src/highfly/sf15_eight_native_batch.ts')
if not sf15_src.is_file() or sf15_dst.exists():
    raise SystemExit('SF15_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf15_src,sf15_dst)

# SF16: exactly one NEW ability; 28 pre-existing audited stages preserved (no Pages).
sf16_src=Path('../v9-corrections/game/c1/highfly_sf16_eight_support_elemental.ts')
sf16_dst=Path('src/highfly/sf16_eight_support_elemental.ts')
if not sf16_src.is_file() or sf16_dst.exists():
    raise SystemExit('SF16_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf16_src,sf16_dst)

# SF17: strict THREE NEW skills; preflight guarantees unique SF4-SF17 IDs.
sf17_src=Path('../v9-corrections/game/c1/highfly_sf17_three_unique_native.ts')
sf17_dst=Path('src/highfly/sf17_three_unique_native.ts')
if not sf17_src.is_file() or sf17_dst.exists():
    raise SystemExit('SF17_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf17_src,sf17_dst)

# SF18: three source-compatible mechanics; Hunter U1 channel lifecycle BLOCKED.
sf18_src=Path('../v9-corrections/game/c1/highfly_sf18_four_native_effects.ts')
sf18_dst=Path('src/highfly/sf18_four_native_effects.ts')
if not sf18_src.is_file() or sf18_dst.exists():
    raise SystemExit('SF18_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf18_src,sf18_dst)
sf19_src=Path('../v9-corrections/game/c1/highfly_sf19_two_melee_native.ts')
sf19_dst=Path('src/highfly/sf19_two_melee_native.ts')
if not sf19_src.is_file() or sf19_dst.exists():
    raise SystemExit('SF19_SOURCE_MISSING_OR_DUPLICATE')
shutil.copyfile(sf19_src,sf19_dst)

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
new_import=("import { installSf4NativePilots } from '../../highfly/sf4_safe_fusions';\n"
            "import { installSf10NativeExpansion } from '../../highfly/sf10_three_native_reuses';\n"
            "import { installSf12NativeExpansion } from '../../highfly/sf12_three_native_mechanics';\n"
            "import { installSf13Compatible } from '../../highfly/sf13_mass_native_gate';\n"
            "import { installSf14HandAdapters } from '../../highfly/sf14_hand_native_adapters';\n"
            "import { installSf15EightNative } from '../../highfly/sf15_eight_native_batch';\n"
            "import { installSf16UniqueNative } from '../../highfly/sf16_eight_support_elemental';\n"
            "import { installSf17ThreeNative } from '../../highfly/sf17_three_unique_native';\n"
            "import { installSf18ThreeNative } from '../../highfly/sf18_four_native_effects';\n"
            "import { installSf19TwoNative } from '../../highfly/sf19_two_melee_native';\n")
old_cond="""if (import.meta.env?.VITE_HIGHFLY_SF3 === '1') {
  installHighflySF3Fusions(ABILITIES, CLASSES);
}"""
new_cond="""// SF4: never register the unfinished 53 fusion definitions.
if (import.meta.env?.VITE_HIGHFLY_SF4 === '1') {
  installSf4NativePilots(ABILITIES, CLASSES);
  // SF10 only in candidate builds: three more audited native reuses.
  if (import.meta.env?.VITE_HIGHFLY_SF10 === '1') {
    installSf10NativeExpansion(ABILITIES, CLASSES);
  }
  if (import.meta.env?.VITE_HIGHFLY_SF12 === '1') {
    installSf12NativeExpansion(ABILITIES, CLASSES);
    if (import.meta.env?.VITE_HIGHFLY_SF13 === '1') {
      installSf13Compatible(ABILITIES, CLASSES);
      if (import.meta.env?.VITE_HIGHFLY_SF14 === '1') {
        installSf14HandAdapters(ABILITIES, CLASSES);
        if (import.meta.env?.VITE_HIGHFLY_SF15 === '1') {
          installSf15EightNative(ABILITIES, CLASSES);
          if (import.meta.env?.VITE_HIGHFLY_SF16 === '1') {
            installSf16UniqueNative(ABILITIES, CLASSES);
            if (import.meta.env?.VITE_HIGHFLY_SF17 === '1') {
              installSf17ThreeNative(ABILITIES, CLASSES);
              if (import.meta.env?.VITE_HIGHFLY_SF18 === '1') {
                installSf18ThreeNative(ABILITIES, CLASSES);
                if (import.meta.env?.VITE_HIGHFLY_SF19 === '1') {
                  installSf19TwoNative(ABILITIES, CLASSES);
                }
              }
            }
          }
        }
      }
    }
  }
}"""
for before,after in [(old_import,new_import),(old_cond,new_cond)]:
    if s.count(before)!=1:
        raise SystemExit("SF4_FAIL_CLOSED_CLAUDE_ANCHOR_"+str(s.count(before)))
    s=s.replace(before,after,1)
if "installHighflySF3Fusions(ABILITIES, CLASSES)" in s:
    raise SystemExit("SF4_UNSAFE_INSTALLER_STILL_LIVE")
p.write_text(s,encoding="utf-8")
print("HIGHFLY_SF10_13_NATIVE_PILOTS_NINE_CLASSES_OPTIN_NO_PUBLIC_CHANGE=1")
