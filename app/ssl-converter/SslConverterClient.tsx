'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
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

function getDnString(dnObj?: forge.pki.Certificate['subject']): string {
  if (!dnObj || !dnObj.attributes) return '';
  return dnObj.attributes
    .map(attr => `${attr.type}=${attr.value}`)
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

  const aiaRegex = /http:\/\/[A-Za-z0-9\-\.\/]+\.(cer|crt|p7b)/i;
  const match = derStr.match(aiaRegex);
  return match ? match[0] : null;
}

export default function SslConverterClient() {
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
    setAlert(prev => ({ ...prev, show: false }));
  }, []);

  const finalizeChain = useCallback((pems: string[]) => {
    if (pems.length <= 1) return;

    const caBundlePem = pems.slice(1).join('\n');
    const fullchainPem = pems.join('\n');

    setResultData(prev => {
      if (!prev) return null;
      const outputs = [...prev.outputs];
      const cn = prev.cnName;

      const caFilename = generateCertFilename(cn, 'ca-bundle', 'crt');
      const fullchainFilename = generateCertFilename(cn, 'fullchain', 'crt');

      const caIdx = outputs.findIndex(o => o.filename.includes('ca-bundle'));
      const fullchainIdx = outputs.findIndex(o => o.filename.includes('fullchain'));

      const caItem: OutputItem = {
        filename: caFilename,
        content: caBundlePem,
        label: '中繼憑證鏈 (.ca-bundle)',
      };

      const fullchainItem: OutputItem = {
        filename: fullchainFilename,
        content: fullchainPem,
        label: '完整憑證鏈 [含伺服器憑證+中繼憑證] (.crt)',
      };

      if (caIdx !== -1) outputs[caIdx] = caItem;
      else outputs.push(caItem);

      if (fullchainIdx !== -1) outputs[fullchainIdx] = fullchainItem;
      else outputs.push(fullchainItem);

      return { ...prev, outputs };
    });

    showAlertMsg('成功補齊中繼憑證，已更新/產生完整憑證鏈！', 'success');
  }, []);

  const checkAndShowAiaFixCard = useCallback(
    (pems: string[], hasExistingBundle: boolean) => {
      setCurrentChainPems(pems);
      if (pems.length === 0) {
        setAiaFixUrl(null);
        return;
      }

      // 檢查第 0 張憑證是否為端點/伺服器憑證
      try {
        const firstCert = forge.pki.certificateFromPem(pems[0]);
        if (isCaCertificate(firstCert)) {
          setAiaFixUrl(null);
          if (pems.length === 1) {
            showAlertMsg(
              '⚠️ 注意：您上傳的是 CA 中繼/根憑證而非伺服器憑證 (Server Certificate)。請上傳您的伺服器憑證以進行 AIA 補鏈！',
              'warning'
            );
          }
          return;
        }
      } catch {
        setAiaFixUrl(null);
        return;
      }

      if (hasExistingBundle) {
        setAiaFixUrl(null);
        return;
      }

      // 檢查目前鏈的最頂端憑證
      const lastPem = pems[pems.length - 1];
      try {
        const lastCert = forge.pki.certificateFromPem(lastPem);
        if (isRootCertificate(lastCert)) {
          setAiaFixUrl(null);
          if (pems.length > 1) {
            finalizeChain(pems);
          }
          return;
        }

        const rawAiaUrl = extractAiaUrl(lastCert);
        if (!rawAiaUrl) {
          setAiaFixUrl(null);
          if (pems.length > 1) {
            finalizeChain(pems);
          } else {
            showAlertMsg('此伺服器憑證未包含 AIA 官方下載網址，無法自動補齊中繼憑證。', 'warning');
          }
          return;
        }

        const secureAiaUrl = rawAiaUrl.startsWith('http://')
          ? rawAiaUrl.replace('http://', 'https://')
          : rawAiaUrl;

        setAiaFixUrl(secureAiaUrl);
      } catch {
        setAiaFixUrl(null);
      }
    },
    [finalizeChain]
  );

  const handleAiaFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const binary = forge.util.createBuffer(buffer).getBytes();

        let certObj: forge.pki.Certificate | null = null;
        let pem = '';

        try {
          const asn1 = forge.asn1.fromDer(binary);
          certObj = forge.pki.certificateFromAsn1(asn1);
          pem = forge.pki.certificateToPem(certObj);
        } catch {
          try {
            const text = new TextDecoder('utf-8').decode(buffer);
            certObj = forge.pki.certificateFromPem(text);
            pem = forge.pki.certificateToPem(certObj);
          } catch {
            throw new Error('解析憑證格式失敗');
          }
        }

        if (!certObj || !pem) {
          throw new Error('解析憑證格式失敗');
        }

        // 驗證新上傳的 CA 憑證是否為當前憑證鏈最頂端憑證的直屬簽發者 (Parent Issuer)
        if (currentChainPems.length > 0) {
          const currentTopPem = currentChainPems[currentChainPems.length - 1];
          try {
            const childCertObj = forge.pki.certificateFromPem(currentTopPem);
            if (!verifyCertIssuerMatch(childCertObj, certObj)) {
              const neededIssuer = parseDistinguishedName(childCertObj.issuer);
              setAiaError(
                `憑證簽發關係不匹配！您上傳的憑證不是當前憑證的直屬簽發 CA。當前憑證需要的簽發機構為 『${neededIssuer}』，請確認後重新上傳！`
              );
              return;
            }
          } catch {
            // 若預先解析失敗則忽略
          }
        }

        setAiaError(null);
        const newPems = [...currentChainPems, pem.trim()];
        checkAndShowAiaFixCard(newPems, false);
      } catch (err: unknown) {
        const error = err as Error;
        setAiaError(`AIA 中繼憑證解析失敗：${error.message || '請確認上傳的檔案為合法的憑證！'}`);
      }
    };
    reader.readAsArrayBuffer(file);
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
  // 核心功能：憑證剖析與 AIA 自動補鏈 (含解密防呆)
  // ==========================================
  const parseAndFixCerChain = () => {
    hideAlertMsg();
    setResultData(null);
    setAiaFixUrl(null);

    const processCertObj = (cert: forge.pki.Certificate, fileName?: string) => {
      const certPem = forge.pki.certificateToPem(cert).trim();
      const subjectName = parseDistinguishedName(cert.subject);
      const issuerName = parseDistinguishedName(cert.issuer);
      const notBeforeStr = formatValidityDate(cert.validity.notBefore);
      const notAfterStr = formatValidityDate(cert.validity.notAfter);
      const daysRemaining = checkCertificateExpiry(cert);

      const certFilename = generateCertFilename(subjectName, 'certificate', 'crt');

      const outputs: OutputItem[] = [
        { filename: certFilename, content: certPem, label: '伺服器憑證檔案 (.crt)' },
      ];

      setResultData({
        meta: [
          { label: '憑證來源', value: fileName || '文字貼上憑證' },
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
        cnName: subjectName,
      });

      checkAndShowAiaFixCard([certPem], false);
      showAlertMsg('憑證剖析成功！已啟動 AIA 憑證鏈自動檢測。', 'success');
    };

    if (cerFile) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const binary = forge.util.createBuffer(buffer).getBytes();

          let cert: forge.pki.Certificate | null = null;
          try {
            const asn1 = forge.asn1.fromDer(binary);
            try {
              cert = forge.pki.certificateFromAsn1(asn1);
            } catch {
              // 嘗試 PKCS#12 (PFX) 包
              try {
                const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, cerPassword);
                const certBags =
                  p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];
                if (certBags.length > 0 && certBags[0].cert) {
                  cert = certBags[0].cert;
                }
              } catch (p12Err: unknown) {
                const errStr = (p12Err as Error)?.message || '';
                if (!cerPassword) {
                  throw new Error('此憑證/檔案設有加密密碼保護！請於「解密保護密碼」輸入密碼後重新解析。');
                }
                throw new Error(`PKCS#12 解密失敗：${errStr || '請確認密碼是否正確。'}`);
              }
            }
          } catch (derErr: unknown) {
            const derErrMsg = (derErr as Error)?.message;
            if (derErrMsg?.includes('密碼')) throw derErr;

            try {
              const text = new TextDecoder('utf-8').decode(buffer);
              cert = forge.pki.certificateFromPem(text);
            } catch {
              throw new Error('無法解析憑證格式，請確認檔案是否為合法的憑證檔（若含有加密保護請輸入密碼）。');
            }
          }

          if (!cert) throw new Error('憑證物件為空');
          processCertObj(cert, cerFile.name);
        } catch (err: unknown) {
          const error = err as Error;
          showAlertMsg(`憑證解析失敗：${error.message || '請確認上傳的檔案為合法的憑證！'}`, 'error');
        }
      };
      reader.readAsArrayBuffer(cerFile);
    } else if (cerTextInput.trim()) {
      try {
        const cert = forge.pki.certificateFromPem(cerTextInput.trim());
        processCertObj(cert);
      } catch (err: unknown) {
        const error = err as Error;
        showAlertMsg(`憑證文字解析失敗：${error.message || '請確認粘貼的是完整的 PEM 憑證內容！'}`, 'error');
      }
    } else {
      showAlertMsg('請先選擇上傳 CER/CRT 憑證檔案或粘貼憑證文字！', 'error');
    }
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

        const certFilename = generateCertFilename(subjectName, 'certificate', 'crt');
        const keyFilename = generateCertFilename(subjectName, 'private-key', 'key');
        const caFilename = generateCertFilename(subjectName, 'ca-bundle', 'crt');
        const fullchainFilename = generateCertFilename(subjectName, 'fullchain', 'crt');

        const outputs: OutputItem[] = [
          { filename: certFilename, content: certPem, label: '伺服器憑證檔案 (.crt)' },
        ];

        if (privateKeyPemPkcs8 || privateKeyPemPkcs1) {
          outputs.push({
            filename: keyFilename,
            content: privateKeyPemPkcs8 || privateKeyPemPkcs1,
            contentPkcs8: privateKeyPemPkcs8,
            contentPkcs1: privateKeyPemPkcs1,
            label: '私鑰檔案 (.key)',
            isPrivateKey: true,
          });
        }

        if (caBundlePem && caBundlePem.trim()) {
          outputs.push({ filename: caFilename, content: caBundlePem, label: '中繼憑證鏈 (.ca-bundle)' });
          outputs.push({
            filename: fullchainFilename,
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
          cnName: subjectName,
        });

        const initialPems: string[] = [];
        if (certPem) {
          initialPems.push(certPem.trim());
        }
        const hasExistingBundle = Boolean(caBundlePem && caBundlePem.trim());
        checkAndShowAiaFixCard(initialPems, hasExistingBundle);

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

      const subjectName = parseDistinguishedName(certObj.subject);
      const pfxFilename = generateCertFilename(subjectName || friendlyName, friendlyName || 'certificate', 'pfx');

      const blob = new Blob([buffer], { type: 'application/x-pkcs12' });
      triggerDownload(blob, pfxFilename);

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
          const keyFilename = generateCertFilename(subjectName, 'private-key', 'key');
          outputs.push({
            filename: keyFilename,
            content: privateKeyPemPkcs8 || privateKeyPemPkcs1,
            contentPkcs8: privateKeyPemPkcs8,
            contentPkcs1: privateKeyPemPkcs1,
            label: '私鑰檔案 (.key)',
            isPrivateKey: true,
          });
        } else {
          const certFilename = generateCertFilename(subjectName, 'certificate', 'pem');
          outputs.push({ filename: certFilename, content: pemResult, label: '轉換後的 PEM 檔案 (.pem)' });
        }

        setResultData({
          meta: [
            { label: '原始檔名', value: derFile.name },
            { label: '解析類型', value: typeLabel },
            { label: '主體通用名稱', value: subjectName },
            { label: '過期時間', value: notAfterStr },
          ],
          outputs,
          cnName: subjectName,
        });

        const initialPems: string[] = [];
        if (pemResult && typeLabel === 'X.509 憑證 (Certificate)') {
          initialPems.push(pemResult.trim());
        }
        checkAndShowAiaFixCard(initialPems, false);

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
        const subjectName = parseDistinguishedName(cert.subject);
        const asn1 = forge.pki.certificateToAsn1(cert);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        filename = generateCertFilename(subjectName, 'certificate', 'der');
        mimeType = 'application/x-x509-ca-cert';
      } else if (inputPem.includes('PRIVATE KEY')) {
        const key = forge.pki.privateKeyFromPem(inputPem) as forge.pki.rsa.PrivateKey;
        const asn1 = forge.pki.privateKeyToAsn1(key);
        derBytes = forge.asn1.toDer(asn1).getBytes();
        filename = generateCertFilename('ssl-cert', 'private-key', 'der');
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
              <button onClick={hideAlertMsg} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          )}

          {/* 5 大功能頁籤 */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/[.08] justify-center gap-2 max-sm:flex-col flex-wrap">
            {[
              { id: 'cer-chain-fix', label: '憑證剖析與自動補鏈' },
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
                  resetAllResults();
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

          {/* 頁籤 0: 憑證剖析與自動補鏈 */}
          {activeTab === 'cer-chain-fix' && (
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <label htmlFor={cerFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  上傳 CER / CRT / PEM / DER 憑證檔案
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
                    <p className="text-sm text-text-sub font-medium">拖曳 .cer, .crt, .pem 或 .der 憑證至此，或點擊選擇檔案</p>
                    <span className="text-xs text-text-sub">支援二進位 DER 編碼或 Base64 PEM 格式憑證</span>
                  </div>
                ) : (
                  <div className="bg-[#00ffaa]/10 border border-[#00ffaa]/30 p-4 rounded-xl flex justify-between items-center text-sm font-mono">
                    <span className="text-white font-medium">{cerFile.name} ({(cerFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCerFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
                      移除檔案
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
                <label htmlFor={cerTextId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  或直接粘貼 PEM 憑證文字 (選填)
                </label>
                <textarea
                  id={cerTextId}
                  rows={5}
                  placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                  value={cerTextInput}
                  onChange={e => setCerTextInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/[.08] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00ffaa] font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
                <label htmlFor={cerPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  憑證/私鑰解密保護密碼 (選填)
                </label>
                <div className="relative">
                  <input
                    id={cerPassId}
                    type={showPassword['cerPass'] ? 'text' : 'password'}
                    placeholder="若憑證或加密私鑰含有密碼請輸入 (無加密請留空)"
                    value={cerPassword}
                    onChange={e => setCerPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#00ffaa] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('cerPass')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-white cursor-pointer text-xs"
                  >
                    {showPassword['cerPass'] ? '隱藏' : '顯示'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={parseAndFixCerChain}
                className="w-full py-3.5 bg-[#00ffaa]/15 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold text-base rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,170,0.2)]"
              >
                剖析憑證並自動檢測 AIA 候補憑證鏈
              </button>
            </div>
          )}

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
                    <button
                      type="button"
                      onClick={() => {
                        setPfxFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
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
                    <button
                      type="button"
                      onClick={() => {
                        setDerFile(null);
                        resetAllResults();
                      }}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
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
                  onClick={() => {
                    setResultData(null);
                    setAiaFixUrl(null);
                  }}
                  className="text-xs text-text-sub hover:text-white cursor-pointer"
                >
                  隱藏結果
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
                        ? '偵測到憑證鏈不完整，建議補齊中繼憑證'
                        : `成功解析第 ${currentChainPems.length - 1} 層中繼憑證！已偵測到下一層 CA URL`}
                    </span>
                  </div>

                  <div className="text-sm text-text-sub flex flex-col gap-2 leading-relaxed">
                    <p>請點擊下方連結下載官方 CA 中繼憑證，並將下載的檔案拖曳至下方上傳區進行合成：</p>
                    <div className="flex flex-col gap-1 bg-black/40 p-3 rounded-xl border border-white/[.06]">
                      <a
                        href={aiaFixUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00ffaa] underline font-mono text-xs break-all hover:text-white transition-colors"
                      >
                        {aiaFixUrl}
                      </a>
                      <div className="flex items-center gap-1.5 text-xs text-text-sub opacity-80 mt-1">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#00ffaa] shrink-0">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                        <span>
                          貼心提醒：若點擊無法開啟，請<strong>右鍵點擊連結選擇「另存連結為...」</strong>下載檔案。
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 緊鄰 Dropzone 的專屬告警訊息區 */}
                  {aiaError && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-mono shadow-md animate-fadeIn">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-400 shrink-0 mt-0.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span className="leading-relaxed">{aiaError}</span>
                    </div>
                  )}

                  <div className={styles.uploadZone}>
                    <input
                      id={aiaFileInputId}
                      type="file"
                      accept=".cer,.crt,.der,.pem"
                      className={styles.fileInput}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleAiaFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-text-sub">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <p className="text-xs text-text-sub font-medium">將下載的 CA 憑證檔拖曳至此，或點擊選擇檔案</p>
                    <span className="text-[11px] text-text-sub opacity-70">支援 .cer / .crt / .der / .pem 格式</span>
                  </div>
                </div>
              )}

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

                  const downloadFilename = out.isPrivateKey
                    ? keyFormat === 'pkcs8'
                      ? generateCertFilename(resultData.cnName, 'private-key', 'key')
                      : generateCertFilename(resultData.cnName, 'private-rsa-key', 'key')
                    : out.filename;

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
                              navigator.clipboard.writeText(displayContent).then(() => showToast(`已複製 ${downloadFilename}`));
                            }}
                            className="px-3 py-1 text-xs bg-white/[.05] border border-white/[.1] text-text-main font-medium rounded-xl hover:bg-white/[.1] cursor-pointer"
                          >
                            複製文字
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([displayContent], { type: 'text/plain' });
                              triggerDownload(blob, downloadFilename);
                            }}
                            className="px-3 py-1 text-xs bg-[#00ffaa]/20 border border-[#00ffaa]/40 text-[#00ffaa] font-semibold rounded-xl hover:bg-[#00ffaa] hover:text-[#030305] cursor-pointer"
                          >
                            下載 {downloadFilename}
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
