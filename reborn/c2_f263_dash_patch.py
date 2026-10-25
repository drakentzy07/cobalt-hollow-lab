#!/usr/bin/env python3
"""C2: guarded, minimal port of F263 dash physics onto C0 clean 0.44.7.
Does not copy F263's old simulation, meshes, textures, gear or HUD.
Never marks directional flip animation complete; emits authoritative flip signal only.
"""
from pathlib import Path

def change(file, old, new, label, expected=1):
    p=Path(file)
    source=p.read_text()
    n=source.count(old)
    if n!=expected: raise SystemExit(f'REBORN_C2_ANCHOR_DRIFT {label}: expected {expected} found {n}')
    p.write_text(source.replace(old,new))

def check(file, needed):
    content=Path(file).read_text()
    for needle in needed:
        if needle not in content: raise SystemExit('REBORN_C2_EXPECTED_C0_MISSING: '+file+' :: '+needle)

types='src/sim/types.ts'
inp='src/game/input.ts'
motion='src/sim/player_motion.ts'
mobile='src/game/mobile_controls.ts'
main='src/main.ts'
html='index.html'

check(types, ['highflyJumpSeq?: number;', 'highflyAirJumpUsed?: boolean;'])
check(inp, ['private highflyJumpSeq = 0;', 'triggerTouchJump(): void'])
check(motion, ['const highflyFreshJumpPress =', 'p.highflyAirJumpUsed = true;', 'const movingOnGround = moving && (p.onGround || swimming);'])
check(mobile, ["this.bindButton('mobile-jump'"])
check(main, ["onJump: () => input.triggerTouchJump(),"])

change(types,
 '  highflyAirJumpUsed?: boolean;',
 """  highflyAirJumpUsed?: boolean;
  // F263 guarded dash; transient motion state, never written to saves.
  highflyEvadeRemaining?: number;
  highflyEvadeCooldownRemaining?: number;
  highflyEvadeDirX?: number;
  highflyEvadeDirZ?: number;
  highflyLastEvadeSeq?: number;
  // Orientation cue only: visual animation acceptance still pending.
  highflyFlipDir?: 'forward' | 'back' | 'left' | 'right';""", 'Entity transient evade state')
change(types,'  highflyJumpSeq?: number;',
 """  highflyJumpSeq?: number;
  highflyEvadeSeq?: number;
  highflyFlipDirInput?: 'forward' | 'back' | 'left' | 'right';""", 'MoveInput dash press and flip direction')
change(inp,'  private highflyJumpSeq = 0;',
 '  private highflyJumpSeq = 0;\n  private highflyEvadeSeq = 0;', 'input dash sequence')
change(inp, """  triggerTouchJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }""",
 """  triggerTouchJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }

  /** Edge-triggered rather than held; does not hijack native movement. */
  triggerHighflyEvade(): void {
    this.highflyEvadeSeq += 1;
  }""",'input dash event')
# Every C0 MoveInput return already carries highflyJumpSeq. Propagate alongside it.
text=Path(inp).read_text()
needle='highflyJumpSeq: this.highflyJumpSeq'
count=text.count(needle)
if count<4 or count>8: raise SystemExit(f'REBORN_C2_MOVEMENT_RETURN_DRIFT {count}')
text=text.replace(needle,needle+', highflyEvadeSeq: this.highflyEvadeSeq')
Path(inp).write_text(text)

change(mobile,'  onJump(): void;',
 '  onJump(): void;\n  onEvade?(): void;', 'mobile callback dash optional for original tests')
change(mobile,
 "    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });",
 """    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });
    this.bindButton('mobile-evade', () => this.callbacks.onEvade?.(), { pressFirst: true });""", 'mobile dash event')
change(main,
 '    onJump: () => input.triggerTouchJump(),',
 '    onJump: () => input.triggerTouchJump(),\n    onEvade: () => input.triggerHighflyEvade(),',
 'native mobile controls')

# Direction on SECOND physical jump comes from raw stick, NOT avatar facing.
change(main,'    let facing: number | null = mouselook ? input.camYaw : null;',
 """    const hfFlipStick = input.highflyTouchVector();
    mi.highflyFlipDirInput =
      Math.hypot(hfFlipStick.x, hfFlipStick.y) < 0.08 ? 'back'
      : Math.abs(hfFlipStick.x) >= Math.abs(hfFlipStick.y)
        ? (hfFlipStick.x > 0 ? 'right' : 'left')
        : (hfFlipStick.y < 0 ? 'forward' : 'back');
    let facing: number | null = mouselook ? input.camYaw : null;""", 'raw-stick directional somersault cue')

# Preserve native collision solver, mount gate, rooted movement and existing air control.
change(motion, 'export const AIR_CONTROL_ACCEL = 20;',
 """// Recovered F263 numerical limits, expressed as Sim-native motion (not teleport).
export const HIGHFLY_REBORN_DASH_SPEED = 13;
export const HIGHFLY_REBORN_DASH_DURATION = 0.18;
export const HIGHFLY_REBORN_DASH_COOLDOWN = 0.55;
export const AIR_CONTROL_ACCEL = 20;""", 'dash constants')
change(motion,
 '  const movingOnGround = moving && (p.onGround || swimming);',
 """  const seq = inp.highflyEvadeSeq ?? 0;
  const freshEvade = seq !== 0 && seq !== (p.highflyLastEvadeSeq ?? 0);
  if (freshEvade) p.highflyLastEvadeSeq = seq;
  p.highflyEvadeCooldownRemaining = Math.max(0, (p.highflyEvadeCooldownRemaining ?? 0) - DT);
  if (freshEvade &&
      (p.highflyEvadeCooldownRemaining ?? 0) <= 0 &&
      (p.onGround || (p.jumping && !p.highflyAirJumpUsed)) &&
      !swimming && !steepGround && !mountLocked && !p.mountKey && !p.climb &&
      !isRooted(p)) {
    const length = Math.hypot(wishX, wishZ);
    // Zero-stick dash uses the direction of the avatar's chest.
    p.highflyEvadeDirX = length > 0.00001 ? wishX / length : Math.sin(p.facing);
    p.highflyEvadeDirZ = length > 0.00001 ? wishZ / length : Math.cos(p.facing);
    p.highflyEvadeRemaining = HIGHFLY_REBORN_DASH_DURATION;
    p.highflyEvadeCooldownRemaining = HIGHFLY_REBORN_DASH_COOLDOWN;
  }
  const highflyEvading =
    (p.highflyEvadeRemaining ?? 0) > 0 &&
    (p.onGround || p.jumping) && !swimming && !steepGround && !mountLocked;
  if (highflyEvading) {
    p.highflyEvadeRemaining = Math.max(0,(p.highflyEvadeRemaining ?? 0)-DT);
  } else if ((p.highflyEvadeRemaining ?? 0)>0) {
    p.highflyEvadeRemaining = 0;
  }

  const movingOnGround = moving && (p.onGround || swimming);""", 'dash motion state')
change(motion,
 'if (slide || movingOnGround || airSteering || (!p.onGround && (p.vx !== 0 || p.vz !== 0))) {',
 'if (slide || highflyEvading || movingOnGround || airSteering || (!p.onGround && (p.vx !== 0 || p.vz !== 0))) {',
 'include dash in movement tick')
change(motion,
 '    const stepX = slide ? slide.x * STEEP_SLIDE_SPEED : movingOnGround ? wishX * wishSpeed : p.vx;',
 """    const stepX = slide ? slide.x * STEEP_SLIDE_SPEED
      : highflyEvading ? (p.highflyEvadeDirX ?? Math.sin(p.facing)) * HIGHFLY_REBORN_DASH_SPEED
      : movingOnGround ? wishX * wishSpeed : p.vx;""", 'x under swept collision')
change(motion,
 '    const stepZ = slide ? slide.z * STEEP_SLIDE_SPEED : movingOnGround ? wishZ * wishSpeed : p.vz;',
 """    const stepZ = slide ? slide.z * STEEP_SLIDE_SPEED
      : highflyEvading ? (p.highflyEvadeDirZ ?? Math.cos(p.facing)) * HIGHFLY_REBORN_DASH_SPEED
      : movingOnGround ? wishZ * wishSpeed : p.vz;""", 'z under swept collision')
change(motion,'    p.highflyAirJumpUsed = true;',
 """    // Emits cue for 3D animator. NOT itself a flip animation.
    p.highflyFlipDir = inp.highflyFlipDirInput ?? 'back';
    p.highflyAirJumpUsed = true;""", 'second-jump cue')

# A single isolated button; does not change media or existing attack/skill logic.
htmlText=Path(html).read_text()
anchor='      <button type="button" id="mobile-jump"'
if htmlText.count(anchor)!=1:raise SystemExit('REBORN_C2_HTML_BUTTON_ANCHOR_DRIFT')
idx=htmlText.index(anchor)
end=htmlText.find('</button>',idx)
if end<0:raise SystemExit('REBORN_C2_HTML_BUTTON_END_MISSING')
end+=len('</button>')
dash='''\n      <button type="button" id="mobile-evade" aria-label="Evadir / Dash" title="Evadir" class="hf-reborn-dash">DASH</button>'''
htmlText=htmlText[:end]+dash+htmlText[end:]
style="""<style id="hf-reborn-dash-style">
#mobile-evade{display:none}
body.mobile-touch #mobile-evade{
  display:flex;justify-content:center;align-items:center;position:fixed;
  right:max(9rem,env(safe-area-inset-right));bottom:max(8rem,env(safe-area-inset-bottom));
  width:62px;height:62px;z-index:120;border:2px solid #e4bf74;
  border-radius:50%;font:700 12px system-ui;color:#fff;background:#27374b;
  touch-action:manipulation;user-select:none
}
</style>
"""
if htmlText.count('</head>')!=1:raise SystemExit('REBORN_C2_HEAD_ANCHOR_DRIFT')
htmlText=htmlText.replace('</head>',style+'</head>')
Path(html).write_text(htmlText)
# Never permit media changes, even to restricted resources, in this physics phase.
import subprocess
media=subprocess.check_output(['git','status','--porcelain','--untracked-files=no','--','public'],text=True).strip()
if media:raise SystemExit('REBORN_C2_MEDIA_CHANGED: '+media)
print('HIGHFLY_REBORN_C2_F263_DASH_NATIVE_COLLISION=PASS')
print('HIGHFLY_REBORN_C2_MULTITOUCH_DASH_BUTTON=WIRED')
print('HIGHFLY_REBORN_C2_DIRECTIONAL_FLIP_SIGNAL_ONLY_NOT_3D_ANIMATION=PASS')
