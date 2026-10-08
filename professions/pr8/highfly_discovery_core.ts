/**
 * HIGHFLY PR-8 — Discovery Core. All secrets are explicitly AUTHORED.
 *
 * Event → profession → indexed candidate definitions; no frame polling,
 * RNG rolls, procedural recipes, secret-total UI, or automatic item/skill
 * grants. Discovery is a lasting personal achievement, DISTINCT from
 * Knowledge, a known Claude recipe, a Trial, and Legendary status.
 *
 * Initial dispatch: post-commit craftSuccess in PR-7's existing seam ONLY.
 * Other trigger names are CONTRACT for future phase integrations, not claims
 * that those sources are implemented or wired at PR-8.
 */
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';
import type { ProfessionRecipeRecord } from './types';

export const HIGHFLY_DISCOVERY_TRIGGERS = [
  'craftSuccess', 'gatherSuccess', 'harvestCorpse', 'itemAcquire',
  'bossKill', 'questComplete', 'documentInterpret', 'stationUse',
  'inspectWorldObject', 'enterLocation',
] as const;
export type HighflyDiscoveryTrigger = typeof HIGHFLY_DISCOVERY_TRIGGERS[number];

export interface HighflyDiscoveryDefinition {
  id: string;
  trigger: HighflyDiscoveryTrigger;
  professionId: string;
  conditions: {
    /** At least one of these actually committed recipes must trigger the check. */
    triggeringRecipes: readonly string[];
    allKnowledge: readonly string[];
    allEvidence: readonly string[];
  };
  rewards: { journalMarker: string };
}

/** Small real-craft pilots, derived from PR-6/7 verified source IDs. */
export const HIGHFLY_DISCOVERY_PILOT: readonly HighflyDiscoveryDefinition[] = [
  {
    id: 'discovery.smith.copper_echo', trigger: 'craftSuccess',
    professionId: 'weaponcrafting',
    conditions: {
      triggeringRecipes: [
        'recipe_eastbrook_arming_sword', 'recipe_copper_bearded_axe',
      ],
      allKnowledge: ['material.copper_ore', 'technique.basic_forging'],
      allEvidence: [
        'knowledge.craft.recipe_eastbrook_arming_sword',
        'knowledge.craft.recipe_copper_bearded_axe',
      ],
    },
    rewards: { journalMarker: 'journal.smith.copper_echo' },
  },
  {
    id: 'discovery.smith.chainward_insight', trigger: 'craftSuccess',
    professionId: 'armorcrafting',
    conditions: {
      triggeringRecipes: [
        'recipe_eastbrook_chain_vest', 'recipe_eastbrook_warded_leggings',
      ],
      allKnowledge: ['material.copper_ore', 'technique.basic_armoring'],
      allEvidence: [
        'knowledge.craft.recipe_eastbrook_chain_vest',
        'knowledge.craft.recipe_eastbrook_warded_leggings',
      ],
    },
    rewards: { journalMarker: 'journal.smith.chainward_insight' },
  },
  {
    id: 'discovery.cooking.three_sources', trigger: 'craftSuccess',
    professionId: 'cooking',
    conditions: {
      triggeringRecipes: [
        'recipe_eastbrook_glazed_carrots', 'recipe_pan_seared_perch',
        'recipe_tough_jerky',
      ],
      allKnowledge: ['technique.diverse_provisions'],
      allEvidence: [
        'cooking.source.farming', 'cooking.source.fishing',
        'cooking.source.monster',
      ],
    },
    rewards: { journalMarker: 'journal.cooking.three_sources' },
  },
];

export interface HighflyDiscoveryEvent {
  trigger: HighflyDiscoveryTrigger;
  professionId: string;
  /** Only for craftSuccess; caller must be the existing server craft commit. */
  recipeId?: string;
}

const MAX_SAVED_DISCOVERIES = 256;
const KEY = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
const keyFor = (trigger: string, profession: string) => `${trigger}:${profession}`;

/** Stable prebuilt index; no full catalog scan at every event or sim tick. */
const DISCOVERY_BY_EVENT = new Map<string, readonly HighflyDiscoveryDefinition[]>();
{
  const staged = new Map<string, HighflyDiscoveryDefinition[]>();
  for (const def of HIGHFLY_DISCOVERY_PILOT) {
    const key = keyFor(def.trigger, def.professionId);
    const group = staged.get(key) ?? [];
    group.push(def);
    staged.set(key, group);
  }
  for (const [key, group] of staged) DISCOVERY_BY_EVENT.set(key, Object.freeze(group));
}

export function highflyDiscoveryCandidates(
  trigger: HighflyDiscoveryTrigger,
  professionId: string,
): readonly HighflyDiscoveryDefinition[] {
  return DISCOVERY_BY_EVENT.get(keyFor(trigger, professionId)) ?? [];
}

function eligible(
  def: HighflyDiscoveryDefinition,
  state: SavedHighflyProfessionStateV1,
  event: HighflyDiscoveryEvent,
): boolean {
  if (def.trigger !== event.trigger || def.professionId !== event.professionId) return false;
  if (def.trigger === 'craftSuccess' &&
    (!event.recipeId || !def.conditions.triggeringRecipes.includes(event.recipeId))) return false;
  const knowledge = new Set(state.knowledge ?? []);
  const evidence = state.evidence ?? {};
  return def.conditions.allKnowledge.every(id => knowledge.has(id)) &&
    def.conditions.allEvidence.every(id => (evidence[id] ?? 0) >= 1);
}

/** Discovery is committed AFTER source evidence and Knowledge. No grant beyond
 * sparse saved ID; the journal marker is authored metadata for future UI. */
export function recordHighflyDiscoveryEvent(
  previous: SavedHighflyProfessionStateV1 | undefined,
  event: HighflyDiscoveryEvent,
): SavedHighflyProfessionStateV1 | undefined {
  if (!previous || event.trigger !== 'craftSuccess') return previous;
  const candidates = highflyDiscoveryCandidates(event.trigger, event.professionId);
  if (candidates.length === 0) return previous;
  const discovered = [...(previous.discoveries ?? [])];
  let updated = false;
  for (const def of candidates) {
    if (discovered.includes(def.id) || !eligible(def, previous, event)) continue;
    if (discovered.length >= MAX_SAVED_DISCOVERIES) break;
    discovered.push(def.id);
    updated = true;
  }
  return updated ? { ...previous, discoveries: discovered } : previous;
}

export function recordHighflyDiscoveryFromCraft(
  state: SavedHighflyProfessionStateV1 | undefined,
  recipe: Pick<ProfessionRecipeRecord, 'id' | 'professionId'>,
): SavedHighflyProfessionStateV1 | undefined {
  return recordHighflyDiscoveryEvent(state, {
    trigger:'craftSuccess', professionId: recipe.professionId, recipeId:recipe.id,
  });
}

export interface HighflyDiscoveryReadout {
  /** Never include not-yet-discovered titles, conditions, totals or IDs. */
  discovered: { id: string; journalMarker: string }[];
  discoveredCount: number;
}
export function highflyDiscoveryReadout(
  state: SavedHighflyProfessionStateV1 | undefined,
): HighflyDiscoveryReadout {
  const discovered = (state?.discoveries ?? []).flatMap(id => {
    const def = HIGHFLY_DISCOVERY_PILOT.find(d => d.id === id);
    return def ? [{id, journalMarker:def.rewards.journalMarker}] : [];
  });
  return { discovered, discoveredCount: state?.discoveries?.length ?? 0 };
}

/** Validate authored metadata against known real recipe IDs in a TEST, not
 * by trusting arbitrary game input at runtime. */
export function highflyDiscoveryCatalogValid(): boolean {
  const ids = HIGHFLY_DISCOVERY_PILOT.map(d=>d.id);
  if (new Set(ids).size !== ids.length) return false;
  return HIGHFLY_DISCOVERY_PILOT.every(d =>
    KEY.test(d.id) && KEY.test(d.professionId) &&
    HIGHFLY_DISCOVERY_TRIGGERS.includes(d.trigger) &&
    KEY.test(d.rewards.journalMarker) &&
    d.conditions.triggeringRecipes.length > 0 &&
    d.conditions.allKnowledge.length > 0 &&
    d.conditions.allEvidence.length > 0 &&
    new Set(d.conditions.triggeringRecipes).size === d.conditions.triggeringRecipes.length &&
    [...d.conditions.triggeringRecipes,...d.conditions.allKnowledge,...d.conditions.allEvidence]
      .every(k => KEY.test(k)));
}
