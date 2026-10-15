"""HF15 UX02 CSS input hitbox precedence regression, no browser dependency."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"overlays"))
from highfly_v15_mobile_menu_layer import patch, SIGNATURE

DONOR = """@layer hud-mobile {
body.mobile-touch.game-active #mobile-controls {
 z-index: 60;
}
body.mobile-touch.game-active.touch-item-dragging #mobile-controls {
 z-index: 96;
}
body.mobile-touch.game-active #mobile-controls:has(#mobile-menu-strip.open) {
 z-index: 96;
}
}
"""

class MobileMenuLayerTest(unittest.TestCase):
    def test_appends_rule_inside_original_mobile_layer(self):
        result=patch(DONOR)
        self.assertEqual(result.count(SIGNATURE),1)
        self.assertTrue(result.rstrip().endswith("}"))
        self.assertIn("not(.mobile-window-open)",result)
        self.assertIn("not(.mobile-more-open)",result)
        self.assertIn("z-index: 96;",result)
        self.assertTrue(result.index("HF15_UX02_QUICK_ACTIONS_INPUT_LAYER")<result.rfind("}"))
    def test_does_not_remove_existing_drag_or_open_strip_gates(self):
        result=patch(DONOR)
        self.assertIn("touch-item-dragging #mobile-controls",result)
        self.assertIn("#mobile-controls:has(#mobile-menu-strip.open)",result)
    def test_fails_closed_on_drift(self):
        for bad in ("html{}", DONOR.replace("touch-item-dragging","touch-item-removed")):
            with self.assertRaises(ValueError):
                patch(bad)
    def test_refuses_second_patch(self):
        with self.assertRaises(ValueError):
            patch(patch(DONOR))

if __name__ == "__main__":
    unittest.main()
