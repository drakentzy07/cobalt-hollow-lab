#!/usr/bin/env python3
"""C7: REBORN own launcher replaces the extra mobile preflight click.
Keeps beginWorldEntry guarding duplicate start; preserves native fullscreen.
"""
from pathlib import Path
p=Path('src/main.ts');s=p.read_text()
needle="""  if (useTouchInterface()) {
    await showMobilePreflightPrompt();
  } else {
    requestPreferredFullscreen();
  }"""
replacement="""  // HIGHFLY's own OFFLINE launcher has already asked for landscape/fullscreen.
  // A second upstream mobile-preflight Continue blocked actual entry on S23.
  if (useTouchInterface() && import.meta.env.VITE_HIGHFLY_REBORN !== '1') {
    await showMobilePreflightPrompt();
  } else {
    requestPreferredFullscreen();
  }"""
assert s.count(needle)==1, 'REBORN_C7_PREPARE_WORLD_ENTRY_SEAM_DRIFT'
p.write_text(s.replace(needle,replacement))
print('HIGHFLY_REBORN_C7_OWN_LAUNCH_NO_SECOND_PRE_FLIGHT=PASS')
