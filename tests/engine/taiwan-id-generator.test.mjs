import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTY_LIST,
  ACTIVE_COUNTIES,
  COUNTY_MAP,
  SIX_MUNICIPALITIES,
  WEIGHTS,
  computeCheckDigit,
  generateTaiwanId,
  generateTaiwanIdBatch,
  validateTaiwanId,
  validateTaiwanIdBatch,
  formatBatchExport,
} from '../../app/taiwan-id-generator/engine.ts';

test('COUNTY_LIST 涵蓋全部 26 個英文字母且特殊代碼 (I/O/W/X/Y/Z) 正確', () => {
  assert.equal(COUNTY_LIST.length, 26);
  assert.equal(ACTIVE_COUNTIES.length, 22);
  assert.equal(COUNTY_MAP.get('A')?.numericValue, 10);
  assert.equal(COUNTY_MAP.get('I')?.numericValue, 34);
  assert.equal(COUNTY_MAP.get('O')?.numericValue, 35);
  assert.equal(COUNTY_MAP.get('W')?.numericValue, 32);
  assert.equal(COUNTY_MAP.get('X')?.numericValue, 30);
  assert.equal(COUNTY_MAP.get('Y')?.numericValue, 31);
  assert.equal(COUNTY_MAP.get('Z')?.numericValue, 33);
  assert.equal(WEIGHTS.length, 11);
});

test('validateTaiwanId 驗證經典官方測試範例（本國人、新式居留證、舊式居留證）', () => {
  const nat = validateTaiwanId('A123456789');
  assert.equal(nat.valid, true);
  assert.equal(nat.type, 'national');
  assert.equal(nat.countyCode, 'A');
  assert.equal(nat.gender, 'male');
  assert.equal(nat.weightedSum, 130);
  assert.equal(nat.remainder, 0);

  // 小寫與前後空白自動正規化
  const natLower = validateTaiwanId('  a123456789  ');
  assert.equal(natLower.valid, true);
  assert.equal(natLower.normalized, 'A123456789');

  // 新式居留證 (2021+)
  const newRes = validateTaiwanId('A800000014');
  assert.equal(newRes.valid, true);
  assert.equal(newRes.type, 'new-resident');
  assert.equal(newRes.gender, 'male');

  // 舊式居留證 (AC12345679 -> sum 110)
  const oldRes = validateTaiwanId('AC12345679');
  assert.equal(oldRes.valid, true);
  assert.equal(oldRes.type, 'old-resident');
  assert.equal(oldRes.gender, 'male');
  assert.equal(oldRes.weightedSum, 110);

  // 舊式居留證女性 (FD00000005 -> F=15 -> 1*1+5*9+3*8+5 = 75? 1+45+24=70 -> check=0)
  const oldResFemale = validateTaiwanId('FD00000000');
  assert.equal(oldResFemale.valid, true);
  assert.equal(oldResFemale.type, 'old-resident');
  assert.equal(oldResFemale.gender, 'female');
});

test('validateTaiwanId 正確攔截各類非法格式與錯誤檢查碼', () => {
  assert.equal(validateTaiwanId('').errorCode, 'EMPTY');
  assert.equal(validateTaiwanId('   ').errorCode, 'EMPTY');
  assert.equal(validateTaiwanId('A12345').errorCode, 'INVALID_LENGTH');
  assert.equal(validateTaiwanId('A1234567890').errorCode, 'INVALID_LENGTH');
  assert.equal(validateTaiwanId('1123456789').errorCode, 'INVALID_COUNTY');
  assert.equal(validateTaiwanId('A312345678').errorCode, 'INVALID_FORMAT');
  assert.equal(validateTaiwanId('AE12345678').errorCode, 'INVALID_FORMAT');
  assert.equal(validateTaiwanId('A12345678X').errorCode, 'INVALID_FORMAT');

  const badCheck = validateTaiwanId('A123456788');
  assert.equal(badCheck.valid, false);
  assert.equal(badCheck.errorCode, 'INVALID_CHECKSUM');
  assert.equal(badCheck.expectedCheckDigit, 9);
});

test('generateTaiwanId 產生之三種證號 100% 通過驗證並符合指定篩選條件', () => {
  const types = ['national', 'new-resident', 'old-resident'];
  const genders = ['male', 'female', 'random'];

  for (const type of types) {
    for (const gender of genders) {
      const item = generateTaiwanId({
        type,
        countyCode: 'F',
        gender,
      });
      assert.equal(item.countyCode, 'F');
      assert.equal(item.type, type);
      if (gender !== 'random') {
        assert.equal(item.gender, gender);
      }
      assert.equal(item.weightedSum % 10, 0);

      const check = validateTaiwanId(item.id);
      assert.equal(check.valid, true, `Generated ID ${item.id} failed validation`);
      assert.equal(check.type, type);
      assert.equal(check.countyCode, 'F');
      assert.equal(check.gender, item.gender);
    }
  }
});

test('generateTaiwanId 覆蓋全部 26 縣市代碼皆產生合法證號', () => {
  for (const county of COUNTY_LIST) {
    const item = generateTaiwanId({
      type: 'national',
      countyCode: county.code,
      gender: 'random',
      includeLegacyCounties: true,
    });
    assert.equal(item.countyCode, county.code);
    assert.equal(validateTaiwanId(item.id).valid, true);
  }
});

test('generateTaiwanIdBatch 遵守數量夾緊與唯一性', () => {
  const batch = generateTaiwanIdBatch(
    { type: 'national', countyCode: 'RANDOM', gender: 'random' },
    25
  );
  assert.equal(batch.length, 25);
  assert.equal(new Set(batch.map((b) => b.id)).size, 25);

  // 極值夾緊測試
  const clampedHigh = generateTaiwanIdBatch(
    { type: 'national', countyCode: 'A', gender: 'male' },
    9999
  );
  assert.equal(clampedHigh.length, 100);

  const clampedLow = generateTaiwanIdBatch(
    { type: 'national', countyCode: 'A', gender: 'male' },
    -5
  );
  assert.equal(clampedLow.length, 1);
});

test('validateTaiwanIdBatch 支援多行與逗號分隔解析', () => {
  const res = validateTaiwanIdBatch('A123456789\nA800000014, A123456780\n\n');
  assert.equal(res.length, 3);
  assert.equal(res[0].valid, true);
  assert.equal(res[1].valid, true);
  assert.equal(res[2].valid, false);
  assert.equal(res[2].expectedCheckDigit, 9);
});

test('formatBatchExport 正確產出 TXT / CSV / JSON 格式', () => {
  const batch = generateTaiwanIdBatch(
    { type: 'national', countyCode: 'A', gender: 'female' },
    2
  );
  const txt = formatBatchExport(batch, 'txt', 'zh-TW');
  assert.equal(txt.split('\n').length, 2);

  const csvZh = formatBatchExport(batch, 'csv', 'zh-TW');
  assert.ok(csvZh.startsWith('證號,類型,縣市代碼,發證縣市,性別\n'));
  assert.ok(csvZh.includes('臺北市'));

  const csvEn = formatBatchExport(batch, 'csv', 'en');
  assert.ok(csvEn.startsWith('id,type,countyCode,county,gender\n'));
  assert.ok(csvEn.includes('Taipei City'));

  const json = JSON.parse(formatBatchExport(batch, 'json', 'en'));
  assert.equal(json.length, 2);
  assert.equal(json[0].countyCode, 'A');
});

test('generateTaiwanIdBatch 支援多選縣市 (countyCodes) 且 100% 落於指定範圍', () => {
  const allowed = new Set(SIX_MUNICIPALITIES);
  const batch = generateTaiwanIdBatch(
    { type: 'national', countyCodes: [...SIX_MUNICIPALITIES], gender: 'random' },
    40
  );
  assert.equal(batch.length, 40);
  for (const item of batch) {
    assert.ok(allowed.has(item.countyCode), `Unexpected county ${item.countyCode}`);
    assert.equal(validateTaiwanId(item.id).valid, true);
  }

  // 非法縣市代碼應安全回退至預設池而不報錯
  const fallback = generateTaiwanId({
    type: 'national',
    countyCodes: ['INVALID', '99'],
    gender: 'male',
  });
  assert.equal(validateTaiwanId(fallback.id).valid, true);
});

test('computeCheckDigit 邊界保護', () => {
  assert.throws(() => computeCheckDigit([1, 2, 3]), RangeError);
});
