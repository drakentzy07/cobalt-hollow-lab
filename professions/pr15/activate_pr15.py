#!/usr/bin/env python3
"""HIGHFLY V4-02 PR15: expand native PR14 Jewelcrafting / equipped weapon inlay.
Apply AFTER PR14. No GOLDEN controller, combat, stat, or save engine rewrite.
"""
from pathlib import Path

def exact(path, old, new, label):
    file=Path(path)
    s=file.read_text(encoding='utf-8')
    if s.count(old)!=1 or new in s:
        raise SystemExit(f'PR15 REFUSED {label}: anchor count={s.count(old)} duplicate={new in s}')
    file.write_text(s.replace(old,new,1),encoding='utf-8')

catalog='src/sim/professions/highfly_gem_catalog.ts'
socket='src/sim/professions/highfly_gem_socket.ts'
hud='src/highfly/game_c1_runtime.ts'

exact(catalog,
"""    sellValue: 0,
  },
};

export const HIGHFLY_GEM_RECIPES""",
"""    sellValue: 0,
  },
  highfly_frost_gem: {
    id: 'highfly_frost_gem',
    name: 'Gema de hielo HIGHFLY',
    kind: 'junk',
    quality: 'uncommon',
    sellValue: 0,
  },
  highfly_lightning_gem: {
    id: 'highfly_lightning_gem',
    name: 'Gema de rayo HIGHFLY',
    kind: 'junk',
    quality: 'rare',
    sellValue: 0,
  },
};

export const HIGHFLY_GEM_RECIPES""",
"two native item definitions")

exact(catalog,
"""    stationType: 'forge',
  },
];
""",
"""    stationType: 'forge',
  },
  {
    id: 'recipe_highfly_frost_gem',
    professionId: 'jewelcrafting',
    resultItemId: 'highfly_frost_gem',
    resultCount: 1,
    reagents: [
      { itemId: 'iron_ore', count: 4 },
      { itemId: 'arcane_essence', count: 2 },
      { itemId: 'smithing_flux', count: 1 },
    ],
    skillReq: 35,
    itemLevelBudget: 16,
    level: 15,
    acquisition: ['trainer'],
    stationType: 'forge',
  },
  {
    id: 'recipe_highfly_lightning_gem',
    professionId: 'jewelcrafting',
    resultItemId: 'highfly_lightning_gem',
    resultCount: 1,
    reagents: [
      { itemId: 'thorium_ore', count: 3 },
      { itemId: 'arcane_shard', count: 1 },
      { itemId: 'smithing_flux', count: 2 },
    ],
    skillReq: 60,
    itemLevelBudget: 20,
    level: 20,
    acquisition: ['trainer'],
    stationType: 'forge',
  },
];
""",
"two forge-gated jewelcrafting recipes")
exact(socket,
"""  highfly_fire_gem: 'fire',
};""",
"""  highfly_fire_gem: 'fire',
  highfly_frost_gem: 'frost',
  highfly_lightning_gem: 'lightning',
};""",
"same authoritative PR14 socket")

exact(hud,
"""function ensureUtilityLane(): void {""",
"""/** Use physical bag contents for GEM choice; never mint an element or stat. */
function selectHighflyInlayGem(callback: (gemItemId: string) => void): void {
  const g = game();
  const pid = g?.sim?.player?.id;
  const candidates = [
    { id: 'highfly_fire_gem', label: '🔥 Fuego' },
    { id: 'highfly_frost_gem', label: '❄️ Hielo' },
    { id: 'highfly_lightning_gem', label: '⚡ Rayo' },
  ];
  const available = candidates.filter((c) => pid != null && g.sim.countItem(c.id, pid) > 0);
  if (available.length === 0) {
    toast('SIN GEMAS', 'Fabricá una gema de Fuego, Hielo o Rayo con Jewelcrafting.');
    return;
  }
  if (available.length === 1) {
    callback(available[0].id);
    return;
  }
  document.getElementById('hf-gem-inlay-picker')?.remove();
  const picker = document.createElement('div');
  picker.id = 'hf-gem-inlay-picker';
  picker.setAttribute('role', 'dialog');
  picker.setAttribute('aria-label', 'Elegir gema para incrustar');
  picker.style.cssText = 'position:fixed;right:12px;bottom:65px;z-index:9999;max-width:min(320px,92vw);padding:12px;background:#132033;color:#fff;border:1px solid #8898bc;border-radius:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 8px 26px #000b';
  const title = document.createElement('strong');
  title.textContent = 'Elegí la gema para esta arma';
  picker.append(title);
  for (const gem of available) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = gem.label;
    button.style.cssText = 'min-height:40px;padding:8px 12px;border-radius:8px;color:inherit;background:#263957;border:1px solid #7790b9';
    button.addEventListener('click', () => { picker.remove(); callback(gem.id); });
    picker.append(button);
  }
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  cancel.style.cssText = 'min-height:40px;background:transparent;color:inherit;border:1px solid #67768b;border-radius:8px';
  cancel.addEventListener('click', () => picker.remove());
  picker.append(cancel);
  document.body.append(picker);
}

function ensureUtilityLane(): void {""",
"inventory-driven GEM picker without moving GOLDEN HUD")

exact(hud,
"""        const outcome = game()?.sim?.inlayHighflyGem?.('highfly_fire_gem');
        if (outcome?.ok) {""",
"""        selectHighflyInlayGem((gemItemId) => {
        const outcome = game()?.sim?.inlayHighflyGem?.(gemItemId);
        if (outcome?.ok) {""",
"submit selected original inventory item")
exact(hud,
"""        toast('INCRUSTACIÓN', help[reason] ?? 'No se puede incrustar aquí.');
        return;
      }
      toast(""",
"""        toast('INCRUSTACIÓN', help[reason] ?? 'No se puede incrustar aquí.');
        });
        return;
      }
      toast(""",
"selector callback close")
exact(hud,
"""          toast('GEMA ÍGNEA INCRUSTADA', 'Tu arma ganó ATK4 de fuego.');""",
"""          toast('GEMA INCRUSTADA', 'Tu arma ganó ATK4 ' + outcome.gem.toUpperCase() + '.');""",
"elemental ATK4 success feedback")
print('HIGHFLY_V4_02_PR15_FROST_LIGHTNING_GEM_REUSE_GREEN=1')
