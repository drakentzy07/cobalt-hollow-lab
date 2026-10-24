#!/usr/bin/env python3
"""C2-02/C2-03 narrowly authorized native source mutation gate."""
import subprocess,sys
from pathlib import Path
mode=sys.argv[1] if len(sys.argv)>1 else "golden"
assert mode in ("golden","jump"),mode
expected={
"src/main.ts","src/game/input.ts","src/game/mobile_controls.ts",
"src/sim/types.ts","src/sim/player_motion.ts"
}
changed=set(subprocess.check_output(["git","diff","--name-only","HEAD"],text=True).splitlines())
unexpected=sorted(changed-expected)
if unexpected:raise SystemExit("HIGHFLY_C2_NATIVE_UNAUTHORIZED_PATCHED_PATHS:"+str(unexpected))
if changed!=expected:raise SystemExit("HIGHFLY_C2_NATIVE_PATCH_MISSING:"+str(sorted(expected-changed)))
if subprocess.check_output(["git","status","--porcelain","--untracked-files=no","--","public"],text=True).strip():
    raise SystemExit("HIGHFLY_C2_NATIVE_MEDIA_CHANGED")
files={p:Path(p).read_text() for p in expected}
tokens={
"src/main.ts":["highflyTouchVector()","highflyWorldX","highflyWorldZ"],
"src/game/input.ts":["setHighflyTouchVector","clearHighflyTouchVector","isHighflyMobileCameraDecoupled"],
"src/game/mobile_controls.ts":["mapHighflyJoystickVector","clearHighflyTouchVector"],
"src/sim/types.ts":["highflyWorldX?: number","highflyWorldZ?: number","highflyAnalog?: number"],
"src/sim/player_motion.ts":["inp.highflyWorldX","inp.highflyWorldZ","inp.highflyAnalog"],
}
if mode=="jump":
    for p,t in {
        "src/game/input.ts":["highflyJumpSeq","triggerTouchJump()"],
        "src/sim/types.ts":["highflyJumpSeq?: number","highflyAirJumpUsed?: boolean"],
        "src/sim/player_motion.ts":["highflyAirJumpUsed","highflyFreshJumpPress"]
    }.items():tokens[p].extend(t)
for p,terms in tokens.items():
    for t in terms:
        if t not in files[p]:raise SystemExit("HIGHFLY_C2_NATIVE_MISSING_HOOK: "+p+" "+t)
print("HIGHFLY_C2_NATIVE_PATCH_WHITELIST_PASS="+",".join(sorted(changed)))
print("HIGHFLY_C2_ZERO_ASSETS_REMOVED=PASS")
print("HIGHFLY_C2_GAME_HOST_INTEGRATION="+mode)
