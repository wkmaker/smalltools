import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyImageCompressibility,
  getDownsampleScaleFactor,
  estimateCompressionRatio,
} from '../../app/utils/pdfCompressionRules.ts';

test('classifyImageCompressibility：半透明水印/印章遮罩一律保護不壓縮', () => {
  const r = classifyImageCompressibility({ smask: true, imageMask: false, colorSpace: 'RGB', decode: false });
  assert.equal(r.status, 'protected');
  assert.match(r.statusReason, /半透明水印/);
});

test('classifyImageCompressibility：CMYK / Separation / DeviceN 特殊色彩空間受保護', () => {
  assert.equal(classifyImageCompressibility({ smask: false, imageMask: false, colorSpace: 'DeviceCMYK', decode: false }).status, 'protected');
  assert.equal(classifyImageCompressibility({ smask: false, imageMask: false, colorSpace: 'Separation', decode: false }).status, 'protected');
  assert.equal(classifyImageCompressibility({ smask: false, imageMask: false, colorSpace: 'DeviceN', decode: false }).status, 'protected');
});

test('classifyImageCompressibility：一般 RGB 圖片無特殊屬性時可壓縮', () => {
  const r = classifyImageCompressibility({ smask: false, imageMask: false, colorSpace: 'RGB', decode: false });
  assert.equal(r.status, 'compressible');
});

test('getDownsampleScaleFactor：DPI 級距對應正確的縮放係數', () => {
  assert.equal(getDownsampleScaleFactor(72), 0.45);
  assert.equal(getDownsampleScaleFactor(96), 0.45);
  assert.equal(getDownsampleScaleFactor(120), 0.65);
  assert.equal(getDownsampleScaleFactor(144), 0.65);
  assert.equal(getDownsampleScaleFactor(200), 0.85);
});

test('estimateCompressionRatio：無可壓縮圖片或原檔大小為 0 時回傳 0', () => {
  assert.equal(estimateCompressionRatio(0, 5, 1000), 0);
  assert.equal(estimateCompressionRatio(1000, 0, 1000), 0);
});

test('estimateCompressionRatio：估算結果夾在 10%~85% 之間避免失真', () => {
  // 圖片幾乎等於原檔大小 -> 理論上可省很多，但夾在 85% 上限
  assert.equal(estimateCompressionRatio(1000, 1, 1000), 55);
  // 圖片佔比極小 -> 夾在 10% 下限，不會顯示 0% 誤導使用者「無效果」
  assert.equal(estimateCompressionRatio(1_000_000, 1, 100), 10);
});
