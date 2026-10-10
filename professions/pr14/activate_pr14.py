#!/usr/bin/env python3
"""V4-02 PR14: guarded, atomic adapter onto the frozen ClaudeCraft donor.

Reuses: native Jewelcrafting, material bag, forge, equipped-instance payload,
CharacterState, C2.8.2 ATK4. No new inventory/combat/save/stat engine.
Run AFTER PR1-13 and PF6; never modify GOLDEN input or published Pages.
"""
from pathlib import Path

root = Path('.')
ops = []

def add(path, old, new, label):
    ops.append((Path(path), old, new, label))

add('src/sim/content/items.ts',
    "import { BASE_ITEMS } from", "import { BASE_ITEMS } from",
    "noop placeholder") if False else None

add('src/sim/content/items.ts',
    "export const BASE_ITEMS: Record<string, ItemDef> = {\n",
    "export const BASE_ITEMS: Record<string, ItemDef> = {\n  ...HIGHFLY_GEM_ITEMS,\n",
    "native item catalog")
add('src/sim/content/items.ts',
    "export const BASE_ITEMS: Record<string, ItemDef> = {",
    "export const BASE_ITEMS: Record<string, ItemDef> = {",
    "noop placeholder") if False else None
add('src/sim/content/items.ts',
    "// ---------------------------------------------------------------------------\n// Items\n",
    "// ---------------------------------------------------------------------------\n// Items\n",
    "noop placeholder") if False else None

add('src/sim/content/recipes.ts',
    "import { FORGEBREAKER_RECIPES } from './forgebreaker_recipe';",
    "import { FORGEBREAKER_RECIPES } from './forgebreaker_recipe';\n"
    "import { HIGHFLY_GEM_RECIPES } from '../professions/highfly_gem_catalog';",
    "register native Jewelcrafting recipe import")
add('src/sim/content/recipes.ts',
    "  ...FACTION_REWARD_RECIPES,\n",
    "  ...FACTION_REWARD_RECIPES,\n  ...HIGHFLY_GEM_RECIPES,\n",
    "native recipe index append")
add('src/sim/types.ts',
    "export interface ItemInstancePayload {\n",
    "export interface ItemInstancePayload {\n"
    "  /** HIGHFLY equipment-instance socket; absent for normal un-inlaid gear. */\n"
    "  highflyGem?: 'fire' | 'frost' | 'lightning' | 'air';\n",
    "one typed per-copy gem payload")
add('src/sim/sim.ts',
    "export interface PlayerMeta extends",
    "export interface PlayerMeta extends",
    "noop placeholder") if False else None
add('src/sim/sim.ts',
    "  serializeCharacter(pid: number): CharacterState | null {",
    "  /** HIGHFLY PR14: delegate to original inventory/forge + per-instance payload. */\n"
    "  inlayHighflyGem(gemItemId: string, pid = this.playerId) {\n"
    "    return inlayHighflyGem(this.ctx, pid, gemItemId);\n"
    "  }\n\n"
    "  serializeCharacter(pid: number): CharacterState | null {",
    "native Sim method, not parallel wallet")
add('src/sim/sim.ts',
    "    notifyFarmReady(this.ctx, meta);\n    return player.id;",
    "    notifyFarmReady(this.ctx, meta);\n"
    "    syncHighflyEquippedGem(this.ctx, player.id);\n"
    "    return player.id;",
    "restore ATK4 from character equipment payload")
add('src/sim/items.ts',
    "  // Recompute only after both sides of the swap exist. An ownership quest\n"
    "  // must never see its item disappear between the bag and the equipment slot.\n"
    "  ctx.onInventoryChangedForQuests(meta);\n"
    "  // The all-slots deed reads equipment, so re-check this player's triggers.\n"
    "  ctx.markDeedsDirty(meta.entityId);\n"
    "  refreshModsForEquipmentChange(ctx, meta);\n"
    "  recalcPlayerStats(p, meta.cls, meta.equipment, ctx.playerMods(meta), meta.equipmentInstance);\n",
    "  // Recompute only after both sides of the swap exist. An ownership quest\n"
    "  // must never see its item disappear between the bag and the equipment slot.\n"
    "  ctx.onInventoryChangedForQuests(meta);\n"
    "  // The all-slots deed reads equipment, so re-check this player's triggers.\n"
    "  ctx.markDeedsDirty(meta.entityId);\n"
    "  refreshModsForEquipmentChange(ctx, meta);\n"
    "  recalcPlayerStats(p, meta.cls, meta.equipment, ctx.playerMods(meta), meta.equipmentInstance);\n"
    "  syncHighflyEquippedGem(ctx, meta.entityId);\n",
    "equip/swap ATK4 sync")
add('src/highfly/game_c1_runtime.ts',
    "function configureElement(): void {",
    """function equippedPhysicalGem(): HighflyWeaponElement {
  const g = game();
  const p = g?.sim?.player;
  const meta = p ? g.sim.players?.get(p.id) : null;
  const gem = meta?.equipmentInstance?.mainhand?.highflyGem;
  return ['fire', 'frost', 'lightning', 'air'].includes(gem) ? gem : 'base';
}
function effectiveElement(): HighflyWeaponElement {
  return testMode ? (enabled ? mode : 'base') : equippedPhysicalGem();
}
function configureElement(): void {""",
    "live element from native equipment not debug flag")
add('src/highfly/game_c1_runtime.ts',
    "const effective = enabled ? mode : 'base';",
    "const effective = effectiveElement();",
    "replace effective element in 3 exact existing sites")
add('src/highfly/game_c1_runtime.ts',
    "  element: () => (enabled ? mode : 'base'),",
    "  element: () => effectiveElement(),",
    "current element runtime reads equipped copy")
add('src/highfly/game_c1_runtime.ts',
    "  setElement: (next, active = true) => {\n"
    "    if (!HIGHFLY_WEAPON_ELEMENTS.includes(next)) return;",
    "  setElement: (next, active = true) => {\n"
    "    if (!testMode || !HIGHFLY_WEAPON_ELEMENTS.includes(next)) return;",
    "manual debug mode limited to c1test")
add('src/highfly/game_c1_runtime.ts',
    """    gem.addEventListener('click', () => {
      const effective = effectiveElement();
      toast(""",
    """    gem.addEventListener('click', () => {
      const effective = effectiveElement();
      if (!testMode && effective === 'base') {
        const outcome = game()?.sim?.inlayHighflyGem?.('highfly_fire_gem');
        if (outcome?.ok) {
          lastElementSignature = '';
          configureElement();
          toast('GEMA ÍGNEA INCRUSTADA', 'Tu arma ganó ATK4 de fuego.');
          return;
        }
        const reason = outcome?.reason;
        const help: Record<string,string> = {
          need_weapon: 'Equipá una espada, hacha u otra arma compatible.',
          forge_required: 'Acercate a una forja para incrustar gemas.',
          no_gem_item: 'Fabricá una Gema ígnea con Jewelcrafting primero.',
          already_socketed: 'Esa arma ya tiene una gema.',
        };
        toast('INCRUSTACIÓN', help[reason] ?? 'No se puede incrustar aquí.');
        return;
      }
      toast(""",
    "use real fire gem + forge from mobile GEM seat")

# Dynamic imports belong at the start of their respective leaf files; all other
# source anchors above must match the PR13-applied frozen donor exactly.
prefixes = {
 'src/sim/content/items.ts':
    "import { HIGHFLY_GEM_ITEMS } from '../professions/highfly_gem_catalog';\n",
 'src/sim/sim.ts':
    "import { inlayHighflyGem, syncHighflyEquippedGem } from './professions/highfly_gem_socket';\n",
 'src/sim/items.ts':
    "import { syncHighflyEquippedGem } from './professions/highfly_gem_socket';\n",
}
staged={}
for path, old, new, label in ops:
    s=staged.get(path)
    if s is None:
        s=(root/path).read_text(encoding='utf-8')
    count=s.count(old)
    if path == Path('src/highfly/game_c1_runtime.ts') and label.startswith('replace effective'):
        if count != 3:
            raise SystemExit(f'PR14 REFUSED {label}: found {count} not 3')
        staged[path]=s.replace(old,new)
        continue
    if count!=1 or old==new or new in s:
        raise SystemExit(f'PR14 REFUSED {label}: unexpected anchor {count}')
    staged[path]=s.replace(old,new,1)
for path,prefix in prefixes.items():
    key=Path(path)
    s=staged.get(key)
    if s is None:raise SystemExit('PR14 no staged target: '+path)
    if prefix in s:raise SystemExit('PR14 duplicate imports '+path)
    staged[key]=prefix+s
for path,src in staged.items():
    (root/path).write_text(src,encoding='utf-8')
print('HIGHFLY_V4_02_PR14_GEM_NATIVE_CATALOG_SOCKET_ATK4_SAVE=1')
