/** HIGHFLY Combat Fluidity 1.0: client input cadence only.
 * Every accepted press still asks the native Sim to validate range, costs and damage.
 * These figures are not haste, weapon speed, global cooldown or passive auto-attacks.
 */
export const HIGHFLY_FLUID_COMBO_LOCKS = [0.23, 0.25, 0.29, 0.39] as const;
export const HIGHFLY_FLUID_BUFFER_SECONDS = 0.18;
export const HIGHFLY_FLUID_CHAIN_SECONDS = 1.1;

export function highflyFluidNextStep(previous: 0 | 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  return previous === 3 ? 4 : ((previous % 3) + 1) as 1 | 2 | 3;
}

export function highflyCanBufferAttack(now: number, readyAt: number): boolean {
  return Number.isFinite(now) && Number.isFinite(readyAt) &&
    now < readyAt && readyAt - now <= HIGHFLY_FLUID_BUFFER_SECONDS;
}

export function highflyFluidRecovery(step: 1 | 2 | 3 | 4): number {
  return HIGHFLY_FLUID_COMBO_LOCKS[step - 1];
}
