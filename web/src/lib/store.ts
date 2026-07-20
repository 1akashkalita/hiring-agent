import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { RunRecord } from "./schemas";

interface HiringAgentDB extends DBSchema {
  runs: { key: string; value: RunRecord; indexes: { "by-createdAt": number } };
}

const DB_NAME = "hiring-agent";
const DB_VERSION = 1;
const STORE = "runs";
const INDEX = "by-createdAt";
const TRANSIENT_PREFIX = "ha-transient-run:";

let dbPromise: Promise<IDBPDatabase<HiringAgentDB>> | null = null;

// In-memory mirror of saved runs. Populated before every write so that a just
// scored run is never discarded if the IndexedDB write is rejected — e.g. under
// the storage limits of a private/incognito window, or an exceeded quota. It is
// session-scoped (cleared on reload), so it backstops the active session only.
const memCache = new Map<string, RunRecord>();

function getDB(): Promise<IDBPDatabase<HiringAgentDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HiringAgentDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex(INDEX, "createdAt");
        }
      },
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function saveRun(rec: RunRecord): Promise<void> {
  // Mirror first so the run survives even if the persistent write below rejects.
  memCache.set(rec.id, rec);
  const db = await getDB();
  await db.put(STORE, rec);
}

export async function saveTransientRun(rec: RunRecord): Promise<void> {
  sessionStorage.setItem(`${TRANSIENT_PREFIX}${rec.id}`, JSON.stringify(rec));
}

function getTransientRun(id: string): RunRecord | undefined {
  try {
    const raw = sessionStorage.getItem(`${TRANSIENT_PREFIX}${id}`);
    return raw ? JSON.parse(raw) as RunRecord : undefined;
  } catch {
    return undefined;
  }
}

function deleteTransientRun(id: string): void {
  try {
    sessionStorage.removeItem(`${TRANSIENT_PREFIX}${id}`);
  } catch {}
}

function clearTransientRuns(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(TRANSIENT_PREFIX)) keys.push(key);
    }
    for (const key of keys) sessionStorage.removeItem(key);
  } catch {}
}

export async function listRuns(): Promise<RunRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE, INDEX);
}

export async function getRun(id: string): Promise<RunRecord | undefined> {
  const db = await getDB();
  // Prefer persistent history, then the failed-write mirror, then tab-scoped samples.
  return (await db.get(STORE, id)) ?? memCache.get(id) ?? getTransientRun(id);
}

export async function deleteRun(id: string): Promise<void> {
  memCache.delete(id);
  deleteTransientRun(id);
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function renameRun(id: string, label: string): Promise<void> {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  if (!rec) return;
  rec.label = label;
  await db.put(STORE, rec);
}

export async function clearAllRuns(): Promise<void> {
  memCache.clear();
  clearTransientRuns();
  const db = await getDB();
  await db.clear(STORE);
}
