#!/usr/bin/env python3
"""C3: only visual 3D somersault from F263; no new physics / no media mutations."""
from pathlib import Path
import shutil,subprocess
def swap(file,old,new,label):
  p=Path(file);txt=p.read_text(encoding='utf8')
  if txt.count(old)!=1:raise SystemExit(f'REBORN_C3_VISUAL_ANCHOR_DRIFT {label}: '+str(txt.count(old)))
  p.write_text(txt.replace(old,new),encoding='utf8')

out=Path('src/highfly/anim/flip_pose.ts')
out.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile('../tools/reborn/c3_flip_pose.ts',out)
swap('src/render/characters/anim_state.ts',
 '  airborne: boolean;',
 """  airborne: boolean;
  /** HIGHFLY only: one presentation-only somersault initiated on second physical jump. */
  highflyAirFlip?: boolean;
  highflyFlipDir?: 'forward' | 'back' | 'left' | 'right';""",'animation interface')
swap('src/render/renderer.ts',
 '      st.airborne = airborne && !riderMounted;',
 """      st.airborne = airborne && !riderMounted;
      // Only own local Hunter gets the pure presentation cue.
      // Sim alone owns y/x/z movement; no network or render position writes.
      st.highflyAirFlip = e.id === this.sim.player.id && st.airborne &&
        e.highflyAirJumpUsed === true;
      st.highflyFlipDir = e.highflyFlipDir;""",'renderer state')

visual='src/render/characters/visual.ts'
p=Path(visual)
text=p.read_text()
if 'directionalSomersault' in text: raise SystemExit('C3_ALREADY_PATCHED')
p.write_text("import {SOMERSAULT_SECONDS, directionalSomersault} from '../../highfly/anim/flip_pose';\n"+text)
swap(visual,'  private model: THREE.Object3D;',
 """  private rebornWasFlipping = false;
  private rebornFlipElapsed = SOMERSAULT_SECONDS;
  private model: THREE.Object3D;""",'visual state')
swap(visual,
 '  update(dt: number, s: AnimState, animate: boolean, reducedMotion = false): void {',
 """  update(dt: number, s: AnimState, animate: boolean, reducedMotion = false): void {
    // Edge from real second-jump impulse, no teleport/extra velocity.
    const rebornFlipping = s.highflyAirFlip === true && s.airborne && !s.dead;
    if (rebornFlipping && !this.rebornWasFlipping) this.rebornFlipElapsed = 0;
    this.rebornWasFlipping = rebornFlipping;
    if (!rebornFlipping) this.rebornFlipElapsed = SOMERSAULT_SECONDS;
    else this.rebornFlipElapsed = Math.min(SOMERSAULT_SECONDS, this.rebornFlipElapsed + dt);""",
 'visual tick')
swap(visual,
 """    this.poseWrap.rotation.x =
      (proneAngle + swimPitch) * this.swimBlend + this.lean + CLIMB_BODY_PITCH * climb * climbLevel;
    this.poseWrap.rotation.z = 0;""",
 """    const rebornPose = directionalSomersault(
      this.rebornFlipElapsed, s.highflyFlipDir ?? 'back', reducedMotion || s.dead);
    this.poseWrap.rotation.x =
      (proneAngle + swimPitch) * this.swimBlend + this.lean + CLIMB_BODY_PITCH * climb * climbLevel +
      rebornPose.pitch;
    this.poseWrap.rotation.z = rebornPose.roll;""",
 'visual pose rotation')
# Strict: no GLB, textures, original artwork, or audio changed.
changes=subprocess.check_output(['git','status','--porcelain','--untracked-files=no','--','public'],text=True).strip()
if changes: raise SystemExit('REBORN_C3_PUBLIC_ASSETS_CHANGED '+changes)
print('HIGHFLY_REBORN_C3_F263_DIRECTIONAL_3D_POSE_WIRED=PASS')
print('HIGHFLY_REBORN_C3_SIM_PHYSICS_UNTOUCHED_BY_VISUAL=PASS')
print('HIGHFLY_REBORN_C3_REAL_S23_VISUAL_QA=PENDING')
