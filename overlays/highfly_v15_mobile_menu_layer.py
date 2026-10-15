#!/usr/bin/env python3
"""HF15-UX02: fix Quick Actions input layer only during unmodal mobile gameplay.

The donor's #mobile-controls is z60 while #ui is z80. In the assembled HIGHFLY
landscape HUD the Actions anchor can sit under an interactive #ui/canvas layer:
native touch pointerdown/up reaches the anchor but the compatibility click lands
on #game-canvas and dismisses its own just-opened menu.

Patch the donor's existing mobile CSS, preserving its @layer ordering, positions,
GOLDEN controls, item-drag override and all existing 'window open' z-index gates.
Does not patch game logic or the public Pages tree.
"""
from pathlib import Path

CSS = Path("src/styles/hud.mobile.css")
SIGNATURE = "/* HF15_UX02_QUICK_ACTIONS_INPUT_LAYER */"
RULE = """
  /* HF15_UX02_QUICK_ACTIONS_INPUT_LAYER */
  /* The closed Quick Actions anchor must be an actual hit-test target during
     gameplay, not painted beneath #ui (z80) / the game canvas.  #mobile-controls
     is already pointer-events:none with pointer-active children; raising its
     stacking context does not create an opaque touch-capturing fullscreen sheet.
     Preserve the donor's game windows, modal and drag transfer stacking rules. */
  body.mobile-touch.game-active:not(.mobile-window-open):not(.mobile-more-open)
    #mobile-controls {
    z-index: 96;
  }
"""

def patch(text: str) -> str:
    if SIGNATURE in text:
        raise ValueError("HF15_UX02_PATCH_ALREADY_APPLIED")
    if "@layer hud-mobile {" not in text:
        raise ValueError("HF15_UX02_MISSING_HUD_LAYER")
    for expected in (
        "body.mobile-touch.game-active #mobile-controls {",
        "body.mobile-touch.game-active.touch-item-dragging #mobile-controls {",
        "body.mobile-touch.game-active #mobile-controls:has(#mobile-menu-strip.open) {",
    ):
        if expected not in text:
            raise ValueError("HF15_UX02_DONOR_STYLES_DRIFT: "+expected)
    if not text.rstrip().endswith("}"):
        raise ValueError("HF15_UX02_MISSING_FINAL_LAYER_CLOSE")
    # The stylesheet has one top-level @layer hud-mobile block, closed at EOF.
    offset = text.rfind("}")
    return text[:offset] + RULE + text[offset:]


if __name__ == "__main__":
    before=CSS.read_text(encoding="utf-8")
    after=patch(before)
    CSS.write_text(after,encoding="utf-8")
    print("HF15_UX02_QUICK_ACTIONS_LAYER_PATCH_GREEN=1")
