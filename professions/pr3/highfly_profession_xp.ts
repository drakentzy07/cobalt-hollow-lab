/**
 * HIGHFLY PR-3A — deterministic Profession XP + Practice Mastery CORE.
 *
 * Pure proposal layer. It does NOT call gainCraftSkill, grantXp, any inventory,
 * Training, buffs, RNG or GameServer path. PR-3B / PR-4 will integrate gated
 * actions after baseline-parity, promotions and migration checks.
 *
 * Model numbers are provisional until play/economy simulation. The five-band
 * model sums to 2,261,500 XP for 0->125 and NEVER raises Claude's cap 125.
 */
import { CRAFT_RING } from '../content/professions';
import {
  normalizeHighflyProfessionState,
  type SavedHighflyProfessionStateV1,
} from './highfly_profession_state';

const CRAFT_IDS = new Set(CRAFT_RING.map(c => c.id));
const MAX_SKILL = 125;
const MAX_SAVED_XP = 1_000_000_000_000;
const MAX_TRACKED_KEYS = 256;
const BASE_ACTION_XP = 1000;

// Provisional skill-band budgets; simulation may change them in a later PR.
export const PROFESSION_XP_BANDS = [
  { start: 0, endExclusive: 25, perStep: 4460 },
  { start: 25, endExclusive: 50, perStep: 8000 },
  { start: 50, endExclusive: 75, perStep: 14000 },
  { start: 75, endExclusive: 100, perStep: 24000 },
  { start: 100, endExclusive: 125, perStep: 40000 },
] as const;

export interface HighflyProfessionProgressInput {
  /** Already committed Claude raw skill: the sole gameplay authority. */
  currentSkill: number;
  state?: SavedHighflyProfessionStateV1;
  professionId: string;
  source: 'craft' | 'apply_enchant' | 'disenchant';
  /** Existing authored recipe/enchant/action id. */
  contentId: string;
  /** Existing Claude orange/yellow/green/gray/ceiling learning weight. */
  learningMultiplier: number;
  /** Data-driven modifier, default 1; 0 suppresses learning. */
  sourceModifier?: number;
}

export interface HighflyProfessionProgressResult {
  state?: SavedHighflyProfessionStateV1;
  professionXpGranted: number;
  /** Potential Claude skill increment, NOT automatically written. */
  skillDelta: number;
  newSkill: number;
  /** Fractional learning quantity for later Character XP integration. */
  learningCredit: number;
  /** PR-4 owns promotion, always false in this phase. */
  promotionReady: false;
  practiceMultiplier: number;
}

function stepXpForRawSkill(skill: number): number {
  for (const band of PROFESSION_XP_BANDS) {
    if (skill < band.endExclusive) return band.perStep;
  }
  return 0;
}

/** Cumulative total after reaching raw skill, including fractional legacy values. */
export function professionXpFloorForSkill(skill: number): number {
  if (!Number.isFinite(skill) || skill <= 0) return 0;
  let remaining = Math.min(MAX_SKILL, skill);
  let total = 0;
  for (const band of PROFESSION_XP_BANDS) {
    const steps = Math.min(remaining, band.endExclusive - band.start);
    if (steps > 0) {
      total += steps * band.perStep;
      remaining -= steps;
    }
    if (remaining <= 0) break;
  }
  return total;
}

/** First action = x1.5; 2-5=x1; 6-15=x.75; 16-30=x.5; 31+=x.25. */
export function professionPracticeMultiplier(priorCount: number): number {
  if (!(priorCount > 0)) return 1.5;
  if (priorCount < 5) return 1;
  if (priorCount < 15) return 0.75;
  if (priorCount < 30) return 0.5;
  return 0.25;
}

function unchanged(input: HighflyProfessionProgressInput): HighflyProfessionProgressResult {
  return {
    state: input.state,
    professionXpGranted: 0,
    skillDelta: 0,
    newSkill: input.currentSkill,
    learningCredit: 0,
    promotionReady: false,
    practiceMultiplier: 0,
  };
}

function validContentId(value: string): boolean {
  return value.length > 0 && value.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(value);
}

/**
 * Build the next Profession XP state for ONE successful action. No mutation of
 * input state, raw skill, character XP, materials or equipment.
 *
 * An old Claude skill with no XP record is seeded to its actual skill's floor
 * before earning any points. This preserves migrated fractional craftSkills.
 */
export function recordHighflyProfessionProgress(
  input: HighflyProfessionProgressInput,
): HighflyProfessionProgressResult {
  const skill = input.currentSkill;
  if (!CRAFT_IDS.has(input.professionId) ||
      !Number.isFinite(skill) || skill < 0 || skill >= MAX_SKILL ||
      !validContentId(input.contentId) ||
      !Number.isFinite(input.learningMultiplier) || input.learningMultiplier <= 0 ||
      !Number.isFinite(input.sourceModifier ?? 1) ||
      (input.sourceModifier ?? 1) <= 0) return unchanged(input);

  const key = input.source === 'craft'
    ? `recipe:${input.contentId}`
    : `action:${input.source}`;
  const prior = normalizeHighflyProfessionState(input.state);
  const practice = { ...(prior?.practice ?? {}) };
  const xpMap = { ...(prior?.craftXp ?? {}) };
  if (!Object.hasOwn(practice, key) && Object.keys(practice).length >= MAX_TRACKED_KEYS)
    return unchanged(input);
  if (!Object.hasOwn(xpMap, input.professionId) &&
      Object.keys(xpMap).length >= MAX_TRACKED_KEYS)
    return unchanged(input);

  const priorCount = Math.min(31, Math.max(0, Math.floor(practice[key] ?? 0)));
  const factor = professionPracticeMultiplier(priorCount);
  const sourceFactor = Math.min(2, input.sourceModifier ?? 1);
  const actionXp = Math.max(0, Math.min(
    100_000,
    BASE_ACTION_XP * input.learningMultiplier * factor * sourceFactor,
  ));
  if (actionXp <= 0) return unchanged(input);

  const startXp = Math.max(
    professionXpFloorForSkill(skill),
    xpMap[input.professionId] ?? 0,
  );
  const nextXp = Math.min(MAX_SAVED_XP, startXp + actionXp);
  const deltaXp = Math.max(0, nextXp - startXp);
  if (!(deltaXp > 0)) return unchanged(input);

  // A grant might bridge several thresholds. Never skip past the skill cap.
  let nextSkill = skill;
  const startWhole = Math.floor(skill);
  for (let nextWhole = startWhole + 1; nextWhole <= MAX_SKILL; nextWhole++) {
    if (nextXp < professionXpFloorForSkill(nextWhole)) break;
    nextSkill = nextWhole;
  }
  xpMap[input.professionId] = nextXp;
  practice[key] = Math.min(31, priorCount + 1);
  const nextState: SavedHighflyProfessionStateV1 = {
    ...(prior ?? { version: 1 }),
    craftXp: xpMap,
    practice,
  };
  return {
    state: nextState,
    professionXpGranted: deltaXp,
    skillDelta: nextSkill - skill,
    newSkill: nextSkill,
    learningCredit: Math.min(1, deltaXp / stepXpForRawSkill(skill)),
    promotionReady: false,
    practiceMultiplier: factor,
  };
}
