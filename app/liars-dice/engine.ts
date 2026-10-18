/**
 * 階乘計算
 */
export function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * 組合數 C(n, k)
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const c = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= c; i++) {
    res = (res * (n - c + i)) / i;
  }
  return Math.round(res);
}

/**
 * 二項分佈機率：剛好出現 k 次的機率
 * P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
 */
export function binomialProbability(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  return combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * 累積二項分佈機率：出現至少 k 次的機率
 * P(X >= k) = sum_{i=k}^n P(X = i)
 */
export function cumulativeBinomialProbability(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let sum = 0;
  for (let i = k; i <= n; i++) {
    sum += binomialProbability(n, i, p);
  }
  return sum;
}

/**
 * 計算各點數出現頻率統計
 */
export function calculateDiceCounts(diceValues: number[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  diceValues.forEach((val) => {
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

/**
 * 產生 1~6 隨機骰子點數 (支援傳入 CSPRNG 亂數陣列或隨機)
 */
export function generateDiceValues(count: number, randomValues?: Uint32Array): number[] {
  const result: number[] = [];
  if (randomValues && randomValues.length >= count) {
    for (let i = 0; i < count; i++) {
      result.push((randomValues[i] % 6) + 1);
    }
  } else {
    for (let i = 0; i < count; i++) {
      result.push(Math.floor(Math.random() * 6) + 1);
    }
  }
  return result.sort((a, b) => a - b);
}

/**
 * 格式化已過時間 (秒數轉為 00m 00s)
 */
export function formatElapsedTime(sec: number): string {
  const mins = Math.floor(sec / 60);
  const remainderSecs = sec % 60;
  const padMins = String(mins).padStart(2, '0');
  const padSecs = String(remainderSecs).padStart(2, '0');
  return `${padMins}m ${padSecs}s`;
}
