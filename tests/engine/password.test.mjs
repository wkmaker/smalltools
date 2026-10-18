import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAR_SETS,
  CONFUSABLE,
  buildPassword,
  evaluateStrength,
} from '../../app/password/engine.ts';

test('Password Generator Engine', async (t) => {
  await t.test('未選擇任何字元集時回傳 null', () => {
    const pwd = buildPassword({
      length: 16,
      useUpper: false,
      useLower: false,
      useNumber: false,
      useCommonSymbol: false,
      useOtherSymbol: false,
      excludeConfusable: false,
      strictMode: false,
    });
    assert.equal(pwd, null);
  });

  await t.test('依據指定長度產生密碼', () => {
    const pwd = buildPassword({
      length: 24,
      useUpper: true,
      useLower: true,
      useNumber: true,
      useCommonSymbol: true,
      useOtherSymbol: false,
      excludeConfusable: false,
      strictMode: true,
    });
    assert.ok(pwd !== null);
    assert.equal(pwd.length, 24);
  });

  await t.test('排除易混淆字元功能驗證', () => {
    const pwd = buildPassword({
      length: 100,
      useUpper: true,
      useLower: true,
      useNumber: true,
      useCommonSymbol: true,
      useOtherSymbol: false,
      excludeConfusable: true,
      strictMode: false,
    });
    assert.ok(pwd !== null);
    // 易混淆字元如 0, O, 1, l, I 等不應出現
    for (const char of ['0', 'O', '1', 'l', 'I']) {
      assert.ok(!pwd.includes(char), `密碼不應包含混淆字元: ${char}`);
    }
  });

  await t.test('嚴格模式確保每種選定字元集至少出現一次', () => {
    const pwd = buildPassword({
      length: 16,
      useUpper: true,
      useLower: true,
      useNumber: true,
      useCommonSymbol: true,
      useOtherSymbol: false,
      excludeConfusable: false,
      strictMode: true,
    });
    assert.ok(pwd !== null);
    assert.ok(/[A-Z]/.test(pwd), '應包含大寫字母');
    assert.ok(/[a-z]/.test(pwd), '應包含小寫字母');
    assert.ok(/[0-9]/.test(pwd), '應包含數字');
    assert.ok(/[!@#$%^&*_\-+=]/.test(pwd), '應包含常用符號');
  });

  await t.test('強度評估計分與標籤', () => {
    const labels = {
      weak: '弱',
      medium: '中等',
      strong: '強',
      secure: '極高安全',
    };

    const empty = evaluateStrength('', 0, 0, labels);
    assert.equal(empty.label, '-');
    assert.equal(empty.percent, 0);

    const weak = evaluateStrength('123456', 1, 6, labels);
    assert.equal(weak.label, labels.weak);

    const secure = evaluateStrength('A#b9!Kx2$P0@Lz1&', 4, 16, labels);
    assert.equal(secure.label, labels.secure);
    assert.equal(secure.percent, 100);
  });
});
