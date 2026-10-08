/**
 * HIGHFLY PR-6: Cooking source + feast EVIDENCE only.
 *
 * REUSE FIRST. This module never grants Profession XP, Character XP,
 * Training stats, a feast serving, an item, a skill point or a reward.
 * The original source of truth remains ClaudeCraft's recipe/material catalog
 * and feast.ts's one-active / one-bite-per-player server ledger.
 */
import { ITEMS } from '../data';
import type { ProfessionRecipeRecord } from './types';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

export type CookingSource = 'farming' | 'fishing' | 'monster';
export type CookingFeastAction = 'placed' | 'served';
const MAX_EVIDENCE_KEYS = 256;
const MAX_EVIDENCE_VALUE = 1_000_000_000;

/** Deliberately limited to inspected real starter ingredients. Expand by
 * authored/catalog-verified item tags, NOT fragile substring heuristics. */
export const COOKING_SOURCE_INGREDIENTS: Readonly<Record<CookingSource, readonly string[]>> = {
  farming: ['brook_carrot', 'fine_brook_carrot', 'vale_wheat'],
  fishing: ['raw_river_perch'],
  monster: ['spider_leg'],
};

export function cookingRecipeSources(
  recipe: Pick<ProfessionRecipeRecord,'professionId'|'reagents'>,
): CookingSource[] {
  if (recipe.professionId !== 'cooking') return [];
  const items = new Set(recipe.reagents.map(r=>r.itemId));
  return (['farming','fishing','monster'] as const).filter(source =>
    COOKING_SOURCE_INGREDIENTS[source].some(id=>items.has(id)));
}

function incrementEvidence(
  old: SavedHighflyProfessionStateV1 | undefined,
  keys: readonly string[],
): SavedHighflyProfessionStateV1 | undefined {
  if (!old || keys.length === 0) return old;
  const evidence = { ...(old.evidence ?? {}) };
  let updated = false;
  for (const key of keys) {
    if (!(key in evidence) && Object.keys(evidence).length >= MAX_EVIDENCE_KEYS) continue;
    const prior = Number.isFinite(evidence[key]) ? evidence[key] : 0;
    const next = Math.min(MAX_EVIDENCE_VALUE, Math.max(0,prior) + 1);
    if (prior === next) continue;
    evidence[key] = next;
    updated = true;
  }
  return updated ? { ...old, evidence } : old;
}

/** Award only after a successful, real Claude item mint. */
export function recordCookingCraftEvidence(
  career: SavedHighflyProfessionStateV1 | undefined,
  recipe: ProfessionRecipeRecord,
): SavedHighflyProfessionStateV1 | undefined {
  if (recipe.professionId !== 'cooking') return career;
  const keys = cookingRecipeSources(recipe).map(s=>`cooking.source.${s}`);
  const output=ITEMS[recipe.resultItemId];
  if (output && 'feast' in output && output.feast) keys.push('cooking.feast.crafted');
  return incrementEvidence(career,keys);
}

/** No empty state on legacy saves or feast use by a non-cook. Placing and
 * serving pay EVIDENCE, never XP. This is an anti-farming proof counter,
 * not a second character progress system. */
export function recordCookingFeastEvidence(
  career: SavedHighflyProfessionStateV1 | undefined,
  action: CookingFeastAction,
): SavedHighflyProfessionStateV1 | undefined {
  if (!career || !(career.craftXp?.cooking || career.trialTracks?.includes('cooking'))) return career;
  return incrementEvidence(career,[`cooking.feast.${action}`]);
}

export interface CookingEvidenceSnapshot {
  sourceProofs: Record<CookingSource,number>;
  feastCrafts: number;
  feastPlacements: number;
  feastServings: number;
  /** Distinguish PR-6 service evidence from crafting XP. */
  feastServiceXp: 0;
}
export function cookingEvidenceSnapshot(
  career: SavedHighflyProfessionStateV1 | undefined,
): CookingEvidenceSnapshot {
  return {
    sourceProofs: {
      farming: career?.evidence?.['cooking.source.farming'] ?? 0,
      fishing: career?.evidence?.['cooking.source.fishing'] ?? 0,
      monster: career?.evidence?.['cooking.source.monster'] ?? 0,
    },
    feastCrafts: career?.evidence?.['cooking.feast.crafted'] ?? 0,
    feastPlacements: career?.evidence?.['cooking.feast.placed'] ?? 0,
    feastServings: career?.evidence?.['cooking.feast.served'] ?? 0,
    feastServiceXp: 0,
  };
}
