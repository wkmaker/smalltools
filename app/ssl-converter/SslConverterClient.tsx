'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import forge from 'node-forge';
import styles from './ssl-converter.module.css';

type TabType = 'pfx-to-pem' | 'pem-to-pfx' | 'der-to-pem' | 'pem-to-der';

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
}

function parseDistinguishedName(dnObj: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '未知';
  const attributes: Record<string, string> = {};
  dnObj.attributes.forEach(attr => {
    const key = attr.name || attr.type;
    if (key) attributes[key] = attr.value as string;
  });
  return attributes.CN || attributes.commonName || '無通用名稱';
}

function formatValidityDate(date?: Date): string {
  if (!date) return '未知';
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

export default function SslConverterClient() {
  const [activeTab, setActiveTab] = useState<TabType>('pfx-to-pem');

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

  // Accessible IDs
  const pfxFileId = useId();
  const pfxPassId = useId();
  const pemKeyId = useId();
  const pemCertId = useId();
  const pemCaId = useId();
  const pemPassId = useId();
  const pemFriendlyId = useId();
  const derFileId = useId();
  const pemDerInputId = useId();

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

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ffaa');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 170, 0.6)');
  }, []);

  const toggleShowPassword = (fieldKey: string) => {
    setShowPassword(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // 檢查憑證到期日
  const checkCertificateExpiry = (certObj?: forge.pki.Certificate): number | null => {
    if (!certObj || !certObj.validity || !certObj.validity.notAfter) return null;
    const notAfter = certObj.validity.notAfter;
    const today = new Date();
    const timeDiff = notAfter.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 30) {
      if (daysRemaining < 0) {
        showAlertMsg(`憑證警告：此憑證已於 ${Math.abs(daysRemaining)} 天前過期！`, 'error');
      } else {
        showAlertMsg(`憑證警告：此憑證即將於 ${daysRemaining} 天後過期，請儘速更新！`, 'warning');
      }
    }
    return daysRemaining;
  };

  // 觸發二進位 / 文字檔案下載
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`已觸發下載檔案：${filename}`);
  };

  // ==========================================
  // 核心轉換 1：PFX / P12 轉 PEM
  // ==========================================
  const convertPfxToPem = () => {
    hideAlertMsg();
    setResultData(null);

    if (!pfxFile) {
      showAlertMsg('請先選擇上傳 .pfx 或 .p12 憑證檔案！', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const binary = forge.util.createBuffer(buffer).getBytes();

        const asn1 = forge.asn1.fromDer(binary);
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, pfxPassword);

        let privateKeyPemPkcs1 = '';
        let privateKeyPemPkcs8 = '';
        let privateKeyObj: forge.pki.rsa.PrivateKey | null = null;

        const pkcs8Bags =
          p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
        const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] || [];

        if (pkcs8Bags.length > 0 && pkcs8Bags[0].key) {
          privateKeyObj = pkcs8Bags[0].key as forge.pki.rsa.PrivateKey;
        } else if (keyBags.length > 0 && keyBags[0].key) {
          privateKeyObj = keyBags[0].key as forge.pki.rsa.PrivateKey;
        }

        if (privateKeyObj) {
          privateKeyPemPkcs1 = forge.pki.privateKeyToPem(privateKeyObj).trim();
          try {
            const rsaPrivateKey = forge.pki.privateKeyToAsn1(privateKeyObj);
            const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
            privateKeyPemPkcs8 = forge.pki.privateKeyInfoToPem(privateKeyInfo).trim();
          } catch {
            privateKeyPemPkcs8 = privateKeyPemPkcs1;
          }
        }

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];
        let certPem = '';
        let caBundlePem = '';
        let clientCertObj: forge.pki.Certificate | undefined = undefined;
        let subjectName = '未知';
        let issuerName = '未知';
        let notBeforeStr = '未知';
        let notAfterStr = '未知';

        if (certBags.length > 0) {
          let mainCertBag = certBags[0];
          let intermediateBags: typeof certBags = [];

          if (privateKeyObj && privateKeyObj.n) {
            const keyModulus = privateKeyObj.n.toString(16);
            let matchedIndex = -1;

            for (let i = 0; i < certBags.length; i++) {
              const c = certBags[i].cert;
              if (c && c.publicKey && (c.publicKey as forge.pki.rsa.PublicKey).n) {
                const certModulus = (c.publicKey as forge.pki.rsa.PublicKey).n.toString(16);
                if (certModulus === keyModulus) {
                  matchedIndex = i;
                  break;
                }
              }
            }

            if (matchedIndex !== -1) {
              mainCertBag = certBags[matchedIndex];
              intermediateBags = certBags.filter((_, idx) => idx !== matchedIndex);
            } else {
              intermediateBags = certBags.slice(1);
            }
          } else {
            intermediateBags = certBags.slice(1);
          }

          clientCertObj = mainCertBag.cert;
          if (clientCertObj) {
            certPem = forge.pki.certificateToPem(clientCertObj).trim();
            caBundlePem = intermediateBags
              .map(b => (b.cert ? forge.pki.certificateToPem(b.cert).trim() : ''))
              .filter(Boolean)
              .join('\n');

            subjectName = parseDistinguishedName(clientCertObj.subject);
            issuerName = parseDistinguishedName(clientCertObj.issuer);
            notBeforeStr = formatValidityDate(clientCertObj.validity.notBefore);
            notAfterStr = formatValidityDate(clientCertObj.validity.notAfter);
          }
        }

        const daysRemaining = checkCertificateExpiry(clientCertObj);

        const outputs: OutputItem[] = [
          { filename: 'certificate.crt', content: certPem, label: '伺服器憑證檔案 (.crt)' },
        ];

        if (privateKeyPemPkcs8 || privateKeyPemPkcs1) {
          outputs.push({
            filename: 'private.key',
            content: privateKeyPemPkcs8 || privateKeyPemPkcs1,
            contentPkcs8: privateKeyPemPkcs8,
            contentPkcs1: privateKeyPemPkcs1,
            label: '私鑰檔案 (.key)',
            isPrivateKey: true,
          });
        }

        if (caBundlePem && caBundlePem.trim()) {
          outputs.push({ filename: 'ca-bundle.crt', content: caBundlePem, label: '中繼憑證鏈 (.ca-bundle)' });
          outputs.push({
            filename: 'fullchain.crt',
            content: `${certPem.trim()}\n${caBundlePem.trim()}`,
            label: '完整憑證鏈 [含伺服器憑證+中繼憑證] (.crt)',
          });
        }

        setResultData({
          meta: [
            { label: '檔案名稱', value: pfxFile.name },
            { label: '通用名稱 (CN)', value: subjectName },
            { label: '簽發機構 (Issuer)', value: issuerName },
            { label: '生效時間 (Not Before)', value: notBeforeStr },
            {
              label: '過期時間 (Not After)',
              value: notAfterStr,
              className:
                daysRemaining !== null && daysRemaining <= 30
                  ? daysRemaining < 0
                    ? 'text-red-400 font-bold'
                    : 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold',
            },
          ],
          outputs,
        });

        showAlertMsg('PFX / P12 解密與 PEM 格式轉換成功！', 'success');
      } catch (err: unknown) {
        const error = err as Error;
        showAlertMsg(`解密失敗：${error.message || '請確認密碼是否正確，且檔案未損壞！'}`, 'error');
      }
    };

    reader.readAsArrayBuffer(pfxFile);
  };

  // ==========================================
  // 核心轉換 2：PEM 轉 PFX / P12
  // ==========================================
  const convertPemToPfx = () => {
    hideAlertMsg();
    setResultData(null);

    const keyText = pemKey.trim();
    const certText = pemCert.trim();
    const caText = pemCaBundle.trim();
    const friendlyName = pemFriendlyName.trim() || 'ssl-converter-certificate';

    if (!keyText || !certText) {
      showAlertMsg('請先輸入或貼上「私鑰 PEM」與「憑證 PEM」！', 'error');
      return;
    }

    if (!pemPassword) {
      showAlertMsg('為確保憑證安全，請設定 PFX 保護密碼！', 'error');
      return;
    }

    try {
      const privateKeyObj = forge.pki.privateKeyFromPem(keyText) as forge.pki.rsa.PrivateKey;
      const certObj = forge.pki.certificateFromPem(certText);

      const keyModulus = privateKeyObj.n.toString(16);
      const certModulus = (certObj.publicKey as forge.pki.rsa.PublicKey).n.toString(16);

      if (keyModulus !== certModulus) {
        showAlertMsg('安全攔截：您輸入的私鑰與憑證之 RSA 模數 (Modulus) 不匹配，請檢查兩者是否配對！', 'error');
        return;
      }

      let intermediateCerts: forge.pki.Certificate[] = [];
      if (caText) {
        const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
        const matches = caText.match(certRegex) || [];
        intermediateCerts = matches.map(pem => forge.pki.certificateFromPem(pem));
      }

      const pfxAsn1 = forge.pkcs12.toPkcs12Asn1(
        privateKeyObj,
        [certObj, ...intermediateCerts],
        pemPassword,
        {
          algorithm: '3des',
          friendlyName,
          generateLocalKeyId: true,
        }
      );

      const pfxDer = forge.asn1.toDer(pfxAsn1).getBytes();
      const buffer = new Uint8Array(pfxDer.length);
      for (let i = 0; i < pfxDer.length; i++) {
        buffer[i] = pfxDer.charCodeAt(i) & 0xff;
      }

      const blob = new Blob([buffer], { type: 'application/x-pkcs12' });
      triggerDownload(blob, `${friendlyName}.pfx`);

      showAlertMsg('PEM 打包 PFX / P12 成功並已觸發下載！', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showAlertMsg(`打包失敗：${error.message || '請確認 PEM 文字格式是否完整！'}`, 'error');
    }
  };

  // ==========================================
  // 核心轉換 3：DER 轉 PEM
  // ==========================================
  const convertDerToPem = () => {
    hideAlertMsg();
    setResultData(null);

    if (!derFile) {
      showAlertMsg('請先選擇上傳二進位 DER / CER / CRT 檔案！', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const binary = forge.util.createBuffer(buffer).getBytes();
        const asn1 = forge.asn1.fromDer(binary);

        let pemResult = '';
        let typeLabel = '';
        let subjectName = '無';
        let notAfterStr = '無';
        let privateKeyPemPkcs1 = '';
        let privateKeyPemPkcs8 = '';

        try {
          const cert = forge.pki.certificateFromAsn1(asn1);
          pemResult = forge.pki.certificateToPem(cert);
          typeLabel = 'X.509 憑證 (Certificate)';
          subjectName = parseDistinguishedName(cert.subject);
          notAfterStr = formatValidityDate(cert.validity.notAfter);
          checkCertificateExpiry(cert);
        } catch {
          try {
            const key = forge.pki.privateKeyFromAsn1(asn1) as forge.pki.rsa.PrivateKey;
            privateKeyPemPkcs1 = forge.pki.privateKeyToPem(key).trim();
            try {
              const rsaPrivateKey = forge.pki.privateKeyToAsn1(key);
              const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
              privateKeyPemPkcs8 = forge.pki.privateKeyInfoToPem(privateKeyInfo).trim();
            } catch {
              privateKeyPemPkcs8 = privateKeyPemPkcs1;
            }
            pemResult = privateKeyPemPkcs8;
            typeLabel = 'RSA 私鑰 (Private Key)';
          } catch {
            const base64 = forge.util.encode64(binary);
            const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
            pemResult = `-----BEGIN CERTIFICATE-----\n${formatted}\n-----END CERTIFICATE-----`;
            typeLabel = '未分類 DER 二進位資料';
          }
        }

        const outputs: OutputItem[] = [];
        if (typeLabel === 'RSA 私鑰 (Private Key)') {
          outputs.push({
            filename: 'private.key',
            content: privateKeyPemPkcs8 || privateKeyPemPkcs1,
            contentPkcs8: privateKeyPemPkcs8,
            contentPkcs1: privateKeyPemPkcs1,
            label: '私鑰檔案 (.key)',
            isPrivateKey: true,
          });
        } else {
          outputs.push({ filename: 'converted.pem', content: pemResult, label: '轉換後的 PEM 檔案 (.pem)' });
        }

        setResultData({
          meta: [
            { label: '原始檔名', value: derFile.name },
            { label: '解析類型', value: typeLabel },
            { label: '主體通用名稱', value: subjectName },
            { label: '過期時間', value: notAfterStr },
          ],
          outputs,
        });

        showAlertMsg('DER 轉 PEM 格式轉換成功！', 'success');
      } catch (err: unknown) {
        const error = err as Error;
        showAlertMsg(`DER 轉換失敗：${error.message || '請確認檔案為合法的 ASN.1 / DER 二進位格式！'}`, 'error');
      }
    };

    reader.readAsArrayBuffer(derFile);
  };

  // ==========================================
  // 核心轉換 4：PEM 轉 DER
  // ==========================================
  const convertPemToDer = () => {
    hideAlertMsg();
    setResultData(null);

    const inputPem = pemDerInput.trim();
    if (!inputPem) {
      showAlertMsg('請先粘貼 PEM 文字憑證或私鑰內容！', 'error');
      return;
    }

    try {
      let derBytes = '';
      let filename = '';
      let mimeType = '';

      if (inputPem.includes('CERTIFICATE')) {
        const cert = forge.pki.certificateFromPem(inputPem);
        const asn1 = forge.pki.certificateToAsn1(cert);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        filename = 'certificate.der';
        mimeType = 'application/x-x509-ca-cert';
      } else if (inputPem.includes('PRIVATE KEY')) {
        const key = forge.pki.privateKeyFromPem(inputPem) as forge.pki.rsa.PrivateKey;
        const asn1 = forge.pki.privateKeyToAsn1(key);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        filename = 'private.key.der';
        mimeType = 'application/octet-stream';
      } else {
        throw new Error('未偵測到 BEGIN CERTIFICATE 或 BEGIN PRIVATE KEY 標籤！');
      }

      const buffer = new Uint8Array(derBytes.length);
      for (let i = 0; i < derBytes.length; i++) {
        buffer[i] = derBytes.charCodeAt(i) & 0xff;
      }

      const blob = new Blob([buffer], { type: mimeType });
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
        title="SSL 憑證格式轉換器"
        subtitle="SSL CERTIFICATE CONVERTER"
        description="專業免費的線上 SSL 憑證格式轉換工具！支援 PFX/P12, PEM, DER 雙向純前端安全轉換、憑證過期時間自動檢測與私鑰模數配對雜湊比對。"
        accentColor="#00ffaa"
        accentGlow="rgba(0, 255, 170, 0.6)"
      >
        <div className="flex flex-col gap-6 w-full">
          {/* 警告/訊息提示方塊 */}
          {alert.show && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium transition-all ${
                alert.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>{alert.message}</span>
              <button onClick={hideAlertMsg} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
                ✕ 關閉
              </button>
            </div>
          )}

          {/* 4 大功能頁籤 */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/[.08] justify-center gap-2 max-sm:flex-col">
            {[
              { id: 'pfx-to-pem', label: 'PFX / P12 轉 PEM' },
              { id: 'pem-to-pfx', label: 'PEM 轉 PFX / P12' },
              { id: 'der-to-pem', label: 'DER 轉 PEM' },
              { id: 'pem-to-der', label: 'PEM 轉 DER' },
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  hideAlertMsg();
                }}
                className={`py-2.5 px-5 text-sm font-semibold rounded-xl cursor-pointer transition-all border ${
                  activeTab === tab.id
                    ? 'bg-[#00ffaa]/20 border-[#00ffaa]/40 text-[#00ffaa] shadow-[0_0_15px_rgba(0,255,170,0.2)]'
                    : 'border-transparent text-text-sub hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 頁籤 1: PFX 轉 PEM */}
          {activeTab === 'pfx-to-pem' && (
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  上傳 PFX / P12 檔案 (.pfx / .p12)
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
                    <p className="text-sm text-text-sub font-medium">拖曳 .pfx 或 .p12 憑證至此，或點擊選擇檔案</p>
                    <span className="text-xs text-text-sub">支援二進位 PKCS#12 憑證包</span>
                  </div>
                ) : (
                  <div className="bg-[#00ffaa]/10 border border-[#00ffaa]/30 p-4 rounded-xl flex justify-between items-center text-sm font-mono">
                    <span className="text-white font-medium">{pfxFile.name} ({(pfxFile.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" onClick={() => setPfxFile(null)} className="text-red-400 hover:underline cursor-pointer">
                      移除檔案
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
                <label htmlFor={pfxPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  PFX 解密保護密碼
                </label>
                <div className="relative">
                  <input
                    id={pfxPassId}
                    type={showPassword['pfx'] ? 'text' : 'password'}
                    placeholder="若憑證設有密碼請輸入 (若無密碼請留空)"
                    value={pfxPassword}
                    onChange={e => setPfxPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#00ffaa] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('pfx')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-white cursor-pointer text-xs"
                  >
                    {showPassword['pfx'] ? '隱藏' : '顯示'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={convertPfxToPem}
                className="w-full py-3.5 bg-[#00ffaa]/15 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold text-base rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,170,0.2)]"
              >
                解密並轉換 PEM 憑證鏈與私鑰
              </button>
            </div>
          )}

          {/* 頁籤 2: PEM 轉 PFX */}
          {activeTab === 'pem-to-pfx' && (
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={pemKeyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    私鑰 Private Key (.key) <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id={pemKeyId}
                    rows={6}
                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                    value={pemKey}
                    onChange={e => setPemKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/[.08] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00ffaa] font-mono resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={pemCertId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    伺服器憑證 Certificate (.crt) <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id={pemCertId}
                    rows={6}
                    placeholder="-----BEGIN CERTIFICATE-----\n..."
                    value={pemCert}
                    onChange={e => setPemCert(e.target.value)}
                    className="w-full bg-black/40 border border-white/[.08] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00ffaa] font-mono resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
                <label htmlFor={pemCaId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  中繼憑證鏈 CA Bundle (選填)
                </label>
                <textarea
                  id={pemCaId}
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----\n... (多個中繼憑證請直接首尾黏貼)"
                  value={pemCaBundle}
                  onChange={e => setPemCaBundle(e.target.value)}
                  className="w-full bg-black/40 border border-white/[.08] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00ffaa] font-mono resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/[.05] pt-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={pemPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    設定 PFX 保護密碼 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={pemPassId}
                      type={showPassword['pemToPfx'] ? 'text' : 'password'}
                      placeholder="請輸入加密密碼"
                      value={pemPassword}
                      onChange={e => setPemPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#00ffaa] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('pemToPfx')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-white cursor-pointer text-xs"
                    >
                      {showPassword['pemToPfx'] ? '隱藏' : '顯示'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={pemFriendlyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                    憑證別名 Friendly Name (選填)
                  </label>
                  <input
                    id={pemFriendlyId}
                    type="text"
                    placeholder="預設：ssl-converter-certificate"
                    value={pemFriendlyName}
                    onChange={e => setPemFriendlyName(e.target.value)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00ffaa] font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={convertPemToPfx}
                className="w-full py-3.5 bg-[#00ffaa]/15 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold text-base rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,170,0.2)]"
              >
                驗證 Modulus 匹配並打包下載 PFX
              </button>
            </div>
          )}

          {/* 頁籤 3: DER 轉 PEM */}
          {activeTab === 'der-to-pem' && (
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  上傳二進位 DER / CER / CRT 檔案
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
                    <p className="text-sm text-text-sub font-medium">拖曳 .der, .cer 或 .crt 檔案至此，或點擊選擇檔案</p>
                    <span className="text-xs text-text-sub">支援二進位 ASN.1 / DER 編碼之憑證或私鑰檔</span>
                  </div>
                ) : (
                  <div className="bg-[#00ffaa]/10 border border-[#00ffaa]/30 p-4 rounded-xl flex justify-between items-center text-sm font-mono">
                    <span className="text-white font-medium">{derFile.name} ({(derFile.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" onClick={() => setDerFile(null)} className="text-red-400 hover:underline cursor-pointer">
                      移除檔案
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={convertDerToPem}
                className="w-full py-3.5 bg-[#00ffaa]/15 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold text-base rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,170,0.2)]"
              >
                轉換為 PEM 文字格式
              </button>
            </div>
          )}

          {/* 頁籤 4: PEM 轉 DER */}
          {activeTab === 'pem-to-der' && (
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <label htmlFor={pemDerInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  粘貼 PEM 文字憑證或私鑰 (.crt / .pem / .key)
                </label>
                <textarea
                  id={pemDerInputId}
                  rows={8}
                  placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                  value={pemDerInput}
                  onChange={e => setPemDerInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/[.08] text-white p-3.5 rounded-xl text-xs outline-none focus:border-[#00ffaa] font-mono resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={convertPemToDer}
                className="w-full py-3.5 bg-[#00ffaa]/15 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold text-base rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,170,0.2)]"
              >
                轉換並下載二進位 DER 檔案
              </button>
            </div>
          )}

          {/* 轉換結果區塊 */}
          {resultData && (
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-6 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                <h3 className="text-sm text-[#00ffaa] uppercase tracking-[1px] font-semibold">
                  憑證剖析與成果明細
                </h3>
                <button
                  type="button"
                  onClick={() => setResultData(null)}
                  className="text-xs text-text-sub hover:text-white cursor-pointer"
                >
                  隱藏結果
                </button>
              </div>

              {/* Metadata 面板 */}
              <div className="grid grid-cols-2 gap-4 text-sm font-mono max-sm:grid-cols-1">
                {resultData.meta.map((m, idx) => (
                  <div key={idx} className="bg-black/40 p-3.5 rounded-xl border border-white/[.04] flex flex-col gap-1">
                    <span className="text-text-sub font-medium">{m.label}</span>
                    <span className={m.className || 'text-white font-bold'}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* 輸出項目列表 */}
              <div className="flex flex-col gap-4">
                {resultData.outputs.map((out, idx) => {
                  const displayContent = out.isPrivateKey
                    ? keyFormat === 'pkcs8'
                      ? out.contentPkcs8 || out.content
                      : out.contentPkcs1 || out.content
                    : out.content;

                  return (
                    <div key={idx} className="bg-black/40 border border-white/[.06] rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-white/[.05] pb-2 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                        <span className="text-sm font-bold text-[#00ffaa] font-mono">{out.label}</span>
                        <div className="flex items-center gap-2">
                          {out.isPrivateKey && (
                            <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/[.08] text-xs">
                              <button
                                type="button"
                                onClick={() => setKeyFormat('pkcs8')}
                                className={`px-2 py-0.5 rounded-lg ${keyFormat === 'pkcs8' ? 'bg-[#00ffaa]/20 text-[#00ffaa] font-bold' : 'text-text-sub'}`}
                              >
                                PKCS#8
                              </button>
                              <button
                                type="button"
                                onClick={() => setKeyFormat('pkcs1')}
                                className={`px-2 py-0.5 rounded-lg ${keyFormat === 'pkcs1' ? 'bg-[#00ffaa]/20 text-[#00ffaa] font-bold' : 'text-text-sub'}`}
                              >
                                PKCS#1
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(displayContent).then(() => showToast(`已複製 ${out.filename}`));
                            }}
                            className="px-3 py-1 text-xs bg-white/[.05] border border-white/[.1] text-text-main font-medium rounded-xl hover:bg-white/[.1] cursor-pointer"
                          >
                            複製文字
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([displayContent], { type: 'text/plain' });
                              triggerDownload(blob, out.filename);
                            }}
                            className="px-3 py-1 text-xs bg-[#00ffaa]/20 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] cursor-pointer"
                          >
                            下載 {out.filename}
                          </button>
                        </div>
                      </div>

                      <pre className={styles.certOutput}>{displayContent}</pre>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00ffaa]/20 border border-[#00ffaa]/40 text-[#00ffaa] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </>
  );
}
