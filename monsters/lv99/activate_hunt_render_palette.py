#!/usr/bin/env python3
"""PASS02-I: exact-anchor isolated renderer bridge, never a ClaudeCraft donor commit.
Near AND far native ground palettes follow the eight active HuntPilot biomes.
The helper returns null for every original world and V4 build.
"""
from pathlib import Path

near = Path('src/render/terrain_chunk_build.ts')
far = Path('src/render/far_terrain_core.ts')
if not near.is_file() or not far.is_file():
    raise SystemExit('HF_P02I_FROZEN_DONOR_SOURCE_MISSING')

def replace_one(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f'HF_P02I_DONOR_DRIFT:{label}:{text.count(old)}')
    return text.replace(old, new, 1)

s = near.read_text(encoding='utf-8')
s = replace_one(
    s,
    "import { BIOME_PALETTE, ROCK_SLOPE_START, TERRAIN_TONES } from './terrain_palette';",
    "import { BIOME_PALETTE, ROCK_SLOPE_START, TERRAIN_TONES } from './terrain_palette';\n"
    "import { highflyHuntActiveGroundPalette } from '../highfly/monsters/hunt_render_palette';",
    'near import',
)
s = replace_one(
    s,
    """    sandC.lerp(p.sand, t);
  }
}

// How "marsh" a given z is""",
    """    sandC.lerp(p.sand, t);
  }
  // Only an opt-in HIGHFLY HuntPilot isolated island overrides donor ZONES.
  // Donor source, render budget, all other worlds and V4 remain unchanged.
  const hunt = highflyHuntActiveGroundPalette();
  if (hunt) {
    grassC.setHex(hunt.grass);
    grassDarkC.setHex(hunt.grassDark);
    grassYellowC.setHex(hunt.grassYellow);
    dirtC.setHex(hunt.dirt);
    sandC.setHex(hunt.sand);
  }
}

// How "marsh" a given z is""",
    'near palette',
)
near.write_text(s, encoding='utf-8')

s = far.read_text(encoding='utf-8')
s = replace_one(
    s,
    "import { BIOME_PALETTE, ROCK_SLOPE_START, TERRAIN_TONES } from './terrain_palette';",
    "import { BIOME_PALETTE, ROCK_SLOPE_START, TERRAIN_TONES } from './terrain_palette';\n"
    "import { highflyHuntActiveGroundPalette } from '../highfly/monsters/hunt_render_palette';",
    'far import',
)
s = replace_one(
    s,
    """    lerp3(out.sand, p.sand, t);
  }
  return out;
}

/** Blend weight of one biome""",
    """    lerp3(out.sand, p.sand, t);
  }
  const hunt = highflyHuntActiveGroundPalette();
  if (hunt) {
    copy3(out.grass, srgbHexToLinear(hunt.grass));
    copy3(out.grassDark, srgbHexToLinear(hunt.grassDark));
    copy3(out.grassYellow, srgbHexToLinear(hunt.grassYellow));
    copy3(out.dirt, srgbHexToLinear(hunt.dirt));
    copy3(out.sand, srgbHexToLinear(hunt.sand));
  }
  return out;
}

/** Blend weight of one biome""",
    'far palette',
)
far.write_text(s, encoding='utf-8')
print('HF_P02I_NEAR_FAR_NATIVE_BIOME_COLOR_OVERLAY_GREEN=1')
