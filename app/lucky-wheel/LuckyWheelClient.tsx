'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import PrizeEditorPanel from './components/PrizeEditorPanel';
import FullscreenStageModal from './components/FullscreenStageModal';
import { WinnerModal, HistoryModal } from './components/Modals';
import TopBannerControls from './components/TopBannerControls';
import WheelControlsBar from './components/WheelControlsBar';
import StageView from './components/StageView';
import styles from './lucky-wheel.module.css';
import type { PrizeItem, AwardTier, HistoryRecord, SpinSpeed, SaveSlot } from './types';
import { PRESET_COLORS, PRIZE_TEMPLATES, DEFAULT_AWARD_TIERS, SPIN_SPEED_MS } from './constants';
import {
  calculateSectors as calculateSectorsEngine,
  computeTargetSpinAngle,
  drawBatchWinners,
  revertWinnerRecords,
  parseBatchText,
  encodeWheelShareState,
  decodeWheelShareState,
  formatHistoryCsv,
  secureRandomFloat,
  generateId,
  getAvailablePrizes,
} from './engine';
import { renderWheelOnCanvas, triggerConfettiAnimation } from './utils/canvasRenderer';
import { useWheelAudio } from './hooks/useWheelAudio';
import { downloadBlob } from '../utils/downloadBlob';
import { getLocalDateString } from '../utils/dateUtils';
import { TRANSLATIONS } from './translations';

interface LuckyWheelClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function LuckyWheelClient({ lang = 'zh-TW' }: LuckyWheelClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'wheel' | 'slot'>('wheel');
  const [enableQuantityLimit, setEnableQuantityLimit] = useState<boolean>(true);
  const [enableAwardMode, setEnableAwardMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [spinSpeed, setSpinSpeed] = useState<SpinSpeed>('normal');
  const [drawCount, setDrawCount] = useState<number>(1);

  // 核心資料狀態
  const [prizes, setPrizes] = useState<PrizeItem[]>([]);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);

  // 彈窗與舞台狀態
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [winnerModalData, setWinnerModalData] = useState<{
    winners: PrizeItem[];
    recordIds: string[];
    awardName?: string;
    timestamp: number;
  } | null>(null);

  // 轉盤動畫與指針物理彈動控制
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [multiSpinProgress, setMultiSpinProgress] = useState<{
    current: number;
    total: number;
    revealed: PrizeItem[];
  } | null>(null);
  const [currentRotationAngle, setCurrentRotationAngle] = useState<number>(0);
  const pointerDeflectionRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  // 抽獎流程中的逐輪排程，卸載時一併清除，避免背景持續 setState 與播放音效
  const spinTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // 拉霸機動畫控制
  const [slotStripItems, setSlotStripItems] = useState<PrizeItem[]>([]);
  const [slotTranslateY, setSlotTranslateY] = useState<number>(0);

  // DOM & Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const qtyLimitToggleId = useId();
  const awardModeToggleId = useId();
  const speedSelectId = useId();
  const drawCountSelectId = useId();
  const activeAwardSelectId = useId();

  // 音效 Engine Hook
  const { playTickSound, playSubWinDing, playWinFanfare } = useWheelAudio(soundEnabled);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#f59e0b');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.6)');
  }, []);

  const scheduleSpinTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      spinTimeoutsRef.current.delete(id);
      fn();
    }, ms);
    spinTimeoutsRef.current.add(id);
  };

  // 卸載時取消進行中的動畫與逐輪排程
  useEffect(() => {
    const timeouts = spinTimeoutsRef.current;
    return () => {
      if (animFrameIdRef.current !== null) cancelAnimationFrame(animFrameIdRef.current);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  // 讀取 LocalStorage 與 URL 分享參數
  useEffect(() => {
    setIsMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedWheel = params.get('wheel');
      if (sharedWheel) {
        const decoded = decodeWheelShareState(sharedWheel);
        if (decoded) {
          setPrizes(decoded.prizes);
          setEnableQuantityLimit(decoded.enableQuantityLimit);
          setEnableAwardMode(decoded.enableAwardMode);
          if (decoded.awardTiers.length > 0) {
            setAwardTiers(decoded.awardTiers);
            setSelectedAwardId(decoded.awardTiers[0].id);
          } else {
            const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
              ...a,
              id: generateId(),
            }));
            setAwardTiers(defAwards);
            setSelectedAwardId(defAwards[0].id);
          }
          return;
        }
      }

      const cachedPrizes = localStorage.getItem('lw_prizes');
      if (cachedPrizes) {
        setPrizes(JSON.parse(cachedPrizes));
      } else {
        const defaultTemplate = PRIZE_TEMPLATES.decision[lang] || PRIZE_TEMPLATES.decision['zh-TW'];
        setPrizes(defaultTemplate.map((p) => ({ ...p, id: generateId() })));
      }

      const cachedHistory = localStorage.getItem('lw_history');
      if (cachedHistory) setHistory(JSON.parse(cachedHistory));

      const cachedAwards = localStorage.getItem('lw_awards');
      if (cachedAwards) {
        const parsed = JSON.parse(cachedAwards);
        setAwardTiers(parsed);
        if (parsed.length > 0) setSelectedAwardId(parsed[0].id);
      } else {
        const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
          ...a,
          id: generateId(),
        }));
        setAwardTiers(defAwards);
        setSelectedAwardId(defAwards[0].id);
      }

      const cachedAwardMode = localStorage.getItem('lw_enable_award_mode');
      if (cachedAwardMode !== null) setEnableAwardMode(cachedAwardMode === 'true');

      const cachedQtyLimit = localStorage.getItem('lw_enable_qty_limit');
      if (cachedQtyLimit !== null) setEnableQuantityLimit(cachedQtyLimit === 'true');

      const cachedSlots = localStorage.getItem('lw_save_slots');
      if (cachedSlots) setSaveSlots(JSON.parse(cachedSlots));
    } catch {
      // 容錯防禦
    }
  }, [lang]);

  // 同步保存最新狀態至 LocalStorage
  const saveState = useCallback(
    (
      newPrizes?: PrizeItem[],
      newHistory?: HistoryRecord[],
      newAwards?: AwardTier[],
      newAwardMode?: boolean,
      newQtyLimit?: boolean
    ) => {
      try {
        if (newPrizes) localStorage.setItem('lw_prizes', JSON.stringify(newPrizes));
        if (newHistory) localStorage.setItem('lw_history', JSON.stringify(newHistory));
        if (newAwards) localStorage.setItem('lw_awards', JSON.stringify(newAwards));
        if (newAwardMode !== undefined) localStorage.setItem('lw_enable_award_mode', String(newAwardMode));
        if (newQtyLimit !== undefined) localStorage.setItem('lw_enable_qty_limit', String(newQtyLimit));
      } catch {
        // ignore
      }
    },
    []
  );

  const getUnfinishedPrizes = useCallback(() => {
    return getAvailablePrizes(prizes, enableQuantityLimit);
  }, [prizes, enableQuantityLimit]);

  const calculateSectors = useCallback(
    () => calculateSectorsEngine(getUnfinishedPrizes()),
    [getUnfinishedPrizes]
  );

  // 繪製轉盤 Canvas
  const drawWheelOnCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const { sectors, totalWeight } = calculateSectors();
      renderWheelOnCanvas({
        canvas,
        sectors,
        totalWeight,
        currentRotationAngle,
        pointerDeflection: pointerDeflectionRef.current,
        emptyLabel: t.allDrawn,
      });
    },
    [calculateSectors, currentRotationAngle, t.allDrawn]
  );

  useEffect(() => {
    if (!isSpinning) {
      const validPrizes = getUnfinishedPrizes();
      if (validPrizes.length === 0) {
        setSlotStripItems([]);
      } else {
        const displayList: PrizeItem[] = [];
        for (let r = 0; r < 6; r++) {
          displayList.push(...validPrizes);
        }
        setSlotStripItems(displayList);
        setSlotTranslateY(0);
      }
    }
  }, [prizes, enableQuantityLimit, displayMode, isSpinning, getUnfinishedPrizes]);

  useEffect(() => {
    drawWheelOnCanvas(previewCanvasRef.current);
    if (isFullscreen) {
      drawWheelOnCanvas(fullscreenCanvasRef.current);
    }
  }, [drawWheelOnCanvas, isFullscreen, displayMode]);

  const triggerConfetti = useCallback(() => {
    triggerConfettiAnimation(confettiCanvasRef.current);
  }, []);

  const getEffectiveDrawCount = useCallback(() => {
    return Math.max(1, drawCount);
  }, [drawCount]);

  // 抽獎結束統一結算
  const finalizeSpinBatch = useCallback(
    (winners: PrizeItem[], updatedPrizes: PrizeItem[]) => {
      pointerDeflectionRef.current = 0;
      setIsSpinning(false);
      playWinFanfare();

      const now = Date.now();
      const batchId = 'b_' + now;
      const activeAward = enableAwardMode ? awardTiers.find((a) => a.id === selectedAwardId) : undefined;

      const newRecords: HistoryRecord[] = winners.map((w, idx) => ({
        id: `h_${now}_${idx}_${w.id}`,
        prizeId: w.id,
        prizeTitle: w.title,
        awardId: activeAward?.id,
        awardName: activeAward?.name,
        batchId,
        timestamp: now,
      }));

      let nextAwards = awardTiers;
      if (activeAward) {
        nextAwards = awardTiers.map((a) => {
          if (a.id !== activeAward.id) return a;
          const nextDrawn = a.drawnCount + winners.length;
          return {
            ...a,
            quantity: Math.max(a.quantity, nextDrawn),
            drawnCount: nextDrawn,
          };
        });
        const currentAfter = nextAwards.find((a) => a.id === activeAward.id);
        if (currentAfter && currentAfter.drawnCount >= currentAfter.quantity) {
          const nextAvailableAward = nextAwards.find((a) => a.drawnCount < a.quantity);
          if (nextAvailableAward) setSelectedAwardId(nextAvailableAward.id);
        }
      }

      const updatedHistory = [...newRecords, ...history];
      setPrizes(updatedPrizes);
      setAwardTiers(nextAwards);
      setHistory(updatedHistory);
      saveState(updatedPrizes, updatedHistory, nextAwards);

      setWinnerModalData({
        winners,
        recordIds: newRecords.map((r) => r.id),
        awardName: activeAward?.name,
        timestamp: now,
      });

      triggerConfetti();
    },
    [
      enableAwardMode,
      awardTiers,
      selectedAwardId,
      history,
      playWinFanfare,
      saveState,
      triggerConfetti,
    ]
  );

  // 啟動轉盤抽獎
  const startWheelSpin = useCallback(() => {
    const initialAvailable = getAvailablePrizes(prizes, enableQuantityLimit);
    if (initialAvailable.length === 0 || isSpinning) return;

    const activeAward = enableAwardMode ? awardTiers.find((a) => a.id === selectedAwardId) : undefined;
    if (enableAwardMode && activeAward && activeAward.drawnCount >= activeAward.quantity) return;

    const effectiveCount = getEffectiveDrawCount();
    const { winners, updatedPrizes } = drawBatchWinners(
      prizes,
      effectiveCount,
      enableQuantityLimit,
      secureRandomFloat
    );
    if (winners.length === 0) return;

    setIsSpinning(true);

    const isMulti = winners.length > 1;
    const subDuration = isMulti
      ? spinSpeed === 'fast'
        ? 1200
        : spinSpeed === 'normal'
        ? 2200
        : 3400
      : SPIN_SPEED_MS[spinSpeed].wheel;

    const runStep = (
      stepIdx: number,
      baseAngle: number,
      stepWorkingPrizes: PrizeItem[],
      revealedSoFar: PrizeItem[]
    ) => {
      const currentWinner = winners[stepIdx];
      if (isMulti) {
        setMultiSpinProgress({
          current: stepIdx + 1,
          total: winners.length,
          revealed: revealedSoFar,
        });
      }

      const stepAvailable = getAvailablePrizes(stepWorkingPrizes, enableQuantityLimit);
      const { sectors } = calculateSectorsEngine(stepAvailable);
      const selectedSector = sectors.find((s) => s.prize.id === currentWinner.id) || sectors[0];
      if (!selectedSector) {
        setMultiSpinProgress(null);
        finalizeSpinBatch(winners, updatedPrizes);
        return;
      }

      const extraRounds = isMulti ? 3 + Math.floor(secureRandomFloat() * 2) : 5 + Math.floor(secureRandomFloat() * 4);
      const finalAngle = computeTargetSpinAngle(
        baseAngle,
        selectedSector,
        extraRounds,
        secureRandomFloat()
      );

      const startTime = performance.now();
      let lastTickAngle = baseAngle;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / subDuration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = baseAngle + (finalAngle - baseAngle) * easeOut;

        if (currentAngle - lastTickAngle >= 24) {
          playTickSound();
          lastTickAngle = currentAngle;
          pointerDeflectionRef.current = -18 * (1 - progress * 0.7);
        } else {
          pointerDeflectionRef.current *= 0.82;
        }

        setCurrentRotationAngle(currentAngle);

        if (progress < 1) {
          animFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          pointerDeflectionRef.current = 0;
          const nextRevealed = [...revealedSoFar, currentWinner];

          if (stepIdx < winners.length - 1) {
            playSubWinDing();
            setMultiSpinProgress({
              current: stepIdx + 1,
              total: winners.length,
              revealed: nextRevealed,
            });

            const nextStepPrizes = stepWorkingPrizes.map((p) => {
              if (p.id !== currentWinner.id) return p;
              const nextDrawn = p.drawnCount + 1;
              return {
                ...p,
                drawnCount: nextDrawn,
                isFinished: enableQuantityLimit ? nextDrawn >= p.quantity : false,
              };
            });

            scheduleSpinTimeout(() => {
              setPrizes(nextStepPrizes);
              runStep(stepIdx + 1, finalAngle, nextStepPrizes, nextRevealed);
            }, 680);
          } else {
            if (isMulti) {
              setMultiSpinProgress({
                current: winners.length,
                total: winners.length,
                revealed: nextRevealed,
              });
              scheduleSpinTimeout(() => {
                setMultiSpinProgress(null);
                finalizeSpinBatch(winners, updatedPrizes);
              }, 450);
            } else {
              setMultiSpinProgress(null);
              finalizeSpinBatch(winners, updatedPrizes);
            }
          }
        }
      };

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    runStep(0, currentRotationAngle, prizes, []);
  }, [
    prizes,
    enableQuantityLimit,
    isSpinning,
    enableAwardMode,
    awardTiers,
    selectedAwardId,
    getEffectiveDrawCount,
    currentRotationAngle,
    spinSpeed,
    playTickSound,
    playSubWinDing,
    finalizeSpinBatch,
  ]);

  // 啟動拉霸機抽獎
  const startSlotSpin = useCallback(() => {
    const initialAvailable = getAvailablePrizes(prizes, enableQuantityLimit);
    if (initialAvailable.length === 0 || isSpinning) return;

    const activeAward = enableAwardMode ? awardTiers.find((a) => a.id === selectedAwardId) : undefined;
    if (enableAwardMode && activeAward && activeAward.drawnCount >= activeAward.quantity) return;

    const effectiveCount = getEffectiveDrawCount();
    const { winners, updatedPrizes } = drawBatchWinners(
      prizes,
      effectiveCount,
      enableQuantityLimit,
      secureRandomFloat
    );
    if (winners.length === 0) return;

    setIsSpinning(true);

    const isMulti = winners.length > 1;
    const subDuration = isMulti
      ? spinSpeed === 'fast'
        ? 1050
        : spinSpeed === 'normal'
        ? 1900
        : 2800
      : SPIN_SPEED_MS[spinSpeed].slot;

    const runSlotStep = (
      stepIdx: number,
      stepWorkingPrizes: PrizeItem[],
      revealedSoFar: PrizeItem[]
    ) => {
      const currentWinner = winners[stepIdx];
      if (isMulti) {
        setMultiSpinProgress({
          current: stepIdx + 1,
          total: winners.length,
          revealed: revealedSoFar,
        });
      }

      const validPrizes = getAvailablePrizes(stepWorkingPrizes, enableQuantityLimit);
      const poolForStrip = validPrizes.length > 0 ? validPrizes : [currentWinner];
      const stripPrizes: PrizeItem[] = [];
      const repeatRounds = Math.max(6, Math.ceil(28 / poolForStrip.length));
      for (let r = 0; r < repeatRounds; r++) {
        stripPrizes.push(...poolForStrip);
      }
      const winIdx = stripPrizes.length;
      stripPrizes.push(currentWinner);
      for (let i = 0; i < 4; i++) {
        stripPrizes.push(poolForStrip[i % poolForStrip.length]);
      }

      setSlotStripItems(stripPrizes);
      setSlotTranslateY(0);

      const targetTranslateY = 92 - winIdx * 76;
      const startTime = performance.now();
      let lastSoundTime = 0;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / subDuration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentY = targetTranslateY * easeOut;

        setSlotTranslateY(currentY);

        if (now - lastSoundTime > 110) {
          playTickSound();
          lastSoundTime = now;
        }

        if (progress < 1) {
          animFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          const nextRevealed = [...revealedSoFar, currentWinner];

          if (stepIdx < winners.length - 1) {
            playSubWinDing();
            setMultiSpinProgress({
              current: stepIdx + 1,
              total: winners.length,
              revealed: nextRevealed,
            });

            const nextStepPrizes = stepWorkingPrizes.map((p) => {
              if (p.id !== currentWinner.id) return p;
              const nextDrawn = p.drawnCount + 1;
              return {
                ...p,
                drawnCount: nextDrawn,
                isFinished: enableQuantityLimit ? nextDrawn >= p.quantity : false,
              };
            });

            scheduleSpinTimeout(() => {
              setPrizes(nextStepPrizes);
              runSlotStep(stepIdx + 1, nextStepPrizes, nextRevealed);
            }, 680);
          } else {
            if (isMulti) {
              setMultiSpinProgress({
                current: winners.length,
                total: winners.length,
                revealed: nextRevealed,
              });
              scheduleSpinTimeout(() => {
                setMultiSpinProgress(null);
                finalizeSpinBatch(winners, updatedPrizes);
              }, 450);
            } else {
              setMultiSpinProgress(null);
              finalizeSpinBatch(winners, updatedPrizes);
            }
          }
        }
      };

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    runSlotStep(0, prizes, []);
  }, [
    prizes,
    enableQuantityLimit,
    isSpinning,
    enableAwardMode,
    awardTiers,
    selectedAwardId,
    getEffectiveDrawCount,
    spinSpeed,
    playTickSound,
    playSubWinDing,
    finalizeSpinBatch,
  ]);

  const handleStartSpin = useCallback(() => {
    if (displayMode === 'wheel') {
      startWheelSpin();
    } else {
      startSlotSpin();
    }
  }, [displayMode, startWheelSpin, startSlotSpin]);

  // 鍵盤快捷鍵：空白鍵啟動抽獎或關閉得獎彈窗、Esc 退出全螢幕舞台
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        if (winnerModalData) {
          e.preventDefault();
          setWinnerModalData(null);
        } else if (!showHistoryModal && !isSpinning) {
          e.preventDefault();
          handleStartSpin();
        }
      } else if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [winnerModalData, showHistoryModal, isSpinning, isFullscreen, handleStartSpin]);

  const showToast = useCallback((msg: string) => {
    const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
    const toastEl = document.createElement('div');
    toastEl.className = isLight
      ? 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-[#d97706] bg-white/95 border border-[#d97706]/40 rounded-xl shadow-2xl z-[30000] animate-bounce flex items-center gap-2 backdrop-blur-md'
      : 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-white bg-amber-500/20 border border-amber-500/40 rounded-xl shadow-2xl z-[30000] animate-bounce flex items-center gap-2 backdrop-blur-md';
    toastEl.insertAdjacentHTML(
      'afterbegin',
      '<svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" class="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    );
    const msgEl = document.createElement('span');
    msgEl.textContent = msg;
    toastEl.appendChild(msgEl);
    document.body.appendChild(toastEl);
    setTimeout(() => {
      if (document.body.contains(toastEl)) document.body.removeChild(toastEl);
    }, 2200);
  }, []);

  // 不在場放棄重抽 / 撤銷單筆或整批紀錄
  const handleRevertRecords = (recordIds: string[]) => {
    const { updatedPrizes, updatedAwardTiers, updatedHistory } = revertWinnerRecords(
      prizes,
      awardTiers,
      history,
      recordIds,
      enableQuantityLimit
    );
    setPrizes(updatedPrizes);
    setAwardTiers(updatedAwardTiers);
    setHistory(updatedHistory);
    saveState(updatedPrizes, updatedHistory, updatedAwardTiers);
    setWinnerModalData(null);
    showToast(t.toastRevertedWinner);
  };

  // 載入快速模板
  const loadTemplate = (templateKey: string) => {
    if (PRIZE_TEMPLATES[templateKey]) {
      const templateData = PRIZE_TEMPLATES[templateKey][lang] || PRIZE_TEMPLATES[templateKey]['zh-TW'];
      const newItems = templateData.map((p) => ({ ...p, id: generateId() }));
      setPrizes(newItems);
      setEnableAwardMode(false);
      saveState(newItems, undefined, undefined, false);
      showToast(t.toastLoadedTemplate);
    } else if (templateKey === 'empty') {
      setPrizes([]);
      setEnableAwardMode(false);
      saveState([], undefined, undefined, false);
    }
  };

  // 批次文字套用
  const handleApplyBatchText = (rawText: string) => {
    const { items, isParticipantList } = parseBatchText(rawText, PRESET_COLORS);
    if (items.length > 0) {
      setPrizes(items);
      saveState(items);
      showToast(
        (isParticipantList ? t.toastImportPeople : t.toastImportPrizes).replace('{n}', String(items.length))
      );
    } else {
      showToast(t.toastInvalidFile);
    }
  };

  // 檔案上傳匯入
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleApplyBatchText(text);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // 隨機打亂與去重
  const handleShufflePrizes = () => {
    const copy = [...prizes];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(secureRandomFloat() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setPrizes(copy);
    saveState(copy);
    showToast(t.toastShuffled);
  };

  const handleDeduplicatePrizes = () => {
    const seen = new Set<string>();
    const deduped = prizes.filter((p) => {
      const key = p.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setPrizes(deduped);
    saveState(deduped);
    showToast(t.toastDeduped.replace('{n}', String(deduped.length)));
  };

  // 分享連結與匯出
  const handleShareUrl = async () => {
    const encoded = encodeWheelShareState({
      prizes,
      enableQuantityLimit,
      enableAwardMode,
      awardTiers,
    });
    const url = `${window.location.origin}${window.location.pathname}?wheel=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.toastCopiedShareLink);
    } catch {
      window.history.replaceState(null, '', `?wheel=${encoded}`);
      showToast(t.toastCopiedShareLink);
    }
  };

  const exportTxt = () => {
    const textContent = prizes.map((p) => `${p.title}\t${p.weight}\t${p.quantity}\t${p.color}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `LuckyWheel_Prizes_${getLocalDateString()}.txt`);
  };

  const exportHistoryCsv = () => {
    const csv = formatHistoryCsv(history, lang);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `LuckyWheel_Winners_${getLocalDateString()}.csv`);
  };

  const copyWinnersText = async () => {
    const lines = history.map((rec, idx) =>
      rec.awardName ? `${idx + 1}. ${rec.prizeTitle} — ${rec.awardName}` : `${idx + 1}. ${rec.prizeTitle}`
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast(t.toastCopiedWinners);
    } catch {
      // ignore
    }
  };

  // 本地存檔槽操作
  const handleSaveSlot = (slotName: string) => {
    const cleanName = slotName.trim() || `${t.title} #${saveSlots.length + 1}`;
    const newSlot: SaveSlot = {
      id: generateId(),
      name: cleanName,
      updatedAt: Date.now(),
      prizes,
      enableQuantityLimit,
      enableAwardMode,
      awardTiers,
    };
    const nextSlots = [newSlot, ...saveSlots].slice(0, 12);
    setSaveSlots(nextSlots);
    try {
      localStorage.setItem('lw_save_slots', JSON.stringify(nextSlots));
    } catch {
      // ignore
    }
    showToast(t.toastSavedSlot.replace('{name}', cleanName));
  };

  const handleLoadSlot = (slot: SaveSlot) => {
    setPrizes(slot.prizes);
    setEnableQuantityLimit(slot.enableQuantityLimit);
    setEnableAwardMode(Boolean(slot.enableAwardMode));
    if (slot.awardTiers && slot.awardTiers.length > 0) {
      setAwardTiers(slot.awardTiers);
      setSelectedAwardId(slot.awardTiers[0].id);
    }
    saveState(slot.prizes, undefined, slot.awardTiers, Boolean(slot.enableAwardMode), slot.enableQuantityLimit);
    showToast(t.toastLoadedSlot.replace('{name}', slot.name));
  };

  const handleDeleteSlot = (slotId: string) => {
    const nextSlots = saveSlots.filter((s) => s.id !== slotId);
    setSaveSlots(nextSlots);
    try {
      localStorage.setItem('lw_save_slots', JSON.stringify(nextSlots));
    } catch {
      // ignore
    }
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const unfinishedPrizes = getUnfinishedPrizes();
  const totalWeight = unfinishedPrizes.reduce((sum, p) => sum + p.weight, 0);
  const selectedAward = awardTiers.find((a) => a.id === selectedAwardId);
  const selectedAwardRemain = selectedAward ? Math.max(0, selectedAward.quantity - selectedAward.drawnCount) : 0;
  const isAwardExhausted = enableAwardMode && selectedAward && selectedAwardRemain === 0;

  const latestBatchId = history[0]?.batchId;
  const latestBatchRecords = latestBatchId
    ? history.filter((r) => r.batchId === latestBatchId)
    : history.slice(0, 1);

  if (!isMounted) return null;

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#f59e0b"
      accentGlow="rgba(245, 158, 11, 0.6)"
    >
      <div className="flex flex-col gap-6 text-left w-full px-4 max-sm:px-0">
        {/* 頂部最新中獎動態與快捷列 */}
        <TopBannerControls
          t={t}
          history={history}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenHistory={() => setShowHistoryModal(true)}
          onShareUrl={handleShareUrl}
          onOpenFullscreen={() => setIsFullscreen(true)}
        />

        {/* 模式切換、連抽人數、轉速與尾牙雙抽開關列 */}
        <WheelControlsBar
          t={t}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          drawCount={drawCount}
          setDrawCount={setDrawCount}
          spinSpeed={spinSpeed}
          setSpinSpeed={setSpinSpeed}
          enableAwardMode={enableAwardMode}
          onToggleAwardMode={(enabled) => {
            setEnableAwardMode(enabled);
            saveState(undefined, undefined, undefined, enabled);
          }}
          enableQuantityLimit={enableQuantityLimit}
          onToggleQuantityLimit={(enabled) => {
            setEnableQuantityLimit(enabled);
            saveState(undefined, undefined, undefined, undefined, enabled);
          }}
          drawCountSelectId={drawCountSelectId}
          speedSelectId={speedSelectId}
          awardModeToggleId={awardModeToggleId}
          qtyLimitToggleId={qtyLimitToggleId}
        />

        {/* 主 Layout (兩欄式) */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 items-start">
          {/* 左欄：轉盤 / 拉霸機 舞台區 */}
          <StageView
            t={t}
            displayMode={displayMode}
            enableAwardMode={enableAwardMode}
            awardTiers={awardTiers}
            selectedAwardId={selectedAwardId}
            onSelectAwardId={setSelectedAwardId}
            onCloseAwardMode={() => {
              setEnableAwardMode(false);
              saveState(undefined, undefined, undefined, false);
            }}
            activeAwardSelectId={activeAwardSelectId}
            previewCanvasRef={previewCanvasRef}
            slotStripItems={slotStripItems}
            slotTranslateY={slotTranslateY}
            isSpinning={isSpinning}
            unfinishedPrizes={unfinishedPrizes}
            isAwardExhausted={isAwardExhausted}
            drawCount={drawCount}
            multiSpinProgress={multiSpinProgress}
            latestBatchRecords={latestBatchRecords}
            onStartSpin={handleStartSpin}
          />

          {/* 右欄：獎項與人員名單編輯面板 */}
          <PrizeEditorPanel
            t={t}
            prizes={prizes}
            unfinishedPrizes={unfinishedPrizes}
            totalWeight={totalWeight}
            enableQuantityLimit={enableQuantityLimit}
            enableAwardMode={enableAwardMode}
            awardTiers={awardTiers}
            selectedAwardId={selectedAwardId}
            saveSlots={saveSlots}
            onLoadTemplate={loadTemplate}
            onExportTxt={exportTxt}
            onTriggerFileUpload={() => fileInputRef.current?.click()}
            onResetCounts={() => {
              const resetP = prizes.map((p) => ({ ...p, drawnCount: 0, isFinished: false }));
              const resetA = awardTiers.map((a) => ({ ...a, drawnCount: 0 }));
              setPrizes(resetP);
              setAwardTiers(resetA);
              saveState(resetP, undefined, resetA);
              showToast(t.toastResetCount);
            }}
            onAddPrize={() => {
              const newItem: PrizeItem = {
                id: generateId(),
                title: `${t.newPrizeDefault} ${prizes.length + 1}`,
                weight: 1,
                quantity: 1,
                drawnCount: 0,
                color: PRESET_COLORS[prizes.length % PRESET_COLORS.length],
                isFinished: false,
              };
              const updated = [...prizes, newItem];
              setPrizes(updated);
              saveState(updated);
            }}
            onUpdatePrize={(id, field, value) => {
              const updated = prizes.map((p) => (p.id === id ? { ...p, [field]: value } : p));
              setPrizes(updated);
              saveState(updated);
            }}
            onRemovePrize={(id) => {
              const updated = prizes.filter((p) => p.id !== id);
              setPrizes(updated);
              saveState(updated);
            }}
            onApplyBatchText={handleApplyBatchText}
            onShufflePrizes={handleShufflePrizes}
            onDeduplicatePrizes={handleDeduplicatePrizes}
            onAddAwardTier={() => {
              const newTier: AwardTier = {
                id: generateId(),
                name: `${t.newPrizeDefault} ${awardTiers.length + 1}`,
                quantity: 1,
                drawnCount: 0,
              };
              const next = [...awardTiers, newTier];
              setAwardTiers(next);
              if (!selectedAwardId) setSelectedAwardId(newTier.id);
              saveState(undefined, undefined, next);
            }}
            onUpdateAwardTier={(id, field, value) => {
              const next = awardTiers.map((a) => (a.id === id ? { ...a, [field]: value } : a));
              setAwardTiers(next);
              saveState(undefined, undefined, next);
            }}
            onRemoveAwardTier={(id) => {
              const next = awardTiers.filter((a) => a.id !== id);
              setAwardTiers(next);
              if (selectedAwardId === id) setSelectedAwardId(next[0]?.id || '');
              saveState(undefined, undefined, next);
            }}
            onSelectAwardId={setSelectedAwardId}
            onCloseAwardMode={() => {
              setEnableAwardMode(false);
              saveState(undefined, undefined, undefined, false);
            }}
            onSaveSlot={handleSaveSlot}
            onLoadSlot={handleLoadSlot}
            onDeleteSlot={handleDeleteSlot}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection items={t.faqItems} title={t.faqTitle} subtitle={t.faqSubtitle} accentColor="#f59e0b" />

      {/* 全螢幕抽獎舞台 */}
      {isFullscreen && (
        <FullscreenStageModal
          t={t}
          displayMode={displayMode}
          isSpinning={isSpinning}
          unfinishedPrizes={unfinishedPrizes}
          enableQuantityLimit={enableQuantityLimit}
          enableAwardMode={enableAwardMode}
          awardTiers={awardTiers}
          selectedAwardId={selectedAwardId}
          spinSpeed={spinSpeed}
          drawCount={drawCount}
          multiSpinProgress={multiSpinProgress}
          history={history}
          slotStripItems={slotStripItems}
          slotTranslateY={slotTranslateY}
          fullscreenCanvasRef={fullscreenCanvasRef}
          onSelectAwardId={setSelectedAwardId}
          onChangeSpinSpeed={setSpinSpeed}
          onChangeDrawCount={setDrawCount}
          onStartSpin={handleStartSpin}
          onToggleBrowserFullscreen={toggleBrowserFullscreen}
          onExitStage={() => setIsFullscreen(false)}
        />
      )}

      {/* 歷史紀錄與 CSV 匯出 Modal */}
      {showHistoryModal && (
        <HistoryModal
          t={t}
          lang={lang}
          history={history}
          onClose={() => setShowHistoryModal(false)}
          onClearAll={() => {
            setHistory([]);
            saveState(undefined, []);
            showToast(t.toastClearedHistory);
          }}
          onRevertRecord={(recId) => handleRevertRecords([recId])}
          onExportCsv={exportHistoryCsv}
          onCopyWinners={copyWinnersText}
        />
      )}

      {/* 中獎歡呼與「不在場放棄重抽」Modal */}
      {winnerModalData && (
        <WinnerModal
          t={t}
          lang={lang}
          winners={winnerModalData.winners}
          awardName={winnerModalData.awardName}
          timestamp={winnerModalData.timestamp}
          onConfirm={() => setWinnerModalData(null)}
          onAbandonRedraw={() => handleRevertRecords(winnerModalData.recordIds)}
        />
      )}

      {/* 彩帶 Canvas */}
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} />
    </ToolLayout>
  );
}
