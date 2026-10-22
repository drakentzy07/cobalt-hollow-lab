/** REBIRTH R4. Single native sim; nine native skill definitions untouched.
 * Correct resource-selection for cross-school native casts + Golden facing.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
function patch(path,pairs){
 let s=read(path);
 for(const [a,b] of pairs) {
  const count=s.split(a).length-1;
  if(count!==1)throw Error('R4_ANCHOR_DRIFT '+path+' '+count+' '+a.slice(0,100));
  s=s.replace(a,b);
 }
 writeFileSync(path,s,'utf8');
}
patch('src/highfly/rebirth/vitals_core.ts',[
 ["type Player=Pick<Entity,'resource'|'resourceType'|'maxResource'|'stats'|'savedMana'|'highflyVitals'>;",
  "type Player=Pick<Entity,'resource'|'resourceType'|'maxResource'|'stats'|'savedMana'|'highflyVitals'|'fiveSecondRule'|'templateId'>;"],
 ["  if(!primaryIsMana)p.resource=v.energy; // native rage/focus/energy is an internal EN adapter",
  "  p.resource=primaryIsMana?v.mana:v.energy; // restore the actual primary pool; donor save remains untouched"],
 ["    if(p.savedMana>0)v.mana=cap(p.savedMana,maxMana);",
  "    if(p.templateId==='druid')v.mana=cap(p.savedMana,maxMana);"]
]);
const path='src/highfly/rebirth/vitals_core.ts';
writeFileSync(path,read(path)+`

/** Only preview-attached players receive this policy. The original sim resource
 * continues to own native class mechanics/talents, but a cross-school spell
 * checks/spends the other real pool without touching the live native bar.
 * Druid form transitions and auto-unshift remain native, never double-billed.
 */
export type RebirthResourcePool='mana'|'energy';
export function rebirthPoolForAbility(ability:{school?:string}):RebirthResourcePool {
  return ability.school==='physical'?'energy':'mana';
}
export function rebirthSecondaryPool(
 p:Player, ability:{school?:string}, formChange=false,autoUnshift=false
):RebirthResourcePool|null {
 if(!p.highflyVitals||formChange||autoUnshift)return null;
 const required=rebirthPoolForAbility(ability);
 const primary=p.resourceType==='mana'?'mana':'energy';
 return required===primary?null:required;
}
export function rebirthAbilityBalance(
 p:Player, ability:{school?:string},formChange=false,autoUnshift=false
):number|null {
 const k=rebirthSecondaryPool(p,ability,formChange,autoUnshift);
 return k?p.highflyVitals![k]:null;
}
export function rebirthDebitCrossPool(
 p:Player,ability:{school?:string},cost:number,formChange=false,autoUnshift=false
):boolean {
 const k=rebirthSecondaryPool(p,ability,formChange,autoUnshift);
 if(!k)return false;
 const v=p.highflyVitals!;
 v[k]=cap(v[k]-Math.max(0,cost),k==='mana'?v.maxMana:v.maxEnergy);
 if(k==='mana'&&cost>0)p.fiveSecondRule=0;
 return true;
}
`);
patch('src/sim/combat/casting_lifecycle.ts',[
 ["import {rebirthSecondaryBalance,rebirthSpendSecondaryEnergy} from '../../highfly/rebirth/vitals_core';",
  "import {rebirthAbilityBalance,rebirthDebitCrossPool,rebirthPoolForAbility} from '../../highfly/rebirth/vitals_core';"],
 ["  const rebirthCastingPool=rebirthSecondaryBalance(p,ability,isFormToggle(ability)) ?? castingPool;",
  "  const rebirthCastingPool=rebirthAbilityBalance(p,ability,isFormToggle(ability),autoUnshift) ?? castingPool;"],
 ["  if ((rebirthSecondaryBalance(p,ability,isFormToggle(ability)) ?? p.resource) < payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {",
  "  if ((rebirthAbilityBalance(p,ability,isFormToggle(ability)) ?? p.resource) < payableCost && !canCastFree && !togglingOff && !formShiftKind(p, ability)) {"],
 ["  if(!rebirthSpendSecondaryEnergy(p,res.def,paidCost,isFormToggle(res.def))) spendResource(p, paidCost);",
  "  if(!rebirthDebitCrossPool(p,res.def,paidCost,isFormToggle(res.def))) spendResource(p, paidCost);"],
 ["  const spentRage = p.resourceType === 'rage' ? res.cost : 0;",
  "  const spentRage = p.resourceType === 'rage' && (!p.highflyVitals || rebirthPoolForAbility(res.def)==='energy') ? res.cost : 0;"],
 ["      entryPool !== null\n        ? druidFormEntryTarget(ability.id) === 'cat'",
  "      p.highflyVitals && entryPool === null && !autoUnshift\n        ? (rebirthPoolForAbility(ability)==='energy'?'Not enough energy!':'Not enough mana!')\n        : entryPool !== null\n        ? druidFormEntryTarget(ability.id) === 'cat'"],
 ["    ctx.error(p.id, `Not enough ${p.resourceType ?? 'resource'}!`);",
  "    ctx.error(p.id, `Not enough ${p.highflyVitals ? rebirthPoolForAbility(ability) : (p.resourceType ?? 'resource')}!`);"]
]);
patch('src/game/mobile_controls.ts',[
 ['      this.input.setHighflyTouchVector(radial);\n      this.input.setTouchMove(move);\n      this.syncMoveAutorunTarget("hidden");',
  '      this.input.setHighflyTouchVector(radial);\n      // The native WASD flags MUST agree with the analog deadzone.\n      const magnitude = Math.hypot(radial.x, radial.y);\n      const coherentMove = magnitude > 0.001\n        ? mapJoystickVector(radial.x,radial.y,0.001)\n        : {forward:false,back:false,strafeLeft:false,strafeRight:false};\n      this.input.setTouchMove(coherentMove);\n      this.syncMoveAutorunTarget("hidden");']
]);
patch('src/main.ts',[
 ['    return !movementFrozen() ? glider.gliderAwareVisualFacing(world, mi, baseFacing) : null;',
  '    // Golden camera-relative orientation is authoritative: never re-rotate\n    // the visible body through native backpedal/strafe after resolving the stick.\n    if (document.body.classList.contains("hf-rebirth-r2") &&\n        document.body.classList.contains("mobile-touch") &&\n        Math.hypot(input.highflyTouchVector().x,input.highflyTouchVector().y)>0.001)\n      return !movementFrozen() ? baseFacing : null;\n    return !movementFrozen() ? glider.gliderAwareVisualFacing(world, mi, baseFacing) : null;']
]);
console.log('REBIRTH_R4_CROSS_SCHOOL_MP_EN_AND_GOLDEN_FACING_READY=1');
