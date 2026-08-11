'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import forge from 'node-forge';
import styles from './ssl-converter.module.css';

type TabType = 'cer-chain-fix' | 'pfx-to-pem' | 'pem-to-pfx' | 'der-to-pem' | 'pem-to-der';

interface OutputItem {
  filename: string;
  content: string;
  label: string;
  isPrivateKey?: boolean;
  contentPkcs1?: string;
  contentPkcs8?: string;
}

interface MetaItem {
  label: string;
  value: string;
  className?: string;
}

interface ResultData {
  meta: MetaItem[];
  outputs: OutputItem[];
  cnName?: string;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'SSL 憑證格式轉換器',
    subtitle: 'SSL CERTIFICATE CONVERTER',
    description:
      '專業免費的線上 SSL 憑證格式轉換工具！支援 PFX/P12, PEM, DER 雙向純前端安全轉換、憑證過期時間自動檢測與私鑰模數配對雜湊比對。',
    langToggleLabel: 'English',
    langToggleUrl: '/ssl-converter/en/',
    tabChainFix: '憑證剖析與自動補鏈',
    tabPfxToPem: 'PFX / P12 轉 PEM',
    tabPemToPfx: 'PEM 轉 PFX / P12',
    tabDerToPem: 'DER 轉 PEM',
    tabPemToDer: 'PEM 轉 DER',

    cerUploadLabel: '上傳 CER / CRT / PEM / DER 憑證檔案',
    cerUploadPrompt: '拖曳 .cer, .crt, .pem 或 .der 憑證至此，或點擊選擇檔案',
    cerUploadSub: '支援二進位 DER 編碼或 Base64 PEM 格式憑證',
    cerTextLabel: '或直接粘貼 PEM 憑證文字 (選填)',
    cerPassLabel: '憑證/私鑰解密保護密碼 (選填)',
    cerPassPlaceholder: '若憑證或加密私鑰含有密碼請輸入 (無加密請留空)',
    cerSubmitBtn: '剖析憑證並自動檢測 AIA 候補憑證鏈',

    pfxUploadLabel: '上傳 PFX / P12 檔案 (.pfx / .p12)',
    pfxUploadPrompt: '拖曳 .pfx 或 .p12 憑證至此，或點擊選擇檔案',
    pfxUploadSub: '支援二進位 PKCS#12 憑證包',
    pfxPassLabel: 'PFX 解密保護密碼',
    pfxPassPlaceholder: '若憑證設有密碼請輸入 (若無密碼請留空)',
    pfxSubmitBtn: '解密並轉換 PEM 憑證鏈與私鑰',

    pemKeyLabel: '私鑰 Private Key (.key)',
    pemCertLabel: '伺服器憑證 Certificate (.crt)',
    pemCaLabel: '中繼憑證鏈 CA Bundle (選填)',
    pemPassLabel: '設定 PFX 保護密碼',
    pemPassPlaceholder: '請輸入加密密碼',
    pemFriendlyNameLabel: '憑證別名 Friendly Name (選填)',
    pemFriendlyNamePlaceholder: '預設：ssl-converter-certificate',
    pemSubmitBtn: '驗證 Modulus 匹配並打包下載 PFX',

    derUploadLabel: '上傳二進位 DER / CER / CRT 檔案',
    derUploadPrompt: '拖曳 .der, .cer 或 .crt 檔案至此，或點擊選擇檔案',
    derUploadSub: '支援二進位 ASN.1 / DER 編碼之憑證或私鑰檔',
    derSubmitBtn: '轉換為 PEM 文字格式',

    pemDerInputLabel: '粘貼 PEM 文字憑證或私鑰 (.crt / .pem / .key)',
    pemDerSubmitBtn: '轉換並下載二進位 DER 檔案',

    removeFile: '移除檔案',
    showPass: '顯示',
    hidePass: '隱藏',
    resultTitle: '憑證剖析與成果明細',
    hideResult: '隱藏結果',
    copyText: '複製文字',
    downloadFile: '下載',
    aiaIncompleteWarning: '偵測到憑證鏈不完整，建議補齊中繼憑證',
    aiaNextFound: (level: number) => `成功解析第 ${level} 層中繼憑證！已偵測到下一層 CA URL`,
    aiaHelpText: '請點擊下方連結下載官方 CA 中繼憑證，並將下載的檔案拖曳至下方上傳區進行合成：',
    aiaSaveAsTip: '貼心提醒：若點擊無法開啟，請右鍵點擊連結選擇「另存連結為...」下載檔案。',
  },
  en: {
    title: 'SSL Certificate Converter',
    subtitle: 'SSL CERTIFICATE CONVERTER',
    description:
      'Professional free online SSL certificate format converter. Convert PFX/P12, PEM, and DER with client-side security, certificate chain auto-fix, and expiration checks.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/ssl-converter/',
    tabChainFix: 'Parse & Fix Chain',
    tabPfxToPem: 'PFX / P12 to PEM',
    tabPemToPfx: 'PEM to PFX / P12',
    tabDerToPem: 'DER to PEM',
    tabPemToDer: 'PEM to DER',

    cerUploadLabel: 'Upload CER / CRT / PEM / DER Certificate File',
    cerUploadPrompt: 'Drag & drop .cer, .crt, .pem or .der file here, or click to browse',
    cerUploadSub: 'Supports binary DER or Base64 PEM encoded certificates',
    cerTextLabel: 'Or paste PEM certificate text directly (Optional)',
    cerPassLabel: 'Decryption Password for Cert/Private Key (Optional)',
    cerPassPlaceholder: 'Enter password if encrypted (Leave empty if none)',
    cerSubmitBtn: 'Parse Certificate & Auto-detect AIA CA Chain',

    pfxUploadLabel: 'Upload PFX / P12 File (.pfx / .p12)',
    pfxUploadPrompt: 'Drag & drop .pfx or .p12 file here, or click to browse',
    pfxUploadSub: 'Supports binary PKCS#12 certificate bundles',
    pfxPassLabel: 'PFX Decryption Password',
    pfxPassPlaceholder: 'Enter password if set (Leave empty if none)',
    pfxSubmitBtn: 'Decrypt & Convert to PEM Certificate Chain & Key',

    pemKeyLabel: 'Private Key (.key)',
    pemCertLabel: 'Server Certificate (.crt)',
    pemCaLabel: 'Intermediate CA Bundle (Optional)',
    pemPassLabel: 'Set PFX Protection Password',
    pemPassPlaceholder: 'Enter encryption password',
    pemFriendlyNameLabel: 'Friendly Name (Optional)',
    pemFriendlyNamePlaceholder: 'Default: ssl-converter-certificate',
    pemSubmitBtn: 'Verify Modulus Match & Package PFX Download',

    derUploadLabel: 'Upload Binary DER / CER / CRT File',
    derUploadPrompt: 'Drag & drop .der, .cer or .crt file here, or click to browse',
    derUploadSub: 'Supports binary ASN.1 / DER encoded certificates or keys',
    derSubmitBtn: 'Convert to PEM Text Format',

    pemDerInputLabel: 'Paste PEM Certificate or Private Key (.crt / .pem / .key)',
    pemDerSubmitBtn: 'Convert & Download Binary DER File',

    removeFile: 'Remove File',
    showPass: 'Show',
    hidePass: 'Hide',
    resultTitle: 'Certificate Parsing & Output Details',
    hideResult: 'Hide Result',
    copyText: 'Copy Text',
    downloadFile: 'Download',
    aiaIncompleteWarning: 'Incomplete certificate chain detected. Intermediate CA recommended.',
    aiaNextFound: (level: number) => `Parsed layer ${level} intermediate CA! Next CA URL detected.`,
    aiaHelpText: 'Click the link below to download the official intermediate CA, then upload it below to synthesize:',
    aiaSaveAsTip: 'Tip: If clicking fails, right-click the link and select "Save Link As..." to download.',
  },
};

function sanitizeDomainName(domainName?: string): string {
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

function generateCertFilename(domainName: string | undefined, typeName: string, ext: string): string {
  const safeCN = sanitizeDomainName(domainName);
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `${safeCN}_${typeName}.${cleanExt}`;
}

async function readFileAsBinaryString(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  return forge.util.binary.raw.encode(bytes);
}

function parseDistinguishedName(dnObj: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '未知';
  for (const attr of dnObj.attributes) {
    if (attr.shortName === 'CN' || attr.name === 'commonName' || attr.type === '2.5.4.3') {
      if (attr.value) return attr.value as string;
    }
  }
  return '無通用名稱';
}

function formatValidityDate(date?: Date): string {
  if (!date) return '未知';
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

function getDnString(dnObj?: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '';
  return dnObj.attributes
    .map(attr => `${attr.shortName || attr.name || attr.type}=${attr.value}`)
    .sort()
    .join(',');
}

function isRootCertificate(certObj?: forge.pki.Certificate): boolean {
  if (!certObj) return false;
  const issuerStr = getDnString(certObj.issuer);
  const subjectStr = getDnString(certObj.subject);
  return issuerStr !== '' && issuerStr === subjectStr;
}

function isCaCertificate(certObj?: forge.pki.Certificate): boolean {
  if (!certObj) return false;
  const ext = certObj.getExtension('basicConstraints');
  if (ext && 'cA' in ext && typeof ext.cA === 'boolean') {
    return ext.cA;
  }
  return isRootCertificate(certObj);
}

function verifyCertIssuerMatch(
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
  } catch {
    // 忽略特定標籤解析失敗
  }

  return true;
}

function extractAiaUrl(certObj: forge.pki.Certificate): string | null {
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
  return match ? match[0] : null;
}

function getCertKeyAlgorithm(certObj: forge.pki.Certificate): string {
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

export default function SslConverterClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<TabType>('cer-chain-fix');

  // CER / CRT 補鏈 狀態
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [cerTextInput, setCerTextInput] = useState<string>('');
  const [cerPassword, setCerPassword] = useState<string>('');

  // PFX to PEM 狀態
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [pfxPassword, setPfxPassword] = useState<string>('');

  // PEM to PFX 狀態
  const [pemKey, setPemKey] = useState<string>('');
  const [pemCert, setPemCert] = useState<string>('');
  const [pemCaBundle, setPemCaBundle] = useState<string>('');
  const [pemPassword, setPemPassword] = useState<string>('');
  const [pemFriendlyName, setPemFriendlyName] = useState<string>('');

  // DER to PEM 狀態
  const [derFile, setDerFile] = useState<File | null>(null);

  // PEM to DER 狀態
  const [pemDerInput, setPemDerInput] = useState<string>('');

  // Accessible IDs
  const cerFileId = useId();
  const cerTextId = useId();
  const cerPassId = useId();
  const pfxFileId = useId();
  const pfxPassId = useId();
  const pemKeyId = useId();
  const pemCertId = useId();
  const pemCaId = useId();
  const pemPassId = useId();
  const pemFriendlyId = useId();
  const derFileId = useId();
  const pemDerInputId = useId();
  const aiaFileInputId = useId();

  // 私鑰顯示格式選擇 (PKCS#8 vs PKCS#1)
  const [keyFormat, setKeyFormat] = useState<'pkcs8' | 'pkcs1'>('pkcs8');

  // 密碼顯示/隱藏切換
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // 提示與警告區域
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'warning' | 'success'; show: boolean }>({
    message: '',
    type: 'error',
    show: false,
  });

  // Toast 浮動提示
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 轉換結果資料
  const [resultData, setResultData] = useState<ResultData | null>(null);

  // AIA 憑證鏈候補修復狀態
  const [currentChainPems, setCurrentChainPems] = useState<string[]>([]);
  const [aiaFixUrl, setAiaFixUrl] = useState<string | null>(null);
  const [aiaError, setAiaError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ffaa');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 170, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const showAlertMsg = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    setAlert({ message, type, show: true });
  };

  const hideAlertMsg = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  const resetAllResults = useCallback(() => {
    setResultData(null);
    setAiaFixUrl(null);
    setAiaError(null);
    setCurrentChainPems([]);
  }, []);

  const toggleShowPassword = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. 頁籤 0: 憑證剖析與自動補鏈 (AIA Check & Chain Builder)
  // ─────────────────────────────────────────────────────────────
  const parseAndFixCerChain = async () => {
    hideAlertMsg();
    try {
      let pemText = '';
      if (cerFile) {
        const binaryStr = await readFileAsBinaryString(cerFile);

        if (binaryStr.includes('-----BEGIN CERTIFICATE-----')) {
          pemText = binaryStr;
        } else {
          try {
            const asn1 = forge.asn1.fromDer(binaryStr);
            const cert = forge.pki.certificateFromAsn1(asn1);
            pemText = forge.pki.certificateToPem(cert);
          } catch {
            pemText = binaryStr;
          }
        }
      } else if (cerTextInput.trim()) {
        pemText = cerTextInput.trim();
      } else {
        showAlertMsg('請上傳憑證檔案或粘貼 PEM 憑證內容。', 'warning');
        return;
      }

      const rawCerts: forge.pki.Certificate[] = [];
      const pemBlocks = pemText.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];

      for (const block of pemBlocks) {
        try {
          const c = forge.pki.certificateFromPem(block);
          rawCerts.push(c);
        } catch {
          // 跳過無法解析的區塊
        }
      }

      if (rawCerts.length === 0) {
        showAlertMsg('無法從輸入內容中剖析出有效的 X.509 憑證 (PEM 格式)。', 'error');
        return;
      }

      let endEntityCert: forge.pki.Certificate | null = null;
      const caCerts: forge.pki.Certificate[] = [];

      for (const c of rawCerts) {
        if (!isCaCertificate(c) && !endEntityCert) {
          endEntityCert = c;
        } else {
          caCerts.push(c);
        }
      }

      if (!endEntityCert) {
        endEntityCert = rawCerts[0];
      }

      const chain: forge.pki.Certificate[] = [endEntityCert];
      let currentCert = endEntityCert;

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

      const chainPems = chain.map(c => forge.pki.certificateToPem(c));
      setCurrentChainPems(chainPems);

      const cn = parseDistinguishedName(endEntityCert.subject);
      const isComplete = isRootCertificate(chain[chain.length - 1]);
      let nextAiaUrl: string | null = null;

      if (!isComplete) {
        nextAiaUrl = extractAiaUrl(chain[chain.length - 1]);
      }

      setAiaFixUrl(nextAiaUrl);

      const isExpired = new Date() > endEntityCert.validity.notAfter;
      const isNotYetValid = new Date() < endEntityCert.validity.notBefore;

      const certAlgo = getCertKeyAlgorithm(endEntityCert);

      const metaList: MetaItem[] = [
        { label: '域名主機 (CN)', value: cn },
        { label: '金鑰與簽章演算法', value: certAlgo, className: 'text-[var(--theme-color,#00ffaa)] font-semibold' },
        { label: '發行機構 (Issuer)', value: parseDistinguishedName(endEntityCert.issuer) },
        { label: '生效時間 (Not Before)', value: formatValidityDate(endEntityCert.validity.notBefore) },
        {
          label: '到期時間 (Not After)',
          value: formatValidityDate(endEntityCert.validity.notAfter),
          className: isExpired ? 'text-red-400 font-bold' : isNotYetValid ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold',
        },
        {
          label: '憑證鏈完整度 (Chain Status)',
          value: isComplete
            ? '完整 (包含 Trust Root / Intermediate CA)'
            : nextAiaUrl
            ? '缺中繼憑證 (可點擊下載 AIA 自動修復)'
            : '未完全補齊 (未偵測到 AIA URL)',
          className: isComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold',
        },
      ];

      const fullChainPem = chainPems.join('\n');
      const outputsList: OutputItem[] = [
        {
          label: '合成後完全憑證鏈 Full Chain PEM (.crt)',
          filename: generateCertFilename(cn, 'fullchain', 'crt'),
          content: fullChainPem,
        },
        {
          label: '僅伺服器用戶端憑證 Server Cert (.crt)',
          filename: generateCertFilename(cn, 'cert', 'crt'),
          content: chainPems[0],
        },
      ];

      if (chainPems.length > 1) {
        outputsList.push({
          label: '中繼憑證鏈 CA Bundle (.ca-bundle)',
          filename: generateCertFilename(cn, 'chain', 'ca-bundle'),
          content: chainPems.slice(1).join('\n'),
        });
      }

      setResultData({
        meta: metaList,
        outputs: outputsList,
        cnName: cn,
      });

      showAlertMsg('憑證剖析與憑證鏈自動檢測完成！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`解析失敗：${error.message || '請確認憑證格式是否正確。'}`, 'error');
    }
  };

  const handleAiaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiaError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const binaryStr = await readFileAsBinaryString(file);
      let newCertPem = '';
      if (binaryStr.includes('-----BEGIN CERTIFICATE-----')) {
        newCertPem = binaryStr;
      } else {
        try {
          const asn1 = forge.asn1.fromDer(binaryStr);
          const cert = forge.pki.certificateFromAsn1(asn1);
          newCertPem = forge.pki.certificateToPem(cert);
        } catch {
          newCertPem = binaryStr;
        }
      }

      const parsedNewCert = forge.pki.certificateFromPem(newCertPem);
      const lastChainPem = currentChainPems[currentChainPems.length - 1];
      const lastChainCert = forge.pki.certificateFromPem(lastChainPem);

      if (!verifyCertIssuerMatch(lastChainCert, parsedNewCert)) {
        setAiaError('上傳的 CA 中繼憑證之 Subject 與現有憑證鏈的 Issuer 不符合，無法串接！');
        return;
      }

      const updatedChain = [...currentChainPems, newCertPem];
      setCurrentChainPems(updatedChain);

      const isComplete = isRootCertificate(parsedNewCert);
      const nextAiaUrl = isComplete ? null : extractAiaUrl(parsedNewCert);
      setAiaFixUrl(nextAiaUrl);

      if (resultData) {
        const cn = resultData.cnName || 'ssl-cert';
        const fullChainPem = updatedChain.join('\n');
        const outputsList: OutputItem[] = [
          {
            label: '合成後完全憑證鏈 Full Chain PEM (.crt)',
            filename: generateCertFilename(cn, 'fullchain', 'crt'),
            content: fullChainPem,
          },
          {
            label: '僅伺服器用戶端憑證 Server Cert (.crt)',
            filename: generateCertFilename(cn, 'cert', 'crt'),
            content: updatedChain[0],
          },
          {
            label: '中繼憑證鏈 CA Bundle (.ca-bundle)',
            filename: generateCertFilename(cn, 'chain', 'ca-bundle'),
            content: updatedChain.slice(1).join('\n'),
          },
        ];

        const updatedMeta = resultData.meta.map(m => {
          if (m.label.includes('憑證鏈完整度')) {
            return {
              label: '憑證鏈完整度 (Chain Status)',
              value: isComplete
                ? '完整 (包含 Trust Root / Intermediate CA)'
                : nextAiaUrl
                ? '缺中繼憑證 (可點擊下載下一層 AIA 自動修復)'
                : '未完全補齊 (未偵測到 AIA URL)',
              className: isComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold',
            };
          }
          return m;
        });

        setResultData({
          ...resultData,
          meta: updatedMeta,
          outputs: outputsList,
        });
      }

      showToast('成功合成中繼憑證！');
    } catch {
      setAiaError('上傳的檔案無效或非合法的 X.509 憑證格式。');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. 頁籤 1: PFX / P12 轉 PEM
  // ─────────────────────────────────────────────────────────────
  const convertPfxToPem = async () => {
    hideAlertMsg();
    if (!pfxFile) {
      showAlertMsg('請選擇 PFX 或 P12 憑證檔案。', 'warning');
      return;
    }

    try {
      const binaryStr = await readFileAsBinaryString(pfxFile);
      const p12Asn1 = forge.asn1.fromDer(binaryStr);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, pfxPassword);

      let privateKeyPemPkcs8 = '';
      let privateKeyPemPkcs1 = '';
      const certPems: string[] = [];
      let serverCn = '';

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
          if (bag.type === forge.pki.oids.certBag) {
            if (bag.cert) {
              const pem = forge.pki.certificateToPem(bag.cert);
              certPems.push(pem);
              if (!serverCn) {
                serverCn = parseDistinguishedName(bag.cert.subject);
              }
            }
          }
        });
      });

      if (certPems.length === 0 && !privateKeyPemPkcs8) {
        showAlertMsg('無法解密 PFX 內容，請確認密碼是否正確。', 'error');
        return;
      }

      const outputsList: OutputItem[] = [];
      const cn = serverCn || 'ssl-cert';

      if (privateKeyPemPkcs8) {
        outputsList.push({
          label: '私鑰 Private Key (.key)',
          filename: generateCertFilename(cn, 'key', 'key'),
          content: privateKeyPemPkcs8,
          isPrivateKey: true,
          contentPkcs8: privateKeyPemPkcs8,
          contentPkcs1: privateKeyPemPkcs1,
        });
      }

      if (certPems.length > 0) {
        outputsList.push({
          label: '伺服器憑證 Certificate (.crt)',
          filename: generateCertFilename(cn, 'cert', 'crt'),
          content: certPems[0],
        });

        if (certPems.length > 1) {
          outputsList.push({
            label: '中繼憑證鏈 CA Bundle (.ca-bundle)',
            filename: generateCertFilename(cn, 'chain', 'ca-bundle'),
            content: certPems.slice(1).join('\n'),
          });
        }
      }

      let certAlgo = '未知演算法';
      if (certPems.length > 0) {
        try {
          const c = forge.pki.certificateFromPem(certPems[0]);
          certAlgo = getCertKeyAlgorithm(c);
        } catch {}
      }

      setResultData({
        meta: [
          { label: '解密主機名稱 (CN)', value: cn },
          { label: '金鑰與簽章演算法', value: certAlgo, className: 'text-[var(--theme-color,#00ffaa)] font-semibold' },
          { label: '解密憑證張數', value: `${certPems.length} 張` },
          { label: '私鑰匯出狀態', value: privateKeyPemPkcs8 ? '已包含私鑰 (RSA / ECC)' : '無私鑰' },
        ],
        outputs: outputsList,
        cnName: cn,
      });

      showAlertMsg('PFX / P12 解密並成功轉換為 PEM 格式！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`PFX 解密失敗：${error.message || '請確認密碼是否輸入正確。'}`, 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. 頁籤 2: PEM 轉 PFX
  // ─────────────────────────────────────────────────────────────
  const convertPemToPfx = async () => {
    hideAlertMsg();
    if (!pemKey.trim() || !pemCert.trim()) {
      showAlertMsg('請貼上私鑰 (Private Key) 與 伺服器憑證 (Certificate)。', 'warning');
      return;
    }

    try {
      const keyObj = forge.pki.privateKeyFromPem(pemKey.trim());
      const certObj = forge.pki.certificateFromPem(pemCert.trim());

      const keyRSA = keyObj as forge.pki.rsa.PrivateKey;
      const certRSA = certObj.publicKey as forge.pki.rsa.PublicKey;

      if (!keyRSA.n || !certRSA.n) {
        showAlertMsg('目前僅支援具有 Modulus 雜湊之 RSA 金鑰與憑證組合。', 'warning');
        return;
      }

      const certModulus = certRSA.n.toString(16);
      const keyModulus = keyRSA.n.toString(16);

      const mdCert = forge.md.md5.create();
      mdCert.update(certModulus);
      const certHash = mdCert.digest().toHex();

      const mdKey = forge.md.md5.create();
      mdKey.update(keyModulus);
      const keyHash = mdKey.digest().toHex();

      if (certHash !== keyHash) {
        showAlertMsg('私鑰與伺服器憑證的 Modulus 雜湊值不符合！這兩組密鑰並非配對。', 'error');
        return;
      }

      const caCertObjs: forge.pki.Certificate[] = [];
      if (pemCaBundle.trim()) {
        const caPemBlocks = pemCaBundle.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
        caPemBlocks.forEach(block => {
          try {
            caCertObjs.push(forge.pki.certificateFromPem(block));
          } catch {}
        });
      }

      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keyObj,
        [certObj, ...caCertObjs],
        pemPassword,
        { friendlyName: pemFriendlyName || 'ssl-converter-certificate', generateLocalKeyId: true }
      );

      const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
      const p12Array = new Uint8Array(p12Der.length);
      for (let i = 0; i < p12Der.length; i++) {
        p12Array[i] = p12Der.charCodeAt(i);
      }

      const cn = parseDistinguishedName(certObj.subject);
      const blob = new Blob([p12Array], { type: 'application/x-pkcs12' });
      triggerDownload(blob, generateCertFilename(cn, 'bundle', 'pfx'));

      setResultData({
        meta: [
          { label: '域名主機 (CN)', value: cn },
          { label: 'Modulus MD5 雜湊配對', value: `${certHash.substring(0, 8)}... (100% 吻合)`, className: 'font-bold text-text-main' },
          { label: '打包中繼憑證數量', value: `${caCertObjs.length} 張` },
        ],
        outputs: [],
        cnName: cn,
      });

      showAlertMsg('Modulus 配對成功！PFX 打包完成並已觸發下載。', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`打包 PFX 失敗：${error.message || '請確認 PEM 格式與密鑰正確性。'}`, 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. 頁籤 3: DER 轉 PEM
  // ─────────────────────────────────────────────────────────────
  const convertDerToPem = async () => {
    hideAlertMsg();
    if (!derFile) {
      showAlertMsg('請上傳二進位 DER / CER / CRT 檔案。', 'warning');
      return;
    }

    try {
      const binaryStr = await readFileAsBinaryString(derFile);
      let pemResult = '';
      let fileTypeLabel = '';
      let cnName = 'ssl-cert';

      if (binaryStr.includes('-----BEGIN')) {
        pemResult = binaryStr;
        fileTypeLabel = '已是 PEM 格式文字';
      } else {
        try {
          const asn1 = forge.asn1.fromDer(binaryStr);
          try {
            const cert = forge.pki.certificateFromAsn1(asn1);
            pemResult = forge.pki.certificateToPem(cert);
            cnName = parseDistinguishedName(cert.subject);
            fileTypeLabel = 'X.509 DER 憑證 (Certificate)';
          } catch {
            const key = forge.pki.privateKeyFromAsn1(asn1);
            pemResult = forge.pki.privateKeyToPem(key);
            fileTypeLabel = 'DER RSA 私鑰 (Private Key)';
          }
        } catch {
          showAlertMsg('無法解構二進位 DER 內容，請確認是否為合法的 DER 編碼檔。', 'error');
          return;
        }
      }

      setResultData({
        meta: [
          { label: '檔案識別類型', value: fileTypeLabel },
          { label: '原始檔名', value: derFile.name },
        ],
        outputs: [
          {
            label: '轉換後 PEM 文字',
            filename: `${derFile.name.replace(/\.[^/.]+$/, '')}.pem`,
            content: pemResult,
          },
        ],
        cnName,
      });

      showAlertMsg('DER 成功轉換為 PEM 格式！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`轉換失敗：${error.message || '檔案格式錯誤。'}`, 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. 頁籤 4: PEM 轉 DER
  // ─────────────────────────────────────────────────────────────
  const convertPemToDer = () => {
    hideAlertMsg();
    if (!pemDerInput.trim()) {
      showAlertMsg('請貼上 PEM 格式憑證或私鑰文字。', 'warning');
      return;
    }

    try {
      let derBytes = '';
      let filename = 'converted.der';

      if (pemDerInput.includes('PRIVATE KEY-----')) {
        const key = forge.pki.privateKeyFromPem(pemDerInput.trim());
        const asn1 = forge.pki.privateKeyToAsn1(key);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        filename = 'private-key.der';
      } else if (pemDerInput.includes('CERTIFICATE-----')) {
        const cert = forge.pki.certificateFromPem(pemDerInput.trim());
        const asn1 = forge.pki.certificateToAsn1(cert);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        const cn = parseDistinguishedName(cert.subject);
        filename = generateCertFilename(cn, 'cert', 'der');
      } else {
        showAlertMsg('未識別到 -----BEGIN 的 PEM 標頭區塊。', 'error');
        return;
      }

      const derArray = new Uint8Array(derBytes.length);
      for (let i = 0; i < derBytes.length; i++) {
        derArray[i] = derBytes.charCodeAt(i);
      }

      const blob = new Blob([derArray], { type: 'application/x-x509-ca-cert' });
      triggerDownload(blob, filename);

      showAlertMsg('PEM 轉 DER 打包成功並已觸發下載！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`轉換失敗：${error.message || '請確認輸入的是否為合法的 PEM 格式內容。'}`, 'error');
    }
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#00ffaa"
        accentGlow="rgba(0, 255, 170, 0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
          >
            {t.langToggleLabel}
          </Link>
        }
      >
        <div className={styles.mainLayout}>

          {/* 警告/訊息提示方塊 */}
          {alert.show && (
            <div
              className={`p-4 mb-6 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium transition-all ${
                alert.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-surface-glass border-border-glass text-text-main'
              }`}
            >
              <span>{alert.message}</span>
              <button onClick={hideAlertMsg} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          )}

          {/* 5 大功能頁籤 */}
          <div className={`${styles.tabNavContainer} mb-6`}>
            {[
              { id: 'cer-chain-fix', label: t.tabChainFix },
              { id: 'pfx-to-pem', label: t.tabPfxToPem },
              { id: 'pem-to-pfx', label: t.tabPemToPfx },
              { id: 'der-to-pem', label: t.tabDerToPem },
              { id: 'pem-to-der', label: t.tabPemToDer },
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  resetAllResults();
                }}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 頁籤 0: 憑證剖析與自動補鏈 */}
          {activeTab === 'cer-chain-fix' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-2">
                <label htmlFor={cerFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.cerUploadLabel}
                </label>
                {!cerFile ? (
                  <div className={styles.uploadZone}>
                    <input
                      id={cerFileId}
                      type="file"
                      accept=".cer,.crt,.pem,.der"
                      className={styles.fileInput}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setCerFile(e.target.files[0]);
                          hideAlertMsg();
                        }
                      }}
                    />
                    <svg viewBox="0 0 24 24" className="w-12 h-12 fill-text-sub">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <p className="text-sm text-text-sub font-medium">{t.cerUploadPrompt}</p>
                    <span className="text-xs text-text-sub opacity-80">{t.cerUploadSub}</span>
                  </div>
                ) : (
                  <div className={styles.fileBadgeSuccess}>
                    <span className="font-medium">{cerFile.name} ({(cerFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCerFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
                <label htmlFor={cerTextId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.cerTextLabel}
                </label>
                <textarea
                  id={cerTextId}
                  rows={5}
                  placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                  value={cerTextInput}
                  onChange={e => setCerTextInput(e.target.value)}
                  className={styles.customTextarea}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
                <label htmlFor={cerPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.cerPassLabel}
                </label>
                <div className="relative">
                  <input
                    id={cerPassId}
                    type={showPassword['cerPass'] ? 'text' : 'password'}
                    placeholder={t.cerPassPlaceholder}
                    value={cerPassword}
                    onChange={e => setCerPassword(e.target.value)}
                    className={styles.customInput}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('cerPass')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer text-xs"
                  >
                    {showPassword['cerPass'] ? t.hidePass : t.showPass}
                  </button>
                </div>
              </div>

              <button type="button" onClick={parseAndFixCerChain} className={styles.btnSubmit}>
                {t.cerSubmitBtn}
              </button>
            </div>
          )}

          {/* 頁籤 1: PFX 轉 PEM */}
          {activeTab === 'pfx-to-pem' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-2">
                <label htmlFor={pfxFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pfxUploadLabel}
                </label>
                {!pfxFile ? (
                  <div className={styles.uploadZone}>
                    <input
                      id={pfxFileId}
                      type="file"
                      accept=".pfx,.p12"
                      className={styles.fileInput}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setPfxFile(e.target.files[0]);
                          hideAlertMsg();
                        }
                      }}
                    />
                    <svg viewBox="0 0 24 24" className="w-12 h-12 fill-text-sub">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <p className="text-sm text-text-sub font-medium">{t.pfxUploadPrompt}</p>
                    <span className="text-xs text-text-sub opacity-80">{t.pfxUploadSub}</span>
                  </div>
                ) : (
                  <div className={styles.fileBadgeSuccess}>
                    <span className="font-medium">{pfxFile.name} ({(pfxFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPfxFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
                <label htmlFor={pfxPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pfxPassLabel}
                </label>
                <div className="relative">
                  <input
                    id={pfxPassId}
                    type={showPassword['pfx'] ? 'text' : 'password'}
                    placeholder={t.pfxPassPlaceholder}
                    value={pfxPassword}
                    onChange={e => setPfxPassword(e.target.value)}
                    className={styles.customInput}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('pfx')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer text-xs"
                  >
                    {showPassword['pfx'] ? t.hidePass : t.showPass}
                  </button>
                </div>
              </div>

              <button type="button" onClick={convertPfxToPem} className={styles.btnSubmit}>
                {t.pfxSubmitBtn}
              </button>
            </div>
          )}

          {/* 頁籤 2: PEM 轉 PFX */}
          {activeTab === 'pem-to-pfx' && (
            <div className={styles.panelCard}>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={pemKeyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    {t.pemKeyLabel} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id={pemKeyId}
                    rows={6}
                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                    value={pemKey}
                    onChange={e => setPemKey(e.target.value)}
                    className={styles.customTextarea}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={pemCertId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    {t.pemCertLabel} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id={pemCertId}
                    rows={6}
                    placeholder="-----BEGIN CERTIFICATE-----\n..."
                    value={pemCert}
                    onChange={e => setPemCert(e.target.value)}
                    className={styles.customTextarea}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
                <label htmlFor={pemCaId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pemCaLabel}
                </label>
                <textarea
                  id={pemCaId}
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----\n..."
                  value={pemCaBundle}
                  onChange={e => setPemCaBundle(e.target.value)}
                  className={styles.customTextarea}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={pemPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    {t.pemPassLabel} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={pemPassId}
                      type={showPassword['pemToPfx'] ? 'text' : 'password'}
                      placeholder={t.pemPassPlaceholder}
                      value={pemPassword}
                      onChange={e => setPemPassword(e.target.value)}
                      className={styles.customInput}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('pemToPfx')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer text-xs"
                    >
                      {showPassword['pemToPfx'] ? t.hidePass : t.showPass}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={pemFriendlyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    {t.pemFriendlyNameLabel}
                  </label>
                  <input
                    id={pemFriendlyId}
                    type="text"
                    placeholder={t.pemFriendlyNamePlaceholder}
                    value={pemFriendlyName}
                    onChange={e => setPemFriendlyName(e.target.value)}
                    className={styles.customInput}
                  />
                </div>
              </div>

              <button type="button" onClick={convertPemToPfx} className={styles.btnSubmit}>
                {t.pemSubmitBtn}
              </button>
            </div>
          )}

          {/* 頁籤 3: DER 轉 PEM */}
          {activeTab === 'der-to-pem' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-2">
                <label htmlFor={derFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.derUploadLabel}
                </label>
                {!derFile ? (
                  <div className={styles.uploadZone}>
                    <input
                      id={derFileId}
                      type="file"
                      accept=".der,.cer,.crt"
                      className={styles.fileInput}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setDerFile(e.target.files[0]);
                          hideAlertMsg();
                        }
                      }}
                    />
                    <svg viewBox="0 0 24 24" className="w-12 h-12 fill-text-sub">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <p className="text-sm text-text-sub font-medium">{t.derUploadPrompt}</p>
                    <span className="text-xs text-text-sub opacity-80">{t.derUploadSub}</span>
                  </div>
                ) : (
                  <div className={styles.fileBadgeSuccess}>
                    <span className="font-medium">{derFile.name} ({(derFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDerFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                )}
              </div>

              <button type="button" onClick={convertDerToPem} className={styles.btnSubmit}>
                {t.derSubmitBtn}
              </button>
            </div>
          )}

          {/* 頁籤 4: PEM 轉 DER */}
          {activeTab === 'pem-to-der' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-2">
                <label htmlFor={pemDerInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pemDerInputLabel}
                </label>
                <textarea
                  id={pemDerInputId}
                  rows={8}
                  placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                  value={pemDerInput}
                  onChange={e => setPemDerInput(e.target.value)}
                  className={styles.customTextarea}
                />
              </div>

              <button type="button" onClick={convertPemToDer} className={styles.btnSubmit}>
                {t.pemDerSubmitBtn}
              </button>
            </div>
          )}

          {/* 轉換結果區塊 */}
          {resultData && (
            <div className={styles.resultSection}>
              <div className="flex justify-between items-center border-b border-border-glass pb-3">
                <h3 className={`text-sm uppercase tracking-[1px] font-semibold ${styles.accentText}`}>
                  {t.resultTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setResultData(null);
                    setAiaFixUrl(null);
                  }}
                  className={styles.btnSecondary}
                >
                  {t.hideResult}
                </button>
              </div>

              {/* AIA 憑證鏈候補修復卡片 */}
              {aiaFixUrl && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    {currentChainPems.length === 1 ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-300 shrink-0">
                        <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-400 shrink-0">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                    <span>
                      {currentChainPems.length === 1
                        ? t.aiaIncompleteWarning
                        : t.aiaNextFound(currentChainPems.length - 1)}
                    </span>
                  </div>

                  <div className="text-sm text-text-sub flex flex-col gap-2 leading-relaxed">
                    <p>{t.aiaHelpText}</p>
                    <div className="flex flex-col gap-1 bg-surface-glass p-3 rounded-xl border border-border-glass">
                      <a
                        href={aiaFixUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.accentText} underline font-mono text-xs break-all hover:text-text-main transition-colors`}
                      >
                        {aiaFixUrl}
                      </a>
                      <div className="flex items-center gap-1.5 text-xs text-text-sub opacity-80 mt-1">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[var(--theme-color,#00ffaa)] shrink-0">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                        <span>{t.aiaSaveAsTip}</span>
                      </div>
                    </div>
                  </div>

                  {aiaError && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-mono shadow-md animate-fadeIn">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-400 shrink-0 mt-0.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{aiaError}</span>
                    </div>
                  )}

                  <div className={styles.uploadZone}>
                    <input
                      id={aiaFileInputId}
                      type="file"
                      accept=".cer,.crt,.der,.pem"
                      className={styles.fileInput}
                      onChange={handleAiaFileUpload}
                    />
                    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-amber-300">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-amber-200">
                        拖曳已下載的 CA 中繼憑證檔案至此，或點擊選擇檔案
                      </span>
                      <span className="text-xs text-amber-200/70">
                        系統將自動為您驗證並合成進入現有憑證鏈中
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 憑證元資料列表 */}
              {resultData.meta && resultData.meta.length > 0 && (
                <div className={styles.metaGrid}>
                  {resultData.meta.map((m, idx) => (
                    <div key={idx} className={styles.metaCard}>
                      <span className="text-xs text-text-sub uppercase tracking-[0.5px] font-semibold">{m.label}</span>
                      <span className={`text-sm font-mono ${m.className || 'text-text-main font-semibold'}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 輸出憑證檔案列表 */}
              {resultData.outputs && resultData.outputs.length > 0 && (
                <div className="flex flex-col gap-4">
                  {resultData.outputs.map((out, idx) => {
                    const displayContent =
                      out.isPrivateKey && keyFormat === 'pkcs1' && out.contentPkcs1
                        ? out.contentPkcs1
                        : out.content;

                    const downloadFilename =
                      out.isPrivateKey && keyFormat === 'pkcs1'
                        ? out.filename.replace(/\.key$/, '_pkcs1.key')
                        : out.filename;

                    return (
                      <div key={idx} className={styles.outputCard}>
                        <div className="flex justify-between items-center border-b border-border-glass pb-2 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                          <span className={`text-sm font-bold font-mono ${styles.accentText}`}>{out.label}</span>
                          <div className="flex items-center gap-2">
                            {out.isPrivateKey && (
                              <div className="flex items-center gap-1 bg-surface-glass px-2 py-1 rounded-xl border border-border-glass text-xs">
                                <button
                                  type="button"
                                  onClick={() => setKeyFormat('pkcs8')}
                                  className={`px-2 py-0.5 rounded-lg ${keyFormat === 'pkcs8' ? 'bg-[var(--theme-color,#00ffaa)]/20 text-[var(--theme-color,#00ffaa)] font-bold' : 'text-text-sub'}`}
                                >
                                  PKCS#8
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setKeyFormat('pkcs1')}
                                  className={`px-2 py-0.5 rounded-lg ${keyFormat === 'pkcs1' ? 'bg-[var(--theme-color,#00ffaa)]/20 text-[var(--theme-color,#00ffaa)] font-bold' : 'text-text-sub'}`}
                                >
                                  PKCS#1
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(displayContent).then(() => showToast(`已複製 ${downloadFilename}`));
                              }}
                              className={styles.btnSecondary}
                            >
                              {t.copyText}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([displayContent], { type: 'text/plain' });
                                triggerDownload(blob, downloadFilename);
                              }}
                              className={styles.btnPrimarySmall}
                            >
                              {t.downloadFile} {downloadFilename}
                            </button>
                          </div>
                        </div>

                        <pre className={styles.certOutput}>{displayContent}</pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-surface-glass border border-border-glass backdrop-blur-md text-text-main shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </>
  );
}
