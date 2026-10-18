/**
 * 取得使用者本地時區的 YYYY-MM-DD 日期字串。
 *
 * 避免使用 `new Date().toISOString().slice(0, 10)`，
 * 因為 toISOString 取的是 UTC 日期，在台灣或亞洲時區（UTC+8）
 * 凌晨 00:00:00 ~ 07:59:59 產出檔名或顯示時會退回前一天。
 */
export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
