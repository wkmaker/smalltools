'use client';

import { useState, useEffect, useId, useRef, useCallback, useMemo } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import {
  COUNTY_LIST,
  SIX_MUNICIPALITIES,
  BATCH_COUNT_PRESETS,
  generateTaiwanIdBatch,
  validateTaiwanIdBatch,
  formatBatchExport,
  type IdType,
  type GenderOption,
  type GeneratedIdItem,
  type ValidationResult,
  type WeightStep,
} from './engine';
import { TRANSLATIONS } from './translations';
import styles from './taiwan-id-generator.module.css';

type ActiveTab = 'generate' | 'validate';

interface Props {
  lang?: 'zh-TW' | 'en';
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export default function TaiwanIdGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // 確定性表單控制項 ID（A11y 對稱綁定）
  const legacyCheckboxId = useId();
  const validatorTextareaId = useId();

  // 模式與產生器選項
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [idType, setIdType] = useState<IdType>('national');
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [includeLegacy, setIncludeLegacy] = useState<boolean>(false);
  const [gender, setGender] = useState<GenderOption>('random');
  const [batchCount, setBatchCount] = useState<number>(1);

  // 結果狀態（SSR 初始為空陣列，掛載後透過 CSPRNG 產生首批結果，避免 Hydration Mismatch）
  const [results, setResults] = useState<GeneratedIdItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 歷史紀錄遵循「呼吸留白」原則：初始為空陣列，僅手動重新產生時推入
  const [history, setHistory] = useState<GeneratedIdItem[]>([]);

  // 驗證器狀態
  const [validatorInput, setValidatorInput] = useState<string>('');
  const [selectedValIndex, setSelectedValIndex] = useState<number>(0);

  // 26 縣市代碼對照表折疊狀態
  const [showCountyRef, setShowCountyRef] = useState<boolean>(false);

  // 複製與 Toast 反饋
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 動態寫入工具主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ffaa');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 170, 0.55)');
  }, []);

  // 卸載時清理所有計時器
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // 初次掛載產生首批測試字號（不推入歷史紀錄）
  useEffect(() => {
    const initial = generateTaiwanIdBatch(
      { type: 'national', countyCodes: [], gender: 'random', includeLegacyCounties: false },
      1
    );
    setResults(initial);
    setSelectedId(initial[0]?.id ?? null);
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

  // 手動產生（將上一組代表項目推入本次工作階段紀錄）
  const handleGenerate = useCallback(
    (overrides?: Partial<{ type: IdType; counties: string[]; gen: GenderOption; count: number; legacy: boolean }>) => {
      const nextType = overrides?.type ?? idType;
      const nextCounties = overrides?.counties ?? selectedCounties;
      const nextGender = overrides?.gen ?? gender;
      const nextCount = overrides?.count ?? batchCount;
      const nextLegacy = overrides?.legacy ?? includeLegacy;

      if (results.length > 0) {
        const previousFirst = results[0];
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== previousFirst.id);
          return [previousFirst, ...filtered].slice(0, 12);
        });
      }

      const nextBatch = generateTaiwanIdBatch(
        {
          type: nextType,
          countyCodes: nextCounties,
          gender: nextGender,
          includeLegacyCounties: nextLegacy,
        },
        nextCount
      );
      setResults(nextBatch);
      setSelectedId(nextBatch[0]?.id ?? null);
    },
    [idType, selectedCounties, gender, batchCount, includeLegacy, results]
  );

  const toggleCounty = useCallback(
    (code: string) => {
      const next = selectedCounties.includes(code)
        ? selectedCounties.filter((c) => c !== code)
        : [...selectedCounties, code];
      setSelectedCounties(next);
      handleGenerate({ counties: next });
    },
    [selectedCounties, handleGenerate]
  );

  // 匯出檔案
  const handleExport = useCallback(
    (format: 'txt' | 'csv' | 'json') => {
      if (results.length === 0) return;
      const content = formatBatchExport(results, format, lang);
      const mimeMap: Record<'txt' | 'csv' | 'json', string> = {
        txt: 'text/plain;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
        json: 'application/json;charset=utf-8',
      };
      const bom = format === 'csv' ? '\uFEFF' : '';
      const blob = new Blob([bom + content], { type: mimeMap[format] });
      const url = URL.createObjectURL(blob);
      const filename = `taiwan-id-test-batch.${format}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(interpolate(t.toastExported, { filename }));
    },
    [results, lang, showToast, t.toastExported]
  );

  // 驗證器即時結果
  const validationResults = useMemo<ValidationResult[]>(() => {
    if (!validatorInput.trim()) return [];
    return validateTaiwanIdBatch(validatorInput);
  }, [validatorInput]);

  const validCount = useMemo(
    () => validationResults.filter((r) => r.valid).length,
    [validationResults]
  );
  const invalidCount = validationResults.length - validCount;

  const activeGeneratedItem = useMemo(
    () => results.find((item) => item.id === selectedId) ?? results[0] ?? null,
    [results, selectedId]
  );

  const activeValidatedItem = useMemo(
    () => validationResults[selectedValIndex] ?? validationResults[0] ?? null,
    [validationResults, selectedValIndex]
  );

  const getTypeLabel = (type: IdType): string => {
    if (type === 'national') return t.typeNational;
    if (type === 'new-resident') return t.typeNewResident;
    return t.typeOldResident;
  };

  const getGenderLabel = (g: 'male' | 'female'): string =>
    g === 'male' ? t.genderMale : t.genderFemale;

  const getCountyDisplayName = (zh: string, en: string): string =>
    lang === 'en' ? en : zh;

  const getValidationErrorText = (res: ValidationResult): string => {
    switch (res.errorCode) {
      case 'EMPTY':
        return t.errEmpty;
      case 'INVALID_LENGTH':
        return t.errLength;
      case 'INVALID_COUNTY':
        return t.errCounty;
      case 'INVALID_FORMAT':
        return t.errFormat;
      case 'INVALID_CHECKSUM':
        return interpolate(t.errChecksum, { expected: res.expectedCheckDigit ?? '?' });
      default:
        return '';
    }
  };

  const renderBreakdownPanel = (
    idStr: string,
    steps: WeightStep[],
    weightedSum: number,
    isValid: boolean,
    remainder = 0,
    expectedCheckDigit?: number
  ) => (
    <div className={`${styles.panel} mt-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
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
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
            <line x1="8" y1="18" x2="16" y2="18" />
          </svg>
          <h3 className="text-base font-bold text-text-main">{t.breakdownTitle}</h3>
          <span className="font-mono text-sm font-semibold px-2 py-0.5 rounded-md bg-black/10 text-text-main">
            {idStr}
          </span>
        </div>
        <span className={isValid ? styles.badgeValid : styles.badgeInvalid}>
          {isValid ? t.statusValid : t.statusInvalid}
        </span>
      </div>

      {/* 電腦／平板：11 格橫向權重拆解 */}
      <div className="hidden md:block overflow-x-auto pb-1">
        <div className={styles.weightGrid}>
          {steps.map((step, idx) => (
            <div key={idx} className={styles.weightCell}>
              <span className="text-xs text-text-sub">{step.label}</span>
              <span className="text-sm font-bold text-text-main">{step.digit}</span>
              <span className="text-xs text-text-sub">× {step.weight}</span>
              <span className={`text-sm font-bold ${styles.accentText}`}>{step.product}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 手機版：直式精簡表 */}
      <div className="block md:hidden space-y-1.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/5 text-sm font-mono"
          >
            <span className="text-text-sub text-xs">{step.label}</span>
            <span className="text-text-main">
              {step.digit} × {step.weight}
            </span>
            <span className={`font-bold ${styles.accentText}`}>= {step.product}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border-glass flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-text-sub">
          {t.breakdownFormulaPrefix}：
          <strong className="font-mono text-text-main ml-1">{weightedSum}</strong>
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
      accentColor="#00ffaa"
      accentGlow="rgba(0, 255, 170, 0.55)"
    >
      {/* 合規與免責聲明橫幅 */}
      <div className={styles.disclaimerBanner} role="note">
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.disclaimerIcon}
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
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
              <line x1="6" y1="10" x2="10" y2="10" />
              <line x1="6" y1="14" x2="14" y2="14" />
              <circle cx="16.5" cy="11.5" r="1.5" />
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
          {/* 左側：條件設定面板 */}
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
              {/* 證號類型 */}
              <div>
                <span className="block text-sm font-medium text-text-sub mb-2">{t.labelIdType}</span>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      { value: 'national', title: t.typeNational, desc: t.typeNationalDesc },
                      { value: 'new-resident', title: t.typeNewResident, desc: t.typeNewResidentDesc },
                      { value: 'old-resident', title: t.typeOldResident, desc: t.typeOldResidentDesc },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setIdType(opt.value);
                        handleGenerate({ type: opt.value });
                      }}
                      className={`${styles.segmentBtn} ${
                        idType === opt.value ? styles.segmentBtnActive : ''
                      } text-left flex flex-col gap-0.5 px-3.5 py-2.5`}
                    >
                      <span className="text-sm font-semibold">{opt.title}</span>
                      <span className="text-xs text-text-sub font-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 發證縣市（多選） */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-text-sub">{t.labelCounty}</span>
                  <span className={styles.badgeNeutral}>
                    {selectedCounties.length === 0
                      ? t.countyRandom
                      : interpolate(t.countySelectedCount, { count: selectedCounties.length })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...SIX_MUNICIPALITIES];
                      setSelectedCounties(next);
                      handleGenerate({ counties: next });
                    }}
                    className={styles.secondaryBtn}
                  >
                    {t.countyPresetSix}
                  </button>
                  {selectedCounties.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCounties([]);
                        handleGenerate({ counties: [] });
                      }}
                      className={styles.secondaryBtn}
                    >
                      {t.countyClearSelection}
                    </button>
                  )}
                </div>

                <div className={styles.countyChipGrid} role="group" aria-label={t.labelCounty}>
                  {COUNTY_LIST.map((c) => {
                    const active = selectedCounties.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCounty(c.code)}
                        className={`${styles.countyChip} ${active ? styles.countyChipActive : ''}`}
                      >
                        <span className="font-mono font-bold shrink-0">{c.code}</span>
                        <span className="truncate">{getCountyDisplayName(c.nameZh, c.nameEn)}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-text-sub mt-1.5 leading-relaxed">{t.countyHintMulti}</p>

                {selectedCounties.length === 0 && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      id={legacyCheckboxId}
                      type="checkbox"
                      checked={includeLegacy}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeLegacy(checked);
                        handleGenerate({ legacy: checked });
                      }}
                      className="w-4 h-4 accent-[#0d9488] cursor-pointer"
                    />
                    <label htmlFor={legacyCheckboxId} className="text-xs text-text-sub cursor-pointer">
                      {t.includeLegacyLabel}
                    </label>
                  </div>
                )}
              </div>

              {/* 性別 */}
              <div>
                <span className="block text-sm font-medium text-text-sub mb-2">{t.labelGender}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'random', label: t.genderRandom },
                      { value: 'male', label: t.genderMale },
                      { value: 'female', label: t.genderFemale },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGender(opt.value);
                        handleGenerate({ gen: opt.value });
                      }}
                      className={`${styles.segmentBtn} ${
                        gender === opt.value ? styles.segmentBtnActive : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 產生筆數 */}
              <div>
                <span className="block text-sm font-medium text-text-sub mb-2">{t.labelBatchCount}</span>
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

              {/* 產生按鈕 */}
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

          {/* 右側：結果看板與驗算 */}
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
                          results.map((r) => r.id).join('\n'),
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

              {/* 焦點大字展示（永遠顯示第一筆或當前選取筆數） */}
              {activeGeneratedItem && (
                <div className={styles.heroIdBox}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className={`${styles.heroIdText} truncate min-w-0`}>
                      {activeGeneratedItem.id}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          activeGeneratedItem.id,
                          `hero-${activeGeneratedItem.id}`,
                          interpolate(t.toastCopied, { id: activeGeneratedItem.id })
                        )
                      }
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
                        {copiedKey === `hero-${activeGeneratedItem.id}` ? t.btnCopied : t.btnCopy}
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={styles.badgeValid}>{getTypeLabel(activeGeneratedItem.type)}</span>
                    <span className={styles.badgeNeutral}>
                      {activeGeneratedItem.countyCode} ·{' '}
                      {getCountyDisplayName(
                        activeGeneratedItem.countyNameZh,
                        activeGeneratedItem.countyNameEn
                      )}
                    </span>
                    <span className={styles.badgeNeutral}>
                      {getGenderLabel(activeGeneratedItem.gender)} ({activeGeneratedItem.genderCode})
                    </span>
                  </div>
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
                          <th>{t.colId}</th>
                          <th>{t.colType}</th>
                          <th>{t.colCounty}</th>
                          <th>{t.colGender}</th>
                          <th>{t.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item, idx) => {
                          const isSelected = activeGeneratedItem?.id === item.id;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedId(item.id)}
                              className={`cursor-pointer ${isSelected ? styles.rowSelected : ''}`}
                            >
                              <td className="text-text-sub font-mono text-xs">{idx + 1}</td>
                              <td className="font-mono font-bold tracking-wider">{item.id}</td>
                              <td className="text-xs text-text-sub">{getTypeLabel(item.type)}</td>
                              <td className="text-sm">
                                {item.countyCode} ·{' '}
                                {getCountyDisplayName(item.countyNameZh, item.countyNameEn)}
                              </td>
                              <td className="text-sm">{getGenderLabel(item.gender)}</td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyText(
                                        item.id,
                                        `row-${item.id}`,
                                        interpolate(t.toastCopied, { id: item.id })
                                      );
                                    }}
                                    className={styles.secondaryBtn}
                                  >
                                    {copiedKey === `row-${item.id}` ? t.btnCopied : t.btnCopy}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedId(item.id);
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
                      const isSelected = activeGeneratedItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`${styles.mobileCard} cursor-pointer ${
                            isSelected ? styles.mobileCardSelected : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-base font-bold tracking-wider text-text-main">
                              {item.id}
                            </span>
                            <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className={styles.badgeNeutral}>{getTypeLabel(item.type)}</span>
                            <span className={styles.badgeNeutral}>
                              {item.countyCode} ·{' '}
                              {getCountyDisplayName(item.countyNameZh, item.countyNameEn)}
                            </span>
                            <span className={styles.badgeNeutral}>{getGenderLabel(item.gender)}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(
                                  item.id,
                                  `m-${item.id}`,
                                  interpolate(t.toastCopied, { id: item.id })
                                );
                              }}
                              className={`${styles.secondaryBtn} flex-1`}
                            >
                              {copiedKey === `m-${item.id}` ? t.btnCopied : t.btnCopy}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(item.id);
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

            {/* 加權檢查碼拆解 */}
            {activeGeneratedItem &&
              renderBreakdownPanel(
                activeGeneratedItem.id,
                activeGeneratedItem.steps,
                activeGeneratedItem.weightedSum,
                true,
                0,
                activeGeneratedItem.checkDigit
              )}

            {/* 歷史紀錄（僅在使用者手動重新產生後才顯示，保持初次載入呼吸留白） */}
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
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        copyText(
                          item.id,
                          `hist-${item.id}`,
                          interpolate(t.toastCopied, { id: item.id })
                        )
                      }
                      className={styles.secondaryBtn}
                    >
                      <span className="font-mono tracking-wider">{item.id}</span>
                      <span className="text-xs text-text-sub">
                        {copiedKey === `hist-${item.id}` ? t.btnCopied : item.countyCode}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ====== Tab 2: 驗證與解析模式 ====== */}
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
                  setValidatorInput('A123456789\nA800000014\nAC12345679\nF223456780');
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
                          <th>{t.colId}</th>
                          <th>{t.colType}</th>
                          <th>{t.colCounty}</th>
                          <th>{t.colGender}</th>
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
                              <div>{res.normalized}</div>
                              {!res.valid && (
                                <div className="text-xs text-red-500 font-normal mt-0.5">
                                  {getValidationErrorText(res)}
                                </div>
                              )}
                            </td>
                            <td className="text-xs text-text-sub">
                              {res.type ? getTypeLabel(res.type) : '—'}
                            </td>
                            <td className="text-sm">
                              {res.countyCode && res.countyNameZh && res.countyNameEn
                                ? `${res.countyCode} · ${getCountyDisplayName(
                                    res.countyNameZh,
                                    res.countyNameEn
                                  )}`
                                : '—'}
                            </td>
                            <td className="text-sm">
                              {res.gender ? getGenderLabel(res.gender) : '—'}
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
                          <span className="font-mono text-base font-bold tracking-wider text-text-main">
                            {res.normalized}
                          </span>
                          <span className={res.valid ? styles.badgeValid : styles.badgeInvalid}>
                            {res.valid ? t.statusValid : t.statusInvalid}
                          </span>
                        </div>
                        {!res.valid && (
                          <p className="text-xs text-red-500">{getValidationErrorText(res)}</p>
                        )}
                        {res.type && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className={styles.badgeNeutral}>{getTypeLabel(res.type)}</span>
                            {res.countyCode && res.countyNameZh && res.countyNameEn && (
                              <span className={styles.badgeNeutral}>
                                {res.countyCode} ·{' '}
                                {getCountyDisplayName(res.countyNameZh, res.countyNameEn)}
                              </span>
                            )}
                            {res.gender && (
                              <span className={styles.badgeNeutral}>
                                {getGenderLabel(res.gender)}
                              </span>
                            )}
                          </div>
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
              typeof activeValidatedItem.weightedSum === 'number' &&
              renderBreakdownPanel(
                activeValidatedItem.normalized,
                activeValidatedItem.steps,
                activeValidatedItem.weightedSum,
                activeValidatedItem.valid,
                activeValidatedItem.remainder ?? 0,
                activeValidatedItem.expectedCheckDigit
              )}
          </div>
        </div>
      )}

      {/* 可折疊 26 縣市代碼對照表 */}
      <section className={`${styles.panel} mt-6`} aria-label={t.countyRefTitle}>
        <button
          type="button"
          onClick={() => setShowCountyRef((prev) => !prev)}
          aria-expanded={showCountyRef}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div>
            <h2 className="text-base font-bold text-text-main">{t.countyRefTitle}</h2>
            <p className="text-xs text-text-sub mt-0.5">{t.countyRefSubtitle}</p>
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
              showCountyRef ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showCountyRef && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {COUNTY_LIST.map((c) => (
              <div
                key={c.code}
                className="p-2.5 rounded-xl border border-border-glass bg-black/5 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-base font-bold ${styles.accentText}`}>
                    {c.code}
                  </span>
                  <span className="font-mono text-xs text-text-sub">{c.numericValue}</span>
                </div>
                <span className="text-xs text-text-main font-medium truncate">
                  {getCountyDisplayName(c.nameZh, c.nameEn)}
                </span>
                <span className="text-xs text-text-sub">
                  {c.legacy ? t.countyRefLegacy : t.countyRefActive}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 常見問題 FAQ */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#00ffaa"
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
