import 'reflect-metadata';
import * as x509 from '@peculiar/x509';
import forge from 'node-forge';

export type KeyAlgorithm = 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384' | 'Ed25519';

export const KEY_ALGORITHMS: KeyAlgorithm[] = ['RSA-2048', 'RSA-4096', 'ECDSA-P256', 'ECDSA-P384', 'Ed25519'];

/** PKCS#12 打包目前僅支援 RSA 金鑰（node-forge 的 PKCS#12 實作僅能處理 RSA 私鑰）。 */
export function supportsPkcs12(algorithm: KeyAlgorithm): boolean {
  return algorithm === 'RSA-2048' || algorithm === 'RSA-4096';
}

export interface SanParseResult {
  dnsNames: string[];
  ipAddresses: string[];
  invalid: string[];
}

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HOSTNAME_REGEX = /^(\*\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

function isValidIpv4(value: string): boolean {
  const match = value.match(IPV4_REGEX);
  if (!match) return false;
  return match.slice(1, 5).every((octet) => Number(octet) <= 255);
}

/** 解析使用者輸入的 SAN 清單（逗號或換行分隔），分類為 DNS 名稱與 IP，並回報無法辨識的項目。 */
export function parseSanInput(raw: string): SanParseResult {
  const dnsNames: string[] = [];
  const ipAddresses: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .forEach((entry) => {
      if (seen.has(entry)) return;
      seen.add(entry);

      if (isValidIpv4(entry)) {
        ipAddresses.push(entry);
      } else if (HOSTNAME_REGEX.test(entry)) {
        dnsNames.push(entry);
      } else {
        invalid.push(entry);
      }
    });

  return { dnsNames, ipAddresses, invalid };
}

function buildSanJson(sanEntries: SanParseResult): x509.JsonGeneralNames {
  return [
    ...sanEntries.dnsNames.map((value) => ({ type: 'dns' as const, value })),
    ...sanEntries.ipAddresses.map((value) => ({ type: 'ip' as const, value })),
  ];
}

/** 產生一組隨機序號（避免最高位元為 1 造成 ASN.1 誤判為負數）。 */
export function generateSerialNumber(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  if (parseInt(hex.substring(0, 2), 16) >= 128) {
    hex = '00' + hex;
  }
  return hex;
}

function buildValidity(validityDays: number): { notBefore: Date; notAfter: Date } {
  const notBefore = new Date();
  const notAfter = new Date(notBefore.getTime());
  notAfter.setDate(notAfter.getDate() + validityDays);
  return { notBefore, notAfter };
}

function escapeDnValue(value: string): string {
  return value.replace(/([,+"\\<>;])/g, '\\$1');
}

function buildDistinguishedName(parts: { commonName: string; organization?: string; countryCode?: string }): string {
  const segments = [`CN=${escapeDnValue(parts.commonName)}`];
  if (parts.organization) segments.push(`O=${escapeDnValue(parts.organization)}`);
  if (parts.countryCode) segments.push(`C=${escapeDnValue(parts.countryCode)}`);
  return segments.join(',');
}

async function generateKeyPair(algorithm: KeyAlgorithm): Promise<CryptoKeyPair> {
  switch (algorithm) {
    case 'RSA-2048':
    case 'RSA-4096':
      return crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: algorithm === 'RSA-2048' ? 2048 : 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );
    case 'ECDSA-P256':
      return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    case 'ECDSA-P384':
      return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']);
    case 'Ed25519':
      return crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  }
}

async function buildLeafExtensions(
  publicKey: CryptoKey,
  sanEntries: SanParseResult,
  authorityPublicKey?: x509.PublicKeyType
): Promise<x509.Extension[]> {
  const pub = await x509.PublicKey.create(publicKey);
  const extensions: x509.Extension[] = [
    new x509.BasicConstraintsExtension(false, undefined, true),
    new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment, true),
    new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth, x509.ExtendedKeyUsage.clientAuth]),
    await x509.SubjectKeyIdentifierExtension.create(pub),
    await x509.AuthorityKeyIdentifierExtension.create(authorityPublicKey ?? pub),
  ];

  const sanJson = buildSanJson(sanEntries);
  if (sanJson.length > 0) {
    extensions.push(new x509.SubjectAlternativeNameExtension(sanJson));
  }
  return extensions;
}

async function buildCaExtensions(publicKey: CryptoKey): Promise<x509.Extension[]> {
  const pub = await x509.PublicKey.create(publicKey);
  return [
    new x509.BasicConstraintsExtension(true, undefined, true),
    new x509.KeyUsagesExtension(
      x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign | x509.KeyUsageFlags.digitalSignature,
      true
    ),
    await x509.SubjectKeyIdentifierExtension.create(pub),
  ];
}

export interface CertificateBundle {
  cert: x509.X509Certificate;
  certPem: string;
  certDer: ArrayBuffer;
  privateKey: CryptoKey;
  privateKeyPem: string;
  privateKeyDer: ArrayBuffer;
  algorithm: KeyAlgorithm;
}

async function toBundle(
  cert: x509.X509Certificate,
  keys: CryptoKeyPair,
  algorithm: KeyAlgorithm
): Promise<CertificateBundle> {
  const privateKeyDer = await crypto.subtle.exportKey('pkcs8', keys.privateKey);
  return {
    cert,
    certPem: cert.toString('pem'),
    certDer: cert.rawData,
    privateKey: keys.privateKey,
    privateKeyPem: x509.PemConverter.encode(privateKeyDer, x509.PemConverter.PrivateKeyTag),
    privateKeyDer,
    algorithm,
  };
}

export interface SelfSignedCertificateOptions {
  commonName: string;
  organization?: string;
  countryCode?: string;
  sanEntries: SanParseResult;
  validityDays: number;
  algorithm: KeyAlgorithm;
}

/** 產生一張「純自簽」憑證：subject 與 issuer 相同，不經過任何 CA，僅供自己信任這一張。 */
export async function generateSelfSignedCertificate(options: SelfSignedCertificateOptions): Promise<CertificateBundle> {
  const keys = await generateKeyPair(options.algorithm);
  const { notBefore, notAfter } = buildValidity(options.validityDays);

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: generateSerialNumber(),
    name: buildDistinguishedName(options),
    notBefore,
    notAfter,
    keys,
    extensions: await buildLeafExtensions(keys.publicKey, options.sanEntries),
  });

  return toBundle(cert, keys, options.algorithm);
}

export interface CaCertificateOptions {
  commonName: string;
  organization?: string;
  countryCode?: string;
  validityDays: number;
  algorithm: KeyAlgorithm;
}

/** 產生一張自簽根 CA 憑證與對應私鑰（純前端運算，私鑰不會離開瀏覽器）。 */
export async function generateCaCertificate(options: CaCertificateOptions): Promise<CertificateBundle> {
  const keys = await generateKeyPair(options.algorithm);
  const { notBefore, notAfter } = buildValidity(options.validityDays);

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: generateSerialNumber(),
    name: buildDistinguishedName(options),
    notBefore,
    notAfter,
    keys,
    extensions: await buildCaExtensions(keys.publicKey),
  });

  return toBundle(cert, keys, options.algorithm);
}

export interface ServerCertificateOptions {
  commonName: string;
  sanEntries: SanParseResult;
  validityDays: number;
  algorithm: KeyAlgorithm;
  caCert: x509.X509Certificate;
  caPrivateKey: CryptoKey;
  caPublicKey: x509.PublicKeyType;
}

/** 產生一張由指定 CA 簽發的伺服器憑證與對應私鑰，支援多筆 DNS / IP SAN。 */
export async function generateServerCertificate(options: ServerCertificateOptions): Promise<CertificateBundle> {
  const keys = await generateKeyPair(options.algorithm);
  const { notBefore, notAfter } = buildValidity(options.validityDays);

  const cert = await x509.X509CertificateGenerator.create({
    serialNumber: generateSerialNumber(),
    subject: buildDistinguishedName({ commonName: options.commonName }),
    issuer: options.caCert.subject,
    notBefore,
    notAfter,
    signingKey: options.caPrivateKey,
    publicKey: keys.publicKey,
    extensions: await buildLeafExtensions(keys.publicKey, options.sanEntries, options.caPublicKey),
  });

  return toBundle(cert, keys, options.algorithm);
}

/** 將 RSA 憑證與私鑰打包為 PKCS#12 (.p12/.pfx)。僅支援 RSA，其他演算法會拋出錯誤。 */
export function buildPkcs12(certPem: string, privateKeyPem: string, password: string): Uint8Array {
  let forgeKey: forge.pki.PrivateKey;
  let forgeCert: forge.pki.Certificate;
  try {
    forgeKey = forge.pki.privateKeyFromPem(privateKeyPem);
    forgeCert = forge.pki.certificateFromPem(certPem);
  } catch {
    throw new Error('PKCS#12 打包目前僅支援 RSA 金鑰');
  }

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(forgeKey, [forgeCert], password, { algorithm: '3des' });
  const der = forge.asn1.toDer(p12Asn1).getBytes();
  const bytes = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) bytes[i] = der.charCodeAt(i) & 0xff;
  return bytes;
}

/** 將任意字串轉為安全的檔名片段（供下載檔名使用），移除萬用字元與非法字元。 */
export function sanitizeFileSegment(name: string): string {
  const cleaned = name.trim().replace(/^\*\./, 'wildcard.').replace(/[^a-zA-Z0-9.-]+/g, '-');
  return cleaned.replace(/^-+|-+$/g, '') || 'cert';
}
