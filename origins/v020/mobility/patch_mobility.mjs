#!/usr/bin/env node
/** HIGHFLY P4B1 overlay on top of ALREADY-PATCHED P2+P3+P4A code.
 * Safely rejects changed anchors. Touch controls only; original world intact.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||'upstream');
function edit(file,parts){
 const full=path.join(root,file);let source=fs.readFileSync(full,'utf8');
 for(const [name,before,after] of parts){
  const at=source.indexOf(before);
  if(at<0||source.indexOf(before,at+before.length)>=0)throw Error(`[FURY P4B] Cannot safely patch ${file}: ${name}`);
  source=source.slice(0,at)+after+source.slice(at+before.length);
 }
 fs.writeFileSync(full,source);
}
const classPath=path.join(root,'src/game/highfly_fury_mobility.ts');
if(fs.existsSync(classPath))throw Error('Already applied P4B');
const from=fileURLToPath(new URL('./fury_mobility.ts',import.meta.url));
edit('src/sim/types.ts',[[
 'FURY input fields',
 '  analogWorldZ?: number;\n}',
 '  analogWorldZ?: number;\n  /** HIGHFLY FURY P4B discrete action sequences for quick double taps. */\n  furyJumpSeq?: number;\n  furyDashSeq?: number;\n}'
]]);
edit('src/game/input.ts',[
 ['action state','  private highflyFuryStick = { x: 0, y: 0 };',
  '  private highflyFuryStick = { x: 0, y: 0 };\n  private highflyJumpSeq = 0;\n  private highflyDashSeq = 0;'],
 ['record jump press','  triggerTouchJump(): void {\n    this.touchJumpUntil',
  '  triggerTouchJump(): void {\n    this.highflyJumpSeq++;\n    this.touchJumpUntil'],
 ['dash method','  // Touch-reachable autorun toggle',
 `  /** FURY P4B: a fresh action ID rather than a long dash key latch. */
  triggerHighflyDash(): void { this.highflyDashSeq++; }
  highflyJumpActionSequence(): number { return this.highflyJumpSeq; }
  highflyDashActionSequence(): number { return this.highflyDashSeq; }

  // Touch-reachable autorun toggle`]
]);
edit('src/main.ts',[
 ['pass action IDs',
  '    if(fury){\n      mi.analogWorldX=fury.worldX;',
  `    if(offlineSim){
      mi.furyJumpSeq=input.highflyJumpActionSequence();
      mi.furyDashSeq=input.highflyDashActionSequence();
    }
    if(fury){
      mi.analogWorldX=fury.worldX;`],
 ['wire dash control',
  '  mobileControls.start();',
  `  mobileControls.start();
  // HIGHFLY P4B: independent touch DASH; does not change legacy controls.
  const highflyDashButton=document.getElementById('mobile-dash');
  highflyDashButton?.addEventListener('pointerdown',(ev)=>{
    if(!offlineSim) return;
    ev.preventDefault();
    input.triggerHighflyDash();
  });`]
]);
edit('play.html', [[
 'dash button DOM',
 '      <button class="mobile-btn" id="mobile-target"',
 '      <button class="mobile-btn" id="mobile-dash" type="button" title="Dash" aria-label="Dash" data-icon="dash"><span class="mobile-label">Dash</span></button>\n      <button class="mobile-btn" id="mobile-target"'
]]);
// CSS is conditional; no UI leak into desktop/home.
const css=path.join(root,'src/styles/hud.mobile.css');
fs.appendFileSync(css, '\n/* HIGHFLY P4B mobile dash — controls stay inside the landscape HUD */\nbody.mobile-touch.game-active #mobile-dash { touch-action: none; min-width: 48px; min-height: 46px; border-color: rgba(68,216,244,.55); }\n');
const sim=path.join(root,'src/sim/sim.ts');
let source=fs.readFileSync(sim,'utf8');
source=`import { FuryMobility } from '../game/highfly_fury_mobility';\nconst highflyMobility = new FuryMobility();\n`+source;
function replaceSim(label,before,after){const at=source.indexOf(before);if(at<0||source.indexOf(before,at+before.length)>=0)throw Error(`[FURY P4B] sim anchor missing/duplicate: ${label}`);source=source.slice(0,at)+after+source.slice(at+before.length);}
replaceSim('mobility step','    const inp = meta.moveInput;\n    // Convention:',
`    const inp = meta.moveInput;
    const highfly=highflyMobility.update(p,inp,DT,isRooted(p)||isStunned(p));
    if(highfly.doubleJump){
      p.vy=JUMP_VELOCITY*0.85*this.jumpMult(p);
      p.jumping=true;
      // No second fall damage grace reset: retain original fall start.
    }
    // Convention:`);
replaceSim('dash vector',
 `    if(useFuryAnalog){
      mx=inp.analogWorldX ?? 0;
      mz=inp.analogWorldZ ?? 0;
    }`,
 `    if(useFuryAnalog){
      mx=inp.analogWorldX ?? 0;
      mz=inp.analogWorldZ ?? 0;
    }
    // Dash uses a direction snapshot at activation, independent of camera motion.
    const highflyDashActive=highfly.dash!==null;
    if(highfly.dash){mx=highfly.dash.x;mz=highfly.dash.z;}`);
replaceSim('dash speed','      const wx = useFuryAnalog ? mx : mz * sin - mx * cos;\n      const wz = useFuryAnalog ? mz : mz * cos + mx * sin;',
 '      const wx = (useFuryAnalog || highflyDashActive) ? mx : mz * sin - mx * cos;\n      const wz = (useFuryAnalog || highflyDashActive) ? mz : mz * cos + mx * sin;');
replaceSim('fury speed','      wishSpeed = speed * (useFuryAnalog ? Math.min(1,len) : 1);',
 `      wishSpeed = highfly.dash ? highfly.dash.speed : speed * (useFuryAnalog ? Math.min(1,len) : 1);
      // FURY midair steering, damped. Dash obeys the exact original collision
      // resolution below; it never teleports or bypasses terrain blockers.
      if(!p.onGround){
        const blend=highfly.dash?1:useFuryAnalog?0.22:0;
        p.vx=p.vx*(1-blend)+wishX*wishSpeed*blend;
        p.vz=p.vz*(1-blend)+wishZ*wishSpeed*blend;
      }`);
fs.writeFileSync(sim,source);
fs.copyFileSync(from,classPath);
console.log('[HIGHFLY FURY P4B] dash+double jump integrated via existing gravity, collision and action inputs');
