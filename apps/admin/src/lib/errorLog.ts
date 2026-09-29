const DB_NAME = 'bento-error-log';
const STORE = 'errors';
const MAX_ENTRIES = 2000;

export interface ErrorEntry {
  id: string;
  ts: number;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  source?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('ts', 'ts', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function pruneOldEntries(db: IDBDatabase): Promise<void> {
  const count = await new Promise<number>((resolve) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
  if (count <= MAX_ENTRIES) return;

  const toDelete = count - MAX_ENTRIES;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.index('ts').openCursor(null, 'next');
    let deleted = 0;
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || deleted >= toDelete) { resolve(); return; }
      cursor.delete();
      deleted++;
      cursor.continue();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function logError(
  message: string,
  opts?: { stack?: string; source?: string },
): Promise<void> {
  try {
    const db = await openDB();
    const entry: ErrorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: Date.now(),
      level: 'error',
      message,
      ...opts,
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await pruneOldEntries(db);
    db.close();
  } catch {
    // IndexedDB 접근 실패 시 조용히 무시
  }
}

export async function logWarn(
  message: string,
  opts?: { stack?: string; source?: string },
): Promise<void> {
  try {
    const db = await openDB();
    const entry: ErrorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: Date.now(),
      level: 'warn',
      message,
      ...opts,
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await pruneOldEntries(db);
    db.close();
  } catch {
    // IndexedDB 접근 실패 시 조용히 무시
  }
}

export async function logInfo(
  message: string,
  opts?: { stack?: string; source?: string },
): Promise<void> {
  try {
    const db = await openDB();
    const entry: ErrorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: Date.now(),
      level: 'info',
      message,
      ...opts,
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await pruneOldEntries(db);
    db.close();
  } catch {
    // IndexedDB 접근 실패 시 조용히 무시
  }
}

export async function getLogs(limit = 100): Promise<ErrorEntry[]> {
  const db = await openDB();
  const entries = await new Promise<ErrorEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('ts').openCursor(null, 'prev');
    const results: ErrorEntry[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || results.length >= limit) { resolve(results); return; }
      results.push(cursor.value as ErrorEntry);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return entries;
}

export async function clearLogs(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
