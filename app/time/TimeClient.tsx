'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './time.module.css';

const ALL_UNITS = ['y', 'M', 'd', 'h', 'm', 's'];

const TRANSLATIONS = {
  'zh-TW': {
    title: '線上目標計時器',
    subtitle: 'TARGET COUNTDOWN TIMER',
    description: '唯美精緻的線上目標計時器與倒數工具！支援自訂事件標題、年/月/日/時/分/秒自由組合顯示、全螢幕播放與一鍵複製分享連結。適用於考試倒數、結婚紀念日與時間管理。',
    defaultEventTitle: '2027 新年倒數',
    setupHeader: '設定目標事件與時間',
    eventTitleLabel: '事件名稱 (Event Title)',
    eventTitlePlaceholder: '例如：曼谷自由行倒數、考研倒數、結婚紀念日...',
    targetDateLabel: '目標日期與時間 (Target Date & Time)',
    displayUnitsLabel: '顯示時間單位 (Display Units)',
    launchButton: '啟動目標計時器',
    targetTime: '目標時間',
    timeElapsedLabel: 'TIME ELAPSED',
    remainingTimeLabel: 'REMAINING TIME',
    timeElapsed: '時間累計中',
    remainingTime: '剩餘時間',
    modifySettings: '修改設定與標題',
    copyShareLink: '複製分享連結',
    fullscreen: '全螢幕展示',
    exitFullscreen: '退出全螢幕',
    menuOptions: '選單選項',
    toastCopied: '已複製計時器分享連結',
    toastSelectUnit: '請至少選擇一種時間顯示單位！',
    toastSelectDate: '請選擇目標日期與時間！',
    unitLabels: {
      y: { full: 'YEARS', label: '年' },
      M: { full: 'MONTHS', label: '月' },
      d: { full: 'DAYS', label: '天' },
      h: { full: 'HOURS', label: '時' },
      m: { full: 'MINS', label: '分' },
      s: { full: 'SECS', label: '秒' },
    } as Record<string, { full: string; label: string }>,
    switchLangText: 'English',
    switchLangHref: '/time/en/',
  },
  en: {
    title: 'Target Countdown Timer',
    subtitle: 'TARGET COUNTDOWN TIMER',
    description: 'A beautiful target countdown timer & time accumulator! Customize event title, flexible time units (years, months, days, hours, mins, secs), full screen display, and shareable links.',
    defaultEventTitle: '2027 New Year Countdown',
    setupHeader: 'Set Target Event & Time',
    eventTitleLabel: 'Event Title',
    eventTitlePlaceholder: 'e.g. Vacation Countdown, Exam Countdown, Anniversary...',
    targetDateLabel: 'Target Date & Time',
    displayUnitsLabel: 'Display Units',
    launchButton: 'Launch Target Timer',
    targetTime: 'Target Time',
    timeElapsedLabel: 'TIME ELAPSED',
    remainingTimeLabel: 'REMAINING TIME',
    timeElapsed: 'Time Elapsed',
    remainingTime: 'Remaining Time',
    modifySettings: 'Modify Settings & Title',
    copyShareLink: 'Copy Share Link',
    fullscreen: 'Fullscreen Display',
    exitFullscreen: 'Exit Fullscreen',
    menuOptions: 'Menu Options',
    toastCopied: 'Timer share link copied to clipboard',
    toastSelectUnit: 'Please select at least one time unit!',
    toastSelectDate: 'Please select target date & time!',
    unitLabels: {
      y: { full: 'YEARS', label: 'Years' },
      M: { full: 'MONTHS', label: 'Months' },
      d: { full: 'DAYS', label: 'Days' },
      h: { full: 'HOURS', label: 'Hours' },
      m: { full: 'MINS', label: 'Mins' },
      s: { full: 'SECS', label: 'Secs' },
    } as Record<string, { full: string; label: string }>,
    switchLangText: '繁體中文',
    switchLangHref: '/time/',
  },
};

function getTomorrowDefaultIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tzOffset = tomorrow.getTimezoneOffset() * 60000;
  return new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
}

interface AnimatedNumberProps {
  value: string;
  isCountUp: boolean;
}

// 數字動態翻轉/滾動動畫組件
function AnimatedNumber({ value, isCountUp }: AnimatedNumberProps) {
  const [currentVal, setCurrentVal] = useState(value);
  const [ghostVal, setGhostVal] = useState<string | null>(null);
  const [animClass, setAnimClass] = useState('');
  const rafRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== currentVal) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (ghostTimerRef.current !== null) clearTimeout(ghostTimerRef.current);

      setGhostVal(currentVal);
      setCurrentVal(value);

      setAnimClass('');
      rafRef.current = requestAnimationFrame(() => {
        setAnimClass(isCountUp ? styles.numberMaterializeUp : styles.numberMaterializeDown);
      });

      ghostTimerRef.current = setTimeout(() => {
        setGhostVal(null);
      }, 850);
    }
  }, [value, currentVal, isCountUp]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (ghostTimerRef.current !== null) clearTimeout(ghostTimerRef.current);
    };
  }, []);

  return (
    <div className={styles.numberWrapper}>
      {ghostVal !== null && (
        <span className={`${styles.number} ${isCountUp ? styles.numberGhostUp : styles.numberGhostDown}`}>
          {ghostVal}
        </span>
      )}
      <span className={`${styles.number} ${animClass}`}>
        {currentVal}
      </span>
    </div>
  );
}

interface TimeClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function TimeClient({ lang = 'zh-TW' }: TimeClientProps) {
  const t = TRANSLATIONS[lang];

  const [eventTitle, setEventTitle] = useState<string>(t.defaultEventTitle);
  const [targetDateStr, setTargetDateStr] = useState<string>(getTomorrowDefaultIso());
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['d', 'h', 'm', 's']);

  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [unitValues, setUnitValues] = useState<Record<string, number>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 三點選單收折狀態與外點關閉 ref
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setControlsExpanded(false);
      }
    };
    if (controlsExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [controlsExpanded]);

  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const titleInputId = useId();
  const dateInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  // 從 URL 載入參數 (若有)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const titleParam = params.get('title');
    const tParam = params.get('t') || params.get('date');
    const fParam = params.get('f');

    if (tParam && !isNaN(Date.parse(tParam))) {
      if (titleParam) setEventTitle(titleParam);
      setTargetDateStr(tParam.slice(0, 16));

      if (fParam) {
        const units = fParam.split(',').filter(u => ALL_UNITS.includes(u));
        if (units.length > 0) setSelectedUnits(units);
      }
      setTimerActive(true);
    }
    isMountedRef.current = true;
  }, []);

  // 正向連動 URL (無感 replaceState)
  const syncToURL = useCallback((title: string, tStr: string, units: string[]) => {
    if (typeof window === 'undefined' || !isMountedRef.current) return;
    const params = new URLSearchParams();
    if (title.trim()) params.set('title', title.trim());
    params.set('t', tStr);
    params.set('f', units.join(','));
    window.history.replaceState(null, '', '?' + params.toString());
  }, []);

  // 計算時間差 (倒數/累計核心演算法)
  const calculateTimeDiff = useCallback(() => {
    if (!targetDateStr) return;
    const target = new Date(targetDateStr).getTime();
    if (isNaN(target)) return;

    const now = new Date().getTime();
    const diff = target - now;
    const countUp = diff <= 0;
    setIsPassed(countUp);

    // 主題色動態連動
    const themeColor = countUp ? '#ff3296' : '#00f0ff';
    const accentGlow = countUp ? 'rgba(255, 50, 150, 0.6)' : 'rgba(0, 240, 255, 0.6)';
    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--accent-glow', accentGlow);

    const d1 = countUp ? new Date(target) : new Date(now);
    const d2 = countUp ? new Date(now) : new Date(target);

    let current = new Date(d1.getTime());
    const values: Record<string, number> = {};

    if (selectedUnits.includes('y')) {
      let yearsDiff = d2.getFullYear() - d1.getFullYear();
      let temp = new Date(d1.getTime());
      temp.setFullYear(d1.getFullYear() + yearsDiff);
      while (temp > d2 && yearsDiff > 0) {
        yearsDiff--;
        temp = new Date(d1.getTime());
        temp.setFullYear(d1.getFullYear() + yearsDiff);
      }
      values['y'] = yearsDiff;
      current = temp;
    }

    if (selectedUnits.includes('M')) {
      let monthsDiff = (d2.getFullYear() - current.getFullYear()) * 12 + (d2.getMonth() - current.getMonth());
      let temp = new Date(current.getTime());
      temp.setMonth(current.getMonth() + monthsDiff);
      while (temp > d2 && monthsDiff > 0) {
        monthsDiff--;
        temp = new Date(current.getTime());
        temp.setMonth(current.getMonth() + monthsDiff);
      }
      values['M'] = monthsDiff;
      current = temp;
    }

    if (selectedUnits.includes('d')) {
      let daysDiff = Math.floor((d2.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
      let temp = new Date(current.getTime());
      temp.setDate(current.getDate() + daysDiff);
      while (temp > d2 && daysDiff > 0) {
        daysDiff--;
        temp = new Date(current.getTime());
        temp.setDate(current.getDate() + daysDiff);
      }
      values['d'] = daysDiff;
      current = temp;
    }

    let remainder = d2.getTime() - current.getTime();

    if (selectedUnits.includes('h')) {
      values['h'] = Math.floor(remainder / (1000 * 60 * 60));
      remainder %= 1000 * 60 * 60;
    }
    if (selectedUnits.includes('m')) {
      values['m'] = Math.floor(remainder / (1000 * 60));
      remainder %= 1000 * 60;
    }
    if (selectedUnits.includes('s')) {
      values['s'] = Math.floor(remainder / 1000);
    }

    setUnitValues(values);

    // 分頁標題動態更新
    const prefix = countUp ? '🚨' : '⏳';
    const activeUnit = selectedUnits.find(u => values[u] > 0) || selectedUnits[selectedUnits.length - 1];
    if (activeUnit && values[activeUnit] !== undefined) {
      const val = values[activeUnit];
      const unitLabel = t.unitLabels[activeUnit]?.full || activeUnit;
      const valPrefix = countUp && val > 0 ? '+' : '';
      document.title = `${prefix} ${valPrefix}${val} ${unitLabel} | ${eventTitle || t.title}`;
    }
  }, [targetDateStr, selectedUnits, eventTitle, t]);

  // 定時器輪詢
  useEffect(() => {
    calculateTimeDiff();
    const interval = setInterval(calculateTimeDiff, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeDiff]);

  // 切換單位勾選
  const toggleUnit = (unit: string) => {
    setSelectedUnits(prev => {
      if (prev.includes(unit)) {
        if (prev.length <= 1) {
          showToast(t.toastSelectUnit);
          return prev;
        }
        return prev.filter(u => u !== unit);
      } else {
        return [...ALL_UNITS.filter(u => prev.includes(u) || u === unit)];
      }
    });
  };

  // 啟動計時器
  const handleLaunchTimer = () => {
    if (!targetDateStr) {
      showToast(t.toastSelectDate);
      return;
    }
    if (selectedUnits.length === 0) {
      showToast(t.toastSelectUnit);
      return;
    }

    syncToURL(eventTitle, targetDateStr, selectedUnits);
    setTimerActive(true);
    setControlsExpanded(false);
  };

  // 複製試算/查詢分享連結
  const copyShareLink = () => {
    syncToURL(eventTitle, targetDateStr, selectedUnits);
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  // 全螢幕切換
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // 監聽全螢幕狀態
  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) {
        document.body.classList.add('is-fullscreen');
      } else {
        document.body.classList.remove('is-fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.body.classList.remove('is-fullscreen');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor={isPassed ? '#ff3296' : '#00f0ff'}
      accentGlow={isPassed ? 'rgba(255, 50, 150, 0.6)' : 'rgba(0, 240, 255, 0.6)'}
      hideHeader={timerActive}
      hideFooter={timerActive}
      containerClassName={timerActive ? styles.timerLayoutContainer : ''}
      extraHeaderControls={
        timerActive ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setControlsExpanded(!controlsExpanded)}
              className={`${styles.iconBtn} ${controlsExpanded ? styles.iconBtnActive : ''}`}
              title={t.menuOptions}
              aria-label={t.menuOptions}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {controlsExpanded && (
              <div className={`${styles.dropdownMenu} animate-fadeIn`}>
                <button
                  type="button"
                  onClick={() => {
                    setTimerActive(false);
                    setControlsExpanded(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.3-.06.63-.06.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0-.43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
                  </svg>
                  <span>{t.modifySettings}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    copyShareLink();
                    setControlsExpanded(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z" />
                  </svg>
                  <span>{t.copyShareLink}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleFullscreen();
                    setControlsExpanded(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    {isFullscreen ? (
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    ) : (
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    )}
                  </svg>
                  <span>{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
                </button>
              </div>
            )}
          </div>
        ) : null
      }
    >
      <div className={`flex flex-col justify-center items-center w-full my-auto transition-all duration-500 ${timerActive ? 'min-h-0' : 'min-h-[60vh]'}`}>
        {!timerActive ? (
          /* 設定視圖 (Setup View) */
          <div className={`${styles.setupCard} flex flex-col gap-6 max-w-4xl md:max-w-5xl mx-auto w-full my-auto animate-fadeIn`}>
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <h3 className={`text-sm uppercase tracking-[1px] font-semibold ${styles.sectionHeader}`}>
                {t.setupHeader}
              </h3>
              <Link
                href={t.switchLangHref}
                className="px-3 py-1.5 text-sm rounded-xl border bg-select-bg border-border-glass text-text-sub hover:text-text-main transition-colors font-medium"
              >
                {t.switchLangText}
              </Link>
            </div>

            {/* 事件名稱 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={titleInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.eventTitleLabel}
              </label>
              <input
                id={titleInputId}
                type="text"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder={t.eventTitlePlaceholder}
                className={styles.eventInput}
              />
            </div>

            {/* 目標時間 */}
            <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
              <label htmlFor={dateInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.targetDateLabel}
              </label>
              <input
                id={dateInputId}
                type="datetime-local"
                value={targetDateStr}
                onChange={e => setTargetDateStr(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            {/* 顯示單位勾選 */}
            <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.displayUnitsLabel}
              </span>
              <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-6 gap-2.5">
                {ALL_UNITS.map(unit => {
                  const isChecked = selectedUnits.includes(unit);
                  const unitInfo = t.unitLabels[unit];
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => toggleUnit(unit)}
                      className={`py-2.5 px-3 min-h-[44px] text-sm font-semibold rounded-xl cursor-pointer transition-all border flex items-center justify-center gap-1 whitespace-nowrap ${
                        isChecked ? styles.unitBtnActive : styles.unitBtnInactive
                      }`}
                    >
                      <span>{unitInfo?.label || unit}</span>
                      <span className="text-xs opacity-80">({unitInfo?.full || unit})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleLaunchTimer}
              className={styles.launchBtn}
            >
              {t.launchButton}
            </button>
          </div>
        ) : (
          /* 計時大看板視圖 (Timer View) */
          <div className="relative w-full flex flex-col justify-center items-center text-center my-auto py-2 animate-fadeIn">

            {/* 中央事件名稱 */}
            <h1 className="font-light text-2xl max-sm:text-xl tracking-[4px] text-text-sub uppercase mb-8">
              {eventTitle || t.targetTime}
            </h1>

            {/* 核心時間數字看板 */}
            <div className={`${styles.timerDisplay} ${styles[`units-${selectedUnits.length}`] || ''}`}>
              {selectedUnits.map(unit => {
                const val = unitValues[unit] ?? 0;
                const formattedVal = String(val).padStart(2, '0');
                const unitInfo = t.unitLabels[unit];

                return (
                  <div key={unit} className={styles.timeBlock}>
                    <AnimatedNumber value={formattedVal} isCountUp={isPassed} />
                    <span className="text-xs tracking-[3px] text-text-sub uppercase font-medium mt-2">
                      {unitInfo?.full || unit}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 底部狀態線條與英中雙語提示 */}
            <div className={styles.statusContainer}>
              <span className="text-xs tracking-[2px] text-text-sub uppercase">
                {isPassed ? t.timeElapsedLabel : t.remainingTimeLabel}
              </span>
              <span className={`text-sm font-semibold tracking-[2px] ${isPassed ? styles.statusElapsed : styles.statusRemaining}`}>
                {isPassed ? t.timeElapsed : t.remainingTime}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Toast 提示條 */}
      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}
