/** Add native offline restore and autosave to REBIRTH preview only. */
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
function patch(path,pairs){
 let s=readFileSync(path,'utf8');
 for(const [oldText,newText] of pairs){
  const n=s.split(oldText).length-1;
  if(n!==1)throw Error('R6_ANCHOR_'+path+'_'+n+'_'+oldText.slice(0,85));
  s=s.replace(oldText,newText);
 }
 writeFileSync(path,s,'utf8');
}
mkdirSync('src/highfly/rebirth',{recursive:true});
copyFileSync('../rebirth/rebirth-044/r6/offline_save.ts','src/highfly/rebirth/offline_save.ts');
patch('src/sim/types.ts',[
 ['export interface SimConfig {\n  seed: number;',
  "export interface SimConfig {\n  highflyRebirthOfflineSavedState?: import('./character_state').CharacterState;\n  seed: number;"]
]);
patch('src/sim/sim.ts',[
 ['      compulsoryTutorial: cfg.compulsoryTutorial ?? false,',
  '      compulsoryTutorial: cfg.compulsoryTutorial ?? false,\n      highflyRebirthOfflineSavedState: cfg.highflyRebirthOfflineSavedState,'],
 ['        autoEquip: this.cfg.autoEquip,\n        // Carried through, never derived:',
  '        autoEquip: this.cfg.autoEquip,\n        state: this.cfg.highflyRebirthOfflineSavedState,\n        // Carried through, never derived:'],
 ['      const ownPlayer = this.cfg.compulsoryTutorial',
  '      const ownPlayer = !this.cfg.highflyRebirthOfflineSavedState && this.cfg.compulsoryTutorial']
]);
patch('src/main.ts',[
 ["import {rebirthStartVitals,rebirthUpdateVitalsHud} from './highfly/rebirth/vitals_runtime';",
  "import {rebirthStartVitals,rebirthUpdateVitalsHud} from './highfly/rebirth/vitals_runtime';\nimport {loadSlot,activateSave,autosave} from './highfly/rebirth/offline_save';"],
 ["          events = offlineSim.tick();\n          rebirthUpdateVitalsHud(offlineSim.player);",
  "          events = offlineSim.tick();\n          rebirthUpdateVitalsHud(offlineSim.player);\n          autosave(offlineSim);"],
 ["  const sim = loadSpan(\n    'sim-build',",
  "  const isRebirthPreview = import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === '1' &&\n    new URLSearchParams(location.search).get('hfRebirth') === '1' &&\n    location.pathname.startsWith(import.meta.env.BASE_URL);\n  const rebirthSaved=isRebirthPreview ? loadSlot(playerClass,name) : null;\n  const sim = loadSpan(\n    'sim-build',"],
 ["      new Sim(\n        offlineWorldConfig({\n          playerClass,\n          name,\n          world,\n          seedOverride,\n          devCommands: import.meta.env.DEV,\n        }),\n      ),",
  "      new Sim({\n        ...offlineWorldConfig({\n          playerClass,\n          name,\n          world,\n          seedOverride,\n          devCommands: import.meta.env.DEV,\n        }),\n        compulsoryTutorial:isRebirthPreview ? false : world===undefined,\n        highflyRebirthOfflineSavedState:rebirthSaved?.character,\n      }),"],
 ["  sim.setPlayerSkin(sim.playerId, skin);",
  "  sim.setPlayerSkin(sim.playerId, rebirthSaved?.skin ?? skin);"],
 ["    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;\n    offlinePlayer.helmHidden = !creationHelm;",
  "    offlinePlayer.modularAppearance = (rebirthSaved?.appearance ?? modularAppearance) as unknown as Record<string, unknown>;\n    offlinePlayer.helmHidden = rebirthSaved?.helmHidden ?? !creationHelm;"],
 ["  void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);",
  "  if(isRebirthPreview)activateSave(sim,playerClass,name);\n  void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);"]
]);
let main=readFileSync('src/main.ts','utf8');
const oldRoute="location.pathname.startsWith('/cobalt-hollow-lab/rebirth/')";
const count=main.split(oldRoute).length-1;
if(count!==2)throw Error('R6_PREVIEW_ROUTE_COUNT_'+count);
main=main.split(oldRoute).join('location.pathname.startsWith(import.meta.env.BASE_URL)');
writeFileSync('src/main.ts',main,'utf8');
console.log('REBIRTH_R6_NATIVE_SERIALIZE_RESTORE_AND_ISOLATED_AUTOSAVE=1');
