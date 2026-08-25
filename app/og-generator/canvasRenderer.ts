import { RATIO_DIMENSIONS, PRESET_ICONS } from './constants';
import { DrawCanvasParams } from './types';

/**
 * 自動文字折行與行數限制函式
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number {
  const words = text.split('');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.slice(0, -1) + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

/**
 * 繪製平滑圓角矩形路徑
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 核心 Canvas 2D 渲染引擎 (無 React 依賴)
 */
export function renderCanvas(params: DrawCanvasParams): void {
  const {
    canvas,
    template,
    aspectRatio,
    themeMode,
    fontFamily,
    title,
    subtitle,
    tag,
    siteName,
    author,
    dateStr,
    color1,
    color2,
    lightColor1,
    lightColor2,
    accentColor,
    enableLogo,
    enableBgImage,
    logoImage,
    selectedIconId,
    logoShape,
    logoSize,
    bgImage,
    bgOpacity,
    bgBlur,
  } = params;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dim = RATIO_DIMENSIONS[aspectRatio];
  const width = dim.width;
  const height = dim.height;

  // 設定畫布尺寸
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const isDark = themeMode === 'dark';
  const bgColor1 = isDark ? color1 : (lightColor1 || '#f8fafc');
  const bgColor2 = isDark ? color2 : (lightColor2 || '#e2e8f0');
  const primaryTextColor = isDark ? '#ffffff' : '#0f172a';
  const secondaryTextColor = isDark ? '#94a3b8' : '#475569';
  const glassCardBg = isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';

  // 字型設定
  let fontPrimary = 'system-ui, -apple-system, sans-serif';
  if (fontFamily === 'serif') fontPrimary = '"Georgia", "Noto Serif TC", serif';
  if (fontFamily === 'mono') fontPrimary = '"Fira Code", "Courier New", monospace';
  if (fontFamily === 'display') fontPrimary = '"Impact", "Arial Black", sans-serif';

  // 1. 繪製底層漸層背景
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, bgColor1);
  bgGrad.addColorStop(1, bgColor2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 繪製背景裝飾（網格 / 光流 / 飾條）
  if (template === 'minimal') {
    // 極簡細微網格
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (template === 'gradient') {
    // 氛圍光流球
    const glow1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 20, width * 0.8, height * 0.2, width * 0.5);
    glow1.addColorStop(0, accentColor + (isDark ? '66' : '33'));
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 30, width * 0.15, height * 0.85, width * 0.4);
    glow2.addColorStop(0, (isDark ? '#3b82f6' : '#60a5fa') + (isDark ? '44' : '22'));
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);
  } else if (template === 'impact') {
    // 衝擊斜角幾何飾條
    ctx.fillStyle = accentColor + '22';
    ctx.beginPath();
    ctx.moveTo(width * 0.7, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.45);
    ctx.lineTo(width * 0.5, height * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  // 3. 繪製全域背景圖片 (非 split 模式)
  if (enableBgImage && bgImage && template !== 'split') {
    ctx.save();
    ctx.globalAlpha = bgOpacity / 100;
    if (bgBlur > 0) {
      ctx.filter = `blur(${bgBlur}px)`;
    }
    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
    } else {
      drawH = width / imgRatio;
      drawY = (height - drawH) / 2;
    }
    ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // 4. 繪製主卡片毛玻璃外框
  const pad = Math.min(width, height) * 0.06;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;

  if (template === 'minimal' || template === 'gradient') {
    drawRoundedRect(ctx, pad, pad, cardW, cardH, 24);
    ctx.fillStyle = glassCardBg;
    ctx.fill();
    ctx.strokeStyle = glassBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 頂部漸層光暈細線
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pad + 24, pad);
    ctx.lineTo(pad + cardW - 24, pad);
    const lineGrad = ctx.createLinearGradient(pad, pad, pad + cardW, pad);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.3, accentColor);
    lineGrad.addColorStop(0.7, accentColor);
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else if (template === 'impact') {
    drawRoundedRect(ctx, pad, pad, cardW, cardH, 20);
    ctx.fillStyle = glassCardBg;
    ctx.fill();
    ctx.strokeStyle = glassBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 左側醒目垂直強調柱
    drawRoundedRect(ctx, pad, pad, 14, cardH, 6);
    ctx.fillStyle = accentColor;
    ctx.fill();
  }

  // 5. 繪製各模板內容排版
  const innerPadX = pad + Math.min(width, height) * 0.05;
  const innerPadY = pad + Math.min(width, height) * 0.06;

  if (template === 'split') {
    // === Template: Split Showcase (左文右圖) ===
    const colW = (cardW - 40) * 0.54;
    const imgColW = cardW - colW - 30;
    const imgColX = innerPadX + colW + 20;

    // 左欄文字排版
    let curY = innerPadY;

    // 分類標籤徽章
    if (tag) {
      ctx.font = `700 15px ${fontPrimary}`;
      const tagMetrics = ctx.measureText(tag);
      const tagW = tagMetrics.width + 24;
      drawRoundedRect(ctx, innerPadX, curY, tagW, 32, 8);
      ctx.fillStyle = accentColor + (isDark ? '25' : '20');
      ctx.fill();
      ctx.strokeStyle = accentColor + '60';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.fillText(tag, innerPadX + 12, curY + 21);
      curY += 32 + 32;
    }

    // 主標題
    ctx.fillStyle = primaryTextColor;
    const titleFontSize = height > 800 ? 44 : 38;
    ctx.font = `800 ${titleFontSize}px ${fontPrimary}`;
    const titleLineHeight = titleFontSize * 1.25;
    curY = wrapText(ctx, title, innerPadX, curY + titleFontSize * 0.85, colW, titleLineHeight, 3);

    // 副標題
    if (subtitle) {
      curY += 20;
      ctx.fillStyle = secondaryTextColor;
      const subFontSize = height > 800 ? 20 : 17;
      ctx.font = `400 ${subFontSize}px ${fontPrimary}`;
      curY = wrapText(ctx, subtitle, innerPadX, curY, colW, subFontSize * 1.45, 3);
    }

    // 頁尾 (網址、作者與日期)
    const footerY = pad + cardH - 44;
    ctx.fillStyle = secondaryTextColor;
    ctx.font = `600 16px ${fontPrimary}`;
    ctx.fillText(`${siteName}  •  ${author}  •  ${dateStr}`, innerPadX, footerY);

    // 右欄圖片展示區塊
    const imgH = cardH - 20;
    const imgY = pad + 10;
    drawRoundedRect(ctx, imgColX, imgY, imgColW, imgH, 20);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.strokeStyle = glassBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (enableBgImage && bgImage) {
      ctx.save();
      drawRoundedRect(ctx, imgColX + 2, imgY + 2, imgColW - 4, imgH - 4, 18);
      ctx.clip();
      const imgRatio = bgImage.width / bgImage.height;
      const boxRatio = imgColW / imgH;
      let dw = imgColW;
      let dh = imgH;
      let dx = imgColX;
      let dy = imgY;

      if (imgRatio > boxRatio) {
        dw = imgH * imgRatio;
        dx = imgColX + (imgColW - dw) / 2;
      } else {
        dh = imgColW / imgRatio;
        dy = imgY + (imgH - dh) / 2;
      }
      ctx.drawImage(bgImage, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // 現代風格 UI Mock 占位卡片
      ctx.save();
      const orbGrad = ctx.createRadialGradient(imgColX + imgColW * 0.5, imgY + imgH * 0.4, 10, imgColX + imgColW * 0.5, imgY + imgH * 0.4, imgColW * 0.5);
      orbGrad.addColorStop(0, accentColor + (isDark ? '35' : '20'));
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(imgColX, imgY, imgColW, imgH);

      const mockPad = 32;
      const mockW = imgColW - mockPad * 2;
      const mockH = imgH - mockPad * 2;
      drawRoundedRect(ctx, imgColX + mockPad, imgY + mockPad, mockW, mockH, 14);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 視窗紅黃綠圓點
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(imgColX + mockPad + 20, imgY + mockPad + 22, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(imgColX + mockPad + 36, imgY + mockPad + 22, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(imgColX + mockPad + 52, imgY + mockPad + 22, 5, 0, Math.PI * 2); ctx.fill();

      // 內容模擬線條
      ctx.fillStyle = accentColor + (isDark ? '70' : '60');
      drawRoundedRect(ctx, imgColX + mockPad + 20, imgY + mockPad + 50, mockW * 0.45, 8, 4);
      ctx.fill();

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)';
      drawRoundedRect(ctx, imgColX + mockPad + 20, imgY + mockPad + 74, mockW * 0.72, 6, 3);
      ctx.fill();
      drawRoundedRect(ctx, imgColX + mockPad + 20, imgY + mockPad + 92, mockW * 0.6, 6, 3);
      ctx.fill();
      drawRoundedRect(ctx, imgColX + mockPad + 20, imgY + mockPad + 110, mockW * 0.5, 6, 3);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // === Templates: Minimal, Gradient, Impact ===
    let curY = innerPadY;

    // 1. 頂部標籤與網域
    ctx.save();
    if (tag) {
      ctx.font = `700 15px ${fontPrimary}`;
      const tagMetrics = ctx.measureText(tag);
      const tagW = tagMetrics.width + 24;
      drawRoundedRect(ctx, innerPadX, curY, tagW, 34, 8);
      ctx.fillStyle = accentColor + (isDark ? '25' : '20');
      ctx.fill();
      ctx.strokeStyle = accentColor + '60';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.fillText(tag, innerPadX + 12, curY + 22);
    }

    if (siteName) {
      ctx.font = `600 16px ${fontPrimary}`;
      ctx.fillStyle = secondaryTextColor;
      ctx.textAlign = 'right';
      ctx.fillText(siteName, innerPadX + cardW - Math.min(width, height) * 0.1, curY + 23);
    }
    ctx.restore();

    curY += tag ? 34 + 38 : 10;

    // 2. 主標題
    ctx.fillStyle = primaryTextColor;
    let titleFontSize = height > 800 ? 54 : 46;
    if (template === 'impact') titleFontSize = height > 800 ? 60 : 52;
    ctx.font = `800 ${titleFontSize}px ${fontPrimary}`;

    const titleLineHeight = titleFontSize * 1.25;
    curY = wrapText(ctx, title, innerPadX, curY + titleFontSize * 0.85, cardW - Math.min(width, height) * 0.1, titleLineHeight, 3);

    // 3. 副標題
    if (subtitle) {
      curY += 22;
      ctx.fillStyle = secondaryTextColor;
      const subFontSize = height > 800 ? 22 : 19;
      ctx.font = `400 ${subFontSize}px ${fontPrimary}`;
      curY = wrapText(ctx, subtitle, innerPadX, curY, cardW - Math.min(width, height) * 0.1, subFontSize * 1.45, 3);
    }

    // 4. 底部資訊列 (Logo/頭像 + 作者 + 發布日期) - 提供充足底部安全留白
    const footerY = pad + cardH - Math.max(innerPadY * 0.75, logoSize * 0.5 + 32);
    let textStartX = innerPadX;

    if (enableLogo) {
      const logoX = innerPadX;
      const logoY = footerY - logoSize / 2;

      if (logoImage) {
        ctx.save();
        if (logoShape === 'circle') {
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (logoShape === 'rounded') {
          drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
          ctx.clip();
        }
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } else {
        // 內建向量圖示方塊
        drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
        ctx.fillStyle = accentColor + (isDark ? '33' : '20');
        ctx.fill();
        ctx.strokeStyle = accentColor + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const iconObj = PRESET_ICONS.find((i) => i.id === selectedIconId) || PRESET_ICONS[0];
        ctx.save();
        ctx.translate(logoX + logoSize * 0.2, logoY + logoSize * 0.2);
        const scale = (logoSize * 0.6) / 24;
        ctx.scale(scale, scale);
        ctx.fillStyle = accentColor;
        const path2d = new Path2D(iconObj.path);
        ctx.fill(path2d);
        ctx.restore();
      }
      textStartX = logoX + logoSize + 18;
    }

    // 作者與發布日期
    ctx.fillStyle = primaryTextColor;
    ctx.font = `700 18px ${fontPrimary}`;
    ctx.fillText(author, textStartX, footerY - 4);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = `500 15px ${fontPrimary}`;
    ctx.fillText(dateStr, textStartX, footerY + 18);
  }
}
