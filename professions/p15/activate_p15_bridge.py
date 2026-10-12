#!/usr/bin/env python3
"""Register the P15 LEVEL 30+40 bridge into the SAME original Sim tables.

Run ONLY after existing P13 activation in ephemeral CI upstream worktree.
Never rewrite the donor source repo, main, PLAY or any persisted Hunter.
Idempotency is intentionally rejected to avoid duplicate registrations.
"""
from pathlib import Path

data=Path('src/sim/data.ts')
s=data.read_text(encoding='utf8')
anchors={
    "import { HIGHFLY_P13_ITEMS } from './content/highfly_lv99_native_equipment';":
    "import { HIGHFLY_P13_ITEMS } from './content/highfly_lv99_native_equipment';\n"
    "import { HIGHFLY_P15_BRIDGE_ITEMS } from './content/highfly_bridge_30_40_native_weapons';",
    "  HIGHFLY_P13_ITEMS,\n);":
    "  HIGHFLY_P13_ITEMS,\n  HIGHFLY_P15_BRIDGE_ITEMS,\n);",
}
for old,new in anchors.items():
    if s.count(old)!=1:raise SystemExit('P15_DATA_REGISTRY_ANCHOR_DRIFT:'+old)
    s=s.replace(old,new,1)

recipes=Path('src/sim/content/recipes.ts')
r=recipes.read_text(encoding='utf8')
needle="import { HIGHFLY_P13_RECIPES } from './highfly_lv99_native_equipment';"
if r.count(needle)!=1:raise SystemExit('P15_RECIPE_IMPORT_ANCHOR_DRIFT')
r=r.replace(needle,needle+"\nimport { HIGHFLY_P15_BRIDGE_RECIPES } from './highfly_bridge_30_40_native_weapons';",1)
marker="  ...HIGHFLY_P13_RECIPES,"
if r.count(marker)!=1:raise SystemExit('P15_RECIPE_ARRAY_ANCHOR_DRIFT')
r=r.replace(marker,marker+"\n  ...HIGHFLY_P15_BRIDGE_RECIPES,",1)

# Nothing is modified until ALL anchors have passed their drift checks.
data.write_text(s,encoding='utf8')
recipes.write_text(r,encoding='utf8')
assert s.count('HIGHFLY_P15_BRIDGE_ITEMS')==2
assert r.count('HIGHFLY_P15_BRIDGE_RECIPES')==2
print('HF_P15_NATIVE_BRIDGE_6_WEAPONS_6_RECIPES_LINKED_TO_SAME_SIM=1')
