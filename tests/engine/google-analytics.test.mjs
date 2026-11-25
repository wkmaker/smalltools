import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  buildGaInitScript,
  isValidGaMeasurementId,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsUrl,
} from '../../app/utils/analytics.ts';

describe('GA4 極簡脫敏邏輯 (app/utils/analytics.ts)', () => {
  it('isValidGaMeasurementId 僅允許標準 G-XXXXXX 格式', () => {
    assert.equal(isValidGaMeasurementId('G-4WBEYWFEYD'), true);
    assert.equal(isValidGaMeasurementId(' G-ABC12345 '), true);
    assert.equal(isValidGaMeasurementId(''), false);
    assert.equal(isValidGaMeasurementId(undefined), false);
    assert.equal(isValidGaMeasurementId('UA-12345-1'), false);
    assert.equal(isValidGaMeasurementId("G-123');alert(1)//"), false);
  });

  it('sanitizeAnalyticsUrl 徹底剝除 ?query 與 #hash', () => {
    assert.equal(
      sanitizeAnalyticsUrl('https://tools.cjkuo.net/loan-calculator/?amount=5000000&rate=2.1#result'),
      'https://tools.cjkuo.net/loan-calculator/'
    );
    assert.equal(
      sanitizeAnalyticsUrl('https://tools.cjkuo.net/?secret=123'),
      'https://tools.cjkuo.net/'
    );
    assert.equal(sanitizeAnalyticsUrl('javascript:alert(1)'), '');
    assert.equal(sanitizeAnalyticsUrl('not-a-url'), '');
  });

  it('sanitizeAnalyticsReferrer 剝除外部與同站 referrer 的 query 與 hash', () => {
    assert.equal(
      sanitizeAnalyticsReferrer('https://tools.cjkuo.net/mortgage/?price=1500&years=30#plan'),
      'https://tools.cjkuo.net/mortgage/'
    );
    assert.equal(
      sanitizeAnalyticsReferrer('https://www.google.com/search?q=loan+calculator'),
      'https://www.google.com/search'
    );
    assert.equal(sanitizeAnalyticsReferrer(''), undefined);
  });

  it('buildGaInitScript 執行後送出的 config 與 set 完全不含 query/hash 且關閉 signals', () => {
    const script = buildGaInitScript('G-4WBEYWFEYD');
    const calls = [];
    const sandbox = {
      window: {
        location: {
          origin: 'https://tools.cjkuo.net',
          pathname: '/loan-calculator/',
          search: '?amount=8000000&rate=2.5',
          hash: '#amortization',
        },
      },
      document: {
        referrer: 'https://tools.cjkuo.net/mortgage/?price=2000#top',
      },
      URL,
      Date,
    };
    vm.runInNewContext(script, sandbox);

    assert.equal(typeof sandbox.window.gtag, 'function');
    for (const args of sandbox.window.dataLayer) {
      calls.push(Array.from(args));
    }

    const setIdx = calls.findIndex((c) => c[0] === 'set');
    const jsIdx = calls.findIndex((c) => c[0] === 'js');
    const configIdx = calls.findIndex((c) => c[0] === 'config');
    assert.ok(setIdx !== -1, '應呼叫 gtag("set", ...)');
    assert.ok(jsIdx !== -1, '應呼叫 gtag("js", ...)');
    assert.ok(configIdx !== -1, '應呼叫 gtag("config", ...)');
    assert.ok(setIdx < jsIdx && jsIdx < configIdx, 'gtag("set") 必須在 gtag("js") 之前執行，避免 GTM 容器化 GA4 的 __gct 搶先送出未脫敏 page_view');

    const expectedParams = {
      page_location: 'https://tools.cjkuo.net/loan-calculator/',
      page_path: '/loan-calculator/',
      page_title: '/loan-calculator/',
      page_referrer: 'https://tools.cjkuo.net/mortgage/',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    };

    assert.deepEqual({ ...calls[setIdx][1] }, expectedParams);
    assert.equal(calls[configIdx][1], 'G-4WBEYWFEYD');
    assert.deepEqual({ ...calls[configIdx][2] }, expectedParams);
  });

  it('buildGaInitScript 拒絕不合法 Measurement ID', () => {
    assert.throws(() => buildGaInitScript('INVALID-ID'));
  });

  it('deploy-site.yml 與 deploy-staging.yml 確保僅正式站注入 NEXT_PUBLIC_GA_ID', () => {
    const deploySite = fs.readFileSync(
      path.resolve('.github/workflows/deploy-site.yml'),
      'utf8'
    );
    const deployProd = fs.readFileSync(
      path.resolve('.github/workflows/deploy.yml'),
      'utf8'
    );
    const deployStaging = fs.readFileSync(
      path.resolve('.github/workflows/deploy-staging.yml'),
      'utf8'
    );

    assert.match(deploySite, /NEXT_PUBLIC_GA_ID:\s*\$\{\{\s*inputs\.environment == 'production' && inputs\.ga-id \|\| ''\s*\}\}/);
    assert.match(deployProd, /ga-id:\s*\$\{\{\s*vars\.NEXT_PUBLIC_GA_ID \|\| ''\s*\}\}/);
    assert.doesNotMatch(deployStaging, /ga-id|NEXT_PUBLIC_GA_ID/);
  });
});
