/**
 * HIGHFLY ORIGIN R1-1 — One Hunter identity, independent of ClaudeCraft's
 * legacy PlayerClass='hunter'. Versioned save value, no combat or stat grants.
 * This is a deliberately inert persistence bridge until R1-2 validates and
 * authorizes cross-discipline skill acquisition on the server.
 */
export interface OriginHunterProfileV1 {
  version: 1;
  identity: 'origin_hunter';
  learnedSkillIds: string[];
  skillMastery: Record<string, number>;
  unlocks: string[];
}

export function newOriginHunterProfile(): OriginHunterProfileV1 {
  return {
    version: 1,
    identity: 'origin_hunter',
    learnedSkillIds: [],
    skillMastery: {},
    unlocks: [],
  };
}

function stringIds(v: unknown, label: string): string[] {
  if (!Array.isArray(v) || v.length > 256 ||
      v.some((x) => typeof x !== 'string' || x.length === 0 || x.length > 128 ||
        !/^[a-z0-9_:-]+$/.test(x))) {
    throw new Error('ORIGIN_HUNTER_INVALID_' + label);
  }
  return [...new Set(v as string[])].sort();
}

export function restoreOriginHunterProfile(value: unknown): OriginHunterProfileV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ORIGIN_HUNTER_INVALID_SAVE');
  }
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || v.identity !== 'origin_hunter') {
    throw new Error('ORIGIN_HUNTER_UNSUPPORTED_VERSION_OR_IDENTITY');
  }
  const learnedSkillIds = stringIds(v.learnedSkillIds, 'SKILLS');
  const unlocks = stringIds(v.unlocks, 'UNLOCKS');
  if (!v.skillMastery || typeof v.skillMastery !== 'object' ||
      Array.isArray(v.skillMastery) ||
      Object.keys(v.skillMastery).length > 256) {
    throw new Error('ORIGIN_HUNTER_INVALID_MASTERY');
  }
  const skillMastery: Record<string, number> = Object.create(null) as Record<string, number>;
  for (const [id, level] of Object.entries(v.skillMastery)) {
    if (!/^[a-z0-9_:-]{1,128}$/.test(id) ||
        typeof level !== 'number' || !Number.isSafeInteger(level) ||
        level < 0 || level > 1000 || !learnedSkillIds.includes(id)) {
      throw new Error('ORIGIN_HUNTER_INVALID_MASTERY_ENTRY');
    }
    skillMastery[id] = level;
  }
  return { version: 1, identity: 'origin_hunter', learnedSkillIds, skillMastery, unlocks };
}

/** Copy and validate before writing into the authoritative CharacterState. */
export function saveOriginHunterProfile(value: OriginHunterProfileV1): OriginHunterProfileV1 {
  return restoreOriginHunterProfile(value);
}
