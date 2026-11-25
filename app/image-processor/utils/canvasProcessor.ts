export const safeLoadImage = (src: string, timeoutMs = 10000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('圖片載入逾時'));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('無法載入圖片或圖檔已毀損'));
    };
    img.src = src;
  });
};

export interface CanvasTransformOptions {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

// 核心圖片 Canvas 繪製處理 (含旋轉、翻轉與最大像素安全限制)
export const renderProcessedCanvas = (
  img: HTMLImageElement,
  w: number,
  h: number,
  { rotation, flipH, flipV }: CanvasTransformOptions
): HTMLCanvasElement => {
  const MAX_PIXELS = 16777216; // 16MP 防爆框/溢出防護
  const currentPixels = w * h;
  let finalW = w;
  let finalH = h;
  if (currentPixels > MAX_PIXELS && currentPixels > 0) {
    const ratio = Math.sqrt(MAX_PIXELS / currentPixels);
    finalW = Math.floor(w * ratio);
    finalH = Math.floor(h * ratio);
  }

  const isRotated = rotation === 90 || rotation === 270;
  const canvasW = isRotated ? finalH : finalW;
  const canvasH = isRotated ? finalW : finalH;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, canvasW);
  canvas.height = Math.max(1, canvasH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
  ctx.restore();

  return canvas;
};
