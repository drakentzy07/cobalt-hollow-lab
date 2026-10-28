#!/usr/bin/env node
// HIGHFLY FURY P4A source overlay: exact ClaudeCraft v0.20.0, offline touch only.
import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(process.argv[2]||'upstream');
function apply(relative,edits){
 const file=join(root,relative);
 let s=readFileSync(file,'utf8');
 for(const e of edits){
  const [label,before,after]=e;
  const index=s.indexOf(before);
  if(index<0 || s.indexOf(before,index+before.length)>=0)throw Error(relative+' unsafe anchor '+label);
  s=s.slice(0,index)+after+s.slice(index+before.length);
 }
 writeFileSync(file,s);
}
const to=join(root,'src/game/highfly_fury_core.ts');
if(existsSync(to))throw Error('FURY already applied');
apply('src/sim/types.ts',[
 ['analog type',
  ['  jump: boolean;','}','', '// A bounded height edit'].join('\n'),
  ['  jump: boolean;','  // HIGHFLY offline analog displacement vector in WORLD coords.','  analogWorldX?: number;','  analogWorldZ?: number;','}','', '// A bounded height edit'].join('\n')]
]);
apply('src/game/input.ts',[
 ['stick field','  private touchMove: TouchMoveInput = {',
  ['  private highflyFuryStick = { x: 0, y: 0 };','  private touchMove: TouchMoveInput = {'].join('\n')],
 ['stick methods','  setTouchMove(move: TouchMoveInput): void {',
  [
   '  /** HIGHFLY: real analogue stick, independent from right camera. */',
   '  setHighflyFuryStick(x: number, y: number): void {',
   '    const mag = Math.max(1, Math.hypot(x,y));',
   '    this.highflyFuryStick = Number.isFinite(x) && Number.isFinite(y)',
   '      ? {x:x/mag,y:y/mag} : {x:0,y:0};',
   '    if(Math.hypot(this.highflyFuryStick.x,this.highflyFuryStick.y)>0.12)this.autorun=false;',
   '  }',
   '  clearHighflyFuryStick(): void { this.highflyFuryStick={x:0,y:0}; }',
   '  highflyFuryStickVector(): {x:number;y:number}|null {',
   '    return this.suspendMovement || Math.hypot(this.highflyFuryStick.x,this.highflyFuryStick.y)<=0.12',
   '      ? null : {...this.highflyFuryStick};',
   '  }',
   '',
   '  setTouchMove(move: TouchMoveInput): void {'
  ].join('\n')]
]);
apply('src/game/mobile_controls.ts',[
 ['stick forward','    this.input.setTouchMove(move);\n    // setTouchMove cancels autorun',
  '    this.input.setTouchMove(move);\n    this.input.setHighflyFuryStick(x,y);\n    // setTouchMove cancels autorun'],
 ['release','    this.joyPointer = null;\n    this.input.clearTouchMove();',
  '    this.joyPointer = null;\n    this.input.clearHighflyFuryStick();\n    this.input.clearTouchMove();']
]);
apply('src/sim/sim.ts',[
 ['activity flag','      mv.jump\n    ) {\n      meta.lastActiveTick',
  '      mv.jump ||\n      (Number.isFinite(mv.analogWorldX) && Number.isFinite(mv.analogWorldZ) &&\n       Math.hypot(mv.analogWorldX ?? 0,mv.analogWorldZ ?? 0)>1e-4)\n    ) {\n      meta.lastActiveTick'],
 ['vector source',
  ['    if (inp.strafeRight) mx += 1;','','    const wantsMove'].join('\n'),
  ['    if (inp.strafeRight) mx += 1;',
   '    // HIGHFLY: true continuous world-space stick (offline only).',
   '    const useFuryAnalog=Number.isFinite(inp.analogWorldX) &&',
   '      Number.isFinite(inp.analogWorldZ) &&',
   '      Math.hypot(inp.analogWorldX ?? 0,inp.analogWorldZ ?? 0)>1e-4;',
   '    if(useFuryAnalog){',
   '      mx=inp.analogWorldX ?? 0;',
   '      mz=inp.analogWorldZ ?? 0;',
   '    }',
   '',
   '    const wantsMove'].join('\n')],
 ['world-speed conversion',
  ['      if (mz < 0) speed *= BACKPEDAL_MULT;',
   '      if (swimming) speed *= SWIM_SPEED_MULT;',
   '      // world = forward * mz + right * mx, with right = (-cos f, sin f)',
   '      const sin = Math.sin(p.facing),',
   '        cos = Math.cos(p.facing);',
   '      const wx = mz * sin - mx * cos;',
   '      const wz = mz * cos + mx * sin;',
   '      wishX = wx;',
   '      wishZ = wz;',
   '      wishSpeed = speed;'].join('\n'),
  ['      if (mz < 0 && !useFuryAnalog) speed *= BACKPEDAL_MULT;',
   '      if (swimming) speed *= SWIM_SPEED_MULT;',
   '      // Continuous analogue uses world axes; keyboard still uses facing-relative flags.',
   '      const sin = Math.sin(p.facing), cos = Math.cos(p.facing);',
   '      const wx = useFuryAnalog ? mx : mz * sin - mx * cos;',
   '      const wz = useFuryAnalog ? mz : mz * cos + mx * sin;',
   '      wishX = wx;',
   '      wishZ = wz;',
   '      wishSpeed = speed * (useFuryAnalog ? Math.min(1,len) : 1);'].join('\n')]
]);
apply('src/main.ts',[
 ['import',
  "import { takeEditorPlaytestRequest } from './game/editor_playtest';",
  "import { takeEditorPlaytestRequest } from './game/editor_playtest';\n"+
  "import { furyStickWorld } from './game/highfly_fury_core';"],
 ['camera stays independent',
  ['  function updateCamera(frameDt: number, interpFacing: number): void {','    const mi = input.readMoveInput();'].join('\n'),
  ['  function updateCamera(frameDt: number, interpFacing: number): void {',
   '    // FURY: right camera remains free while the left stick moves the avatar.',
   '    if(offlineSim && input.highflyFuryStickVector()){',
   '      lastInterpFacing=interpFacing;',
   '      return;',
   '    }',
   '    const mi = input.readMoveInput();'].join('\n')],
 ['read raw analog',
  ['    let facing: number | null = mouselook ? input.camYaw : null;','    if (input.clickMoveTarget) {'].join('\n'),
  ['    let facing: number | null = mouselook ? input.camYaw : null;',
   '    // Offline only: do not alter 0.20 multiplayer movement serialization.',
   '    const furyRaw=offlineSim && !movementFrozen() ? input.highflyFuryStickVector() : null;',
   '    const fury=furyRaw ? furyStickWorld(furyRaw.x,furyRaw.y,input.camYaw) : null;',
   '    if(fury && input.clickMoveTarget) input.clearClickMove();',
   '    if (input.clickMoveTarget) {'].join('\n')],
 ['apply world analog',
  ['    return { mi, facing };','  }','','  function partyMemberIds():'].join('\n'),
  ['    if(fury){',
   '      mi.analogWorldX=fury.worldX;',
   '      mi.analogWorldZ=fury.worldZ;',
   '      facing=fury.facing;',
   '    }',
   '    return { mi, facing };',
   '  }',
   '',
   '  function partyMemberIds():'].join('\n')]
]);
copyFileSync(fileURLToPath(new URL('./fury_core.ts',import.meta.url)),to);
console.log('FURY P4A continuous analog and independent camera connected to real Sim.');
