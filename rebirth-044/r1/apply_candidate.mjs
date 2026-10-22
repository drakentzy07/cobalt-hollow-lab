/**
 * R1 reproducible integration into the immutable v0.44.7 ClaudeCraft donor.
 * Only explicit single-match replacements are permitted. Any donor drift
 * fails the build instead of silently corrupting the nine native classes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
function edit(path, pairs) {
  let s=readFileSync(path,'utf8');
  for (const [oldText,newText] of pairs) {
    const n=s.split(oldText).length-1;
    if(n!==1)throw new Error('REBIRTH_R1_ANCHOR_MISMATCH '+path+' count='+n+' anchor='+oldText.slice(0,70));
    s=s.replace(oldText,newText);
  }
  writeFileSync(path,s);
}
edit('src/main.ts',[
  [
    "import { offlineWorldConfig } from './game/offline_world_config';",
    `import { offlineWorldConfig } from './game/offline_world_config';
import { initHighflyRebirth044Training } from './highfly/rebirth/training_entry';
import './highfly/rebirth/training_style.css';`
  ],
  [
    "  sim.setPlayerSkin(sim.playerId, skin);\n  // Offline has no account",
    `  sim.setPlayerSkin(sim.playerId, skin);
  // HIGHFLY REBIRTH R1: offline-only, named/class-scoped Training profile.
  // Native ability lists, class identity, equipment, specs and resources remain intact.
  if (new URLSearchParams(location.search).get('hfRebirth') === '1') {
    initHighflyRebirth044Training(sim, playerClass, name);
  }
  // Offline has no account`
  ],
  [
    "  const offlineAvailable = isOfflineModeAvailable(import.meta.env.DEV);",
    `  const offlineAvailable = isOfflineModeAvailable(import.meta.env.DEV) ||
    (import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === '1' &&
      new URLSearchParams(location.search).get('hfRebirth') === '1' &&
      location.pathname.startsWith('/cobalt-hollow-lab/rebirth/'));`
  ],
  [
    "    applyServerMode('online');",
    "    applyServerMode(offlineAvailable && new URLSearchParams(location.search).get('hfRebirth') === '1' ? 'offline' : 'online');"
  ],
  [
    "  wireStartScreens();\n  initHomepageMusic();",
    `  wireStartScreens();
  initHomepageMusic();
  // Auto-open the nine-class OFFLINE creator only on a future isolated Rebirth preview.
  if (import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === '1' &&
      startupParams.get('hfRebirth') === '1' &&
      location.pathname.startsWith('/cobalt-hollow-lab/rebirth/')) {
    document.getElementById('btn-offline')?.click();
  }`
  ]
]);
edit('src/game/mobile_controls.ts',[
  [
    "    this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());",
    `    this.bindButton('mobile-training', () => {
      this.closeMoreModal();
      window.dispatchEvent(new CustomEvent('highfly:open-training'));
    });
    this.bindButton('mobile-bar-editor', () => this.callbacks.onBarEditor());`
  ]
]);
edit('index.html',[
  [
    "          <button type=\"button\" class=\"mobile-btn\" id=\"mobile-chat\"",
    `          <button type="button" class="mobile-btn" id="mobile-training" title="Entrenamiento HIGHFLY" aria-label="Entrenamiento HIGHFLY" data-icon="talents"><span class="mobile-label">Training</span></button>
          <button type="button" class="mobile-btn" id="mobile-chat"`
  ],
  [
    "      <div id=\"mobile-extra-controls\" class=\"window panel\"",
    `      <div id="highfly-training-window" class="window panel" role="dialog" aria-modal="true" aria-labelledby="highfly-training-title" hidden>
        <div class="panel-title">
          <span id="highfly-training-title">HIGHFLY · SISTEMA DE ENTRENAMIENTO</span>
          <button type="button" class="x-btn" id="highfly-training-close" title="Cerrar" aria-label="Cerrar" data-icon="close">×</button>
        </div>
        <div class="highfly-training-shell"><strong>Training Core</strong></div>
      </div>
      <div id="mobile-extra-controls" class="window panel"`
  ]
]);
edit('src/sim/entity.ts',[
  [
    "import { aggregateSetBonuses, CLASSES",
    "import { applyActiveTrainingBridgeToEntity } from '../highfly/training/combat_runtime';\nimport { aggregateSetBonuses, CLASSES"
  ],
  [
    "    e.resource = Math.min(e.resource, 100);\n  }\n}\n\n// Derived stats + max vitals",
    "    e.resource = Math.min(e.resource, 100);\n  }\n  // Safe: player entity must be explicitly bound by the offline Rebirth entry.\n  applyActiveTrainingBridgeToEntity(e);\n}\n\n// Derived stats + max vitals"
  ]
]);
console.log('HIGHFLY_REBIRTH_R1_PATCH_PURE_NATIVE_NINE_CLASSES_AND_TRAINING_MENU=1');
