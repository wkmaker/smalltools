/**
 * 影像批次縮放尺寸計算引擎（無 UI 依賴、可獨立單元測試）。
 *
 * 從 `ImageProcessorClient.tsx` 抽離：依「指定寬高 / 鎖定長寬比單邊輸入 /
 * 百分比縮放」三種模式，算出最終輸出像素尺寸的純函數。
 */
export interface BatchDimensions {
  w: number;
  h: number;
}

export function calculateBatchDimensions(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
  scalePct: number,
  keepAspectRatio: boolean
): BatchDimensions {
  if (targetW > 0 && targetH > 0) {
    return { w: targetW, h: targetH };
  }
  if (targetW > 0 && keepAspectRatio && imgW > 0) {
    return { w: targetW, h: Math.max(1, Math.round((targetW / imgW) * imgH)) };
  }
  if (targetH > 0 && keepAspectRatio && imgH > 0) {
    return { w: Math.max(1, Math.round((targetH / imgH) * imgW)), h: targetH };
  }
  return {
    w: Math.max(1, Math.round((imgW * scalePct) / 100)),
    h: Math.max(1, Math.round((imgH * scalePct) / 100)),
  };
}
