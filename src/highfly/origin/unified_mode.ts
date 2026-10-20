/** HIGHFLY ORIGIN — single-app world/laboratory mode contract.
 *
 * This module is deliberately side-effect-free. It describes the two profiles
 * for the future unified launcher without activating a lab or migrating
 * existing saves. Do NOT infer the mode from a Pages URL or character name.
 *
 * Integration MUST make the launcher choose the mode explicitly, then route
 * load/write/reset/autosave and combat flags through that same selection.
 */
export type HighflyOriginMode = 'world' | 'lab';
export const HIGHFLY_LAB_LEVEL = 99 as const;

/** The production keys are existing F1 keys: changing them loses Draken. */
export const HIGHFLY_ORIGIN_MODE_CONTRACT = {
  world: {
    label: 'Entrar al mundo',
    saveDb: 'highfly-offline',
    saveSlot: 'origin-f1:primary',
    saveLocal: 'highfly.origin.primary.v1',
    levelOverride: null,
    temporarySkillAccess: false,
    progressAffectsHunter: true,
  },
  lab: {
    label: 'Entrar al laboratorio',
    saveDb: 'highfly-offline-lab99-v1',
    saveSlot: 'origin-lab99:primary',
    saveLocal: 'highfly.origin.lab99.primary.v1',
    levelOverride: HIGHFLY_LAB_LEVEL,
    temporarySkillAccess: true,
    progressAffectsHunter: false,
  },
} as const;

/** An absent/invalid choice must never open developer privileges. */
export function normalizeHighflyOriginMode(value: unknown): HighflyOriginMode {
  return value === 'lab' ? 'lab' : 'world';
}

export function highflyOriginModeContract(mode: HighflyOriginMode) {
  return HIGHFLY_ORIGIN_MODE_CONTRACT[mode];
}
