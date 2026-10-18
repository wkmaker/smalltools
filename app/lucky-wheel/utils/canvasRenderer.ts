import type { PrizeItem } from '../types';
import type { WheelSector } from '../engine';
import { getContrastYIQ, secureRandomFloat } from '../engine';

// 繪製 12 點鐘頂部指針（支援物理彈動偏角 deflectionDeg）
export function drawPointer(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  deflectionDeg: number
) {
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
}

export interface RenderWheelParams {
  canvas: HTMLCanvasElement | null;
  sectors: WheelSector<PrizeItem>[];
  totalWeight: number;
  currentRotationAngle: number;
  pointerDeflection: number;
  emptyLabel: string;
}

export function renderWheelOnCanvas({
  canvas,
  sectors,
  totalWeight,
  currentRotationAngle,
  pointerDeflection,
  emptyLabel,
}: RenderWheelParams) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.42;

  ctx.clearRect(0, 0, size, size);

  const isLight =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light';

  if (sectors.length === 0 || totalWeight === 0) {
    ctx.save();
    const emptyGrad = ctx.createRadialGradient(
      centerX,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
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
    ctx.fillText(emptyLabel, centerX, centerY);
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
    const shimmer = ctx.createRadialGradient(
      shimmerX,
      shimmerY,
      0,
      shimmerX,
      shimmerY,
      radius * 0.85
    );
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
  const hubGrad = ctx.createRadialGradient(
    -hubRadius * 0.3,
    -hubRadius * 0.3,
    0,
    0,
    0,
    hubRadius
  );
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

    ctx.shadowColor =
      contrastColor === '#ffffff' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)';
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
  drawPointer(ctx, centerX, centerY, radius, pointerDeflection);
}

// 彩帶禮花 Confetti 動畫
export function triggerConfettiAnimation(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    vr: number;
  }> = [];

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
}
