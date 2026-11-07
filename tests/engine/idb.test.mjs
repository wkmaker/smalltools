import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildIdbRecordId,
  createMemoryIdbBackend,
  createSafeIdb,
} from '../../app/utils/idb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '../../app');

test('buildIdbRecordId 應產生標準複合主鍵', () => {
  assert.equal(buildIdbRecordId('diff-checker', 'draft_v1'), 'diff-checker:draft_v1');
});

test('createSafeIdb 基本讀寫、更新與刪除與 namespace 隔離', async () => {
  const idb = createSafeIdb(createMemoryIdbBackend());

  const ok1 = await idb.set('diff-checker', 'draft', { left: 'a', right: 'b' }, { now: 1000 });
  const ok2 = await idb.set('calendar-split', 'draft', { filename: 'cal.ics' }, { now: 1000 });
  assert.equal(ok1, true);
  assert.equal(ok2, true);

  const diffDraft = await idb.get('diff-checker', 'draft', 1500);
  const calDraft = await idb.get('calendar-split', 'draft', 1500);
  assert.deepEqual(diffDraft, { left: 'a', right: 'b' });
  assert.deepEqual(calDraft, { filename: 'cal.ics' });

  // 刪除單一項目不影響其他 namespace
  await idb.remove('diff-checker', 'draft');
  assert.equal(await idb.get('diff-checker', 'draft', 1500), null);
  assert.deepEqual(await idb.get('calendar-split', 'draft', 1500), { filename: 'cal.ics' });
});

test('createSafeIdb TTL 過期機制應自動攔截並清理過期項目', async () => {
  const backend = createMemoryIdbBackend();
  const idb = createSafeIdb(backend);

  await idb.set('screen-capture', 'last_rec', { size: 1024 }, { now: 10_000, ttlMs: 5_000 });

  // 未過期 (14_999 <= 15_000)
  assert.deepEqual(await idb.get('screen-capture', 'last_rec', 14_999), { size: 1024 });

  // 已過期 (15_001 > 15_000)
  assert.equal(await idb.get('screen-capture', 'last_rec', 15_001), null);
  // 確認底層已被清除
  assert.equal(await backend.getEntry('screen-capture:last_rec'), null);
});

test('createSafeIdb maxEntriesInNamespace (LRU) 應只保留最新 N 筆並淘汰最舊項目', async () => {
  const idb = createSafeIdb(createMemoryIdbBackend());

  await idb.set('pdf-compressor', 'item1', 'pdf-1', { now: 1000, maxEntriesInNamespace: 3 });
  await idb.set('pdf-compressor', 'item2', 'pdf-2', { now: 2000, maxEntriesInNamespace: 3 });
  await idb.set('pdf-compressor', 'item3', 'pdf-3', { now: 3000, maxEntriesInNamespace: 3 });
  await idb.set('pdf-compressor', 'item4', 'pdf-4', { now: 4000, maxEntriesInNamespace: 3 });

  const list = await idb.listNamespace('pdf-compressor', 4500);
  assert.equal(list.length, 3);
  assert.deepEqual(
    list.map((x) => x.key),
    ['item4', 'item3', 'item2']
  );
  assert.equal(await idb.get('pdf-compressor', 'item1', 4500), null);
});

test('createSafeIdb 支援原生儲存二進位 Blob 與 Uint8Array', async () => {
  const idb = createSafeIdb(createMemoryIdbBackend());
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
  const blob = new Blob([bytes], { type: 'application/pdf' });

  await idb.set('pdf-compressor', 'blob_test', { name: 'test.pdf', blob }, { now: 1000 });
  const loaded = await idb.get('pdf-compressor', 'blob_test', 1000);
  assert.ok(loaded);
  assert.equal(loaded.name, 'test.pdf');
  assert.equal(loaded.blob.size, 4);
  assert.equal(loaded.blob.type, 'application/pdf');
});

test('createSafeIdb 遭遇 QuotaExceededError 或 SecurityError 時應安全降級不拋出未捕獲例外', async () => {
  const failingBackend = {
    async getEntry() {
      throw new Error('SecurityError: IDB blocked in private mode');
    },
    async putEntry() {
      throw new Error('QuotaExceededError: disk full');
    },
    async deleteEntry() {
      throw new Error('SecurityError');
    },
    async getNamespaceEntries() {
      throw new Error('SecurityError');
    },
    async clearNamespaceEntries() {
      throw new Error('SecurityError');
    },
  };

  const idb = createSafeIdb(failingBackend);
  assert.equal(await idb.set('ns', 'k', 'v'), false);
  assert.equal(await idb.get('ns', 'k'), null);
  assert.equal(await idb.remove('ns', 'k'), false);
  assert.deepEqual(await idb.listNamespace('ns'), []);
  assert.equal(await idb.clearNamespace('ns'), false);
});

test('資安紅線契約：敏感工具 (password, har-cleaner, ssl-converter, cert-generator, checksum-verifier) 嚴禁寫入 IndexedDB', () => {
  const zeroPersistenceTools = [
    'password',
    'har-cleaner',
    'ssl-converter',
    'cert-generator',
    'checksum-verifier',
  ];

  function collectCodeFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectCodeFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  for (const tool of zeroPersistenceTools) {
    const toolDir = path.join(appDir, tool);
    const files = collectCodeFiles(toolDir);
    assert.ok(files.length > 0, `${tool} 目錄應存在程式碼檔案`);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.equal(
        /\bsafeIdb\b|\bindexedDB\b/.test(content),
        false,
        `敏感工具 ${tool} (${path.relative(appDir, file)}) 嚴禁使用 IndexedDB / safeIdb`
      );
    }
  }
});

