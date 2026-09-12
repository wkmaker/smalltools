import test from 'node:test';
import assert from 'node:assert/strict';
import forge from 'node-forge';
import {
  sanitizeDomainName,
  generateCertFilename,
  extractPemCertificates,
  parseSslPayload,
  buildUnifiedCertAnalysis,
  verifyCertIssuerMatch,
} from '../../app/ssl-converter/engine.ts';

/**
 * 用 node-forge 現場產生「根 CA -> 葉憑證」測試鏈與對應私鑰/PKCS12，
 * 不依賴任何固定測試金鑰檔案，避免在儲存庫留下真實或看似真實的憑證素材。
 */
function buildTestChain() {
  const caKeys = forge.pki.rsa.generateKeyPair(2048);
  const caCert = forge.pki.createCertificate();
  caCert.publicKey = caKeys.publicKey;
  caCert.serialNumber = '01';
  caCert.validity.notBefore = new Date('2026-01-01T00:00:00Z');
  caCert.validity.notAfter = new Date('2036-01-01T00:00:00Z');
  const caAttrs = [{ name: 'commonName', value: 'Test Root CA' }];
  caCert.setSubject(caAttrs);
  caCert.setIssuer(caAttrs);
  caCert.setExtensions([{ name: 'basicConstraints', cA: true }]);
  caCert.sign(caKeys.privateKey, forge.md.sha256.create());

  const leafKeys = forge.pki.rsa.generateKeyPair(2048);
  const leafCert = forge.pki.createCertificate();
  leafCert.publicKey = leafKeys.publicKey;
  leafCert.serialNumber = '02';
  leafCert.validity.notBefore = new Date('2026-01-01T00:00:00Z');
  leafCert.validity.notAfter = new Date('2036-01-01T00:00:00Z');
  leafCert.setSubject([{ name: 'commonName', value: 'leaf.example.com' }]);
  leafCert.setIssuer(caAttrs);
  leafCert.setExtensions([{ name: 'basicConstraints', cA: false }]);
  leafCert.sign(caKeys.privateKey, forge.md.sha256.create());

  return { caKeys, caCert, leafKeys, leafCert };
}

test('sanitizeDomainName / generateCertFilename：萬用字元與非法字元轉為安全檔名', () => {
  assert.equal(sanitizeDomainName('*.example.com'), 'wildcard-example-com');
  assert.equal(sanitizeDomainName(undefined), 'ssl-cert');
  assert.equal(generateCertFilename('example.com', 'fullchain', '.pem'), 'example-com_fullchain.pem');
});

test('extractPemCertificates：正確解析單張 PEM 憑證，格式錯誤回傳空陣列', () => {
  const { leafCert } = buildTestChain();
  const pem = forge.pki.certificateToPem(leafCert);

  const { certs, pems } = extractPemCertificates(pem);
  assert.equal(certs.length, 1);
  assert.equal(pems.length, 1);
  assert.equal(certs[0].subject.getField('CN').value, 'leaf.example.com');

  const bad = extractPemCertificates('not a certificate');
  assert.equal(bad.certs.length, 0);
});

test('parseSslPayload：PEM 憑證 + 私鑰應同時解出憑證與 PKCS8 私鑰', async () => {
  const { leafCert, leafKeys } = buildTestChain();
  const certPem = forge.pki.certificateToPem(leafCert);
  const keyPem = forge.pki.privateKeyToPem(leafKeys.privateKey);

  const result = await parseSslPayload({ text: `${certPem}\n${keyPem}` });
  assert.equal(result.certs.length, 1);
  assert.equal(result.isPfx, false);
  assert.ok(result.privateKeyPemPkcs8?.includes('BEGIN PRIVATE KEY'));
});

test('parseSslPayload：PKCS12 (PFX) 應以密碼正確解密並取出憑證鏈與私鑰', async () => {
  const { caCert, leafCert, leafKeys } = buildTestChain();
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(leafKeys.privateKey, [leafCert, caCert], 'test-pass-123', {
    algorithm: '3des',
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Bytes = Uint8Array.from(p12Der, c => c.charCodeAt(0));
  const file = new File([p12Bytes], 'bundle.p12');

  const result = await parseSslPayload({ file }, 'test-pass-123');
  assert.equal(result.isPfx, true);
  assert.equal(result.pfxDecrypted, true);
  assert.equal(result.certs.length, 2);
  assert.ok(result.privateKeyPemPkcs8?.includes('BEGIN PRIVATE KEY'));
});

test('parseSslPayload：PKCS12 密碼錯誤時應回報未解密成功，而不是拋錯或悄悄回傳空白密鑰', async () => {
  const { caCert, leafCert, leafKeys } = buildTestChain();
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(leafKeys.privateKey, [leafCert, caCert], 'correct-password', {
    algorithm: '3des',
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Bytes = Uint8Array.from(p12Der, c => c.charCodeAt(0));
  const file = new File([p12Bytes], 'bundle.p12');

  const result = await parseSslPayload({ file }, 'wrong-password');
  assert.equal(result.isPfx, true);
  assert.equal(result.pfxDecrypted, false);
  assert.equal(result.certs.length, 0);
});

test('buildUnifiedCertAnalysis：葉憑證 + 根 CA 應組成完整憑證鏈', () => {
  const { caCert, leafCert } = buildTestChain();
  const analysis = buildUnifiedCertAnalysis([leafCert, caCert]);

  assert.equal(analysis.cn, 'leaf.example.com');
  assert.equal(analysis.issuer, 'Test Root CA');
  assert.equal(analysis.chain.length, 2);
  assert.equal(analysis.isComplete, true);
  assert.equal(analysis.isExpired, false);
  assert.ok(analysis.certAlgo.startsWith('RSA'));
});

test('verifyCertIssuerMatch：issuer/subject DN 相符時才視為親子關係', () => {
  const { caCert, leafCert } = buildTestChain();
  assert.equal(verifyCertIssuerMatch(leafCert, caCert), true);
  assert.equal(verifyCertIssuerMatch(caCert, leafCert), false);
});
