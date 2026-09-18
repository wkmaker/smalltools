/**
 * PAC 測試器頁面中英文案（從 PacTesterClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: 'PAC 測試與除錯器',
    subtitle: 'PROXY AUTO-CONFIG DEBUGGER & SIMULATOR',
    description: '專業安全純前端 PAC 模擬執行與除錯環境。支援單一網址深度 Trace、批量網址回歸測試、IPv6 (isInNetEx) 模擬與 DNS 虛擬沙盒，100% 瀏覽器本機運算。',
    scriptPanelTitle: 'PAC 腳本來源 (JavaScript)',
    loadSampleBtn: '載入示範腳本',
    sendToGeneratorBtn: '送往 PAC 產生器匯入',
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
      runningBtn: '執行中…',
      clearBtn: '清空',
      resultTitle: '測試結果評估',
      status: '最終分流決策',
      proxyOutput: '回傳字串',
      execTime: '執行耗時',
      matchedRule: '執行歷程與條件追蹤 (Execution Trace)',
      noTrace: '此請求未呼叫任何 PAC 內建比對函式或直接由頂層回傳。',
      targetHost: '目標主機名',
      targetHostType: '主機型態',
      resolvedIp: 'DNS 解析 IP',
      clientIp: '客戶端本機 IP (myIpAddress)',
      protocolAndPort: '協議與連接埠',
      targetPort: '目標連接埠',
      targetProtocol: '協議類型',
      timeoutError: '腳本執行逾時（可能包含無窮迴圈或效能極差的比對邏輯），已強制中止以避免頁面凍結，請檢查腳本邏輯。',
    },
    batchTest: {
      urlsLabel: '待測網址清單 (每行一個)',
      runBtn: '執行批量測試',
      runningBtn: '執行中…',
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
      timeoutError: '批量測試逾時（腳本可能含無窮迴圈），已強制中止以避免頁面凍結，請檢查腳本邏輯。',
    },
    mockContext: {
      title: '自訂虛擬客戶端網路環境 (Mock Context)',
      desc: '模擬客戶端本機 IP 與特定主機的 DNS 解析結果，無需更動您目前的真實網路連線即可測試邊界情境。',
      clientIpv4: '模擬客戶端 IPv4 (myIpAddress)',
      clientIpv6: '模擬客戶端 IPv6 (myIpAddressEx)',
      timeSimulationTitle: '時間與排程模擬 (weekdayRange / timeRange)',
      simulatedDay: '模擬星期 (Day of Week)',
      simulatedHour: '模擬小時 (Hour: 0 ~ 23)',
      autoOption: '自動 (跟隨當前系統時間)',
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
    sendToGeneratorBtn: 'Send to PAC Generator',
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
      runningBtn: 'Running…',
      clearBtn: 'Clear',
      resultTitle: 'Evaluation Result',
      status: 'Routing Decision',
      proxyOutput: 'Return String',
      execTime: 'Execution Time',
      matchedRule: 'Step-by-step Execution Trace',
      noTrace: 'No internal PAC helper functions were invoked (direct return).',
      targetHost: 'Target Host',
      targetHostType: 'Host Type',
      resolvedIp: 'DNS Resolved IP',
      clientIp: 'Client Local IP (myIpAddress)',
      protocolAndPort: 'Protocol & Port',
      targetPort: 'Target Port',
      targetProtocol: 'Protocol',
      timeoutError: 'Script execution timed out (it may contain an infinite loop or extremely slow matching logic) and was force-stopped to prevent the page from freezing. Please review the script logic.',
    },
    batchTest: {
      urlsLabel: 'URLs to Test (One per line)',
      runBtn: 'Run Batch Verification',
      runningBtn: 'Running…',
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
      timeoutError: 'Batch test timed out (the script may contain an infinite loop) and was force-stopped to prevent the page from freezing. Please review the script logic.',
    },
    mockContext: {
      title: 'Client Network Mock Environment',
      desc: 'Simulate client IP and host DNS mappings to test edge cases without modifying real network adapter settings.',
      clientIpv4: 'Simulated Client IPv4 (myIpAddress)',
      clientIpv6: 'Simulated Client IPv6 (myIpAddressEx)',
      timeSimulationTitle: 'Time & Day Simulation (weekdayRange / timeRange)',
      simulatedDay: 'Simulated Day of Week',
      simulatedHour: 'Simulated Hour (0 ~ 23)',
      autoOption: 'Auto (Follow System Time)',
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
