#!/usr/bin/env python3
"""Append only P16 9 native chest armor ItemDefs+ALL_RECIPES.
Requires DEV5's P15 bridge already present in a disposable pinned donor.
Never alters live Pages, original donor files or Hunter save data.
"""
from pathlib import Path
p=Path("src/sim/data.ts")
s=p.read_text("utf8")
old="import { HIGHFLY_P15_ITEMS } from './content/highfly_p15_native_bridge35';"
new=old+"\nimport { HIGHFLY_P16_ARMOR_ITEMS } from './content/highfly_p16_native_chest_armor';"
if s.count(old)!=1:raise SystemExit("P16_P15_NATIVE_ITEMS_IMPORT_DRIFT")
s=s.replace(old,new,1)
old="  HIGHFLY_P15_ITEMS,\n);"
new="  HIGHFLY_P15_ITEMS,\n  HIGHFLY_P16_ARMOR_ITEMS,\n);"
if s.count(old)!=1:raise SystemExit("P16_P15_ITEMS_MERGE_DRIFT")
s=s.replace(old,new,1)
p.write_text(s,"utf8")
p=Path("src/sim/content/recipes.ts")
s=p.read_text("utf8")
old="import { HIGHFLY_P15_RECIPES } from './highfly_p15_native_bridge35';"
new=old+"\nimport { HIGHFLY_P16_ARMOR_RECIPES } from './highfly_p16_native_chest_armor';"
if s.count(old)!=1:raise SystemExit("P16_P15_NATIVE_RECIPES_IMPORT_DRIFT")
s=s.replace(old,new,1)
old="  ...HIGHFLY_P15_RECIPES,"
new=old+"\n  ...HIGHFLY_P16_ARMOR_RECIPES,"
if s.count(old)!=1:raise SystemExit("P16_P15_RECIPE_APPEND_DRIFT")
s=s.replace(old,new,1)
p.write_text(s,"utf8")
print("HF_P16_9_ARMOR_CHEST_NATIVE_ITEMS_AND_RECIPES_REGISTERED=1")
