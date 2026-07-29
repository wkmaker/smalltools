/**
 * PDF Image-Only Compressor - Web Worker
 * 處理 PDF 圖片解碼、結構預檢 (Inspection)、降採樣、JPEG 重編碼與 PDF 物件原位 (In-Place) 替換
 */

// 載入核心依賴庫
importScripts(
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
);

if (self.pdfjsLib) {
  self.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

// 監聽來自 UI 主執行緒的指令
self.onmessage = async (e) => {
  const { type, fileId, pdfBuffer, config } = e.data;
  if (type === 'inspect') {
    try {
      await inspectPdf(fileId, pdfBuffer);
    } catch (err) {
      console.error('Worker 預檢失敗:', err);
      self.postMessage({ type: 'inspect_error', fileId, message: err.message || 'PDF 結構預檢失敗' });
    }
  } else if (type === 'compress') {
    try {
      await processPdf(fileId, pdfBuffer, config);
    } catch (err) {
      console.error('Worker 壓縮失敗:', err);
      self.postMessage({ type: 'error', fileId, message: err.message || 'PDF 壓縮處理過程中發生未知錯誤' });
    }
  }
};

/**
 * 快速結構預檢流程 (<100ms)
 */
async function inspectPdf(fileId, pdfBuffer) {
  const originalSize = pdfBuffer.byteLength;
  const pdfDoc = await self.PDFLib.PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const indirectObjects = pdfDoc.context.enumerateIndirectObjects();

  const imagesInfo = [];
  let compressibleCount = 0;
  let protectedCount = 0;
  let totalImageBytes = 0;

  for (const [ref, pdfObject] of indirectObjects) {
    if (pdfObject instanceof self.PDFLib.PDFRawStream || pdfObject instanceof self.PDFLib.PDFStream) {
      const dict = pdfObject.dict;
      if (!dict) continue;
      const subtype = dict.get(self.PDFLib.PDFName.of('Subtype'));
      if (subtype === self.PDFLib.PDFName.of('Image')) {
        const width = dict.get(self.PDFLib.PDFName.of('Width'))?.asNumber() || 0;
        const height = dict.get(self.PDFLib.PDFName.of('Height'))?.asNumber() || 0;
        const filter = dict.get(self.PDFLib.PDFName.of('Filter'))?.toString() || 'Raw';
        const colorSpace = dict.get(self.PDFLib.PDFName.of('ColorSpace'))?.toString() || 'RGB';
        const smask = !!dict.get(self.PDFLib.PDFName.of('SMask'));
        const imageMask = dict.get(self.PDFLib.PDFName.of('ImageMask'))?.asBoolean?.() || false;
        const decode = !!dict.get(self.PDFLib.PDFName.of('Decode'));

        const byteLen = pdfObject.contents ? pdfObject.contents.byteLength : 0;
        totalImageBytes += byteLen;

        let status = 'compressible';
        let statusReason = '可深度降採樣壓縮';

        if (smask || imageMask) {
          status = 'protected';
          statusReason = '保護: 半透明水印 / 印章遮罩';
          protectedCount++;
        } else if (colorSpace.includes('CMYK') || colorSpace.includes('Separation') || colorSpace.includes('DeviceN')) {
          status = 'protected';
          statusReason = '保護: 特殊色彩空間 (CMYK)';
          protectedCount++;
        } else if (decode) {
          status = 'protected';
          statusReason = '保護: Decode 轉置';
          protectedCount++;
        } else {
          compressibleCount++;
        }

        imagesInfo.push({
          ref: ref.toString(),
          width,
          height,
          filter: filter.replace(/^\//, ''),
          colorSpace: colorSpace.replace(/^\//, ''),
          byteLen,
          status,
          statusReason
        });
      }
    }
  }

  // 計算預估瘦身率
  let estRatio = 0;
  if (originalSize > 0 && compressibleCount > 0) {
    const estSaved = totalImageBytes * 0.6; // 平均可節省 ~60% 點陣圖片體積
    estRatio = Math.min(85, Math.max(10, Math.round((estSaved / originalSize) * 100)));
  }

  self.postMessage({
    type: 'inspect_result',
    fileId,
    originalSize,
    totalImages: imagesInfo.length,
    compressibleCount,
    protectedCount,
    estRatio,
    images: imagesInfo
  });
}

/**
 * 核心圖片深度壓縮流程
 */
async function processPdf(fileId, pdfBuffer, config) {
  const { quality = 0.65, scale = 0.8, maxDpi = 144 } = config;
  const originalSize = pdfBuffer.byteLength;

  self.postMessage({ type: 'progress', fileId, step: 'parse', message: '正在解析 PDF 文件結構與物件樹...' });

  // 1. 載入 PDF 文件
  const pdfDoc = await self.PDFLib.PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const indirectObjects = pdfDoc.context.enumerateIndirectObjects();

  // 2. 收集所有 Subtype === 'Image' 的物件 Reference
  const imageItems = [];
  for (const [ref, pdfObject] of indirectObjects) {
    if (pdfObject instanceof self.PDFLib.PDFRawStream || pdfObject instanceof self.PDFLib.PDFStream) {
      const dict = pdfObject.dict;
      if (!dict) continue;
      const subtype = dict.get(self.PDFLib.PDFName.of('Subtype'));
      if (subtype === self.PDFLib.PDFName.of('Image')) {
        imageItems.push({ ref, pdfObject, dict });
      }
    }
  }

  const totalImages = imageItems.length;

  // 無圖片 PDF 特殊處理
  if (totalImages === 0) {
    self.postMessage({
      type: 'complete',
      fileId,
      pdfBuffer: pdfBuffer,
      originalSize,
      compressedSize: originalSize,
      totalImages: 0,
      compressedCount: 0,
      skippedCount: 0,
      noImages: true,
      imageDetails: []
    });
    return;
  }

  self.postMessage({
    type: 'progress',
    fileId,
    step: 'start_images',
    message: `找到 ${totalImages} 張內嵌圖片，開始執行深度壓縮...`,
    totalImages,
    current: 0
  });

  let compressedCount = 0;
  let skippedCount = 0;
  const imageDetails = [];

  // 3. 逐一壓縮點陣圖片 (採用安全的原位 In-Place 內容與字典替換)
  for (let i = 0; i < totalImages; i++) {
    const item = imageItems[i];
    const currentNum = i + 1;

    const origW = item.dict.get(self.PDFLib.PDFName.of('Width'))?.asNumber() || 0;
    const origH = item.dict.get(self.PDFLib.PDFName.of('Height'))?.asNumber() || 0;

    self.postMessage({
      type: 'progress',
      fileId,
      step: 'processing_image',
      message: `正在重構與壓縮圖片物件 (${currentNum}/${totalImages})...`,
      totalImages,
      current: currentNum
    });

    // 關鍵保護 1: 檢查 Soft Mask (透明遮罩) 或 ImageMask (單色水印/印章)
    const smask = item.dict.get(self.PDFLib.PDFName.of('SMask'));
    const imageMask = item.dict.get(self.PDFLib.PDFName.of('ImageMask'));
    if (smask || (imageMask && imageMask.asBoolean && imageMask.asBoolean() === true)) {
      skippedCount++;
      imageDetails.push({ ref: item.ref.toString(), width: origW, height: origH, status: 'protected', action: '保護半透明水印/印章' });
      continue;
    }

    // 關鍵保護 2: 檢查特殊色彩空間 (CMYK / Separation / DeviceN)
    const colorSpace = item.dict.get(self.PDFLib.PDFName.of('ColorSpace'));
    if (colorSpace) {
      const csStr = colorSpace.toString();
      if (csStr.includes('CMYK') || csStr.includes('Separation') || csStr.includes('DeviceN')) {
        skippedCount++;
        imageDetails.push({ ref: item.ref.toString(), width: origW, height: origH, status: 'protected', action: '保護 CMYK 特殊色彩' });
        continue;
      }
    }

    // 關鍵保護 3: 檢查 Decode 轉置陣列
    const decode = item.dict.get(self.PDFLib.PDFName.of('Decode'));
    if (decode) {
      skippedCount++;
      imageDetails.push({ ref: item.ref.toString(), width: origW, height: origH, status: 'protected', action: '保護 Decode 轉置' });
      continue;
    }

    try {
      const originalLen = item.pdfObject.contents ? item.pdfObject.contents.byteLength : 0;
      const res = await compressSingleImageItem(item, { quality, scale, maxDpi });

      if (res && res.resultBytes && res.resultBytes.byteLength > 0 && (originalLen === 0 || res.resultBytes.byteLength < originalLen)) {
        const { resultBytes, finalW, finalH } = res;

        // 原位 In-Place 更新 RawStream 的內容與 Dictionary
        item.pdfObject.contents = resultBytes;

        item.dict.set(self.PDFLib.PDFName.of('Filter'), self.PDFLib.PDFName.of('DCTDecode'));
        item.dict.set(self.PDFLib.PDFName.of('Width'), self.PDFLib.PDFNumber.of(finalW));
        item.dict.set(self.PDFLib.PDFName.of('Height'), self.PDFLib.PDFNumber.of(finalH));
        item.dict.set(self.PDFLib.PDFName.of('ColorSpace'), self.PDFLib.PDFName.of('DeviceRGB'));
        item.dict.set(self.PDFLib.PDFName.of('BitsPerComponent'), self.PDFLib.PDFNumber.of(8));
        item.dict.set(self.PDFLib.PDFName.of('Length'), self.PDFLib.PDFNumber.of(resultBytes.byteLength));

        item.dict.delete(self.PDFLib.PDFName.of('DecodeParms'));

        compressedCount++;
        imageDetails.push({
          ref: item.ref.toString(),
          origWidth: origW,
          origHeight: origH,
          finalWidth: finalW,
          finalHeight: finalH,
          origBytes: originalLen,
          newBytes: resultBytes.byteLength,
          status: 'compressed',
          action: `壓縮成功 (${origW}x${origH} ➔ ${finalW}x${finalH})`
        });
      } else {
        skippedCount++;
        imageDetails.push({ ref: item.ref.toString(), width: origW, height: origH, status: 'skipped', action: '無優化效益，維持原樣' });
      }
    } catch (err) {
      console.warn(`圖片 ${currentNum} 處理失敗，跳過並保持原樣:`, err);
      skippedCount++;
      imageDetails.push({ ref: item.ref.toString(), width: origW, height: origH, status: 'error', action: '解碼異常，維持原樣' });
    }
  }

  self.postMessage({ type: 'progress', fileId, step: 'saving', message: '正在重新建構與優化 PDF 二進位檔案...' });

  // 4. 重構 PDF
  const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: false });

  self.postMessage({
    type: 'complete',
    fileId,
    pdfBuffer: compressedPdfBytes.buffer,
    originalSize,
    compressedSize: compressedPdfBytes.byteLength,
    totalImages,
    compressedCount,
    skippedCount,
    noImages: false,
    imageDetails
  });
}

/**
 * 壓縮單張 PDF 圖片物件
 */
async function compressSingleImageItem(item, config) {
  const { pdfObject, dict } = item;
  const rawBytes = pdfObject.contents;
  if (!rawBytes || rawBytes.length === 0) return null;

  const origW = dict.get(self.PDFLib.PDFName.of('Width'))?.asNumber() || 0;
  const origH = dict.get(self.PDFLib.PDFName.of('Height'))?.asNumber() || 0;

  let imgBitmap = null;

  try {
    const blob = new Blob([rawBytes]);
    imgBitmap = await createImageBitmap(blob);
  } catch (e) {
    imgBitmap = await tryDecompressFlateImage(rawBytes, origW, origH, dict);
  }

  if (!imgBitmap) return null;

  const actualW = imgBitmap.width || origW;
  const actualH = imgBitmap.height || origH;

  const { width: finalW, height: finalH } = calculateTargetSize(actualW, actualH, config.scale, config.maxDpi);

  const canvas = new OffscreenCanvas(finalW, finalH);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, finalW, finalH);
  ctx.drawImage(imgBitmap, 0, 0, finalW, finalH);

  if (typeof imgBitmap.close === 'function') {
    imgBitmap.close();
  }

  const compressedBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: config.quality
  });

  canvas.width = 0;
  canvas.height = 0;

  const arrayBuf = await compressedBlob.arrayBuffer();
  return {
    resultBytes: new Uint8Array(arrayBuf),
    finalW,
    finalH
  };
}

/**
 * 依設定計算目標圖片尺寸 (DPI Limit & Scale)
 */
function calculateTargetSize(w, h, scaleRatio, maxDpi) {
  if (w <= 0 || h <= 0) return { width: 100, height: 100 };

  let targetW = w * scaleRatio;
  let targetH = h * scaleRatio;

  let maxDim = 4000;
  if (maxDpi <= 96) maxDim = 960;
  else if (maxDpi <= 144) maxDim = 1440;
  else if (maxDpi <= 200) maxDim = 2000;
  else if (maxDpi <= 300) maxDim = 3000;

  const currentMax = Math.max(targetW, targetH);
  if (currentMax > maxDim) {
    const factor = maxDim / currentMax;
    targetW *= factor;
    targetH *= factor;
  }

  return {
    width: Math.max(1, Math.round(targetW)),
    height: Math.max(1, Math.round(targetH))
  };
}

/**
 * 容錯處理：解壓 FlateDecode Uncompressed 原始像素
 */
async function tryDecompressFlateImage(rawBytes, w, h, dict) {
  if (w <= 0 || h <= 0) return null;

  try {
    let decompressed = null;
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(rawBytes);
        writer.close();
        const response = new Response(ds.readable);
        const buffer = await response.arrayBuffer();
        decompressed = new Uint8Array(buffer);
      } catch (err) {}
    }

    if (!decompressed) return null;

    const totalPixels = w * h;
    const rgba = new Uint8ClampedArray(totalPixels * 4);

    if (decompressed.length === totalPixels * 3) {
      for (let i = 0; i < totalPixels; i++) {
        rgba[i * 4] = decompressed[i * 3];
        rgba[i * 4 + 1] = decompressed[i * 3 + 1];
        rgba[i * 4 + 2] = decompressed[i * 3 + 2];
        rgba[i * 4 + 3] = 255;
      }
    } else if (decompressed.length === totalPixels * 4) {
      rgba.set(decompressed);
    } else if (decompressed.length === totalPixels) {
      for (let i = 0; i < totalPixels; i++) {
        const g = decompressed[i];
        rgba[i * 4] = g;
        rgba[i * 4 + 1] = g;
        rgba[i * 4 + 2] = g;
        rgba[i * 4 + 3] = 255;
      }
    } else {
      return null;
    }

    const imgData = new ImageData(rgba, w, h);
    return await createImageBitmap(imgData);
  } catch (err) {
    return null;
  }
}
