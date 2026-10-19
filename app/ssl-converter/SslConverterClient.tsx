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
import {
  TabType,
  OutputItem,
  ResultData,
  buildStandardMetaGrid,
} from './types';

import CerChainFixTab from './components/CerChainFixTab';
import PfxToPemTab from './components/PfxToPemTab';
import PemToPfxTab from './components/PemToPfxTab';
import DerToPemTab from './components/DerToPemTab';
import PemToDerTab from './components/PemToDerTab';
import SslResultSection from './components/SslResultSection';

interface Props {
  lang?: 'zh-TW' | 'en';
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
      showAlertMsg(t.alertUploadCert, 'warning');
      return;
    }
    try {
      const parsed = await parseSslPayload({ file: cerFile, text: cerTextInput }, cerPassword);
      if (parsed.isPfx && !parsed.pfxDecrypted) {
        showAlertMsg(t.alertPfxDecryptFailed, 'error');
        return;
      }
      if (parsed.certs.length === 0) {
        showAlertMsg(t.alertNoValidCert, 'error');
        return;
      }
      const analysis = buildUnifiedCertAnalysis(parsed.certs);
      setCurrentChainPems(analysis.chainPems);
      setAiaFixUrl(analysis.nextAiaUrl);
      const cn = analysis.cn;
      const outputsList: OutputItem[] = [
        { label: t.outputFullChain, filename: generateCertFilename(cn, 'fullchain', 'crt'), content: analysis.chainPems.map(p => p.trim()).join('\n') },
        { label: t.outputServerCert, filename: generateCertFilename(cn, 'cert', 'crt'), content: analysis.chainPems[0].trim() }
      ];
      if (analysis.chainPems.length > 1) {
        outputsList.push({ label: t.outputCaBundle, filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n') });
      }
      const hasPrivateKey = !!parsed.privateKeyPemPkcs8;
      setResultData({
        meta: buildStandardMetaGrid(analysis, t, {
          privateKeyStatus: hasPrivateKey
            ? t.privKeyInFileNoExport
            : t.privKeyNotInFile,
        }),
        outputs: outputsList,
        cnName: cn,
      });
      showAlertMsg(t.alertParseSuccess, 'success');
    } catch (err: any) {
      console.error('[SslConverter] Parse payload error:', err);
      showAlertMsg(`${t.alertParseError}${err.message || t.errCertOrPassword}`, 'error');
    }
  };

  const handleAiaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiaError(null);
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAiaError(t.fileTooLarge);
      input.value = '';
      return;
    }
    // 尚無既有憑證鏈可接續時無從比對簽發者，直接擋下避免存取負索引
    if (currentChainPems.length === 0) {
      setAiaError(t.aiaErrorInvalidCert);
      input.value = '';
      return;
    }
    try {
      const parsedAia = await parseSslPayload({ file });
      if (parsedAia.certs.length === 0) {
        setAiaError(t.aiaErrorInvalidCert);
        return;
      }
      const parsedNewCert = parsedAia.certs[0];
      const lastChainCert = forge.pki.certificateFromPem(currentChainPems[currentChainPems.length - 1]);
      if (!verifyCertIssuerMatch(lastChainCert, parsedNewCert)) {
        setAiaError(t.aiaErrorSubjectMismatch);
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
          { label: t.outputFullChain, filename: generateCertFilename(cn, 'fullchain', 'crt'), content: updatedChainPems.map(p => p.trim()).join('\n') },
          { label: t.outputServerCert, filename: generateCertFilename(cn, 'cert', 'crt'), content: updatedChainPems[0].trim() }
        );
        if (updatedChainPems.length > 1) {
          outputsList.push({ label: t.outputCaBundle, filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: updatedChainPems.slice(1).map(p => p.trim()).join('\n') });
        }
        const previousKeyStatus = resultData.meta.find(m => m.label === t.metaPrivateKeyStatus)?.value;
        setResultData({
          meta: buildStandardMetaGrid(analysis, t, previousKeyStatus ? { privateKeyStatus: previousKeyStatus } : undefined),
          outputs: outputsList,
          cnName: cn
        });
      }
    } catch (err) {
      console.error('[SslConverter] AIA inspection error:', err);
      setAiaError(t.aiaErrorInvalidCert);
    } finally {
      // 清空選擇，讓使用者修正後可再次選取同一檔案觸發 onChange
      input.value = '';
    }
  };

  const convertPfxToPem = async () => {
    hideAlertMsg();
    if (!pfxFile) {
      showAlertMsg(t.alertSelectPfx, 'warning');
      return;
    }
    try {
      const parsed = await parseSslPayload({ file: pfxFile }, pfxPassword);
      if (parsed.isPfx && !parsed.pfxDecrypted) {
        showAlertMsg(t.alertPfxWrongPass, 'error');
        return;
      }
      const analysis = buildUnifiedCertAnalysis(parsed.certs);
      setCurrentChainPems(analysis.chainPems);
      setAiaFixUrl(analysis.nextAiaUrl);
      const cn = analysis.cn || 'ssl-cert';
      const outputsList: OutputItem[] = [];
      if (parsed.privateKeyPemPkcs8) {
        outputsList.push({ label: t.outputPrivateKey, filename: generateCertFilename(cn, 'key', 'key'), content: parsed.privateKeyPemPkcs8, isPrivateKey: true, contentPkcs8: parsed.privateKeyPemPkcs8, contentPkcs1: parsed.privateKeyPemPkcs1 || parsed.privateKeyPemPkcs8 });
      }
      if (analysis.chainPems.length > 0) {
        if (analysis.chainPems.length > 1) {
          outputsList.push({ label: t.outputFullChain, filename: generateCertFilename(cn, 'fullchain', 'crt'), content: analysis.chainPems.map(p => p.trim()).join('\n') });
        }
        outputsList.push({ label: t.outputServerCert, filename: generateCertFilename(cn, 'cert', 'crt'), content: analysis.chainPems[0].trim() });
        if (analysis.chainPems.length > 1) {
          outputsList.push({ label: t.outputCaBundle, filename: generateCertFilename(cn, 'chain', 'ca-bundle'), content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n') });
        }
      }
      setResultData({
        meta: buildStandardMetaGrid(analysis, t, { privateKeyStatus: parsed.privateKeyPemPkcs8 ? t.privKeyExtractedFromPfx : t.privKeyNone }),
        outputs: outputsList,
        cnName: cn
      });
      showAlertMsg(t.alertPfxSuccess, 'success');
    } catch (err: any) {
      console.error('[SslConverter] Convert PFX error:', err);
      showAlertMsg(`${t.alertPfxError}${err.message || t.errCheckPassword}`, 'error');
    }
  };

  const convertPemToPfx = async () => {
    hideAlertMsg();
    if (!pemKey.trim() || !pemCert.trim()) {
      showAlertMsg(t.alertPasteKeyAndCert, 'warning');
      return;
    }

    try {
      const keyObj = forge.pki.privateKeyFromPem(pemKey.trim());
      const certObj = forge.pki.certificateFromPem(pemCert.trim());

      const keyRSA = keyObj as forge.pki.rsa.PrivateKey;
      const certRSA = certObj.publicKey as forge.pki.rsa.PublicKey;

      if (!keyRSA.n || !certRSA.n) {
        showAlertMsg(t.alertRsaOnly, 'warning');
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
        showAlertMsg(t.alertModulusMismatch, 'error');
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
      const standardMeta = buildStandardMetaGrid(analysis, t, {
        privateKeyStatus: t.privKeyModulusMatched,
      });
      if (friendlyNameClean) {
        standardMeta.push({
          label: t.metaFriendlyName,
          value: friendlyNameClean,
          className: styles.statusSuccess,
        });
      }

      setResultData({
        meta: standardMeta,
        outputs: [],
        cnName: cn,
      });

      showAlertMsg(t.alertPfxPackageSuccess, 'success');
    } catch (err: unknown) {
      console.error('[SslConverter] Build PFX error:', err);
      const error = err as Error;
      showAlertMsg(`${t.alertPfxPackageError}${error.message || t.errPemOrKey}`, 'error');
    }
  };

  const convertDerToPem = async () => {
    hideAlertMsg();
    if (!derFile) {
      showAlertMsg(t.alertSelectDer, 'warning');
      return;
    }

    try {
      const parsed = await parseSslPayload({ file: derFile });
      if (parsed.certs.length === 0 && !parsed.privateKeyPemPkcs8) {
        showAlertMsg(t.alertDerParseError, 'error');
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
            label: t.outputFullChain,
            filename: generateCertFilename(cn, 'fullchain', 'crt'),
            content: fullChainPem,
          });
        }

        outputsList.push({
          label: t.outputServerCert,
          filename: generateCertFilename(cn, 'cert', 'crt'),
          content: analysis.chainPems[0].trim(),
        });

        if (analysis.chainPems.length > 1) {
          outputsList.push({
            label: t.outputCaBundle,
            filename: generateCertFilename(cn, 'chain', 'ca-bundle'),
            content: analysis.chainPems.slice(1).map(p => p.trim()).join('\n'),
          });
        }

        const standardMeta = buildStandardMetaGrid(analysis, t);

        setResultData({
          meta: standardMeta,
          outputs: outputsList,
          cnName: cn,
        });
      } else if (parsed.privateKeyPemPkcs8) {
        outputsList.push({
          label: t.outputPrivateKey,
          filename: generateCertFilename('ssl-key', 'key', 'key'),
          content: parsed.privateKeyPemPkcs8,
          isPrivateKey: true,
          contentPkcs8: parsed.privateKeyPemPkcs8,
          contentPkcs1: parsed.privateKeyPemPkcs1 || parsed.privateKeyPemPkcs8,
        });

        setResultData({
          meta: [
            { label: t.metaFileType, value: t.privKeyDerRsa },
            { label: t.metaOriginalFilename, value: derFile.name },
            { label: t.metaKeyExportStatus, value: t.privKeyExtracted, className: 'text-[var(--theme-color,#00ffaa)] font-bold' },
          ],
          outputs: outputsList,
          cnName: 'ssl-key',
        });
      }

      showAlertMsg(t.alertDerSuccess, 'success');
    } catch (err: unknown) {
      console.error('[SslConverter] Convert DER error:', err);
      const error = err as Error;
      showAlertMsg(`${t.alertDerError}${error.message || t.errInvalidDer}`, 'error');
    }
  };

  const convertPemToDer = () => {
    hideAlertMsg();
    if (!pemDerInput.trim()) {
      showAlertMsg(t.alertPastePem, 'warning');
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
        showAlertMsg(t.alertNoPemHeader, 'error');
        return;
      }

      const derArray = new Uint8Array(derBytes.length);
      for (let i = 0; i < derBytes.length; i++) {
        derArray[i] = derBytes.charCodeAt(i);
      }

      const blob = new Blob([derArray], { type: 'application/x-x509-ca-cert' });
      downloadBlob(blob, filename);

      showAlertMsg(t.alertPemToDerSuccess, 'success');
    } catch (err: unknown) {
      console.error('[SslConverter] Convert PEM to DER error:', err);
      const error = err as Error;
      showAlertMsg(`${t.alertPemToDerError}${error.message || t.errInvalidPem}`, 'error');
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
            <CerChainFixTab
              t={t}
              cerFile={cerFile}
              setCerFile={setCerFile}
              cerTextInput={cerTextInput}
              setCerTextInput={setCerTextInput}
              cerPassword={cerPassword}
              setCerPassword={setCerPassword}
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              cerFileId={cerFileId}
              cerTextId={cerTextId}
              cerPassId={cerPassId}
              onSubmit={parseAndFixCerChain}
              onClear={handleClearCurrentTab}
              showAlertMsg={showAlertMsg}
              hideAlertMsg={hideAlertMsg}
              resetAllResults={resetAllResults}
            />
          )}

          {/* 頁籤 1: PFX 轉 PEM */}
          {activeTab === 'pfx-to-pem' && (
            <PfxToPemTab
              t={t}
              pfxFile={pfxFile}
              setPfxFile={setPfxFile}
              pfxPassword={pfxPassword}
              setPfxPassword={setPfxPassword}
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              pfxFileId={pfxFileId}
              pfxPassId={pfxPassId}
              onSubmit={convertPfxToPem}
              onClear={handleClearCurrentTab}
              showAlertMsg={showAlertMsg}
              hideAlertMsg={hideAlertMsg}
              resetAllResults={resetAllResults}
            />
          )}

          {/* 頁籤 2: PEM 轉 PFX */}
          {activeTab === 'pem-to-pfx' && (
            <PemToPfxTab
              t={t}
              pemKey={pemKey}
              setPemKey={setPemKey}
              pemCert={pemCert}
              setPemCert={setPemCert}
              pemCaBundle={pemCaBundle}
              setPemCaBundle={setPemCaBundle}
              pemPassword={pemPassword}
              setPemPassword={setPemPassword}
              pemFriendlyName={pemFriendlyName}
              setPemFriendlyName={setPemFriendlyName}
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              pemKeyId={pemKeyId}
              pemCertId={pemCertId}
              pemCaId={pemCaId}
              pemPassId={pemPassId}
              pemFriendlyId={pemFriendlyId}
              onSubmit={convertPemToPfx}
              onClear={handleClearCurrentTab}
            />
          )}

          {/* 頁籤 3: DER 轉 PEM */}
          {activeTab === 'der-to-pem' && (
            <DerToPemTab
              t={t}
              derFile={derFile}
              setDerFile={setDerFile}
              derFileId={derFileId}
              onSubmit={convertDerToPem}
              onClear={handleClearCurrentTab}
              showAlertMsg={showAlertMsg}
              hideAlertMsg={hideAlertMsg}
              resetAllResults={resetAllResults}
            />
          )}

          {/* 頁籤 4: PEM 轉 DER */}
          {activeTab === 'pem-to-der' && (
            <PemToDerTab
              t={t}
              pemDerInput={pemDerInput}
              setPemDerInput={setPemDerInput}
              pemDerInputId={pemDerInputId}
              onSubmit={convertPemToDer}
              onClear={handleClearCurrentTab}
            />
          )}

          {/* 轉換結果區塊 */}
          {resultData && (
            <SslResultSection
              t={t}
              resultData={resultData}
              activeTab={activeTab}
              keyFormat={keyFormat}
              setKeyFormat={setKeyFormat}
              currentChainPems={currentChainPems}
              aiaFixUrl={aiaFixUrl}
              aiaError={aiaError}
              aiaFileInputId={aiaFileInputId}
              handleAiaFileUpload={handleAiaFileUpload}
              sendCertToChainFix={sendCertToChainFix}
              showToast={showToast}
              onCloseResult={resetAllResults}
            />
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
