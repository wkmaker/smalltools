import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as x509 from '@peculiar/x509';
import {
  parseSanInput,
  generateCaCertificate,
  generateServerCertificate,
  generateSelfSignedCertificate,
  importCaCertificate,
  buildPkcs12,
  supportsPkcs12,
} from '../../app/cert-generator/engine.ts';

test('generateCaCertificate：basicConstraints CA:true，且具備 keyCertSign / cRLSign keyUsage', async () => {
  const ca = await generateCaCertificate({
    commonName: 'Test Root CA',
    validityDays: 3650,
    algorithm: 'RSA-2048',
  });

  const basicConstraints = ca.cert.getExtension(x509.BasicConstraintsExtension);
  const keyUsage = ca.cert.getExtension(x509.KeyUsagesExtension);

  assert.equal(basicConstraints.ca, true);
  assert.equal((keyUsage.usages & x509.KeyUsageFlags.keyCertSign) !== 0, true);
  assert.equal((keyUsage.usages & x509.KeyUsageFlags.cRLSign) !== 0, true);
});

test('generateServerCertificate：伺服器憑證確實由對應 CA 簽發且簽章可被驗證', async () => {
  const ca = await generateCaCertificate({
    commonName: 'Test Root CA',
    validityDays: 3650,
    algorithm: 'RSA-2048',
  });

  const server = await generateServerCertificate({
    commonName: 'server.example.com',
    sanEntries: parseSanInput('server.example.com'),
    validityDays: 825,
    algorithm: 'RSA-2048',
    caCert: ca.cert,
    caPrivateKey: ca.privateKey,
    caPublicKey: ca.cert.publicKey,
  });

  assert.equal(server.cert.issuer, ca.cert.subject);
  assert.equal(await server.cert.verify({ publicKey: ca.cert.publicKey }), true);
});

test('generateServerCertificate：多筆 DNS / IP SAN 正確寫入，可被重新解析為相同集合', async () => {
  const ca = await generateCaCertificate({
    commonName: 'Test Root CA',
    validityDays: 3650,
    algorithm: 'RSA-2048',
  });

  const sanEntries = parseSanInput('example.com, www.example.com\n192.168.1.10');
  const server = await generateServerCertificate({
    commonName: 'example.com',
    sanEntries,
    validityDays: 825,
    algorithm: 'RSA-2048',
    caCert: ca.cert,
    caPrivateKey: ca.privateKey,
    caPublicKey: ca.cert.publicKey,
  });

  const sanExt = server.cert.getExtension(x509.SubjectAlternativeNameExtension);
  const dnsValues = sanExt.names.items.filter((a) => a.type === 'dns').map((a) => a.value);
  const ipValues = sanExt.names.items.filter((a) => a.type === 'ip').map((a) => a.value);

  assert.deepEqual(dnsValues.sort(), ['example.com', 'www.example.com'].sort());
  assert.deepEqual(ipValues, ['192.168.1.10']);
});

test('有效期天數：notAfter - notBefore 天數與輸入的 validityDays 一致（容許 1 天誤差）', async () => {
  const ca = await generateCaCertificate({
    commonName: 'Test Root CA',
    validityDays: 400,
    algorithm: 'RSA-2048',
  });

  const diffDays = (ca.cert.notAfter.getTime() - ca.cert.notBefore.getTime()) / (1000 * 60 * 60 * 24);

  assert.ok(Math.abs(diffDays - 400) < 1);
});

test('parseSanInput：混合輸入正確分類 DNS / IP，去除重複與空白，無效格式歸入 invalid', () => {
  const result = parseSanInput('example.com,, 192.168.1.1 \nexample.com\nnot valid host!\n');

  assert.deepEqual(result.dnsNames, ['example.com']);
  assert.deepEqual(result.ipAddresses, ['192.168.1.1']);
  assert.deepEqual(result.invalid, ['not valid host!']);
});

test('generateSelfSignedCertificate：純自簽憑證 subject 與 issuer 相同，且不經過任何 CA 即可驗證通過', async () => {
  const selfSigned = await generateSelfSignedCertificate({
    commonName: 'localhost',
    sanEntries: parseSanInput('localhost, 127.0.0.1'),
    validityDays: 365,
    algorithm: 'ECDSA-P256',
  });

  assert.equal(selfSigned.cert.subject, selfSigned.cert.issuer);
  assert.equal(await selfSigned.cert.verify(), true);
  const basicConstraints = selfSigned.cert.getExtension(x509.BasicConstraintsExtension);
  assert.equal(basicConstraints.ca, false);
});

test('Ed25519：非 RSA/ECDSA 演算法也能完整走完自簽產生與驗證流程', async () => {
  const selfSigned = await generateSelfSignedCertificate({
    commonName: 'ed25519.local',
    sanEntries: parseSanInput('ed25519.local'),
    validityDays: 365,
    algorithm: 'Ed25519',
  });

  assert.equal(await selfSigned.cert.verify(), true);
});

test('buildPkcs12：RSA 金鑰可成功打包，非 RSA 演算法（supportsPkcs12 為 false）應拋出錯誤', async () => {
  const rsaCert = await generateSelfSignedCertificate({
    commonName: 'pkcs12-test',
    sanEntries: parseSanInput(''),
    validityDays: 365,
    algorithm: 'RSA-2048',
  });
  assert.equal(supportsPkcs12('RSA-2048'), true);
  const p12Bytes = buildPkcs12(rsaCert.certPem, rsaCert.privateKeyPem, 'test-password');
  assert.ok(p12Bytes.length > 0);

  const ecCert = await generateSelfSignedCertificate({
    commonName: 'pkcs12-ec-test',
    sanEntries: parseSanInput(''),
    validityDays: 365,
    algorithm: 'ECDSA-P256',
  });
  assert.equal(supportsPkcs12('ECDSA-P256'), false);
  assert.throws(() => buildPkcs12(ecCert.certPem, ecCert.privateKeyPem, 'test-password'));
});

test('importCaCertificate：貼上先前產生的 CA 憑證與私鑰 PEM，可重建 CA 並繼續簽發新的伺服器憑證', async () => {
  for (const algorithm of ['RSA-2048', 'ECDSA-P384', 'Ed25519']) {
    const original = await generateCaCertificate({
      commonName: 'Imported Root CA',
      validityDays: 3650,
      algorithm,
    });

    const imported = await importCaCertificate(original.certPem, original.privateKeyPem);
    assert.equal(imported.cert.subject, original.cert.subject);

    const server = await generateServerCertificate({
      commonName: 'imported.local',
      sanEntries: parseSanInput('imported.local'),
      validityDays: 365,
      algorithm: 'ECDSA-P256',
      caCert: imported.cert,
      caPrivateKey: imported.privateKey,
      caPublicKey: imported.cert.publicKey,
    });

    assert.equal(await server.cert.verify({ publicKey: original.cert.publicKey }), true);
  }
});

test('importCaCertificate：非 CA 憑證（basicConstraints ca:false）應拋出明確錯誤', async () => {
  const leaf = await generateSelfSignedCertificate({
    commonName: 'not-a-ca',
    sanEntries: parseSanInput(''),
    validityDays: 365,
    algorithm: 'RSA-2048',
  });

  await assert.rejects(() => importCaCertificate(leaf.certPem, leaf.privateKeyPem), /未標示為 CA/);
});

test('importCaCertificate：私鑰與憑證公鑰不成對時應拋出明確錯誤，而非簽出無效憑證鏈', async () => {
  const caA = await generateCaCertificate({ commonName: 'CA A', validityDays: 365, algorithm: 'RSA-2048' });
  const caB = await generateCaCertificate({ commonName: 'CA B', validityDays: 365, algorithm: 'RSA-2048' });

  await assert.rejects(
    () => importCaCertificate(caA.certPem, caB.privateKeyPem),
    /私鑰與憑證的公鑰不匹配/
  );
});
