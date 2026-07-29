'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './password.module.css';

const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  symbol: '!@#$%^&*()_+-=[]{}|;:,./<>?',
} as const;

const CONFUSABLE = {
  upper: ['I', 'O', 'Z', 'S', 'B'],
  lower: ['l', 'o'],
  number: ['0', '1', '2', '5', '8'],
  symbol: ['|', ',', '.', '-', '_'],
} as const;

type CharSetKey = keyof typeof CHAR_SETS;

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '線上安全密碼產生器',
    subtitle: 'CSPRNG Password Generator',
    description:
      '專業免費的線上安全密碼生成器，採用 CSPRNG 密碼學隨機數引擎，支援自訂長度、大小寫字母、數字及特殊符號，並可即時評估密碼強度與熵值。',
    langToggleLabel: 'English',
    langToggleUrl: '/password/en/',
    lengthLabel: '密碼長度 (Length)',
    upperLabel: '大寫字母 (A-Z)',
    lowerLabel: '小寫字母 (a-z)',
    numberLabel: '數字 (0-9)',
    symbolLabel: '特殊符號 (!@#...)',
    excludeLabel: '排除相似與混淆字元 (如 1, l, I, 0, O, o 等)',
    strictLabel: '強制每種字元集至少出現一個 (分佈更均勻)',
    generateBtn: '重新生成安全密碼',
    strengthLabel: '密碼安全強度：',
    copyBtn: '複製',
    historyTitle: '歷史生成記錄 (最近 5 組)',
    placeholderSelectCharset: '請至少選擇一種字元集！',
    placeholderNoChars: '字元池過濾後無可用字元！',
    placeholderInitial: '點擊生成按鈕獲取密碼',
    strengthWeak: '弱 (Weak) - 易受爆破',
    strengthMedium: '中等 (Medium) - 尚可安全',
    strengthStrong: '強 (Strong) - 建議採用',
    strengthSecure: '安全 (Secure) - 密碼學防護',
    toastCopied: '已複製密碼到剪貼簿',
    toastCopyHistory: '已複製歷史密碼',
    toastCopyFailed: '複製失敗，請手動複製',
    toastInvalidPassword: '無效的密碼內容',
  },
  en: {
    title: 'Secure Password Generator',
    subtitle: 'CSPRNG Password Generator',
    description:
      'Cryptographically secure online password generator using CSPRNG engine. Customize length, uppercase/lowercase, digits, and symbols with live password strength analysis.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/password/',
    lengthLabel: 'Password Length',
    upperLabel: 'Uppercase (A-Z)',
    lowerLabel: 'Lowercase (a-z)',
    numberLabel: 'Digits (0-9)',
    symbolLabel: 'Symbols (!@#...)',
    excludeLabel: 'Exclude ambiguous chars (e.g. 1, l, I, 0, O, o)',
    strictLabel: 'Include at least one from each selected set',
    generateBtn: 'Generate Secure Password',
    strengthLabel: 'Password Strength:',
    copyBtn: 'Copy',
    historyTitle: 'History (Recent 5)',
    placeholderSelectCharset: 'Please select at least one character set!',
    placeholderNoChars: 'No available characters after filtering!',
    placeholderInitial: 'Click generate to get password',
    strengthWeak: 'Weak - Vulnerable',
    strengthMedium: 'Medium - Fairly Safe',
    strengthStrong: 'Strong - Recommended',
    strengthSecure: 'Secure - Cryptographic',
    toastCopied: 'Copied password to clipboard',
    toastCopyHistory: 'Copied historical password',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastInvalidPassword: 'Invalid password content',
  },
};

function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const maxUint32 = 4294967295;
  const limit = maxUint32 - (maxUint32 % max);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
}

function secureShuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

interface StrengthResult {
  label: string;
  percent: number;
  color: string;
}

function evaluateStrength(
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

export default function PasswordGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const lengthSliderId = useId();
  const useUpperId = useId();
  const useLowerId = useId();
  const useNumberId = useId();
  const useSymbolId = useId();
  const excludeConfusableId = useId();
  const strictModeId = useId();

  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [excludeConfusable, setExcludeConfusable] = useState(false);
  const [strictMode, setStrictMode] = useState(true);

  const [password, setPassword] = useState(t.placeholderInitial);
  const [passwordColor, setPasswordColor] = useState('var(--text-main)');
  const [strength, setStrength] = useState<StrengthResult>({ label: '-', percent: 0, color: 'transparent' });
  const [history, setHistory] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const generatePassword = useCallback(
    (pushHistory = false): string | null => {
      const selected: { key: CharSetKey; chars: string }[] = [];
      if (useUpper) selected.push({ key: 'upper', chars: CHAR_SETS.upper });
      if (useLower) selected.push({ key: 'lower', chars: CHAR_SETS.lower });
      if (useNumber) selected.push({ key: 'number', chars: CHAR_SETS.number });
      if (useSymbol) selected.push({ key: 'symbol', chars: CHAR_SETS.symbol });

      if (selected.length === 0) {
        setPassword(t.placeholderSelectCharset);
        setPasswordColor('#ef4444');
        setStrength({ label: '-', percent: 0, color: 'transparent' });
        return null;
      }
      setPasswordColor('var(--text-main)');

      const processed = selected
        .map(({ key, chars }) => ({
          key,
          chars: excludeConfusable
            ? chars.split('').filter(c => !(CONFUSABLE[key] as readonly string[]).includes(c)).join('')
            : chars,
        }))
        .filter(p => p.chars.length > 0);

      if (processed.length === 0) {
        setPassword(t.placeholderNoChars);
        setPasswordColor('#ef4444');
        return null;
      }

      const chars: string[] = [];
      if (strictMode && length >= processed.length) {
        processed.forEach(p => chars.push(p.chars[secureRandomInt(p.chars.length)]));
      }

      const pool = processed.map(p => p.chars).join('');
      while (chars.length < length) {
        chars.push(pool[secureRandomInt(pool.length)]);
      }
      secureShuffle(chars);

      const pwd = chars.join('');
      setPassword(pwd);
      setStrength(
        evaluateStrength(pwd, processed.length, length, {
          weak: t.strengthWeak,
          medium: t.strengthMedium,
          strong: t.strengthStrong,
          secure: t.strengthSecure,
        })
      );

      if (pushHistory) {
        setHistory(prev => {
          if (prev[0] === pwd) return prev;
          return [pwd, ...prev].slice(0, 5);
        });
      }
      return pwd;
    },
    [
      length,
      useUpper,
      useLower,
      useNumber,
      useSymbol,
      excludeConfusable,
      strictMode,
      t.placeholderSelectCharset,
      t.placeholderNoChars,
      t.strengthWeak,
      t.strengthMedium,
      t.strengthStrong,
      t.strengthSecure,
    ]
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ff66');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 102, 0.6)');
    generatePassword(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    generatePassword(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useNumber, useSymbol, excludeConfusable, strictMode]);

  const handleRegenerate = () => {
    if (password && !password.includes('!') && !password.includes('請') && !password.includes('Please')) {
      setHistory(prev => {
        if (prev[0] === password) return prev;
        return [password, ...prev].slice(0, 5);
      });
    }
    generatePassword(false);
  };

  const copyPassword = () => {
    if (!password || password.includes('!') || password.includes('請') || password.includes('Please')) {
      showToast(t.toastInvalidPassword);
      return;
    }
    navigator.clipboard
      .writeText(password)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const copyHistoryItem = (val: string) => {
    navigator.clipboard
      .writeText(val)
      .then(() => showToast(t.toastCopyHistory))
      .catch(() => showToast(t.toastCopyFailed));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#00ff66"
        accentGlow="rgba(0,255,102,0.6)"
      >
        <div className={styles.mainLayout}>
          {/* Top Bar Language Switcher */}
          <div className="flex justify-end mb-6">
            <Link
              href={t.langToggleUrl}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-glass bg-select-bg text-text-sub hover:text-text-main hover:border-[var(--theme-color,#00ff66)] transition-all no-underline"
            >
              {t.langToggleLabel}
            </Link>
          </div>

          <div className={styles.gridContainer}>
            {/* Options Column */}
            <div className="flex flex-col gap-6">
              <div className={styles.panelCard}>
                {/* Length Slider */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-sm font-semibold text-text-sub uppercase tracking-[1px]">
                    <label htmlFor={lengthSliderId}>{t.lengthLabel}</label>
                    <span className={`font-mono text-xl font-bold ${styles.accentText}`}>{length}</span>
                  </div>
                  <input
                    id={lengthSliderId}
                    type="range"
                    min={4}
                    max={64}
                    value={length}
                    onChange={e => setLength(parseInt(e.target.value))}
                    className={styles.customSlider}
                  />
                </div>

                {/* Character Sets Grid */}
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
                  {[
                    { id: useUpperId, label: t.upperLabel, val: useUpper, set: setUseUpper },
                    { id: useLowerId, label: t.lowerLabel, val: useLower, set: setUseLower },
                    { id: useNumberId, label: t.numberLabel, val: useNumber, set: setUseNumber },
                    { id: useSymbolId, label: t.symbolLabel, val: useSymbol, set: setUseSymbol },
                  ].map(opt => (
                    <label key={opt.id} htmlFor={opt.id} className={styles.customCheckbox}>
                      <input
                        id={opt.id}
                        type="checkbox"
                        checked={opt.val}
                        onChange={e => opt.set(e.target.checked)}
                      />
                      <span className={styles.checkmark} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Advanced Checkboxes */}
                <div className="border-t border-border-glass pt-6 flex flex-col gap-4">
                  {[
                    { id: excludeConfusableId, label: t.excludeLabel, val: excludeConfusable, set: setExcludeConfusable },
                    { id: strictModeId, label: t.strictLabel, val: strictMode, set: setStrictMode },
                  ].map(opt => (
                    <label key={opt.id} htmlFor={opt.id} className={styles.customCheckbox}>
                      <input
                        id={opt.id}
                        type="checkbox"
                        checked={opt.val}
                        onChange={e => opt.set(e.target.checked)}
                      />
                      <span className={styles.checkmark} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Generate Button */}
                <button type="button" onClick={handleRegenerate} className={styles.btnGenerate}>
                  {t.generateBtn}
                </button>
              </div>
            </div>

            {/* Display & History Column */}
            <div className="flex flex-col gap-6">
              {/* Display Card */}
              <div className={styles.displayCard}>
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="font-mono font-bold text-[clamp(1.1rem,3vw,1.6rem)] break-all select-all flex-1 flex items-center min-h-[2.2rem]"
                    style={{ color: passwordColor }}
                  >
                    {password}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      title="Re-generate"
                      className={styles.btnIconOnly}
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                      </svg>
                    </button>
                    <button type="button" onClick={copyPassword} title="Copy" className={styles.btnCopyPrimary}>
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                      </svg>
                      {t.copyBtn}
                    </button>
                  </div>
                </div>

                {/* Strength Indicator */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex justify-between text-sm font-semibold uppercase tracking-[0.5px]">
                    <span className="text-text-sub">{t.strengthLabel}</span>
                    <span className="font-bold transition-colors duration-300" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[.08] rounded-full overflow-hidden border border-border-glass">
                    <div
                      className="h-full rounded-full transition-[width,background-color] duration-400"
                      style={{
                        width: `${strength.percent}%`,
                        backgroundColor: strength.color,
                        boxShadow: `0 0 10px ${strength.color}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* History Card */}
              {history.length > 0 && (
                <div className={styles.historyCard}>
                  <div className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">
                    {t.historyTitle}
                  </div>
                  <div className="flex flex-col gap-2">
                    {history.map((pwd, i) => (
                      <div key={i} className={styles.historyItem}>
                        <span className="font-mono text-sm text-text-main break-all select-all">{pwd}</span>
                        <button
                          type="button"
                          onClick={() => copyHistoryItem(pwd)}
                          title="Copy"
                          className="text-text-sub hover:text-[var(--theme-color,#00ff66)] transition-colors p-1 cursor-pointer bg-none border-none flex shrink-0"
                        >
                          <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#00ff66">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
