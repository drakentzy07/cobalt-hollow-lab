#!/usr/bin/env node
// Patches an EXACT ClaudeCraft v0.20.0 clone; never edits upstream Git history.
import {readFileSync, writeFileSync, copyFileSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(process.argv[2]||'upstream');
const file=join(root,'src/main.ts');
const destination=join(root,'src/game/highfly_offline_store.ts');
let src=readFileSync(file,'utf8');
function replaceOne(before,after,label){
 const i=src.indexOf(before);
 if(i<0 || src.indexOf(before,i+before.length)>=0)throw Error('Unsafe patch anchor '+label);
 src=src.slice(0,i)+after+src.slice(i+before.length);
}
replaceOne(
 "import { takeEditorPlaytestRequest } from './game/editor_playtest';",
 "import { takeEditorPlaytestRequest } from './game/editor_playtest';\n"+
 "import { browserOfflineStorage, loadOfflineCharacter, storeOfflineCharacter } from './game/highfly_offline_store';",
 'imports'
);
const original=[
"  const sim = new Sim({",
"    seed: seedOverride ?? WORLD_SEED,",
"    playerClass,",
"    playerName: name,",
"    devCommands: import.meta.env.DEV,",
"    world,",
"  });",
"  sim.setPlayerSkin(sim.playerId, skin);"
].join('\n');
const replacement=[
"  // HIGHFLY: restore saved CharacterState for built-in world only.",
"  // Editor play-tests are deliberately isolated and disposable.",
"  const restored = world ? null : loadOfflineCharacter(browserOfflineStorage(), playerClass, name);",
"  const sim = new Sim({",
"    seed: seedOverride ?? WORLD_SEED,",
"    playerClass,",
"    playerName: name,",
"    devCommands: import.meta.env.DEV,",
"    world,",
"    noPlayer: restored !== null,",
"  });",
"  if (restored) {",
"    sim.addPlayer(playerClass, name, {state: restored});",
"  } else {",
"    sim.setPlayerSkin(sim.playerId, skin);",
"  }"
].join('\n');
replaceOne(original,replacement,'offline bootstrap');
const before=[
"  // Offline only: expose the dev \"2v2 Fiesta vs Bots\" practice toggle to the HUD.",
"  if (offlineSim) hud.setFiestaPracticeHook(() => offlineSim.startFiestaPractice());"
].join('\n');
const after=[
"  // HIGHFLY: save the ORIGINAL simulator state without changing the world data.",
"  // Never save editor play-tests or online worlds to the player save namespace.",
"  if (offlineSim && !offlineSim.cfg.world) {",
"    const save = () => {",
"      const state = offlineSim.serializeCharacter(offlineSim.playerId);",
"      storeOfflineCharacter(",
"        browserOfflineStorage(),",
"        offlineSim.cfg.playerClass,",
"        offlineSim.cfg.playerName,",
"        state,",
"      );",
"    };",
"    window.setInterval(save, 15000);",
"    window.addEventListener('pagehide', save);",
"    document.addEventListener('visibilitychange', () => {",
"      if (document.visibilityState === 'hidden') save();",
"    });",
"  }",
before
].join('\n');
replaceOne(before,after,'autosave');
if(existsSync(destination))throw Error('Refusing overwrite existing HIGHFLY module');
copyFileSync(fileURLToPath(new URL('./offline_store.ts',import.meta.url)),destination);
writeFileSync(file,src);
console.log('Applied HIGHFLY P2 offline save/restore adapter to original source');
