import type { CharacterState } from '../sim/character_state';
import { highflyOriginModeContract, type HighflyOriginMode } from '../highfly/origin/unified_mode';
import type { PlayerClass } from '../sim/types';
import { HIGHFLY_TRAINING_SCHEMA_VERSION, type HighflyHunterProfile } from '../highfly/training/core';
import { normalizeOriginF1Save, type OriginF1Save } from '../highfly/origin/f1_core';

export interface HighflyOfflineSave {
  version: 1;
  playerClass: PlayerClass;
  name: string;
  state: CharacterState;
  appearance: Record<string, unknown> | null;
  originF1?: OriginF1Save;
  trainingProfile?: HighflyHunterProfile;
  updatedAt: number;
}

interface HighflyTrainingSlot {
  version: 1 | 2;
  playerClass?: PlayerClass;
  name: string;
  profile: HighflyHunterProfile;
  updatedAt: number;
}

// The F2 Pages laboratory shares GitHub's ORIGIN with public F1, not its saves.
// Its own IndexedDB and local mirror prevent tester/reset actions touching F1.
const F27_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f27-combat-beta/');
const F263_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f263-combat-beta/');
const F262_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f262-combat-beta/');
const F261_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f261-combat-beta/');
const F26_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f26-combat-beta/');
const F25_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f25-combat-beta/');
const F24_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f24-combat-beta/');
const F23_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f23-combat-beta/');
const F22_PAGES_LAB = typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f22-combat-beta/');
const F2_PAGES_LAB = F27_PAGES_LAB || F263_PAGES_LAB || F262_PAGES_LAB || F261_PAGES_LAB || F26_PAGES_LAB || F25_PAGES_LAB || F24_PAGES_LAB || F23_PAGES_LAB || F22_PAGES_LAB || (typeof location !== 'undefined' &&
  location.pathname.startsWith('/cobalt-hollow-lab/lab/f2-combat-beta/'));
const DB_NAME = F27_PAGES_LAB ? 'highfly-offline-f27-combat-beta'
  : F263_PAGES_LAB ? 'highfly-offline-f263-combat-beta'
  : F262_PAGES_LAB ? 'highfly-offline-f262-combat-beta'
  : F261_PAGES_LAB ? 'highfly-offline-f261-combat-beta'
  : F26_PAGES_LAB ? 'highfly-offline-f26-combat-beta'
  : F25_PAGES_LAB ? 'highfly-offline-f25-combat-beta'
  : F24_PAGES_LAB ? 'highfly-offline-f24-combat-beta'
  : F23_PAGES_LAB ? 'highfly-offline-f23-combat-beta'
  : F22_PAGES_LAB ? 'highfly-offline-f22-combat-beta'
  : F2_PAGES_LAB ? 'highfly-offline-f2-combat-beta' : 'highfly-offline';
// PUBLIC PREVIEW ONLY: same app/engine, disposable saves. NEVER open production
// Draken IndexedDB, local mirror or historical F2 lab data from this path.
/** Separate Pages repository shares drakentzy07.github.io origin with Draken.
 * It MUST have its own database and mirror keys, including its Training data.
 * Never import production, historical beta or existing UNIFIED 01 saves.
 */
const UNIFIED_STANDALONE_PLAYTEST = typeof location !== 'undefined' &&
  location.pathname.startsWith('/HIGHFLY-UNIFIED-PLAYTEST/');
const UNIFIED_CANDIDATE_PREVIEW = typeof location !== 'undefined' &&
  (location.pathname.startsWith('/cobalt-hollow-lab/candidate/unified-01/') ||
   UNIFIED_STANDALONE_PLAYTEST);
const STORE_NAME = 'saves';
const PRIMARY_SLOT_KEY = 'primary';
const LOCAL_KEY = 'highfly.offline.primary.v1';
// Keep the NEW persistent Hunter separate from the old ClaudeCraft/R39 data.
// Both live under the same Pages origin and must not compete for 'primary'.
const ORIGIN_PRIMARY_SLOT_KEY = 'origin-f1:primary';
const ORIGIN_LOCAL_KEY = F27_PAGES_LAB ? 'highfly.origin.f27-combat-beta.primary.v1'
  : F263_PAGES_LAB ? 'highfly.origin.f263-combat-beta.primary.v1'
  : F262_PAGES_LAB ? 'highfly.origin.f262-combat-beta.primary.v1'
  : F261_PAGES_LAB ? 'highfly.origin.f261-combat-beta.primary.v1'
  : F26_PAGES_LAB ? 'highfly.origin.f26-combat-beta.primary.v1'
  : F25_PAGES_LAB ? 'highfly.origin.f25-combat-beta.primary.v1'
  : F24_PAGES_LAB ? 'highfly.origin.f24-combat-beta.primary.v1'
  : F23_PAGES_LAB ? 'highfly.origin.f23-combat-beta.primary.v1'
  : F22_PAGES_LAB ? 'highfly.origin.f22-combat-beta.primary.v1'
  : F2_PAGES_LAB ? 'highfly.origin.f2-combat-beta.primary.v1' : 'highfly.origin.primary.v1';
const hasOriginIdentity = (s: HighflyOfflineSave | null): boolean =>
  !!s && normalizeOriginF1Save(s.originF1) !== null;
const originIdentitySlotKey = (cls: PlayerClass, name: string, mode: HighflyOriginMode = 'world'): string =>
  (mode === 'lab' ? 'origin-lab:' : 'origin-f1:') + identitySlotKey(cls, name);
const originDbName = (mode: HighflyOriginMode): string =>
  UNIFIED_STANDALONE_PLAYTEST
    ? (mode === 'lab' ? 'highfly-unified-playtest-lab-v1' : 'highfly-unified-playtest-world-v1')
    : UNIFIED_CANDIDATE_PREVIEW
      ? (mode === 'lab' ? 'highfly-unified01-candidate-lab-v1' : 'highfly-unified01-candidate-world-v1')
      : mode === 'lab' ? highflyOriginModeContract('lab').saveDb : DB_NAME;
const originPrimarySlot = (mode: HighflyOriginMode): string =>
  UNIFIED_STANDALONE_PLAYTEST
    ? (mode === 'lab' ? 'playtest-lab:primary' : 'playtest-world:primary')
    : UNIFIED_CANDIDATE_PREVIEW
      ? (mode === 'lab' ? 'candidate-lab:primary' : 'candidate-world:primary')
      : mode === 'lab' ? highflyOriginModeContract('lab').saveSlot : ORIGIN_PRIMARY_SLOT_KEY;
const originLocalKey = (mode: HighflyOriginMode): string =>
  UNIFIED_STANDALONE_PLAYTEST
    ? (mode === 'lab' ? 'highfly.origin.unified.playtest.lab.v1' : 'highfly.origin.unified.playtest.world.v1')
    : UNIFIED_CANDIDATE_PREVIEW
      ? (mode === 'lab' ? 'highfly.origin.unified01.candidate.lab.v1' : 'highfly.origin.unified01.candidate.world.v1')
      : mode === 'lab' ? highflyOriginModeContract('lab').saveLocal : ORIGIN_LOCAL_KEY;


function normalizedHunterName(name: string): string {
  return name.trim().toLowerCase();
}

function identitySlotKey(playerClass: PlayerClass, name: string): string {
  return `hunter:${playerClass}:${encodeURIComponent(normalizedHunterName(name))}`;
}

function trainingSlotKey(playerClass: PlayerClass, name: string): string {
  return `training:${playerClass}:${encodeURIComponent(normalizedHunterName(name))}`;
}

function legacyTrainingSlotKey(name: string): string {
  return `training:${encodeURIComponent(normalizedHunterName(name))}`;
}

function valid(value: unknown): value is HighflyOfflineSave {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<HighflyOfflineSave>;
  return (
    v.version === 1 &&
    typeof v.playerClass === 'string' &&
    typeof v.name === 'string' &&
    !!v.state &&
    typeof v.state === 'object' &&
    typeof v.updatedAt === 'number'
  );
}

function validTrainingProfile(value: unknown): value is HighflyHunterProfile {
  if (!value || typeof value !== 'object') return false;
  const v = value as {
    schemaVersion?: unknown;
    scoringVersion?: unknown;
    profileId?: unknown;
    training?: unknown;
    hunter?: unknown;
  };
  return (
    typeof v.schemaVersion === 'number' &&
    v.schemaVersion >= 1 &&
    v.schemaVersion <= HIGHFLY_TRAINING_SCHEMA_VERSION &&
    typeof v.scoringVersion === 'string' &&
    typeof v.profileId === 'string' &&
    !!v.training &&
    typeof v.training === 'object' &&
    !!v.hunter &&
    typeof v.hunter === 'object'
  );
}

function validTrainingSlot(value: unknown): value is HighflyTrainingSlot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<HighflyTrainingSlot>;
  return (
    (v.version === 1 || v.version === 2) &&
    typeof v.name === 'string' &&
    typeof v.updatedAt === 'number' &&
    validTrainingProfile(v.profile)
  );
}

function readLocal(key = LOCAL_KEY): HighflyOfflineSave | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(save: HighflyOfflineSave, mode: HighflyOriginMode = 'world'): void {
  try {
    globalThis.localStorage?.setItem(
      UNIFIED_CANDIDATE_PREVIEW ? originLocalKey(mode) : hasOriginIdentity(save) ? originLocalKey(mode) : LOCAL_KEY, JSON.stringify(save),
    );
  } catch {
    // IndexedDB below remains the durable path when localStorage is unavailable/full.
  }
}

function openDb(dbName = DB_NAME): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    // F1.1 Android: a stalled/blocked IndexedDB open must never strand the
    // character creator or world entry. The synchronous primary localStorage
    // mirror remains a safe recovery path when IDB cannot open.
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close(); // Late success after timeout: release the handle.
        return;
      }
      settled = true;
      if (timer !== null) clearTimeout(timer);
      resolve(db);
    };
    timer = setTimeout(() => finish(null), 7000);
    try {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch {
      finish(null);
    }
  });
}

async function readIdbKey(key: string, dbName = DB_NAME): Promise<HighflyOfflineSave | null> {
  const db = await openDb(dbName);
  if (!db) return null;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (value: HighflyOfflineSave | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => finish(valid(request.result) ? request.result : null);
      request.onerror = () => finish(null);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        finish(null);
      };
      tx.onabort = () => {
        db.close();
        finish(null);
      };
    } catch {
      db.close();
      finish(null);
    }
  });
}

async function readIdbTrainingSlot(key: string): Promise<HighflyTrainingSlot | null> {
  const db = await openDb();
  if (!db) return null;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (value: HighflyTrainingSlot | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => finish(validTrainingSlot(request.result) ? request.result : null);
      request.onerror = () => finish(null);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        finish(null);
      };
      tx.onabort = () => {
        db.close();
        finish(null);
      };
    } catch {
      db.close();
      finish(null);
    }
  });
}

async function writeIdb(save: HighflyOfflineSave, mode: HighflyOriginMode = 'world'): Promise<void> {
  const db = await openDb(originDbName(mode));
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // "primary" is only the last-played pointer/snapshot used by the launcher.
      // The identity slot preserves each tested Hunter independently.
      // F1.2.1: new Hunter slots do not overwrite archived legacy identities.
      const origin = hasOriginIdentity(save);
      store.put(save, origin ? originPrimarySlot(mode) : PRIMARY_SLOT_KEY);
      store.put(save, origin
        ? originIdentitySlotKey(save.playerClass, save.name, mode)
        : identitySlotKey(save.playerClass, save.name));
      if (save.trainingProfile && validTrainingProfile(save.trainingProfile) &&
          trainingProfileMatchesClass(save.trainingProfile, save.playerClass)) {
        const trainingSlot: HighflyTrainingSlot = {
          version: 2,
          playerClass: save.playerClass,
          name: save.name,
          profile: save.trainingProfile,
          updatedAt: save.updatedAt,
        };
        const key = origin
          ? (mode === 'lab' ? 'origin-lab:' : 'origin-f1:') + trainingSlotKey(save.playerClass, save.name)
          : trainingSlotKey(save.playerClass, save.name);
        const existingRequest = store.get(key);
        existingRequest.onsuccess = () => {
          const existing = validTrainingSlot(existingRequest.result)
            ? existingRequest.result
            : null;
          // Async autosave/pagehide writes can race. Never let an older
          // in-memory snapshot overwrite a newer Training profile.
          if (!existing || trainingSlot.updatedAt >= existing.updatedAt) {
            store.put(trainingSlot, key);
          }
        };
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

function newest(
  a: HighflyOfflineSave | null,
  b: HighflyOfflineSave | null,
): HighflyOfflineSave | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}

function newestTraining(
  a: HighflyTrainingSlot | null,
  b: HighflyTrainingSlot | null,
): HighflyTrainingSlot | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}

function trainingProfileMatchesClass(
  profile: HighflyHunterProfile,
  playerClass: PlayerClass,
): boolean {
  const awakeningClass = profile.awakening?.classId;
  const hunterClass = profile.hunter?.classId;
  if (awakeningClass) return awakeningClass === playerClass;
  return hunterClass === playerClass;
}

export async function loadHighflyTrainingProfile(
  playerClass: PlayerClass,
  name: string,
  mode: HighflyOriginMode = 'world',
): Promise<HighflyHunterProfile | null> {
  // F1.2.1 restores this Hunter's actual training first, never the donor
  // Warrior's unrelated training merely because the name happens to match.
  const origin = await loadOriginHunterSave(playerClass, name, mode);
  if (origin?.trainingProfile &&
      validTrainingProfile(origin.trainingProfile) &&
      trainingProfileMatchesClass(origin.trainingProfile, playerClass)) {
    return origin.trainingProfile;
  }
  // LAB never falls through to production or historical training profiles.
  if (mode === 'lab' || UNIFIED_CANDIDATE_PREVIEW) return null;
  const originSlot = await readIdbTrainingSlot('origin-f1:' + trainingSlotKey(playerClass, name));
  if (originSlot && trainingProfileMatchesClass(originSlot.profile, playerClass))
    return originSlot.profile;
  // A beta with no training must start fresh, NEVER inherit public F1/R39 data.
  if (F2_PAGES_LAB) return null;
  const primary = newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));
  const primaryTraining =
    primary &&
    primary.playerClass === playerClass &&
    normalizedHunterName(primary.name) === normalizedHunterName(name) &&
    primary.trainingProfile &&
    validTrainingProfile(primary.trainingProfile) &&
    trainingProfileMatchesClass(primary.trainingProfile, playerClass)
      ? {
          version: 2 as const,
          playerClass,
          name: primary.name,
          profile: primary.trainingProfile,
          updatedAt: primary.updatedAt,
        }
      : null;

  const exactRaw = await readIdbTrainingSlot(trainingSlotKey(playerClass, name));
  const exact =
    exactRaw && trainingProfileMatchesClass(exactRaw.profile, playerClass)
      ? exactRaw
      : null;

  // v1 compatibility: old Training slots were keyed only by name. Adopt one
  // only when its own persisted Hunter/Awakening class matches the requested
  // identity. This prevents Warrior Training from leaking into a Mage slot.
  const legacyRaw = await readIdbTrainingSlot(legacyTrainingSlotKey(name));
  const legacy =
    legacyRaw && trainingProfileMatchesClass(legacyRaw.profile, playerClass)
      ? legacyRaw
      : null;

  return newestTraining(newestTraining(exact, primaryTraining), legacy)?.profile ?? null;
}

export async function loadHighflyOfflineSave(
  playerClass?: PlayerClass,
  name?: string,
): Promise<HighflyOfflineSave | null> {
  const primary = newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));

  // With no identity, callers want the most recently played Hunter for launcher
  // preselection. With an identity, restore ONLY that Hunter's independent slot.
  if (!playerClass || !name) return primary;

  const exact = await readIdbKey(identitySlotKey(playerClass, name));
  const matchingPrimary =
    primary?.playerClass === playerClass && primary.name === name ? primary : null;

  // The localStorage primary mirror is synchronous while IndexedDB writes are
  // async. A reload can therefore observe an older exact IDB slot alongside a
  // newer primary snapshot for the SAME Hunter. Always select by updatedAt.
  const best = newest(exact, matchingPrimary);
  if (best) return best;

  return null;
}

/** Only the new Universal Hunter; original ClaudeCraft saves remain untouched.
 * A F1/F1.1 save stored before F1.2.1 is accepted and promoted on next autosave.
 */
export async function loadOriginHunterSave(
  playerClass?: PlayerClass,
  name?: string,
  mode: HighflyOriginMode = 'world',
): Promise<HighflyOfflineSave | null> {
  const dbName = originDbName(mode);
  const ownPrimary = newest(readLocal(originLocalKey(mode)), await readIdbKey(originPrimarySlot(mode), dbName));
  // New beta means new IDB namespace, but the user should not have to repeat
  // the weapon-guide quest. Import a COPY of the last beta's valid local mirror
  // only if this lab does not already have a Hunter. Never mutate predecessor.
  const predecessor = !UNIFIED_CANDIDATE_PREVIEW && mode === 'world' && (F27_PAGES_LAB || F263_PAGES_LAB) && !ownPrimary
    ? newest(readLocal(F27_PAGES_LAB?'highfly.origin.f263-combat-beta.primary.v1':'highfly.origin.f262-combat-beta.primary.v1'),
      readLocal('highfly.origin.f261-combat-beta.primary.v1'))
    : null;
  const recovered = hasOriginIdentity(predecessor) ? predecessor : null;
  if(recovered && !ownPrimary) writeHighflyOfflineSave({...recovered,updatedAt:Date.now()}, mode);
  const oldPrimary = UNIFIED_CANDIDATE_PREVIEW || mode === 'lab' || F2_PAGES_LAB ? null : newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));
  const primary = ownPrimary ?? recovered ?? (hasOriginIdentity(oldPrimary) ? oldPrimary : null);
  if (!playerClass || !name) return primary;
  const ownExact = await readIdbKey(originIdentitySlotKey(playerClass, name, mode), dbName);
  const oldExact = UNIFIED_CANDIDATE_PREVIEW || mode === 'lab' || F2_PAGES_LAB ? null : await readIdbKey(identitySlotKey(playerClass, name));
  const exact = ownExact ?? (hasOriginIdentity(oldExact) ? oldExact : null);
  const matchingPrimary = primary && primary.playerClass === playerClass &&
    normalizedHunterName(primary.name) === normalizedHunterName(name)
    ? primary : null;
  return newest(exact, matchingPrimary);
}

/** User-confirmed device-only Hunter deletion. Never clear the shared IndexedDB
 * database: archived ClaudeCraft identity slots and unrelated data survive.
 * Returns false if the active IDB cannot be opened/deleted, so the launcher
 * cannot falsely promise a reset while a dormant save would respawn.
 */
export async function resetOriginHunterSave(mode: HighflyOriginMode = 'world'): Promise<boolean> {
  const db = await openDb(originDbName(mode));
  if (typeof indexedDB !== 'undefined' && !db) return false;
  if (db) {
    const deleted = await new Promise<boolean>(resolve => {
      let finished = false;
      const finish = (ok:boolean) => {
        if(finished) return;
        finished = true;
        db.close();
        resolve(ok);
      };
      try {
        const tx=db.transaction(STORE_NAME,'readwrite');
        const store=tx.objectStore(STORE_NAME);
        const request=store.openCursor();
        request.onsuccess=()=>{
          const cursor=request.result;
          if(!cursor) return;
          const key=String(cursor.key);
          const data=valid(cursor.value) ? cursor.value : null;
          if(mode === 'lab' ? key.startsWith('origin-lab:') :
           (key.startsWith('origin-f1:') ||
             ((key===PRIMARY_SLOT_KEY || key.startsWith('hunter:')) && hasOriginIdentity(data)))) {
            cursor.delete();
          }
          cursor.continue();
        };
        request.onerror=()=>{ try { tx.abort(); } catch { /* handled below */ } };
        tx.oncomplete=()=>finish(true);
        tx.onerror=()=>finish(false);
        tx.onabort=()=>finish(false);
      } catch {
        finish(false);
      }
    });
    if(!deleted) return false;
  }
  try {
    globalThis.localStorage?.removeItem(originLocalKey(mode));
    // Pre-namespaced F1/F1.1 saves must not resurrect the one deleted Hunter.
    if(!UNIFIED_CANDIDATE_PREVIEW && mode === 'world' && !F2_PAGES_LAB && hasOriginIdentity(readLocal())) globalThis.localStorage?.removeItem(LOCAL_KEY);
  } catch {
    return false;
  }
  return (await loadOriginHunterSave(undefined, undefined, mode)) === null;
}

export function writeHighflyOfflineSave(save: HighflyOfflineSave, mode: HighflyOriginMode = 'world'): void {
  // Keep only the last-played snapshot in localStorage (sync pagehide fallback);
  // all independent Hunter slots live in IndexedDB so they do not exhaust the
  // tiny localStorage quota as inventories grow.
  writeLocal(save, mode);
  void writeIdb(save, mode);
}

export function installHighflyOfflineAutosave(
  snapshot: () => HighflyOfflineSave | null,
  intervalMs = 2500,
  mode: HighflyOriginMode = 'world',
): () => void {
  const flush = () => {
    const save = snapshot();
    if (save) writeHighflyOfflineSave(save, mode);
  };
  const timer = window.setInterval(flush, intervalMs);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  const onPageHide = () => flush();

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  flush();

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    flush();
  };
}
