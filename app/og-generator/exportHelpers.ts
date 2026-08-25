import { RATIO_DIMENSIONS } from './constants';
import { renderCanvas } from './canvasRenderer';
import { DrawCanvasParams, ExportFormat } from './types';

/**
 * 取得匯出用的 Canvas 實例 (支援 2x 視網膜超採樣)
 */
export function getExportCanvas(params: DrawCanvasParams, supersample: boolean = true): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return params.canvas;
  }

  const dim = RATIO_DIMENSIONS[params.aspectRatio];
  const scale = supersample ? 2 : 1;

  if (!supersample && params.canvas) {
    return params.canvas;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = dim.width * scale;
  exportCanvas.height = dim.height * scale;

  const ctx = exportCanvas.getContext('2d');
  if (ctx && scale !== 1) {
    ctx.scale(scale, scale);
  }

  renderCanvas({
    ...params,
    canvas: exportCanvas,
  });

  return exportCanvas;
}

/**
 * 匯出圖片檔案 (PNG / JPEG / WebP / SVG)
 */
export function exportImage(
  params: DrawCanvasParams,
  format: ExportFormat,
  supersample: boolean = true
): void {
  if (typeof window === 'undefined') return;

  const exportCanvas = getExportCanvas(params, supersample);
  const dim = RATIO_DIMENSIONS[params.aspectRatio];

  if (format === 'svg') {
    const dataUrl = exportCanvas.toDataURL('image/png');
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.width}" height="${dim.height}" viewBox="0 0 ${dim.width} ${dim.height}"><image href="${dataUrl}" width="${dim.width}" height="${dim.height}" /></svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `og-image-${params.aspectRatio}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const quality = format === 'jpeg' ? 0.92 : 0.95;
    const dataUrl = exportCanvas.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `og-image-${params.aspectRatio}.${format === 'jpeg' ? 'jpg' : format}`;
    a.click();
  }
}

/**
 * 複製 Canvas 影像到系統剪貼簿 (PNG 格式)
 */
export async function copyCanvasToClipboard(
  params: DrawCanvasParams,
  supersample: boolean = true
): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;

  const exportCanvas = getExportCanvas(params, supersample);

  return new Promise((resolve) => {
    exportCanvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        resolve(true);
      } catch (err) {
        console.error('Clipboard copy error:', err);
        resolve(false);
      }
    }, 'image/png');
  });
}
