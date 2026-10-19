import type { CharacterState } from '../sim/character_state';
import type { PlayerClass } from '../sim/types';
import { HIGHFLY_TRAINING_SCHEMA_VERSION, type HighflyHunterProfile } from '../highfly/training/core';
import type { OriginF1Save } from '../highfly/origin/f1_core';

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

const DB_NAME = 'highfly-offline';
const STORE_NAME = 'saves';
const PRIMARY_SLOT_KEY = 'primary';
const LOCAL_KEY = 'highfly.offline.primary.v1';

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

function readLocal(): HighflyOfflineSave | null {
  try {
    const raw = globalThis.localStorage?.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(save: HighflyOfflineSave): void {
  try {
    globalThis.localStorage?.setItem(LOCAL_KEY, JSON.stringify(save));
  } catch {
    // IndexedDB below remains the durable path when localStorage is unavailable/full.
  }
}

function openDb(): Promise<IDBDatabase | null> {
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
      const request = indexedDB.open(DB_NAME, 1);
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

async function readIdbKey(key: string): Promise<HighflyOfflineSave | null> {
  const db = await openDb();
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

async function writeIdb(save: HighflyOfflineSave): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // "primary" is only the last-played pointer/snapshot used by the launcher.
      // The identity slot preserves each tested Hunter independently.
      store.put(save, PRIMARY_SLOT_KEY);
      store.put(save, identitySlotKey(save.playerClass, save.name));
      if (save.trainingProfile && validTrainingProfile(save.trainingProfile) &&
          trainingProfileMatchesClass(save.trainingProfile, save.playerClass)) {
        const trainingSlot: HighflyTrainingSlot = {
          version: 2,
          playerClass: save.playerClass,
          name: save.name,
          profile: save.trainingProfile,
          updatedAt: save.updatedAt,
        };
        const key = trainingSlotKey(save.playerClass, save.name);
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
): Promise<HighflyHunterProfile | null> {
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

export function writeHighflyOfflineSave(save: HighflyOfflineSave): void {
  // Keep only the last-played snapshot in localStorage (sync pagehide fallback);
  // all independent Hunter slots live in IndexedDB so they do not exhaust the
  // tiny localStorage quota as inventories grow.
  writeLocal(save);
  void writeIdb(save);
}

export function installHighflyOfflineAutosave(
  snapshot: () => HighflyOfflineSave | null,
  intervalMs = 2500,
): () => void {
  const flush = () => {
    const save = snapshot();
    if (save) writeHighflyOfflineSave(save);
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
