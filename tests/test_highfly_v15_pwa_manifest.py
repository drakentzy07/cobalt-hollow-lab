"""Tests for PWA start URL/scope rewrite, no Vite/Node/WebGL prerequisites."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PATCH = REPO / "overlays" / "highfly_v15_pwa_manifest.py"
REWRITE = REPO / "overlays" / "rewrite_pages_static.py"


def manifest(root):
    return {
        "name": "World of ClaudeCraft",
        "short_name": "ClaudeCraft",
        "start_url": "/",
        "scope": "/",
        "display": "fullscreen",
        "orientation": "landscape",
        "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}],
    }


class V15PwaManifestTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="hf15-pwa-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "dist").mkdir()
        (self.root / "public").mkdir()
        (self.root / "public" / "icon-192.png").write_bytes(b"test-icon")
        self.target = self.root / "dist" / "manifest.webmanifest"
        self.target.write_text(json.dumps(manifest(self.root), indent=2) + "\n", encoding="utf-8")

    def run_script(self, path=PATCH, base="/cobalt-hollow-lab/"):
        env = dict(os.environ, VITE_COBALT_BASE=base)
        return subprocess.run([sys.executable, str(path)], cwd=self.root, env=env,
                              text=True, capture_output=True, check=False)

    def read(self):
        return json.loads(self.target.read_text(encoding="utf-8"))

    def test_real_pipeline_rewrites_static_icons_then_repairs_start_scope(self):
        first = self.run_script(REWRITE)
        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertEqual(self.read()["icons"][0]["src"], "/cobalt-hollow-lab/icon-192.png")
        second = self.run_script()
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertIn("HF15_PWA_MANIFEST_GREEN=1", second.stdout)
        self.assertEqual(self.read()["start_url"], "/cobalt-hollow-lab/")
        self.assertEqual(self.read()["scope"], "/cobalt-hollow-lab/")
        self.assertEqual(self.read()["display"], "fullscreen")
        self.assertEqual(self.read()["orientation"], "landscape")

    def test_idempotent_second_run_preserves_bytes(self):
        self.assertEqual(self.run_script().returncode, 0)
        first = self.target.read_bytes()
        second = self.run_script()
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(self.target.read_bytes(), first)
        self.assertIn("HF15_PWA_CHANGED=0", second.stdout)

    def test_existing_pwa_identity_is_never_overwritten(self):
        data = manifest(self.root)
        data["id"] = "/"
        self.target.write_text(json.dumps(data), encoding="utf-8")
        self.assertEqual(self.run_script().returncode, 0)
        self.assertEqual(self.read()["id"], "/")

    def test_rejects_unexpected_scope_without_modifying_manifest(self):
        data = manifest(self.root)
        data["scope"] = "/some-other-app/"
        self.target.write_text(json.dumps(data), encoding="utf-8")
        before = self.target.read_bytes()
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("HF15_PWA_UNEXPECTED_SCOPE", result.stderr)
        self.assertEqual(self.target.read_bytes(), before)

    def test_rejects_origin_wide_base(self):
        before = self.target.read_bytes()
        result = self.run_script(base="/")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("HF15_PWA_BASE_EMPTY", result.stderr)
        self.assertEqual(self.target.read_bytes(), before)

    def test_rejects_missing_manifest(self):
        self.target.unlink()
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("HF15_PWA_MANIFEST_MISSING", result.stderr)

    def test_rejects_changed_display_contract(self):
        data = manifest(self.root)
        data["display"] = "browser"
        self.target.write_text(json.dumps(data), encoding="utf-8")
        before = self.target.read_bytes()
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("HF15_PWA_DISPLAY_ORIENTATION_DRIFT", result.stderr)
        self.assertEqual(self.target.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
