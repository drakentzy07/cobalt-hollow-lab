from pathlib import Path

css = Path("src/styles/hud.mobile.css")
text = css.read_text(encoding="utf-8")

addition = r"""

/* ==========================================================================
   HIGHFLY RUN0.9.2 — HUD COMFORT POLISH
   S23 Ultra landscape pass.
   Frozen behavior: camera, double-jump, persistence, evade logic.
   ========================================================================== */

@media (orientation: landscape) {
  /* Player identity/vitals move out of the bottom-center sight line.
     Slightly larger than RUN0.9.1 for at-a-glance HP/resource readability. */
  body.mobile-touch #player-frame {
    left: max(18px, env(safe-area-inset-left));
    right: auto;
    top: max(16px, env(safe-area-inset-top));
    bottom: auto;
    width: 300px;
    transform: scale(calc(0.82 * var(--mobile-chrome-scale, 1)));
    transform-origin: left top;
  }

  body.mobile-touch.xhb-mode #player-frame {
    transform:
      translateY(calc(-1 * var(--xhb-lift, var(--mobile-xhb-lift-fallback))))
      scale(calc(0.82 * var(--mobile-chrome-scale, 1)));
  }

  /* The target frame previously owned the exact top-left seat. Reserve the
     player's new permanent frame and continue the same left-side stack below
     it, avoiding an overlap when a target is selected. */
  body.mobile-touch #target-frame {
    left: max(18px, env(safe-area-inset-left));
    top: calc(max(16px, env(safe-area-inset-top)) + 76px);
  }

  body.mobile-touch #party-frames {
    top: calc(max(16px, env(safe-area-inset-top)) + 122px);
  }

  /* Give both thumbs a little breathing room from the phone edge. Keep the
     capture zone offset in step with the visible movement wheel. */
  body.mobile-touch .mobile-joystick {
    bottom: calc(35px + env(safe-area-inset-bottom));
  }

  body.mobile-touch #mobile-move-zone {
    bottom: calc(46px + env(safe-area-inset-bottom));
  }

  /* Lift the complete right-hand action cluster as one unit. */
  body.mobile-touch #mobile-action-ring {
    bottom: calc(38px + env(safe-area-inset-bottom));
  }
}

/* Exact approved left-to-right bottom row:
   Passive (when available) | Evade | Jump | Skill 1 | Use | Attack.
   The other paged skills remain on their RUN0.9.1 arc. */
body.mobile-touch #mobile-action-ring #mobile-interact {
  right: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

body.mobile-touch .mobile-action-slot[data-mobile-index="0"] {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-secondary-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-action-size) / 2);
}

body.mobile-touch #mobile-action-ring #mobile-jump {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-secondary-size) +
    var(--mobile-ring-action-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

body.mobile-touch #mobile-action-ring #mobile-evade {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-secondary-size) * 2 +
    var(--mobile-ring-action-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--mobile-ring-secondary-size) / 2);
}

body.mobile-touch #mobile-stance-anchor {
  right: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 5 +
    var(--mobile-ring-secondary-size) * 3 +
    var(--mobile-ring-action-size)
  );
  bottom: calc(var(--mobile-ring-attack-size) / 2 - var(--menu-btn-size) / 2);
}

/* Mirror the same exact ordering for left-handed mode. */
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-interact,
body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"],
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump,
body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade,
body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  right: auto;
}

body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-interact {
  left: calc(var(--mobile-ring-attack-size) + var(--highfly-action-gap));
}

body.mobile-touch.mobile-left-handed .mobile-action-slot[data-mobile-index="0"] {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 2 +
    var(--mobile-ring-secondary-size)
  );
}

body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-jump {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 3 +
    var(--mobile-ring-secondary-size) +
    var(--mobile-ring-action-size)
  );
}

body.mobile-touch.mobile-left-handed #mobile-action-ring #mobile-evade {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 4 +
    var(--mobile-ring-secondary-size) * 2 +
    var(--mobile-ring-action-size)
  );
}

body.mobile-touch.mobile-left-handed #mobile-stance-anchor {
  left: calc(
    var(--mobile-ring-attack-size) +
    var(--highfly-action-gap) * 5 +
    var(--mobile-ring-secondary-size) * 3 +
    var(--mobile-ring-action-size)
  );
}
"""

if "HIGHFLY RUN0.9.2 — HUD COMFORT POLISH" in text:
    raise SystemExit("RUN0.9.2 HUD polish already applied")

css.write_text(text + addition, encoding="utf-8")
print("HIGHFLY_RUN092_HUD_COMFORT_APPLIED=1")
