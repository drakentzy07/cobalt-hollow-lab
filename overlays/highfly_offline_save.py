from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

main = Path("src/main.ts")
store = Path("src/game/highfly_offline_save.ts")

store.write_text(r"""import type { CharacterState } from '../sim/character_state';
import type { PlayerClass } from '../sim/types';

export interface HighflyOfflineSave {
  version: 1;
  playerClass: PlayerClass;
  name: string;
  state: CharacterState;
  appearance: Record<string, unknown> | null;
  updatedAt: number;
}

const DB_NAME = 'highfly-offline';
const STORE_NAME = 'saves';
const SLOT_KEY = 'primary';
const LOCAL_KEY = 'highfly.offline.primary.v1';

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
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readIdb(): Promise<HighflyOfflineSave | null> {
  const db = await openDb();
  if (!db) return null;
  return await new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(SLOT_KEY);
      request.onsuccess = () => resolve(valid(request.result) ? request.result : null);
      request.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function writeIdb(save: HighflyOfflineSave): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(save, SLOT_KEY);
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

export async function loadHighflyOfflineSave(): Promise<HighflyOfflineSave | null> {
  const local = readLocal();
  const idb = await readIdb();
  if (!local) return idb;
  if (!idb) return local;
  return local.updatedAt >= idb.updatedAt ? local : idb;
}

export function writeHighflyOfflineSave(save: HighflyOfflineSave): void {
  // Synchronous mirror first: pagehide/visibilitychange cannot wait for IDB.
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
""", encoding="utf-8")

import_old = """import { offlineWorldConfig } from './game/offline_world_config';
"""
import_new = import_old + """import {
  installHighflyOfflineAutosave,
  loadHighflyOfflineSave,
} from './game/highfly_offline_save';
"""
replace_once(main, import_old, import_new, "save imports")

build_old = """  if (world) setActiveWorldContent(world);
  const sim = loadSpan(
    'sim-build',
    () =>
      new Sim(
        offlineWorldConfig({
          playerClass,
          name,
          world,
          seedOverride,
          devCommands: import.meta.env.DEV,
        }),
      ),
  );
  sim.setPlayerSkin(sim.playerId, skin);
"""
build_new = """  if (world) setActiveWorldContent(world);

  // RUN0.6: restore through ClaudeCraft's canonical CharacterState loader.
  const storedOfflineSave = world ? null : await loadHighflyOfflineSave();
  const matchingOfflineSave =
    storedOfflineSave?.playerClass === playerClass && storedOfflineSave.name === name
      ? storedOfflineSave
      : null;
  const offlineCfg = offlineWorldConfig({
    playerClass,
    name,
    world,
    seedOverride,
    devCommands: import.meta.env.DEV,
  });
  const sim = loadSpan('sim-build', () => {
    if (!matchingOfflineSave) return new Sim(offlineCfg);
    const restored = new Sim({
      ...offlineCfg,
      noPlayer: true,
      compulsoryTutorial: false,
    });
    restored.addPlayer(playerClass, name, {
      state: matchingOfflineSave.state,
      appearance: matchingOfflineSave.appearance,
      localGathererIdentity: offlineCfg.gathererIdentity ?? null,
    });
    return restored;
  });
  if (!matchingOfflineSave) sim.setPlayerSkin(sim.playerId, skin);
"""
replace_once(main, build_old, build_new, "restore through CharacterState")

appearance_old = """  const offlinePlayer = sim.entities.get(sim.playerId);
  if (offlinePlayer) {
    // The entity field is deliberately opaque (the sim must not depend on the
    // render layer's ModularAppearance), so the interface needs the cast an
    // online wire payload does not.
    offlinePlayer.modularAppearance = modularAppearance as unknown as Record<string, unknown>;
    offlinePlayer.helmHidden = !creationHelm;
  }
"""
appearance_new = """  const offlinePlayer = sim.entities.get(sim.playerId);
  if (offlinePlayer) {
    // Modular appearance is host-owned (not part of CharacterState), so RUN0.6
    // carries it beside the canonical sim snapshot.
    offlinePlayer.modularAppearance =
      matchingOfflineSave?.appearance ??
      (modularAppearance as unknown as Record<string, unknown>);
    if (!matchingOfflineSave) offlinePlayer.helmHidden = !creationHelm;
  }
"""
replace_once(main, appearance_old, appearance_new, "restore appearance")

tail_old = """  // Offline characters are not persisted (a fresh name is typed each session),
  // so the only stable handle is class + name. Keybinds scope to that pair.
  void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);
"""
tail_new = """  if (!world) {
    installHighflyOfflineAutosave(() => {
      const state = sim.serializeCharacter(sim.playerId);
      if (!state) return null;
      const player = sim.entities.get(sim.playerId);
      const appearance =
        (player?.modularAppearance as Record<string, unknown> | undefined) ??
        matchingOfflineSave?.appearance ??
        null;
      return {
        version: 1 as const,
        playerClass,
        name,
        state,
        appearance,
        updatedAt: Date.now(),
      };
    });
  }

  // Stable local identity also scopes keybinds; the RPG state itself now persists.
  void startGame(sim, sim, null, `offline:${playerClass}:${name}`, true);
"""
replace_once(main, tail_old, tail_new, "install autosave")

print("HIGHFLY_OFFLINE_SAVE_APPLIED=1")
