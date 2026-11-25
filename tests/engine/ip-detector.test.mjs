import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCfTraceText,
  normalizeIpapiGeo,
  normalizeIpwhoisGeo,
} from '../../app/ip-detector/engine.ts';

test('parseCfTraceText：正確解析 Cloudflare cdn-cgi/trace 鍵值（含值中帶等號的 uag）', () => {
  const raw = [
    'fl=123f45',
    'ip=203.0.113.42',
    'colo=TPE',
    'loc=TW',
    'http=http/3',
    'uag=Mozilla/5.0 (Test; key=val)',
  ].join('\n');

  const parsed = parseCfTraceText(raw, { latency: 28, unknownLabel: '未知' });
  assert.equal(parsed.ip, '203.0.113.42');
  assert.equal(parsed.colo, 'TPE');
  assert.equal(parsed.loc, 'TW');
  assert.equal(parsed.http, 'http/3');
  assert.equal(parsed.uag, 'Mozilla/5.0 (Test; key=val)');
  assert.equal(parsed.latency, 28);
});

test('parseCfTraceText：缺漏欄位安全回退至 unknownLabel 與 fallbackUserAgent', () => {
  const parsed = parseCfTraceText('', { unknownLabel: '未知', fallbackUserAgent: 'CustomUA' });
  assert.equal(parsed.ip, '未知');
  assert.equal(parsed.colo, '未知');
  assert.equal(parsed.uag, 'CustomUA');
});

test('normalizeIpapiGeo / normalizeIpwhoisGeo：雙來源正規化輸出結構一致', () => {
  const primary = normalizeIpapiGeo(
    {
      city: 'Taipei',
      region: 'Taiwan',
      country_name: 'Taiwan',
      latitude: 25.033,
      longitude: 121.5654,
      timezone: 'Asia/Taipei',
      utc_offset: '+0800',
      currency: 'TWD',
      currency_name: 'Dollar',
      org: 'Chunghwa Telecom',
      asn: 'AS3462',
      network: '203.0.113.0/24',
    },
    '未知'
  );
  assert.equal(primary.location, 'Taipei, Taiwan, Taiwan');
  assert.equal(primary.latlon, '121.5654, 25.033');
  assert.equal(primary.source, 'ipapi.co');

  const fallback = normalizeIpwhoisGeo(
    {
      city: 'Taipei',
      country: 'Taiwan',
      isp: 'HiNet',
      asn: 'AS3462',
    },
    '未知'
  );
  assert.equal(fallback.location, 'Taipei, Taiwan');
  assert.equal(fallback.org, 'HiNet');
  assert.equal(fallback.latlon, '未知');
  assert.equal(fallback.source, 'ipwhois.app');
});
