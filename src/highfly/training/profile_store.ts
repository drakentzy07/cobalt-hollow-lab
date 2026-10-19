import type { HighflyHunterProfile } from './core';
import { migrateLegacyFixedCoreBaseline } from './session_core';

let activeHighflyHunterProfile: HighflyHunterProfile | null = null;

export function setActiveHighflyHunterProfile(profile: HighflyHunterProfile): void {
  activeHighflyHunterProfile = migrateLegacyFixedCoreBaseline(profile);
}

export function getActiveHighflyHunterProfile(): HighflyHunterProfile | null {
  return activeHighflyHunterProfile;
}

export function updateActiveHighflyHunterProfile(
  updater: (profile: HighflyHunterProfile) => HighflyHunterProfile,
): HighflyHunterProfile {
  if (!activeHighflyHunterProfile) {
    throw new Error('HIGHFLY Training profile is not active');
  }
  activeHighflyHunterProfile = updater(activeHighflyHunterProfile);
  return activeHighflyHunterProfile;
}

export function clearActiveHighflyHunterProfile(): void {
  activeHighflyHunterProfile = null;
}
