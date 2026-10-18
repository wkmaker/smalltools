export const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  commonSymbol: '!@#$%^&*_-+=',
  otherSymbol: '()[]{}.,:;?',
} as const;

export const CONFUSABLE = {
  upper: ['I', 'O', 'Z', 'S', 'B'],
  lower: ['l', 'o'],
  number: ['0', '1', '2', '5', '8'],
  commonSymbol: ['-', '_'],
  otherSymbol: [',', '.'],
} as const;

export type CharSetKey = keyof typeof CHAR_SETS;

export interface StrengthResult {
  label: string;
  percent: number;
  color: string;
}

export function secureRandomInt(max: number, randomUint32?: number): number {
  if (max <= 0) return 0;
  if (randomUint32 !== undefined) {
    return randomUint32 % max;
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    const maxUint32 = 4294967295;
    const limit = maxUint32 - (maxUint32 % max);
    do {
      crypto.getRandomValues(array);
    } while (array[0] >= limit);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function secureShuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function evaluateStrength(
  password: string,
  selectedSetsCount: number,
  length: number,
  labels: { weak: string; medium: string; strong: string; secure: string }
): StrengthResult {
  if (!password) return { label: '-', percent: 0, color: 'transparent' };
  let score = length * 4 + selectedSetsCount * 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const mixCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  score += mixCount * 8;
  if (mixCount === 1) score = Math.min(score, 35);

  if (score < 40) return { label: labels.weak, percent: 25, color: '#ef4444' };
  if (score < 65) return { label: labels.medium, percent: 50, color: '#f59e0b' };
  if (score < 85) return { label: labels.strong, percent: 75, color: '#eab308' };
  return { label: labels.secure, percent: 100, color: '#10b981' };
}

export interface PasswordConfig {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumber: boolean;
  useCommonSymbol: boolean;
  useOtherSymbol: boolean;
  excludeConfusable: boolean;
  strictMode: boolean;
}

export function buildPassword(config: PasswordConfig): string | null {
  const selected: { key: CharSetKey; chars: string }[] = [];
  if (config.useUpper) selected.push({ key: 'upper', chars: CHAR_SETS.upper });
  if (config.useLower) selected.push({ key: 'lower', chars: CHAR_SETS.lower });
  if (config.useNumber) selected.push({ key: 'number', chars: CHAR_SETS.number });
  if (config.useCommonSymbol) selected.push({ key: 'commonSymbol', chars: CHAR_SETS.commonSymbol });
  if (config.useOtherSymbol) selected.push({ key: 'otherSymbol', chars: CHAR_SETS.otherSymbol });

  if (selected.length === 0) return null;

  const processed = selected
    .map(({ key, chars }) => ({
      key,
      chars: config.excludeConfusable
        ? chars.split('').filter((c) => !(CONFUSABLE[key] as readonly string[]).includes(c)).join('')
        : chars,
    }))
    .filter((p) => p.chars.length > 0);

  if (processed.length === 0) return null;

  const chars: string[] = [];
  if (config.strictMode && config.length >= processed.length) {
    processed.forEach((p) => chars.push(p.chars[secureRandomInt(p.chars.length)]));
  }

  const pool = processed.map((p) => p.chars).join('');
  while (chars.length < config.length) {
    chars.push(pool[secureRandomInt(pool.length)]);
  }
  secureShuffle(chars);

  return chars.join('');
}
