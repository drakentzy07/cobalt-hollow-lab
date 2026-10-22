/**
 * HIGHFLY GENESIS G1: isolated level-20 training bridge for the nine original
 * ClaudeCraft classes. No class unlocks, spellbook mutations, extra levels or
 * global state. This is a candidate adapter: the runtime hook ships only after
 * authoritative client/server integration is verified.
 */
import { ALL_CLASSES, MAX_LEVEL, type PlayerClass } from '../../sim/types';
import { applyTrainingBridge, type HighflyCombatBaseline } from '../training/bridge';
import type { HighflyHunterProfile } from '../training/core';
import { resolveFreedom360, type Freedom360Stick } from '../combat/freedom_360';

export const GENESIS_G1_NATIVE_CLASSES = ALL_CLASSES;
export const GENESIS_G1_NATIVE_CAP = MAX_LEVEL;

export interface GenesisTrainingRequest {
  playerClass: PlayerClass;
  level: number;
  profile: HighflyHunterProfile | null;
  baseline: Readonly<HighflyCombatBaseline>;
  enabled: boolean;
}

export function genesisTrainingProjection(request: GenesisTrainingRequest): HighflyCombatBaseline {
  const baseline = { ...request.baseline };
  const { profile, playerClass, level, enabled } = request;
  // All nine original classes remain eligible; do not use the old universal
  // warrior carrier or apply one character's gains to another class.
  if (!enabled || !profile || !Number.isInteger(level) || level < 1 || level > MAX_LEVEL)
    return baseline;
  if (profile.awakening.classId !== playerClass || profile.hunter.level !== level)
    return baseline;
  // Training growth alone may modify stats; original class/level primary
  // baseline, talent allocation, native resource and skill gates stay intact.
  return applyTrainingBridge({
    baseline,
    core: profile.training.core,
    flags: {
      enabled: true,
      applyMovement: true,
      applyPerception: true,
      applyIntelligence: true,
    },
  }).combat;
}

/** Pure camera-relative mobile projection; does not replace Sim movement. */
export function genesisMobileMove(stick: Freedom360Stick, cameraYaw: number) {
  return resolveFreedom360(stick, cameraYaw);
}
