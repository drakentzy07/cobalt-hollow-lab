from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

types_path = Path("src/sim/types.ts")
motion_path = Path("src/sim/player_motion.ts")
main_path = Path("src/main.ts")

# Keep this optional so keyboard/gamepad/online clients remain byte-for-byte on
# the original boolean MoveInput path. Only HIGHFLY touch movement supplies it.
move_fields = """  jump: boolean;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
"""
move_fields_new = """  jump: boolean;
  /** HIGHFLY local/mobile extension: camera-relative WORLD movement vector.
   * Optional so every original ClaudeCraft input path remains unchanged. */
  highflyWorldX?: number;
  highflyWorldZ?: number;
  /** 0..1 radial joystick magnitude after dead-zone remapping. */
  highflyAnalog?: number;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
"""
replace_once(types_path, move_fields, move_fields_new, "MoveInput analog fields")

# Replace the temporary "rotate then pretend forward" bridge added by RUN0.5.
resolve_old = """    // HIGHFLY RUN0.5 mobile locomotion: preserve the full left-stick direction
    // and turn the body toward that camera-relative bearing. Camera touch stays
    // independent; movement is expressed as forward along the computed facing,
    // so ClaudeCraft's physics/combat kernel remains the movement authority.
    const highflyMove = input.highflyTouchVector();
    if (!input.suspendMovement && Math.hypot(highflyMove.x, highflyMove.y) > 0.001) {
      const localForward = -highflyMove.y;
      const localRight = -highflyMove.x;
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
resolve_new = """    // HIGHFLY RUN0.5 analog locomotion. The left stick becomes a continuous
    // CAMERA-relative world vector; translation no longer depends on snapping
    // body-facing first. This fixes diagonal quadrant flips and the hard 180°
    // feel when dragging through the lower half of the joystick.
    const highflyMove = input.highflyTouchVector();
    const highflyMagnitude = Math.min(1, Math.hypot(highflyMove.x, highflyMove.y));
    if (!input.suspendMovement && highflyMagnitude > 0.001) {
      const localForward = -highflyMove.y;
      // Exact Lucid rule: desired = cameraFlatForward * stickY
      //                  + cameraFlatRight * stickX.
      // ClaudeCraft's camera-flat-right basis is (-cos(yaw), sin(yaw)),
      // therefore screen-stick X stays POSITIVE here.
      const localRight = highflyMove.x;
      const sin = Math.sin(input.camYaw);
      const cos = Math.cos(input.camYaw);
      const worldX = localForward * sin - localRight * cos;
      const worldZ = localForward * cos + localRight * sin;
      mi.highflyWorldX = worldX;
      mi.highflyWorldZ = worldZ;
      mi.highflyAnalog = highflyMagnitude;

      // HIGHFLY/Lucid action rule: joystick direction IS body-forward.
      // No strafing and no backpedal: left/right/back/diagonals rotate the whole
      // avatar so its chest faces the same world vector it is travelling along.
      const desired = Math.atan2(worldX, worldZ);
      facing = desired;

      // Keep ClaudeCraft's movement/cast gates alive, but the movement kernel
      // below ignores these directional booleans whenever highflyWorld* exists.
      mi.forward = true;
      mi.back = false;
      mi.turnLeft = false;
      mi.turnRight = false;
      mi.strafeLeft = false;
      mi.strafeRight = false;
    }
"""
replace_once(main_path, resolve_old, resolve_new, "main true analog locomotion")

motion_old = """    const len = Math.hypot(mx, mz);
    mx /= len;
    mz /= len;
    let speed = RUN_SPEED * deps.moveSpeedMult(p);
    if (mz < 0) speed *= BACKPEDAL_MULT;
    if (swimming) speed *= swimSpeedMult(p.swimStroke, submerged);
    // Shallow water pushes back. Reuses the waterline this tick already
    // sampled, and is inert both on dry ground (no water level there) and while
    // swimming (the stroke multiplier above owns that speed).
    else if (p.onGround) speed *= wadeSpeedMult(swimLevel - p.pos.y);
    // world = forward * mz + right * mx, with right = (-cos f, sin f)
    const sin = Math.sin(p.facing),
      cos = Math.cos(p.facing);
    const wx = mz * sin - mx * cos;
    const wz = mz * cos + mx * sin;
    wishX = wx;
    wishZ = wz;
    wishSpeed = speed;
"""
motion_new = """    const highflyWorldX = inp.highflyWorldX;
    const highflyWorldZ = inp.highflyWorldZ;
    const highflyLen =
      typeof highflyWorldX === 'number' &&
      typeof highflyWorldZ === 'number' &&
      Number.isFinite(highflyWorldX) &&
      Number.isFinite(highflyWorldZ)
        ? Math.hypot(highflyWorldX, highflyWorldZ)
        : 0;

    if (highflyLen > 1e-6) {
      // HIGHFLY action-style movement: the joystick already supplied a
      // camera-relative WORLD vector. Preserve its radial magnitude instead of
      // collapsing every non-zero drag to full-speed WASD, and do not apply the
      // classic MMO backpedal penalty to the lower half of the stick.
      wishX = highflyWorldX! / highflyLen;
      wishZ = highflyWorldZ! / highflyLen;
      const analog =
        typeof inp.highflyAnalog === 'number' && Number.isFinite(inp.highflyAnalog)
          ? Math.max(0, Math.min(1, inp.highflyAnalog))
          : Math.max(0, Math.min(1, highflyLen));
      let speed = RUN_SPEED * deps.moveSpeedMult(p) * analog;
      if (swimming) speed *= swimSpeedMult(p.swimStroke, submerged);
      else if (p.onGround) speed *= wadeSpeedMult(swimLevel - p.pos.y);
      wishSpeed = speed;
    } else {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;
      let speed = RUN_SPEED * deps.moveSpeedMult(p);
      if (mz < 0) speed *= BACKPEDAL_MULT;
      if (swimming) speed *= swimSpeedMult(p.swimStroke, submerged);
      // Shallow water pushes back. Reuses the waterline this tick already
      // sampled, and is inert both on dry ground (no water level there) and while
      // swimming (the stroke multiplier above owns that speed).
      else if (p.onGround) speed *= wadeSpeedMult(swimLevel - p.pos.y);
      // world = forward * mz + right * mx, with right = (-cos f, sin f)
      const sin = Math.sin(p.facing),
        cos = Math.cos(p.facing);
      const wx = mz * sin - mx * cos;
      const wz = mz * cos + mx * sin;
      wishX = wx;
      wishZ = wz;
      wishSpeed = speed;
    }
"""
replace_once(motion_path, motion_old, motion_new, "movement kernel analog branch")

print("HIGHFLY_ANALOG_LOCOMOTION_APPLIED=1")
