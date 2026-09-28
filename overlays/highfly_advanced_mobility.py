from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

types = Path("src/sim/types.ts")
input_ts = Path("src/game/input.ts")
motion = Path("src/sim/player_motion.ts")

# MoveInput carries a monotonically increasing edge token. The ordinary jump
# boolean remains untouched for ClaudeCraft's held/latch semantics.
move_old = """  jump: boolean;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
"""
move_new = """  jump: boolean;
  /** HIGHFLY transient press sequence. Increments once per physical/touch jump
   * press, so a latched mobile jump can never masquerade as a second tap. */
  highflyJumpSeq?: number;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
"""
replace_once(types, move_old, move_new, "MoveInput jump sequence")

entity_old = """  // True while airborne from a deliberate jump (not from walking off a ledge).
  // Lets a jump clear fences for the whole arc, independent of slope.
  jumping: boolean;
  fallStartY: number;
"""
entity_new = """  // True while airborne from a deliberate jump (not from walking off a ledge).
  // Lets a jump clear fences for the whole arc, independent of slope.
  jumping: boolean;
  // HIGHFLY traversal state is transient/session-only. Optional keeps every
  // existing wire/save/entity constructor compatible.
  highflyAirJumpUsed?: boolean;
  highflyLastJumpSeq?: number;
  fallStartY: number;
"""
replace_once(types, entity_old, entity_new, "Entity double-jump state")

input_field_old = """  private touchJumpUntil = 0;
  // Swim-down held by an on-screen/controller control (the keyboard path is the
"""
input_field_new = """  private touchJumpUntil = 0;
  // Real jump-press edge token for HIGHFLY double jump. Unlike touchJumpUntil,
  // this advances once per tap and therefore cannot auto-fire a second jump
  // while the first tap remains latched for reliable 20 Hz sampling.
  private highflyJumpSeq = 0;
  // Swim-down held by an on-screen/controller control (the keyboard path is the
"""
replace_once(input_ts, input_field_old, input_field_new, "input jump sequence field")

touch_old = """  triggerTouchJump(): void {
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }
"""
touch_new = """  triggerTouchJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }
"""
replace_once(input_ts, touch_old, touch_new, "touch jump sequence")

gamepad_old = """  triggerGamepadJump(): void {
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }
"""
gamepad_new = """  triggerGamepadJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }
"""
replace_once(input_ts, gamepad_old, gamepad_new, "gamepad jump sequence")

# Keyboard and bindable mouse jump edges use the same sequence.
keyboard_old = """      if (held === 'jump')
        this.keyJumpUntil = Math.max(this.keyJumpUntil, performance.now() + KEY_JUMP_LATCH_MS);
"""
keyboard_new = """      if (held === 'jump') {
        this.highflyJumpSeq += 1;
        this.keyJumpUntil = Math.max(this.keyJumpUntil, performance.now() + KEY_JUMP_LATCH_MS);
      }
"""
# There are two intentional copies: keyboard + bindable mouse.
text = input_ts.read_text(encoding="utf-8")
if text.count(keyboard_old) != 2:
    raise SystemExit(f"jump edge copies: expected 2, found {text.count(keyboard_old)}")
input_ts.write_text(text.replace(keyboard_old, keyboard_new), encoding="utf-8")

# Carry the edge token on all normal local MoveInput return paths.
input_text = input_ts.read_text(encoding="utf-8")
input_text = input_text.replace(
"""        jump: false,
        dive: false,
""",
"""        jump: false,
        highflyJumpSeq: this.highflyJumpSeq,
        dive: false,
""",
1,
)
input_text = input_text.replace(
"""    if (this.controllerMoveInput) return { ...this.controllerMoveInput };
""",
"""    if (this.controllerMoveInput)
      return { ...this.controllerMoveInput, highflyJumpSeq: this.highflyJumpSeq };
""",
1,
)
# Both camera-mode and classic-mode objects contain forward/back/jump/dive.
needle = """        forward,
        back,
        jump,
        dive,
"""
if input_text.count(needle) != 1:
    raise SystemExit(f"mouse-camera MoveInput return: expected 1, found {input_text.count(needle)}")
input_text = input_text.replace(
    needle,
"""        forward,
        back,
        jump,
        highflyJumpSeq: this.highflyJumpSeq,
        dive,
""",
1,
)
needle2 = """      forward,
      back,
      jump,
      dive,
"""
if input_text.count(needle2) != 1:
    raise SystemExit(f"classic MoveInput return: expected 1, found {input_text.count(needle2)}")
input_text = input_text.replace(
    needle2,
"""      forward,
      back,
      jump,
      highflyJumpSeq: this.highflyJumpSeq,
      dive,
""",
1,
)
input_ts.write_text(input_text, encoding="utf-8")

motion_old = """  const coyote =
    !p.onGround &&
    !p.jumping &&
    !swimming &&
    p.vy <= 0 &&
    p.vy > -GRAVITY * COYOTE_TIME &&
    terrainSteepnessAt(p.pos.x, p.pos.z, deps.seed) <= MAX_CLIMB_SLOPE;
  if (inp.jump && (p.onGround || coyote) && !isRooted(p) && !steepGround && !mountLocked) {
    p.vy = JUMP_VELOCITY * jumpMult(p);
    p.vx = wishX * wishSpeed;
    p.vz = wishZ * wishSpeed;
    p.onGround = false;
    p.jumping = true;
    p.fallStartY = p.pos.y;
  }
"""
motion_new = """  const coyote =
    !p.onGround &&
    !p.jumping &&
    !swimming &&
    p.vy <= 0 &&
    p.vy > -GRAVITY * COYOTE_TIME &&
    terrainSteepnessAt(p.pos.x, p.pos.z, deps.seed) <= MAX_CLIMB_SLOPE;

  // HIGHFLY double jump: consume PHYSICAL/TAP edges, never the held/latching
  // jump boolean. A single mobile tap may stay true for 220 ms; only a changed
  // sequence is a new jump request.
  const highflyJumpSeq = inp.highflyJumpSeq ?? 0;
  const highflyFreshJumpPress =
    inp.jump &&
    highflyJumpSeq !== 0 &&
    highflyJumpSeq !== (p.highflyLastJumpSeq ?? 0);
  if (highflyFreshJumpPress) p.highflyLastJumpSeq = highflyJumpSeq;
  if (p.onGround) p.highflyAirJumpUsed = false;

  const startsGroundJump =
    inp.jump && (p.onGround || coyote) && !isRooted(p) && !steepGround && !mountLocked;
  if (startsGroundJump) {
    p.vy = JUMP_VELOCITY * jumpMult(p);
    p.vx = wishX * wishSpeed;
    p.vz = wishZ * wishSpeed;
    p.onGround = false;
    p.jumping = true;
    p.fallStartY = p.pos.y;
  } else if (
    highflyFreshJumpPress &&
    !p.onGround &&
    p.jumping &&
    !p.highflyAirJumpUsed &&
    !isRooted(p) &&
    !mountLocked &&
    !p.mountKey &&
    !p.climb &&
    !p.auras.some((a) => a.id === 'rift_feather_glider')
  ) {
    // One mid-air refresh. Horizontal velocity follows the CURRENT wish vector,
    // so the second tap can redirect naturally with the approved 360 joystick.
    p.vy = JUMP_VELOCITY * jumpMult(p);
    if (wishSpeed > 0) {
      p.vx = wishX * wishSpeed;
      p.vz = wishZ * wishSpeed;
    }
    p.highflyAirJumpUsed = true;
  }
"""
replace_once(motion, motion_old, motion_new, "double jump movement")

# Explicit reset on water landing and solid landing for readability/robustness.
motion_text = motion.read_text(encoding="utf-8")
water_old = """      p.onGround = true;
      p.jumping = false;
      p.fallStartY = p.pos.y;
"""
water_new = """      p.onGround = true;
      p.jumping = false;
      p.highflyAirJumpUsed = false;
      p.fallStartY = p.pos.y;
"""
if motion_text.count(water_old) < 1:
    raise SystemExit("water landing reset anchor missing")
motion_text = motion_text.replace(water_old, water_new, 1)

land_old = """      p.onGround = true;
      p.jumping = false;
      const gLandIdx = p.auras.findIndex((a) => a.id === 'rift_feather_glider');
"""
land_new = """      p.onGround = true;
      p.jumping = false;
      p.highflyAirJumpUsed = false;
      const gLandIdx = p.auras.findIndex((a) => a.id === 'rift_feather_glider');
"""
if land_old not in motion_text:
    raise SystemExit("solid landing reset anchor missing")
motion_text = motion_text.replace(land_old, land_new, 1)
motion.write_text(motion_text, encoding="utf-8")

print("HIGHFLY_DOUBLE_JUMP_APPLIED=1")
