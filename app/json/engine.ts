/**
 * JSON 格式化與驗證引擎輔助純函數
 */

/**
 * 檢測 JSON 文本中是否存在超出 JavaScript 安全整數範圍（|n| > 2^53 - 1）的裸數字。
 * 原生 JSON.parse 會將 64 位元整數（如 Snowflake ID 1848529572918501376）靜默四捨五入造成精度遺失。
 */
export function detectUnsafeLargeIntegers(jsonString: string): boolean {
  if (!jsonString || typeof jsonString !== 'string') return false;

  // 1. 移除字串常數（雙引號包裹的內容，處理轉義字元），避免字串內部的長數字被誤判
  const withoutStrings = jsonString.replace(/"(?:\\.|[^"\\])*"/g, '""');

  // 2. 搜尋連續 16 位以上且可能帶有負號的整數
  const matches = withoutStrings.match(/-?\b\d{16,}\b/g);
  if (!matches) return false;

  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  const minSafe = BigInt(Number.MIN_SAFE_INTEGER);

  for (const m of matches) {
    try {
      const b = BigInt(m);
      if (b > maxSafe || b < minSafe) {
        return true;
      }
    } catch {
      // 忽略非法 BigInt 格式
    }
  }

  return false;
}
