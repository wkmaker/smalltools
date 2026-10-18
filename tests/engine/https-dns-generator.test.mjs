import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSvcParams, generateFullBindRecord } from '../../app/https-dns-generator/engine.ts';

test('RFC 9460 HTTPS/SVCB DNS Generator Engine', async (t) => {
  await t.test('Alias 模式回傳空參數與 priority 0', () => {
    const params = generateSvcParams({ mode: 'alias', target: 'cdn.example.com' });
    assert.equal(params, '');

    const record = generateFullBindRecord({
      mode: 'alias',
      host: 'example.com',
      ttl: 3600,
      target: 'cdn.example.com',
    });
    assert.equal(record, 'example.com. 3600 IN HTTPS 0 cdn.example.com');
  });

  await t.test('Service 模式預設標準設定 (h2, h3, priority 1)', () => {
    const params = generateSvcParams({
      mode: 'service',
      alpnH3: true,
      alpnH2: true,
      alpnH1: false,
    });
    assert.equal(params, 'alpn="h3,h2"');

    const record = generateFullBindRecord({
      mode: 'service',
      host: '@',
      ttl: 300,
      priority: 1,
      target: '.',
      alpnH3: true,
      alpnH2: true,
    });
    assert.equal(record, '@. 300 IN HTTPS 1 . alpn="h3,h2"');
  });

  await t.test('完整參數生成 (port, ipv4hint, ipv6hint, no-default-alpn, ech)', () => {
    const record = generateFullBindRecord({
      mode: 'service',
      host: 'api',
      ttl: 600,
      priority: 2,
      target: 'svc.example.net',
      alpnH3: true,
      alpnH2: true,
      alpnH1: true,
      noDefaultAlpn: true,
      port: '8443',
      ipv4hint: '198.51.100.1,198.51.100.2',
      ipv6hint: '2001:db8::1',
      ech: 'AEn+DQBF4wAgACAB',
    });

    assert.ok(record.includes('api. 600 IN HTTPS 2 svc.example.net'));
    assert.ok(record.includes('alpn="h3,h2,http/1.1"'));
    assert.ok(record.includes('no-default-alpn'));
    assert.ok(record.includes('port=8443'));
    assert.ok(record.includes('ipv4hint="198.51.100.1,198.51.100.2"'));
    assert.ok(record.includes('ipv6hint="2001:db8::1"'));
    assert.ok(record.includes('ech="AEn+DQBF4wAgACAB"'));
  });
});
