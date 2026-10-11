#!/usr/bin/env python3
"""P13 development sandbox: register HIGHFLY lv50–99 native weapons AND native
recipes into existing ITEMS/ALL_RECIPES; no duplicate engines or persistent
edits. Only run on a disposable pinned P12 donor CI worktree.
"""
from pathlib import Path
p=Path("src/sim/data.ts")
s=p.read_text("utf8")
r={
"import { BASE_ITEMS } from './content/items';":
"import { BASE_ITEMS } from './content/items';\nimport { HIGHFLY_P13_ITEMS, HIGHFLY_P13_RECIPES } from './content/highfly_lv99_native_equipment';",
"  HOARD_ITEMS,\n);":"  HOARD_ITEMS,\n  HIGHFLY_P13_ITEMS,\n);",
"export const ALL_RECIPES = [...ALL_RECIPES_CONTENT];":
"export const ALL_RECIPES = [...ALL_RECIPES_CONTENT, ...HIGHFLY_P13_RECIPES];",
}
for old,new in r.items():
    if s.count(old)!=1:raise SystemExit("HF_P13_NATIVE_REGISTRY_DRIFT:"+old)
    s=s.replace(old,new,1)
p.write_text(s,"utf8")
if s.count("HIGHFLY_P13_ITEMS")!=2 or s.count("HIGHFLY_P13_RECIPES")!=2:
    raise SystemExit("HF_P13_REGISTRATION_DUPLICATE")
print("HF_P13_ONE_ITEMS_REGISTRY_ONE_RECIPE_REGISTRY_LEGACY_UNTOUCHED=1")
