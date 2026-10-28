// HIGHFLY ORIGIN v0.20 - offline character storage.
import type { CharacterState } from '../sim/sim';
import type { PlayerClass } from '../sim/types';

const PREFIX = 'highfly.origin.v020.character.v1.';
const MAX_JSON = 2000000;
const VALID_CLASSES = new Set<PlayerClass>([
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman',
  'mage', 'warlock', 'druid',
]);
export function offlineSaveKey(cls: PlayerClass, name: string): string {
  return PREFIX + cls + '.' + encodeURIComponent(name.trim().toLowerCase());
}
export function browserOfflineStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}
function isCharacterState(s: unknown): s is CharacterState {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  const v = s as Record<string, unknown>;
  const pos = v.pos as Record<string, unknown> | undefined;
  return typeof v.level === 'number' &&
    Number.isInteger(v.level) && v.level >= 1 && v.level <= 99 &&
    typeof v.xp === 'number' && Number.isFinite(v.xp) && v.xp >= 0 &&
    typeof v.copper === 'number' && Number.isFinite(v.copper) &&
    typeof v.hp === 'number' && Number.isFinite(v.hp) &&
    typeof v.resource === 'number' && Number.isFinite(v.resource) &&
    !!pos && typeof pos.x === 'number' && Number.isFinite(pos.x) &&
    typeof pos.z === 'number' && Number.isFinite(pos.z) &&
    !!v.equipment && typeof v.equipment === 'object' &&
    Array.isArray(v.inventory) &&
    Array.isArray(v.questLog) &&
    Array.isArray(v.questsDone);
}
export function loadOfflineCharacter(
  storage: Pick<Storage, 'getItem'> | null,
  cls: PlayerClass,
  name: string,
): CharacterState | null {
  if (!storage || !VALID_CLASSES.has(cls)) return null;
  try {
    const raw = storage.getItem(offlineSaveKey(cls, name));
    if (!raw || raw.length > MAX_JSON) return null;
    const doc: unknown = JSON.parse(raw);
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
    const data = doc as Record<string, unknown>;
    if (data.version !== 1 || data.cls !== cls || data.name !== name) return null;
    return isCharacterState(data.state) ? data.state : null;
  } catch { return null; }
}
export function storeOfflineCharacter(
  storage: Pick<Storage, 'setItem'> | null,
  cls: PlayerClass,
  name: string,
  state: CharacterState | null,
): boolean {
  if (!storage || !VALID_CLASSES.has(cls) || !state || !isCharacterState(state)) return false;
  try {
    const raw = JSON.stringify({version:1,cls,name,savedAt:Date.now(),state});
    if (raw.length > MAX_JSON) return false;
    storage.setItem(offlineSaveKey(cls,name),raw);
    return true;
  } catch { return false; }
}
