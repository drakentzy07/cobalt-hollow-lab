#!/usr/bin/env python3
"""P02-C isolated, exact-anchor native browser offline preview integration.
Only invoked by the NO DEPLOY monster workflow on the P02-C branch.
No default world/Playtest migration, no Pages production changes.
"""
from pathlib import Path

main = Path('src/main.ts')
src = main.read_text(encoding='utf-8')
anchor_import = "import { takeEditorPlaytestRequest } from './game/editor_playtest';"
anchor_signature = """  world?: WorldContent,
  seedOverride?: number,
): Promise<void> {"""
anchor_start = "const editorPlaytest = takeEditorPlaytestRequest();\nconst startupParams = new URLSearchParams(location.search);"
anchor_else = "} else if (diagnosticsAutoOffline) {"
for name,match in [('import',anchor_import),('signature',anchor_signature),('start',anchor_start),('else',anchor_else)]:
    if src.count(match) != 1:
        raise SystemExit('HF_HUNT_P02C_ANCHOR_DRIFT:' + name)
if 'highflyHuntBrowserRequest' in src or 'huntPreviewLevel?: number' in src:
    raise SystemExit('HF_HUNT_P02C_ALREADY_APPLIED')
src = src.replace(anchor_import,anchor_import+"\nimport { highflyHuntBrowserRequest } from './highfly/monsters/hunt_browser_pilot';",1)
src = src.replace(anchor_signature,"""  world?: WorldContent,
  seedOverride?: number,
  huntPreviewLevel?: number,
): Promise<void> {""",1)
offline_start = src.find('async function startOffline(')
skin_gate = '  if (!matchingOfflineSave) sim.setPlayerSkin(sim.playerId, skin);'
skin_at = src.find(skin_gate, offline_start)
if offline_start < 0 or skin_at < 0 or skin_at - offline_start > 5200:
    raise SystemExit('HF_HUNT_P02C_OFFLINE_NATIVE_SKIN_GATE_MISSING')
# This real HIGHFLY branch saves/reconciles the Training profile immediately
# AFTER its native skin gate. Level the isolated pilot BEFORE profile sync.
insert_at = skin_at + len(skin_gate)
src = src[:insert_at] + """
  // Only P02C opt-in world: native class level for the preview Hunter.
  // Never grants Training/Core points or touches ordinary offline saves.
  if (huntPreviewLevel !== undefined) {
    sim.setPlayerLevel(huntPreviewLevel, sim.playerId);
  }""" + src[insert_at:]
src = src.replace(anchor_start,anchor_start+"""
const highflyHuntPilot = highflyHuntBrowserRequest(
  startupParams, import.meta.env.VITE_HIGHFLY_HUNT_PREVIEW === '1',
);""",1)
src = src.replace(anchor_else,"""} else if (highflyHuntPilot) {
  startSitePresence('home');
  void startOffline(
    'warrior', 'HuntPilot', 0,
    highflyHuntPilot.world, highflyHuntPilot.seed,
    highflyHuntPilot.hunterLevel,
  );
} else if (diagnosticsAutoOffline) {""",1)
main.write_text(src,encoding='utf-8')
print('HIGHFLY_P02C_BROWSER_HUNT_GATE_AND_NATIVE_OFFLINE_ENTRY=1')
