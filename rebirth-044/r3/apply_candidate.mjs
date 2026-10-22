/** HIGHFLY REBIRTH R3 candidate overlay; NO Pages, NO native persistent schema. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
function patch(path,items) {
 let s=read(path);
 for(const [anchor,replacement] of items){
  const n=s.split(anchor).length-1;
  if(n!==1)throw Error('REBIRTH_R3_ANCHOR_DRIFT '+path+' count='+n+' '+anchor.slice(0,75));
  s=s.replace(anchor,replacement);
 }
 writeFileSync(path,s,'utf8');
}
mkdirSync('src/highfly/rebirth',{recursive:true});
for(const f of ['vitals_core.ts','vitals_runtime.ts','vitals_style.css'])
 copyFileSync('../rebirth/rebirth-044/r3/'+f,'src/highfly/rebirth/'+f);
patch('src/sim/types.ts',[
 ['  resourceType: ResourceType | null;\n  overheadEmoteId:',
  '  resourceType: ResourceType | null;\n  /** REBIRTH offline-only three-pool extension; not serialized to donor saves. */\n  highflyVitals?: {mana:number;maxMana:number;energy:number;maxEnergy:number};\n  overheadEmoteId:']
]);
patch('src/sim/combat/auras.ts',[
 ["import { regenParkedCatEnergy } from './cat_form_energy';",
  "import { regenParkedCatEnergy } from './cat_form_energy';\nimport {rebirthRegenSecondaryVitals} from '../../highfly/rebirth/vitals_core';"],
 ["  if (ctx.tickCount % 40 !== 0) return; // every 2 seconds (the classic tick)",
  "  if (ctx.tickCount % 40 !== 0) return; // every 2 seconds (the classic tick)\n  rebirthRegenSecondaryVitals(p);"],
 ["    p.resource = Math.min(p.maxResource, p.resource + 10);\n  } else if (p.resourceType === 'rage' && !p.inCombat) {",
  "    p.resource = Math.min(p.maxResource, p.resource + (p.highflyVitals ? 20 : 10));\n  } else if (p.resourceType === 'rage' && p.highflyVitals) {\n    // In REBIRTH only, native rage is the legacy wire slot for regenerating EN.\n    p.resource = Math.min(p.maxResource, p.resource + 20);\n  } else if (p.resourceType === 'rage' && !p.inCombat) {"]
]);
patch('src/sim/combat/casting_lifecycle.ts',[
 ["import { abilityCastSurvivesMovement, heldMovementInputWouldMove } from './cast_move_gate';",
  "import { abilityCastSurvivesMovement, heldMovementInputWouldMove } from './cast_move_gate';\nimport {rebirthSecondaryBalance,rebirthSpendSecondaryEnergy} from '../../highfly/rebirth/vitals_core';"],
 ["  const castingPool = autoUnshift && p.resourceType !== 'mana' ? p.savedMana : p.resource;",
  "  const castingPool = autoUnshift && p.resourceType !== 'mana' ? p.savedMana : p.resource;\n  const rebirthCastingPool=rebirthSecondaryBalance(p,ability,isFormToggle(ability)) ?? castingPool;"],
 ["    (entryPool ?? castingPool) < payableCost &&",
  "    (entryPool ?? rebirthCastingPool) < payableCost &&"],
 ["  if (p.resource < payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {",
  "  if ((rebirthSecondaryBalance(p,ability,isFormToggle(ability)) ?? p.resource) < payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {"],
 ["  spendResource(p, paidCost);\n  onShamanManaSpent(ctx, p, paidCost, res.cost > 0);",
  "  if(!rebirthSpendSecondaryEnergy(p,res.def,paidCost,isFormToggle(res.def))) spendResource(p, paidCost);\n  onShamanManaSpent(ctx, p, paidCost, res.cost > 0);"]
]);
patch('src/main.ts',[
 ["import {resolveFreedom360} from './highfly/combat/freedom_360';",
  "import {resolveFreedom360} from './highfly/combat/freedom_360';\nimport {rebirthStartVitals,rebirthUpdateVitalsHud} from './highfly/rebirth/vitals_runtime';"],
 ["import './highfly/rebirth/r2_style.css';",
  "import './highfly/rebirth/r2_style.css';\nimport './highfly/rebirth/vitals_style.css';"],
 ['    if(import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === "1") document.body.classList.add("hf-rebirth-r2");',
  '    if(import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === "1") {\n      document.body.classList.add("hf-rebirth-r2");\n      rebirthStartVitals(sim.player,playerClass,name);\n    }'],
 ["          events = offlineSim.tick();",
  "          events = offlineSim.tick();\n          rebirthUpdateVitalsHud(offlineSim.player);"]
]);
console.log('HIGHFLY_REBIRTH_R3_UNIVERSAL_VITALS_LEVEL1=1');
