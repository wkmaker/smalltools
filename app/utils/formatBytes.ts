/**
 * 位元組數轉可讀檔案大小字串（如 "1.5 MB"）。
 *
 * 原本在 calendar-split / image-processor / pdf-compressor 三處各自重複實作
 * 同一份邏輯，統一抽到這裡共用。
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
