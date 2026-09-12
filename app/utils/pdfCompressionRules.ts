/**
 * PDF 內嵌圖片壓縮決策純函數（無 UI / 無 PDF.js / pdf-lib 依賴、可獨立單元測試）。
 *
 * 從 `pdfHelper.ts` 抽離：pdfHelper.ts 其餘函式重度依賴瀏覽器 Canvas 與
 * pdfjs-dist/pdf-lib 實際解析出的物件，此專案未引入 jsdom/canvas 測試替身，
 * 無法在 Node 環境下有意義地單元測試；但「哪些圖片該被判定為受保護、
 * 該降採樣到多大」這類決策邏輯本身是純數學/字串判斷，值得獨立拆出驗證。
 */

export type ImageCompressStatus = 'compressible' | 'protected';

export interface ImageClassifyInput {
  smask: boolean;
  imageMask: boolean;
  colorSpace: string;
  decode: boolean;
}

export interface ImageClassifyResult {
  status: ImageCompressStatus;
  statusReason: string;
}

// 判斷單張內嵌圖片是否可安全降採樣壓縮，或應保護原樣（半透明遮罩/特殊色彩空間/Decode 轉置）
export function classifyImageCompressibility(input: ImageClassifyInput): ImageClassifyResult {
  if (input.smask || input.imageMask) {
    return { status: 'protected', statusReason: '保護: 半透明水印 / 印章遮罩' };
  }
  if (
    input.colorSpace.includes('CMYK') ||
    input.colorSpace.includes('Separation') ||
    input.colorSpace.includes('DeviceN')
  ) {
    return { status: 'protected', statusReason: '保護: 特殊色彩空間 (CMYK)' };
  }
  if (input.decode) {
    return { status: 'protected', statusReason: '保護: Decode 轉置' };
  }
  return { status: 'compressible', statusReason: '可深度降採樣壓縮' };
}

// 依目標 DPI 決定內嵌圖片的降採樣縮放係數
export function getDownsampleScaleFactor(maxDpi: number): number {
  if (maxDpi <= 96) return 0.45;
  if (maxDpi <= 144) return 0.65;
  return 0.85;
}

// 依可壓縮圖片位元組數估算壓縮後可省下的檔案體積百分比（夾在 10%~85% 之間，避免預估數字失真）
export function estimateCompressionRatio(
  originalSize: number,
  compressibleCount: number,
  totalImageBytes: number
): number {
  if (originalSize <= 0 || compressibleCount <= 0) return 0;
  const estSaved = totalImageBytes * 0.55;
  return Math.min(85, Math.max(10, Math.round((estSaved / originalSize) * 100)));
}
