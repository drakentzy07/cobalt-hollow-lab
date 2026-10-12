#!/usr/bin/env python3
"""Native registry append-only LV35 gear bridge AFTER P13 activation.
Strictly transform disposable frozen donor worktree, NEVER production.
Reuses same original ITEMS/ALL_RECIPES/recipeById with 3 new IDs only.
"""
from pathlib import Path
p=Path("src/sim/data.ts")
s=p.read_text("utf8")
old="import { HIGHFLY_P13_ITEMS } from './content/highfly_lv99_native_equipment';"
new=old+"\nimport { HIGHFLY_P15_ITEMS } from './content/highfly_p15_native_bridge35';"
if s.count(old)!=1:raise SystemExit("P15_NATIVE_P13_REGISTRY_NOT_ACTIVE")
s=s.replace(old,new,1)
old="  HIGHFLY_P13_ITEMS,\n);"
new="  HIGHFLY_P13_ITEMS,\n  HIGHFLY_P15_ITEMS,\n);"
if s.count(old)!=1:raise SystemExit("P15_NATIVE_MERGE_ITEMS_ANCHOR_DRIFT")
s=s.replace(old,new,1)
p.write_text(s,"utf8")
p=Path("src/sim/content/recipes.ts")
s=p.read_text("utf8")
old="import { HIGHFLY_P13_RECIPES } from './highfly_lv99_native_equipment';"
new=old+"\nimport { HIGHFLY_P15_RECIPES } from './highfly_p15_native_bridge35';"
if s.count(old)!=1:raise SystemExit("P15_NATIVE_RECIPE_IMPORT_ANCHOR_DRIFT")
s=s.replace(old,new,1)
old="  ...HIGHFLY_P13_RECIPES,"
new=old+"\n  ...HIGHFLY_P15_RECIPES,"
if s.count(old)!=1:raise SystemExit("P15_NATIVE_RECIPE_APPEND_ANCHOR_DRIFT")
s=s.replace(old,new,1)
p.write_text(s,"utf8")
if s.count("...HIGHFLY_P15_RECIPES")!=1:raise SystemExit("P15_RECIPE_DUPLICATE")
print("HF_P15_LV35_THREE_WEAPONS_NATIVE_REGISTRY_AND_ALL_RECIPES_ACTIVE=1")
