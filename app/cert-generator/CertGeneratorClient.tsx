'use client';

import { useState, useRef, useCallback, useId, useEffect, useMemo } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './cert-generator.module.css';
import {
  parseSanInput,
  generateCaCertificate,
  generateServerCertificate,
  generateSelfSignedCertificate,
  importCaCertificate,
  buildPkcs12,
  supportsPkcs12,
  sanitizeFileSegment,
  KEY_ALGORITHMS,
  type KeyAlgorithm,
  type CertificateBundle,
} from './engine';
import { downloadBlob } from '../utils/downloadBlob';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}

type Mode = 'self-signed' | 'ca-server';
type OutputFormat = 'pem' | 'der' | 'pkcs12';

interface IdentityOutput {
  label: string;
  certPem: string;
  certDer: ArrayBuffer;
  privateKeyPem: string;
  privateKeyDer: ArrayBuffer;
  fileBaseName: string;
}

const ALGORITHM_LABELS: Record<KeyAlgorithm, string> = {
  'RSA-2048': 'RSA 2048',
  'RSA-4096': 'RSA 4096',
  'ECDSA-P256': 'ECDSA P-256',
  'ECDSA-P384': 'ECDSA P-384',
  'Ed25519': 'Ed25519',
};

function extractCommonName(distinguishedName: string): string {
  const match = distinguishedName.match(/CN=((?:\\.|[^,])+)/);
  return match ? match[1].replace(/\\(.)/g, '$1') : distinguishedName;
}

const COUNTRY_CODE_OTHER = '__OTHER__';

interface CountryOption {
  code: string;
  zh: string;
  en: string;
}

// ISO 3166-1 alpha-2，收錄常見國家；未列出者可於下拉選單選「其他」自行輸入代碼
const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AE', zh: '阿拉伯聯合大公國', en: 'United Arab Emirates' },
  { code: 'AR', zh: '阿根廷', en: 'Argentina' },
  { code: 'AT', zh: '奧地利', en: 'Austria' },
  { code: 'AU', zh: '澳洲', en: 'Australia' },
  { code: 'BD', zh: '孟加拉', en: 'Bangladesh' },
  { code: 'BE', zh: '比利時', en: 'Belgium' },
  { code: 'BG', zh: '保加利亞', en: 'Bulgaria' },
  { code: 'BR', zh: '巴西', en: 'Brazil' },
  { code: 'CA', zh: '加拿大', en: 'Canada' },
  { code: 'CH', zh: '瑞士', en: 'Switzerland' },
  { code: 'CL', zh: '智利', en: 'Chile' },
  { code: 'CN', zh: '中國', en: 'China' },
  { code: 'CO', zh: '哥倫比亞', en: 'Colombia' },
  { code: 'CZ', zh: '捷克', en: 'Czechia' },
  { code: 'DE', zh: '德國', en: 'Germany' },
  { code: 'DK', zh: '丹麥', en: 'Denmark' },
  { code: 'EG', zh: '埃及', en: 'Egypt' },
  { code: 'ES', zh: '西班牙', en: 'Spain' },
  { code: 'FI', zh: '芬蘭', en: 'Finland' },
  { code: 'FR', zh: '法國', en: 'France' },
  { code: 'GB', zh: '英國', en: 'United Kingdom' },
  { code: 'GR', zh: '希臘', en: 'Greece' },
  { code: 'HK', zh: '香港', en: 'Hong Kong' },
  { code: 'HU', zh: '匈牙利', en: 'Hungary' },
  { code: 'ID', zh: '印尼', en: 'Indonesia' },
  { code: 'IE', zh: '愛爾蘭', en: 'Ireland' },
  { code: 'IL', zh: '以色列', en: 'Israel' },
  { code: 'IN', zh: '印度', en: 'India' },
  { code: 'IS', zh: '冰島', en: 'Iceland' },
  { code: 'IT', zh: '義大利', en: 'Italy' },
  { code: 'JP', zh: '日本', en: 'Japan' },
  { code: 'KE', zh: '肯亞', en: 'Kenya' },
  { code: 'KH', zh: '柬埔寨', en: 'Cambodia' },
  { code: 'KP', zh: '北韓', en: 'North Korea' },
  { code: 'KR', zh: '韓國', en: 'South Korea' },
  { code: 'KW', zh: '科威特', en: 'Kuwait' },
  { code: 'LA', zh: '寮國', en: 'Laos' },
  { code: 'LK', zh: '斯里蘭卡', en: 'Sri Lanka' },
  { code: 'LU', zh: '盧森堡', en: 'Luxembourg' },
  { code: 'MM', zh: '緬甸', en: 'Myanmar' },
  { code: 'MN', zh: '蒙古', en: 'Mongolia' },
  { code: 'MO', zh: '澳門', en: 'Macau' },
  { code: 'MX', zh: '墨西哥', en: 'Mexico' },
  { code: 'MY', zh: '馬來西亞', en: 'Malaysia' },
  { code: 'NG', zh: '奈及利亞', en: 'Nigeria' },
  { code: 'NL', zh: '荷蘭', en: 'Netherlands' },
  { code: 'NO', zh: '挪威', en: 'Norway' },
  { code: 'NP', zh: '尼泊爾', en: 'Nepal' },
  { code: 'NZ', zh: '紐西蘭', en: 'New Zealand' },
  { code: 'PE', zh: '秘魯', en: 'Peru' },
  { code: 'PH', zh: '菲律賓', en: 'Philippines' },
  { code: 'PK', zh: '巴基斯坦', en: 'Pakistan' },
  { code: 'PL', zh: '波蘭', en: 'Poland' },
  { code: 'PT', zh: '葡萄牙', en: 'Portugal' },
  { code: 'QA', zh: '卡達', en: 'Qatar' },
  { code: 'RO', zh: '羅馬尼亞', en: 'Romania' },
  { code: 'RU', zh: '俄羅斯', en: 'Russia' },
  { code: 'SA', zh: '沙烏地阿拉伯', en: 'Saudi Arabia' },
  { code: 'SE', zh: '瑞典', en: 'Sweden' },
  { code: 'SG', zh: '新加坡', en: 'Singapore' },
  { code: 'SK', zh: '斯洛伐克', en: 'Slovakia' },
  { code: 'TH', zh: '泰國', en: 'Thailand' },
  { code: 'TR', zh: '土耳其', en: 'Turkey' },
  { code: 'TW', zh: '台灣', en: 'Taiwan' },
  { code: 'UA', zh: '烏克蘭', en: 'Ukraine' },
  { code: 'US', zh: '美國', en: 'United States' },
  { code: 'VN', zh: '越南', en: 'Vietnam' },
  { code: 'ZA', zh: '南非', en: 'South Africa' },
];

function toIdentity(label: string, bundle: CertificateBundle, nameForFile: string): IdentityOutput {
  return {
    label,
    certPem: bundle.certPem,
    certDer: bundle.certDer,
    privateKeyPem: bundle.privateKeyPem,
    privateKeyDer: bundle.privateKeyDer,
    fileBaseName: sanitizeFileSegment(nameForFile),
  };
}


export default function CertGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const caCommonNameId = useId();
  const organizationId = useId();
  const countryCodeId = useId();
  const identityCommonNameId = useId();
  const sanId = useId();
  const validityId = useId();
  const pkcs12PasswordId = useId();
  const importCertPemId = useId();
  const importKeyPemId = useId();

  const [mode, setMode] = useState<Mode>('ca-server');
  const [algorithm, setAlgorithm] = useState<KeyAlgorithm>('RSA-2048');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pem');
  const [pkcs12Password, setPkcs12Password] = useState('');

  const [caCommonName, setCaCommonName] = useState('');
  const [organization, setOrganization] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryCustomMode, setCountryCustomMode] = useState(false);
  const [identityCommonName, setIdentityCommonName] = useState('');
  const [sanInput, setSanInput] = useState('');
  const [validityDays, setValidityDays] = useState(825);

  const countryOptionsSorted = useMemo(
    () =>
      [...COUNTRY_OPTIONS].sort((a, b) =>
        (lang === 'en' ? a.en : a.zh).localeCompare(lang === 'en' ? b.en : b.zh, lang === 'en' ? 'en' : 'zh-Hant')
      ),
    [lang]
  );

  const [savedCa, setSavedCa] = useState<CertificateBundle | null>(null);
  const [savedCaLabel, setSavedCaLabel] = useState('');
  const [reuseCa, setReuseCa] = useState(false);

  const [showCaImport, setShowCaImport] = useState(false);
  const [importCertPemInput, setImportCertPemInput] = useState('');
  const [importKeyPemInput, setImportKeyPemInput] = useState('');
  const [importCaError, setImportCaError] = useState<string | null>(null);
  const [isImportingCa, setIsImportingCa] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invalidSanHint, setInvalidSanHint] = useState<string | null>(null);
  const [identities, setIdentities] = useState<IdentityOutput[] | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#38bdf8');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(56, 189, 248, 0.6)');
  }, []);

  useEffect(() => {
    if (outputFormat === 'pkcs12' && !supportsPkcs12(algorithm)) {
      setOutputFormat('pem');
    }
  }, [algorithm, outputFormat]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2500);
  }, []);

  const handleImportCa = useCallback(async () => {
    if (!importCertPemInput.trim() || !importKeyPemInput.trim()) {
      setImportCaError(t.errorImportCaRequired);
      return;
    }
    setImportCaError(null);
    setIsImportingCa(true);
    try {
      const bundle = await importCaCertificate(importCertPemInput, importKeyPemInput);
      setSavedCa(bundle);
      setSavedCaLabel(extractCommonName(bundle.cert.subject));
      setReuseCa(true);
      setShowCaImport(false);
      setImportCertPemInput('');
      setImportKeyPemInput('');
      showToast(t.importCaSuccessToast);
    } catch (e) {
      setImportCaError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsImportingCa(false);
    }
  }, [importCertPemInput, importKeyPemInput, t, showToast]);

  const handleGenerate = useCallback(async () => {
    const trimmedCn = identityCommonName.trim();
    if (!trimmedCn) {
      setErrorMsg(t.errorCommonNameRequired);
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);
    setIdentities(null);
    setInvalidSanHint(null);

    try {
      const sanEntries = parseSanInput(sanInput);
      if (sanEntries.invalid.length > 0) {
        setInvalidSanHint(t.sanInvalidHint(sanEntries.invalid));
      }

      if (mode === 'self-signed') {
        const bundle = await generateSelfSignedCertificate({
          commonName: trimmedCn,
          organization: organization.trim() || undefined,
          countryCode: countryCode.trim() || undefined,
          sanEntries,
          validityDays,
          algorithm,
        });
        setIdentities([toIdentity(t.selfSignedIdentityLabel, bundle, trimmedCn)]);
      } else {
        let ca: CertificateBundle;
        let caLabel: string;
        if (reuseCa && savedCa) {
          ca = savedCa;
          caLabel = savedCaLabel;
        } else {
          caLabel = caCommonName.trim() || 'Local Dev Root CA';
          ca = await generateCaCertificate({
            commonName: caLabel,
            organization: organization.trim() || undefined,
            countryCode: countryCode.trim() || undefined,
            validityDays,
            algorithm,
          });
          setSavedCa(ca);
          setSavedCaLabel(caLabel);
          setReuseCa(true);
        }
        const server = await generateServerCertificate({
          commonName: trimmedCn,
          sanEntries,
          validityDays,
          algorithm,
          caCert: ca.cert,
          caPrivateKey: ca.privateKey,
          caPublicKey: ca.cert.publicKey,
        });
        setIdentities([
          toIdentity(t.caIdentityLabel, ca, caLabel),
          toIdentity(t.serverIdentityLabel, server, trimmedCn),
        ]);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }, [
    mode,
    identityCommonName,
    caCommonName,
    organization,
    countryCode,
    sanInput,
    validityDays,
    algorithm,
    reuseCa,
    savedCa,
    savedCaLabel,
    t,
  ]);

  const handleClearForm = useCallback(() => {
    setCaCommonName('');
    setOrganization('');
    setCountryCode('');
    setCountryCustomMode(false);
    setIdentityCommonName('');
    setSanInput('');
    setPkcs12Password('');
    setErrorMsg(null);
    setInvalidSanHint(null);
    setIdentities(null);
  }, []);

  const copyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const downloadCert = (identity: IdentityOutput) => {
    if (outputFormat === 'der') {
      downloadBlob(new Blob([identity.certDer], { type: 'application/pkix-cert' }), `${identity.fileBaseName}.der`);
    } else {
      downloadBlob(new Blob([identity.certPem], { type: 'application/x-pem-file' }), `${identity.fileBaseName}.pem`);
    }
  };

  const downloadKey = (identity: IdentityOutput) => {
    if (outputFormat === 'der') {
      downloadBlob(new Blob([identity.privateKeyDer], { type: 'application/pkcs8' }), `${identity.fileBaseName}.key.der`);
    } else {
      downloadBlob(new Blob([identity.privateKeyPem], { type: 'application/x-pem-file' }), `${identity.fileBaseName}.key`);
    }
  };

  const downloadPkcs12 = (identity: IdentityOutput) => {
    if (!pkcs12Password) {
      setErrorMsg(t.errorPkcs12PasswordRequired);
      return;
    }
    try {
      const bytes = buildPkcs12(identity.certPem, identity.privateKeyPem, pkcs12Password);
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/x-pkcs12' }), `${identity.fileBaseName}.p12`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const renderPemCard = (title: string, content: string, onDownload: () => void, showDownload: boolean) => (
    <div className={styles.outputCard}>
      <div className={styles.outputHeader}>
        <span className={styles.outputTitle}>{title}</span>
        <div className={styles.outputActions}>
          <button type="button" className={styles.btnCopyPrimary} onClick={() => copyText(content)}>
            {t.copyBtn}
          </button>
          {showDownload && (
            <button type="button" className={styles.btnDownload} onClick={onDownload}>
              {t.downloadBtn}
            </button>
          )}
        </div>
      </div>
      <pre className={styles.pemPreview}>{content}</pre>
    </div>
  );

  const pkcs12Supported = supportsPkcs12(algorithm);

  const renderCountryCodeField = (disabled: boolean) => (
    <div className={styles.fieldGroup}>
      <label htmlFor={countryCodeId} className={styles.fieldLabel}>
        {t.countryCodeLabel}
      </label>
      {countryCustomMode ? (
        <>
          <input
            id={countryCodeId}
            type="text"
            maxLength={2}
            className={styles.textInput}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            placeholder={t.countryCodePlaceholder}
            disabled={disabled}
            autoFocus
          />
          <button
            type="button"
            className={styles.inlineLinkBtn}
            disabled={disabled}
            onClick={() => {
              setCountryCustomMode(false);
              setCountryCode('');
            }}
          >
            {t.countryCodeBackToSelect}
          </button>
        </>
      ) : (
        <select
          id={countryCodeId}
          className={styles.textInput}
          value={countryCode}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === COUNTRY_CODE_OTHER) {
              setCountryCustomMode(true);
              setCountryCode('');
            } else {
              setCountryCode(e.target.value);
            }
          }}
        >
          <option value="">{t.countryCodeSelectPlaceholder}</option>
          {countryOptionsSorted.map((c) => (
            <option key={c.code} value={c.code}>
              {lang === 'en' ? c.en : c.zh}（{c.code}）
            </option>
          ))}
          <option value={COUNTRY_CODE_OTHER}>{t.countryCodeOtherOption}</option>
        </select>
      )}
    </div>
  );

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#38bdf8"
        accentGlow="rgba(56,189,248,0.6)"
      >
        <div className={styles.mainLayout}>
          <div className={styles.fieldGroup} style={{ marginBottom: '1.5rem' }}>
            <span className={styles.fieldLabel}>{t.modeLabel}</span>
            <div className={styles.pillGroup}>
              <label className={styles.pillOption}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'ca-server'}
                  onChange={() => setMode('ca-server')}
                />
                <span>{t.modeCaServer}</span>
              </label>
              <label className={styles.pillOption}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'self-signed'}
                  onChange={() => setMode('self-signed')}
                />
                <span>{t.modeSelfSigned}</span>
              </label>
            </div>
          </div>

          <div
            className={styles.gridContainer}
            style={mode === 'self-signed' ? { gridTemplateColumns: '1fr' } : undefined}
          >
            {mode === 'ca-server' && (
              <div className={styles.panelCard}>
                <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">{t.caGroupTitle}</div>
                {savedCa && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.customCheckbox}>
                      <input
                        type="checkbox"
                        checked={reuseCa}
                        onChange={(e) => setReuseCa(e.target.checked)}
                      />
                      <span className={styles.checkmark} />
                      <span>{t.caReuseCheckboxLabel}</span>
                    </label>
                    <p className={styles.invalidHint} style={{ color: 'var(--text-secondary, #94a3b8)' }}>
                      {t.caReuseHint(savedCaLabel, savedCa.cert.notAfter.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW'))}
                    </p>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <button
                    type="button"
                    className={styles.btnDownload}
                    style={{ alignSelf: 'flex-start' }}
                    aria-expanded={showCaImport}
                    onClick={() => {
                      setShowCaImport((prev) => !prev);
                      setImportCaError(null);
                    }}
                  >
                    {showCaImport ? t.caImportCancelLabel : t.caImportToggleLabel}
                  </button>
                  {showCaImport && (
                    <>
                      <label htmlFor={importCertPemId} className={styles.fieldLabel}>
                        {t.caImportCertLabel}
                      </label>
                      <textarea
                        id={importCertPemId}
                        className={styles.textArea}
                        value={importCertPemInput}
                        onChange={(e) => setImportCertPemInput(e.target.value)}
                        placeholder={t.caImportCertPlaceholder}
                      />
                      <label htmlFor={importKeyPemId} className={styles.fieldLabel}>
                        {t.caImportKeyLabel}
                      </label>
                      <textarea
                        id={importKeyPemId}
                        className={styles.textArea}
                        value={importKeyPemInput}
                        onChange={(e) => setImportKeyPemInput(e.target.value)}
                        placeholder={t.caImportKeyPlaceholder}
                      />
                      {importCaError && <p className={styles.invalidHint}>{importCaError}</p>}
                      <button
                        type="button"
                        className={styles.btnDownload}
                        onClick={handleImportCa}
                        disabled={isImportingCa}
                      >
                        {isImportingCa ? t.caImportingBtn : t.caImportSubmitBtn}
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor={caCommonNameId} className={styles.fieldLabel}>
                    {t.caCommonNameLabel}
                  </label>
                  <input
                    id={caCommonNameId}
                    type="text"
                    className={styles.textInput}
                    value={caCommonName}
                    onChange={(e) => setCaCommonName(e.target.value)}
                    placeholder={t.caCommonNamePlaceholder}
                    disabled={reuseCa}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor={organizationId} className={styles.fieldLabel}>
                    {t.organizationLabel}
                  </label>
                  <input
                    id={organizationId}
                    type="text"
                    className={styles.textInput}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={t.organizationPlaceholder}
                    disabled={reuseCa}
                  />
                </div>
                {renderCountryCodeField(reuseCa)}
              </div>
            )}

            <div className={styles.panelCard}>
              <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">
                {mode === 'ca-server' ? t.serverGroupTitle : t.identityGroupTitle}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor={identityCommonNameId} className={styles.fieldLabel}>
                  {mode === 'ca-server' ? t.serverCommonNameLabel : t.identityCommonNameLabel}
                </label>
                <input
                  id={identityCommonNameId}
                  type="text"
                  className={styles.textInput}
                  value={identityCommonName}
                  onChange={(e) => setIdentityCommonName(e.target.value)}
                  placeholder={t.identityCommonNamePlaceholder}
                />
              </div>

              {mode === 'self-signed' && (
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className={styles.fieldGroup}>
                    <label htmlFor={organizationId} className={styles.fieldLabel}>
                      {t.organizationLabel}
                    </label>
                    <input
                      id={organizationId}
                      type="text"
                      className={styles.textInput}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={t.organizationPlaceholder}
                    />
                  </div>
                  {renderCountryCodeField(false)}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label htmlFor={sanId} className={styles.fieldLabel}>
                  {t.sanLabel}
                </label>
                <textarea
                  id={sanId}
                  className={styles.textArea}
                  value={sanInput}
                  onChange={(e) => setSanInput(e.target.value)}
                  placeholder={t.sanPlaceholder}
                />
                {invalidSanHint && <p className={styles.invalidHint}>{invalidSanHint}</p>}
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t.algorithmLabel}</span>
                <div className={styles.pillGroup}>
                  {KEY_ALGORITHMS.map((algo) => (
                    <label key={algo} className={styles.pillOption}>
                      <input
                        type="radio"
                        name="algorithm"
                        checked={algorithm === algo}
                        onChange={() => setAlgorithm(algo)}
                      />
                      <span>{ALGORITHM_LABELS[algo]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t.formatLabel}</span>
                <div className={styles.pillGroup}>
                  <label className={styles.pillOption}>
                    <input
                      type="radio"
                      name="format"
                      checked={outputFormat === 'pem'}
                      onChange={() => setOutputFormat('pem')}
                    />
                    <span>{t.formatPem}</span>
                  </label>
                  <label className={styles.pillOption}>
                    <input
                      type="radio"
                      name="format"
                      checked={outputFormat === 'der'}
                      onChange={() => setOutputFormat('der')}
                    />
                    <span>{t.formatDer}</span>
                  </label>
                  <label
                    className={`${styles.pillOption} ${!pkcs12Supported ? styles.pillDisabled : ''}`}
                    title={!pkcs12Supported ? t.formatPkcs12UnsupportedHint : undefined}
                  >
                    <input
                      type="radio"
                      name="format"
                      disabled={!pkcs12Supported}
                      checked={outputFormat === 'pkcs12'}
                      onChange={() => pkcs12Supported && setOutputFormat('pkcs12')}
                    />
                    <span>{t.formatPkcs12}</span>
                  </label>
                </div>
                {!pkcs12Supported && <p className={styles.invalidHint}>{t.formatPkcs12UnsupportedHint}</p>}
              </div>

              {outputFormat === 'pkcs12' && (
                <div className={styles.fieldGroup}>
                  <label htmlFor={pkcs12PasswordId} className={styles.fieldLabel}>
                    {t.pkcs12PasswordLabel}
                  </label>
                  <input
                    id={pkcs12PasswordId}
                    type="password"
                    className={styles.textInput}
                    value={pkcs12Password}
                    onChange={(e) => setPkcs12Password(e.target.value)}
                    placeholder={t.pkcs12PasswordPlaceholder}
                  />
                </div>
              )}

              <div className={styles.fieldGroup}>
                <div className="flex justify-between items-center">
                  <label htmlFor={validityId} className={styles.fieldLabel}>
                    {t.validityLabel}
                  </label>
                  <span className="font-mono text-lg font-bold" style={{ color: '#38bdf8' }}>
                    {validityDays}
                  </span>
                </div>
                <input
                  id={validityId}
                  type="range"
                  min={1}
                  max={3650}
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
                  className={styles.customSlider}
                />
              </div>

              {errorMsg && <p className={styles.invalidHint}>{errorMsg}</p>}

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.btnGenerate}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? t.generatingBtn : t.generateBtn}
                </button>
                <button type="button" className={styles.btnSecondary} onClick={handleClearForm}>
                  {t.clearBtn}
                </button>
              </div>

              <div className={styles.warningBanner}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0 mt-0.5">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <span>
                  <strong>{t.warningTitle}</strong> {t.warningBodyCommon}
                  {mode === 'ca-server' && ` ${t.warningBodyCa}`}
                </span>
              </div>
            </div>
          </div>

          {identities && (
            <div className="flex flex-col gap-6 mt-8">
              {identities.map((identity) => (
                <div key={identity.label} className="flex flex-col gap-3">
                  <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">{identity.label}</div>
                  {renderPemCard(t.certLabel, identity.certPem, () => downloadCert(identity), outputFormat !== 'pkcs12')}
                  {renderPemCard(t.keyLabel, identity.privateKeyPem, () => downloadKey(identity), outputFormat !== 'pkcs12')}
                  {outputFormat === 'pkcs12' && (
                    <div className={styles.outputCard}>
                      <div className={styles.outputHeader}>
                        <span className={styles.outputTitle}>{t.pkcs12Label}</span>
                        <div className={styles.outputActions}>
                          <button
                            type="button"
                            className={styles.btnDownload}
                            onClick={() => downloadPkcs12(identity)}
                          >
                            {t.downloadBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#38bdf8"
          className="mt-8"
        />
      </ToolLayout>

      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#38bdf8">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
