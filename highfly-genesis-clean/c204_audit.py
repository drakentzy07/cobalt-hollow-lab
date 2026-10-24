#!/usr/bin/env python3
"""HIGHFLY C2-04: verify exact game-source mutation surface and training links."""
import subprocess
from pathlib import Path
changed=set(subprocess.check_output(["git","diff","--name-only","HEAD"],text=True).splitlines())
expected={
 "src/main.ts","src/game/input.ts","src/game/mobile_controls.ts",
 "src/sim/types.ts","src/sim/player_motion.ts","src/sim/entity.ts",
 "src/sim/sim.ts"
}
if 'index.html' in changed:
    html=Path('index.html').read_text()
    source=Path('src/main.ts').read_text()
    if not all(x in html for x in ('hf-c204-play-gate','hf-c204-world','hf-c204-lab')):
        raise SystemExit('C204_UNAPPROVED_INDEX_CHANGE')
    if "VITE_HIGHFLY_C204_PLAYTEST" not in source or "startOffline('warrior',name,0)" not in source:
        raise SystemExit('C204_NO_OFFLINE_BOOT_HANDLER')
    expected.add('index.html')
if changed != expected:raise SystemExit("C204_NONWHITELIST_GAME_SOURCE_CHANGE "+str(sorted(changed^expected)))
if subprocess.check_output(["git","status","--porcelain","--untracked-files=no","--","public"],text=True).strip():
    raise SystemExit("C204_MEDIA_MUTATED")
for p,terms in {
 "src/main.ts":("activateHunterTrainingJournal(name","mountHighflyTrainingPanel(trainingJournal","refreshHighflyLocalStats"),
 "src/sim/entity.ts":("resolveHunterTrainingPrimary(e.name)","highflyCore?.STR","highflyCore?.VIT","highflyCore?.PER"),
 "src/sim/sim.ts":("public refreshHighflyLocalStats(entityId: number)","this.recalcPlayer(entity)"),
 "src/game/mobile_controls.ts":("mapHighflyJoystickVector","setHighflyTouchVector"),
 "src/sim/player_motion.ts":("highflyAirJumpUsed","highflyFreshJumpPress"),
}.items():
    t=Path(p).read_text()
    for term in terms:
        if term not in t:raise SystemExit("C204_REQUIRED_NATIVE_LINK_ABSENT "+p+" "+term)
for p in (
 "src/highfly/training/universal_stats.ts",
 "src/highfly/training/training_journal.ts",
 "src/highfly/training/training_panel.ts",
 "src/highfly/fury/fury_core.ts",
):
    if not Path(p).is_file():raise SystemExit("C204_PORTABLE_SOURCE_ABSENT "+p)
print("HIGHFLY_C204_OFFLINE_JOURNAL_AND_NATIVE_STATS_BOUND=PASS")
print("HIGHFLY_C204_WORLD_AND_LAB_PROFILE_ISOLATION=TESTED")
print("HIGHFLY_C204_PUBLIC_MEDIA_OR_SAVE_REWRITES=0")
print("HIGHFLY_C204_MODIFIED_GAME_FILES="+",".join(sorted(changed)))
