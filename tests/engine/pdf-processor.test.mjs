import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRotation,
  reorderPages,
  rotatePagesByIds,
  removePagesWithGc,
} from '../../app/pdf-processor/engine.ts';

test('normalizeRotation：正負旋轉角度皆正規化於 0/90/180/270', () => {
  assert.equal(normalizeRotation(0, 90), 90);
  assert.equal(normalizeRotation(270, 90), 0);
  assert.equal(normalizeRotation(0, -90), 270);
  assert.equal(normalizeRotation(90, -180), 270);
});

test('reorderPages：拖曳重新排序不變異原陣列，越界索引安全回傳副本', () => {
  const items = ['p1', 'p2', 'p3', 'p4'];
  assert.deepEqual(reorderPages(items, 0, 2), ['p2', 'p3', 'p1', 'p4']);
  assert.deepEqual(reorderPages(items, 3, 1), ['p1', 'p4', 'p2', 'p3']);
  assert.deepEqual(reorderPages(items, -1, 2), ['p1', 'p2', 'p3', 'p4']);
  assert.deepEqual(items, ['p1', 'p2', 'p3', 'p4']);
});

test('rotatePagesByIds：僅旋轉目標頁面集合，其餘保持不動', () => {
  const pages = [
    { id: '1', fileId: 'f1', rotation: 0 },
    { id: '2', fileId: 'f1', rotation: 90 },
    { id: '3', fileId: 'f2', rotation: 180 },
  ];
  const next = rotatePagesByIds(pages, new Set(['1', '3']), 90);
  assert.deepEqual(
    next.map((p) => p.rotation),
    [90, 90, 270]
  );
});

test('removePagesWithGc：刪除同一檔案所有頁面後回報可釋放的 orphanedFileIds', () => {
  const pages = [
    { id: '1', fileId: 'f1', rotation: 0 },
    { id: '2', fileId: 'f1', rotation: 0 },
    { id: '3', fileId: 'f2', rotation: 0 },
  ];
  const partial = removePagesWithGc(pages, new Set(['1']));
  assert.equal(partial.remaining.length, 2);
  assert.deepEqual(partial.orphanedFileIds, []);

  const allOfF1 = removePagesWithGc(pages, new Set(['1', '2']));
  assert.equal(allOfF1.remaining.length, 1);
  assert.deepEqual(allOfF1.orphanedFileIds, ['f1']);
});
