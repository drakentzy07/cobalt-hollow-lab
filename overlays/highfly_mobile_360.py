from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

input_path = Path("src/game/input.ts")
mobile_path = Path("src/game/mobile_controls.ts")
main_path = Path("src/main.ts")

touch_state = """  private touchMove: TouchMoveInput = {
    forward: false,
    back: false,
    strafeLeft: false,
    strafeRight: false,
  };
"""
touch_state_new = touch_state + """  // HIGHFLY RUN0.5: continuous left-stick vector. ClaudeCraft's original
  // TouchMoveInput flags stay intact for compatibility, but this preserves the
  // full 360-degree direction so the action-style mobile layer can face/move
  // relative to the camera instead of collapsing the stick into WASD sectors.
  private highflyTouchVectorState = { x: 0, y: 0 };
"""
replace_once(input_path, touch_state, touch_state_new, "input touch state")

clear_touch = """  clearTouchMove(): void {
    const changed =
      this.touchMove.forward ||
      this.touchMove.back ||
      this.touchMove.strafeLeft ||
      this.touchMove.strafeRight;
    this.touchMove = { forward: false, back: false, strafeLeft: false, strafeRight: false };
    if (changed) this.noteIntent('move');
  }
"""
clear_touch_new = clear_touch + """
  setHighflyTouchVector(v: { x: number; y: number }): void {
    const x = Number.isFinite(v.x) ? Math.max(-1, Math.min(1, v.x)) : 0;
    const y = Number.isFinite(v.y) ? Math.max(-1, Math.min(1, v.y)) : 0;
    this.highflyTouchVectorState = { x, y };
  }

  clearHighflyTouchVector(): void {
    this.highflyTouchVectorState = { x: 0, y: 0 };
  }

  highflyTouchVector(): { x: number; y: number } {
    return { ...this.highflyTouchVectorState };
  }

  /**
   * HIGHFLY mobile rule: touch camera is free orbit and never steers the body.
   * Target/camera lock remains the one exception and keeps ClaudeCraft's own
   * locked-camera behaviour.
   */
  isHighflyMobileCameraDecoupled(): boolean {
    return (
      typeof document !== 'undefined' &&
      document.body.classList.contains('mobile-touch') &&
      this.cb.isCameraLocked?.() !== true
    );
  }
"""
replace_once(input_path, clear_touch, clear_touch_new, "input highfly vector methods")

map_fn = """export function mapJoystickVector(x: number, y: number, deadzone = DEADZONE): TouchMoveInput {
  const mag = Math.hypot(x, y);
  if (mag < deadzone) return { forward: false, back: false, strafeLeft: false, strafeRight: false };
  const axis = deadzone * 0.85;
  return {
    forward: y < -axis,
    back: y > axis,
    strafeLeft: x < -axis,
    strafeRight: x > axis,
  };
}
"""
map_fn_new = map_fn + """
export function mapHighflyJoystickVector(
  x: number,
  y: number,
  deadzone = DEADZONE,
): { x: number; y: number } {
  const mag = Math.hypot(x, y);
  if (!Number.isFinite(mag) || mag <= deadzone) return { x: 0, y: 0 };
  const clamped = Math.min(1, mag);
  const radial = (clamped - deadzone) / Math.max(1e-6, 1 - deadzone);
  return {
    x: (x / mag) * radial,
    y: (y / mag) * radial,
  };
}
"""
replace_once(mobile_path, map_fn, map_fn_new, "mobile analog mapper")

move_line = """    const move = mapJoystickVector(x, y, this.moveDeadzone);
    const inAutorunTarget = isMoveAutorunPush(rawY);
"""
move_line_new = """    const move = mapJoystickVector(x, y, this.moveDeadzone);
    const highflyMove = mapHighflyJoystickVector(x, y, this.moveDeadzone);
    const inAutorunTarget = isMoveAutorunPush(rawY);
"""
replace_once(mobile_path, move_line, move_line_new, "mobile move vector capture")

autorun1 = """    if (this.moveAutorunLocked && inAutorunTarget) {
      this.input.clearTouchMove();
      this.input.setAutorun(true);
"""
autorun1_new = """    if (this.moveAutorunLocked && inAutorunTarget) {
      this.input.clearTouchMove();
      this.input.clearHighflyTouchVector();
      this.input.setAutorun(true);
"""
replace_once(mobile_path, autorun1, autorun1_new, "mobile autorun locked clear")

autorun2 = """    if (inAutorunTarget) {
      this.moveAutorunLocked = true;
      this.input.clearTouchMove();
      this.input.setAutorun(true);
"""
autorun2_new = """    if (inAutorunTarget) {
      this.moveAutorunLocked = true;
      this.input.clearTouchMove();
      this.input.clearHighflyTouchVector();
      this.input.setAutorun(true);
"""
replace_once(mobile_path, autorun2, autorun2_new, "mobile autorun engage clear")

set_move = """    this.input.setTouchMove(move);
    const moving = move.forward || move.back || move.strafeLeft || move.strafeRight;
"""
set_move_new = """    this.input.setHighflyTouchVector(highflyMove);
    this.input.setTouchMove(move);
    const moving = move.forward || move.back || move.strafeLeft || move.strafeRight;
"""
replace_once(mobile_path, set_move, set_move_new, "mobile set analog vector")

release_move = """    this.input.clearTouchMove();
    if (this.moveStick) this.moveStick.style.transform = '';
"""
release_move_new = """    this.input.clearTouchMove();
    this.input.clearHighflyTouchVector();
    if (this.moveStick) this.moveStick.style.transform = '';
"""
replace_once(mobile_path, release_move, release_move_new, "mobile release analog vector")

swipe = """    const groundAimOwnsPointer = this.callbacks.onGroundAimMove(e.clientX, e.clientY);
    this.touchOwners.set(e.pointerId, groundAimOwnsPointer ? 'groundAim' : 'camera');
"""
swipe_new = """    const groundAimOwnsPointer = this.callbacks.onGroundAimMove(e.clientX, e.clientY);
    // HIGHFLY golden routing: ordinary camera drag belongs to the right side.
    // Ground-aim keeps the whole canvas so ClaudeCraft abilities are untouched.
    const canvasRect = this.canvas?.getBoundingClientRect();
    const rightCameraStart =
      (canvasRect?.left ?? 0) + (canvasRect?.width ?? window.innerWidth) * 0.46;
    if (!groundAimOwnsPointer && e.clientX < rightCameraStart) return;
    this.touchOwners.set(e.pointerId, groundAimOwnsPointer ? 'groundAim' : 'camera');
"""
replace_once(mobile_path, swipe, swipe_new, "mobile right-side camera gate")

resolve_head = """    const mi = input.readMoveInput();
    let facing: number | null = mouselook ? input.camYaw : null;
"""
resolve_head_new = """    const mi = input.readMoveInput();
    let facing: number | null = mouselook ? input.camYaw : null;
    // HIGHFLY RUN0.5 mobile locomotion: preserve the full left-stick direction
    // and turn the body toward that camera-relative bearing. Camera touch stays
    // independent; movement is expressed as forward along the computed facing,
    // so ClaudeCraft's physics/combat kernel remains the movement authority.
    const highflyMove = input.highflyTouchVector();
    if (!input.suspendMovement && Math.hypot(highflyMove.x, highflyMove.y) > 0.001) {
      const localForward = -highflyMove.y;
      const localRight = highflyMove.x;
      const desired = input.camYaw + Math.atan2(localRight, localForward);
      facing = Math.atan2(Math.sin(desired), Math.cos(desired));
      mi.forward = true;
      mi.back = false;
      mi.turnLeft = false;
      mi.turnRight = false;
      mi.strafeLeft = false;
      mi.strafeRight = false;
    }
"""
replace_once(main_path, resolve_head, resolve_head_new, "main 360 resolve")

mouselook_line = """    const mouselook = intro === null && input.isMouselookActive() && !movementFrozen();
    const controllerFacing = input.controllerFacingOverride();
"""
mouselook_new = """    const highflyMobileCamera = input.isHighflyMobileCameraDecoupled();
    const mouselook =
      intro === null &&
      input.isMouselookActive() &&
      !movementFrozen() &&
      !highflyMobileCamera;
    const controllerFacing = input.controllerFacingOverride();
"""
replace_once(main_path, mouselook_line, mouselook_new, "main decoupled body mouselook")

camera_driven = """      input.isMouseCameraMode(),
      cameraMoveActive(),
      input.isMouselookActive(),
      movementFrozen(),
"""
camera_driven_new = """      input.isMouseCameraMode(),
      cameraMoveActive(),
      input.isMouselookActive() && !highflyMobileCamera,
      movementFrozen(),
"""
replace_once(main_path, camera_driven, camera_driven_new, "main release-facing decouple")

print("HIGHFLY_MOBILE_360_APPLIED=1")
