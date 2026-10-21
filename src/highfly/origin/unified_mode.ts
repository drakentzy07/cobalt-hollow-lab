/** HIGHFLY ORIGIN — one game, two safe save identities.
 *
 * Decision 21 Oct 2026: DrakenLAB defaults to genuine LV99 (adjustable LV1–99) with temporary
 * access to content, NOT a free-level real WORLD Hunter. The production definition
 * and progression requirements remain untouched.
 *
 * This is only a pure contract. Wiring mode-specific save instances, content
 * gates, launcher, and same-engine combat is a separate integration step.
 * NEVER use a pathname, nickname or persisted user string as a dev privilege.
 */
export type HighflyOriginMode = 'world' | 'lab';
export type HighflyPreviewContent = 'skill' | 'equipment' | 'loot' | 'recipe' | 'monster' | 'scenario';
export const HIGHFLY_LAB_START_LEVEL = 99 as const;

/** Existing Draken storage keys must remain byte-identical to F1. */
export const HIGHFLY_ORIGIN_MODE_CONTRACT = {
  world: {
    label: 'Entrar al mundo',
    saveDb: 'highfly-offline',
    saveSlot: 'origin-f1:primary',
    saveLocal: 'highfly.origin.primary.v1',
    levelOverride: null,
    temporaryContentAccess: false,
    progressAffectsHunter: true,
  },
  lab: {
    label: 'Entrar al laboratorio',
    saveDb: 'highfly-offline-lab-v1',
    saveSlot: 'origin-lab:primary',
    saveLocal: 'highfly.origin.lab.primary.v1',
    levelOverride: null,
    temporaryContentAccess: true,
    progressAffectsHunter: false,
  },
} as const;

/** An absent or invalid choice MUST fall back to the real Hunter. */
export function normalizeHighflyOriginMode(value: unknown): HighflyOriginMode {
  return value === 'lab' ? 'lab' : 'world';
}

export function highflyOriginModeContract(mode: HighflyOriginMode) {
  return HIGHFLY_ORIGIN_MODE_CONTRACT[mode];
}

/** Level-gate check for an explicitly selected preview, not the full
 * authorization to learn/equip/grant an item. Other native checks still run:
 * spell geometry, hit, resource costs, equipment type, recipes, save, etc.
 *
 * Do not alter source definitions (learnLevel/requiredLevel), set the real
 * character level to 99, or attach this bypass to an untrusted string.
 */
export function highflyMeetsContentLevelGate(
  mode: HighflyOriginMode, currentLevel: number, requiredLevel: number,
): boolean {
  if (!Number.isInteger(currentLevel) || currentLevel < 1 ||
      !Number.isInteger(requiredLevel) || requiredLevel < 1) return false;
  return mode === 'lab' || currentLevel >= requiredLevel;
}

/** Lab preview capability only; the actual item/skill must exist and be
 * selected via the tester catalog, with a native Sim path and compatible rig.
 */
export function highflyCanPreviewContent(
  mode: HighflyOriginMode, _kind: HighflyPreviewContent,
): boolean {
  return mode === 'lab';
}

/** UI/combat feature routing only. All save calls receive an explicit mode. */
let activeHighflyOriginMode: HighflyOriginMode = 'world';
export function setActiveHighflyOriginMode(mode: HighflyOriginMode): void {
  activeHighflyOriginMode = normalizeHighflyOriginMode(mode);
}
export function getActiveHighflyOriginMode(): HighflyOriginMode {
  return activeHighflyOriginMode;
}
/** Historical /lab/f2... entry paths remain independent for regression. */
export function isUnifiedOriginRuntime(): boolean {
  return typeof document !== 'undefined' &&
    document.body.classList.contains('hf-origin-unified');
}
