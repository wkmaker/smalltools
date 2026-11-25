/**
 * PDF 頁面組合器純函式引擎（旋轉角度正規化、頁面排序、移除與批次操作），可獨立單元測試。
 */

export interface PdfPageItemBase {
  id: string;
  fileId: string;
  rotation: number;
  selected?: boolean;
}

/** 將任意旋轉增量正規化至 0 / 90 / 180 / 270 度。 */
export function normalizeRotation(current: number, delta: number): number {
  return (((current + delta) % 360) + 360) % 360;
}

/** 將項目由 fromIndex 移至 toIndex（不可變回傳新陣列）。 */
export function reorderPages<T>(pages: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= pages.length ||
    toIndex >= pages.length
  ) {
    return [...pages];
  }
  const next = [...pages];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** 批次旋轉指定頁碼清單（不可變回傳新陣列）。 */
export function rotatePagesByIds<T extends PdfPageItemBase>(
  pages: readonly T[],
  ids: ReadonlySet<string>,
  delta: number
): T[] {
  return pages.map((p) => (ids.has(p.id) ? { ...p, rotation: normalizeRotation(p.rotation, delta) } : p));
}

/** 刪除指定頁碼清單，並回傳剩餘頁面與已無任何引用可安全 GC 釋放的 fileIds。 */
export function removePagesWithGc<T extends PdfPageItemBase>(
  pages: readonly T[],
  idsToRemove: ReadonlySet<string>
): { remaining: T[]; orphanedFileIds: string[] } {
  const affectedFileIds = new Set<string>();
  const remaining: T[] = [];
  for (const p of pages) {
    if (idsToRemove.has(p.id)) {
      affectedFileIds.add(p.fileId);
    } else {
      remaining.push(p);
    }
  }
  const activeFileIds = new Set(remaining.map((p) => p.fileId));
  const orphanedFileIds = Array.from(affectedFileIds).filter((fid) => !activeFileIds.has(fid));
  return { remaining, orphanedFileIds };
}
