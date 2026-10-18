'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import PrizeEditorPanel from './components/PrizeEditorPanel';
import FullscreenStageModal from './components/FullscreenStageModal';
import { WinnerModal, HistoryModal } from './components/Modals';
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
  getContrastYIQ,
  getAvailablePrizes,
} from './engine';
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

  // 音效 Engine (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.045);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // 瀏覽器阻擋自動播放時安全略過
    }
  }, [soundEnabled]);

  const playSubWinDing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      [659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0.24, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const playWinFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + i * 0.11;

        gain.gain.setValueAtTime(0.28, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch {
      // 忽略音效錯誤
    }
  }, [soundEnabled]);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#f59e0b');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.6)');
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
            setSelectedAwardId(defAwards[0]?.id || '');
          }
          return;
        }
      }

      const savedMode = localStorage.getItem('lw_display_mode');
      if (savedMode === 'wheel' || savedMode === 'slot') setDisplayMode(savedMode);

      const savedLimit = localStorage.getItem('lw_qty_limit');
      if (savedLimit !== null) setEnableQuantityLimit(savedLimit === 'true');

      // 預設不自動強制開啟尾牙雙抽獎項池，避免切換模板或重整後卡住顯示
      setEnableAwardMode(false);
      localStorage.removeItem('lw_award_mode');

      const savedPrizes = localStorage.getItem('lw_prizes');
      if (savedPrizes) {
        setPrizes(JSON.parse(savedPrizes));
      } else {
        const tList = PRIZE_TEMPLATES.annual[lang] || PRIZE_TEMPLATES.annual['zh-TW'];
        setPrizes(tList.map((p) => ({ ...p, id: generateId() })));
      }

      const savedAwards = localStorage.getItem('lw_award_tiers');
      if (savedAwards) {
        const parsedAwards: AwardTier[] = JSON.parse(savedAwards);
        setAwardTiers(parsedAwards);
        if (parsedAwards.length > 0) setSelectedAwardId(parsedAwards[0].id);
      } else {
        const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
          ...a,
          id: generateId(),
        }));
        setAwardTiers(defAwards);
        setSelectedAwardId(defAwards[0]?.id || '');
      }

      const savedHistory = localStorage.getItem('lw_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedSlots = localStorage.getItem('lw_save_slots');
      if (savedSlots) setSaveSlots(JSON.parse(savedSlots));
    } catch {
      const tList = PRIZE_TEMPLATES.annual[lang] || PRIZE_TEMPLATES.annual['zh-TW'];
      setPrizes(tList.map((p) => ({ ...p, id: generateId() })));
    }
  }, [lang]);

  // 寫入 LocalStorage
  const saveState = useCallback(
    (
      nextPrizes?: PrizeItem[],
      nextHistory?: HistoryRecord[],
      nextAwards?: AwardTier[],
      nextAwardMode?: boolean,
      nextQtyLimit?: boolean
    ) => {
      try {
        localStorage.setItem('lw_display_mode', displayMode);
        localStorage.setItem('lw_qty_limit', String(nextQtyLimit ?? enableQuantityLimit));
        localStorage.setItem('lw_award_mode', String(nextAwardMode ?? enableAwardMode));
        localStorage.setItem('lw_prizes', JSON.stringify(nextPrizes ?? prizes));
        localStorage.setItem('lw_award_tiers', JSON.stringify(nextAwards ?? awardTiers));
        localStorage.setItem('lw_history', JSON.stringify(nextHistory ?? history));
      } catch {
        // 忽略容量上限錯誤
      }
    },
    [displayMode, enableQuantityLimit, enableAwardMode, prizes, awardTiers, history]
  );

  const getUnfinishedPrizes = useCallback(
    () => getAvailablePrizes(prizes, enableQuantityLimit),
    [prizes, enableQuantityLimit]
  );

  const calculateSectors = useCallback(
    () => calculateSectorsEngine(getUnfinishedPrizes()),
    [getUnfinishedPrizes]
  );

  // 繪製 12 點鐘頂部指針（支援物理彈動偏角 deflectionDeg）
  const drawPointer = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    deflectionDeg: number
  ) => {
    ctx.save();
    const wheelTop = centerY - radius;
    const ballR = 15;
    const ballY = wheelTop - ballR - 6;
    const tipY = wheelTop + 22;
    const baseY = wheelTop - 4;
    const halfW = 18;

    // 以指針頂部圓球中心為軸進行物理彈動旋轉
    ctx.translate(centerX, ballY);
    ctx.rotate((deflectionDeg * Math.PI) / 180);
    ctx.translate(-centerX, -ballY);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.moveTo(centerX - halfW, baseY);
    ctx.lineTo(centerX + halfW, baseY);
    ctx.lineTo(centerX, tipY);
    ctx.closePath();

    const pGrad = ctx.createLinearGradient(centerX, baseY, centerX, tipY);
    pGrad.addColorStop(0, '#ff4477');
    pGrad.addColorStop(0.5, '#ff0055');
    pGrad.addColorStop(1, '#cc0033');
    ctx.fillStyle = pGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const ballGrad = ctx.createRadialGradient(centerX - 5, ballY - 5, 1, centerX, ballY, ballR);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.3, '#ff4477');
    ballGrad.addColorStop(1, '#99002b');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(centerX, ballY, ballR, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  // 繪製轉盤 Canvas
  const drawWheelOnCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.42;

      ctx.clearRect(0, 0, size, size);

      const { sectors, totalWeight } = calculateSectors();
      const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

      if (sectors.length === 0 || totalWeight === 0) {
        ctx.save();
        const emptyGrad = ctx.createRadialGradient(centerX, centerY - radius * 0.3, 0, centerX, centerY, radius);
        if (isLight) {
          emptyGrad.addColorStop(0, '#ffffff');
          emptyGrad.addColorStop(1, '#e2e8f0');
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = emptyGrad;
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.fillStyle = '#475569';
        } else {
          emptyGrad.addColorStop(0, '#2a2a3d');
          emptyGrad.addColorStop(1, '#161623');
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = emptyGrad;
          ctx.fill();
          ctx.strokeStyle = '#3a3a5c';
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
        }

        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.allDrawn, centerX, centerY);
        ctx.restore();
        drawPointer(ctx, centerX, centerY, radius, 0);
        return;
      }

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotationAngle * Math.PI) / 180);

      sectors.forEach((sec) => {
        const startRad = (sec.startAngle * Math.PI) / 180;
        const endRad = (sec.endAngle * Math.PI) / 180;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startRad, endRad);
        ctx.closePath();
        ctx.fillStyle = sec.prize.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startRad, endRad);
        ctx.closePath();
        const midRad0 = (startRad + endRad) / 2;
        const shimmerX = Math.cos(midRad0) * radius * 0.35;
        const shimmerY = Math.sin(midRad0) * radius * 0.35;
        const shimmer = ctx.createRadialGradient(shimmerX, shimmerY, 0, shimmerX, shimmerY, radius * 0.85);
        shimmer.addColorStop(0, 'rgba(255,255,255,0.22)');
        shimmer.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shimmer;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // 中心圓
      const hubRadius = radius * 0.115;
      const hubGrad = ctx.createRadialGradient(-hubRadius * 0.3, -hubRadius * 0.3, 0, 0, 0, hubRadius);
      hubGrad.addColorStop(0, '#ffffff');
      hubGrad.addColorStop(0.5, '#e2e8f0');
      hubGrad.addColorStop(1, '#94a3b8');
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 外圈金屬環
      ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 6;

      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
      const outerRingGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      outerRingGrad.addColorStop(0, '#ffffff');
      outerRingGrad.addColorStop(0.5, '#b0c0d8');
      outerRingGrad.addColorStop(1, '#7088a8');
      ctx.strokeStyle = outerRingGrad;
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 繪製扇區文字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotationAngle * Math.PI) / 180);

      sectors.forEach((sec) => {
        const startRad = (sec.startAngle * Math.PI) / 180;
        const endRad = (sec.endAngle * Math.PI) / 180;
        const midRad = (startRad + endRad) / 2;
        const angleSpan = endRad - startRad;

        ctx.save();
        ctx.rotate(midRad);

        const contrastColor = getContrastYIQ(sec.prize.color);
        const n = sectors.length;
        const fontSize = n > 18 ? 13 : n > 12 ? 15 : n > 6 ? 19 : 22;

        ctx.shadowColor = contrastColor === '#ffffff' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = contrastColor;
        ctx.font = `700 ${fontSize}px sans-serif`;

        let text = sec.prize.title;
        const maxLen = angleSpan < 0.25 ? 5 : angleSpan < 0.5 ? 7 : 10;
        if (text.length > maxLen) text = text.substring(0, maxLen - 1) + '…';

        const textR = radius * 0.78;
        ctx.fillText(text, textR, 0);
        ctx.restore();
      });

      ctx.restore();
      drawPointer(ctx, centerX, centerY, radius, pointerDeflectionRef.current);
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

  // 彩帶禮花 Confetti 動畫
  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      vr: number;
    }[] = [];

    const colors = ['#ff0055', '#ff7700', '#ffb800', '#00f0ff', '#00f5a0', '#7000ff', '#ffffff'];

    for (let i = 0; i < 160; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        vx: (secureRandomFloat() - 0.5) * 22,
        vy: (secureRandomFloat() - 0.7) * 20,
        color: colors[Math.floor(secureRandomFloat() * colors.length)],
        size: secureRandomFloat() * 10 + 6,
        rotation: secureRandomFloat() * 360,
        vr: (secureRandomFloat() - 0.5) * 12,
      });
    }

    let frames = 0;
    const renderConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.rotation += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      frames++;
      if (frames < 140) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(renderConfetti);
  }, []);

  // 計算本次有效連抽人數（不再被單一獎項剩餘 1 名靜默截斷為 1）
  const getEffectiveDrawCount = useCallback(() => {
    return Math.max(1, drawCount);
  }, [drawCount]);

  // 抽獎結束統一結算（支援單抽、連抽與尾牙獎項綁定）
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
        // 若當前獎項已抽完，自動切換至下一個尚有名額的獎項
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
    [enableAwardMode, awardTiers, selectedAwardId, history, playWinFanfare, saveState, triggerConfetti]
  );

  // 啟動轉盤旋轉（單抽轉 1 次；多人連抽則自動逐輪連續轉動 N 次，每次指針真實停靠於該位得主）
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
        ? 1150
        : spinSpeed === 'normal'
        ? 2100
        : 3100
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

            // 扣減該位得主庫存，若抽完則下一抽前自動從轉盤剔除該扇區
            const nextStepPrizes = stepWorkingPrizes.map((p) => {
              if (p.id !== currentWinner.id) return p;
              const nextDrawn = p.drawnCount + 1;
              return {
                ...p,
                drawnCount: nextDrawn,
                isFinished: enableQuantityLimit ? nextDrawn >= p.quantity : false,
              };
            });

            setTimeout(() => {
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
              setTimeout(() => {
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

  // 啟動拉霸機抽獎（多人連抽時亦逐輪自動捲動並停靠於每位得主）
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
          requestAnimationFrame(animate);
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

            setTimeout(() => {
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
              setTimeout(() => {
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

      requestAnimationFrame(animate);
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
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
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

  // 載入快速模板（切換模板時自動關閉雙抽獎項池，除非使用者手動勾選）
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
  const latestBatchTitles = latestBatchRecords.map((r) => r.prizeTitle).join('、');

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
        <div
          className={`rounded-2xl p-3.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-lg min-w-0 ${styles.bannerGradient}`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full overflow-hidden">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
              {t.latestWinnerTag}
            </span>
            <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5 min-w-0 truncate">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className={`shrink-0 ${styles.bannerTrophyIcon}`}>
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              <span className="truncate">
                {history.length > 0
                  ? `${t.justWon}${latestBatchTitles}${history[0].awardName ? ` (${history[0].awardName})` : ''}`
                  : t.welcomeMsg}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span className="truncate">
                {t.historyBtn} ({history.length})
              </span>
            </button>
            <button
              type="button"
              onClick={handleShareUrl}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
              <span className="truncate">{t.shareLinkBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <span className="truncate">{soundEnabled ? t.soundOn : t.soundOff}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-white text-slate-950 rounded-xl hover:bg-slate-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <span className="truncate">{t.fullscreenBtn}</span>
            </button>
          </div>
        </div>

        {/* 模式切換、連抽人數、轉速與尾牙雙抽開關列 */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3.5 bg-surface-glass border border-border-glass rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-select-bg p-1 rounded-xl border border-border-glass">
              <button
                type="button"
                onClick={() => setDisplayMode('wheel')}
                className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
                  displayMode === 'wheel' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.wheelMode}
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('slot')}
                className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
                  displayMode === 'slot' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.slotMode}
              </button>
            </div>

            {/* 連抽人數與轉速選擇 */}
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor={drawCountSelectId} className="text-xs sm:text-sm font-medium text-text-sub">
                {t.drawCountLabel}
              </label>
              <select
                id={drawCountSelectId}
                value={drawCount}
                onChange={(e) => setDrawCount(Number(e.target.value))}
                className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
              >
                <option value={1}>{t.drawSingle}</option>
                <option value={3}>{t.drawThree}</option>
                <option value={5}>{t.drawFive}</option>
                <option value={10}>{t.drawTen}</option>
              </select>

              <label htmlFor={speedSelectId} className="text-xs sm:text-sm font-medium text-text-sub ml-1">
                {t.spinSpeedLabel}
              </label>
              <select
                id={speedSelectId}
                value={spinSpeed}
                onChange={(e) => setSpinSpeed(e.target.value as SpinSpeed)}
                className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
              >
                <option value="fast">{t.speedFast}</option>
                <option value="normal">{t.speedNormal}</option>
                <option value="suspense">{t.speedSuspense}</option>
              </select>
            </div>
          </div>

          {/* 數量限制與尾牙雙抽開關 */}
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor={awardModeToggleId} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-main cursor-pointer">
              <input
                id={awardModeToggleId}
                type="checkbox"
                checked={enableAwardMode}
                onChange={(e) => {
                  setEnableAwardMode(e.target.checked);
                  saveState(undefined, undefined, undefined, e.target.checked);
                }}
                className="w-4 h-4 rounded cursor-pointer accent-amber-500 shrink-0"
              />
              {t.enableAwardMode}
            </label>

            <label htmlFor={qtyLimitToggleId} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-sub cursor-pointer">
              <input
                id={qtyLimitToggleId}
                type="checkbox"
                checked={enableQuantityLimit}
                onChange={(e) => {
                  setEnableQuantityLimit(e.target.checked);
                  saveState(undefined, undefined, undefined, undefined, e.target.checked);
                }}
                className="w-4 h-4 rounded cursor-pointer accent-amber-500 shrink-0"
              />
              {t.enableQtyLimit}
            </label>
          </div>
        </div>

        {/* 主 Layout (兩欄式) */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 items-start">
          {/* 左欄：轉盤 / 拉霸機 舞台區 */}
          <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 shadow-lg backdrop-blur-md min-w-0">
            {/* 若開啟尾牙雙抽模式，於轉盤正上方顯示「目前抽取獎項」切換列 */}
            {enableAwardMode && awardTiers.length > 0 && (
              <div className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={activeAwardSelectId} className={`text-xs sm:text-sm font-bold ${styles.accentText}`}>
                  {t.currentAwardLabel}
                </label>
                <div className="flex items-center gap-2 flex-1 min-w-[180px] justify-end">
                  <select
                    id={activeAwardSelectId}
                    value={selectedAwardId}
                    onChange={(e) => setSelectedAwardId(e.target.value)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold outline-none cursor-pointer flex-1 max-w-[240px] ${styles.selectInput}`}
                  >
                    {awardTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                  {selectedAward && (
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                        selectedAwardRemain === 0 ? styles.redTag : styles.emeraldTag
                      }`}
                    >
                      {t.awardRemainFmt
                        .replace('{remain}', String(selectedAwardRemain))
                        .replace('{total}', String(selectedAward.quantity))}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={t.closeAwardModeBtn}
                    onClick={() => {
                      setEnableAwardMode(false);
                      saveState(undefined, undefined, undefined, false);
                    }}
                    className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer shrink-0 ${styles.redTag}`}
                    title={t.closeAwardModeBtn}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {displayMode === 'wheel' ? (
              <div className={styles.wheelContainer}>
                <canvas ref={previewCanvasRef} width={800} height={800} className={styles.wheelCanvas} />
              </div>
            ) : (
              <div className={styles.slotWrapper}>
                <div className={styles.slotFrame}>
                  <div className={styles.slotLights}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={styles.slotWindow}>
                    <div className={styles.slotPayline} />
                    <div className={styles.slotStrip} style={{ transform: `translateY(${slotTranslateY}px)` }}>
                      {slotStripItems.length === 0 ? (
                        <div className={styles.slotCard}>
                          <span>{t.spinReadySlot}</span>
                        </div>
                      ) : (
                        slotStripItems.map((item, idx) => (
                          <div key={idx} className={styles.slotCard}>
                            <div className={styles.slotCardDot} style={{ background: item.color }} />
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 抽獎啟動按鈕 */}
            <button
              type="button"
              onClick={handleStartSpin}
              disabled={isSpinning || unfinishedPrizes.length === 0 || Boolean(isAwardExhausted)}
              className={`w-full max-w-[380px] h-[54px] font-bold text-base sm:text-lg rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${styles.spinBtn}`}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
              {isSpinning
                ? multiSpinProgress
                  ? t.multiSpinningFmt
                      .replace('{current}', String(multiSpinProgress.current))
                      .replace('{total}', String(multiSpinProgress.total))
                  : t.spinning
                : unfinishedPrizes.length === 0
                ? t.allDrawn
                : isAwardExhausted
                ? t.awardExhausted
                : `${displayMode === 'wheel' ? t.spinWheelBtn : t.spinSlotBtn}${
                    drawCount > 1 ? t.spinCountSuffix.replace('{n}', String(drawCount)) : ''
                  }`}
            </button>

            {/* 連抽進行中：逐輪即時揭曉卡 */}
            {multiSpinProgress && (
              <div
                className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-col gap-2"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${styles.accentText}`}>
                    {t.multiRevealTitle
                      .replace('{current}', String(multiSpinProgress.revealed.length))
                      .replace('{total}', String(multiSpinProgress.total))}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-glass border border-border-glass overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      background: 'var(--theme-color)',
                      width: `${(multiSpinProgress.revealed.length / multiSpinProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                  {multiSpinProgress.revealed.map((w, idx) => (
                    <span
                      key={`${w.id}_${idx}`}
                      className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-xs sm:text-sm font-bold text-text-main flex items-center gap-1.5"
                    >
                      <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                      {w.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 最新一批連抽得獎名單即時展示卡 */}
            {!multiSpinProgress && latestBatchRecords.length > 0 && (
              <div className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${styles.accentText}`}>
                    {t.latestBatchLabel} ({latestBatchRecords.length})
                  </span>
                  {latestBatchRecords[0]?.awardName && (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${styles.emeraldTag}`}>
                      {latestBatchRecords[0].awardName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {latestBatchRecords.map((rec, idx) => (
                    <span
                      key={rec.id}
                      className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-xs sm:text-sm font-bold text-text-main flex items-center gap-1.5"
                    >
                      <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                      {rec.prizeTitle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <span className="text-xs text-text-sub text-center">{t.spacebarHint}</span>
          </div>

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
