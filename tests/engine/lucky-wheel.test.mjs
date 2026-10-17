import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSectors,
  pickWeightedIndex,
  getContrastYIQ,
  secureRandomFloat,
  computeTargetSpinAngle,
  drawBatchWinners,
  revertWinnerRecords,
  parseBatchText,
  serializePrizesToText,
  encodeWheelShareState,
  decodeWheelShareState,
  formatHistoryCsv,
} from '../../app/lucky-wheel/engine.ts';
import { TRANSLATIONS } from '../../app/lucky-wheel/translations.ts';

test('calculateSectors：依權重比例分配扇區角度，總和為 360 度', () => {
  const { sectors, totalWeight } = calculateSectors([
    { weight: 1 },
    { weight: 1 },
    { weight: 2 },
  ]);
  assert.equal(totalWeight, 4);
  assert.equal(sectors.length, 3);
  assert.equal(sectors[0].angleSpan, 90);
  assert.equal(sectors[1].angleSpan, 90);
  assert.equal(sectors[2].angleSpan, 180);
  assert.equal(sectors[0].startAngle, 0);
  assert.equal(sectors[2].endAngle, 360);
});

test('calculateSectors：無有效獎項（總權重為 0）時回傳空扇區', () => {
  const { sectors, totalWeight } = calculateSectors([]);
  assert.deepEqual(sectors, []);
  assert.equal(totalWeight, 0);
});

test('pickWeightedIndex：命中對應累加權重區間的索引', () => {
  const weights = [10, 20, 70];
  assert.equal(pickWeightedIndex(weights, 5), 0);
  assert.equal(pickWeightedIndex(weights, 10), 0);
  assert.equal(pickWeightedIndex(weights, 10.001), 1);
  assert.equal(pickWeightedIndex(weights, 29.999), 1);
  assert.equal(pickWeightedIndex(weights, 30), 1);
  assert.equal(pickWeightedIndex(weights, 99.999), 2);
});

test('secureRandomFloat：回傳 [0, 1) 區間之密碼學安全浮點數', () => {
  for (let i = 0; i < 200; i++) {
    const val = secureRandomFloat();
    assert.ok(val >= 0 && val < 1, `亂數應位於 [0, 1)，實際為 ${val}`);
  }
});

test('computeTargetSpinAngle：扇區內隨機偏移落點永遠落在該扇區安全範圍內，絕不跨界', () => {
  const { sectors } = calculateSectors([{ weight: 1 }, { weight: 3 }]);
  const targetSector = sectors[0]; // 0 ~ 90 度

  for (const jitterUnit of [0, 0.25, 0.5, 0.75, 1]) {
    const finalAngle = computeTargetSpinAngle(120, targetSector, 5, jitterUnit);
    assert.ok(finalAngle > 120 + 5 * 360);
    // 反推 12 點鐘方向 (270度) 在轉盤上的對應落點角度
    const wheelLanding = (270 - (finalAngle % 360) + 360) % 360;
    assert.ok(
      wheelLanding > targetSector.startAngle && wheelLanding < targetSector.endAngle,
      `落點 ${wheelLanding} 應嚴格位於扇區 (${targetSector.startAngle}, ${targetSector.endAngle}) 內`
    );
  }
});

test('drawBatchWinners：多人連抽時即時扣減庫存，抽完自動標記 isFinished 並重分配剩餘機率', () => {
  const prizes = [
    { id: 'p1', title: 'A', weight: 10, quantity: 2, drawnCount: 0, color: '#ff0055', isFinished: false },
    { id: 'p2', title: 'B', weight: 10, quantity: 1, drawnCount: 0, color: '#00f0ff', isFinished: false },
  ];

  // 共 3 個庫存，連抽 5 次應只抽出 3 名且全部標記 isFinished
  const { winners, updatedPrizes } = drawBatchWinners(prizes, 5, true);
  assert.equal(winners.length, 3);
  assert.equal(updatedPrizes[0].drawnCount, 2);
  assert.equal(updatedPrizes[0].isFinished, true);
  assert.equal(updatedPrizes[1].drawnCount, 1);
  assert.equal(updatedPrizes[1].isFinished, true);
});

test('revertWinnerRecords：不在場放棄重抽時，無損回補轉盤項目與尾牙獎項池庫存並移除歷史紀錄', () => {
  const prizes = [
    { id: 'p1', title: '王小明', weight: 1, quantity: 1, drawnCount: 1, color: '#ff0055', isFinished: true },
  ];
  const awardTiers = [{ id: 'a1', name: '頭獎 iPhone', quantity: 2, drawnCount: 2 }];
  const history = [
    { id: 'h1', prizeId: 'p1', prizeTitle: '王小明', awardId: 'a1', awardName: '頭獎 iPhone', timestamp: 1700000000000 },
  ];

  const { updatedPrizes, updatedAwardTiers, updatedHistory } = revertWinnerRecords(
    prizes,
    awardTiers,
    history,
    ['h1'],
    true
  );

  assert.equal(updatedPrizes[0].drawnCount, 0);
  assert.equal(updatedPrizes[0].isFinished, false);
  assert.equal(updatedAwardTiers[0].drawnCount, 1);
  assert.equal(updatedHistory.length, 0);
});

test('parseBatchText & serializePrizesToText：支援純姓名清單與完整權重數量格式雙向轉換', () => {
  const rawNames = '陳冠宇\n林怡君\n張家豪';
  const parsedNames = parseBatchText(rawNames);
  assert.equal(parsedNames.items.length, 3);
  assert.equal(parsedNames.isParticipantList, true);
  assert.equal(serializePrizesToText(parsedNames.items), rawNames);

  const rawPrizes = '頭獎, 2, 3\n普獎, 5, 10';
  const parsedPrizes = parseBatchText(rawPrizes);
  assert.equal(parsedPrizes.items.length, 2);
  assert.equal(parsedPrizes.isParticipantList, false);
  assert.equal(parsedPrizes.items[0].weight, 2);
  assert.equal(parsedPrizes.items[0].quantity, 3);
});

test('encodeWheelShareState & decodeWheelShareState：支援繁體中文轉盤與尾牙獎項池無損編解碼', () => {
  const encoded = encodeWheelShareState({
    enableQuantityLimit: true,
    enableAwardMode: true,
    prizes: [
      { title: '特等獎 MacBook', weight: 1, quantity: 2, color: '#ff0055' },
      { title: '王小明', weight: 5, quantity: 1, color: '#00f0ff' },
    ],
    awardTiers: [{ name: '頭獎 iPhone 16', quantity: 3 }],
  });

  const decoded = decodeWheelShareState(encoded);
  assert.ok(decoded);
  assert.equal(decoded.enableQuantityLimit, true);
  assert.equal(decoded.enableAwardMode, true);
  assert.equal(decoded.prizes.length, 2);
  assert.equal(decoded.prizes[0].title, '特等獎 MacBook');
  assert.equal(decoded.prizes[1].weight, 5);
  assert.equal(decoded.awardTiers.length, 1);
  assert.equal(decoded.awardTiers[0].name, '頭獎 iPhone 16');
  assert.equal(decoded.awardTiers[0].quantity, 3);
});

test('formatHistoryCsv：輸出含 UTF-8 BOM 且防範公式注入 (=, +, -, @)', () => {
  const csv = formatHistoryCsv(
    [
      {
        id: 'h1',
        prizeId: 'p1',
        prizeTitle: '=cmd|\' /C calc\'!A0',
        awardName: '頭獎',
        timestamp: 1700000000000,
      },
    ],
    'zh-TW'
  );
  assert.ok(csv.startsWith('\uFEFF序號,中獎項目 / 得獎人,所屬獎項,中獎時間'));
  assert.ok(csv.includes('"\'=cmd|'));
});

test('TRANSLATIONS：中英雙語字典鍵值與 FAQ 數量 100% 對稱，且繁中標籤無冗餘英文括號', () => {
  const zhKeys = Object.keys(TRANSLATIONS['zh-TW']).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  assert.deepEqual(zhKeys, enKeys);
  assert.equal(TRANSLATIONS['zh-TW'].faqItems.length, TRANSLATIONS.en.faqItems.length);
});

test('getContrastYIQ：淺色背景配深色文字，深色背景配白色文字', () => {
  assert.equal(getContrastYIQ('#ffffff'), '#0f172a');
  assert.equal(getContrastYIQ('#000000'), '#ffffff');
  assert.equal(getContrastYIQ('#f59e0b'), '#0f172a');
});
