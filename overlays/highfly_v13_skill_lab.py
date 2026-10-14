#!/usr/bin/env python3
"""V13 safe isolated activation on the disposable ClaudeCraft SF28 assembly only.

Reuses original Sim/render pipeline + frozen GOLDEN HUD, with native 63/63
catalog and cast controls. Never mutate main, production character storage,
Training/Rig_Medium, original 9 class kits or public Pages.
"""
from pathlib import Path
import shutil

source = Path('../v9-corrections/game/c1')
for filename, dest in [
    ('highfly_v13_skill_lab.ts', 'src/highfly/v13_skill_lab.ts'),
    ('highfly_v13_skill_lab.css', 'src/highfly/v13_skill_lab.css'),
    ('highfly_v13_skill_lab.test.ts', 'tests/highfly_v13_skill_lab.test.ts'),
]:
    src, target = source / filename, Path(dest)
    if not src.is_file() or target.exists():
        raise SystemExit('V13_SOURCE_MISSING_OR_DUPLICATED:'+str(src))
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(src,target)

file = Path('src/main.ts')
code = file.read_text(encoding='utf-8')
if 'installHighflyV13Lab' in code:
    raise SystemExit('V13_ALREADY_INSTALLED_MAIN')
imports = (
    "import { installHighflyV13Lab, isHighflyV13LabPage, "
    "highflyV13ClassFromQuery } from './highfly/v13_skill_lab';\n"
    "import './highfly/v13_skill_lab.css';\n"
)
code = imports + code

patches = [
    (
        "  sim.setPlayerSkin(sim.playerId, skin);\n",
        "  // V13: ephemeral offline-only LV99 fixture, NEVER a saved hunter.\n"
        "  if (isHighflyV13LabPage()) {\n"
        "    sim.setPlayerLevel(99);\n"
        "    sim.tick();\n"
        "  }\n"
        "  sim.setPlayerSkin(sim.playerId, skin);\n"
    ),
    (
        "      constrainedMemory: GFX.constrainedMemory,\n    });",
        "      constrainedMemory: GFX.constrainedMemory,\n    });\n"
        "    // Same native Sim and 3D renderer; only this Pages /lab/v13/ route.\n"
        "    if (isHighflyV13LabPage() && offlineSim) {\n"
        "      installHighflyV13Lab(offlineSim);\n"
        "    }"
    ),
    (
        "} else if (diagnosticsAutoOffline) {\n",
        "} else if (isHighflyV13LabPage()) {\n"
        "  // Changing class in the side panel starts a fresh ISOLATED lab session.\n"
        "  // Do not enter Eastbrook via a persisted production hunter.\n"
        "  startSitePresence('home');\n"
        "  void startOffline(highflyV13ClassFromQuery(), 'Highfly Lab', 0);\n"
        "} else if (diagnosticsAutoOffline) {\n"
    )
]
for old,new in patches:
    n = code.count(old)
    if n != 1:
        raise SystemExit('V13_FROZEN_MAIN_ANCHOR_CHANGED:'+old[:70]+':'+str(n))
    code = code.replace(old,new,1)
file.write_text(code,encoding='utf-8')
print('HIGHFLY_V13_NATIVE_63_SCROLL_CAST_AB_STAGE_INSTALLED=1')
print('HIGHFLY_V13_ONLY_ISOLATED_ROUTED_MAIN_UNTOUCHED=1')
