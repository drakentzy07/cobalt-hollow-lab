#!/usr/bin/env python3
"""ORIGIN R1-2 P0: register original ability→motion donor routing, DATA ONLY.
No change to class selection, damage, class skill ownership or loading.
Actual server-authoritative unlock and single-Hunter animation playback:
separate later gates. Fail closed on path collisions.
"""
from pathlib import Path
import shutil

dest=Path('src/highfly/highfly_origin_skill_motion_catalog.ts')
if dest.exists():
    raise SystemExit('HIGHFLY_ORIGIN_R1_2_P0_DUPLICATE_CATALOG')
dest.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(
    '../v9-corrections/game/c1/highfly_origin_skill_motion_catalog.ts',
    dest,
)
content=dest.read_text(encoding='utf-8')
assert 'originNativeSkillMotion' in content
assert 'originEquippedSkillDonorUrls' in content
assert "import { ABILITIES } from '../sim/content/classes';" in content
assert "import { VISUALS } from '../render/characters/manifest';" in content
print('HIGHFLY_ORIGIN_R1_2_P0_NATIVE_MOTION_DONOR_CATALOG_INSTALLED=1')
