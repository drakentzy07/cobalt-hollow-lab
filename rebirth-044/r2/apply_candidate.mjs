/**
 * HIGHFLY REBIRTH R2 — reapply only vetted 0.44 combat-movement kernels.
 * Executed after the R1 training patch, against the immutable v0.44.7 donor.
 * Never changes native classes, spells, gear, resource definitions, character
 * editor, map, quests, loot, professions or persisted world save formats.
 */
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
function read(p){return readFileSync(p,'utf8')}
function write(p,s){writeFileSync(p,s,'utf8')}
function one(s,old,who){
  const n=s.split(old).length-1;
  if(n!==1)throw Error('REBIRTH_R2_ANCHOR_DRIFT '+who+' matches='+n+' '+old.slice(0,85));
}
function patch(p,edits){
  let s=read(p);
  for(const [from,to] of edits){one(s,from,p);s=s.replace(from,to)}
  write(p,s);
}
const legacy='../legacy/';
const priorInput=read('src/game/input.ts');
const oldInput=read(legacy+'src/game/input.ts');
if(!priorInput.includes('triggerTouchJump(): void') ||
   !oldInput.includes('highflyTouchVectorState') ||
   !oldInput.includes('triggerHighflyEvade(): void'))
   throw Error('REBIRTH_R2_INPUT_DONOR_MISMATCH');
// Historically tested: 14 HIGHFLY-only changes, class and ability agnostic.
write('src/game/input.ts',oldInput);

const nativeMotion=read('src/sim/player_motion.ts');
let historicMotion=read(legacy+'src/sim/player_motion.ts');
if(!nativeMotion.includes('export const JUMP_VELOCITY = 6;') ||
   !historicMotion.includes('HIGHFLY_EVADE_COOLDOWN') ||
   !historicMotion.includes('highflyFreshJumpPress &&'))
  throw Error('REBIRTH_R2_MOTION_DONOR_MISMATCH');
// Correct the historical universal-Hunter leak. Air re-jump is authorized
// only when the isolated R2 mobile client explicitly opts in to freedom.
one(historicMotion,'    highflyFreshJumpPress &&\n    !p.onGround &&','historic motion gate');
historicMotion=historicMotion.replace('    highflyFreshJumpPress &&\n    !p.onGround &&',
  '    inp.highflyAirDashEnabled === true &&\n    highflyFreshJumpPress &&\n    !p.onGround &&');
write('src/sim/player_motion.ts',historicMotion);

// Optional transient state. These fields never enter the original save schema.
patch('src/sim/types.ts',[
  ['  jumping: boolean;\n  fallStartY: number;',
   '  jumping: boolean;\n  highflyAirJumpUsed?: boolean;\n  highflyF25CombatFreedom?: boolean;\n  highflyF261Controls?: boolean;\n  highflyFlipDir?: "forward"|"back"|"left"|"right";\n  highflyLastJumpSeq?: number;\n  highflyLastEvadeSeq?: number;\n  highflyEvadeRemaining?: number;\n  highflyEvadeCooldownRemaining?: number;\n  highflyEvadeDirX?: number;\n  highflyEvadeDirZ?: number;\n  fallStartY: number;'],
  ['  jump: boolean;\n  /** Swim DOWN.',
   '  jump: boolean;\n  highflyWorldX?: number;\n  highflyWorldZ?: number;\n  highflyAnalog?: number;\n  highflyJumpSeq?: number;\n  highflyEvadeSeq?: number;\n  highflyFlipDirInput?: "forward"|"back"|"left"|"right";\n  highflyAirDashEnabled?: boolean;\n  /** Swim DOWN.']
]);
mkdirSync('src/highfly/combat',{recursive:true});
for(const f of ['freedom_360.ts','f261_controls.ts','f24_aim_core.ts']){
  const source=read(legacy+'src/highfly/combat/'+f);
  if(!source.includes('export '))throw Error('R2_MISSING_HISTORIC_COMBAT_MODULE_'+f);
  write('src/highfly/combat/'+f,source);
}

// Reuse ONLY the historical radial joystick kernel; retain the original
// 0.44 action ring, More menu, talent/spec slots and touch-router ownership.
const historicControls=read(legacy+'src/game/mobile_controls.ts');
const start=historicControls.indexOf('export function mapHighflyJoystickVector(');
const end=historicControls.indexOf('\nexport class MobileControls',start);
if(start<0||end<start)throw Error('R2_MISSING_HISTORIC_RADIAL_KERNEL');
const joystickKernel=historicControls.slice(start,end);
patch('src/game/mobile_controls.ts',[
  ['  onJump(): void;\n  onInteract(): void;',
   '  onJump(): void;\n  onEvade?(): void;\n  onInteract(): void;'],
  ['export class MobileControls {',joystickKernel+'\nexport class MobileControls {'],
  ["    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });",
   "    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });\n    this.bindButton('mobile-evade', () => this.callbacks.onEvade?.(), { pressFirst: true });"],
  ['    const move = mapJoystickVector(x, y, this.moveDeadzone);\n    const inAutorunTarget = isMoveAutorunPush(rawY);',
   '    const move = mapJoystickVector(x, y, this.moveDeadzone);\n    if (document.body.classList.contains("hf-rebirth-r2")) {\n      // Do not turn an upward thumb drag into an unexpected autorun latch.\n      const radial = mapHighflyJoystickVector(x,y,this.moveDeadzone);\n      this.moveAutorunLocked = false;\n      if (this.input.autorun) this.input.setAutorun(false);\n      this.input.setHighflyTouchVector(radial);\n      this.input.setTouchMove(move);\n      this.syncMoveAutorunTarget("hidden");\n      return;\n    }\n    const inAutorunTarget = isMoveAutorunPush(rawY);'],
  ['    this.input.clearTouchMove();\n    if (this.moveStick)',
   '    this.input.clearTouchMove();\n    this.input.clearHighflyTouchVector();\n    if (this.moveStick)']
]);

patch('src/main.ts',[
  ["import { Input } from './game/input';",
   "import { Input } from './game/input';\nimport {resolveFreedom360} from './highfly/combat/freedom_360';"],
  ["import './highfly/rebirth/training_style.css';",
   "import './highfly/rebirth/training_style.css';\nimport './highfly/rebirth/r2_style.css';"],
  ['    initHighflyRebirth044Training(sim, playerClass, name);',
   '    initHighflyRebirth044Training(sim, playerClass, name);\n    if(import.meta.env.VITE_HIGHFLY_REBIRTH_PREVIEW === "1") document.body.classList.add("hf-rebirth-r2");'],
  ['    onJump: () => input.triggerTouchJump(),',
   '    onJump: () => input.triggerTouchJump(),\n    onEvade: () => { if (document.body.classList.contains("hf-rebirth-r2")) input.triggerHighflyEvade(); },'],
  ['    const mi = input.readMoveInput();\n    let facing: number | null = mouselook ? input.camYaw : null;',
   '    const mi = input.readMoveInput();\n    let facing: number | null = mouselook ? input.camYaw : null;\n    if (document.body.classList.contains("hf-rebirth-r2") &&\n        document.body.classList.contains("mobile-touch") && !input.suspendMovement) {\n      const radial=resolveFreedom360(input.highflyTouchVector(),input.camYaw);\n      if(radial){\n        mi.highflyWorldX=radial.worldX;\n        mi.highflyWorldZ=radial.worldZ;\n        mi.highflyAnalog=radial.analog;\n        facing=radial.facing;\n      }\n      // R2 offline only: enables bounded single air-rejump and dash; does not\n      // modify cast restrictions, auto-attack rules or class specializations.\n      mi.highflyAirDashEnabled=true;\n    }']
]);

const evadeButton='      <button type="button" id="mobile-evade" title="Esquivar" aria-label="Esquivar" data-icon="dash"><span class="mobile-label">Dash</span></button>\n';
for(const p of ['index.html','play.html'])
  patch(p,[['      <button type="button" id="mobile-jump"',evadeButton+'      <button type="button" id="mobile-jump"']]);
console.log('REBIRTH_R2_SELECTIVE_044_COMBAT_HUD_INTEGRATION=1');
