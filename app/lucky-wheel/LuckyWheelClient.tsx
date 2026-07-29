'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import ToolLayout from '../components/ToolLayout';
import styles from './lucky-wheel.module.css';

// 預設轉盤色彩盤
const PRESET_COLORS = [
  '#ff0055',
  '#ff7700',
  '#ffb800',
  '#00f0ff',
  '#00f5a0',
  '#7000ff',
  '#ff00b7',
  '#0099ff',
  '#eab308',
  '#ec4899',
  '#10b981',
  '#6366f1',
];

export interface PrizeItem {
  id: string;
  title: string;
  weight: number;
  quantity: number;
  drawnCount: number;
  color: string;
  isFinished?: boolean;
}

export interface HistoryRecord {
  id: string;
  prizeTitle: string;
  timestamp: number;
}

// 快速模板預設資料
const PRIZE_TEMPLATES: Record<string, Omit<PrizeItem, 'id'>[]> = {
  annual: [
    { title: '特等獎 - Mac Mini', weight: 1, quantity: 1, drawnCount: 0, color: '#ff0055' },
    { title: '頭獎 - iPhone 16', weight: 2, quantity: 2, drawnCount: 0, color: '#ff7700' },
    { title: '二獎 - iPad Air', weight: 3, quantity: 3, drawnCount: 0, color: '#ffb800' },
    { title: '三獎 - AirPods Pro', weight: 5, quantity: 5, drawnCount: 0, color: '#00f0ff' },
    { title: '普獎 - 7-11 禮券 500元', weight: 10, quantity: 10, drawnCount: 0, color: '#00f5a0' },
    { title: '銘謝惠顧', weight: 15, quantity: 99, drawnCount: 0, color: '#7000ff' },
  ],
  lucky: [
    { title: '幸運數字 1', weight: 10, quantity: 1, drawnCount: 0, color: '#ff0055' },
    { title: '幸運數字 2', weight: 10, quantity: 1, drawnCount: 0, color: '#ff7700' },
    { title: '幸運數字 3', weight: 10, quantity: 1, drawnCount: 0, color: '#ffb800' },
    { title: '幸運數字 4', weight: 10, quantity: 1, drawnCount: 0, color: '#00f0ff' },
    { title: '幸運數字 5', weight: 10, quantity: 1, drawnCount: 0, color: '#00f5a0' },
    { title: '幸運數字 6', weight: 10, quantity: 1, drawnCount: 0, color: '#7000ff' },
  ],
  punish: [
    { title: '鬼臉三連拍', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
    { title: '喝苦瓜汁一杯', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
    { title: '現場大唱一首歌', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
    { title: '伏地挺身 10 下', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
    { title: '對隔壁深情告白', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
    { title: '安全過關 免受懲罰', weight: 2, quantity: 99, drawnCount: 0, color: '#7000ff' },
  ],
  dinner: [
    { title: '日式拉麵', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
    { title: '韓式燒肉', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
    { title: '義大利麵', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
    { title: '台式便當', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
    { title: '麥當勞速食', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
    { title: '健康沙拉餐', weight: 1, quantity: 99, drawnCount: 0, color: '#7000ff' },
  ],
};

function generateId(): string {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

function getContrastYIQ(hexcolor: string): string {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 138 ? '#0f172a' : '#ffffff';
}

export default function LuckyWheelClient() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'wheel' | 'slot'>('wheel');
  const [enableQuantityLimit, setEnableQuantityLimit] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 狀態存儲
  const [prizes, setPrizes] = useState<PrizeItem[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // 全螢幕與彈窗
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [winnerModalData, setWinnerModalData] = useState<{ prize: PrizeItem; timestamp: number } | null>(null);

  // 轉盤動畫控制
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentRotationAngle, setCurrentRotationAngle] = useState<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // 拉霸機動畫控制
  const [slotStripItems, setSlotStripItems] = useState<PrizeItem[]>([]);
  const [slotTranslateY, setSlotTranslateY] = useState<number>(0);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const templateSelectId = useId();
  const qtyLimitToggleId = useId();

  // 音效 Engine (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // 忽略音效錯誤
    }
  };

  const playWinFanfare = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + i * 0.12;

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // 忽略音效錯誤
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#f59e0b');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.6)');
  }, []);

  // 讀取 LocalStorage 數據
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedMode = localStorage.getItem('lw_display_mode');
      if (savedMode) setDisplayMode(savedMode as 'wheel' | 'slot');

      const savedLimit = localStorage.getItem('lw_qty_limit');
      if (savedLimit !== null) setEnableQuantityLimit(savedLimit === 'true');

      const savedPrizes = localStorage.getItem('lw_prizes');
      if (savedPrizes) {
        setPrizes(JSON.parse(savedPrizes));
      } else {
        setPrizes(PRIZE_TEMPLATES.annual.map((p) => ({ ...p, id: generateId() })));
      }

      const savedHistory = localStorage.getItem('lw_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch {
      setPrizes(PRIZE_TEMPLATES.annual.map((p) => ({ ...p, id: generateId() })));
    }
  }, []);

  // 寫入 LocalStorage 數據
  const saveState = useCallback(
    (newPrizes?: PrizeItem[], newHistory?: HistoryRecord[]) => {
      try {
        localStorage.setItem('lw_display_mode', displayMode);
        localStorage.setItem('lw_qty_limit', enableQuantityLimit.toString());
        localStorage.setItem('lw_prizes', JSON.stringify(newPrizes || prizes));
        localStorage.setItem('lw_history', JSON.stringify(newHistory || history));
      } catch {
        // 忽略
      }
    },
    [displayMode, enableQuantityLimit, prizes, history]
  );

  // 獲取尚未抽完之可用獎項
  const getUnfinishedPrizes = useCallback(() => {
    return prizes.filter((p) => {
      if (p.weight <= 0) return false;
      if (p.isFinished) return false;
      if (enableQuantityLimit && p.drawnCount >= p.quantity) return false;
      return true;
    });
  }, [prizes, enableQuantityLimit]);

  // 計算扇區角度與總權重
  const calculateSectors = useCallback(() => {
    const validPrizes = getUnfinishedPrizes();
    const totalWeight = validPrizes.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return { sectors: [], totalWeight: 0 };

    let currentAngle = 0;
    const sectors = validPrizes.map((prize) => {
      const angleSpan = (prize.weight / totalWeight) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;
      return { prize, startAngle, endAngle, angleSpan };
    });

    return { sectors, totalWeight };
  }, [getUnfinishedPrizes]);

  // 繪製 12 點鐘頂部指針 (Pointer)
  const drawPointer = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    ctx.save();
    const wheelTop = centerY - radius;
    const ballR = 15;
    const ballY = wheelTop - ballR - 6;
    const tipY = wheelTop + 22;
    const baseY = wheelTop - 4;
    const halfW = 18;

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

      if (sectors.length === 0 || totalWeight === 0) {
        ctx.save();
        const emptyGrad = ctx.createRadialGradient(centerX, centerY - radius * 0.3, 0, centerX, centerY, radius);
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
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('所有獎項已抽完', centerX, centerY);
        ctx.restore();
        drawPointer(ctx, centerX, centerY, radius);
        return;
      }

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotationAngle * Math.PI) / 180);

      // 繪製各扇區
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
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

      // 繪製文字
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
        const fontSize = n > 14 ? 14 : n > 10 ? 16 : n > 6 ? 19 : 22;

        ctx.shadowColor = contrastColor === '#ffffff' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = contrastColor;
        ctx.font = `700 ${fontSize}px sans-serif`;

        let text = sec.prize.title;
        const maxLen = angleSpan < 0.35 ? 5 : angleSpan < 0.6 ? 7 : 10;
        if (text.length > maxLen) text = text.substring(0, maxLen - 1) + '…';

        const textR = radius * 0.78;
        ctx.fillText(text, textR, 0);
        ctx.restore();
      });

      ctx.restore();
      drawPointer(ctx, centerX, centerY, radius);
    },
    [calculateSectors, currentRotationAngle]
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
    if (displayMode === 'wheel') {
      const timer = setTimeout(() => {
        drawWheelOnCanvas(previewCanvasRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayMode, drawWheelOnCanvas]);

  useEffect(() => {
    drawWheelOnCanvas(previewCanvasRef.current);
    if (isFullscreen) {
      drawWheelOnCanvas(fullscreenCanvasRef.current);
    }
  }, [drawWheelOnCanvas, isFullscreen]);

  // 抽獎結束觸發處理
  const onSpinEnd = useCallback(
    (winningPrize: PrizeItem) => {
      setIsSpinning(false);
      playWinFanfare();

      const updatedPrizes = prizes.map((p) => {
        if (p.id === winningPrize.id) {
          const newDrawn = p.drawnCount + 1;
          const isFin = enableQuantityLimit ? newDrawn >= p.quantity : false;
          return { ...p, drawnCount: newDrawn, isFinished: isFin };
        }
        return p;
      });

      const newRec: HistoryRecord = {
        id: 'h_' + Date.now(),
        prizeTitle: winningPrize.title,
        timestamp: Date.now(),
      };
      const updatedHistory = [newRec, ...history];

      setPrizes(updatedPrizes);
      setHistory(updatedHistory);
      saveState(updatedPrizes, updatedHistory);
      setWinnerModalData({ prize: winningPrize, timestamp: Date.now() });

      // 觸發彩色禮花砲
      triggerConfetti();
    },
    [prizes, history, enableQuantityLimit, saveState]
  );

  // 啟動 🎡 轉盤旋轉
  const startWheelSpin = () => {
    const { sectors, totalWeight } = calculateSectors();
    if (sectors.length === 0 || totalWeight === 0 || isSpinning) return;

    setIsSpinning(true);

    const randVal = Math.random() * totalWeight;
    let accum = 0;
    let selectedSector = sectors[0];

    for (let i = 0; i < sectors.length; i++) {
      accum += sectors[i].prize.weight;
      if (randVal <= accum) {
        selectedSector = sectors[i];
        break;
      }
    }

    const midAngle = (selectedSector.startAngle + selectedSector.endAngle) / 2;
    let targetRotation = 360 - midAngle;
    const extraRounds = (5 + Math.floor(Math.random() * 4)) * 360;
    const finalAngle = currentRotationAngle + extraRounds + (targetRotation - (currentRotationAngle % 360));

    const startTime = performance.now();
    const duration = 5000;
    let lastTickAngle = currentRotationAngle;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = currentRotationAngle + (finalAngle - currentRotationAngle) * easeOut;

      setCurrentRotationAngle(currentAngle);

      if (currentAngle - lastTickAngle >= 25) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        onSpinEnd(selectedSector.prize);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  };

  // 啟動 🎰 拉霸機抽獎
  const startSlotSpin = () => {
    const validPrizes = getUnfinishedPrizes();
    if (validPrizes.length === 0 || isSpinning) return;

    setIsSpinning(true);

    const totalWeight = validPrizes.reduce((sum, p) => sum + p.weight, 0);
    const randVal = Math.random() * totalWeight;
    let accum = 0;
    let winningPrize = validPrizes[0];

    for (let i = 0; i < validPrizes.length; i++) {
      accum += validPrizes[i].weight;
      if (randVal <= accum) {
        winningPrize = validPrizes[i];
        break;
      }
    }

    const stripPrizes: PrizeItem[] = [];
    for (let r = 0; r < 12; r++) {
      stripPrizes.push(...validPrizes);
    }
    stripPrizes.push(winningPrize);
    for (let r = 0; r < 2; r++) {
      stripPrizes.push(...validPrizes);
    }

    setSlotStripItems(stripPrizes);

    const cardHeight = isFullscreen ? 104 : 76;
    const targetIdx = stripPrizes.length - 3;
    const targetTranslateY = -(targetIdx * cardHeight);

    const startTime = performance.now();
    const duration = 4500;
    let lastSoundTime = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentY = targetTranslateY * easeOut;

      setSlotTranslateY(currentY);

      if (now - lastSoundTime > 120) {
        playTickSound();
        lastSoundTime = now;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onSpinEnd(winningPrize);
      }
    };

    requestAnimationFrame(animate);
  };

  // 彩帶禮花 Confetti 動畫
  const triggerConfetti = () => {
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
        vx: (Math.random() - 0.5) * 22,
        vy: (Math.random() - 0.7) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
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
  };

  // 模板載入
  const loadTemplate = (templateKey: string) => {
    if (PRIZE_TEMPLATES[templateKey]) {
      const newItems = PRIZE_TEMPLATES[templateKey].map((p) => ({ ...p, id: generateId() }));
      setPrizes(newItems);
      saveState(newItems);
      showToast(`已成功載入範例模板！`);
    }
  };

  const showToast = (msg: string) => {
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-white bg-[#f59e0b] rounded-xl shadow-2xl z-[30000] animate-bounce flex items-center gap-2';
    toastEl.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><span>${msg}</span>`;
    document.body.appendChild(toastEl);
    setTimeout(() => {
      if (document.body.contains(toastEl)) document.body.removeChild(toastEl);
    }, 2200);
  };

  // TXT 匯出
  const exportTxt = () => {
    const textContent = prizes.map((p) => `${p.title}\t${p.weight}\t${p.quantity}\t${p.color}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LuckyWheel_Prizes_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // TXT 匯入
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const newPrizes: PrizeItem[] = [];
      let singleColumnLines = 0;

      lines.forEach((line) => {
        const clean = line.trim();
        if (!clean || clean.startsWith('#') || clean.startsWith('//')) return;

        const parts = clean.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          const title = parts[0];
          const weight = parts.length > 1 && parts[1] ? Math.max(0, parseInt(parts[1], 10) || 1) : 1;
          const quantity = parts.length > 2 && parts[2] ? Math.max(1, parseInt(parts[2], 10) || 1) : 1;
          const color =
            parts.length > 3 && /^#[0-9A-Fa-f]{6}$/.test(parts[3])
              ? parts[3]
              : PRESET_COLORS[newPrizes.length % PRESET_COLORS.length];

          if (parts.length === 1) singleColumnLines++;

          newPrizes.push({
            id: generateId(),
            title,
            weight,
            quantity,
            drawnCount: 0,
            color,
            isFinished: false,
          });
        }
      });

      if (newPrizes.length > 0) {
        setPrizes(newPrizes);
        saveState(newPrizes);
        if (singleColumnLines / newPrizes.length >= 0.7) {
          showToast(`成功匯入 ${newPrizes.length} 位人員名單！`);
        } else {
          showToast(`成功匯入 ${newPrizes.length} 個獎項！`);
        }
      } else {
        showToast('未找到有效名單，請檢查檔案格式');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const unfinishedPrizes = getUnfinishedPrizes();
  const totalWeight = unfinishedPrizes.reduce((sum, p) => sum + p.weight, 0);

  // 獎項編輯更新
  const updatePrizeItem = (id: string, field: keyof PrizeItem, value: unknown) => {
    const updated = prizes.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setPrizes(updated);
    saveState(updated);
  };

  const removePrizeItem = (id: string) => {
    const updated = prizes.filter((p) => p.id !== id);
    setPrizes(updated);
    saveState(updated);
  };

  const addPrizeItem = () => {
    const newItem: PrizeItem = {
      id: generateId(),
      title: `新獎項 ${prizes.length + 1}`,
      weight: 1,
      quantity: 1,
      drawnCount: 0,
      color: PRESET_COLORS[prizes.length % PRESET_COLORS.length],
      isFinished: false,
    };
    const updated = [...prizes, newItem];
    setPrizes(updated);
    saveState(updated);
  };

  const resetDrawnCounts = () => {
    const updated = prizes.map((p) => ({ ...p, drawnCount: 0, isFinished: false }));
    setPrizes(updated);
    saveState(updated);
    showToast('已重置所有項目抽中次數！');
  };

  if (!isMounted) return null;

  return (
    <ToolLayout
      title="幸運轉盤與拉霸抽獎小工具"
      subtitle="LUCKY WHEEL & SLOT SPINNER"
      description="免費線上幸運轉盤與擬真拉霸機抽獎小工具！支援雙視覺模式切換、預設年會與遊戲模板、數量限制與展場無限抽獎、TXT 名單一鍵匯入匯出、全螢幕抽獎舞台與彩帶音效。"
      accentColor="#f59e0b"
      accentGlow="rgba(245, 158, 11, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 頂部頂級公告與工具列 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-3.5 sm:px-6 sm:py-3 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-lg min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full overflow-hidden">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
              最新中獎
            </span>
            <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5 min-w-0 truncate">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-amber-300 shrink-0">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              <span className="truncate">
                {history.length > 0
                  ? `剛抽出：${history[0].prizeTitle}`
                  : '歡迎使用幸運轉盤抽獎小工具！自訂獎項即刻體驗！'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-text-main flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span className="truncate">紀錄 ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-text-main flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0"
            >
              {soundEnabled ? (
                <>
                  <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  <span className="truncate">音效: 開</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                  <span className="truncate">音效: 關</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-white text-indigo-900 rounded-xl hover:bg-slate-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <span className="truncate font-bold">全螢幕</span>
            </button>
          </div>
        </div>

        {/* 模式切換與控制列 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 bg-black/20 border border-white/[.08] rounded-2xl p-3.5 sm:p-4">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/[.08] w-full sm:w-auto grid grid-cols-2 sm:flex">
            <button
              type="button"
              onClick={() => setDisplayMode('wheel')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
                displayMode === 'wheel'
                  ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              幸運轉盤
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('slot')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
                displayMode === 'slot'
                  ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              擬真拉霸機
            </button>
          </div>

          <div className="flex items-center gap-3 justify-start sm:justify-end">
            <label htmlFor={qtyLimitToggleId} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-sub cursor-pointer">
              <input
                id={qtyLimitToggleId}
                type="checkbox"
                checked={enableQuantityLimit}
                onChange={(e) => setEnableQuantityLimit(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-[#f59e0b] shrink-0"
              />
              啟用數量限制 (關閉為展場無限抽)
            </label>
          </div>
        </div>

        {/* 主 Layout (兩欄式) */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 items-start">
          {/* 左欄：轉盤 / 拉霸機 渲染區 */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-6 shadow-lg backdrop-blur-md">
            {displayMode === 'wheel' ? (
              /* 🎡 轉盤 */
              <div className={styles.wheelContainer}>
                <canvas ref={previewCanvasRef} width={800} height={800} className={styles.wheelCanvas} />
              </div>
            ) : (
              /* 🎰 拉霸機 */
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
                          <span>準備就緒，點擊抽獎！</span>
                        </div>
                      ) : (
                        slotStripItems.map((item, idx) => (
                          <div key={idx} className={styles.slotCard}>
                            <div className={styles.slotCardDot} style={{ background: item.color }} />
                            <span>{item.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 抽獎按鈕 */}
            <button
              type="button"
              onClick={displayMode === 'wheel' ? startWheelSpin : startSlotSpin}
              disabled={isSpinning || unfinishedPrizes.length === 0}
              className="w-full max-w-[360px] h-[54px] bg-[#f59e0b]/20 border border-[#f59e0b]/50 text-[#f59e0b] font-bold text-lg rounded-xl cursor-pointer hover:bg-[#f59e0b] hover:text-[#030305] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
              {isSpinning
                ? '旋轉中...'
                : unfinishedPrizes.length === 0
                ? '全部抽完'
                : displayMode === 'wheel'
                ? '開始幸運抽獎'
                : '開始拉霸抽獎'}
            </button>
          </div>

          {/* 右欄：獎項編輯與設定 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center flex-wrap gap-3 border-b border-white/[.06] pb-4">
              <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#f59e0b]">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                獎項與人員設定 ({prizes.length})
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  id={templateSelectId}
                  aria-label="快速範例模板"
                  defaultValue=""
                  onChange={(e) => {
                    loadTemplate(e.target.value);
                    e.target.selectedIndex = 0;
                  }}
                  className="bg-select-bg text-text-main border border-border-glass rounded-xl px-2.5 py-1.5 text-sm font-mono font-medium outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    快速範例模板...
                  </option>
                  <option value="annual">公司年會尾牙</option>
                  <option value="lucky">幸運大轉盤 (6項)</option>
                  <option value="punish">歡樂懲罰遊戲</option>
                  <option value="dinner">晚餐吃什麼？</option>
                  <option value="empty">清空全新自訂</option>
                </select>

                <button
                  type="button"
                  onClick={exportTxt}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-white/[0.04] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                  </svg>
                  匯出 TXT
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-white/[0.04] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  匯入 TXT/名單
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={resetDrawnCounts}
                  className="px-3 py-1.5 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                  重置次數
                </button>
                <button
                  type="button"
                  onClick={addPrizeItem}
                  className="px-3 py-1.5 text-sm font-bold text-black bg-[#f59e0b] rounded-xl hover:bg-[#f59e0b]/80 transition-all cursor-pointer"
                >
                  ＋ 新增項目
                </button>
              </div>
            </div>

            {/* 獎項清單列表 */}
            <div className="flex flex-col gap-3">
              {prizes.map((p) => {
                const isUnfinished = unfinishedPrizes.some((item) => item.id === p.id);
                const ratioStr =
                  isUnfinished && totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(2) + '%' : '0.00%';
                const remain = Math.max(0, p.quantity - p.drawnCount);
                const isZero = remain === 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/[.05] flex-wrap ${
                      p.isFinished ? styles.prizeFinished : ''
                    }`}
                  >
                    {/* 顏色選擇 */}
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => updatePrizeItem(p.id, 'color', e.target.value)}
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent shrink-0"
                    />

                    {/* 獎項名稱 */}
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => updatePrizeItem(p.id, 'title', e.target.value)}
                      placeholder="獎項或人員姓名"
                      className="flex-1 min-w-[140px] bg-black/50 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs outline-none focus:border-[#f59e0b]"
                    />

                    {/* 權重與機率 */}
                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                      <span>權重:</span>
                      <input
                        type="number"
                        min="0"
                        value={p.weight}
                        onChange={(e) => updatePrizeItem(p.id, 'weight', parseInt(e.target.value, 10) || 0)}
                        className="w-14 bg-black/50 border border-white/10 text-white px-2 py-1 rounded-lg text-xs outline-none font-mono text-center"
                      />
                      <span className="text-[#00f0ff] font-mono text-xs bg-[#00f0ff]/10 px-1.5 py-0.5 rounded border border-[#00f0ff]/20 font-bold">
                        {ratioStr}
                      </span>
                    </div>

                    {/* 數量上限 */}
                    {enableQuantityLimit ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                        <span>數量:</span>
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => updatePrizeItem(p.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-14 bg-black/50 border border-white/10 text-white px-2 py-1 rounded-lg text-xs outline-none font-mono text-center"
                        />
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isZero
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {remain > 0 ? `剩 ${remain}` : '已抽完'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#00f0ff] px-2" title="展場不限數量模式">
                        ∞
                      </span>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <label className="flex items-center gap-1 text-sm font-medium text-text-sub cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isFinished}
                          onChange={(e) => updatePrizeItem(p.id, 'isFinished', e.target.checked)}
                          className="w-3.5 h-3.5 rounded cursor-pointer"
                        />
                        抽完
                      </label>
                      <button
                        type="button"
                        onClick={() => removePrizeItem(p.id)}
                        className="text-red-400 text-xs px-1.5 py-0.5 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 全螢幕抽獎舞台 Fullscreen Stage (Portal 至 document.body 脫離外層 ToolLayout 外框) */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div className={styles.fullscreenStage}>
          {/* 獨立頂部列：100% 寬度不使用 100vw，確保按鈕在任何螢幕寬度下絕不超出右側邊界 */}
          <div className="w-full flex items-center justify-between px-4 sm:px-8 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md shrink-0 z-[10000] box-border">
            <div className="flex items-center gap-2 text-white/90 font-bold text-xs sm:text-sm tracking-wider uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse" />
              <span>{displayMode === 'wheel' ? '幸運轉盤抽獎舞台' : '擬真拉霸機抽獎舞台'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-red-600/90 border border-white/30 rounded-xl hover:bg-red-600 hover:scale-105 transition-all cursor-pointer shadow-lg backdrop-blur-md shrink-0"
            >
              ✕ 退出全螢幕 (Esc)
            </button>
          </div>

          {/* 舞台主要區域：768px+ 自動橫向並排，768px- 垂直堆疊並適度控制高度 */}
          <div className="flex-1 flex items-center justify-start md:justify-center gap-5 sm:gap-8 lg:gap-14 p-3 sm:p-6 w-full max-w-full overflow-y-auto max-md:flex-col box-border">
            {displayMode === 'wheel' ? (
              <div className={`${styles.fullscreenWheelWrapper} md:my-auto`}>
                <canvas ref={fullscreenCanvasRef} width={1600} height={1600} className="w-full h-full" />
                <button
                  type="button"
                  onClick={startWheelSpin}
                  disabled={isSpinning || unfinishedPrizes.length === 0}
                  className="absolute w-[min(18vh,165px)] h-[min(18vh,165px)] rounded-full bg-gradient-to-r from-pink-600 to-amber-500 text-white font-extrabold text-[min(4.2vh,34px)] border-4 border-white shadow-[0_0_60px_rgba(255,0,85,0.85)] hover:scale-105 transition-all cursor-pointer disabled:opacity-40 disabled:scale-100 min-w-[70px] min-h-[70px]"
                >
                  抽獎
                </button>
              </div>
            ) : (
              <div className={`${styles.slotWrapper} ${styles.fullscreenSlotWrapper} md:my-auto`}>
                <div className={styles.slotFrame} style={{ padding: 'min(2.8vh, 1.75rem)', width: '100%' }}>
                  <div className={styles.slotLights}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={`${styles.slotWindow} ${styles.fullscreenSlotWindow}`}>
                    <div className={styles.slotPayline} style={{ height: 'min(16vh, 125px)' }} />
                    <div className={styles.slotStrip} style={{ transform: `translateY(${slotTranslateY}px)` }}>
                      {slotStripItems.map((item, idx) => (
                        <div key={idx} className={styles.slotCard} style={{ height: 'min(14vh, 110px)', fontSize: 'min(3.8vh, 2rem)' }}>
                          <div className={styles.slotCardDot} style={{ background: item.color, width: 'min(2.8vh, 20px)', height: 'min(2.8vh, 20px)' }} />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startSlotSpin}
                  disabled={isSpinning || unfinishedPrizes.length === 0}
                  className="mt-4 sm:mt-6 px-12 sm:px-18 py-3.5 sm:py-4.5 text-[min(3.8vh,28px)] font-extrabold text-white bg-gradient-to-r from-pink-600 to-amber-500 border-4 border-white rounded-full shadow-[0_0_45px_rgba(255,0,85,0.85)] hover:scale-105 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                  抽獎
                </button>
              </div>
            )}

            {/* 全螢幕資訊側板：768px 以下寬度與轉盤/拉霸機完全齊平 (max-md:w-[min(48vh,88vw)])，768px 以上維持側欄 */}
            <div className="w-[min(30vw,440px)] max-md:w-[min(48vh,88vw)] min-w-[260px] max-w-[88vw] h-fit max-h-[min(86vh,800px)] shrink-0 bg-black/45 border border-white/15 rounded-3xl p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 text-left backdrop-blur-md shadow-2xl md:my-auto overflow-y-auto box-border">
              <h4 className="text-base sm:text-lg uppercase tracking-widest text-[#00f0ff] font-bold border-b border-white/15 pb-3 flex items-center justify-between shrink-0">
                <span>可抽項目 ({unfinishedPrizes.length})</span>
                <span className="text-xs font-mono font-normal text-text-sub">LIVE LIST</span>
              </h4>

              <div className="flex flex-col gap-2.5 w-full">
                {unfinishedPrizes.length === 0 ? (
                  <span className="text-slate-400 italic flex items-center justify-center gap-2 py-8 text-base font-medium">
                    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className="text-emerald-400">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    所有項目已抽完！
                  </span>
                ) : (
                  unfinishedPrizes.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 bg-black/40 p-3 rounded-xl border border-white/10 shadow-sm shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background: p.color, color: p.color }} />
                      <span className="text-white font-semibold text-sm sm:text-base truncate flex-1">{p.title}</span>
                      {enableQuantityLimit && (
                        <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg shrink-0">
                          剩 {Math.max(0, p.quantity - p.drawnCount)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 上一位得獎者小卡 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col gap-1.5 shadow-lg shrink-0">
                <span className="text-xs sm:text-sm uppercase tracking-wider text-text-sub font-bold flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="text-amber-400">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                  上一位得獎者
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono tracking-wide drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] truncate">
                  {history.length > 0 ? history[0].prizeTitle : '尚無紀錄'}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 歷史紀錄 Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[20000] flex items-center justify-center p-4">
          <div className="bg-select-bg border border-border-glass rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="text-[#f59e0b]">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                歷史中獎紀錄
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 text-lg hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto font-mono text-xs">
              {history.length === 0 ? (
                <span className="text-slate-500 text-center py-6">尚無抽獎紀錄</span>
              ) : (
                history.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex justify-between items-center bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/5"
                  >
                    <span className="font-sans text-white font-semibold flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="text-amber-400">
                        <path d="M12 2L1 21h22L12 2zm0 3.8L18.4 17H5.6L12 5.8z" />
                      </svg>
                      {rec.prizeTitle}
                    </span>
                    <span className="text-text-sub text-xs">
                      {new Date(rec.timestamp).toLocaleTimeString('zh-TW', { hour12: false })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  saveState(undefined, []);
                  showToast('已清空歷史紀錄');
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
              >
                清空紀錄
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 中獎歡呼 Modal */}
      {winnerModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[25000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#181824] border-2 border-[#f59e0b] rounded-3xl w-full max-w-lg p-8 flex flex-col items-center gap-6 text-center shadow-[0_0_80px_rgba(245,158,11,0.5)]">
            <div className="w-20 h-20 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">CONGRATULATIONS!</span>
              <h2 className="text-3xl font-extrabold text-white">{winnerModalData.prize.title}</h2>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(winnerModalData.timestamp).toLocaleString('zh-TW')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setWinnerModalData(null)}
              className="w-full py-3 bg-[#f59e0b] text-black font-extrabold text-base rounded-xl hover:bg-amber-400 transition-all cursor-pointer shadow-lg"
            >
              太棒了！繼續抽獎
            </button>
          </div>
        </div>
      )}

      {/* 彩帶 Canvas */}
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} />
    </ToolLayout>
  );
}
