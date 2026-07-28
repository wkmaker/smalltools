'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
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
    toastEl.className = 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-white bg-[#f59e0b] rounded-xl shadow-2xl z-[30000] animate-bounce';
    toastEl.textContent = msg;
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
          showToast(`🎉 成功匯入 ${newPrizes.length} 位人員名單！`);
        } else {
          showToast(`🎉 成功匯入 ${newPrizes.length} 個獎項！`);
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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl px-6 py-3 text-white flex justify-between items-center flex-wrap gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
              最新中獎
            </span>
            <span className="text-sm font-medium">
              {history.length > 0
                ? `🎉 剛抽出：${history[0].prizeTitle}`
                : '🎉 歡迎使用幸運轉盤抽獎小工具！自訂獎項即刻體驗！'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-1.5 text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-text-main"
            >
              📜 歷史紀錄 ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-3.5 py-1.5 text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-text-main"
            >
              {soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關'}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-3.5 py-1.5 text-sm font-semibold bg-white text-indigo-900 rounded-xl hover:bg-slate-100 shadow-md transition-all cursor-pointer"
            >
              ⛶ 全螢幕抽獎
            </button>
          </div>
        </div>

        {/* 模式切換與控制列 */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-black/20 border border-white/[.08] rounded-2xl p-4">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/[.08]">
            <button
              type="button"
              onClick={() => setDisplayMode('wheel')}
              className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                displayMode === 'wheel'
                  ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              🎡 幸運轉盤
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('slot')}
              className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                displayMode === 'slot'
                  ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              🎰 擬真拉霸機
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor={qtyLimitToggleId} className="flex items-center gap-2 text-sm font-medium text-text-sub cursor-pointer">
              <input
                id={qtyLimitToggleId}
                type="checkbox"
                checked={enableQuantityLimit}
                onChange={(e) => setEnableQuantityLimit(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-[#f59e0b]"
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
              {isSpinning
                ? '旋轉中...'
                : unfinishedPrizes.length === 0
                ? '全部抽完'
                : displayMode === 'wheel'
                ? '🎡 開始幸運抽獎'
                : '🎰 開始拉霸抽獎'}
            </button>
          </div>

          {/* 右欄：獎項編輯與設定 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center flex-wrap gap-3 border-b border-white/[.06] pb-4">
              <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
                ⚙️ 獎項與人員設定 ({prizes.length})
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  id={templateSelectId}
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
                  <option value="annual">🎉 公司年會尾牙</option>
                  <option value="lucky">✨ 幸運大轉盤 (6項)</option>
                  <option value="punish">🔥 歡樂懲罰遊戲</option>
                  <option value="dinner">🍱 晚餐吃什麼？</option>
                  <option value="empty">🗑️ 清空全新自訂</option>
                </select>

                <button
                  type="button"
                  onClick={exportTxt}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-white/[0.04] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer"
                >
                  📤 匯出 TXT
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-white/[0.04] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer"
                >
                  📥 匯入 TXT/名單
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
                  className="px-3 py-1.5 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  🔄 重置次數
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

      {/* 全螢幕抽獎舞台 Fullscreen Stage */}
      {isFullscreen && (
        <div className={styles.fullscreenStage}>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="fixed top-6 right-6 px-4 py-2.5 text-sm font-bold text-white bg-red-600/90 border border-white/30 rounded-xl hover:bg-red-600 hover:scale-105 transition-all cursor-pointer z-[10000] shadow-2xl backdrop-blur-md"
          >
            ✕ 退出全螢幕 (Esc)
          </button>

          <div className="flex-1 flex items-center justify-center gap-10 sm:gap-14 p-4 sm:p-8 w-full max-w-[98vw] h-[95vh] mx-auto max-lg:flex-col overflow-y-auto">
            {displayMode === 'wheel' ? (
              <div className="w-[min(86vh,62vw)] h-[min(86vh,62vw)] min-w-[340px] min-h-[340px] relative flex items-center justify-center shrink-0">
                <canvas ref={fullscreenCanvasRef} width={1200} height={1200} className="w-full h-full" />
                <button
                  type="button"
                  onClick={startWheelSpin}
                  disabled={isSpinning || unfinishedPrizes.length === 0}
                  className="absolute w-[min(18vh,160px)] h-[min(18vh,160px)] rounded-full bg-gradient-to-r from-pink-600 to-amber-500 text-white font-extrabold text-[min(4.5vh,34px)] border-4 border-white shadow-[0_0_60px_rgba(255,0,85,0.85)] hover:scale-105 transition-all cursor-pointer disabled:opacity-40 disabled:scale-100"
                >
                  抽獎
                </button>
              </div>
            ) : (
              <div className={`${styles.slotWrapper} ${styles.fullscreenSlotWrapper}`}>
                <div className={styles.slotFrame} style={{ padding: 'min(2.5vh, 2rem)', width: '100%' }}>
                  <div className={styles.slotLights}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={`${styles.slotWindow} ${styles.fullscreenSlotWindow}`}>
                    <div className={styles.slotPayline} style={{ height: 'min(15vh, 115px)' }} />
                    <div className={styles.slotStrip} style={{ transform: `translateY(${slotTranslateY}px)` }}>
                      {slotStripItems.map((item, idx) => (
                        <div key={idx} className={styles.slotCard} style={{ height: 'min(13vh, 104px)', fontSize: 'min(4vh, 2.2rem)' }}>
                          <div className={styles.slotCardDot} style={{ background: item.color, width: 'min(2.8vh, 22px)', height: 'min(2.8vh, 22px)' }} />
                          <span>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startSlotSpin}
                  disabled={isSpinning || unfinishedPrizes.length === 0}
                  className="mt-6 px-16 py-4 text-[min(4vh,28px)] font-extrabold text-white bg-gradient-to-r from-pink-600 to-amber-500 border-4 border-white rounded-full shadow-[0_0_45px_rgba(255,0,85,0.85)] hover:scale-105 transition-all cursor-pointer disabled:opacity-40"
                >
                  🎰 抽獎
                </button>
              </div>
            )}

            {/* 全螢幕資訊側板 */}
            <div className="w-[min(26vw,380px)] min-w-[280px] max-w-[92vw] h-[min(86vh,720px)] bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-5 text-left backdrop-blur-md shadow-2xl">
              <h4 className="text-xs uppercase tracking-widest text-[#00f0ff] font-bold border-b border-white/10 pb-2">
                可抽項目 ({unfinishedPrizes.length})
              </h4>

              <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1 text-xs">
                {unfinishedPrizes.length === 0 ? (
                  <span className="text-slate-400 italic">✅ 所有項目已抽完</span>
                ) : (
                  unfinishedPrizes.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 bg-black/30 p-2.5 rounded-lg border border-white/5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-white font-medium text-sm truncate flex-1">{p.title}</span>
                      {enableQuantityLimit && (
                        <span className="text-xs font-mono text-slate-400">
                          剩 {Math.max(0, p.quantity - p.drawnCount)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 上一位得獎者小卡 */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-text-sub font-semibold">
                  上一位得獎者 🏆
                </span>
                <span className="text-base font-bold text-amber-400">
                  {history.length > 0 ? history[0].prizeTitle : '尚無紀錄'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 歷史紀錄 Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[20000] flex items-center justify-center p-4">
          <div className="bg-select-bg border border-border-glass rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">📜 歷史中獎紀錄</h3>
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
                    <span className="font-sans text-white font-semibold">🎉 {rec.prizeTitle}</span>
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
            <div className="w-20 h-20 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              🏆
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
              太棒了！繼續抽獎 🚀
            </button>
          </div>
        </div>
      )}

      {/* 彩帶 Canvas */}
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} />
    </ToolLayout>
  );
}
