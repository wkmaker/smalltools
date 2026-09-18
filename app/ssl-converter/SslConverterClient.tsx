'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import forge from 'node-forge';
import styles from './ssl-converter.module.css';
import {
  sanitizeDomainName,
  generateCertFilename,
  parseDistinguishedName,
  verifyCertIssuerMatch,
  extractPemCertificates,
  parseSslPayload,
  buildUnifiedCertAnalysis,
} from './engine';
import { downloadBlob } from '../utils/downloadBlob';
import { TRANSLATIONS } from './translations';

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


function buildStandardMetaGrid(
  analysis: ReturnType<typeof buildUnifiedCertAnalysis>,
  extra?: { privateKeyStatus?: string }
): MetaItem[] {
  const meta: MetaItem[] = [
    { label: '域名主機 (CN)', value: analysis.cn },
    { label: '金鑰與簽章演算法', value: analysis.certAlgo, className: styles.statusSuccess },
    { label: '發行機構 (Issuer)', value: analysis.issuer },
    { label: '生效時間 (Not Before)', value: analysis.notBeforeStr },
    {
      label: '到期時間 (Not After)',
      value: analysis.notAfterStr,
      className: analysis.isExpired ? styles.statusDanger : analysis.isNotYetValid ? styles.statusWarning : styles.statusSuccess,
    },
    {
      label: '憑證鏈完整度 (Chain Status)',
      value: analysis.isComplete
        ? '完整 (包含 Trust Root / Intermediate CA)'
        : analysis.nextAiaUrl
        ? '缺中繼憑證 (可點擊下載 AIA 自動修復)'
        : analysis.chainPems.length > 1
        ? '已包含部分中繼憑證'
        : '未完全補齊 (未偵測到 AIA URL)',
      className: analysis.isComplete ? styles.statusSuccess : styles.statusWarning,
    },
  ];

  if (extra?.privateKeyStatus) {
    meta.push({
      label: '私鑰狀態',
      value: extra.privateKeyStatus,
      className: styles.statusSuccess,
    });
  }

  return meta;
}

export default function SslConverterClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<TabType>('cer-chain-fix');

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [cerTextInput, setCerTextInput] = useState<string>('');
  const [cerPassword, setCerPassword] = useState<string>('');
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [pfxPassword, setPfxPassword] = useState<string>('');
  const [pemKey, setPemKey] = useState<string>('');
  const [pemCert, setPemCert] = useState<string>('');
  const [pemCaBundle, setPemCaBundle] = useState<string>('');
  const [pemPassword, setPemPassword] = useState<string>('');
  const [pemFriendlyName, setPemFriendlyName] = useState<string>('');
  const [derFile, setDerFile] = useState<File | null>(null);
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

  const sendCertToChainFix = (certContent: string) => {
    setCerFile(null);
    setCerTextInput(certContent);
    setActiveTab('cer-chain-fix');
    showToast(t.toastSentToChainFix);
  };

  const handleClearCurrentTab = () => {
    if (activeTab === 'cer-chain-fix') {
      setCerFile(null);
      setCerTextInput('');
      setCerPassword('');
    } else if (activeTab === 'pfx-to-pem') {
      setPfxFile(null);
      setPfxPassword('');
    } else if (activeTab === 'pem-to-pfx') {
      setPemKey('');
      setPemCert('');
      setPemCaBundle('');
      setPemPassword('');
      setPemFriendlyName('');
    } else if (activeTab === 'der-to-pem') {
      setDerFile(null);
    } else if (activeTab === 'pem-to-der') {
      setPemDerInput('');
    }
    resetAllResults();
    hideAlertMsg();
    showToast(t.toastCleared);
  };

  const parseAndFixCerChain = async () => {
    hideAlertMsg();
    if (!cerFile && !cerTextInput.trim()) {
      showAlertMsg('請上傳憑證檔案或粘貼 PEM 憑證內容。', 'warning');
      return;
    }
    try {
      const parsed = await parseSslPayload({ file: cerFile, text: cerTextInput }, cerPassword);
      if (parsed.isPfx && !parsed.pfxDecrypted) {
        showAlertMsg('PFX / P12 檔案解密失敗！若憑證設有保護密碼，請在下方「密碼」欄位輸入正確密碼後重試。', 'error');
        return;
      }
      if (parsed.certs.length === 0) {
        showAlertMsg('無法從輸入內容中剖析出有效的 X.509 憑證。請確認內容是否包含標準憑證區塊，或確認 PFX 密碼是否正確。', 'error');
        return;
      }
      const analysis = buildUnifiedCertAnalysis(parsed.certs);
      setCurrentChainPems(analysis.chainPems);
      setAiaFixUrl(analysis.nextAiaUrl);
      const cn = analysis.cn;
      const outputsList: OutputItem[] = [
        { label: '合成後完全憑證鏈 Full Chain PEM (.crt)', filename: generateCertFilename(cn, 'fullchain', 'crt'), content: analysis.chainPems.map(p => p.trim()).join('\n') },
        { label: '僅伺服器用戶端憑證 Server Cert (.crt)', filename: generateCertFilename(cn, 'cert', 'crt'), content: analysis.chainPems[0].trim() }
      ];
      if (analysis.chainPems.length > 1) {
        outputsList.push({ label: '中繼憑證鏈 CA Bundle (.ca-bundle)', filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n') });
      }
      const hasPrivateKey = !!parsed.privateKeyPemPkcs8;
      setResultData({
        meta: buildStandardMetaGrid(analysis, {
          privateKeyStatus: hasPrivateKey
            ? '檔案內包含私鑰 (本頁僅處理憑證補鏈，不匯出私鑰)'
            : '檔案內未包含私鑰 (僅 X.509 憑證)',
        }),
        outputs: outputsList,
        cnName: cn,
      });
      showAlertMsg('憑證剖析與憑證鏈自動檢測完成！', 'success');
    } catch (err: any) {
      showAlertMsg(`解析失敗：${err.message || '請確認憑證格式或密碼是否正確。'}`, 'error');
    }
  };

  const handleAiaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiaError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedAia = await parseSslPayload({ file });
      if (parsedAia.certs.length === 0) {
        setAiaError('上傳的檔案無效或非合法的 X.509 憑證格式。');
        return;
      }
      const parsedNewCert = parsedAia.certs[0];
      const lastChainCert = forge.pki.certificateFromPem(currentChainPems[currentChainPems.length - 1]);
      if (!verifyCertIssuerMatch(lastChainCert, parsedNewCert)) {
        setAiaError('上傳的 CA 中繼憑證之 Subject 與現有憑證鏈的 Issuer 不符合，無法串接！');
        return;
      }
      const updatedChainPems = [...currentChainPems, forge.pki.certificateToPem(parsedNewCert).trim()];
      setCurrentChainPems(updatedChainPems);
      const analysis = buildUnifiedCertAnalysis(updatedChainPems.map(p => forge.pki.certificateFromPem(p)));
      setAiaFixUrl(analysis.nextAiaUrl);
      if (resultData) {
        const cn = analysis.cn;
        const outputsList: OutputItem[] = [];
        const existingPrivateKey = resultData.outputs.find(o => o.isPrivateKey);
        if (existingPrivateKey) outputsList.push(existingPrivateKey);
        outputsList.push(
          { label: '合成後完全憑證鏈 Full Chain PEM (.crt)', filename: generateCertFilename(cn, 'fullchain', 'crt'), content: updatedChainPems.map(p => p.trim()).join('\n') },
          { label: '僅伺服器用戶端憑證 Server Cert (.crt)', filename: generateCertFilename(cn, 'cert', 'crt'), content: updatedChainPems[0].trim() }
        );
        if (updatedChainPems.length > 1) {
          outputsList.push({ label: '中繼憑證鏈 CA Bundle (.ca-bundle)', filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: updatedChainPems.slice(1).map(p => p.trim()).join('\n') });
        }
        const previousKeyStatus = resultData.meta.find(m => m.label === '私鑰狀態')?.value;
        setResultData({
          meta: buildStandardMetaGrid(analysis, previousKeyStatus ? { privateKeyStatus: previousKeyStatus } : undefined),
          outputs: outputsList,
          cnName: cn
        });
      }
    } catch { setAiaError('上傳的檔案無效或非合法的 X.509 憑證格式。'); }
  };

  const convertPfxToPem = async () => {
    hideAlertMsg();
    if (!pfxFile) {
      showAlertMsg('請選擇 PFX 或 P12 憑證檔案。', 'warning');
      return;
    }
    try {
      const parsed = await parseSslPayload({ file: pfxFile }, pfxPassword);
      if (parsed.isPfx && !parsed.pfxDecrypted) {
        showAlertMsg('PFX / P12 解密失敗，請確認密碼是否正確。', 'error');
        return;
      }
      const analysis = buildUnifiedCertAnalysis(parsed.certs);
      setCurrentChainPems(analysis.chainPems);
      setAiaFixUrl(analysis.nextAiaUrl);
      const cn = analysis.cn || 'ssl-cert';
      const outputsList: OutputItem[] = [];
      if (parsed.privateKeyPemPkcs8) {
        outputsList.push({ label: '私鑰 Private Key (.key)', filename: generateCertFilename(cn, 'key', 'key'), content: parsed.privateKeyPemPkcs8, isPrivateKey: true, contentPkcs8: parsed.privateKeyPemPkcs8, contentPkcs1: parsed.privateKeyPemPkcs1 || parsed.privateKeyPemPkcs8 });
      }
      if (analysis.chainPems.length > 0) {
        if (analysis.chainPems.length > 1) {
          outputsList.push({ label: '合成後完全憑證鏈 Full Chain PEM (.crt)', filename: generateCertFilename(cn, 'fullchain', 'crt'), content: analysis.chainPems.map(p => p.trim()).join('\n') });
        }
        outputsList.push({ label: '伺服器憑證 Certificate (.crt)', filename: generateCertFilename(cn, 'cert', 'crt'), content: analysis.chainPems[0].trim() });
        if (analysis.chainPems.length > 1) {
          outputsList.push({ label: '中繼憑證鏈 CA Bundle (.ca-bundle)', filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n') });
        }
      }
      setResultData({
        meta: buildStandardMetaGrid(analysis, { privateKeyStatus: parsed.privateKeyPemPkcs8 ? '已隨 PFX 解密提煉私鑰 (已產出 .key 檔案)' : '無私鑰' }),
        outputs: outputsList,
        cnName: cn
      });
      showAlertMsg('PFX / P12 解密成功！已自動分析憑證鏈狀態。', 'success');
    } catch (err: any) {
      showAlertMsg(`PFX 解密失敗：${err.message || '請確認密碼是否輸入正確。'}`, 'error');
    }
  };

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
        const { certs: parsedCaCerts } = extractPemCertificates(pemCaBundle);
        parsedCaCerts.forEach(c => caCertObjs.push(c));
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
      const friendlyNameClean = pemFriendlyName.trim();
      const pfxBaseName = friendlyNameClean ? sanitizeDomainName(friendlyNameClean) : sanitizeDomainName(cn);
      const pfxDownloadFilename = `${pfxBaseName}_bundle.pfx`;

      const blob = new Blob([p12Array], { type: 'application/x-pkcs12' });
      downloadBlob(blob, pfxDownloadFilename);

      const analysis = buildUnifiedCertAnalysis([certObj, ...caCertObjs]);
      const standardMeta = buildStandardMetaGrid(analysis, {
        privateKeyStatus: 'Modulus 100% 吻合並已封裝私鑰',
      });
      if (friendlyNameClean) {
        standardMeta.push({
          label: '憑證別名 (Friendly Name)',
          value: friendlyNameClean,
          className: styles.statusSuccess,
        });
      }

      setResultData({
        meta: standardMeta,
        outputs: [],
        cnName: cn,
      });

      showAlertMsg('Modulus 配對成功！PFX 打包完成並已觸發下載。', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`打包 PFX 失敗：${error.message || '請確認 PEM 格式與密鑰正確性。'}`, 'error');
    }
  };

  const convertDerToPem = async () => {
    hideAlertMsg();
    if (!derFile) {
      showAlertMsg('請上傳二進位 DER / CER / CRT 檔案。', 'warning');
      return;
    }

    try {
      const parsed = await parseSslPayload({ file: derFile });
      if (parsed.certs.length === 0 && !parsed.privateKeyPemPkcs8) {
        showAlertMsg('無法解構二進位 DER 內容，請確認是否為合法的 DER 編碼檔。', 'error');
        return;
      }

      const outputsList: OutputItem[] = [];
      let cn = 'ssl-cert';

      if (parsed.certs.length > 0) {
        const analysis = buildUnifiedCertAnalysis(parsed.certs);
        cn = analysis.cn;
        const fullChainPem = analysis.chainPems.map(p => p.trim()).join('\n');

        if (analysis.chainPems.length > 1) {
          outputsList.push({
            label: '合成後完全憑證鏈 Full Chain PEM (.crt)',
            filename: generateCertFilename(cn, 'fullchain', 'crt'),
            content: fullChainPem,
          });
        }

        outputsList.push({
          label: '伺服器憑證 Certificate (.crt)',
          filename: generateCertFilename(cn, 'cert', 'crt'),
          content: analysis.chainPems[0].trim(),
        });

        if (analysis.chainPems.length > 1) {
          outputsList.push({
            label: '中繼憑證鏈 CA Bundle (.ca-bundle)',
            filename: generateCertFilename(cn, 'chain', 'ca-bundle'),
            content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n'),
          });
        }

        const standardMeta = buildStandardMetaGrid(analysis);

        setResultData({
          meta: standardMeta,
          outputs: outputsList,
          cnName: cn,
        });
      } else if (parsed.privateKeyPemPkcs8) {
        outputsList.push({
          label: '私鑰 Private Key (.key)',
          filename: generateCertFilename('ssl-key', 'key', 'key'),
          content: parsed.privateKeyPemPkcs8,
          isPrivateKey: true,
          contentPkcs8: parsed.privateKeyPemPkcs8,
          contentPkcs1: parsed.privateKeyPemPkcs1 || parsed.privateKeyPemPkcs8,
        });

        setResultData({
          meta: [
            { label: '檔案識別類型', value: 'DER RSA 私鑰 (Private Key)' },
            { label: '原始檔名', value: derFile.name },
            { label: '私鑰匯出狀態', value: '已提煉私鑰', className: 'text-[var(--theme-color,#00ffaa)] font-bold' },
          ],
          outputs: outputsList,
          cnName: 'ssl-key',
        });
      }

      showAlertMsg('二進位 DER 成功轉換為 PEM 格式！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`轉換失敗：${error.message || '請確認是否為合法的 DER 編碼檔。'}`, 'error');
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
      downloadBlob(blob, filename);

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
              <button onClick={hideAlertMsg} className="p-1 opacity-70 hover:opacity-100 cursor-pointer" aria-label={t.closeAlert}>
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
                      accept=".cer,.crt,.pem,.der,.pfx,.p12"
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

              <div className={styles.btnGroup}>
                <button type="button" onClick={parseAndFixCerChain} className={styles.btnSubmit}>
                  {t.cerSubmitBtn}
                </button>
                <button type="button" onClick={handleClearCurrentTab} className={styles.btnClear} title={t.clearBtn}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>{t.clearBtn}</span>
                </button>
              </div>
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

              <div className={styles.btnGroup}>
                <button type="button" onClick={convertPfxToPem} className={styles.btnSubmit}>
                  {t.pfxSubmitBtn}
                </button>
                <button type="button" onClick={handleClearCurrentTab} className={styles.btnClear} title={t.clearBtn}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>{t.clearBtn}</span>
                </button>
              </div>
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

              <div className={styles.btnGroup}>
                <button type="button" onClick={convertPemToPfx} className={styles.btnSubmit}>
                  {t.pemSubmitBtn}
                </button>
                <button type="button" onClick={handleClearCurrentTab} className={styles.btnClear} title={t.clearBtn}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>{t.clearBtn}</span>
                </button>
              </div>
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

              <div className={styles.btnGroup}>
                <button type="button" onClick={convertDerToPem} className={styles.btnSubmit}>
                  {t.derSubmitBtn}
                </button>
                <button type="button" onClick={handleClearCurrentTab} className={styles.btnClear} title={t.clearBtn}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>{t.clearBtn}</span>
                </button>
              </div>
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

              <div className={styles.btnGroup}>
                <button type="button" onClick={convertPemToDer} className={styles.btnSubmit}>
                  {t.pemDerSubmitBtn}
                </button>
                <button type="button" onClick={handleClearCurrentTab} className={styles.btnClear} title={t.clearBtn}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>{t.clearBtn}</span>
                </button>
              </div>
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
                <div className={styles.aiaNoticeCard}>
                  <div className={styles.aiaNoticeHeader}>
                    {currentChainPems.length === 1 ? (
                      <svg viewBox="0 0 24 24" className={styles.aiaNoticeHeaderIcon}>
                        <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className={`w-5 h-5 ${styles.accentText} shrink-0`}>
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
                        <svg viewBox="0 0 24 24" className={`w-4 h-4 ${styles.accentText} shrink-0`}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                        <span>{t.aiaSaveAsTip}</span>
                      </div>
                    </div>
                  </div>

                  {aiaError && (
                    <div className={styles.aiaErrorBox}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0 mt-0.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{aiaError}</span>
                    </div>
                  )}

                  <div className={styles.aiaUploadZone}>
                    <input
                      id={aiaFileInputId}
                      type="file"
                      accept=".cer,.crt,.der,.pem"
                      className={styles.fileInput}
                      onChange={handleAiaFileUpload}
                    />
                    <svg viewBox="0 0 24 24" className={styles.aiaUploadIcon}>
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <span className={styles.aiaUploadPrompt}>
                        {t.aiaUploadPrompt}
                      </span>
                      <span className={styles.aiaUploadSub}>
                        {t.aiaUploadSub}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            {out.isPrivateKey && (
                              <div className={styles.formatToggleContainer}>
                                <button
                                  type="button"
                                  onClick={() => setKeyFormat('pkcs8')}
                                  className={`${styles.formatBtn} ${keyFormat === 'pkcs8' ? styles.formatBtnActive : ''}`}
                                >
                                  PKCS#8
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setKeyFormat('pkcs1')}
                                  className={`${styles.formatBtn} ${keyFormat === 'pkcs1' ? styles.formatBtnActive : ''}`}
                                >
                                  PKCS#1
                                </button>
                              </div>
                            )}
                            {!out.isPrivateKey && activeTab !== 'cer-chain-fix' && (
                              <button
                                type="button"
                                onClick={() => sendCertToChainFix(displayContent)}
                                className={styles.btnSecondary}
                              >
                                {t.openInChainFix}
                              </button>
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
                                downloadBlob(blob, downloadFilename);
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

        {/* 通用 FAQ 常見問題區塊 */}
        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#00ffaa"
        />
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
