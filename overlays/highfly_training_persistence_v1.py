from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

save = Path("src/game/highfly_offline_save.ts")
main = Path("src/main.ts")

replace_once(
    save,
    "import type { PlayerClass } from '../sim/types';\n",
    "import type { PlayerClass } from '../sim/types';\n"
    "import type { HighflyHunterProfile } from '../highfly/training/core';\n",
    "training profile type import",
)

replace_once(
    save,
    """  appearance: Record<string, unknown> | null;
  updatedAt: number;
}
""",
    """  appearance: Record<string, unknown> | null;
  trainingProfile?: HighflyHunterProfile;
  updatedAt: number;
}

interface HighflyTrainingSlot {
  version: 1;
  name: string;
  profile: HighflyHunterProfile;
  updatedAt: number;
}
""",
    "save training profile field",
)

replace_once(
    save,
    """function identitySlotKey(playerClass: PlayerClass, name: string): string {
  return `hunter:${playerClass}:${encodeURIComponent(name.trim().toLowerCase())}`;
}
""",
    """function normalizedHunterName(name: string): string {
  return name.trim().toLowerCase();
}

function identitySlotKey(playerClass: PlayerClass, name: string): string {
  return `hunter:${playerClass}:${encodeURIComponent(normalizedHunterName(name))}`;
}

function trainingSlotKey(name: string): string {
  return `training:${encodeURIComponent(normalizedHunterName(name))}`;
}
""",
    "training identity key",
)

valid_anchor = """function valid(value: unknown): value is HighflyOfflineSave {
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
"""
valid_replacement = valid_anchor + """
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
    v.schemaVersion === 1 &&
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
    v.version === 1 &&
    typeof v.name === 'string' &&
    typeof v.updatedAt === 'number' &&
    validTrainingProfile(v.profile)
  );
}
"""
replace_once(save, valid_anchor, valid_replacement, "training validation")

read_idb_anchor = """async function readIdbKey(key: string): Promise<HighflyOfflineSave | null> {
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
"""
read_training = read_idb_anchor + """
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
"""
replace_once(save, read_idb_anchor, read_training, "training idb read")

replace_once(
    save,
    """      store.put(save, PRIMARY_SLOT_KEY);
      store.put(save, identitySlotKey(save.playerClass, save.name));
""",
    """      store.put(save, PRIMARY_SLOT_KEY);
      store.put(save, identitySlotKey(save.playerClass, save.name));
      if (save.trainingProfile && validTrainingProfile(save.trainingProfile)) {
        const trainingSlot: HighflyTrainingSlot = {
          version: 1,
          name: save.name,
          profile: save.trainingProfile,
          updatedAt: save.updatedAt,
        };
        store.put(trainingSlot, trainingSlotKey(save.name));
      }
""",
    "training idb write",
)

newest_anchor = """function newest(
  a: HighflyOfflineSave | null,
  b: HighflyOfflineSave | null,
): HighflyOfflineSave | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}
"""
newest_replacement = newest_anchor + """
function newestTraining(
  a: HighflyTrainingSlot | null,
  b: HighflyTrainingSlot | null,
): HighflyTrainingSlot | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}
"""
replace_once(save, newest_anchor, newest_replacement, "training newest helper")

load_anchor = """export async function loadHighflyOfflineSave(
  playerClass?: PlayerClass,
  name?: string,
): Promise<HighflyOfflineSave | null> {
"""
load_training = """export async function loadHighflyTrainingProfile(
  name: string,
): Promise<HighflyHunterProfile | null> {
  const primary = newest(readLocal(), await readIdbKey(PRIMARY_SLOT_KEY));
  const primaryTraining =
    primary &&
    normalizedHunterName(primary.name) === normalizedHunterName(name) &&
    primary.trainingProfile &&
    validTrainingProfile(primary.trainingProfile)
      ? {
          version: 1 as const,
          name: primary.name,
          profile: primary.trainingProfile,
          updatedAt: primary.updatedAt,
        }
      : null;
  const exact = await readIdbTrainingSlot(trainingSlotKey(name));
  return newestTraining(exact, primaryTraining)?.profile ?? null;
}

""" + load_anchor
replace_once(save, load_anchor, load_training, "training load export")

replace_once(
    main,
    """import {
  installHighflyOfflineAutosave,
  loadHighflyOfflineSave,
} from './game/highfly_offline_save';
""",
    """import {
  installHighflyOfflineAutosave,
  loadHighflyOfflineSave,
  loadHighflyTrainingProfile,
} from './game/highfly_offline_save';
import {
  applyHunterProgression,
  createHighflyHunterProfile,
} from './highfly/training/core';
import {
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from './highfly/training/profile_store';
""",
    "training persistence imports",
)

replace_once(
    main,
    """  const storedOfflineSave =
    world ? null : await loadHighflyOfflineSave(playerClass, name);
  const matchingOfflineSave = storedOfflineSave;
  const offlineCfg = offlineWorldConfig({
""",
    """  const storedOfflineSave =
    world ? null : await loadHighflyOfflineSave(playerClass, name);
  const matchingOfflineSave = storedOfflineSave;

  const storedTrainingProfile =
    world ? null : await loadHighflyTrainingProfile(name);
  const baseTrainingProfile =
    storedTrainingProfile ??
    createHighflyHunterProfile({
      profileId: `offline:${encodeURIComponent(name.trim().toLowerCase())}`,
      classId: playerClass,
    });
  setActiveHighflyHunterProfile(
    applyHunterProgression(baseTrainingProfile, { classId: playerClass }),
  );

  const offlineCfg = offlineWorldConfig({
""",
    "load or create training profile",
)

replace_once(
    main,
    """  if (!matchingOfflineSave) sim.setPlayerSkin(sim.playerId, skin);
""",
    """  if (!matchingOfflineSave) sim.setPlayerSkin(sim.playerId, skin);

  const loadedTrainingProfile = getActiveHighflyHunterProfile();
  if (loadedTrainingProfile) {
    setActiveHighflyHunterProfile(
      applyHunterProgression(loadedTrainingProfile, {
        level: sim.player.level,
        xp: sim.xp,
        classId: playerClass,
      }),
    );
  }
""",
    "sync training progression after sim restore",
)

replace_once(
    main,
    """      return {
        version: 1 as const,
        playerClass,
        name,
        state,
        appearance,
        updatedAt: Date.now(),
      };
""",
    """      const activeTrainingProfile = getActiveHighflyHunterProfile();
      if (activeTrainingProfile) {
        setActiveHighflyHunterProfile(
          applyHunterProgression(activeTrainingProfile, {
            level: player?.level ?? activeTrainingProfile.hunter.level,
            xp: sim.xp,
            classId: playerClass,
          }),
        );
      }
      return {
        version: 1 as const,
        playerClass,
        name,
        state,
        appearance,
        trainingProfile: getActiveHighflyHunterProfile() ?? undefined,
        updatedAt: Date.now(),
      };
""",
    "autosave training profile",
)

print("HIGHFLY_TRAINING_PERSISTENCE_V1_APPLIED=1")
