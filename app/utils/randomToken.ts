/**
 * 產生一段短隨機英數字元字串，用於拼接唯一 ID（如 `${prefix}${Date.now()}_${randomToken()}`）。
 *
 * 原本在 liars-dice、lucky-wheel、pdf-compressor、pdf-processor 多處各自寫
 * `Math.random().toString(36).substring(2, N)`，前綴、時間戳與夾帶的索引都不同，
 * 無法整段合併成單一 generateId() 函式，但這行隨機字尾的算法完全相同，值得共用。
 */
export function randomToken(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length);
}
