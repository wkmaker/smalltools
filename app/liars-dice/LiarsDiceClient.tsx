'use client';

import React, { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import ToolLayout from '../components/ToolLayout';
import Link from 'next/link';
import styles from './liars-dice.module.css';

interface HistoryItem {
  id: string;
  timeString: string;
  dice: number[];
}

interface Translations {
  title: string;
  subtitle: string;
  description: string;
  antiCheatTitle: string;
  lastRollTime: string;
  elapsedTime: string;
  notRolledYet: string;
  diceCountLabel: string;
  rollButton: string;
  rolling: string;
  coverCup: string;
  revealCup: string;
  peekBtn: string;
  autoCoverLabel: string;
  summaryTitle: string;
  historyTitle: string;
  historySubtitle: string;
  clearHistory: string;
  emptyHistory: string;
  oneIsWild: string;
  wildDesc: string;
  diceUnit: string;
  fullscreen: string;
  exitFullscreen: string;
}

const TRANSLATIONS: Record<'zh-TW' | 'en', Translations> = {
  'zh-TW': {
    title: '吹牛骰子搖骰器',
    subtitle: 'LIAR\'S DICE ROLLER',
    description: '專為派對酒吧吹牛遊戲打造！具備防作弊計時器（精確顯示距離上次搖骰過了多久）與歷史 5 次紀錄，支援搖骰音效與杯蓋遮擋。',
    antiCheatTitle: '防作弊防重複搖骰看板',
    lastRollTime: '最後搖骰時間',
    elapsedTime: '已過時間',
    notRolledYet: '尚無搖骰紀錄，準備開始遊戲！',
    diceCountLabel: '骰子顆數',
    rollButton: '搖骰子！',
    rolling: '搖骰中...',
    coverCup: '蓋上骰杯',
    revealCup: '開蓋揭曉',
    peekBtn: '按住窺視',
    autoCoverLabel: '搖骰後自動遮蓋',
    summaryTitle: '當前盤面點數統計',
    historyTitle: '搖骰歷史紀錄',
    historySubtitle: '（保留最新 5 筆）',
    clearHistory: '清除紀錄',
    emptyHistory: '尚無歷史紀錄',
    oneIsWild: '1 點為萬能點數 (Wild)',
    wildDesc: '吹牛常見規則：尚未喊過 1 點時，1 點可當作任何點數。',
    diceUnit: '顆',
    fullscreen: '全螢幕舞台',
    exitFullscreen: '退出全螢幕',
  },
  en: {
    title: 'Liar\'s Dice Roller',
    subtitle: 'LIAR\'S DICE ROLLER',
    description: 'Designed for Liar\'s Dice party games! Features an anti-cheat timer (displays time elapsed since last roll) and logs top 5 history records.',
    antiCheatTitle: 'Anti-Cheat Timer Banner',
    lastRollTime: 'Last Roll Time',
    elapsedTime: 'Time Elapsed',
    notRolledYet: 'No roll yet. Ready for the game!',
    diceCountLabel: 'Dice Count',
    rollButton: 'Roll Dice!',
    rolling: 'Rolling...',
    coverCup: 'Cover Cup',
    revealCup: 'Reveal Dice',
    peekBtn: 'Hold to Peek',
    autoCoverLabel: 'Auto-cover after roll',
    summaryTitle: 'Current Dice Summary',
    historyTitle: 'Roll History',
    historySubtitle: '(Top 5 recent records)',
    clearHistory: 'Clear History',
    emptyHistory: 'No history yet',
    oneIsWild: '1 is Wild',
    wildDesc: 'Common Liar\'s Dice rule: 1s count as any number unless 1s have been called.',
    diceUnit: 'dice',
    fullscreen: 'Fullscreen Stage',
    exitFullscreen: 'Exit Fullscreen',
  },
};

// 渲染單顆 SVG 骰子圖示
const DiceFace: React.FC<{ value: number }> = ({ value }) => {
  const getDots = () => {
    switch (value) {
      case 1:
        return <circle cx="24" cy="24" r="7" fill="#dc2626" />;
      case 2:
        return (
          <>
            <circle cx="13" cy="13" r="4.5" fill="#1e293b" />
            <circle cx="35" cy="35" r="4.5" fill="#1e293b" />
          </>
        );
      case 3:
        return (
          <>
            <circle cx="12" cy="12" r="4" fill="#1e293b" />
            <circle cx="24" cy="24" r="4" fill="#1e293b" />
            <circle cx="36" cy="36" r="4" fill="#1e293b" />
          </>
        );
      case 4:
        return (
          <>
            <circle cx="13" cy="13" r="4.5" fill="#dc2626" />
            <circle cx="35" cy="13" r="4.5" fill="#dc2626" />
            <circle cx="13" cy="35" r="4.5" fill="#dc2626" />
            <circle cx="35" cy="35" r="4.5" fill="#dc2626" />
          </>
        );
      case 5:
        return (
          <>
            <circle cx="12" cy="12" r="4" fill="#1e293b" />
            <circle cx="36" cy="12" r="4" fill="#1e293b" />
            <circle cx="24" cy="24" r="4" fill="#1e293b" />
            <circle cx="12" cy="36" r="4" fill="#1e293b" />
            <circle cx="36" cy="36" r="4" fill="#1e293b" />
          </>
        );
      case 6:
        return (
          <>
            <circle cx="13" cy="12" r="4" fill="#1e293b" />
            <circle cx="35" cy="12" r="4" fill="#1e293b" />
            <circle cx="13" cy="24" r="4" fill="#1e293b" />
            <circle cx="35" cy="24" r="4" fill="#1e293b" />
            <circle cx="13" cy="36" r="4" fill="#1e293b" />
            <circle cx="35" cy="36" r="4" fill="#1e293b" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full p-1.5">
      <rect width="48" height="48" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      {getDots()}
    </svg>
  );
};

export default function LiarsDiceClient({ lang = 'zh-TW' }: { lang?: 'zh-TW' | 'en' }) {
  const t = TRANSLATIONS[lang];
  const diceCountSelectId = useId();
  const autoCoverCheckId = useId();

  // 狀態設定
  const [diceCount, setDiceCount] = useState<number>(5);
  const [diceValues, setDiceValues] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isCovered, setIsCovered] = useState<boolean>(false);
  const [autoCover, setAutoCover] = useState<boolean>(true);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);

  // 防作弊計時器 state
  const [lastRollTimestamp, setLastRollTimestamp] = useState<number | null>(null);
  const [lastRollTimeStr, setLastRollTimeStr] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // 歷史 5 次紀錄 state (預設折疊隱藏，防對手偷看並保持版面清爽)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // 全螢幕沉浸舞台 state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 動態主題設定
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.6)');
  }, []);

  // 防作弊計時器更新 loop
  useEffect(() => {
    if (!lastRollTimestamp) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - lastRollTimestamp) / 1000);
      setElapsedSeconds(diff >= 0 ? diff : 0);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [lastRollTimestamp]);

  // 全域 Web Audio Context 與 Master Volume Ref (徹底防止多重音訊重疊引發削波雜音)
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const masterGainRef = React.useRef<GainNode | null>(null);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        // 建立主控防削波動態壓縮器 (Master Dynamics Compressor)
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, ctx.currentTime);
        compressor.knee.setValueAtTime(25, ctx.currentTime);
        compressor.ratio.setValueAtTime(10, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.15, ctx.currentTime);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.55, ctx.currentTime); // 主音量安全上限，防爆音雜音

        masterGain.connect(compressor);
        compressor.connect(ctx.destination);

        audioCtxRef.current = ctx;
        masterGainRef.current = masterGain;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  // Web Audio 高保真擬真 0.9s 手甩物理搖骰音效 (HD Noise-Free Audio Engine)
  const playShakeSound = () => {
    try {
      const ctx = getAudioContext();
      const masterNode = masterGainRef.current;
      if (!ctx || !masterNode) return;
      const now = ctx.currentTime;

      // 產生 1.2 秒白噪音 Buffer 用於模擬實體撞擊
      const bufferSize = ctx.sampleRate * 1.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // 每次甩動隨機決定手甩特徵 (力道、總時長、起手相位與頻率基底)
      const hitCount = Math.floor(16 + Math.random() * 6); // 16 ~ 22 次極致顆粒清脆動態碰撞
      const totalDuration = 0.84 + Math.random() * 0.08; // 0.84s ~ 0.92s 總時長 (約 0.9 秒)
      const intensity = 0.85 + Math.random() * 0.3; // 手甩力道增益
      const cupToneBase = 140 + Math.random() * 40; // 杯壁低頻共振基準值
      const phaseOffset = Math.random() * Math.PI * 2; // 隨機相位偏移

      // 1. 第一聲手甩起手爆發強撞擊 (Initial Crisp Break)
      const initTime = now + 0.01;
      const initNoise = ctx.createBufferSource();
      initNoise.buffer = noiseBuffer;

      const initFilter = ctx.createBiquadFilter();
      initFilter.type = 'bandpass';
      initFilter.frequency.setValueAtTime(2600 + Math.random() * 1000, initTime);
      initFilter.Q.setValueAtTime(4, initTime);

      const initGain = ctx.createGain();
      const initVol = (0.35 + Math.random() * 0.2) * intensity;
      initGain.gain.setValueAtTime(initVol, initTime);
      initGain.gain.exponentialRampToValueAtTime(0.001, initTime + 0.025);

      initNoise.connect(initFilter);
      initFilter.connect(initGain);
      initGain.connect(masterNode);

      initNoise.start(initTime);
      initNoise.stop(initTime + 0.03);

      // 2. 模擬 16 ~ 22 次高速滾動與顆粒碰撞 (Double-Swish Rhythm)
      for (let i = 0; i < hitCount; i++) {
        const progress = i / hitCount;
        
        // 帶隨機相位的波浪加速曲線
        const waveRhythm = Math.sin(progress * Math.PI * 3 + phaseOffset) * 0.04;
        const hitTime = now + 0.02 + progress * totalDuration + waveRhythm + (Math.random() - 0.5) * 0.02;
        const hitDuration = 0.012 + Math.random() * 0.015;

        // 清爽白噪音切片 (聚焦高 Q 值 2200Hz ~ 4000Hz 塑料點擊頻率，防雜音)
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2200 + Math.random() * 1800, hitTime);
        bandpass.Q.setValueAtTime(3.5 + Math.random() * 2, hitTime);

        const noiseGain = ctx.createGain();
        const hitVol = (0.15 + Math.pow(Math.random(), 0.7) * 0.25) * intensity;
        noiseGain.gain.setValueAtTime(hitVol, hitTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, hitTime + hitDuration);

        noiseSrc.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(masterNode);

        noiseSrc.start(hitTime);
        noiseSrc.stop(hitTime + hitDuration + 0.01);

        // 低頻杯壁撞擊共振 (Subtle Thud)
        const thudOsc = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(cupToneBase + Math.random() * 30, hitTime);
        thudOsc.frequency.exponentialRampToValueAtTime(55, hitTime + hitDuration);

        thudGain.gain.setValueAtTime(0.12 * intensity, hitTime);
        thudGain.gain.exponentialRampToValueAtTime(0.002, hitTime + hitDuration);

        thudOsc.connect(thudGain);
        thudGain.connect(masterNode);

        thudOsc.start(hitTime);
        thudOsc.stop(hitTime + hitDuration);
      }

      // 3. 落定撞擊 (Final Solid Clatter Impact)
      const finalTime = now + totalDuration + 0.02;
      const finalNoise = ctx.createBufferSource();
      finalNoise.buffer = noiseBuffer;

      const finalFilter = ctx.createBiquadFilter();
      finalFilter.type = 'bandpass';
      finalFilter.frequency.setValueAtTime(2600 + Math.random() * 400, finalTime);
      finalFilter.Q.setValueAtTime(4, finalTime);

      const finalGain = ctx.createGain();
      finalGain.gain.setValueAtTime(0.55 * intensity, finalTime);
      finalGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 0.06);

      finalNoise.connect(finalFilter);
      finalFilter.connect(finalGain);
      finalGain.connect(masterNode);

      finalNoise.start(finalTime);
      finalNoise.stop(finalTime + 0.07);

      // 4. 有 60% 機率帶一次極輕的 15ms 微弱二次彈跳落定 (Secondary Bounce Drop)
      if (Math.random() > 0.4) {
        const bounceTime = finalTime + 0.04 + Math.random() * 0.02;
        const bounceNoise = ctx.createBufferSource();
        bounceNoise.buffer = noiseBuffer;

        const bounceFilter = ctx.createBiquadFilter();
        bounceFilter.type = 'bandpass';
        bounceFilter.frequency.setValueAtTime(3200, bounceTime);
        bounceFilter.Q.setValueAtTime(3, bounceTime);

        const bounceGain = ctx.createGain();
        bounceGain.gain.setValueAtTime(0.15 * intensity, bounceTime);
        bounceGain.gain.exponentialRampToValueAtTime(0.001, bounceTime + 0.03);

        bounceNoise.connect(bounceFilter);
        bounceFilter.connect(bounceGain);
        bounceGain.connect(masterNode);

        bounceNoise.start(bounceTime);
        bounceNoise.stop(bounceTime + 0.04);
      }

    } catch {
      // 忽略不支援音效的情境
    }
  };

  // 手機震動觸覺反饋 (Web Vibration API Haptic Feedback)
  const triggerHapticFeedback = (type: 'roll' | 'peek') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'roll') {
          // 0.9 秒實體骰子撞擊與滾動動態脈衝陣列 (連續微震動 ➔ 0.9s 落定重震)
          navigator.vibrate([
            22, 35, 18, 30, 25, 40, 18, 35, 22, 45, 18, 30, 25, 40, 18, 35, 30, 60, 45
          ]);
        } else if (type === 'peek') {
          // 按住窺視 15ms 輕微點擊回饋
          navigator.vibrate(15);
        }
      } catch {
        // 忽略不支援震動的平台 (例如 PC 桌面端)
      }
    }
  };

  // 密碼學安全隨機數生成器 (Web Cryptography API CSPRNG)
  const getCryptoRandomDice = (count: number): number[] => {
    const result: number[] = [];
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const randomBuffer = new Uint32Array(count);
      window.crypto.getRandomValues(randomBuffer);
      for (let i = 0; i < count; i++) {
        result.push((randomBuffer[i] % 6) + 1);
      }
    } else {
      for (let i = 0; i < count; i++) {
        result.push(Math.floor(Math.random() * 6) + 1);
      }
    }
    return result;
  };

  // 執行搖骰
  const handleRollDice = () => {
    if (isShaking) return;
    setIsShaking(true);
    playShakeSound();
    triggerHapticFeedback('roll');

    if (autoCover) {
      setIsCovered(true);
    }

    // 模擬擺動與骰子亂數產生 (0.9 秒真實手甩動畫與音效同步)
    setTimeout(() => {
      const newDice = getCryptoRandomDice(diceCount);
      newDice.sort((a, b) => a - b); // 自動從小到大排列，利於吹牛看牌
      setDiceValues(newDice);
      setIsShaking(false);

      const now = new Date();
      const timestamp = now.getTime();
      const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });

      setLastRollTimestamp(timestamp);
      setLastRollTimeStr(timeStr);
      setElapsedSeconds(0);

      // 新增至歷史前 5 次紀錄 (最新置頂，最多留 5 筆)
      const newItem: HistoryItem = {
        id: timestamp.toString() + Math.random().toString(36).substring(2, 5),
        timeString: timeStr,
        dice: newDice,
      };

      setHistory((prev) => [newItem, ...prev].slice(0, 5));
    }, 900);
  };

  // 格式化 elapsed time 顯示 (例如 02 分 15 秒)
  const formatElapsedTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSecs = sec % 60;
    const padMins = String(mins).padStart(2, '0');
    const padSecs = String(remainderSecs).padStart(2, '0');
    return `${padMins}m ${padSecs}s`;
  };

  // 當前點數統計
  const getDiceCounts = () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    diceValues.forEach((val) => {
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  const counts = getDiceCounts();

  const renderContent = (inPortal = false) => (
    <div className={`${styles.mainCard} ${inPortal ? 'w-full max-w-[860px] mx-auto border-none shadow-none bg-transparent' : ''}`}>
      {/* 頂部全螢幕退出提示列 (僅 Portal 模式展示) */}
      {inPortal && (
        <div className="flex justify-between items-center pb-2 border-b border-border-glass mb-2">
          <div className="text-sm font-bold text-text-main flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ffb800]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
            </svg>
            <span>{t.title} - {t.fullscreen}</span>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-select-bg border border-border-glass text-text-main hover:border-[#ffb800] transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#ffb800]" viewBox="0 0 24 24">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
            <span>{t.exitFullscreen}</span>
          </button>
        </div>
      )}

      {/* 防作弊計時器 Banner */}
      <div className={styles.timerBanner}>
        <div className="text-sm font-semibold text-text-sub mb-1 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-[#ffb800]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <span>{t.antiCheatTitle}</span>
        </div>
        {lastRollTimestamp ? (
          <div>
            <div className={styles.timerDigit}>{formatElapsedTime(elapsedSeconds)}</div>
            <div className="text-xs text-text-sub mt-1">
              {t.lastRollTime}: <span className="font-mono font-bold text-text-main">{lastRollTimeStr}</span>
            </div>
          </div>
        ) : (
          <div className="text-base font-medium text-text-sub py-2">{t.notRolledYet}</div>
        )}
      </div>

      {/* 頂部設定選單 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border-glass">
        <div className="flex items-center gap-3">
          <label htmlFor={diceCountSelectId + (inPortal ? '_portal' : '')} className="text-sm font-semibold text-text-sub">
            {t.diceCountLabel}:
          </label>
          <select
            id={diceCountSelectId + (inPortal ? '_portal' : '')}
            value={diceCount}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDiceCount(val);
              setDiceValues(Array.from({ length: val }, () => 1));
            }}
            className="bg-select-bg border border-border-glass rounded-lg px-3 py-1.5 text-sm font-semibold text-text-main focus:outline-none focus:border-[#ffb800]"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num} {t.diceUnit}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={autoCoverCheckId + (inPortal ? '_portal' : '')}
            checked={autoCover}
            onChange={(e) => setAutoCover(e.target.checked)}
            className="w-4 h-4 accent-[#ffb800] rounded cursor-pointer"
          />
          <label htmlFor={autoCoverCheckId + (inPortal ? '_portal' : '')} className="text-sm font-medium text-text-sub cursor-pointer">
            {t.autoCoverLabel}
          </label>
        </div>
      </div>

      {/* 骰杯 / 骰子展示區 */}
      <div className={`${styles.cupArea} ${isShaking ? styles.shaking : ''} ${isPeeking ? styles.cupAreaPeeking : ''}`}>

        {/* 遮蓋蓋子 (Cup Cover) - 點擊/按住中央蓋子區域亦可直接窺視 */}
        {isCovered && (
          <div
            className={`${styles.cupCover} ${isPeeking ? styles.cupCoverPeeking : ''} select-none touch-none cursor-pointer`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // ignore
              }
              setIsPeeking(true);
              triggerHapticFeedback('peek');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              } catch {
                // ignore
              }
              setIsPeeking(false);
            }}
            onPointerCancel={() => setIsPeeking(false)}
          >
            <svg className={styles.cupCoverIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <div className="text-lg font-bold mb-1">{t.coverCup}</div>
            <div className="text-xs text-text-sub font-medium bg-black/20 dark:bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-current text-[#ffb800]" viewBox="0 0 24 24">
                <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zM18.84 15.87l-4.54-2.26c-.19-.1-.4-.15-.61-.15H13v-6c0-.55-.45-1-1-1s-1 .45-1 1v8.5l-3.61-.76c-.09-.02-.19-.03-.28-.03-.41 0-.79.17-1.06.44l-.88.89 5.37 5.38c.37.37.88.58 1.41.58h6.86c.99 0 1.84-.73 1.98-1.72l.66-4.66c.12-.85-.32-1.69-1.1-2.08z" />
              </svg>
              <span>{lang === 'zh-TW' ? '按住此處即可窺視' : 'Hold here to peek'}</span>
            </div>
          </div>
        )}

        {/* 骰子呈現網格 */}
        <div className={styles.diceGrid}>
          {diceValues.map((val, idx) => (
            <div key={idx} className={`${styles.diceCard} ${isPeeking ? styles.diceCardPeeking : ''}`}>
              <DiceFace value={val} />
            </div>
          ))}
        </div>
      </div>

      {/* 控制按鈕組 */}
      <div className={styles.actionBtnGroup}>
        <button type="button" onClick={handleRollDice} disabled={isShaking} className={styles.actionBtnPrimary}>
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
          </svg>
          <span>{isShaking ? t.rolling : t.rollButton}</span>
        </button>

        {isCovered ? (
          <button
            type="button"
            onClick={() => setIsCovered(false)}
            className={styles.actionBtnSecondary}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span>{t.revealCup}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCovered(true)}
            className={styles.actionBtnSecondary}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <span>{t.coverCup}</span>
          </button>
        )}
      </div>

      {/* 當前盤面點數統計看板 (僅在完全開蓋時展示，保持 Peek 時 0 變動 0 閃爍) */}
      {!isCovered && (
        <div className={styles.summaryBox}>
          <div className="text-sm font-semibold text-text-main mb-2">{t.summaryTitle}</div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className={styles.summaryBadge}>
                <span>{num} 點:</span>
                <span className="font-bold text-text-main">{counts[num] || 0}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-text-sub flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[#ffb800] shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
            </svg>
            <div>
              <span className="font-semibold">{t.oneIsWild}:</span> {t.wildDesc}
            </div>
          </div>
        </div>
      )}

      {/* 歷史 5 次紀錄區塊 */}
      <div className="mt-8 pt-6 border-t border-border-glass">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-text-main inline-flex items-center gap-2">
              <svg className="w-4 h-4 text-[#ffb800] fill-current" viewBox="0 0 24 24">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
              </svg>
              <span>{t.historyTitle}</span>
            </h3>
            <span className="text-xs text-text-sub ml-2">{t.historySubtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                <span>{t.clearHistory}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={styles.historyToggleBtn}
            >
              <span>
                {showHistory
                  ? (lang === 'zh-TW' ? '折疊紀錄' : 'Hide History')
                  : (lang === 'zh-TW' ? '展開紀錄' : 'Show History')}
              </span>
              <svg
                className={`w-3.5 h-3.5 fill-current transition-transform duration-300 ${
                  showHistory ? 'rotate-180 text-[#ffb800]' : 'rotate-0 text-text-sub'
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          </div>
        </div>

        {showHistory && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-6 text-sm text-text-sub">{t.emptyHistory}</div>
            ) : (
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={item.id} className={styles.historyCard}>
                    <div className="flex items-center justify-between text-xs text-text-sub">
                      <span className="font-semibold text-text-main">
                        #{history.length - idx} {lang === 'zh-TW' ? '次搖骰' : 'Roll'}
                      </span>
                      <span className={styles.historyTime}>{item.timeString}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.dice.map((d, dIdx) => (
                        <span
                          key={dIdx}
                          className="w-7 h-7 bg-white text-black font-bold rounded-md flex items-center justify-center text-xs shadow-sm border border-slate-300"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#ffb800"
      accentGlow="rgba(255, 184, 0, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'zh-TW' ? '/liars-dice/en/' : '/liars-dice/'}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {lang === 'zh-TW' ? 'English' : '繁體中文'}
        </Link>
      }
    >
      <div className={styles.container}>
        {/* 全螢幕按鈕 */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-select-bg border border-border-glass text-text-main hover:border-[#ffb800] transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#ffb800]" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <span>{t.fullscreen}</span>
          </button>
        </div>

        {/* 普通模式核心面板 */}
        {renderContent(false)}
      </div>

      {/* 全螢幕模式 (透過 Portal 頂層渲染至 document.body) */}
      {isFullscreen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className={styles.fullscreenStage}>
            <div className={styles.fullscreenInner}>
              {renderContent(true)}
            </div>
          </div>,
          document.body
        )}
    </ToolLayout>
  );
}
