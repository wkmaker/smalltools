/**
 * 安全的 IndexedDB 非同步存取模組 (Safe IndexedDB Wrapper)
 * ──────────────────────────────────────────────────────────────
 * 專為大型文本草稿（Diff 比對、行事曆分割）與二進位檔案（螢幕錄影、圖片處理、PDF 壓縮 Blob）設計。
 * - 具備 SSR 環境保護、Safari 無痕模式 / QuotaExceededError 異常捕獲與可追溯日誌。
 * - 內建 TTL 過期自動清理與 Namespace 級別的 LRU 筆數上限控制。
 * - 提供可注入的記憶體驗證後端 (Memory Backend)，支援於 Node.js 環境進行毫秒級純函數單元測試。
 */

export interface IdbEntry<T = unknown> {
  /** 複合主鍵：`${namespace}:${key}` */
  id: string;
  namespace: string;
  key: string;
  value: T;
  updatedAt: number;
  expiresAt: number | null;
}

export interface IdbSetOptions {
  /** 存活時間（毫秒），未指定則不自動過期 */
  ttlMs?: number;
  /** 該 namespace 內最多保留幾筆（超過時依 updatedAt 由舊到新自動淘汰） */
  maxEntriesInNamespace?: number;
  /** 注入當前時間戳（供單元測試模擬時間推進） */
  now?: number;
}

export interface IdbBackend {
  getEntry<T>(id: string): Promise<IdbEntry<T> | null>;
  putEntry<T>(entry: IdbEntry<T>): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  getNamespaceEntries<T>(namespace: string): Promise<IdbEntry<T>[]>;
  clearNamespaceEntries(namespace: string): Promise<void>;
}

const DEFAULT_DB_NAME = 'smalltools_idb_v1';
const DEFAULT_STORE_NAME = 'kv_store';
const NAMESPACE_INDEX = 'by_namespace';

export function buildIdbRecordId(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * 記憶體後端（供 Node.js 單元測試或 IndexedDB 不可用時之隔離環境使用）
 */
export function createMemoryIdbBackend(): IdbBackend {
  const store = new Map<string, IdbEntry<unknown>>();

  return {
    async getEntry<T>(id: string): Promise<IdbEntry<T> | null> {
      const found = store.get(id);
      return found ? (found as IdbEntry<T>) : null;
    },
    async putEntry<T>(entry: IdbEntry<T>): Promise<void> {
      store.set(entry.id, entry as IdbEntry<unknown>);
    },
    async deleteEntry(id: string): Promise<void> {
      store.delete(id);
    },
    async getNamespaceEntries<T>(namespace: string): Promise<IdbEntry<T>[]> {
      const result: IdbEntry<T>[] = [];
      for (const item of store.values()) {
        if (item.namespace === namespace) {
          result.push(item as IdbEntry<T>);
        }
      }
      return result;
    },
    async clearNamespaceEntries(namespace: string): Promise<void> {
      for (const [id, item] of store.entries()) {
        if (item.namespace === namespace) {
          store.delete(id);
        }
      }
    },
  };
}

/**
 * 瀏覽器原生 IndexedDB 後端
 */
export function createBrowserIdbBackend(
  dbName = DEFAULT_DB_NAME,
  storeName = DEFAULT_STORE_NAME
): IdbBackend {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available in this environment'));
    }
    if (dbPromise) return dbPromise;

    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = window.indexedDB.open(dbName, 1);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex(NAMESPACE_INDEX, 'namespace', { unique: false });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            dbPromise = null;
          };
          resolve(db);
        };

        request.onerror = () => {
          dbPromise = null;
          reject(request.error ?? new Error('Failed to open IndexedDB'));
        };

        request.onblocked = () => {
          dbPromise = null;
          reject(new Error('IndexedDB open request was blocked'));
        };
      } catch (err) {
        dbPromise = null;
        reject(err);
      }
    });

    return dbPromise;
  }

  return {
    async getEntry<T>(id: string): Promise<IdbEntry<T> | null> {
      const db = await openDb();
      return new Promise<IdbEntry<T> | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as IdbEntry<T> | undefined) ?? null);
        req.onerror = () => reject(req.error ?? new Error(`IndexedDB get failed for ${id}`));
      });
    },

    async putEntry<T>(entry: IdbEntry<T>): Promise<void> {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB put failed for ${entry.id}`));
        tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB put aborted for ${entry.id}`));
      });
    },

    async deleteEntry(id: string): Promise<void> {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB delete failed for ${id}`));
      });
    },

    async getNamespaceEntries<T>(namespace: string): Promise<IdbEntry<T>[]> {
      const db = await openDb();
      return new Promise<IdbEntry<T>[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(NAMESPACE_INDEX);
        const req = index.getAll(IDBKeyRange.only(namespace));
        req.onsuccess = () => resolve((req.result as IdbEntry<T>[]) ?? []);
        req.onerror = () =>
          reject(req.error ?? new Error(`IndexedDB getNamespaceEntries failed for ${namespace}`));
      });
    },

    async clearNamespaceEntries(namespace: string): Promise<void> {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const index = store.index(NAMESPACE_INDEX);
        const req = index.openKeyCursor(IDBKeyRange.only(namespace));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error ?? new Error(`IndexedDB clearNamespaceEntries failed for ${namespace}`));
      });
    },
  };
}

/**
 * 建立具備 TTL 過期檢查、LRU 筆數裁剪與防禦性異常處理的 IndexedDB 存取器
 */
export function createSafeIdb(customBackend?: IdbBackend) {
  const backend = customBackend ?? createBrowserIdbBackend();

  function isExpired(entry: IdbEntry<unknown>, now: number): boolean {
    return typeof entry.expiresAt === 'number' && Number.isFinite(entry.expiresAt) && now > entry.expiresAt;
  }

  return {
    async get<T>(namespace: string, key: string, now = Date.now()): Promise<T | null> {
      if (!namespace || !key) return null;
      const id = buildIdbRecordId(namespace, key);
      try {
        const entry = await backend.getEntry<T>(id);
        if (!entry) return null;
        if (isExpired(entry, now)) {
          await backend.deleteEntry(id).catch((delErr) => {
            console.warn('[idb] 清理過期項目失敗', { namespace, key, err: delErr });
          });
          return null;
        }
        return entry.value;
      } catch (err) {
        console.warn('[idb] 讀取項目失敗，降級回傳 null', { namespace, key, err });
        return null;
      }
    },

    async set<T>(
      namespace: string,
      key: string,
      value: T,
      options: IdbSetOptions = {}
    ): Promise<boolean> {
      if (!namespace || !key) return false;
      const now = options.now ?? Date.now();
      const expiresAt =
        typeof options.ttlMs === 'number' && Number.isFinite(options.ttlMs) && options.ttlMs > 0
          ? now + options.ttlMs
          : null;

      const entry: IdbEntry<T> = {
        id: buildIdbRecordId(namespace, key),
        namespace,
        key,
        value,
        updatedAt: now,
        expiresAt,
      };

      try {
        await backend.putEntry(entry);

        const maxEntries = options.maxEntriesInNamespace;
        if (typeof maxEntries === 'number' && Number.isFinite(maxEntries) && maxEntries > 0) {
          const allInNs = await backend.getNamespaceEntries(namespace);
          const validEntries: IdbEntry<unknown>[] = [];
          for (const item of allInNs) {
            if (isExpired(item, now)) {
              await backend.deleteEntry(item.id).catch((e) => {
                console.warn('[idb] 淘汰過期項目失敗', { id: item.id, err: e });
              });
            } else {
              validEntries.push(item);
            }
          }

          if (validEntries.length > maxEntries) {
            // 依 updatedAt 由新到舊排序，刪除超出上限的舊項目
            validEntries.sort((a, b) => b.updatedAt - a.updatedAt);
            const toEvict = validEntries.slice(maxEntries);
            for (const oldItem of toEvict) {
              await backend.deleteEntry(oldItem.id).catch((e) => {
                console.warn('[idb] LRU 淘汰舊項目失敗', { id: oldItem.id, err: e });
              });
            }
          }
        }

        return true;
      } catch (err) {
        console.warn('[idb] 寫入項目失敗，已安全降級略過', { namespace, key, err });
        return false;
      }
    },

    async remove(namespace: string, key: string): Promise<boolean> {
      if (!namespace || !key) return false;
      const id = buildIdbRecordId(namespace, key);
      try {
        await backend.deleteEntry(id);
        return true;
      } catch (err) {
        console.warn('[idb] 刪除項目失敗', { namespace, key, err });
        return false;
      }
    },

    async listNamespace<T>(namespace: string, now = Date.now()): Promise<IdbEntry<T>[]> {
      if (!namespace) return [];
      try {
        const entries = await backend.getNamespaceEntries<T>(namespace);
        const active: IdbEntry<T>[] = [];
        for (const item of entries) {
          if (isExpired(item, now)) {
            await backend.deleteEntry(item.id).catch((e) => {
              console.warn('[idb] 列表掃描清理過期項目失敗', { id: item.id, err: e });
            });
          } else {
            active.push(item);
          }
        }
        return active.sort((a, b) => b.updatedAt - a.updatedAt);
      } catch (err) {
        console.warn('[idb] 列舉 namespace 失敗', { namespace, err });
        return [];
      }
    },

    async clearNamespace(namespace: string): Promise<boolean> {
      if (!namespace) return false;
      try {
        await backend.clearNamespaceEntries(namespace);
        return true;
      } catch (err) {
        console.warn('[idb] 清空 namespace 失敗', { namespace, err });
        return false;
      }
    },
  };
}

export const safeIdb = createSafeIdb();
