'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PrizeItem, AwardTier, HistoryRecord, SpinSpeed } from '../types';
import { SPIN_SPEED_MS } from '../constants';
import {
  calculateSectors as calculateSectorsEngine,
  computeTargetSpinAngle,
  drawBatchWinners,
  secureRandomFloat,
  getAvailablePrizes,
} from '../engine';
import { renderWheelOnCanvas, triggerConfettiAnimation, stopConfettiAnimation } from '../utils/canvasRenderer';

export interface WinnerModalData {
  winners: PrizeItem[];
  recordIds: string[];
  awardName?: string;
  timestamp: number;
}

export interface MultiSpinProgress {
  current: number;
  total: number;
  revealed: PrizeItem[];
}

interface UseWheelSpinParams {
  prizes: PrizeItem[];
  setPrizes: React.Dispatch<React.SetStateAction<PrizeItem[]>>;
  awardTiers: AwardTier[];
  setAwardTiers: React.Dispatch<React.SetStateAction<AwardTier[]>>;
  selectedAwardId: string;
  setSelectedAwardId: React.Dispatch<React.SetStateAction<string>>;
  history: HistoryRecord[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryRecord[]>>;
  displayMode: 'wheel' | 'slot';
  enableQuantityLimit: boolean;
  enableAwardMode: boolean;
  spinSpeed: SpinSpeed;
  drawCount: number;
  isFullscreen: boolean;
  allDrawnLabel: string;
  playTickSound: () => void;
  playSubWinDing: () => void;
  playWinFanfare: () => void;
  saveState: (
    newPrizes?: PrizeItem[],
    newHistory?: HistoryRecord[],
    newAwards?: AwardTier[],
    newAwardMode?: boolean,
    newQtyLimit?: boolean
  ) => void;
  onShowWinners: (data: WinnerModalData) => void;
}

export function useWheelSpin({
  prizes,
  setPrizes,
  awardTiers,
  setAwardTiers,
  selectedAwardId,
  setSelectedAwardId,
  history,
  setHistory,
  displayMode,
  enableQuantityLimit,
  enableAwardMode,
  spinSpeed,
  drawCount,
  isFullscreen,
  allDrawnLabel,
  playTickSound,
  playSubWinDing,
  playWinFanfare,
  saveState,
  onShowWinners,
}: UseWheelSpinParams) {
  // 轉盤動畫與指針物理彈動控制
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [multiSpinProgress, setMultiSpinProgress] = useState<MultiSpinProgress | null>(null);
  const [currentRotationAngle, setCurrentRotationAngle] = useState<number>(0);
  const currentRotationAngleRef = useRef<number>(0);
  const pointerDeflectionRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  // 抽獎流程中的逐輪排程，卸載時一併清除，避免背景持續 setState 與播放音效
  const spinTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // 拉霸機動畫控制
  const [slotStripItems, setSlotStripItems] = useState<PrizeItem[]>([]);
  const [slotTranslateY, setSlotTranslateY] = useState<number>(0);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
      stopConfettiAnimation();
    };
  }, []);

  const getUnfinishedPrizes = useCallback(() => {
    return getAvailablePrizes(prizes, enableQuantityLimit);
  }, [prizes, enableQuantityLimit]);

  const calculateSectors = useCallback(
    () => calculateSectorsEngine(getUnfinishedPrizes()),
    [getUnfinishedPrizes]
  );

  // 繪製轉盤 Canvas (支援 overrideAngle 以在旋轉動畫 RAF 中直接重繪，免除整樹 Re-render)
  const drawWheelOnCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, overrideAngle?: number) => {
      const { sectors, totalWeight } = calculateSectors();
      renderWheelOnCanvas({
        canvas,
        sectors,
        totalWeight,
        currentRotationAngle: overrideAngle !== undefined ? overrideAngle : currentRotationAngleRef.current,
        pointerDeflection: pointerDeflectionRef.current,
        emptyLabel: allDrawnLabel,
      });
    },
    [calculateSectors, allDrawnLabel]
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

      onShowWinners({
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
      setPrizes,
      setAwardTiers,
      setHistory,
      setSelectedAwardId,
      onShowWinners,
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

        currentRotationAngleRef.current = currentAngle;
        drawWheelOnCanvas(previewCanvasRef.current, currentAngle);
        if (isFullscreen) {
          drawWheelOnCanvas(fullscreenCanvasRef.current, currentAngle);
        }

        if (progress < 1) {
          animFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentRotationAngle(currentAngle);
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
    isFullscreen,
    drawWheelOnCanvas,
    playTickSound,
    playSubWinDing,
    finalizeSpinBatch,
    setPrizes,
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
    setPrizes,
  ]);

  const handleStartSpin = useCallback(() => {
    if (displayMode === 'wheel') {
      startWheelSpin();
    } else {
      startSlotSpin();
    }
  }, [displayMode, startWheelSpin, startSlotSpin]);

  return {
    isSpinning,
    multiSpinProgress,
    slotStripItems,
    slotTranslateY,
    previewCanvasRef,
    fullscreenCanvasRef,
    confettiCanvasRef,
    getUnfinishedPrizes,
    handleStartSpin,
  };
}
