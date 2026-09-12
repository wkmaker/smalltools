/**
 * SSL/TLS 憑證與私鑰解析引擎（無 UI 依賴、可獨立單元測試）。
 *
 * 從 `SslConverterClient.tsx` 抽離：PEM/DER/PKCS12 解析、憑證鏈組裝與
 * 驗證、金鑰演算法辨識等純函數。全程只在瀏覽器記憶體中處理，不做任何
 * 網路請求；私鑰/憑證內容只會透過回傳值往外流動，呼叫端負責畫面顯示。
 */

import forge from 'node-forge';

export function sanitizeDomainName(domainName?: string): string {
  if (!domainName || domainName === '未知' || domainName === '無通用名稱' || domainName === '無') {
    return 'ssl-cert';
  }
  return domainName
    .trim()
    .replace(/\*/g, 'wildcard')
    .replace(/\./g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^-+|-+$/g, '') || 'ssl-cert';
}

export function generateCertFilename(domainName: string | undefined, typeName: string, ext: string): string {
  const safeCN = sanitizeDomainName(domainName);
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `${safeCN}_${typeName}.${cleanExt}`;
}

export async function readFileAsBinaryString(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  return forge.util.binary.raw.encode(bytes);
}

export function parseDistinguishedName(dnObj: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '未知';
  for (const attr of dnObj.attributes) {
    if (attr.shortName === 'CN' || attr.name === 'commonName' || attr.type === '2.5.4.3') {
      if (attr.value) return attr.value as string;
    }
  }
  return '無通用名稱';
}

export function formatValidityDate(date?: Date): string {
  if (!date) return '未知';
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

export function getDnString(dnObj?: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '';
  return dnObj.attributes
    .map(attr => `${attr.shortName || attr.name || attr.type}=${attr.value}`)
    .sort()
    .join(',');
}
export function isRootCertificate(certObj?: forge.pki.Certificate): boolean {
  if (!certObj) return false;
  const issuerStr = getDnString(certObj.issuer);
  const subjectStr = getDnString(certObj.subject);
  return issuerStr !== '' && issuerStr === subjectStr;
}

export function isCaCertificate(certObj?: forge.pki.Certificate): boolean {
  if (!certObj) return false;
  const ext = certObj.getExtension('basicConstraints');
  if (ext && 'cA' in ext && typeof ext.cA === 'boolean') {
    return ext.cA;
  }
  return isRootCertificate(certObj);
}

export function verifyCertIssuerMatch(
  childCert: forge.pki.Certificate,
  parentCert: forge.pki.Certificate
): boolean {
  const childIssuerDn = getDnString(childCert.issuer);
  const parentSubjectDn = getDnString(parentCert.subject);

  if (childIssuerDn !== parentSubjectDn) {
    return false;
  }

  try {
    const childAki = childCert.getExtension('authorityKeyIdentifier');
    const parentSki = parentCert.getExtension('subjectKeyIdentifier');

    if (childAki && parentSki) {
      let akiHex = '';
      let skiHex = '';

      if ('keyIdentifier' in childAki && childAki.keyIdentifier) {
        akiHex = forge.util.bytesToHex(childAki.keyIdentifier as string);
      }
      if ('subjectKeyIdentifier' in parentSki && parentSki.subjectKeyIdentifier) {
        skiHex = forge.util.bytesToHex(parentSki.subjectKeyIdentifier as string);
      }

      if (akiHex && skiHex && akiHex !== skiHex) {
        return false;
      }
    }
  } catch {}

  return true;
}

export function extractAiaUrl(certObj: forge.pki.Certificate): string | null {
  const ext = certObj.getExtension('authorityInfoAccess');
  if (!ext) return null;

  let derStr = '';
  if ('value' in ext && typeof ext.value === 'string') {
    derStr = ext.value;
  } else if ('asn1Value' in ext && ext.asn1Value) {
    try {
      derStr = forge.asn1.toDer(ext.asn1Value as forge.asn1.Asn1).getBytes();
    } catch {
      return null;
    }
  } else {
    return null;
  }

  const aiaRegex = /https?:\/\/[A-Za-z0-9\-\.\/_~%]+\.(cer|crt|p7b)/i;
  const match = derStr.match(aiaRegex);
  if (!match) return null;

  // 將 http:// 自動重寫升級為 https://，避免現代瀏覽器在 HTTPS 站點下因 Mixed Content 混合內容安全機制阻擋檔案下載
  return match[0].replace(/^http:\/\//i, 'https://');
}

export function getCertKeyAlgorithm(certObj: forge.pki.Certificate): string {
  try {
    const certRSA = certObj.publicKey as forge.pki.rsa.PublicKey;
    if (certRSA && certRSA.n) {
      const bitLength = certRSA.n.bitLength();
      return `RSA (${bitLength}-bit)`;
    }
  } catch {}

  try {
    const asn1Cert = forge.pki.certificateToAsn1(certObj);
    const tbsCert = asn1Cert.value[0] as forge.asn1.Asn1;
    const derStr = forge.asn1.toDer(tbsCert).getBytes();

    if (derStr.includes(forge.asn1.oidToDer('1.2.840.10045.2.1').getBytes())) {
      if (derStr.includes(forge.asn1.oidToDer('1.2.840.10045.3.1.7').getBytes())) {
        return 'ECDSA (prime256v1 / P-256)';
      }
      if (derStr.includes(forge.asn1.oidToDer('1.3.132.0.34').getBytes())) {
        return 'ECDSA (secp384r1 / P-384)';
      }
      if (derStr.includes(forge.asn1.oidToDer('1.3.132.0.35').getBytes())) {
        return 'ECDSA (secp521r1 / P-521)';
      }
      return 'ECDSA (Elliptic Curve / ECC)';
    }
  } catch {}

  return 'X.509 (通用憑證)';
}

export function extractPemCertificates(inputText: string): { certs: forge.pki.Certificate[]; pems: string[] } {
  if (!inputText || !inputText.trim()) return { certs: [], pems: [] };
  const normalized = inputText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const certs: forge.pki.Certificate[] = [];
  const pems: string[] = [];

  const pemRegex = /-----BEGIN (?:[A-Z0-9_-]+ )?CERTIFICATE-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?CERTIFICATE-----/g;
  const matches = normalized.match(pemRegex) || [];

  for (const rawBlock of matches) {
    const standardBlock = rawBlock
      .replace(/-----BEGIN (?:[A-Z0-9_-]+ )?CERTIFICATE-----/, '-----BEGIN CERTIFICATE-----')
      .replace(/-----END (?:[A-Z0-9_-]+ )?CERTIFICATE-----/, '-----END CERTIFICATE-----');

    try {
      const c = forge.pki.certificateFromPem(standardBlock);
      certs.push(c);
      pems.push(forge.pki.certificateToPem(c));
    } catch {
      try {
        const cleaned = standardBlock
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .join('\n');
        const c = forge.pki.certificateFromPem(cleaned);
        certs.push(c);
        pems.push(forge.pki.certificateToPem(c));
      } catch {}
    }
  }

  if (certs.length === 0) {
    const cleanB64 = normalized.replace(/[^A-Za-z0-9+/=]/g, '');
    if (cleanB64.length >= 200) {
      try {
        const wrappedPem = `-----BEGIN CERTIFICATE-----\n${cleanB64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
        const c = forge.pki.certificateFromPem(wrappedPem);
        certs.push(c);
        pems.push(forge.pki.certificateToPem(c));
      } catch {
        try {
          const rawBinary = forge.util.decode64(cleanB64);
          const asn1 = forge.asn1.fromDer(rawBinary);
          const c = forge.pki.certificateFromAsn1(asn1);
          certs.push(c);
          pems.push(forge.pki.certificateToPem(c));
        } catch {}
      }
    }
  }

  return { certs, pems };
}

export async function parseSslPayload(
  source: { file?: File | null; text?: string },
  password?: string
): Promise<{
  certs: forge.pki.Certificate[];
  privateKeyPemPkcs8?: string;
  privateKeyPemPkcs1?: string;
  isPfx: boolean;
  pfxDecrypted: boolean;
}> {
  let rawBinaryOrText = '';
  if (source.file) {
    rawBinaryOrText = await readFileAsBinaryString(source.file);
  } else if (source.text && source.text.trim()) {
    rawBinaryOrText = source.text.trim();
  } else {
    return { certs: [], isPfx: false, pfxDecrypted: false };
  }

  if (rawBinaryOrText.includes('-----BEGIN')) {
    const { certs } = extractPemCertificates(rawBinaryOrText);
    let privateKeyPemPkcs8 = '';
    let privateKeyPemPkcs1 = '';
    try {
      const keyMatch = rawBinaryOrText.match(
        /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/
      );
      if (keyMatch) {
        const keyObj = forge.pki.privateKeyFromPem(keyMatch[0]);
        privateKeyPemPkcs1 = forge.pki.privateKeyToPem(keyObj);
        try {
          const rsaKey = forge.pki.privateKeyToAsn1(keyObj);
          const pki = forge.pki.wrapRsaPrivateKey(rsaKey);
          privateKeyPemPkcs8 = forge.pki.privateKeyInfoToPem(pki);
        } catch {
          privateKeyPemPkcs8 = privateKeyPemPkcs1;
        }
      }
    } catch {}

    return {
      certs,
      privateKeyPemPkcs8: privateKeyPemPkcs8 || undefined,
      privateKeyPemPkcs1: privateKeyPemPkcs1 || undefined,
      isPfx: false,
      pfxDecrypted: false,
    };
  }

  let binaryStr = rawBinaryOrText;
  const cleanB64 = rawBinaryOrText.replace(/[^A-Za-z0-9+/=]/g, '');
  if (!source.file && cleanB64.length >= 200) {
    try {
      binaryStr = forge.util.decode64(cleanB64);
    } catch {}
  }

  try {
    const asn1 = forge.asn1.fromDer(binaryStr);
    try {
      const cert = forge.pki.certificateFromAsn1(asn1);
      return { certs: [cert], isPfx: false, pfxDecrypted: false };
    } catch {
      try {
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password || '');
        const p12Certs: forge.pki.Certificate[] = [];
        let privateKeyPemPkcs8 = '';
        let privateKeyPemPkcs1 = '';

        p12.safeContents.forEach(safeContent => {
          safeContent.safeBags.forEach(bag => {
            if (bag.type === forge.pki.oids.keyBag || bag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
              if (bag.key) {
                privateKeyPemPkcs1 = forge.pki.privateKeyToPem(bag.key);
                try {
                  const rsaPrivateKey = forge.pki.privateKeyToAsn1(bag.key);
                  const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
                  privateKeyPemPkcs8 = forge.pki.privateKeyInfoToPem(privateKeyInfo);
                } catch {
                  privateKeyPemPkcs8 = privateKeyPemPkcs1;
                }
              } else if (bag.asn1) {
                try {
                  const keyDer = forge.asn1.toDer(bag.asn1 as forge.asn1.Asn1).getBytes();
                  const b64 = forge.util.encode64(keyDer);
                  privateKeyPemPkcs8 = `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
                  privateKeyPemPkcs1 = privateKeyPemPkcs8;
                } catch {}
              }
            }
            if (bag.type === forge.pki.oids.certBag && bag.cert) {
              p12Certs.push(bag.cert);
            }
          });
        });

        return {
          certs: p12Certs,
          privateKeyPemPkcs8: privateKeyPemPkcs8 || undefined,
          privateKeyPemPkcs1: privateKeyPemPkcs1 || undefined,
          isPfx: true,
          pfxDecrypted: p12Certs.length > 0 || !!privateKeyPemPkcs8,
        };
      } catch {
        return { certs: [], isPfx: true, pfxDecrypted: false };
      }
    }
  } catch {
    if (cleanB64.length >= 200) {
      const { certs } = extractPemCertificates(cleanB64);
      return { certs, isPfx: false, pfxDecrypted: false };
    }
    return { certs: [], isPfx: false, pfxDecrypted: false };
  }
}

export function buildUnifiedCertAnalysis(certs: forge.pki.Certificate[]) {
  let endEntityCert: forge.pki.Certificate | null = null;
  const caCerts: forge.pki.Certificate[] = [];

  for (const c of certs) {
    if (!isCaCertificate(c) && !endEntityCert) {
      endEntityCert = c;
    } else {
      caCerts.push(c);
    }
  }

  if (!endEntityCert && certs.length > 0) {
    endEntityCert = certs[0];
  }

  const chain: forge.pki.Certificate[] = endEntityCert ? [endEntityCert] : [];
  let currentCert = endEntityCert;

  if (currentCert) {
    while (!isRootCertificate(currentCert)) {
      let parentFound = false;
      for (const candidate of caCerts) {
        if (verifyCertIssuerMatch(currentCert, candidate)) {
          chain.push(candidate);
          currentCert = candidate;
          parentFound = true;
          break;
        }
      }
      if (!parentFound) break;
    }
  }

  const chainPems = chain.map(c => forge.pki.certificateToPem(c));
  const isComplete = chain.length > 0 && isRootCertificate(chain[chain.length - 1]);
  const nextAiaUrl = !isComplete && chain.length > 0 ? extractAiaUrl(chain[chain.length - 1]) : null;

  const cn = endEntityCert ? parseDistinguishedName(endEntityCert.subject) : 'ssl-cert';
  const issuer = endEntityCert ? parseDistinguishedName(endEntityCert.issuer) : '未知';
  const certAlgo = endEntityCert ? getCertKeyAlgorithm(endEntityCert) : '未知演算法';
  const notBeforeStr = endEntityCert ? formatValidityDate(endEntityCert.validity.notBefore) : '未知';
  const notAfterStr = endEntityCert ? formatValidityDate(endEntityCert.validity.notAfter) : '未知';

  const isExpired = endEntityCert ? new Date() > endEntityCert.validity.notAfter : false;
  const isNotYetValid = endEntityCert ? new Date() < endEntityCert.validity.notBefore : false;

  return { endEntityCert, caCerts, chain, chainPems, cn, issuer, certAlgo, notBeforeStr, notAfterStr, isComplete, nextAiaUrl, isExpired, isNotYetValid };
}

export type CertAnalysis = ReturnType<typeof buildUnifiedCertAnalysis>;
