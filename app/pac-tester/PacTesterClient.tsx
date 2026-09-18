'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
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
  runBatchPacTest,
  runSinglePacTest,
  SAMPLE_PAC_SCRIPT,
} from './engine';

interface PacTesterClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'PAC 測試與除錯器',
    subtitle: 'PROXY AUTO-CONFIG DEBUGGER & SIMULATOR',
    description: '專業安全純前端 PAC 模擬執行與除錯環境。支援單一網址深度 Trace、批量網址回歸測試、IPv6 (isInNetEx) 模擬與 DNS 虛擬沙盒，100% 瀏覽器本機運算。',
    scriptPanelTitle: 'PAC 腳本來源 (JavaScript)',
    loadSampleBtn: '載入示範腳本',
    clearScriptBtn: '清空腳本',
    clearAllBtn: '清除全部',
    clearAllConfirmTip: '確定要清空腳本、測試網址與所有測試結果嗎？',
    uploadBtn: '上傳 .pac 檔案',
    dropzoneTip: '支援直接拖曳 .pac 或 .js 檔案至此處載入',
    tabs: {
      single: '單一網址深度除錯 (Trace)',
      batch: '批量網址回歸測試 (Batch)',
      mock: '虛擬環境與 DNS 模擬',
    },
    singleTest: {
      urlLabel: '測試網址 (URL)',
      urlPlaceholder: '輸入欲測試的網址，如 https://git.corp.internal/api',
      runBtn: '執行模擬測試',
      clearBtn: '清空',
      resultTitle: '測試結果評估',
      status: '最終分流決策',
      proxyOutput: '回傳字串',
      execTime: '執行耗時',
      matchedRule: '執行歷程與條件追蹤 (Execution Trace)',
      noTrace: '此請求未呼叫任何 PAC 內建比對函式或直接由頂層回傳。',
      targetHost: '目標主機名',
      targetPort: '目標連接埠',
      targetProtocol: '協議類型',
    },
    batchTest: {
      urlsLabel: '待測網址清單 (每行一個)',
      runBtn: '執行批量測試',
      clearBtn: '清空網址',
      exportCsv: '匯出 CSV 報表',
      filterAll: '全部結果',
      filterDirect: '僅直連 (DIRECT)',
      filterProxy: '僅代理 (PROXY/SOCKS)',
      filterError: '僅錯誤 (ERROR)',
      colUrl: '測試網址',
      colHost: '目標主機',
      colResult: '分流決策',
      colStatus: '狀態',
      colTime: '耗時',
      summary: '統計摘要',
      totalCount: '總計',
    },
    mockContext: {
      title: '自訂虛擬客戶端網路環境 (Mock Context)',
      desc: '模擬客戶端本機 IP 與特定主機的 DNS 解析結果，無需更動您目前的真實網路連線即可測試邊界情境。',
      clientIpv4: '模擬客戶端 IPv4 (myIpAddress)',
      clientIpv6: '模擬客戶端 IPv6 (myIpAddressEx)',
      dnsMapTitle: 'Mock DNS 靜態解析映射 (每行格式: host ip)',
      dnsMapPlaceholder: '例如:\nintranet.corp 10.0.1.5\napi.internal 192.168.1.50\nipv6.corp 2001:db8::5',
      resetBtn: '恢復預設值',
    },
    linter: {
      clean: '腳本語法檢驗正常，已具備標準 FindProxyForURL 函式。',
      issuesFound: '偵測到語法或相容性關注事項：',
    },
    faqTitle: '常見問題與技術解析',
    faqSubtitle: '深入瞭解 PAC 除錯技巧、執行 Trace、批量回歸與 IPv6 虛擬模擬',
    faqItems: [
      {
        q: '除錯器是否支援 IPv6？如何測試 isInNetEx 與 IPv6 網段？',
        a: `是的，本除錯器具備純前端沙盒引擎，完整支援現代 IPv6 PAC 擴展標準：

① 128 位元 CIDR 前綴比對：
底層以 BigInt 精確運算，支援 isInNetEx(host, "fc00::/7")、isInNetEx(host, "2001:db8::/32") 等任何 IPv6 CIDR 遮罩。

② IPv6 目標網址與主機名稱：
您可在單一或批量測試中直接輸入帶有方括號的 IPv6 網址（如 https://[fc00::1]/service 或 http://[2001:db8::1]:8080/），沙盒能自動解析並比對。

③ 虛擬客戶端雙棧 IP (myIpAddressEx)：
在「虛擬環境與 DNS 模擬」頁籤中，可自訂模擬客戶端的 IPv6 位址，供腳本中的 myIpAddressEx() 使用。

④ Mock DNS IPv6 映射：
您可以在 Mock DNS 中將特定內部網域映射到 IPv6 位址（例如 internal.svc 2001:db8::100），以此測試網域名稱解析後的 IPv6 分流策略。`,
      },
      {
        q: '為什麼需要 PAC 測試與除錯器？傳統排查有何痛點？',
        a: `在作業系統或瀏覽器（如 Chrome / Edge / macOS）中套用 PAC 檔案時，整個網路棧是處於「黑箱狀態」的：

① 缺乏日誌與報錯：若 PAC 腳本發生語法錯誤或例外，瀏覽器通常會直接靜默忽略，並全部降階走 DIRECT 直連，使用者完全不知道哪裡出錯。
② 快取干擾除錯：瀏覽器通常會快取 PAC 解析結果數十分鐘，即使修改了設定也很難確認是否生效。
③ 無法追蹤命中邏輯：當配置了數十條規則時，很難肉眼判斷特定網址到底是被哪一條規則攔截。

本工具提供純前端沙盒環境，即時顯示每個網址的命中步驟與執行耗時，徹底解決黑箱除錯的痛苦。`,
      },
      {
        q: '如何利用單一網址 Trace (執行軌跡) 抓出規則遮蔽（Dead Code）問題？',
        a: `PAC 腳本的 FindProxyForURL 函式遵循「由上而下依序比對，命中即退出 (Short-circuit)」原則。

若在前面寫了一條範圍過寬的規則（例如 shExpMatch(host, "*.internal") 或廣域子網），它會在特殊規則之前被命中並直接 return。

透過本工具的「單一網址深度除錯 (Trace)」面板：
① 您可以看到腳本調用 PAC 函式（如 dnsDomainIs、isInNetEx、isPlainHostName）的完整順序。
② 每個函式的傳入參數與 true/false 比對結果一目了然。
③ 您可以精確定位究竟是哪一行判斷式搶先觸發了 return，從而輕鬆修正規則順序。`,
      },
      {
        q: '批量回歸測試 (Batch Verification) 在企業部署前有什麼重要性？',
        a: `企業網路環境通常涵蓋數十個內外部系統（如內部 GitLab、Jira、辦公雲端 Office 365、公有雲 AWS/GCP、生產資料庫等）。

當網路管理員需要「新增一個網域走代理」或「調整內部網段」時，最擔心的就是「改了一條規則，卻意外導致其他 5 個內部系統無法連線」。

使用批量測試功能：
① 預先儲存一組包含內網、外網、開發本機、API 伺服器的 20~50 個常用網址。
② 修改 PAC 腳本後，點擊「執行批量測試」，毫秒級產出所有網址的分流走向報表。
③ 透過狀態分類篩選（DIRECT / PROXY / ERROR）與 CSV 匯出，確保本次修改零副作用。`,
      },
      {
        q: '模擬環境 (Mock Context) 的本機 IP 與 DNS 解析功能如何使用？',
        a: `許多企業 PAC 規則會根據「使用者目前在哪裡」決定分流策略：
例如：若 myIpAddress() 在公司內網 10.x.x.x，則直接連線；若在咖啡廳或家裡（公網 IP），則走 VPN 代理。

在傳統本機測試中，您很難假裝自己在不同的 IP 網段。
透過本工具的「虛擬環境 (Mock Context)」設定：
① 您可以任意指定模擬客戶端 IPv4（如 10.100.1.5 或 203.0.113.88）與 IPv6 位址。
② 您可以自訂 Mock DNS 映射（例如指定 dev.internal 解析為 192.168.99.1）。
如此即可在不更動任何本機網路介面的情況下，完整模擬跨地域、跨網段的 PAC 分流邏輯。`,
      },
      {
        q: '為什麼我的 PAC 在測試器中跑出 SOCKS5，但瀏覽器卻說連線失敗？',
        a: `PAC 檔案的職責僅為「決策路由走向」，它告訴瀏覽器「請把這個網址送給 SOCKS5 127.0.0.1:1080」。

若測試器評估為 SOCKS5 127.0.0.1:1080，但實際瀏覽器無法上網，通常是以下外部原因：
① 代理伺服器本體未啟動：本機的 SOCKS5 客戶端（如 Clash、v2ray、SSH Tunnel）沒有在指定埠號（1080）監聽。
② 防火牆阻擋：作業系統防火牆或防毒軟體阻擋了對 127.0.0.1 或遠端 Proxy 主機的連線。
③ 代理類型不相容：某些舊版軟體不支援 SOCKS5 語法（需寫成 SOCKS）。
建議在回傳字串中使用 Fallback 鏈，例如 "SOCKS5 127.0.0.1:1080; DIRECT"，防範代理中斷時直接斷網。`,
      },
      {
        q: 'PAC 檔案中的效能瓶頸（如 dnsResolve 阻塞）該如何透過此工具評估？',
        a: `在 PAC 腳本中，最嚴重的效能殺手就是頻繁呼叫 dnsResolve() 或 isResolvable()。

瀏覽器在評估 PAC 腳本時通常是同步且單執行緒的。如果腳本中對每個網址都進行 DNS 解析，而 DNS 伺服器有 100ms 延遲，使用者每次點擊網頁就會卡頓 100ms。

優化原則：
① 優先以純字串比對：優先使用 isPlainHostName() 與 dnsDomainIs()，完全零 DNS 開銷。
② 善用 IPv6 CIDR 擴充：使用 isInNetEx() 支援 IPv4/IPv6 前綴比對，避免將 IP 解析邏輯寫死在前端。
③ 觀察執行耗時：本測試器顯示毫秒級 executionTimeMs，若單次評估超過 5ms 即需檢視是否有過多巢狀比對。`,
      },
    ],
  },
  en: {
    title: 'PAC Tester & Simulator',
    subtitle: 'PROXY AUTO-CONFIG DEBUGGER & SIMULATOR',
    description: 'Professional in-browser Proxy Auto-Config (PAC) debugger and sandbox execution simulator. Step-by-step trace logs, batch regression testing, IPv6 (isInNetEx) simulation, and mock DNS environments.',
    scriptPanelTitle: 'PAC Script Source (JavaScript)',
    loadSampleBtn: 'Load Sample Script',
    clearScriptBtn: 'Clear Script',
    clearAllBtn: 'Clear All',
    clearAllConfirmTip: 'Are you sure you want to clear the script, target URLs, and all test results?',
    uploadBtn: 'Upload .pac File',
    dropzoneTip: 'Drag & drop a .pac or .js file here to load',
    tabs: {
      single: 'Single URL Trace',
      batch: 'Batch Regression Test',
      mock: 'Mock Environment & DNS',
    },
    singleTest: {
      urlLabel: 'Test Target URL',
      urlPlaceholder: 'Enter a URL to test, e.g. https://git.corp.internal/api',
      runBtn: 'Run Simulation',
      clearBtn: 'Clear',
      resultTitle: 'Evaluation Result',
      status: 'Routing Decision',
      proxyOutput: 'Return String',
      execTime: 'Execution Time',
      matchedRule: 'Step-by-step Execution Trace',
      noTrace: 'No internal PAC helper functions were invoked (direct return).',
      targetHost: 'Target Host',
      targetPort: 'Target Port',
      targetProtocol: 'Protocol',
    },
    batchTest: {
      urlsLabel: 'URLs to Test (One per line)',
      runBtn: 'Run Batch Verification',
      clearBtn: 'Clear URLs',
      exportCsv: 'Export CSV Report',
      filterAll: 'All Results',
      filterDirect: 'DIRECT Only',
      filterProxy: 'PROXY/SOCKS Only',
      filterError: 'ERROR Only',
      colUrl: 'Test URL',
      colHost: 'Target Host',
      colResult: 'Decision',
      colStatus: 'Status',
      colTime: 'Duration',
      summary: 'Summary Stats',
      totalCount: 'Total',
    },
    mockContext: {
      title: 'Client Network Mock Environment',
      desc: 'Simulate client IP and host DNS mappings to test edge cases without modifying real network adapter settings.',
      clientIpv4: 'Simulated Client IPv4 (myIpAddress)',
      clientIpv6: 'Simulated Client IPv6 (myIpAddressEx)',
      dnsMapTitle: 'Mock DNS Host Mapping (One per line: host ip)',
      dnsMapPlaceholder: 'e.g.:\nintranet.corp 10.0.1.5\napi.internal 192.168.1.50\nipv6.corp 2001:db8::5',
      resetBtn: 'Reset Defaults',
    },
    linter: {
      clean: 'Script syntax is valid with standard FindProxyForURL entry point.',
      issuesFound: 'Syntax or compatibility notices detected:',
    },
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'In-depth guide to PAC debugging, execution tracing, batch verification, and IPv6 sandbox testing',
    faqItems: [
      {
        q: 'Does the tester support IPv6? How can I test isInNetEx and IPv6 subnets?',
        a: `Yes, this simulator fully supports modern IPv6 PAC extensions with a 128-bit BigInt sandbox engine:

① 128-bit CIDR Prefix Matching:
Native support for isInNetEx(host, "fc00::/7"), isInNetEx(host, "2001:db8::/32"), and any standard IPv6 CIDR prefix.

② IPv6 Target URLs & Hostnames:
You can test bracketed IPv6 literals directly (e.g. https://[fc00::1]/service or http://[2001:db8::1]:8080/), which the sandbox automatically evaluates.

③ Dual-Stack Client Simulation (myIpAddressEx):
Configure mock client IPv6 addresses in the "Mock Environment & DNS" tab for scripts invoking myIpAddressEx().

④ Mock DNS IPv6 Mapping:
Map intranet domain names directly to IPv6 addresses (e.g. internal.svc 2001:db8::100) to test domain-to-IPv6 routing pipelines without touching real DNS.`,
      },
      {
        q: 'Why do we need a dedicated PAC Tester & Debugger?',
        a: `When testing a PAC file directly in operating systems or browsers (Chrome, Edge, macOS), execution is a complete black box:

① Silent Failures: If a syntax error or exception occurs, the browser silently falls back to DIRECT connection with zero console warnings.
② Aggressive Caching: Browsers cache PAC evaluations for minutes, making rule verification frustrating.
③ Hidden Rule Matches: With dozens of rules, it is difficult to see which condition intercepted a given domain.

This in-browser simulator exposes execution traces, matched conditions, and millisecond timers directly.`,
      },
      {
        q: 'How does Single URL Trace help identify shadowed rules (Dead Code)?',
        a: `FindProxyForURL executes top-down and short-circuits on the first matching return statement.

If an overly broad rule (such as a wildcard *.internal) is placed above a specific rule, the subsequent rule is shadowed (Dead Code).

The Trace timeline displays:
① The sequential invocation of PAC helpers (dnsDomainIs, isInNetEx, isPlainHostName).
② Evaluated arguments and Boolean outcomes.
③ Exactly which line triggered the return statement.`,
      },
      {
        q: 'Why is Batch Regression Testing critical before enterprise deployment?',
        a: `Enterprise networks rely on dozens of interconnected systems (GitLab, Jira, cloud services, internal VPCs, APIs).

When an IT administrator adds a new proxy rule, the primary concern is unintended side effects breaking access to existing services.

Batch Testing enables:
① Maintaining a regression suite of 20~50 representative URLs.
② Running one-click simulation in milliseconds after script changes.
③ Reviewing pass/fail status filters and exporting CSV audit reports.`,
      },
      {
        q: 'How do Mock Client IP and DNS mapping work in this simulator?',
        a: `Many corporate PAC rules route traffic conditionally based on where the client is located:
e.g. If myIpAddress() is on the 10.x LAN, connect DIRECT; if on a remote public IP, route through a secure proxy.

The Mock Context tab lets you:
① Assign simulated client IPv4 and IPv6 addresses.
② Configure custom static DNS resolutions for intranet hostnames.
This enables testing multi-site routing logic without touching your physical network settings.`,
      },
      {
        q: 'Why does my PAC evaluate to SOCKS5 in the tester, but fails in the browser?',
        a: `A PAC file only instructs the browser where to connect (e.g. "SOCKS5 127.0.0.1:1080").

If browsing fails in practice, common causes include:
① The proxy daemon (Clash, v2ray, SSH tunnel) is not listening on that port.
② Local firewall rules block local socket connections.
③ Client protocol mismatch.
Using failover fallback chains (e.g. "SOCKS5 127.0.0.1:1080; DIRECT") prevents total disconnection during proxy outages.`,
      },
      {
        q: 'How can I identify performance bottlenecks like dnsResolve blocking?',
        a: `In PAC files, excessive calls to dnsResolve() or isResolvable() create severe latency because DNS lookups run synchronously before HTTP requests can proceed.

Best practices:
① Favor zero-cost string checks (isPlainHostName, dnsDomainIs).
② Use isInNetEx for IPv6/IPv4 CIDR prefix checks.
③ Monitor executionTimeMs in the trace; evaluations taking >5ms indicate excessive synchronous operations.`,
      },
    ],
  },
};

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

  // 批量測試狀態
  const [batchUrlsText, setBatchUrlsText] = useState<string>(DEFAULT_BATCH_TEST_URLS.join('\n'));
  const [batchResults, setBatchResults] = useState<PacBatchItemResult[]>([]);
  const [batchFilter, setBatchFilter] = useState<'ALL' | 'DIRECT' | 'PROXY' | 'ERROR'>('ALL');

  // 虛擬環境 Mock Context 狀態
  const [mockClientIpv4, setMockClientIpv4] = useState<string>('192.168.1.100');
  const [mockClientIpv6, setMockClientIpv6] = useState<string>('2001:db8::100');
  const [mockDnsText, setMockDnsText] = useState<string>('git.corp.internal 10.0.0.5\napi.internal 192.168.1.50');

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
      clientIpv4: mockClientIpv4,
      clientIpv6: mockClientIpv6,
      dnsMap,
    };
  }, [mockClientIpv4, mockClientIpv6, mockDnsText]);

  // 靜態語法診斷 (Linter)
  const lintIssues: PacLintIssue[] = useMemo(() => {
    return lintPacScript(pacScript);
  }, [pacScript]);

  // 執行單次測試
  const handleRunSingleTest = () => {
    const res = runSinglePacTest(pacScript, singleUrl, mockContext);
    setSingleResult(res);
  };

  // 清空單次測試
  const handleClearSingle = () => {
    setSingleUrl('');
    setSingleResult(null);
  };

  // 執行批量測試
  const handleRunBatchTest = () => {
    const urls = batchUrlsText.split('\n').filter((u) => u.trim().length > 0);
    const results = runBatchPacTest(pacScript, urls, mockContext);
    setBatchResults(results);
  };

  // 清空批量測試
  const handleClearBatch = () => {
    setBatchUrlsText('');
    setBatchResults([]);
  };

  // 清除全部 (腳本、測試網址、單次與批量結果)
  const handleClearAll = () => {
    if (typeof window !== 'undefined' && pacScript.trim().length > 0) {
      if (!window.confirm(t.clearAllConfirmTip)) return;
    }
    setPacScript('');
    setSingleUrl('');
    setSingleResult(null);
    setBatchUrlsText('');
    setBatchResults([]);
  };

  // 重設 Mock Context 為預設值
  const handleResetMock = () => {
    setMockClientIpv4('192.168.1.100');
    setMockClientIpv6('2001:db8::100');
    setMockDnsText('git.corp.internal 10.0.0.5\napi.internal 192.168.1.50\nipv6.corp 2001:db8::5');
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pac_audit_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                    onClick={() => setPacScript('')}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <span>{t.clearScriptBtn}</span>
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
              <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                {lintIssues.length === 0 ? (
                  <div className={`flex items-center gap-2 text-xs font-medium ${styles.linterClean}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>{t.linter.clean}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-main">{t.linter.issuesFound}</span>
                    {lintIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`text-xs flex items-start gap-1.5 ${
                          issue.severity === 'error'
                            ? 'text-red-400'
                            : issue.severity === 'warning'
                            ? 'text-amber-400'
                            : 'text-text-sub'
                        }`}
                      >
                        <span>•</span>
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
                        className="flex-1 text-sm bg-black/20 border border-white/10 rounded-lg px-3.5 py-2.5 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleRunSingleTest}
                          className={`${styles.actionButton} ${styles.primaryButton}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span>{t.singleTest.runBtn}</span>
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

                  {/* 測試結果看板 */}
                  {singleResult && (
                    <div className="flex flex-col gap-4 mt-2">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
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
                          <code className={`text-sm font-mono font-semibold ${styles.proxyOutputCode} p-2.5 rounded-lg bg-black/30 border border-white/5 break-all`}>
                            {singleResult.returnString}
                          </code>
                        </div>

                        {/* 請求解析細節 */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-text-sub pt-2 border-t border-white/5">
                          <div>
                            <span className="block font-medium">{t.singleTest.targetHost}</span>
                            <span className="font-mono text-text-main">{singleResult.host}</span>
                          </div>
                          <div>
                            <span className="block font-medium">{t.singleTest.targetPort}</span>
                            <span className="font-mono text-text-main">{singleResult.port}</span>
                          </div>
                          <div>
                            <span className="block font-medium">{t.singleTest.targetProtocol}</span>
                            <span className="font-mono text-text-main">{singleResult.protocol.toUpperCase()}</span>
                          </div>
                        </div>

                        {singleResult.error && (
                          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
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
                          <div className="text-xs text-text-sub p-3 italic rounded-lg bg-white/[0.02] border border-white/5">
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
                      className="w-full text-sm font-mono bg-black/20 border border-white/10 rounded-lg p-3 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                    />
                  </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleRunBatchTest}
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>{t.batchTest.runBtn}</span>
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
                          <div key={item.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5 text-xs">
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
                        className="w-full text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
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
                        className="w-full text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
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
                      className="w-full text-sm font-mono bg-black/20 border border-white/10 rounded-lg p-3 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                    />
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
