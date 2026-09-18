'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import { downloadBlob } from '@/app/utils/downloadBlob';
import styles from './pac-tester.module.css';
import {
  MockContext,
  PacBatchItemResult,
  PacLintIssue,
  PacSingleTestResult,
} from './types';
import {
  DEFAULT_BATCH_TEST_URLS,
  lintPacScript,
  SAMPLE_PAC_SCRIPT,
} from './engine';
import { PacScriptTimeoutError, runBatchPacTestSafe, runSinglePacTestSafe } from './pacWorkerClient';
import { TRANSLATIONS } from './translations';

interface PacTesterClientProps {
  lang?: 'zh-TW' | 'en';
}


export default function PacTesterClient({ lang = 'zh-TW' }: PacTesterClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const isEn = lang === 'en';

  // 動態主題色注入 (Cyan #00f0ff)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.5)');
  }, []);


  // 狀態管理
  const [pacScript, setPacScript] = useState<string>(SAMPLE_PAC_SCRIPT);
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'mock'>('single');

  // 單次測試狀態
  const [singleUrl, setSingleUrl] = useState<string>('https://git.corp.internal/api');
  const [singleResult, setSingleResult] = useState<PacSingleTestResult | null>(null);
  const [isSingleRunning, setIsSingleRunning] = useState<boolean>(false);
  const [singleTimeoutError, setSingleTimeoutError] = useState<boolean>(false);

  // 批量測試狀態
  const [batchUrlsText, setBatchUrlsText] = useState<string>(DEFAULT_BATCH_TEST_URLS.join('\n'));
  const [batchResults, setBatchResults] = useState<PacBatchItemResult[]>([]);
  const [batchFilter, setBatchFilter] = useState<'ALL' | 'DIRECT' | 'PROXY' | 'ERROR'>('ALL');
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchTimeoutError, setBatchTimeoutError] = useState<boolean>(false);

  // 虛擬環境 Mock Context 狀態
  const [mockClientIpv4, setMockClientIpv4] = useState<string>('192.168.1.100');
  const [mockClientIpv6, setMockClientIpv6] = useState<string>('2001:db8::100');
  const [mockDnsText, setMockDnsText] = useState<string>('git.corp.internal 10.0.0.5\napi.internal 192.168.1.50');
  const [simulatedDay, setSimulatedDay] = useState<string>('AUTO');
  const [simulatedHour, setSimulatedHour] = useState<number | ''>('');

  // 檢查由 PAC 產生器帶來的程式碼
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const transferred = sessionStorage.getItem('pac_transfer_code');
      if (transferred && transferred.trim().length > 0) {
        setPacScript(transferred);
        sessionStorage.removeItem('pac_transfer_code');
      }
    }
  }, []);

  // 解析 Mock Context
  const mockContext: MockContext = useMemo(() => {
    const dnsMap: Record<string, string> = {};
    mockDnsText.split('\n').forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        dnsMap[parts[0].toLowerCase()] = parts[1];
      }
    });
    return {
      clientIpv4: mockClientIpv4.trim(),
      clientIpv6: mockClientIpv6.trim(),
      dnsMap,
      simulatedDay,
      simulatedHour: simulatedHour === '' ? -1 : Number(simulatedHour),
    };
  }, [mockClientIpv4, mockClientIpv6, mockDnsText, simulatedDay, simulatedHour]);

  // 靜態語法診斷 (Linter)
  const lintIssues: PacLintIssue[] = useMemo(() => {
    return lintPacScript(pacScript);
  }, [pacScript]);

  // 執行單次測試（於獨立 Worker 執行緒運行，逾時自動中止，避免頁面被使用者貼的腳本卡死）
  const handleRunSingleTest = async () => {
    if (isSingleRunning) return;
    setIsSingleRunning(true);
    setSingleTimeoutError(false);
    try {
      const res = await runSinglePacTestSafe(pacScript, singleUrl, mockContext);
      setSingleResult(res);
    } catch (err) {
      if (err instanceof PacScriptTimeoutError) {
        setSingleTimeoutError(true);
        setSingleResult(null);
      }
    } finally {
      setIsSingleRunning(false);
    }
  };

  // 清空單次測試
  const handleClearSingle = () => {
    setSingleUrl('');
    setSingleResult(null);
    setSingleTimeoutError(false);
  };

  // 執行批量測試（於獨立 Worker 執行緒運行，逾時自動中止，避免頁面被使用者貼的腳本卡死）
  const handleRunBatchTest = async () => {
    if (isBatchRunning) return;
    const urls = batchUrlsText.split('\n').filter((u) => u.trim().length > 0);
    setIsBatchRunning(true);
    setBatchTimeoutError(false);
    try {
      const results = await runBatchPacTestSafe(pacScript, urls, mockContext);
      setBatchResults(results);
    } catch (err) {
      if (err instanceof PacScriptTimeoutError) {
        setBatchTimeoutError(true);
        setBatchResults([]);
      }
    } finally {
      setIsBatchRunning(false);
    }
  };

  // 清空批量測試
  const handleClearBatch = () => {
    setBatchUrlsText('');
    setBatchResults([]);
    setBatchTimeoutError(false);
  };

  // 跨工具連動：送回 PAC 產生器匯入
  const handleSendToGenerator = () => {
    if (typeof window !== 'undefined' && pacScript.trim().length > 0) {
      sessionStorage.setItem('pac_tester_export_code', pacScript);
      const targetUrl = isEn ? '/pac-generator/en/' : '/pac-generator/';
      window.location.href = targetUrl;
    }
  };

  // 清除全部 (腳本、測試網址、單次與批量結果)
  const handleClearAll = () => {
    if (typeof window !== 'undefined' && pacScript.trim().length > 0) {
      if (!window.confirm(t.clearAllConfirmTip)) return;
    }
    setPacScript('');
    setSingleUrl('');
    setSingleResult(null);
    setSingleTimeoutError(false);
    setBatchUrlsText('');
    setBatchResults([]);
    setBatchTimeoutError(false);
  };

  // 重設 Mock Context 為預設值
  const handleResetMock = () => {
    setMockClientIpv4('192.168.1.100');
    setMockClientIpv6('2001:db8::100');
    setMockDnsText('git.corp.internal 10.0.0.5\napi.internal 192.168.1.50\nipv6.corp 2001:db8::5');
    setSimulatedDay('AUTO');
    setSimulatedHour('');
  };

  // 匯出 CSV 報表
  const handleExportCsv = () => {
    if (batchResults.length === 0) return;
    const header = ['URL', 'Host', 'Decision', 'Status', 'DurationMs', 'Error'];
    const rows = batchResults.map((r) => [
      `"${r.url.replace(/"/g, '""')}"`,
      `"${r.host}"`,
      `"${r.returnString.replace(/"/g, '""')}"`,
      r.status,
      r.executionTimeMs,
      `"${(r.error || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `pac_audit_report_${Date.now()}.csv`);
  };

  // 拖曳上傳 .pac 檔案
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setPacScript(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setPacScript(content);
      };
      reader.readAsText(file);
    }
  };

  // 篩選批量結果
  const filteredBatchResults = useMemo(() => {
    if (batchFilter === 'ALL') return batchResults;
    if (batchFilter === 'DIRECT') return batchResults.filter((r) => r.status === 'DIRECT');
    if (batchFilter === 'PROXY') return batchResults.filter((r) => r.status === 'PROXY' || r.status === 'SOCKS' || r.status === 'HTTPS');
    if (batchFilter === 'ERROR') return batchResults.filter((r) => r.status === 'ERROR');
    return batchResults;
  }, [batchResults, batchFilter]);

  // 初次掛載自動執行一次單次測試
  useEffect(() => {
    handleRunSingleTest();
  }, []);

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
    >
      <div className={styles.container}>
        {/* 左右雙欄 Grid */}
        <div className={styles.layoutGrid}>
          {/* 左欄：PAC 腳本編輯與語法診斷 */}
          <div className="flex flex-col gap-6 min-w-0">
            <div
              className={styles.panel}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span>{t.scriptPanelTitle}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPacScript(SAMPLE_PAC_SCRIPT)}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <span>{t.loadSampleBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToGenerator}
                    disabled={!pacScript.trim()}
                    title={t.sendToGeneratorBtn}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM5 5h5V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5h-2v5H5V5z" />
                    </svg>
                    <span>{t.sendToGeneratorBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    title={t.clearAllConfirmTip}
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    <span>{t.clearAllBtn}</span>
                  </button>

                  <label className={`${styles.actionButton} ${styles.secondaryButton} cursor-pointer`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                    </svg>
                    <span>{t.uploadBtn}</span>
                    <input
                      type="file"
                      accept=".pac,.js,.txt"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* 編輯器輸入區 */}
              <textarea
                value={pacScript}
                onChange={(e) => setPacScript(e.target.value)}
                placeholder="// 輸入 FindProxyForURL(url, host) 腳本..."
                className={styles.editorTextarea}
                spellCheck={false}
              />

              <div className="text-xs text-text-sub text-center italic">
                {t.dropzoneTip}
              </div>

              {/* 語法與相容性診斷 Bar */}
              <div className={`p-3 rounded-lg ${styles.diagnosticBar}`}>
                {lintIssues.length === 0 ? (
                  <div className={`flex items-center gap-2 text-sm font-medium ${styles.linterClean}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>{t.linter.clean}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-text-main">{t.linter.issuesFound}</span>
                    {lintIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`text-sm leading-relaxed flex items-start gap-1.5 ${
                          issue.severity === 'error'
                            ? styles.lintIssueError
                            : issue.severity === 'warning'
                            ? styles.lintIssueWarning
                            : styles.lintIssueInfo
                        }`}
                      >
                        <span className="shrink-0">•</span>
                        <span>{isEn ? issue.messageEn : issue.messageZh}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右欄：除錯執行面板 (Trace / Batch / Mock Tabs) */}
          <div className="flex flex-col gap-6 min-w-0">
            <div className={styles.panel}>
              {/* 子頁籤切換 */}
              <div className="flex border-b border-white/10 pb-3 gap-2 flex-wrap" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'single'}
                  onClick={() => setActiveTab('single')}
                  className={`${styles.subTab} ${activeTab === 'single' ? styles.subTabActive : ''}`}
                >
                  {t.tabs.single}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'batch'}
                  onClick={() => setActiveTab('batch')}
                  className={`${styles.subTab} ${activeTab === 'batch' ? styles.subTabActive : ''}`}
                >
                  {t.tabs.batch}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'mock'}
                  onClick={() => setActiveTab('mock')}
                  className={`${styles.subTab} ${activeTab === 'mock' ? styles.subTabActive : ''}`}
                >
                  {t.tabs.mock}
                </button>
              </div>

              {/* Tab 1: 單一網址 Trace */}
              {activeTab === 'single' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-sub mb-1.5">
                      {t.singleTest.urlLabel}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={singleUrl}
                        onChange={(e) => setSingleUrl(e.target.value)}
                        placeholder={t.singleTest.urlPlaceholder}
                        onKeyDown={(e) => e.key === 'Enter' && handleRunSingleTest()}
                        className={`flex-1 text-sm rounded-lg px-3.5 py-2.5 text-text-main focus:outline-none ${styles.fieldInput}`}
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleRunSingleTest}
                          disabled={isSingleRunning}
                          className={`${styles.actionButton} ${styles.primaryButton}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span>{isSingleRunning ? t.singleTest.runningBtn : t.singleTest.runBtn}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearSingle}
                          className={`${styles.actionButton} ${styles.secondaryButton}`}
                        >
                          <span>{t.singleTest.clearBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {singleTimeoutError && (
                    <div className={styles.errorBanner}>{t.singleTest.timeoutError}</div>
                  )}

                  {/* 測試結果看板 */}
                  {singleResult && (
                    <div className="flex flex-col gap-4 mt-2">
                      <div className={`p-4 rounded-xl flex flex-col gap-3 ${styles.resultCard}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-sub">
                              {t.singleTest.status}:
                            </span>
                            <span
                              className={`${styles.statusBadge} ${
                                singleResult.status === 'DIRECT'
                                  ? styles.statusDirect
                                  : singleResult.status === 'SOCKS'
                                  ? styles.statusSocks
                                  : singleResult.status === 'ERROR'
                                  ? styles.statusError
                                  : styles.statusProxy
                              }`}
                            >
                              {singleResult.status}
                            </span>
                          </div>

                          <span className="text-xs font-mono text-text-sub">
                            {t.singleTest.execTime}: {singleResult.executionTimeMs} ms
                          </span>
                        </div>

                        {/* 回傳字串標籤 */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-text-sub">{t.singleTest.proxyOutput}:</span>
                          <code className={`text-sm font-mono font-semibold ${styles.proxyOutputCode} ${styles.resultCode} p-2.5 rounded-lg break-all`}>
                            {singleResult.returnString}
                          </code>
                        </div>

                        {/* 請求解析與 IP 除錯細節 */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-text-sub pt-2.5 border-t border-white/5">
                          <div className={`p-2 rounded-lg flex flex-col gap-0.5 ${styles.metaCard}`}>
                            <span className="font-medium text-text-sub">{t.singleTest.targetHost}</span>
                            <span className="font-mono text-text-main truncate" title={singleResult.host}>{singleResult.host}</span>
                          </div>

                          <div className={`p-2 rounded-lg flex flex-col gap-0.5 ${styles.metaCard}`}>
                            <span className="font-medium text-text-sub">{t.singleTest.targetHostType}</span>
                            <span className="font-mono text-text-main">{singleResult.hostType}</span>
                          </div>

                          <div className={`p-2 rounded-lg flex flex-col gap-0.5 ${styles.metaCard}`}>
                            <span className="font-medium text-text-sub">{t.singleTest.resolvedIp}</span>
                            <span className="font-mono text-text-main truncate" title={singleResult.resolvedIp}>{singleResult.resolvedIp}</span>
                          </div>

                          <div className={`p-2 rounded-lg flex flex-col gap-0.5 ${styles.metaCard}`}>
                            <span className="font-medium text-text-sub">{t.singleTest.protocolAndPort}</span>
                            <span className="font-mono text-text-main">{singleResult.protocol.toUpperCase()} : {singleResult.port}</span>
                          </div>
                        </div>

                        {/* 客戶端本機 IP */}
                        <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg text-text-sub ${styles.metaCard}`}>
                          <span>{t.singleTest.clientIp}:</span>
                          <span className="font-mono text-text-main">{singleResult.clientIp}</span>
                        </div>

                        {singleResult.error && (
                          <div className={styles.errorBanner}>
                            {singleResult.error}
                          </div>
                        )}
                      </div>

                      {/* 逐步執行 Trace */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-text-sub flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          </svg>
                          <span>{t.singleTest.matchedRule} ({singleResult.traceSteps.length})</span>
                        </span>

                        {singleResult.traceSteps.length === 0 ? (
                          <div className={`text-xs text-text-sub p-3 italic rounded-lg ${styles.metaCard}`}>
                            {t.singleTest.noTrace}
                          </div>
                        ) : (
                          <div className={styles.traceTimeline}>
                            {singleResult.traceSteps.map((step, idx) => {
                              const isTrue = step.result === true;
                              return (
                                <div key={idx} className={styles.traceStepItem}>
                                  <span className="text-text-sub text-xs shrink-0">#{idx + 1}</span>
                                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <strong className="text-text-main">{step.functionName}</strong>
                                      <span className="text-text-sub truncate">
                                        ({step.args.map((a) => JSON.stringify(a)).join(', ')})
                                      </span>
                                    </div>
                                    <div className="text-xs flex items-center gap-1">
                                      <span className="text-text-sub">➔</span>
                                      <span
                                        className={
                                          isTrue
                                            ? styles.traceTrue
                                            : step.result === false
                                            ? 'text-text-sub'
                                            : styles.traceString
                                        }
                                      >
                                        {String(step.result)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: 批量回歸測試 */}
              {activeTab === 'batch' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-sub mb-1.5">
                      {t.batchTest.urlsLabel}
                    </label>
                    <textarea
                      value={batchUrlsText}
                      onChange={(e) => setBatchUrlsText(e.target.value)}
                      rows={5}
                      className={`w-full text-sm font-mono rounded-lg p-3 text-text-main focus:outline-none ${styles.fieldInput}`}
                    />
                  </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleRunBatchTest}
                        disabled={isBatchRunning}
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>{isBatchRunning ? t.batchTest.runningBtn : t.batchTest.runBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearBatch}
                        className={`${styles.actionButton} ${styles.secondaryButton}`}
                      >
                        <span>{t.batchTest.clearBtn}</span>
                      </button>

                      {batchResults.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className={`${styles.actionButton} ${styles.secondaryButton}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                          </svg>
                          <span>{t.batchTest.exportCsv}</span>
                        </button>
                      )}
                    </div>

                  {batchTimeoutError && (
                    <div className={styles.errorBanner}>{t.batchTest.timeoutError}</div>
                  )}

                  {/* 批量測試報表結果 */}
                  {batchResults.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                      {/* 篩選控制器 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['ALL', 'DIRECT', 'PROXY', 'ERROR'] as const).map((filter) => {
                          const count =
                            filter === 'ALL'
                              ? batchResults.length
                              : filter === 'DIRECT'
                              ? batchResults.filter((r) => r.status === 'DIRECT').length
                              : filter === 'PROXY'
                              ? batchResults.filter(
                                  (r) => r.status === 'PROXY' || r.status === 'SOCKS' || r.status === 'HTTPS'
                                ).length
                              : batchResults.filter((r) => r.status === 'ERROR').length;
                          return (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setBatchFilter(filter)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                batchFilter === filter
                                  ? styles.filterChipActive
                                  : 'border-white/10 text-text-sub hover:text-text-main'
                              }`}
                            >
                              {filter === 'ALL'
                                ? t.batchTest.filterAll
                                : filter === 'DIRECT'
                                ? t.batchTest.filterDirect
                                : filter === 'PROXY'
                                ? t.batchTest.filterProxy
                                : t.batchTest.filterError}{' '}
                              ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* 桌面端語意表格 */}
                      <div className="hidden sm:block overflow-x-auto border border-white/10 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 border-b border-white/10 text-text-sub font-semibold">
                            <tr>
                              <th className="p-2.5">{t.batchTest.colUrl}</th>
                              <th className="p-2.5">{t.batchTest.colResult}</th>
                              <th className="p-2.5">{t.batchTest.colStatus}</th>
                              <th className="p-2.5">{t.batchTest.colTime}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredBatchResults.map((item) => (
                              <tr key={item.id} className="hover:bg-white/[0.02]">
                                <td className="p-2.5 font-mono text-text-main truncate max-w-[200px]" title={item.url}>
                                  {item.url}
                                </td>
                                <td className={`p-2.5 font-mono ${styles.decisionText} truncate max-w-[200px]`} title={item.returnString}>
                                  {item.returnString}
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`${styles.statusBadge} ${
                                      item.status === 'DIRECT'
                                        ? styles.statusDirect
                                        : item.status === 'SOCKS'
                                        ? styles.statusSocks
                                        : item.status === 'ERROR'
                                        ? styles.statusError
                                        : styles.statusProxy
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono text-text-sub">
                                  {item.executionTimeMs}ms
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 手機端直式卡片清單 */}
                      <div className="block sm:hidden space-y-2">
                        {filteredBatchResults.map((item) => (
                          <div key={item.id} className={`p-3 rounded-xl flex flex-col gap-1.5 text-xs ${styles.resultCard}`}>
                            <div className="flex items-center justify-between">
                              <span
                                className={`${styles.statusBadge} ${
                                  item.status === 'DIRECT'
                                    ? styles.statusDirect
                                    : item.status === 'SOCKS'
                                    ? styles.statusSocks
                                    : item.status === 'ERROR'
                                    ? styles.statusError
                                    : styles.statusProxy
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="font-mono text-text-sub">{item.executionTimeMs}ms</span>
                            </div>
                            <span className="font-mono text-text-main break-all">{item.url}</span>
                            <span className={`font-mono ${styles.decisionText} break-all`}>{item.returnString}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Mock Context */}
              {activeTab === 'mock' && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-text-sub leading-relaxed">
                    {t.mockContext.desc}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-sub mb-1">
                        {t.mockContext.clientIpv4}
                      </label>
                      <input
                        type="text"
                        value={mockClientIpv4}
                        onChange={(e) => setMockClientIpv4(e.target.value)}
                        className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-sub mb-1">
                        {t.mockContext.clientIpv6}
                      </label>
                      <input
                        type="text"
                        value={mockClientIpv6}
                        onChange={(e) => setMockClientIpv6(e.target.value)}
                        className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-sub mb-1">
                      {t.mockContext.dnsMapTitle}
                    </label>
                    <textarea
                      value={mockDnsText}
                      onChange={(e) => setMockDnsText(e.target.value)}
                      placeholder={t.mockContext.dnsMapPlaceholder}
                      rows={4}
                      className={`w-full text-sm font-mono rounded-lg p-3 text-text-main focus:outline-none ${styles.fieldInput}`}
                    />
                  </div>

                  {/* 時間與排程模擬 (weekdayRange / timeRange) */}
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                    <span className="text-sm font-semibold text-text-main">
                      {t.mockContext.timeSimulationTitle}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-sub mb-1">
                          {t.mockContext.simulatedDay}
                        </label>
                        <select
                          value={simulatedDay}
                          onChange={(e) => setSimulatedDay(e.target.value)}
                          className="w-full text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                        >
                          <option value="AUTO">{t.mockContext.autoOption}</option>
                          <option value="MON">MON (星期一)</option>
                          <option value="TUE">TUE (星期二)</option>
                          <option value="WED">WED (星期三)</option>
                          <option value="THU">THU (星期四)</option>
                          <option value="FRI">FRI (星期五)</option>
                          <option value="SAT">SAT (星期六)</option>
                          <option value="SUN">SUN (星期日)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-sub mb-1">
                          {t.mockContext.simulatedHour}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={simulatedHour}
                          onChange={(e) =>
                            setSimulatedHour(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                          }
                          placeholder="例如: 14 (留空則隨系統時間)"
                          className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResetMock}
                      className={`${styles.actionButton} ${styles.secondaryButton}`}
                    >
                      <span>{t.mockContext.resetBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ 常見問題 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#00f0ff"
        />
      </div>
    </ToolLayout>
  );
}
