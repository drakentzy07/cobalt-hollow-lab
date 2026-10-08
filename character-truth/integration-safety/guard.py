#!/usr/bin/env python3
"""Fail closed: reject old V2 overlay or duplicate runtime in SKIN3 integration."""
import subprocess,pathlib,sys,re
base,legacy=sys.argv[1:]
run=lambda *args:subprocess.check_output(["git",*args],text=True).strip()
head=run("rev-parse","HEAD")
changed=[p for p in run("diff","--name-only",base,head).splitlines() if p]
allowed={
"character-truth/SKIN3_FACTORY_INTEGRATION_DECISION.md",
".github/workflows/skin3-integration-zero-overlap.yml",
".github/workflows/skin3-integration-painter-v3.yml",
".github/workflows/skin3-integration-molder-v3.yml",
"character-truth/integration-safety/guard.py",
}
prefixes=("character-truth/integration-safety/","character-truth/integration-modules/")
errors=[]
for p in changed:
    if not (p in allowed or any(p.startswith(x) for x in prefixes)):
        errors.append("PROTECTED or unexpected file modified: "+p)
    if p.endswith((".mjs",".js",".ts",".cjs",".html")) and p.startswith("character-truth/integration-modules/"):
        text=pathlib.Path(p).read_text()
        for key in ("__MODULAR_FACTORY_DIAG__","__MODULAR_FACTORY_API__",
                    "__SKIN_FACTORY_DIAG__","__SKIN_FACTORY_API__",
                    "window.__HF_SKIN3_CAGE__=","window.__HF_SKIN3_P10__="):
            if key in text:errors.append("LEGACY/NEW RUNTIME SINGLETON COLLISION: "+p+" "+key)
if not changed:errors.append("Expected at least one integration contract")
if not re.fullmatch("[0-9a-f]{40}",base) or not re.fullmatch("[0-9a-f]{40}",legacy):
    errors.append("BAD_BASE_PIN")
if errors:
    for e in errors:print("RED_ZERO_OVERLAP",e)
    raise SystemExit(1)
print("SKIN3_BASE="+base)
print("SKIN_FACTORY_V2_ORIGINAL="+legacy)
print("ADDITIVE_FILES="+str(len(changed)))
for p in changed:print("ALLOWED_CHANGE",p)
print("HIGHFLY_SKIN3_OLD_NEW_ZERO_OVERLAP_GREEN=1")
