#!/usr/bin/env python3
"""HIGHFLY GOLDEN PLAY V4-03 — safe ONE-WAY non-destructive legacy save import.

LIVE GAME ONLY. Changes only the current CLEAN offline save adapter in the
disposable CI worktree. Never writes V4-02's IDB or localStorage keys.

The new stable production PLAY namespace intentionally does NOT encode 4.03:
subsequent client versions retain the SAME Hunter rather than making a new save.
"""
from pathlib import Path
p=Path("src/game/highfly_offline_save.ts")
if not p.exists():raise SystemExit("HF_PLAY_CLEAN_OFFLINE_SAVE_NOT_FOUND")
s=p.read_text("utf8")
changes=[
("const DB_NAME = 'highfly-offline';",
 "const DB_NAME = 'highfly-play';\nconst LEGACY_DB_NAME = 'highfly-offline';"),
("const LOCAL_KEY = 'highfly.offline.primary.v1';",
 "const LOCAL_KEY = 'highfly.play.primary.v1';\nconst LEGACY_LOCAL_KEY = 'highfly.offline.primary.v1';"),
]
for old,new in changes:
    if s.count(old)!=1:raise SystemExit("HF_PLAY_OFFLINE_SAVE_CONTRACT_DRIFT:"+old)
    s=s.replace(old,new,1)
anchor="function writeLocal(save: HighflyOfflineSave): void {"
if s.count(anchor)!=1:raise SystemExit("HF_PLAY_READ_LOCAL_DRIFT")
s=s.replace(anchor,'''// Read-only migration candidate from the previous PUBLIC V4-02 origin.
// Do not auto-copy to the new slot until the authentic game autosave fires.
function readLegacyLocal(): HighflyOfflineSave | null {
  try {
    const raw = globalThis.localStorage?.getItem(LEGACY_LOCAL_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}

'''+anchor,1)
anchor="async function readIdbKey(key: string): Promise<HighflyOfflineSave | null> {"
if s.count(anchor)!=1:raise SystemExit("HF_PLAY_READ_IDB_DRIFT")
s=s.replace(anchor,'''// Avoid indexedDB.open() accidentally creating the old database if it does
// not exist: abort the upgrade transaction before new stores can be created.
function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const request = indexedDB.open(LEGACY_DB_NAME);
      request.onupgradeneeded = () => request.transaction?.abort();
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          resolve(null);
        } else resolve(db);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
}

'''+anchor.replace("key: string","key: string, legacy = false"),1)
# Both getters preserve the SAME native code/typing, only selector changes.
needle="  const db = await openDb();"
if s.count(needle)!=3:
    raise SystemExit("HF_PLAY_EXPECTED_THREE_ORIGINAL_IDB_OPERATIONS_FOUND:"+str(s.count(needle)))
# First 2 getters only; last 2 writers remain on NEW DB.
s=s.replace(needle,"  const db = legacy ? await openLegacyDb() : await openDb();",2)
s=s.replace(
"async function readIdbTrainingSlot(key: string): Promise<HighflyTrainingSlot | null> {",
"async function readIdbTrainingSlot(key: string, legacy = false): Promise<HighflyTrainingSlot | null> {",1)
# Migration decision makes no writes and preserves exact class/name identities.
old="""  const primary = newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));

  // With no identity, callers want the most recently played Hunter for launcher
  // preselection. With an identity, restore ONLY that Hunter's independent slot.
  if (!playerClass || !name) return primary;"""
new="""  const primary = newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));
  const oldPrimary = primary ? null :
    newest(readLegacyLocal(), await readIdbKey(PRIMARY_SLOT_KEY, true));

  // Retain same Hunter; prefer all new PLAY saves over the legacy origin,
  // including when old V4-02 autosave races after an update.
  if (!playerClass || !name) return primary ?? oldPrimary;"""
if s.count(old)!=1:raise SystemExit("HF_PLAY_LOAD_PRIMARY_CONTRACT_DRIFT")
s=s.replace(old,new,1)
old="""  if (best) return best;

  return null;
}"""
new="""  if (best) return best;

  // Read legacy slots without modifying V4-02. Identity match is mandatory.
  // The first new PLAY autosave creates a separate, durable copy.
  const oldExact = await readIdbKey(identitySlotKey(playerClass, name), true);
  const previous = newest(readLegacyLocal(), await readIdbKey(PRIMARY_SLOT_KEY, true));
  const oldMatching = previous?.playerClass === playerClass &&
    normalizedHunterName(previous.name) === normalizedHunterName(name)
    ? previous : null;
  return newest(oldExact, oldMatching);
}"""
if s.count(old)!=1:raise SystemExit("HF_PLAY_EXACT_IDENTITY_DRIFT")
s=s.replace(old,new,1)
old="""  return newestTraining(newestTraining(exact, primaryTraining), legacy)?.profile ?? null;
}"""
new="""  const current = newestTraining(newestTraining(exact, primaryTraining), legacy);
  if (current) return current.profile;
  // Fall back to the original Training database ONLY when the new PLAY
  // character has no profile. Never allow cross-class legacy contamination.
  const oldExactRaw = await readIdbTrainingSlot(trainingSlotKey(playerClass, name), true);
  const oldLegacyRaw = await readIdbTrainingSlot(legacyTrainingSlotKey(name), true);
  const oldPrimary = newest(readLegacyLocal(), await readIdbKey(PRIMARY_SLOT_KEY, true));
  const oldFromPrimary = oldPrimary?.playerClass === playerClass &&
    normalizedHunterName(oldPrimary.name) === normalizedHunterName(name) &&
    oldPrimary.trainingProfile &&
    validTrainingProfile(oldPrimary.trainingProfile) &&
    trainingProfileMatchesClass(oldPrimary.trainingProfile, playerClass)
    ? {version: 2 as const, playerClass, name: oldPrimary.name,
       profile: oldPrimary.trainingProfile, updatedAt: oldPrimary.updatedAt} : null;
  const admissible = (slot: HighflyTrainingSlot | null) =>
    slot && normalizedHunterName(slot.name) === normalizedHunterName(name) &&
    trainingProfileMatchesClass(slot.profile, playerClass) ? slot : null;
  return newestTraining(newestTraining(admissible(oldExactRaw),
     admissible(oldLegacyRaw)), oldFromPrimary)?.profile ?? null;
}"""
if s.count(old)!=1:raise SystemExit("HF_PLAY_TRAINING_FALLBACK_DRIFT")
s=s.replace(old,new,1)
# Prove writes continue to NEW namespace only; no automatic destructive
# migration or schema rewriting of an old offline character.
assert s.count("const DB_NAME = 'highfly-play';")==1
assert s.count("const LOCAL_KEY = 'highfly.play.primary.v1';")==1
assert s.count("const LEGACY_DB_NAME = 'highfly-offline';")==1
p.write_text(s,"utf8")
print("HF_PLAY_GOLDEN_V403_SAFE_LEGACY_READ_ONLY_IDB_AND_LOCAL_FALLBACK=1")
