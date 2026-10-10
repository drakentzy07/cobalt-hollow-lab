/** HIGHFLY V4-02 / PR-14 — one inlay per real equipped weapon copy.
 * SIM authoritative. Uses existing forge distance, bag removal, native
 * equipment instance payload and existing Basic ATK4 elemental resolver.
 * Never awards Core stats, XP, items, recipes or affinity for loose inventory.
 */
import { ITEMS, STATIONS } from '../data';
import { isAtStation } from './stations';
import { configureHighflyWeaponElement, type HighflyWeaponElement } from '../combat/highfly_elemental_basic';
import type { SimContext } from '../sim_context';

export type HighflyGemMode = Exclude<HighflyWeaponElement, 'base'>;
export type HighflyGemInlayResult = { ok: true; gem: HighflyGemMode; weaponId: string }
  | { ok: false; reason: 'no_hunter' | 'invalid_gem' | 'need_weapon' |
       'forge_required' | 'already_socketed' | 'no_gem_item' };

const GEM_ITEMS: Readonly<Record<string, HighflyGemMode>> = {
  highfly_fire_gem: 'fire',
};

const MODES: ReadonlySet<string> = new Set(['fire','frost','lightning','air']);

/** Read ONLY native equipped-instance payload. Never trust HUD mode or a loose gem. */
export function highflyEquippedGem(ctx: SimContext, pid: number): HighflyWeaponElement {
  const meta=ctx.players.get(pid);
  if (!meta) return 'base';
  const weaponId=meta.equipment.mainhand;
  if (!weaponId || ITEMS[weaponId]?.kind!=='weapon') return 'base';
  const raw=meta.equipmentInstance?.mainhand?.highflyGem;
  return typeof raw==='string' && MODES.has(raw) ? raw as HighflyGemMode : 'base';
}

/** Refresh the existing ATK4 state after a load/equip/inlay; no second combat system. */
export function syncHighflyEquippedGem(ctx: SimContext,pid: number): void {
  const entity=ctx.entities.get(pid),meta=ctx.players.get(pid);
  if (!entity || !meta) return;
  const gem=highflyEquippedGem(ctx,pid);
  configureHighflyWeaponElement(entity,meta.equipment.mainhand,gem,gem!=='base');
}

/** Called through real Sim method; the existing native forge is a hard gate.
 * The consumed physical gem is moved into THIS ONE equipment instance.
 * Refuses overwrites to prevent deletion of a previously earned gem.
 */
export function inlayHighflyGem(ctx: SimContext,pid: number,gemItemId: string): HighflyGemInlayResult {
  const meta=ctx.players.get(pid),actor=ctx.entities.get(pid);
  if (!meta || !actor || actor.kind!=='player') return {ok:false,reason:'no_hunter'};
  const gem=GEM_ITEMS[gemItemId];
  if (!gem || !ITEMS[gemItemId]) return {ok:false,reason:'invalid_gem'};
  const weaponId=meta.equipment.mainhand;
  if (!weaponId || ITEMS[weaponId]?.kind!=='weapon') return {ok:false,reason:'need_weapon'};
  if (!isAtStation(STATIONS,actor.pos,'forge')) return {ok:false,reason:'forge_required'};
  if (meta.equipmentInstance?.mainhand?.highflyGem) return {ok:false,reason:'already_socketed'};
  if (ctx.countItem(gemItemId,pid)<1) return {ok:false,reason:'no_gem_item'};
  // Original SimContext removal owns the real inventory and save, exactly once.
  ctx.removeItem(gemItemId,1,pid);
  meta.equipmentInstance ??= {};
  meta.equipmentInstance.mainhand={
    ...(meta.equipmentInstance.mainhand??{}),
    highflyGem:gem,
  };
  syncHighflyEquippedGem(ctx,pid);
  return {ok:true,gem,weaponId};
}
