/**
 * 觸發瀏覽器下載一個 Blob（建立暫時 `<a download>`、點擊、清理）。
 *
 * 原本在 calendar-split、har-cleaner、image-processor、ip-calculator、json、
 * lucky-wheel、pdf-compressor、pdf-processor、qr-generator、ssl-converter
 * 十處各自重複實作，寫法略有差異（部分用 setTimeout/requestAnimationFrame
 * 延後 revoke 以保護大檔案下載），統一抽到這裡共用。
 *
 * @param revokeDelayMs 延後回收 Object URL 的毫秒數，預設 0（同步立即回收）。
 *   下載較大的檔案（如批次 ZIP、PDF）時可傳入 >0 的值，避免極少數瀏覽器在
 *   下載仍在讀取 blob 時就提前失效。
 */
export function downloadBlob(blob: Blob, filename: string, revokeDelayMs = 0): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (revokeDelayMs > 0) {
    setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
  } else {
    URL.revokeObjectURL(url);
  }
}
