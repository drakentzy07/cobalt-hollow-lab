/**
 * Explicit, fail-closed HIGHFLY G2 wiring for the pinned ClaudeCraft 0.45 tree.
 * No historical patch chain, no automatic mutation of upstream or main.
 * Applied only to ephemeral CI candidate checkout.
 */
import { readFileSync, writeFileSync } from 'node:fs';

function edit(path, transformations) {
  let s=readFileSync(path,'utf8');
  for (const [before,after] of transformations) {
    const count=s.split(before).length-1;
    if(count!==1)throw new Error('G2 anchor must be unique: '+path+' ('+count+') '+before.slice(0,65));
    s=s.replace(before,after);
  }
  writeFileSync(path,s);
}
edit('src/sim/entity.ts',[
  [
    "import { parkCatEnergy, takeCatFormEntryEnergy } from './combat/cat_form_energy';",
    "import { genesisApplyTrainingAfterNativeRecalc } from '../highfly/genesis/training_runtime';\nimport { parkCatEnergy, takeCatFormEntryEnergy } from './combat/cat_form_energy';"
  ],
  [
    "    e.resource = Math.min(e.resource, 100);\n  }\n}\n\n// Derived stats + max vitals",
    "    e.resource = Math.min(e.resource, 100);\n  }\n  // Native class/gear/spec recalculation is the sole stat baseline.\n  // Only the explicitly bound OFFLINE G2 character receives growth.\n  genesisApplyTrainingAfterNativeRecalc(e, cls);\n}\n\n// Derived stats + max vitals"
  ],
]);

edit('src/main.ts',[
  [
    "import ",
    "import { bootGenesisOfflineTraining } from './highfly/genesis/offline_training';\nimport { resolveFreedom360 as resolveGenesisMove360 } from './highfly/combat/freedom_360';\nimport "
  ],
  [
    "  sim.setPlayerSkin(sim.playerId, skin);\n  // Offline has no account",
    "  sim.setPlayerSkin(sim.playerId, skin);\n  // G2 training is an explicit local-only opt-in; NEVER on online/realms.\n  if (new URLSearchParams(location.search).get('hfGenesis') === '1') {\n    bootGenesisOfflineTraining(sim, playerClass, name);\n  }\n  // Offline has no account"
  ],
  [
    "    return { mi, facing };\n  }\n\n  const updateHoverCursor",
    "    // G2 touch locomotion: project the thumb into the independent camera\n    // basis while retaining the native Sim collision, movement and stamina.\n    const g2Stick = input.genesisTouchVector();\n    if (new URLSearchParams(location.search).get('hfGenesis') === '1' &&\n        g2Stick !== null && !movementFrozen() && !input.suspendMovement) {\n      const intent=resolveGenesisMove360(g2Stick, input.camYaw);\n      if (intent) {\n        mi.forward = true;\n        mi.back = false;\n        mi.strafeLeft = false;\n        mi.strafeRight = false;\n        facing = intent.facing;\n      }\n    }\n    return { mi, facing };\n  }\n\n  const updateHoverCursor"
  ],
]);

edit('src/game/input.ts',[
  [
    "  private touchMove: TouchMoveInput = {",
    "  private genesisMoveVector: { x: number; y: number } | null = null;\n  genesisTouchVector(): { x: number; y: number } | null { return this.genesisMoveVector; }\n  setGenesisTouchVector(x: number, y: number): void {\n    this.genesisMoveVector = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;\n  }\n  private touchMove: TouchMoveInput = {"
  ],
  [
    "  clearTouchMove(): void {\n    const changed =",
    "  clearTouchMove(): void {\n    this.genesisMoveVector = null;\n    const changed ="
  ],
]);

edit('src/game/mobile_controls.ts',[
  [
    "    this.input.setTouchMove(move);\n    const moving = move.forward",
    "    this.input.setTouchMove(move);\n    // Opt-in HIGHFLY G2: native joystick capture and camera are preserved.\n    if (new URLSearchParams(location.search).get('hfGenesis') === '1') {\n      this.input.setGenesisTouchVector(x, y);\n    }\n    const moving = move.forward"
  ],
]);

console.log('GENESIS_G2_NATIVE_GAMEPLAY_HOOKS_APPLIED=1');
