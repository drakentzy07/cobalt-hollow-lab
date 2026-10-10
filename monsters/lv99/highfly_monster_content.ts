/** HIGHFLY Monster Content Pass 01 (LV21-99). No new XP, loot, professions or boss engine.
 * Curated native ClaudeCraft donors keep their mechanics/rig-family fallbacks.
 * This catalog is spawnable by the existing Sim; physical encounter placement is
 * a separate, explicit zone/arena gate. Extended LV100+ is intentionally CLOSED.
 */
import type { MobTemplate, LootEntry } from '../../sim/types';

export const HIGHFLY_MONSTER_MAX_LEVEL = 99 as const;
export const HIGHFLY_EXTENDED_MONSTERS_ENABLED = false as const;
export const HIGHFLY_MONSTER_BANDS = [
  [21, 29], [30, 39], [40, 49], [50, 59], [60, 69],
  [70, 79], [80, 89], [90, 99],
] as const;

/** Each donor is a shipped combat mob (not a quest boss, pet, summon, egg or dummy). */
export const HIGHFLY_MONSTER_DONORS = [
  { key: 'wolf', sourceId: 'forest_wolf', materialIds: ['wolf_fang'] },
  { key: 'spider', sourceId: 'webwood_spider', materialIds: ['spider_leg'] },
  { key: 'skeleton', sourceId: 'restless_bones', materialIds: ['bone_fragments'] },
  { key: 'ogre', sourceId: 'thornpeak_ogre', materialIds: ['ogre_toe_ring', 'cracked_ogre_tusk'] },
  { key: 'revenant', sourceId: 'boneclad_revenant', materialIds: ['bone_fragments'] },
  { key: 'dragonkin', sourceId: 'dragonkin_broodguard', materialIds: [] },
  { key: 'elemental', sourceId: 'stormcrag_elemental', materialIds: [] },
  { key: 'stalker', sourceId: 'ridge_stalker', materialIds: [] },
] as const;

export function highflyMonsterId(key: string, low: number): string {
  return `hf_hunt_${key}_${low}`;
}

function boundedLevel(value: number): number {
  if (!Number.isInteger(value) || value < 21 || value > HIGHFLY_MONSTER_MAX_LEVEL)
    throw new RangeError('HIGHFLY_MONSTER_LEVEL_OUT_OF_RANGE');
  return value;
}

export function highflyMonsterKillXpMultiplier(level: number): number {
  const l = boundedLevel(level);
  // PF-6 keeps sole authority for grants and player XP; this is a MobTemplate
  // coefficient like native elite/xpMult. Tuning requires player/device E2E.
  return Number((1 + (l - 20) * 0.04).toFixed(2));
}

function nativeMaterialLoot(source: MobTemplate, materialIds: readonly string[], low: number): LootEntry[] {
  // No quest loot, boss chase gear, event items or duplicated corpse materials.
  // One guaranteed native copper row per normal hunt + genuine donor material rows.
  const copper = source.loot.find((entry) => 'copper' in entry && entry.chance === 1);
  const originalCopper = copper && typeof copper.copper === 'number' ? copper.copper : 20;
  const coins = Math.max(1, Math.round(originalCopper * (1 + (low - 20) * 0.075)));
  const loot: LootEntry[] = [{ copper: coins, chance: 1 }];
  for (const entry of source.loot) {
    if ('itemId' in entry && typeof entry.itemId === 'string' && materialIds.includes(entry.itemId) && !('questId' in entry))
      loot.push({ ...entry });
  }
  return loot;
}

/** Pure, deterministic, append-only registrations. Nothing is spawned here.
 * Original donor IDs/quests/loot remain byte-for-byte intact.
 */
export function buildHighflyMonsterRoster(original: Readonly<Record<string, MobTemplate>>): Record<string, MobTemplate> {
  const additions: Record<string, MobTemplate> = {};
  for (const donor of HIGHFLY_MONSTER_DONORS) {
    const source = original[donor.sourceId];
    if (!source || source.boss || source.rare || source.elite ||
      source.dummy || source.ambient || source.worldBoss || source.requiresQuestId) {
      throw new Error('HIGHFLY_MONSTER_DONOR_UNSAFE:' + donor.sourceId);
    }
    if (!(source.hpPerLevel > 0) || !(source.dmgPerLevel > 0)) {
      throw new Error('HIGHFLY_MONSTER_DONOR_SCALING_INVALID:' + donor.sourceId);
    }
    for (const [minLevel, maxLevel] of HIGHFLY_MONSTER_BANDS) {
      const id = highflyMonsterId(donor.key, minLevel);
      if (id in original || id in additions) throw new Error('HIGHFLY_MONSTER_ID_COLLISION:' + id);
      const midpoint = Math.floor((minLevel + maxLevel) / 2);
      const variant: MobTemplate = {
        ...source,
        id,
        name: `${source.name} — HIGHFLY ${minLevel}–${maxLevel}`,
        minLevel,
        maxLevel,
        // Real HP/damage/armor are computed by donor createMob at actual spawn level.
        // No skill/gear/Training stats are awarded by this content registry.
        xpMult: highflyMonsterKillXpMultiplier(midpoint),
        loot: nativeMaterialLoot(source, donor.materialIds, minLevel),
        componentTags: source.componentTags ? [...source.componentTags] : undefined,
        offStreamIdle: true,
        untameable: true,
        // Remove donor-specific quest or reinforcements pointing to old mob IDs.
        requiresQuestId: undefined,
        summonAdds: undefined,
      };
      additions[id] = variant;
    }
  }
  return additions;
}
