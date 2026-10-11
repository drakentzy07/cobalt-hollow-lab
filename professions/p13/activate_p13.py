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
"import { BASE_ITEMS } from './content/items';\nimport { HIGHFLY_P13_ITEMS } from './content/highfly_lv99_native_equipment';",
"  HOARD_ITEMS,\n);":"  HOARD_ITEMS,\n  HIGHFLY_P13_ITEMS,\n);",
}
for old,new in r.items():
    if s.count(old)!=1:raise SystemExit("HF_P13_NATIVE_REGISTRY_DRIFT:"+old)
    s=s.replace(old,new,1)
p_recipes=Path("src/sim/content/recipes.ts")
src=p_recipes.read_text("utf8")
anchor="import type { ProfessionRecipeRecord } from '../professions/types';"
if src.count(anchor)!=1:raise SystemExit("P13_RECIPE_AUTHORITATIVE_IMPORT_DRIFT")
src=src.replace(anchor,anchor+"\nimport { HIGHFLY_P13_RECIPES } from './highfly_lv99_native_equipment';",1)
start_marker="export const ALL_RECIPES: ProfessionRecipeRecord[] = ["
if src.count(start_marker)!=1:raise SystemExit("P13_CANONICAL_RECIPE_ARRAY_NOT_FOUND")
start=src.index(start_marker)+len(start_marker)
end=src.find("\n];",start)
if end<0:raise SystemExit("P13_CANONICAL_RECIPE_ARRAY_UNTERMINATED")
src=src[:end]+"\n  ...HIGHFLY_P13_RECIPES,"+src[end:]
p_recipes.write_text(src,"utf8")
p.write_text(s,"utf8")
if s.count("HIGHFLY_P13_ITEMS")!=2 or s.count("HIGHFLY_P13_RECIPES")!=0:
    raise SystemExit("HF_P13_REGISTRATION_DUPLICATE")
print("HF_P13_ITEMS_NATIVE_DATA_AND_RECIPES_NATIVE_RECIPE_BY_ID_INDEX_LINKED=1")
