import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NETWORK_SPECS,
  SANDBOX_CARDS,
  computeLuhnBreakdown,
  computeLuhnCheckDigit,
  formatCardNumber,
  detectCardNetwork,
  generateTestCard,
  generateTestCardBatch,
  validateCardNumber,
  validateCardBatch,
  formatCardBatchExport,
} from '../../app/credit-card-generator/engine.ts';

test('6 大發卡組織設定與所有內建沙盒測試卡號皆通過 Luhn 驗證', () => {
  assert.equal(NETWORK_SPECS.length, 6);
  for (const card of SANDBOX_CARDS) {
    const res = validateCardNumber(card.number);
    assert.equal(res.valid, true, `Sandbox card ${card.number} should be valid`);
    assert.equal(res.network, card.network);
  }
});

test('generateTestCard 針對 6 大發卡組織皆產出符合長度、前綴與 Luhn 檢核之測試卡號', () => {
  for (const spec of NETWORK_SPECS) {
    for (let i = 0; i < 10; i++) {
      const item = generateTestCard({ networks: [spec.id] });
      assert.equal(item.network, spec.id);
      assert.equal(item.number.length, spec.length);
      assert.equal(item.cvv.length, spec.cvvLength);
      assert.equal(spec.matches(item.number), true, `${item.number} should match ${spec.id}`);
      assert.equal(item.luhnSum % 10, 0);

      const check = validateCardNumber(item.formatted);
      assert.equal(check.valid, true);
      assert.equal(check.network, spec.id);
    }
  }
});

test('generateTestCard 支援多選發卡組織與自訂 BIN 前綴', () => {
  const allowed = new Set(['visa', 'jcb']);
  const batch = generateTestCardBatch({ networks: ['visa', 'jcb'] }, 30);
  assert.equal(batch.length, 30);
  for (const item of batch) {
    assert.ok(allowed.has(item.network), `Unexpected network ${item.network}`);
    assert.equal(validateCardNumber(item.number).valid, true);
  }

  // 自訂 BIN (424242)
  const customVisa = generateTestCard({ customBin: '4242-42' });
  assert.ok(customVisa.number.startsWith('424242'));
  assert.equal(customVisa.network, 'visa');
  assert.equal(customVisa.number.length, 16);
  assert.equal(validateCardNumber(customVisa.number).valid, true);

  // 自訂非標準組織 BIN (987654)
  const customUnknown = generateTestCard({ customBin: '987654' });
  assert.ok(customUnknown.number.startsWith('987654'));
  assert.equal(customUnknown.network, 'custom');
  assert.equal(validateCardNumber(customUnknown.number).valid, true);
});

test('validateCardNumber 正確攔截非法格式、長度與錯誤 Luhn 檢查碼', () => {
  assert.equal(validateCardNumber('').errorCode, 'EMPTY');
  assert.equal(validateCardNumber('4242-ABCD-4242-4242').errorCode, 'NON_NUMERIC');
  assert.equal(validateCardNumber('424242').errorCode, 'INVALID_LENGTH');
  assert.equal(validateCardNumber('42424242424242421234').errorCode, 'INVALID_LENGTH');

  // 故意改錯最後一碼（正確為 2）
  const bad = validateCardNumber('4242 4242 4242 4243');
  assert.equal(bad.valid, false);
  assert.equal(bad.errorCode, 'INVALID_CHECKSUM');
  assert.equal(bad.expectedCheckDigit, 2);
  assert.equal(bad.network, 'visa');
});

test('formatCardNumber 區分 Amex (4-6-5) 與一般卡別 (4-4-4-4)', () => {
  assert.equal(formatCardNumber('378282246310005', 'amex'), '3782 822463 10005');
  assert.equal(formatCardNumber('4242424242424242', 'visa'), '4242 4242 4242 4242');
  assert.equal(detectCardNetwork('3528000000000007')?.id, 'jcb');
});

test('validateCardBatch 與 formatCardBatchExport 正常運作', () => {
  const results = validateCardBatch('4242 4242 4242 4242\n3782-822463-10005\n4242424242424240\n');
  assert.equal(results.length, 3);
  assert.equal(results[0].valid, true);
  assert.equal(results[1].valid, true);
  assert.equal(results[2].valid, false);

  const batch = generateTestCardBatch({ networks: ['visa'] }, 2);
  const txt = formatCardBatchExport(batch, 'txt', { lang: 'zh-TW', includeSpaces: true, includeMeta: true });
  assert.equal(txt.split('\n').length, 2);
  assert.ok(txt.includes('|'));

  const csvZh = formatCardBatchExport(batch, 'csv', { lang: 'zh-TW', includeSpaces: false, includeMeta: true });
  assert.ok(csvZh.startsWith('測試卡號,發卡組織,模擬效期,模擬安全碼,備註\n'));
  assert.ok(csvZh.includes('非實際可用卡片'));

  const json = JSON.parse(
    formatCardBatchExport(batch, 'json', { lang: 'en', includeSpaces: false, includeMeta: false })
  );
  assert.equal(json.length, 2);
  assert.equal(json[0].testOnly, true);
});

test('computeLuhnCheckDigit 與 computeLuhnBreakdown 邊界檢查', () => {
  assert.throws(() => computeLuhnCheckDigit('abc'), RangeError);
  const { luhnSum } = computeLuhnBreakdown('4242424242424242');
  assert.equal(luhnSum % 10, 0);
});
