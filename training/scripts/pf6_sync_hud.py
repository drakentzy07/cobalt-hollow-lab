#!/usr/bin/env python3
"""PF-6 C: wire settled donor xp/levelup events to the local Training profile.

The existing HUD already owns both event dispatch and its authoritative XP bar.
No second gameplay XP, ticker, UI bar, grant or altered save pipeline is added.
"""
from pathlib import Path

hud = Path("src/ui/hud.ts")
s = hud.read_text(encoding="utf-8")
old_import = "import { audio } from '../game/audio';"
new_import = ("import { syncHighflyPf6FromGameplay } from '../highfly/training/pf6_progression_sync';\n"
              + old_import)
if s.count(old_import) != 1 or "syncHighflyPf6FromGameplay" in s:
    raise SystemExit("PF-6 C: HUD import differs or integration already exists")

# Called only when the current HUD drains donor's completed XP/levelup events.
# XP is already committed to Sim by the time HUD receives these events.
snapshot = """          syncHighflyPf6FromGameplay({
            localEntityId: sim.playerId,
            eventEntityId: ev.pid,
            level: sim.player.level,
            barXp: sim.xp,
            classId: sim.cfg.playerClass,
          });
"""
xp_anchor = "        case 'xp': {\n"
level_anchor = "        case 'levelup': {\n"
if s.count(xp_anchor) != 1 or s.count(level_anchor) != 1:
    raise SystemExit("PF-6 C: HUD event dispatch differs; fail closed")

s = s.replace(old_import, new_import, 1)
s = s.replace(xp_anchor, xp_anchor + snapshot, 1)
s = s.replace(level_anchor, level_anchor + snapshot, 1)
hud.write_text(s, encoding="utf-8")
assert s.count("syncHighflyPf6FromGameplay(") == 2
print("HIGHFLY_PF6_LIVE_GAMEPLAY_EVENTS_TO_PROFILE=1")
