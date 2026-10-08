/**
 * HIGHFLY PR-1: additional, OPTIONAL profession career state.
 *
 * ClaudeCraft remains the authority for craftSkills, knownRecipes,
 * gathering proficiency, archetypes, commissions, Deeds and Renown.
 * This module only validates/saves HIGHFLY's future career metadata.
 * NO XP awards, stat changes, random draws or gameplay hooks here.
 */
export interface SavedHighflyProfessionStateV1 {
  version: 1;
  craftXp?: Record<string, number>;
  practice?: Record<string, number>;
  completedTrials?: string[];
  knowledge?: string[];
  discoveries?: string[];
  legendaryProfessions?: string[];
  legendaryArchetypes?: string[];
  evidence?: Record<string, number>;
  discoveredSources?: string[];
}

// Conservative caps prevent a malformed/tampered JSONB character from
// causing an unbounded save, without filtering IDs against a changing catalog.
const MAX_ENTRIES = 256;
const MAX_ID_CHARS = 128;
const MAX_XP = 1_000_000_000_000;
const MAX_EVIDENCE = 1_000_000_000;
const MAX_PRACTICE = 31; // saturation: 31+ already shares the last band
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
const LISTS = [
  'completedTrials',
  'knowledge',
  'discoveries',
  'legendaryProfessions',
  'legendaryArchetypes',
  'discoveredSources',
] as const;
const MAPS = ['craftXp', 'practice', 'evidence'] as const;

type ListKey = (typeof LISTS)[number];
type MapKey = (typeof MAPS)[number];

function record(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function safeId(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length >= 1 && value.length <= MAX_ID_CHARS &&
    ID.test(value) && value !== '__proto__' &&
    value !== 'prototype' && value !== 'constructor';
}

function boundedList(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of input) {
    if (!safeId(value) || seen.has(value)) continue;
    out.push(value);
    seen.add(value);
    if (out.length >= MAX_ENTRIES) break;
  }
  return out.length ? out : undefined;
}

function boundedMap(input: unknown, kind: MapKey): Record<string, number> | undefined {
  if (!record(input)) return undefined;
  const out: Record<string, number> = {};
  const ceiling = kind === 'craftXp' ? MAX_XP :
    kind === 'practice' ? MAX_PRACTICE : MAX_EVIDENCE;
  for (const [id, value] of Object.entries(input)) {
    if (!safeId(id) || typeof value !== 'number' ||
        !Number.isFinite(value) || value <= 0) continue;
    const bounded = Math.min(ceiling, kind === 'craftXp' ? value : Math.floor(value));
    if (bounded <= 0) continue;
    out[id] = bounded;
    if (Object.keys(out).length >= MAX_ENTRIES) break;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Absent, empty, unsupported-version or junk data loads as ABSENT. */
export function normalizeHighflyProfessionState(
  input: unknown,
): SavedHighflyProfessionStateV1 | undefined {
  if (!record(input) || input.version !== 1) return undefined;
  const out: SavedHighflyProfessionStateV1 = { version: 1 };
  let populated = false;
  for (const key of MAPS) {
    const field = boundedMap(input[key], key);
    if (field) {
      out[key] = field;
      populated = true;
    }
  }
  for (const key of LISTS) {
    const field = boundedList(input[key]);
    if (field) {
      out[key] = field;
      populated = true;
    }
  }
  return populated ? out : undefined;
}

/** The default is no JSONB key at all: existing saves stay sparse. */
export function savedHighflyProfessionFragment(
  input: SavedHighflyProfessionStateV1 | undefined,
): { highflyProfessions?: SavedHighflyProfessionStateV1 } {
  const normalized = normalizeHighflyProfessionState(input);
  return normalized ? { highflyProfessions: normalized } : {};
}
