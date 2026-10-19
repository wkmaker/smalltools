/**
 * 觸發瀏覽器下載一個 Blob（建立暫時 `<a download>`、點擊、清理）。
 *
 * 原本在 calendar-split、har-cleaner、image-processor、ip-calculator、json、
 * lucky-wheel、pdf-compressor、pdf-processor、qr-generator、ssl-converter
 * 十處各自重複實作，寫法略有差異（部分用 setTimeout/requestAnimationFrame
 * 延後 revoke 以保護大檔案下載），統一抽到這裡共用。
 *
 * @param revokeDelayMs 延後回收 Object URL 的毫秒數，預設 1000。
 *   瀏覽器的下載排程是非同步的，click 後同步 revoke 可能讓下載在讀取 blob 前
 *   就失效（失敗或 0 位元組），故預設延後回收；傳入 0 才會同步立即回收。
 */
export function downloadBlob(blob: Blob, filename: string, revokeDelayMs = 1000): void {
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
