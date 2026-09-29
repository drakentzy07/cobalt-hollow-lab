from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

types = Path("src/sim/types.ts")
inp = Path("src/game/input.ts")
motion = Path("src/sim/player_motion.ts")
mobile = Path("src/game/mobile_controls.ts")
main = Path("src/main.ts")
menu = Path("src/ui/hud/menu/menu_control_controller.ts")
css = Path("src/styles/hud.mobile.css")

# ---------------------------------------------------------------------------
# CAMERA: preserve approved horizontal sign; only undo the bad vertical flip
# introduced by RUN0.8.1. Finger up => view up, finger down => view down.
# ---------------------------------------------------------------------------
replace_once(
    inp,
    """      this.camPitch - this.touchPitchSign * dy * dragSens,
""",
    """      this.camPitch + this.touchPitchSign * dy * dragSens,
""",
    "natural touch vertical drag",
)
replace_once(
    inp,
    """      this.camPitch -
        this.touchPitchSign *
          this.touchLookVector.y *
          TOUCH_LOOK_PITCH_RATE *
          this.touchLookSpeed *
          dt,
""",
    """      this.camPitch +
        this.touchPitchSign *
          this.touchLookVector.y *
          TOUCH_LOOK_PITCH_RATE *
          this.touchLookSpeed *
          dt,
""",
    "natural touch vertical look stick",
)

# ---------------------------------------------------------------------------
# EVADE: locomotion edge, not a skill/passive/hotbar slot.
# ---------------------------------------------------------------------------
replace_once(
    types,
    """  highflyJumpSeq?: number;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
""",
    """  highflyJumpSeq?: number;
  /** HIGHFLY evade edge token. This is locomotion, never a hotbar ability. */
  highflyEvadeSeq?: number;
  /** Swim DOWN. Only ever read while swimming, where it is the mirror of
""",
    "MoveInput evade sequence",
)

replace_once(
    types,
    """  highflyAirJumpUsed?: boolean;
  highflyLastJumpSeq?: number;
  fallStartY: number;
""",
    """  highflyAirJumpUsed?: boolean;
  highflyLastJumpSeq?: number;
  highflyLastEvadeSeq?: number;
  highflyEvadeRemaining?: number;
  highflyEvadeCooldownRemaining?: number;
  highflyEvadeDirX?: number;
  highflyEvadeDirZ?: number;
  fallStartY: number;
""",
    "Entity evade transient state",
)

replace_once(
    inp,
    """  private highflyJumpSeq = 0;
  // Swim-down held by an on-screen/controller control (the keyboard path is the
""",
    """  private highflyJumpSeq = 0;
  private highflyEvadeSeq = 0;
  // Swim-down held by an on-screen/controller control (the keyboard path is the
""",
    "Input evade field",
)

replace_once(
    inp,
    """  triggerTouchJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }
""",
    """  triggerTouchJump(): void {
    this.highflyJumpSeq += 1;
    this.touchJumpUntil = Math.max(this.touchJumpUntil, performance.now() + TOUCH_JUMP_LATCH_MS);
  }

  /** HIGHFLY action-locomotion dodge. Independent from jump, passive and skills. */
  triggerHighflyEvade(): void {
    this.highflyEvadeSeq += 1;
  }
""",
    "Input evade trigger",
)

# Thread evade edge through every local MoveInput shape already extended by
# RUN0.9A's jump token.
input_text = inp.read_text(encoding="utf-8")
patterns = [
    (
        "        highflyJumpSeq: this.highflyJumpSeq,\n        dive:",
        "        highflyJumpSeq: this.highflyJumpSeq,\n        highflyEvadeSeq: this.highflyEvadeSeq,\n        dive:",
    ),
    (
        "        highflyJumpSeq: this.highflyJumpSeq,\n        dive,",
        "        highflyJumpSeq: this.highflyJumpSeq,\n        highflyEvadeSeq: this.highflyEvadeSeq,\n        dive,",
    ),
    (
        "      highflyJumpSeq: this.highflyJumpSeq,\n      dive,",
        "      highflyJumpSeq: this.highflyJumpSeq,\n      highflyEvadeSeq: this.highflyEvadeSeq,\n      dive,",
    ),
    (
        "{ ...this.controllerMoveInput, highflyJumpSeq: this.highflyJumpSeq }",
        "{ ...this.controllerMoveInput, highflyJumpSeq: this.highflyJumpSeq, highflyEvadeSeq: this.highflyEvadeSeq }",
    ),
]
matched = 0
for old, new in patterns:
    count = input_text.count(old)
    if count:
        input_text = input_text.replace(old, new)
        matched += count
if matched < 4:
    raise SystemExit(f"MoveInput evade threading: expected >=4 matches, found {matched}")
inp.write_text(input_text, encoding="utf-8")

# Deterministic short ground dodge. Direction = current HIGHFLY stick world
# vector; when stationary = current body-forward. It uses the same collision
# solver as ordinary locomotion, so it cannot tunnel through walls.
replace_once(
    motion,
    """export const BACKPEDAL_MULT = 0.65;
export const GRAVITY = 16;
""",
    """export const BACKPEDAL_MULT = 0.65;
export const HIGHFLY_EVADE_SPEED = 13;
export const HIGHFLY_EVADE_DURATION = 0.18;
export const HIGHFLY_EVADE_COOLDOWN = 0.55;
export const GRAVITY = 16;
""",
    "evade constants",
)

motion_text = motion.read_text(encoding="utf-8")
evade_anchor = """  const movingOnGround = moving && (p.onGround || swimming);
"""
evade_block = """  const highflyEvadeSeq = inp.highflyEvadeSeq ?? 0;
  const freshHighflyEvade =
    highflyEvadeSeq !== 0 && highflyEvadeSeq !== (p.highflyLastEvadeSeq ?? 0);
  if (freshHighflyEvade) p.highflyLastEvadeSeq = highflyEvadeSeq;

  p.highflyEvadeCooldownRemaining = Math.max(
    0,
    (p.highflyEvadeCooldownRemaining ?? 0) - DT,
  );
  if (
    freshHighflyEvade &&
    (p.highflyEvadeCooldownRemaining ?? 0) <= 0 &&
    p.onGround &&
    !swimming &&
    !steepGround &&
    !mountLocked &&
    !p.mountKey &&
    !p.climb &&
    !isRooted(p)
  ) {
    const hx = inp.highflyWorldX ?? 0;
    const hz = inp.highflyWorldZ ?? 0;
    const hlen = Math.hypot(hx, hz);
    if (hlen > 1e-6) {
      p.highflyEvadeDirX = hx / hlen;
      p.highflyEvadeDirZ = hz / hlen;
    } else {
      p.highflyEvadeDirX = Math.sin(p.facing);
      p.highflyEvadeDirZ = Math.cos(p.facing);
    }
    p.highflyEvadeRemaining = HIGHFLY_EVADE_DURATION;
    p.highflyEvadeCooldownRemaining = HIGHFLY_EVADE_COOLDOWN;
  }

  const highflyEvading =
    (p.highflyEvadeRemaining ?? 0) > 0 &&
    p.onGround &&
    !swimming &&
    !steepGround &&
    !mountLocked;
  if (highflyEvading) {
    p.highflyEvadeRemaining = Math.max(0, (p.highflyEvadeRemaining ?? 0) - DT);
  } else if ((p.highflyEvadeRemaining ?? 0) > 0) {
    p.highflyEvadeRemaining = 0;
  }

  const movingOnGround = moving && (p.onGround || swimming);
"""
if motion_text.count(evade_anchor) != 1:
    raise SystemExit(f"evade insertion anchor: expected 1, found {motion_text.count(evade_anchor)}")
motion_text = motion_text.replace(evade_anchor, evade_block)

cond_old = """  if (slide || movingOnGround || airSteering || (!p.onGround && (p.vx !== 0 || p.vz !== 0))) {
"""
cond_new = """  if (
    slide ||
    highflyEvading ||
    movingOnGround ||
    airSteering ||
    (!p.onGround && (p.vx !== 0 || p.vz !== 0))
  ) {
"""
if motion_text.count(cond_old) != 1:
    raise SystemExit(f"evade move condition: expected 1, found {motion_text.count(cond_old)}")
motion_text = motion_text.replace(cond_old, cond_new)

step_old = """    const stepX = slide ? slide.x * STEEP_SLIDE_SPEED : movingOnGround ? wishX * wishSpeed : p.vx;
    const stepZ = slide ? slide.z * STEEP_SLIDE_SPEED : movingOnGround ? wishZ * wishSpeed : p.vz;
"""
step_new = """    const stepX = slide
      ? slide.x * STEEP_SLIDE_SPEED
      : highflyEvading
        ? (p.highflyEvadeDirX ?? Math.sin(p.facing)) * HIGHFLY_EVADE_SPEED
        : movingOnGround
          ? wishX * wishSpeed
          : p.vx;
    const stepZ = slide
      ? slide.z * STEEP_SLIDE_SPEED
      : highflyEvading
        ? (p.highflyEvadeDirZ ?? Math.cos(p.facing)) * HIGHFLY_EVADE_SPEED
        : movingOnGround
          ? wishZ * wishSpeed
          : p.vz;
"""
if motion_text.count(step_old) != 1:
    raise SystemExit(f"evade step override: expected 1, found {motion_text.count(step_old)}")
motion_text = motion_text.replace(step_old, step_new)
motion.write_text(motion_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# MOBILE BUTTON: one permanent Evade seat; not part of the paged skill ring.
# ---------------------------------------------------------------------------
for html_name in ("index.html", "play.html"):
    html = Path(html_name)
    text = html.read_text(encoding="utf-8")
    jump = """      <button type="button" id="mobile-jump" data-i18n-title="hud.keybinds.actions.jump" data-i18n-aria="hud.keybinds.actions.jump" title="Jump" aria-label="Jump" data-icon="jump"><span class="mobile-label" data-i18n="hudChrome.mobile.jump">Jump</span></button>
"""
    evade = """      <button type="button" id="mobile-evade" title="Evadir" aria-label="Evadir"><span class="mobile-evade-glyph" aria-hidden="true">↝</span><span class="mobile-label">Evadir</span></button>
"""
    if text.count(jump) != 1:
        raise SystemExit(f"{html_name} evade button anchor: expected 1, found {text.count(jump)}")
    html.write_text(text.replace(jump, evade + jump), encoding="utf-8")

replace_once(
    mobile,
    """  onCycleTarget(): void;
  onJump(): void;
  onInteract(): void;
""",
    """  onCycleTarget(): void;
  onJump(): void;
  /** HIGHFLY locomotion dodge; never consumes a hotbar slot. */
  onEvade(): void;
  onInteract(): void;
""",
    "mobile callbacks evade",
)
replace_once(
    mobile,
    """    this.bindButton('mobile-target-cycle', () => this.callbacks.onCycleTarget());
    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });
    this.bindButton('mobile-interact', () => this.callbacks.onInteract());
""",
    """    this.bindButton('mobile-target-cycle', () => this.callbacks.onCycleTarget());
    this.bindButton('mobile-jump', () => this.callbacks.onJump(), { pressFirst: true });
    this.bindButton('mobile-evade', () => this.callbacks.onEvade(), { pressFirst: true });
    this.bindButton('mobile-interact', () => this.callbacks.onInteract());
""",
    "bind mobile evade",
)
replace_once(
    main,
    """    onCycleTarget: () => world.tabTarget(),
    onJump: () => input.triggerTouchJump(),
    onInteract: () => {
""",
    """    onCycleTarget: () => world.tabTarget(),
    onJump: () => input.triggerTouchJump(),
    onEvade: () => input.triggerHighflyEvade(),
    onInteract: () => {
""",
    "wire evade callback",
)

# ---------------------------------------------------------------------------
# QUICK MENU: HIGHFLY always uses tap/sticky mode. No hold-to-keep-open.
# ---------------------------------------------------------------------------
replace_once(
    menu,
    """    tapMenus: () => tapMenusEnabled(),
""",
    """    // HIGHFLY mobile UX: Quick Actions is always tap-toggle/sticky.
    // Hold/swipe remains available to the other gesture menus.
    tapMenus: () => true,
""",
    "force Quick Actions tap mode",
)
replace_once(
    menu,
    """    anchor.setAttribute(ARIA_LABEL_ATTR, t(tapMenusEnabled() ? TAP_ARIA_KEY : GESTURE_ARIA_KEY));
""",
    """    anchor.setAttribute(ARIA_LABEL_ATTR, t(TAP_ARIA_KEY));
""",
    "Quick Actions tap aria",
)

# Tap outside closes the sticky Quick Actions panel.
replace_once(
    mobile,
    """    this.menuControl = buildMobileMenuControl();
    this.bindButton('mobile-discord', () => this.callbacks.onDiscord());
""",
    """    this.menuControl = buildMobileMenuControl();
    document.addEventListener('pointerdown', (e) => {
      const menu = this.menuControl;
      if (!this.active || !menu?.gesture.isOpen()) return;
      const target = e.target as Element | null;
      if (
        target?.closest?.('#mobile-menu-anchor') ||
        target?.closest?.('#mobile-menu-strip')
      ) return;
      menu.gesture.closeSticky();
    });
    this.bindButton('mobile-discord', () => this.callbacks.onDiscord());
""",
    "Quick Actions tap outside close",
)

# ---------------------------------------------------------------------------
# HUD GEOMETRY: Attack stays separate. Along its bottom row, from right to left:
# Skill 1 -> Jump -> Evade -> optional stance/passive. Stance is already hidden
# by its painter on classes that do not have one, so no overlap can occur.
# ---------------------------------------------------------------------------
css_append = r"""

/* ==========================================================================
   HIGHFLY RUN0.9 — action controls
   ========================================================================== */
body.mobile-touch #mobile-action-ring {
  --highfly-action-gap: calc(12px * var(--mobile-chrome-scale, 1));
  /* The optional stance/passive is the fourth small seat; allow children to
     occupy that width without clipping the ring's authored box. */
  width: calc(
    var(--mobile-ring-attack-size) +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 2 +
    var(--menu-btn-size) +
    var(--highfly-action-gap) * 4
  );
}

/* Skill 1: first paged action seat, immediately left of the big Attack button. */
body.mobile-touch .mobile-action-slot[data-mobile-index="0"] {
  right: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-action-size) / 2);
}

/* Jump is one equal gap left of Skill 1. */
body.mobile-touch #mobile-action-ring #mobile-jump {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-action-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

/* Evade is permanent locomotion chrome, one equal gap left of Jump. */
body.mobile-touch #mobile-action-ring #mobile-evade {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
  width: var(--mobile-ring-secondary-size);
  height: var(--mobile-ring-secondary-size);
  color: var(--color-mobile-btn-warm);
  border-color: var(--color-mobile-btn-warm-rim);
}
body.mobile-touch #mobile-evade .mobile-evade-glyph {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}
body.mobile-touch #mobile-evade .mobile-label {
  display: block;
  margin-top: 1px;
  font-size: 8px;
  font-family: var(--ui-font);
  color: var(--color-mobile-btn-caption);
}

/* Optional class stance/passive: fourth seat, never on top of Evade. Its
   existing painter still owns display:none for classes that do not use it. */
body.mobile-touch #mobile-stance-anchor {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 2
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--menu-btn-size) / 2);
}

/* Keep the remaining combat abilities above the new bottom row. */
body.mobile-touch .mobile-action-slot[data-mobile-index="1"] {
  right: calc(var(--mobile-ring-attack-size) + 18px);
  bottom: calc(var(--mobile-ring-attack-size) + 24px);
}
body.mobile-touch .mobile-action-slot[data-mobile-index="2"] {
  right: calc(var(--mobile-ring-attack-size) / 2 + 54px);
  bottom: calc(var(--mobile-ring-attack-size) + 82px);
}
body.mobile-touch .mobile-action-slot[data-mobile-index="3"] {
  right: 8px;
  bottom: calc(var(--mobile-ring-attack-size) + 118px);
}

/* Left-handed mirror for the HIGHFLY bottom row. */
body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"],
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump,
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade,
body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  right: auto;
}
body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"] {
  left: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
}
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-action-size)
  );
}
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size)
  );
}
body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-action-size) +
    var(--mobile-ring-secondary-size) * 2
  );
}

/* Quick Actions: compact tap-toggle at the top centre. */
body.mobile-touch #mobile-combat-controls {
  position: fixed;
  left: 50%;
  right: auto;
  top: max(8px, env(safe-area-inset-top));
  bottom: auto;
  transform: translateX(-50%);
  z-index: 45;
}
body.mobile-touch #mobile-menu-anchor {
  width: 48px;
  height: 38px;
  min-width: 48px;
  border-radius: 19px;
}
body.mobile-touch #mobile-menu-anchor .mobile-label {
  display: none;
}

/* Reuse ClaudeCraft's REAL menu buttons/handlers, but lay them out as a tidy
   5x2 panel instead of the hold/swipe strip. */
body.mobile-touch #mobile-menu-strip.open {
  position: fixed !important;
  left: 50% !important;
  right: auto !important;
  top: max(54px, calc(env(safe-area-inset-top) + 50px)) !important;
  width: min(650px, calc(100vw - 28px)) !important;
  height: auto !important;
  padding: 12px 44px 12px 12px !important;
  transform: translateX(-50%) !important;
  display: grid !important;
  grid-template-columns: repeat(5, minmax(48px, 1fr));
  gap: 10px;
  pointer-events: auto !important;
  border: 1px solid var(--color-border-showcase);
  border-radius: 14px;
  background: rgba(10, 10, 16, 0.94);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(8px);
}
body.mobile-touch #mobile-menu-strip.open::before {
  display: none !important;
}
body.mobile-touch #mobile-menu-strip.open .mobile-menu-item {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  width: var(--menu-btn-size) !important;
  height: var(--menu-btn-size) !important;
  margin: 0 auto !important;
  pointer-events: auto !important;
}
body.mobile-touch #mobile-menu-strip.open #mobile-menu-cancel {
  position: absolute !important;
  left: auto !important;
  right: 8px !important;
  top: 8px !important;
  width: 34px !important;
  height: 34px !important;
  margin: 0 !important;
  pointer-events: auto !important;
}
body.mobile-touch #mobile-menu-caption {
  display: none !important;
}
"""
css.write_text(css.read_text(encoding="utf-8") + css_append, encoding="utf-8")

print("HIGHFLY_RUN09_MOBILE_ACTIONS_APPLIED=1")
