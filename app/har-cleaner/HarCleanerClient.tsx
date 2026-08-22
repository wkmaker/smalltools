'use client';

import React, { useState, useEffect, useId, useCallback, useRef } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import {
  SanitizeRules,
  SanitizedStats,
  HarEntryAnalysis,
  SanitizationResult,
  DetectedHeaderItem,
} from './types';
import { TRANSLATIONS, generateSampleHar } from './constants';
import { sanitizeHarAsync } from './engine/sanitizer';

// 子組件引入 (模組化解耦)
import DropzoneSection from './components/DropzoneSection';
import RuleConfigPanel from './components/RuleConfigPanel';
import HeaderAuditSection from './components/HeaderAuditSection';
import MetricsDashboard from './components/MetricsDashboard';
import SummaryTab from './components/SummaryTab';
import InspectorTab from './components/InspectorTab';
import RawJsonTab from './components/RawJsonTab';
import EntryDetailModal from './components/EntryDetailModal';

export default function HarCleanerClient({ lang = 'zh-TW' }: { lang?: 'zh-TW' | 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // IDs for accessibility
  const customKeywordsId = useId();
  const redactionTextId = useId();
  const searchInputId = useId();
  const fileInputId = useId();

  // 主題註冊
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#06b6d4');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(6, 182, 212, 0.6)');
  }, []);

  // 核心狀態
  const [rawHarData, setRawHarData] = useState<any | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('session.har');
  const [activeTab, setActiveTab] = useState<'summary' | 'inspector' | 'raw'>('summary');
  const [selectedEntry, setSelectedEntry] = useState<HarEntryAnalysis | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 脫敏全域規則配置
  const [rules, setRules] = useState<SanitizeRules>({
    authHeaders: true,
    cookies: true,
    queryParams: true,
    postData: true,
    creditCard: true,
    regexDeep: true,
    stripMedia: true,
    stripTrackers: true,
    customKeywords: '',
    redactionText: '[REDACTED]',
  });

  // 個別不消除的標頭黑名單 (Key: normalized name, true = 保留不消除)
  const [excludedHeaders, setExcludedHeaders] = useState<Record<string, boolean>>({});

  // 脫敏運算結果狀態
  const [result, setResult] = useState<SanitizationResult>({
    cleanedHar: null,
    stats: {
      totalRequests: 0,
      sanitizedRequests: 0,
      redactedHeaders: 0,
      redactedCookies: 0,
      redactedQueryParams: 0,
      redactedBodies: 0,
      redactedRegexItems: 0,
      redactedCustomKeywords: 0,
      redactedCreditCards: 0,
      strippedMediaItems: 0,
      strippedTrackers: 0,
      originalSizeBytes: 0,
      cleanedSizeBytes: 0,
    },
    entriesAnalysis: [],
    detectedHeaders: [],
  });

  // 非同步調度運算 (防阻塞主執行緒)
  const isMountedRef = useRef(false);
  const activeRunIdRef = useRef(0);

  useEffect(() => {
    if (!rawHarData) {
      setResult({
        cleanedHar: null,
        stats: {
          totalRequests: 0,
          sanitizedRequests: 0,
          redactedHeaders: 0,
          redactedCookies: 0,
          redactedQueryParams: 0,
          redactedBodies: 0,
          redactedRegexItems: 0,
          redactedCustomKeywords: 0,
          redactedCreditCards: 0,
          strippedMediaItems: 0,
          strippedTrackers: 0,
          originalSizeBytes: originalFileSize,
          cleanedSizeBytes: 0,
        },
        entriesAnalysis: [],
        detectedHeaders: [],
      });
      return;
    }

    const currentRunId = ++activeRunIdRef.current;
    setIsProcessing(true);

    sanitizeHarAsync(rawHarData, originalFileSize, rules, excludedHeaders, lang)
      .then((res) => {
        if (currentRunId === activeRunIdRef.current) {
          setResult(res);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Sanitization Error:', err);
        if (currentRunId === activeRunIdRef.current) {
          setIsProcessing(false);
        }
      });
  }, [rawHarData, originalFileSize, rules, excludedHeaders, lang]);

  // 格式化位元組輔助函式
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const savingsPercent =
    result.stats.originalSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            ((result.stats.originalSizeBytes - result.stats.cleanedSizeBytes) /
              result.stats.originalSizeBytes) *
              100
          )
        )
      : 0;

  // 上傳檔案處理
  const handleFileLoaded = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setOriginalFileSize(file.size);
    setExcludedHeaders({});
    setSelectedEntry(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !parsed.log) {
          alert(
            lang === 'en'
              ? 'Invalid HAR file format (missing root "log" object).'
              : '無效的 HAR 格式（缺少根 "log" 物件）。'
          );
          return;
        }
        setRawHarData(parsed);
      } catch (err) {
        alert(
          lang === 'en'
            ? 'Failed to parse JSON. Please verify your HAR file.'
            : 'JSON 解析失敗，請確認檔案是否為合法的 HAR 格式。'
        );
      }
    };
    reader.readAsText(file);
  };

  // 載入示範 HAR
  const handleLoadSample = () => {
    const sample = generateSampleHar();
    const jsonStr = JSON.stringify(sample);
    setRawHarData(sample);
    setOriginalFileSize(new Blob([jsonStr]).size);
    setFileName('sample_session.har');
    setExcludedHeaders({});
    setSelectedEntry(null);
  };

  // 重置清空
  const handleReset = () => {
    setRawHarData(null);
    setOriginalFileSize(0);
    setFileName('session.har');
    setSelectedEntry(null);
    setExcludedHeaders({});
  };

  // 下載脫敏 HAR
  const handleDownload = () => {
    if (!result.cleanedHar) return;
    const jsonStr = JSON.stringify(result.cleanedHar, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const outName = fileName.replace(/\.har$/i, '') + '_sanitized.har';
    a.href = url;
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 複製乾淨 JSON
  const handleCopyJson = () => {
    if (!result.cleanedHar) return;
    const jsonStr = JSON.stringify(result.cleanedHar, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 匯出脫敏稽核報告
  const handleExportReport = () => {
    if (!result.cleanedHar) return;
    const lines = [
      `# HAR Sanitization Audit Report`,
      `Date: ${new Date().toISOString()}`,
      `Original File: ${fileName}`,
      `Original Size: ${(result.stats.originalSizeBytes / 1024).toFixed(1)} KB`,
      `Cleaned Size: ${(result.stats.cleanedSizeBytes / 1024).toFixed(1)} KB (Savings: ${savingsPercent}%)`,
      ``,
      `## Summary Statistics`,
      `- Total Scanned Requests: ${result.stats.totalRequests}`,
      `- Sanitized Requests: ${result.stats.sanitizedRequests}`,
      `- Redacted Headers: ${result.stats.redactedHeaders}`,
      `- Redacted Cookies: ${result.stats.redactedCookies}`,
      `- Redacted Query Params: ${result.stats.redactedQueryParams}`,
      `- Redacted Body Fields: ${result.stats.redactedBodies}`,
      `- Custom Keyword Redactions: ${result.stats.redactedCustomKeywords}`,
      `- Credit Card & Payment Redactions: ${result.stats.redactedCreditCards}`,
      `- Regex Pattern Redactions: ${result.stats.redactedRegexItems}`,
      `- Stripped Media Payloads: ${result.stats.strippedMediaItems}`,
      `- Filtered Trackers: ${result.stats.strippedTrackers}`,
      ``,
      `## Unique Detected Headers & Decisions`,
    ];

    result.detectedHeaders.forEach((h: DetectedHeaderItem) => {
      const isRedacted = !excludedHeaders[h.normalizedName];
      lines.push(
        `- **${h.name}** [${h.scope}] (${h.count} instances) -> Rule: ${h.matchedRule} -> Action: ${
          isRedacted ? 'REDACTED' : 'PRESERVED'
        }`
      );
    });

    lines.push(``);
    lines.push(`## Sanitized Entries Breakdown`);

    result.entriesAnalysis.forEach((entry, idx) => {
      if (entry.isSanitized) {
        lines.push(
          `### [${idx + 1}] ${entry.original.request?.method || 'GET'} ${
            entry.original.request?.url
          }`
        );
        lines.push(`- Status: ${entry.original.response?.status || 200}`);
        lines.push(`- Redaction Triggers:`);
        entry.reasons.forEach((r) => lines.push(`  * ${r}`));
        lines.push(``);
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitization_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 標頭消除控制
  const handleToggleHeaderRedaction = (normalizedName: string) => {
    setExcludedHeaders((prev) => ({
      ...prev,
      [normalizedName]: !prev[normalizedName],
    }));
  };

  const handleSelectAllHeaders = () => {
    setExcludedHeaders({});
  };

  const handleDeselectAllHeaders = () => {
    const next: Record<string, boolean> = {};
    result.detectedHeaders.forEach((h) => {
      next[h.normalizedName] = true;
    });
    setExcludedHeaders(next);
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#06b6d4"
      accentGlow="rgba(6, 182, 212, 0.6)"
      extraHeaderControls={
        <Link
          href={t.langToggleUrl}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langToggleLabel}
        </Link>
      }
    >
      <div className="w-full space-y-6">
        {/* 上傳與已載入檔案狀態控制列 */}
        <DropzoneSection
          rawHarData={rawHarData}
          fileName={fileName}
          originalFileSize={originalFileSize}
          totalRequests={result.stats.totalRequests}
          isProcessing={isProcessing}
          copied={copied}
          fileInputId={fileInputId}
          t={t}
          formatBytes={formatBytes}
          onFileLoaded={handleFileLoaded}
          onLoadSample={handleLoadSample}
          onDownload={handleDownload}
          onCopyJson={handleCopyJson}
          onExportReport={handleExportReport}
          onReset={handleReset}
        />

        {/* 脫敏配置全域規則面板 */}
        <RuleConfigPanel
          rules={rules}
          customKeywordsId={customKeywordsId}
          redactionTextId={redactionTextId}
          t={t}
          onRulesChange={setRules}
        />

        {/* 不重複敏感標頭審核與消除控制區塊 */}
        {rawHarData && (
          <HeaderAuditSection
            detectedHeadersList={result.detectedHeaders}
            excludedHeaders={excludedHeaders}
            lang={lang}
            t={t}
            onToggleHeaderRedaction={handleToggleHeaderRedaction}
            onSelectAllHeaders={handleSelectAllHeaders}
            onDeselectAllHeaders={handleDeselectAllHeaders}
          />
        )}

        {/* 儀表板指標卡片 */}
        {rawHarData && (
          <MetricsDashboard
            stats={result.stats}
            savingsPercent={savingsPercent}
            t={t}
            formatBytes={formatBytes}
          />
        )}

        {/* 視圖分頁切換 Tabs */}
        {rawHarData && (
          <div className="w-full space-y-4">
            <div className="flex border-b border-border-glass gap-2 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabSummary}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inspector')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'inspector'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabInspector} ({result.entriesAnalysis.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'raw'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabRawJson}
              </button>
            </div>

            {/* TAB 1: 摘要看板 */}
            {activeTab === 'summary' && (
              <SummaryTab
                stats={result.stats}
                savingsPercent={savingsPercent}
                t={t}
                formatBytes={formatBytes}
              />
            )}

            {/* TAB 2: 請求檢視器 */}
            {activeTab === 'inspector' && (
              <InspectorTab
                entriesAnalysis={result.entriesAnalysis}
                searchInputId={searchInputId}
                lang={lang}
                t={t}
                onSelectEntry={setSelectedEntry}
              />
            )}

            {/* TAB 3: 乾淨 HAR JSON */}
            {activeTab === 'raw' && (
              <RawJsonTab
                cleanedHar={result.cleanedHar}
                copied={copied}
                t={t}
                onCopyJson={handleCopyJson}
              />
            )}
          </div>
        )}

        {/* 請求詳細審核 Modal */}
        {selectedEntry && (
          <EntryDetailModal
            selectedItem={selectedEntry}
            redactionText={rules.redactionText}
            lang={lang}
            t={t}
            onClose={() => setSelectedEntry(null)}
          />
        )}

        {/* 常見問題 FAQ 區塊 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#06b6d4"
        />
      </div>
    </ToolLayout>
  );
}
