'use client';

import { useState, useEffect, useId, useRef, useCallback, useMemo } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import {
  NETWORK_SPECS,
  SANDBOX_CARDS,
  BATCH_COUNT_PRESETS,
  sanitizeCustomBin,
  generateTestCardBatch,
  validateCardBatch,
  formatCardBatchExport,
  type CardNetwork,
  type GeneratedCardItem,
  type CardValidationResult,
  type LuhnStep,
} from './engine';
import { TRANSLATIONS } from './translations';
import styles from './credit-card-generator.module.css';

type ActiveTab = 'generate' | 'validate';

interface Props {
  lang?: 'zh-TW' | 'en';
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export default function CreditCardGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // 確定性表單 ID（A11y 對稱綁定）
  const customBinInputId = useId();
  const includeSpacesId = useId();
  const includeMetaId = useId();
  const validatorTextareaId = useId();

  // 模式與選項狀態
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [selectedNetworks, setSelectedNetworks] = useState<CardNetwork[]>([]);
  const [customBin, setCustomBin] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [includeSpaces, setIncludeSpaces] = useState<boolean>(true);
  const [includeMeta, setIncludeMeta] = useState<boolean>(true);

  // 結果與歷史（SSR 初始為空陣列，掛載後產生首批，歷史保持空陣列遵守呼吸留白原則）
  const [results, setResults] = useState<GeneratedCardItem[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedCardItem[]>([]);

  // 驗證器狀態
  const [validatorInput, setValidatorInput] = useState<string>('');
  const [selectedValIndex, setSelectedValIndex] = useState<number>(0);

  // 金流沙盒測試卡速查表折疊狀態
  const [showSandbox, setShowSandbox] = useState<boolean>(false);

  // 複製與 Toast 反饋
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 動態注入工具主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.55)');
  }, []);

  // 元件卸載清理定時器
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // 初次掛載產生首批隨機測試卡號（不推入歷史紀錄）
  useEffect(() => {
    const initial = generateTestCardBatch({ networks: [], customBin: '' }, 1);
    setResults(initial);
    setSelectedNumber(initial[0]?.number ?? null);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 2200);
  }, []);

  const copyText = useCallback(
    async (text: string, key: string, toastMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        setCopiedKey(key);
        copyTimerRef.current = setTimeout(() => {
          setCopiedKey(null);
          copyTimerRef.current = null;
        }, 1800);
        showToast(toastMessage);
      } catch {
        showToast(t.toastCopyFailed);
      }
    },
    [showToast, t.toastCopyFailed]
  );

  const handleGenerate = useCallback(
    (overrides?: Partial<{ networks: CardNetwork[]; bin: string; count: number }>) => {
      const nextNetworks = overrides?.networks ?? selectedNetworks;
      const nextBin = overrides?.bin ?? customBin;
      const nextCount = overrides?.count ?? batchCount;

      if (results.length > 0) {
        const previousFirst = results[0];
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.number !== previousFirst.number);
          return [previousFirst, ...filtered].slice(0, 10);
        });
      }

      const nextBatch = generateTestCardBatch(
        { networks: nextNetworks, customBin: nextBin },
        nextCount
      );
      setResults(nextBatch);
      setSelectedNumber(nextBatch[0]?.number ?? null);
    },
    [selectedNetworks, customBin, batchCount, results]
  );

  const toggleNetwork = useCallback(
    (netId: CardNetwork) => {
      const next = selectedNetworks.includes(netId)
        ? selectedNetworks.filter((n) => n !== netId)
        : [...selectedNetworks, netId];
      setSelectedNetworks(next);
      handleGenerate({ networks: next });
    },
    [selectedNetworks, handleGenerate]
  );

  const handleExport = useCallback(
    (format: 'txt' | 'csv' | 'json') => {
      if (results.length === 0) return;
      const content = formatCardBatchExport(results, format, {
        lang,
        includeSpaces,
        includeMeta,
      });
      const mimeMap: Record<'txt' | 'csv' | 'json', string> = {
        txt: 'text/plain;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
        json: 'application/json;charset=utf-8',
      };
      const bom = format === 'csv' ? '\uFEFF' : '';
      const blob = new Blob([bom + content], { type: mimeMap[format] });
      const url = URL.createObjectURL(blob);
      const filename = `test-credit-cards-batch.${format}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(interpolate(t.toastExported, { filename }));
    },
    [results, lang, includeSpaces, includeMeta, showToast, t.toastExported]
  );

  const validationResults = useMemo<CardValidationResult[]>(() => {
    if (!validatorInput.trim()) return [];
    return validateCardBatch(validatorInput);
  }, [validatorInput]);

  const validCount = useMemo(
    () => validationResults.filter((r) => r.valid).length,
    [validationResults]
  );
  const invalidCount = validationResults.length - validCount;

  const activeGeneratedItem = useMemo(
    () => results.find((item) => item.number === selectedNumber) ?? results[0] ?? null,
    [results, selectedNumber]
  );

  const activeValidatedItem = useMemo(
    () => validationResults[selectedValIndex] ?? validationResults[0] ?? null,
    [validationResults, selectedValIndex]
  );

  const displayCardNumber = (item: GeneratedCardItem): string =>
    includeSpaces ? item.formatted : item.number;

  const getNetworkName = (zh: string, en: string): string => (lang === 'en' ? en : zh);

  const getValidationErrorText = (res: CardValidationResult): string => {
    switch (res.errorCode) {
      case 'EMPTY':
        return t.errEmpty;
      case 'NON_NUMERIC':
        return t.errNonNumeric;
      case 'INVALID_LENGTH':
        return t.errLength;
      case 'INVALID_CHECKSUM':
        return interpolate(t.errChecksum, { expected: res.expectedCheckDigit ?? '?' });
      default:
        return '';
    }
  };

  const renderLuhnBreakdown = (
    formattedNum: string,
    steps: LuhnStep[],
    luhnSum: number,
    isValid: boolean,
    remainder = 0,
    expectedCheckDigit?: number
  ) => (
    <div className={`${styles.panel} mt-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${styles.accentText} shrink-0`}
            aria-hidden="true"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
            <line x1="8" y1="18" x2="16" y2="18" />
          </svg>
          <h3 className="text-base font-bold text-text-main">{t.breakdownTitle}</h3>
        </div>
        <span className={isValid ? styles.badgeValid : styles.badgeInvalid}>
          {isValid ? t.statusValid : t.statusInvalid}
        </span>
      </div>

      <div className="text-xs font-mono text-text-sub mb-3">{formattedNum}</div>

      <div className={styles.luhnGrid}>
        {steps.map((step) => (
          <div
            key={step.position}
            className={`${styles.luhnCell} ${step.doubled ? styles.luhnCellDoubled : ''}`}
          >
            <span className="text-xs text-text-sub">#{step.position}</span>
            <span className="text-sm font-bold text-text-main">{step.digit}</span>
            <span className="text-xs text-text-sub">
              {step.doubled ? t.breakdownDoubledTag : t.breakdownKeepTag}
            </span>
            <span className={`text-sm font-bold ${styles.accentText}`}>{step.adjusted}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border-glass flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-text-sub">
          {t.breakdownFormulaPrefix}：
          <strong className="font-mono text-text-main ml-1">{luhnSum}</strong>
        </span>
        <span className={isValid ? styles.accentText : 'text-red-500 font-medium'}>
          {isValid
            ? t.breakdownRemainderValid
            : interpolate(t.breakdownRemainderInvalid, {
                remainder,
                expected: expectedCheckDigit ?? '?',
              })}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#ffb800"
      accentGlow="rgba(255, 184, 0, 0.55)"
    >
      {/* 醒目警示橫幅：明確告知為隨機產生、非實際可用信用卡 */}
      <div className={styles.disclaimerBanner} role="alert">
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.disclaimerIcon}
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="min-w-0">
          <div className={styles.disclaimerTitle}>{t.disclaimerTitle}</div>
          <p className="text-xs leading-relaxed text-text-sub">{t.disclaimerBody}</p>
        </div>
      </div>

      {/* 模式切換 Tabs */}
      <div className="flex justify-start">
        <div className={styles.modeTabs} role="tablist" aria-label={t.title}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
            className={`${styles.modeTabBtn} ${activeTab === 'generate' ? styles.modeTabActive : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>{t.tabGenerate}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'validate'}
            onClick={() => setActiveTab('validate')}
            className={`${styles.modeTabBtn} ${activeTab === 'validate' ? styles.modeTabActive : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{t.tabValidate}</span>
          </button>
        </div>
      </div>

      {/* ====== Tab 1: 產生器模式 ====== */}
      {activeTab === 'generate' && (
        <div className="w-full grid grid-cols-[1.05fr_1.95fr] max-[1024px]:grid-cols-1 gap-6 items-start">
          {/* 左側設定面板 */}
          <section className={styles.panel} aria-label={t.sectionOptions}>
            <h2 className="text-base font-bold text-text-main mb-5 flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.accentText}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>{t.sectionOptions}</span>
            </h2>

            <div className="space-y-5">
              {/* 發卡組織多選 */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-text-sub">{t.labelNetworks}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={styles.badgeNeutral}>
                      {selectedNetworks.length === 0
                        ? t.networksAllRandom
                        : interpolate(t.networksSelectedCount, { count: selectedNetworks.length })}
                    </span>
                    {selectedNetworks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNetworks([]);
                          handleGenerate({ networks: [] });
                        }}
                        className={styles.secondaryBtn}
                      >
                        {t.networksClearBtn}
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.networkGrid} role="group" aria-label={t.labelNetworks}>
                  {NETWORK_SPECS.map((spec) => {
                    const active = selectedNetworks.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleNetwork(spec.id)}
                        className={`${styles.networkChip} ${active ? styles.networkChipActive : ''}`}
                      >
                        <span className="text-sm font-semibold truncate w-full">
                          {getNetworkName(spec.nameZh, spec.nameEn)}
                        </span>
                        <span className="text-xs text-text-sub font-mono truncate w-full">
                          {spec.prefixHint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-text-sub mt-1.5 leading-relaxed">{t.networksHint}</p>
              </div>

              {/* 自訂 BIN 前綴 */}
              <div>
                <label
                  htmlFor={customBinInputId}
                  className="block text-sm font-medium text-text-sub mb-2"
                >
                  {t.labelCustomBin}
                </label>
                <input
                  id={customBinInputId}
                  type="text"
                  inputMode="numeric"
                  value={customBin}
                  onChange={(e) => {
                    const clean = sanitizeCustomBin(e.target.value);
                    setCustomBin(clean);
                    handleGenerate({ bin: clean });
                  }}
                  placeholder={t.customBinPlaceholder}
                  className={`${styles.inputControl} font-mono`}
                />
                <p className="text-xs text-text-sub mt-1.5">{t.customBinHint}</p>
              </div>

              {/* 產生筆數 */}
              <div>
                <span className="block text-sm font-medium text-text-sub mb-2">
                  {t.labelBatchCount}
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {BATCH_COUNT_PRESETS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setBatchCount(num);
                        handleGenerate({ count: num });
                      }}
                      className={`${styles.segmentBtn} ${
                        batchCount === num ? styles.segmentBtnActive : ''
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 顯示與匯出選項 */}
              <div className="space-y-2.5">
                <span className="block text-sm font-medium text-text-sub">
                  {t.labelDisplayOptions}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    id={includeSpacesId}
                    type="checkbox"
                    checked={includeSpaces}
                    onChange={(e) => setIncludeSpaces(e.target.checked)}
                    className="w-4 h-4 accent-[#d97706] cursor-pointer"
                  />
                  <label htmlFor={includeSpacesId} className="text-xs text-text-sub cursor-pointer">
                    {t.optIncludeSpaces}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={includeMetaId}
                    type="checkbox"
                    checked={includeMeta}
                    onChange={(e) => setIncludeMeta(e.target.checked)}
                    className="w-4 h-4 accent-[#d97706] cursor-pointer"
                  />
                  <label htmlFor={includeMetaId} className="text-xs text-text-sub cursor-pointer">
                    {t.optIncludeMeta}
                  </label>
                </div>
              </div>

              {/* 立即產生按鈕 */}
              <button
                type="button"
                onClick={() => handleGenerate()}
                className={styles.primaryBtn}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>{results.length > 0 ? t.btnRegenerate : t.btnGenerate}</span>
              </button>
            </div>
          </section>

          {/* 右側結果與 Luhn 拆解 */}
          <div className="min-w-0">
            <section className={styles.panel} aria-label={t.sectionResult}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-text-main">{t.sectionResult}</h2>
                  {results.length > 0 && (
                    <span className={styles.badgeNeutral}>
                      {interpolate(t.resultBadgeCount, { count: results.length })}
                    </span>
                  )}
                </div>

                {results.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          results.map((r) => displayCardNumber(r)).join('\n'),
                          'copy-all',
                          interpolate(t.toastCopiedAll, { count: results.length })
                        )
                      }
                      className={styles.secondaryBtn}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width={14}
                        height={14}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>{copiedKey === 'copy-all' ? t.btnCopied : t.btnCopyAll}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('txt')}
                      className={styles.secondaryBtn}
                    >
                      {t.btnExportTxt}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('csv')}
                      className={styles.secondaryBtn}
                    >
                      {t.btnExportCsv}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('json')}
                      className={styles.secondaryBtn}
                    >
                      {t.btnExportJson}
                    </button>
                  </div>
                )}
              </div>

              {/* 焦點模擬測試卡 */}
              {activeGeneratedItem && (
                <div className={styles.heroCardBox}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={styles.badgeValid}>
                      {getNetworkName(
                        activeGeneratedItem.networkNameZh,
                        activeGeneratedItem.networkNameEn
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = displayCardNumber(activeGeneratedItem);
                        copyText(val, `hero-${activeGeneratedItem.number}`, interpolate(t.toastCopied, { value: val }));
                      }}
                      className={styles.secondaryBtn}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width={15}
                        height={15}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>
                        {copiedKey === `hero-${activeGeneratedItem.number}` ? t.btnCopied : t.btnCopy}
                      </span>
                    </button>
                  </div>

                  <div className={styles.heroCardNumber}>
                    {displayCardNumber(activeGeneratedItem)}
                  </div>

                  {includeMeta && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-sub">{t.metaExpiryLabel}</span>
                        <span className="font-mono font-bold text-text-main">
                          {activeGeneratedItem.expiry}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-sub">{t.metaCvvLabel}</span>
                        <span className="font-mono font-bold text-text-main">
                          {activeGeneratedItem.cvv}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-text-sub leading-relaxed">{t.heroNotRealNote}</p>
                </div>
              )}

              {/* 多筆清單（電腦表格 / 手機直式卡片） */}
              {results.length > 1 && (
                <>
                  <div className={`${styles.tableWrapper} hidden sm:block`}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>{t.colIndex}</th>
                          <th>{t.colNumber}</th>
                          <th>{t.colNetwork}</th>
                          {includeMeta && <th>{t.colExpiry}</th>}
                          {includeMeta && <th>{t.colCvv}</th>}
                          <th>{t.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item, idx) => {
                          const isSelected = activeGeneratedItem?.number === item.number;
                          const shown = displayCardNumber(item);
                          return (
                            <tr
                              key={item.number}
                              onClick={() => setSelectedNumber(item.number)}
                              className={`cursor-pointer ${isSelected ? styles.rowSelected : ''}`}
                            >
                              <td className="text-text-sub font-mono text-xs">{idx + 1}</td>
                              <td className="font-mono font-bold tracking-wider whitespace-nowrap">
                                {shown}
                              </td>
                              <td className="text-xs text-text-sub whitespace-nowrap">
                                {getNetworkName(item.networkNameZh, item.networkNameEn)}
                              </td>
                              {includeMeta && (
                                <td className="font-mono text-sm">{item.expiry}</td>
                              )}
                              {includeMeta && (
                                <td className="font-mono text-sm">{item.cvv}</td>
                              )}
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyText(
                                        shown,
                                        `row-${item.number}`,
                                        interpolate(t.toastCopied, { value: shown })
                                      );
                                    }}
                                    className={styles.secondaryBtn}
                                  >
                                    {copiedKey === `row-${item.number}` ? t.btnCopied : t.btnCopy}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNumber(item.number);
                                    }}
                                    className={styles.secondaryBtn}
                                  >
                                    {t.inspectBreakdown}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="block sm:hidden space-y-2.5">
                    {results.map((item, idx) => {
                      const isSelected = activeGeneratedItem?.number === item.number;
                      const shown = displayCardNumber(item);
                      return (
                        <div
                          key={item.number}
                          onClick={() => setSelectedNumber(item.number)}
                          className={`${styles.mobileCard} cursor-pointer ${
                            isSelected ? styles.mobileCardSelected : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={styles.badgeNeutral}>
                              {getNetworkName(item.networkNameZh, item.networkNameEn)}
                            </span>
                            <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                          </div>
                          <div className="font-mono text-base font-bold tracking-wider text-text-main break-all">
                            {shown}
                          </div>
                          {includeMeta && (
                            <div className="flex items-center gap-3 text-xs text-text-sub font-mono">
                              <span>
                                {t.metaExpiryLabel}: {item.expiry}
                              </span>
                              <span>
                                {t.metaCvvLabel}: {item.cvv}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(
                                  shown,
                                  `m-${item.number}`,
                                  interpolate(t.toastCopied, { value: shown })
                                );
                              }}
                              className={`${styles.secondaryBtn} flex-1`}
                            >
                              {copiedKey === `m-${item.number}` ? t.btnCopied : t.btnCopy}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNumber(item.number);
                              }}
                              className={`${styles.secondaryBtn} flex-1`}
                            >
                              {t.inspectBreakdown}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* Luhn 演算法拆解 */}
            {activeGeneratedItem &&
              renderLuhnBreakdown(
                activeGeneratedItem.formatted,
                activeGeneratedItem.steps,
                activeGeneratedItem.luhnSum,
                true,
                0,
                activeGeneratedItem.checkDigit
              )}

            {/* 工作階段紀錄（初次載入隱藏，手動重新產生後顯示） */}
            {history.length > 0 && (
              <section className={`${styles.panel} mt-6`} aria-label={t.historyTitle}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-text-sub">{t.historyTitle}</h3>
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className={styles.secondaryBtn}
                  >
                    {t.historyClear}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((item) => {
                    const shown = displayCardNumber(item);
                    return (
                      <button
                        key={item.number}
                        type="button"
                        onClick={() =>
                          copyText(
                            shown,
                            `hist-${item.number}`,
                            interpolate(t.toastCopied, { value: shown })
                          )
                        }
                        className={styles.secondaryBtn}
                      >
                        <span className="font-mono">{shown}</span>
                        <span className="text-xs text-text-sub">
                          {copiedKey === `hist-${item.number}`
                            ? t.btnCopied
                            : getNetworkName(item.networkNameZh, item.networkNameEn)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ====== Tab 2: 驗證器模式 ====== */}
      {activeTab === 'validate' && (
        <div className="w-full grid grid-cols-[1.05fr_1.95fr] max-[1024px]:grid-cols-1 gap-6 items-start">
          <section className={styles.panel} aria-label={t.tabValidate}>
            <label
              htmlFor={validatorTextareaId}
              className="block text-sm font-medium text-text-sub mb-2"
            >
              {t.validatorInputLabel}
            </label>
            <textarea
              id={validatorTextareaId}
              rows={7}
              value={validatorInput}
              onChange={(e) => {
                setValidatorInput(e.target.value);
                setSelectedValIndex(0);
              }}
              placeholder={t.validatorInputPlaceholder}
              className={`${styles.textareaControl} font-mono`}
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setValidatorInput(
                    '4242 4242 4242 4242\n3782 822463 10005\n5555-5555-5555-4444\n4242 4242 4242 4240'
                  );
                  setSelectedValIndex(0);
                }}
                className={styles.secondaryBtn}
              >
                {t.validatorSampleBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValidatorInput('');
                  setSelectedValIndex(0);
                }}
                className={styles.secondaryBtn}
              >
                {t.validatorClearBtn}
              </button>
            </div>
          </section>

          <div className="min-w-0">
            <section className={styles.panel} aria-label={t.sectionResult}>
              {validationResults.length === 0 ? (
                <p className="text-sm text-text-sub leading-relaxed py-6 text-center">
                  {t.validatorEmptyHint}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={styles.badgeValid}>
                      {interpolate(t.validatorSummaryValid, { count: validCount })}
                    </span>
                    <span className={styles.badgeInvalid}>
                      {interpolate(t.validatorSummaryInvalid, { count: invalidCount })}
                    </span>
                  </div>

                  {/* 電腦表格 */}
                  <div className={`${styles.tableWrapper} hidden sm:block`}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>{t.colNumber}</th>
                          <th>{t.colNetwork}</th>
                          <th>{t.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResults.map((res, idx) => (
                          <tr
                            key={`${res.normalized}-${idx}`}
                            onClick={() => {
                              if (res.steps) setSelectedValIndex(idx);
                            }}
                            className={`${res.steps ? 'cursor-pointer' : ''} ${
                              selectedValIndex === idx ? styles.rowSelected : ''
                            }`}
                          >
                            <td className="font-mono font-bold tracking-wider">
                              <div>{res.formatted || res.normalized}</div>
                              {!res.valid && (
                                <div className="text-xs text-red-500 font-normal mt-0.5">
                                  {getValidationErrorText(res)}
                                </div>
                              )}
                            </td>
                            <td className="text-xs text-text-sub whitespace-nowrap">
                              {getNetworkName(res.networkNameZh, res.networkNameEn)}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className={res.valid ? styles.badgeValid : styles.badgeInvalid}>
                                  {res.valid ? t.statusValid : t.statusInvalid}
                                </span>
                                {res.steps && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedValIndex(idx);
                                    }}
                                    className={styles.secondaryBtn}
                                  >
                                    {t.inspectBreakdown}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 手機直式卡片 */}
                  <div className="block sm:hidden space-y-2.5">
                    {validationResults.map((res, idx) => (
                      <div
                        key={`${res.normalized}-${idx}`}
                        onClick={() => {
                          if (res.steps) setSelectedValIndex(idx);
                        }}
                        className={`${styles.mobileCard} ${res.steps ? 'cursor-pointer' : ''} ${
                          selectedValIndex === idx ? styles.mobileCardSelected : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={styles.badgeNeutral}>
                            {getNetworkName(res.networkNameZh, res.networkNameEn)}
                          </span>
                          <span className={res.valid ? styles.badgeValid : styles.badgeInvalid}>
                            {res.valid ? t.statusValid : t.statusInvalid}
                          </span>
                        </div>
                        <div className="font-mono text-base font-bold tracking-wider text-text-main break-all">
                          {res.formatted || res.normalized}
                        </div>
                        {!res.valid && (
                          <p className="text-xs text-red-500">{getValidationErrorText(res)}</p>
                        )}
                        {res.steps && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedValIndex(idx);
                            }}
                            className={styles.secondaryBtn}
                          >
                            {t.inspectBreakdown}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {activeValidatedItem &&
              activeValidatedItem.steps &&
              typeof activeValidatedItem.luhnSum === 'number' &&
              renderLuhnBreakdown(
                activeValidatedItem.formatted,
                activeValidatedItem.steps,
                activeValidatedItem.luhnSum,
                activeValidatedItem.valid,
                activeValidatedItem.remainder ?? 0,
                activeValidatedItem.expectedCheckDigit
              )}
          </div>
        </div>
      )}

      {/* 可折疊金流沙盒測試卡速查表 */}
      <section className={`${styles.panel} mt-6`} aria-label={t.sandboxTitle}>
        <button
          type="button"
          onClick={() => setShowSandbox((prev) => !prev)}
          aria-expanded={showSandbox}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div>
            <h2 className="text-base font-bold text-text-main">{t.sandboxTitle}</h2>
            <p className="text-xs text-text-sub mt-0.5">{t.sandboxSubtitle}</p>
          </div>
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-text-sub transition-transform duration-200 ${
              showSandbox ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showSandbox && (
          <div className="mt-4">
            <div className={`${styles.tableWrapper} hidden sm:block`}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t.sandboxProviderCol}</th>
                    <th>{t.sandboxScenarioCol}</th>
                    <th>{t.sandboxNumberCol}</th>
                    <th>{t.sandboxActionCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {SANDBOX_CARDS.map((card) => {
                    const shown = includeSpaces ? card.formatted : card.number;
                    return (
                      <tr key={card.number}>
                        <td className="text-xs font-semibold text-text-sub whitespace-nowrap">
                          {card.provider}
                        </td>
                        <td className="text-sm">
                          {lang === 'en' ? card.scenarioEn : card.scenarioZh}
                        </td>
                        <td className="font-mono font-bold tracking-wider whitespace-nowrap">
                          {shown}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                shown,
                                `sb-${card.number}`,
                                interpolate(t.toastCopied, { value: shown })
                              )
                            }
                            className={styles.secondaryBtn}
                          >
                            {copiedKey === `sb-${card.number}` ? t.btnCopied : t.btnCopy}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="block sm:hidden space-y-2.5">
              {SANDBOX_CARDS.map((card) => {
                const shown = includeSpaces ? card.formatted : card.number;
                return (
                  <div key={card.number} className={styles.mobileCard}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={styles.badgeNeutral}>{card.provider}</span>
                      <span className="text-xs text-text-sub">
                        {lang === 'en' ? card.scenarioEn : card.scenarioZh}
                      </span>
                    </div>
                    <div className="font-mono text-base font-bold text-text-main">{shown}</div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          shown,
                          `sbm-${card.number}`,
                          interpolate(t.toastCopied, { value: shown })
                        )
                      }
                      className={styles.secondaryBtn}
                    >
                      {copiedKey === `sbm-${card.number}` ? t.btnCopied : t.btnCopy}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 常見問題 FAQ */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#ffb800"
      />

      {/* Toast 提示 */}
      {toastMsg && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </ToolLayout>
  );
}
