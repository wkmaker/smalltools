'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const maxUint32 = 4294967295;
  const limit = maxUint32 - (maxUint32 % max);
  do { crypto.getRandomValues(array); } while (array[0] >= limit);
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

function evaluateStrength(password: string, selectedSetsCount: number, length: number): StrengthResult {
  if (!password) return { label: '-', percent: 0, color: 'transparent' };
  let score = length * 4 + selectedSetsCount * 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const mixCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  score += mixCount * 8;
  if (mixCount === 1) score = Math.min(score, 35);

  if (score < 40)  return { label: '弱 (Weak) - 易受爆破',      percent: 25,  color: '#ff3366' };
  if (score < 65)  return { label: '中等 (Medium) - 尚可安全',   percent: 50,  color: '#ff9900' };
  if (score < 85)  return { label: '強 (Strong) - 建議採用',     percent: 75,  color: '#ffcc00' };
  return           { label: '安全 (Secure) - 密碼學防護',         percent: 100, color: '#00ff66' };
}

export default function PasswordGeneratorClient() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [excludeConfusable, setExcludeConfusable] = useState(false);
  const [strictMode, setStrictMode] = useState(true);

  const [password, setPassword] = useState('點擊生成按鈕獲取密碼');
  const [passwordColor, setPasswordColor] = useState('#ffffff');
  const [strength, setStrength] = useState<StrengthResult>({ label: '-', percent: 0, color: 'transparent' });
  const [history, setHistory] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const generatePassword = useCallback((pushHistory = false): string | null => {
    const selected: { key: CharSetKey; chars: string }[] = [];
    if (useUpper)  selected.push({ key: 'upper',  chars: CHAR_SETS.upper });
    if (useLower)  selected.push({ key: 'lower',  chars: CHAR_SETS.lower });
    if (useNumber) selected.push({ key: 'number', chars: CHAR_SETS.number });
    if (useSymbol) selected.push({ key: 'symbol', chars: CHAR_SETS.symbol });

    if (selected.length === 0) {
      setPassword('請至少選擇一種字元集！');
      setPasswordColor('#ff3366');
      setStrength({ label: '-', percent: 0, color: 'transparent' });
      return null;
    }
    setPasswordColor('#ffffff');

    const processed = selected.map(({ key, chars }) => ({
      key,
      chars: excludeConfusable
        ? chars.split('').filter(c => !(CONFUSABLE[key] as readonly string[]).includes(c)).join('')
        : chars,
    })).filter(p => p.chars.length > 0);

    if (processed.length === 0) {
      setPassword('字元池過濾後無可用字元！');
      return null;
    }

    const chars: string[] = [];
    if (strictMode && length >= processed.length) {
      processed.forEach(p => chars.push(p.chars[secureRandomInt(p.chars.length)]));
    }

    const pool = processed.map(p => p.chars).join('');
    for (let i = 0; i < length - chars.length; i++) {
      chars.push(pool[secureRandomInt(pool.length)]);
    }
    secureShuffle(chars);

    const pwd = chars.join('');
    setPassword(pwd);
    setStrength(evaluateStrength(pwd, processed.length, length));

    if (pushHistory) {
      setHistory(prev => {
        if (prev[0] === pwd) return prev;
        return [pwd, ...prev].slice(0, 5);
      });
    }
    return pwd;
  }, [length, useUpper, useLower, useNumber, useSymbol, excludeConfusable, strictMode]);

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
    if (password && !password.includes('請') && !password.includes('字元')) {
      setHistory(prev => {
        if (prev[0] === password) return prev;
        return [password, ...prev].slice(0, 5);
      });
    }
    generatePassword(false);
  };

  const copyPassword = () => {
    if (!password || password.includes('請') || password.includes('字元')) {
      showToast('無效的密碼內容');
      return;
    }
    navigator.clipboard.writeText(password)
      .then(() => showToast('已複製密碼到剪貼簿'))
      .catch(() => showToast('複製失敗，請手動複製'));
  };

  const copyHistoryItem = (val: string) => {
    navigator.clipboard.writeText(val).then(() => showToast('已複製歷史密碼'));
  };

  return (
    <>
      <style>{`
        .custom-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px;
          border-radius: 3px; background: rgba(255,255,255,0.05); outline: none; transition: background 0.3s; }
        .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%; background: #ffffff;
          border: 2px solid #00ff66; box-shadow: 0 0 8px #00ff66;
          cursor: pointer; transition: transform 0.2s, background-color 0.2s; }
        .custom-slider::-webkit-slider-thumb:hover { transform: scale(1.2); background: #00ff66; }
        .custom-checkbox input { display: none; }
        .checkmark { width: 18px; height: 18px; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; background: rgba(255,255,255,0.02);
          display: inline-block; position: relative; transition: all 0.3s; flex-shrink: 0; }
        .custom-checkbox:hover .checkmark { border-color: rgba(0,255,102,0.4); }
        .custom-checkbox input:checked + .checkmark {
          background: #00ff66; border-color: #00ff66; box-shadow: 0 0 8px rgba(0,255,102,0.5); }
        .custom-checkbox input:checked + .checkmark::after {
          content: ''; position: absolute; left: 6px; top: 2px;
          width: 4px; height: 8px; border: solid #030305; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .slide-down { animation: slideDown 0.4s ease forwards; }
      `}</style>

      <ToolLayout
        title="線上安全密碼產生器"
        subtitle="CSPRNG Password Generator"
        description="專業免費的線上安全密碼生成器，採用 CSPRNG 密碼學隨機數引擎，支援自訂長度、大小寫字母、數字及特殊符號，並可即時評估密碼強度與熵值。"
        accentColor="#00ff66"
        accentGlow="rgba(0,255,102,0.6)"
      >
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 items-start text-left max-[900px]:grid-cols-1 max-[900px]:gap-6">
          {/* 左欄：控制選項區 (options-container) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/[.005] border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              {/* 密碼長度 Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-sm font-medium text-text-sub uppercase tracking-[0.5px]">
                  <span>密碼長度 (Length)</span>
                  <span
                    className="font-mono text-xl font-bold text-[#00ff66]"
                    style={{ textShadow: '0 0 10px rgba(0, 255, 102, 0.4)' }}
                  >
                    {length}
                  </span>
                </div>
                <input
                  type="range" min={4} max={64} value={length}
                  onChange={e => setLength(parseInt(e.target.value))}
                  className="custom-slider"
                />
              </div>

              {/* 字元集複選 */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
                {([
                  { id: 'upper',  label: '大寫字母 (A-Z)',       val: useUpper,  set: setUseUpper },
                  { id: 'lower',  label: '小寫字母 (a-z)',       val: useLower,  set: setUseLower },
                  { id: 'number', label: '數字 (0-9)',            val: useNumber, set: setUseNumber },
                  { id: 'symbol', label: '特殊符號 (!@#...)',     val: useSymbol, set: setUseSymbol },
                ] as const).map(opt => (
                  <label key={opt.id} className="custom-checkbox flex items-center gap-2.5 cursor-pointer select-none text-[0.9rem] text-[#d1d5db] hover:text-white transition-colors">
                    <input type="checkbox" checked={opt.val} onChange={e => (opt.set as (v: boolean) => void)(e.target.checked)} />
                    <span className="checkmark" />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* 高級選項 */}
              <div className="border-t border-white/[.05] pt-6 flex flex-col gap-4">
                {([
                  { id: 'exclude', label: '排除相似與混淆字元 (如 1, l, I, 0, O, o 等)', val: excludeConfusable, set: setExcludeConfusable },
                  { id: 'strict',  label: '強制每種字元集至少出現一個 (分佈更均勻)',     val: strictMode,        set: setStrictMode },
                ] as const).map(opt => (
                  <label key={opt.id} className="custom-checkbox flex items-center gap-2.5 cursor-pointer select-none text-[0.9rem] text-[#d1d5db] hover:text-white transition-colors">
                    <input type="checkbox" checked={opt.val} onChange={e => (opt.set as (v: boolean) => void)(e.target.checked)} />
                    <span className="checkmark" />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* 重新生成滿版按鈕 */}
              <button
                onClick={handleRegenerate}
                className="mt-1 w-full h-[42px] flex items-center justify-center gap-2 text-[0.95rem] font-medium tracking-[1.5px]
                  bg-[rgba(0,255,102,0.15)] border border-[rgba(0,255,102,0.4)] text-[#00ff66] rounded-lg
                  transition-all duration-300 hover:bg-[#00ff66] hover:text-[#030305] hover:shadow-[0_0_15px_rgba(0,255,102,0.4)]
                  cursor-pointer"
              >
                重新生成安全密碼
              </button>
            </div>
          </div>

          {/* 右欄：展示與歷史紀錄區 (column-right) */}
          <div className="flex flex-col gap-6">
            {/* 密碼展示大卡片 (password-display-card) */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-5
              transition-all duration-300 hover:border-[rgba(0,255,102,0.2)] hover:shadow-[0_0_20px_rgba(0,255,102,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <span
                  className="font-mono font-bold text-[clamp(1.1rem,3vw,1.6rem)] text-white break-all select-all flex-1 flex items-center min-h-[2.2rem]"
                  style={{ color: passwordColor, textShadow: '0 0 15px rgba(255,255,255,0.1)' }}
                >
                  {password}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleRegenerate} title="重新生成"
                    className="flex items-center justify-center w-[38px] h-[38px] bg-white/[.03] border border-white/[.08] text-white rounded-lg
                      cursor-pointer transition-all hover:bg-[rgba(0,255,102,0.08)] hover:border-[rgba(0,255,102,0.4)] hover:text-[#00ff66] hover:shadow-[0_0_12px_rgba(0,255,102,0.15)]">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </svg>
                  </button>
                  <button onClick={copyPassword} title="複製密碼"
                    className="flex items-center gap-1.5 px-4 h-[38px] bg-[rgba(0,255,102,0.15)] border border-[rgba(0,255,102,0.4)] text-[#00ff66] rounded-lg
                      cursor-pointer transition-all hover:bg-[#00ff66] hover:text-[#030305] hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] font-medium text-sm">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                    複製
                  </button>
                </div>
              </div>

              {/* 密碼強度視覺看板 (strength-indicator-section) */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between text-xs uppercase tracking-[0.5px]">
                  <span className="text-text-sub">密碼安全強度：</span>
                  <span className="font-bold transition-colors duration-300" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-white/[.05] rounded-full overflow-hidden border border-white/[.02]">
                  <div
                    className="h-full rounded-full transition-[width,background-color] duration-400"
                    style={{ width: `${strength.percent}%`, backgroundColor: strength.color, boxShadow: `0 0 10px ${strength.color}` }}
                  />
                </div>
              </div>
            </div>

            {/* 歷史紀錄卡片 (history-section - 有點擊重新生成才展開) */}
            {history.length > 0 && (
              <div className="bg-white/[.003] border border-white/[.08] rounded-2xl p-6 flex flex-col gap-3 slide-down mt-1">
                <div className="text-xs text-text-sub uppercase tracking-[0.5px] mb-1">歷史生成記錄 (最近 5 組)</div>
                <div className="flex flex-col gap-2">
                  {history.map((pwd, i) => (
                    <div key={i} className="flex justify-between items-center gap-4 bg-black/20 border border-white/[.02] rounded-lg px-4 py-2.5
                      transition-colors hover:bg-white/[.015]">
                      <span className="font-mono text-[0.95rem] text-[#d1d5db] break-all select-all">{pwd}</span>
                      <button onClick={() => copyHistoryItem(pwd)} title="複製此組密碼"
                        className="text-text-sub hover:text-[#00ff66] transition-colors p-1 cursor-pointer bg-none border-none flex shrink-0">
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
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(0,255,102,0.15)] border border-[rgba(0,255,102,0.3)] backdrop-blur-[10px] text-[#00ff66]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

