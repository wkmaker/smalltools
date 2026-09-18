/**
 * PAC 產生器頁面中英文案（從 PacGeneratorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: 'PAC 規則產生器',
    subtitle: 'PROXY AUTO-CONFIG SCRIPT GENERATOR',
    description: '強大且安全的視覺化 PAC 代理配置腳本產生器。自由設定分流規則、IPv4/IPv6 雙棧子網段、多重代理節點與備援鏈，100% 瀏覽器本機生成。',
    presetLabel: '常用情境範本',
    proxyPoolTitle: '代理伺服器池 (Proxy Pool)',
    addProxyBtn: '新增代理節點',
    addChainBtn: '組合備援鏈',
    chainTypeLabel: '備援容錯鏈 (Failover Chain)',
    chainBuilderTitle: '備援順位序列 (依序嘗試故障轉移)',
    chainAddHop: '加入順位',
    chainConcatToggle: '以 JS 字串拼接 (+) 多行排版',
    proxyName: '節點名稱',
    proxyType: '類型',
    proxyHost: '主機 / IP',
    proxyPort: '埠號',
    proxyCustom: '自訂代理字串 (選填)',
    rulesTitle: '分流規則排序 (由上而下命中即離開)',
    addRuleBtn: '新增規則',
    clearProxiesBtn: '清空節點',
    clearRulesBtn: '清空規則',
    clearProxiesConfirm: '確定要清空所有代理節點嗎？',
    clearRulesConfirm: '確定要清空所有分流規則嗎？',
    ruleName: '規則名稱',
    conditionType: '比對條件',
    matchValue: '比對目標值',
    targetAction: '目標動作',
    ruleDescription: '說明',
    moveUp: '上移',
    moveDown: '下移',
    delete: '刪除',
    enable: '啟用',
    disable: '停用',
    defaultActionTitle: '預設兜底行為 (無任何規則命中時)',
    directOption: 'DIRECT (直連不經代理)',
    previewTitle: '生成的 PAC 腳本 (JavaScript)',
    copyScript: '複製代碼',
    downloadPac: '下載 .pac 檔案',
    copyDataUrl: '複製 Data URI',
    testInTester: '前往 PAC 測試器驗證',
    importBtn: '匯入腳本 / 設定',
    exportConfigBtn: '備份設定 (JSON)',
    importModalTitle: '匯入 PAC 腳本或專案設定',
    importModalDesc: '支援貼上標準 PAC JavaScript 腳本（FindProxyForURL 函式）或 Smalltools 專案 JSON 檔。系統將自動逆向解析代理伺服器、分流規則（包含多網域/多 IP 條件）與預設兜底行為。',
    importPlaceholder: '在此貼上 PAC 腳本 (如 function FindProxyForURL...) 或 JSON 設定檔內容...',
    uploadFileBtn: '選取檔案載入 (.pac / .js / .json)',
    parseAndApplyBtn: '開始智能解析匯入',
    importModeReplace: '覆蓋當前設定',
    importModeAppend: '追加至現有規則',
    cancelBtn: '取消',
    multiValueHint: '支援多個值（每行一個，或以逗號/分號分隔）',
    andConditionBadge: 'AND',
    addAndConditionBtn: '+ 加入 AND 條件',
    andConditionHint: '此規則需同時符合以上全部條件才會命中，例如「協定為 https」且「網域為 example.com」',
    importWarningsTitle: '匯入時有部分條件未能完全辨識，已改用粗略的 URL 萬用比對，請人工複查以下規則：',
    dismissBtn: '關閉',
    copiedToast: '已複製到剪貼簿！',
    optionsTitle: '進階輸出設定',
    enableIpv6Label: '啟用 IPv6 擴充支援 (isInNetEx)',
    resolveIpFirstLabel: '比對 IP 前先行解析主機網域名稱 (dnsResolve)',
    conditionTypes: {
      plainHost: '純主機名稱',
      domainSuffix: '網域後綴',
      domainExact: '完整網域名稱',
      wildcardHost: '主機名萬用字元',
      wildcardUrl: '完整 URL 萬用字元',
      ipv4Cidr: '目標 IPv4 位址 / 網段 (CIDR)',
      ipv6Cidr: '目標 IPv6 位址 / 網段 (CIDR)',
      clientIpv4: '用戶端本機 IPv4 網段 (myIpAddress)',
      clientIpv6: '用戶端本機 IPv6 網段 (myIpAddressEx)',
      protocol: '傳輸協定 (HTTP/HTTPS/FTP)',
      port: '通訊埠號 (Port)',
      weekday: '工作日 / 週末 (Weekday)',
      timeRange: '時段範圍 (Time Range)',
      regex: '正則表達式',
    },
    conditionPlaceholders: {
      plainHost: '無需指定值 (純主機名無點號自動命中)',
      domainSuffix: '例如：.google.com 或多行填寫多個網域',
      domainExact: '例如：api.github.com 或多行填寫多個主機',
      wildcardHost: '例如：*.internal.net 或 dev-*.corp',
      wildcardUrl: '例如：https://*.internal/* 或 ftp://*',
      ipv4Cidr: '例如：192.168.1.1 或 10.0.0.0/8 (每行一個)',
      ipv6Cidr: '例如：2001:db8::1 或 fc00::/7 (每行一個)',
      clientIpv4: '例如：10.1.0.0/16 或 192.168.1.0/24 (每行一個)',
      clientIpv6: '例如：2001:db8::/32 或 fc00::/7 (每行一個)',
      protocol: '例如：http、https、ftp、ws 或 wss',
      port: '例如：80、443、8080 或 1080',
      weekday: '例如：MON-FRI (平日) 或 SAT-SUN (週末)',
      timeRange: '例如：9-18 (代表 09:00 至 18:00)',
      regex: '例如：^https?://.*\\.internal(:[0-9]+)?/',
    },
    faqTitle: '常見問題與技術解析',
    faqSubtitle: '深入瞭解 PAC 規格、瀏覽器相容性、IPv6 與備援鏈機制',
    faqItems: [
      {
        q: 'PAC 分流規則支援哪些條件模式？各自適用什麼場景？',
        a: `本工具支援 14 種條件模式，涵蓋主機、網域、URL、IP、用戶端本機分流、傳輸協定、連接埠、時間排程與正則表達式：

① 純主機名稱 (isPlainHostName)：
比對不含任何點號「.」的主機名稱（如 http://intranet/ 或 http://hr/）。常用於將內部局域網服務設為 DIRECT 直連，免去繁瑣的網段列舉。

② 網域後綴 (dnsDomainIs)：
比對特定網域及其所有子網域。支援一行輸入一個或多個網域（以換行或逗號分隔）。例如填入「.google.com」會同時命中 mail.google.com、drive.google.com 與根網域 google.com。

③ 完整網域名稱 (localHostOrDomainIs / host ===)：
精確比對單一或多個主機名。例如填入「api.github.com」僅對該主機生效，不會影響 raw.githubusercontent.com。

④ 主機名萬用字元 (shExpMatch host)：
使用星號「*」與問號「?」比對主機名結構。例如「*.internal.net」或「git-*.company.com」。

⑤ 完整 URL 萬用字元 (shExpMatch url)：
針對完整 URL 進行萬用字元比對（包含協定與路徑）。例如「https://*.secure.bank/*」或「ftp://*」。

⑥ 目標 IPv4 位址 / 網段 (isInNet)：
比對目標伺服器的 IPv4 IP 位址。支援「單一主機 IP」（如 192.168.1.1，自動以 /32 遮罩比對）與「CIDR 網段」（如 10.0.0.0/8、172.16.0.0/12、192.168.1.0/24），亦支援多組網段批次輸入。無論直接存取 IP 或網域解析命中皆能生效。

⑦ 目標 IPv6 位址 / 網段 (isInNetEx)：
利用現代瀏覽器擴充的 isInNetEx() 函式進行 IPv6 比對。支援「單一 IPv6 位址」（如 2001:db8::1，自動補齊 /128 遮罩）與「CIDR 網段」（如企業 ULA 私有網段 fc00::/7 或測試網段 2001:db8::/32）。

⑧ 用戶端本機 IPv4 網段 (myIpAddress)：
依據使用者裝置當前所在的本機 IPv4 位址進行分流（如 10.1.0.0/16 走一號網關，10.2.0.0/16 走二號網關）。常用於企業跨據點辦公室的就近代理調度與負載平衡。

⑨ 用戶端本機 IPv6 網段 (myIpAddressEx)：
依據使用者裝置當前的 IPv6 網路介面位址進行比對分流。

⑩ 傳輸協定 (URL Protocol)：
比對請求協定（如 http:、https:、ftp:、ws:、wss:），依傳輸層協定自動分流。

⑪ 連接埠 (Port)：
比對目標通訊埠（如 80、443、8080、8443），針對特定服務端口指派代理伺服器。

⑫ 工作日與週末 (weekdayRange)：
根據客戶端當前星期週期（如 MON-FRI 工作日或 SAT-SUN 週末）自動切換代理策略。

⑬ 每日時段範圍 (timeRange)：
根據當前小時範圍（如 9-18 代表上午 9 點至下午 6 點）動態切換上班時段專用代理。

⑭ 正則表達式 (RegExp.test)：
提供最高自訂自由度，直接以正則表達式對完整目標網址進行高階樣式比對。`,
      },
      {
        q: '可以指定單一 IPv4 或 IPv6 位址進行分流嗎？與「完整網域名稱」有何不同？',
        a: `可以！而且強烈建議使用「IPv4 / IPv6 位址 / 網段」條件來比對單一 IP：

① 單一 IP 與「完整網域名稱」的關鍵差異：
• 若在「完整網域名稱」填入 192.168.1.1，腳本產出 host === "192.168.1.1"，這只有在網址列明確鍵入 http://192.168.1.1/ 時才會命中。若使用者訪問 api.local 而其 DNS 解析為 192.168.1.1，則完全無法命中。
• 若在「IPv4 位址 / 網段」填入單一 IP（例如 192.168.1.1），本工具會自動轉換為 isInNet(host, "192.168.1.1", "255.255.255.255")。此函式同時支援「直接存取 IP」與「網域解析後的實體 IP」雙重命中！

② IPv6 單一 IP 自動補齊：
若填入 2001:db8::1，本工具會自動補齊 /128 前綴遮罩（生成 isInNetEx(host, "2001:db8::1/128")），完全符合 RFC 與瀏覽器標準規範。

③ 即時語法檢驗：
輸入 IP 時，工具會即時檢查格式（4 段 0~255、IPv6 格式等）。若有錯字或超出範圍，輸入框會即時跳出警告提示，避免產出無效腳本。`,
      },
      {
        q: '比對 IP 前先行解析主機網域名稱 (dnsResolve) 有何差別？何時該開啟？',
        a: `此選項決定在執行 IPv4/IPv6 網段比對（如 isInNet 或 isInNetEx）時，是否強制先將目標主機名稱轉換為 IP 位址：

① 未開啟（預設建議，效能最佳）：
腳本直接生成 isInNet(host, ...)。
當請求的網址本身就是 IP（例如 http://192.168.1.1/ 或 http://[fc00::1]/）時直接比對；若為一般網域（如 google.com），現代瀏覽器底層會自動處理或快速略過，完全不會產生多餘的同步 DNS 阻塞延遲。

② 開啟後（強制解析模式）：
腳本會改為生成 isInNet(dnsResolve(host), ...)。
在進行網段比對前，強制瀏覽器必須先發出一次同步 DNS 請求，將主機名稱解析為實體 IP 後再進行比對。

適用場景：
僅在特定舊型環境（例如舊版 Windows WinINet、部分 Android WebView 或特定代理客戶端中，其 isInNet 遇到網域名稱不會自動解析而直接回傳 false）才需要開啟。在一般現代瀏覽器中保持關閉即可獲得最流暢的連線體驗。`,
      },
      {
        q: '什麼是 PAC (Proxy Auto-Config) 檔案？運作原理是什麼？',
        a: `PAC（Proxy Auto-Config，代理自動配置）是一種由 Netscape 於 1996 年制定的網路技術標準。

PAC 檔案本質上是一段定義了名為 FindProxyForURL(url, host) 的 JavaScript 函式。當作業系統或瀏覽器（如 Chrome, Edge, Safari, Firefox）發出 HTTP、HTTPS 或 FTP 連線請求前，會自動調用該函式：

① 傳入參數：正在請求的完整目標網址 (url) 與目標伺服器主機名稱 (host)。
② 執行邏輯：依據腳本內定義的條件比對（網域、IP 網段、主機名類型或時間）。
③ 回傳結果：返回如 "DIRECT"（直連不經代理）或 "PROXY 10.0.0.1:8080"（指定經由代理轉發）。

這種機制讓企業與個人無需手動切換開關，就能兼顧內網高速存取與外網安全分流。`,
      },
      {
        q: '如何在各作業系統與瀏覽器中載入 PAC 檔案？',
        a: `各平台的設定步驟如下：

① Windows 10 / 11：
開啟「設定」➔「網路和網際網路」➔「Proxy」➔ 在「自動 Proxy 設定」區域開啟「使用安裝程式碼」，在指令碼位址填入 PAC 網址或本工具產生的 Data URL，點擊「儲存」。

② macOS (Sequoia / Sonoma / Ventura)：
前往「系統設定」➔「網路」➔ 選取當前連線之網路介面（如 Wi-Fi）➔ 點擊「詳細資訊...」➔ 切換至「代理伺服器」標籤 ➔ 開啟「自動代理伺服器設定 (PAC)」➔ 貼上 URL。

③ iOS / iPadOS：
進入「設定」➔「Wi-Fi」➔ 點擊目前已連線 Wi-Fi 最右側的「(i)」圖示 ➔ 滑至底部點擊「設定代理伺服器」➔ 勾選「自動」➔ 在 URL 欄位填入網址。

④ Firefox 瀏覽器：
進入「設定」➔「一般」➔ 滑動至「網路設定」點擊「設定...」➔ 選擇「自動代理設定網址 (PAC)」➔ 貼入 URL 並確定。

⑤ 瀏覽器外掛 (如 SwitchyOmega)：
在情境模式中新增「PAC 情境」，直接將腳本貼入程式碼區塊或填入 PAC 網址即可即時生效。`,
      },
      {
        q: 'PAC 中的 IPv6 擴充函式 (isInNetEx) 與傳統 isInNet 有何重大差異？',
        a: `傳統 PAC 規範僅支援 32 位元的 IPv4 函式（如 isInNet、dnsResolve、myIpAddress）。如果將 IPv6 位址傳入傳統 isInNet()，在許多系統與瀏覽器中會直接拋出異常或誤判為 false。

為了解決 IPv6 雙棧（Dual-Stack）環境的路由問題，微軟與各大瀏覽器推出了 IPv6 PAC 擴展標準：

① isInNetEx(host, "2001:db8::/32")：直接原生支援標準 IPv6 CIDR 語法（例如 fc00::/7 私有網段或 fe80::/10 區域鏈路網段），亦向下相容 IPv4。
② dnsResolveEx(host)：解析目標主機並返回分號分隔的所有 IPv4 與 IPv6 IP 清單。
③ myIpAddressEx()：返回本機的所有 IPv4 與 IPv6 網路介面位址清單。

本產生器預設支援 isInNetEx 語法，兼顧現代企業與家用 IPv6 網路分流需求。`,
      },
      {
        q: '代理字串中的 DIRECT、PROXY 與 SOCKS5 備援鏈（Fallback）如何運作？',
        a: `PAC 允許單次比對回傳多個代理伺服器選項，以分號「;」區隔，瀏覽器會依序嘗試連線：

例如回傳："PROXY 10.0.0.1:8080; PROXY 10.0.0.2:8080; DIRECT"

① 優先連線：瀏覽器優先嘗試連線至 10.0.0.1:8080。
② 自動故障轉移 (Failover)：若第一台代理伺服器無回應、連線逾時或拒絕連線，瀏覽器會在數秒內無縫降階改連 10.0.0.2:8080。
③ 最終保底 (Fallback)：若兩台代理伺服器皆故障，瀏覽器最後會以 DIRECT 直連嘗試存取目標網站。

這種容錯鏈機制能大幅減少單一代理節點當機對整間公司或個人工作造成的斷網衝擊。`,
      },
      {
        q: '為什麼寫了 PAC 規則後，有些網域依然無法如預期走代理？',
        a: `常見的原因包括以下幾點：

① 規則比對順序不對：PAC 腳本是「由上至下依序執行」且「命中即回傳 (Short-circuit)」。若最上方放置了涵蓋範圍過大的萬用規則，後面的特殊規則將永遠無法被執行。
② 網域比對語法細微差異：dnsDomainIs(host, ".google.com") 只能比對子網域（如 mail.google.com），若直接訪問根網域 google.com 則不會命中。本工具產生的規則已自動補齊根網域相符判斷。
③ DNS 阻斷或逾時：若在 PAC 中濫用 dnsResolve()，瀏覽器在發送請求前必須等待本機 DNS 回應。若 DNS 伺服器延遲高或解析失敗，會導致整個網路瀏覽停頓甚至放棄代理。
④ 本機瀏覽器快取：許多瀏覽器會快取 PAC 腳本達數小時，修改 PAC 後建議重啟瀏覽器或在 chrome://net-internals/#proxy 點擊「Clear bad proxies / Re-apply settings」。`,
      },
      {
        q: '這個視覺化編輯器適用哪些情境？遇到複雜邏輯是不是該自己寫腳本？',
        a: `本工具的資料模型是「規則清單，由上而下逐條比對、命中即回傳」，對應到產生的 PAC 腳本就是一串 if (條件) { return 代理; }。這與寫成 if / else if 鏈語意完全相同——因為一旦 return 就會離開函式，不會有 else 分支才有的差異，所以你完全不需要自己組 else。

適用範圍：多筆彼此獨立的比對規則，例如「A 網域配這個代理、B 網域配那個代理、其餘直連」，不論有幾十條都可以線性列出；也支援在單一規則內疊加「AND 條件」（如同時符合「協定為 https」且「網域為 x」）表達較精細的比對。

不適用範圍：需要在單一命中結果「內部」再做分支判斷、跑迴圈、動態組字串等程式邏輯的情境（例如依實際解析出的 IP 才決定要不要多繞一層代理）。這已經超出「規則清單」能表達的範圍——建議直接手寫 JavaScript，或在規則卡片的「自訂代理字串」欄位塞一段原始邏輯，再用 PAC 測試器貼上完整腳本驗證實際執行結果。`,
      },
      {
        q: '如何使用 Data URI 格式代替 HTTP 伺服器掛載 PAC 檔案？',
        a: `傳統上 PAC 檔案必須架設在一台具備正確認證與 MIME Type（application/x-ns-proxy-autoconfig）的 Web 伺服器上。

但現代作業系統（包括 macOS 與部分 Windows 組建）以及瀏覽器擴充功能均支援 RFC 2397 Data URI 語法：
data:application/x-ns-proxy-autoconfig;base64,....

點擊本工具的「複製 Data URI」按鈕，即可將整份 PAC 腳本以 Base64 編碼內嵌為單一字串。您可以直接將此字串貼入系統的 PAC 網址輸入框中，完全無需自己架設網頁伺服器或購買雲端主機！`,
      },
    ],
  },
  en: {
    title: 'PAC Script Generator',
    subtitle: 'PROXY AUTO-CONFIG SCRIPT GENERATOR',
    description: 'Powerful and secure client-side Proxy Auto-Config (PAC) generator. Visually construct routing pipelines, IPv4/IPv6 dual-stack subnets, and failover chains with 100% private local execution.',
    presetLabel: 'Quick Presets',
    proxyPoolTitle: 'Proxy Pool',
    addProxyBtn: 'Add Proxy Node',
    addChainBtn: 'Add Failover Chain',
    chainTypeLabel: 'Failover Proxy Chain',
    chainBuilderTitle: 'Failover Sequence (Left-to-Right Failover)',
    chainAddHop: 'Append Hop',
    chainConcatToggle: 'Format with JavaScript String Concatenation (+)',
    proxyName: 'Node Name',
    proxyType: 'Type',
    proxyHost: 'Host / IP',
    proxyPort: 'Port',
    proxyCustom: 'Custom String (Optional)',
    rulesTitle: 'Routing Rules Pipeline',
    addRuleBtn: 'Add Rule',
    clearProxiesBtn: 'Clear Nodes',
    clearRulesBtn: 'Clear Rules',
    clearProxiesConfirm: 'Are you sure you want to clear all proxy nodes?',
    clearRulesConfirm: 'Are you sure you want to clear all routing rules?',
    ruleName: 'Rule Name',
    conditionType: 'Match Condition',
    matchValue: 'Target Value',
    targetAction: 'Target Action',
    ruleDescription: 'Description',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    delete: 'Delete',
    enable: 'Enable',
    disable: 'Disable',
    defaultActionTitle: 'Default Fallback Action (When No Rule Matches)',
    directOption: 'DIRECT (Connect directly without proxy)',
    previewTitle: 'Generated PAC Script (JavaScript)',
    copyScript: 'Copy Script',
    downloadPac: 'Download .pac File',
    copyDataUrl: 'Copy Data URI',
    testInTester: 'Test in PAC Simulator',
    importBtn: 'Import Script / Config',
    exportConfigBtn: 'Backup Config (.json)',
    importModalTitle: 'Import PAC Script or Configuration',
    importModalDesc: 'Paste standard PAC JavaScript code (FindProxyForURL function) or a Smalltools JSON configuration. Proxies, routing rules (including multi-domain/multi-IP lists), and default actions will be automatically extracted.',
    importPlaceholder: 'Paste PAC script (e.g. function FindProxyForURL...) or JSON here...',
    uploadFileBtn: 'Upload file (.pac / .js / .json)',
    parseAndApplyBtn: 'Parse & Apply',
    importModeReplace: 'Replace Current Config',
    importModeAppend: 'Append to Existing Rules',
    cancelBtn: 'Cancel',
    multiValueHint: 'Supports multiple values (one per line, or comma/semicolon separated)',
    andConditionBadge: 'AND',
    addAndConditionBtn: '+ Add AND Condition',
    andConditionHint: 'This rule matches only when ALL conditions above are met, e.g. protocol is https AND domain is example.com',
    importWarningsTitle: 'Some conditions could not be fully recognized during import and were converted to a rough URL wildcard match. Please review these rules manually:',
    dismissBtn: 'Dismiss',
    copiedToast: 'Copied to clipboard!',
    optionsTitle: 'Advanced Output Options',
    enableIpv6Label: 'Enable IPv6 Extended Support (isInNetEx)',
    resolveIpFirstLabel: 'Resolve Host IP Before Subnet Check (dnsResolve)',
    conditionTypes: {
      plainHost: 'Plain Hostname',
      domainSuffix: 'Domain Suffix',
      domainExact: 'Exact Hostname',
      wildcardHost: 'Hostname Wildcard',
      wildcardUrl: 'URL Wildcard',
      ipv4Cidr: 'Target IPv4 Address / Subnet (CIDR)',
      ipv6Cidr: 'Target IPv6 Address / Subnet (CIDR)',
      clientIpv4: 'Client Local IPv4 Subnet (myIpAddress)',
      clientIpv6: 'Client Local IPv6 Subnet (myIpAddressEx)',
      protocol: 'Protocol (HTTP/HTTPS/FTP)',
      port: 'Target Port',
      weekday: 'Weekday Range (Workdays/Weekends)',
      timeRange: 'Time Range (Hours)',
      regex: 'Regular Expression',
    },
    conditionPlaceholders: {
      plainHost: 'No value needed (matches hostnames without dots)',
      domainSuffix: 'e.g. .google.com or multiple domains per line',
      domainExact: 'e.g. api.github.com or multiple hosts per line',
      wildcardHost: 'e.g. *.internal.net or dev-*.corp',
      wildcardUrl: 'e.g. https://*.internal/* or ftp://*',
      ipv4Cidr: 'e.g. 192.168.1.1 or 10.0.0.0/8 (one per line)',
      ipv6Cidr: 'e.g. 2001:db8::1 or fc00::/7 (one per line)',
      clientIpv4: 'e.g. 10.1.0.0/16 or 192.168.1.0/24 (one per line)',
      clientIpv6: 'e.g. 2001:db8::/32 or fc00::/7 (one per line)',
      protocol: 'e.g. http, https, ftp, ws, or wss',
      port: 'e.g. 80, 443, 8080, or 1080',
      weekday: 'e.g. MON-FRI (workdays) or SAT-SUN (weekends)',
      timeRange: 'e.g. 9-18 (meaning 09:00 to 18:00)',
      regex: 'e.g. ^https?://.*\\.internal(:[0-9]+)?/',
    },
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'In-depth guide to PAC specifications, IPv6 extensions, failover chains, and browser behavior',
    faqItems: [
      {
        q: 'What condition match modes are supported in routing rules, and when should I use them?',
        a: `The generator supports 14 matching conditions covering hostnames, domains, full URLs, IP subnets, client local network steering, protocols, ports, time schedules, and regular expressions:

① Plain Hostname (isPlainHostName):
Matches hostnames without any dot "." (such as http://intranet/ or http://hr/). Ideal for directing internal local intranet traffic to DIRECT bypass.

② Domain Suffix (dnsDomainIs):
Matches a specific domain and all its subdomains. Supports multiple domains (one per line or comma separated). For example, entering ".google.com" matches mail.google.com, drive.google.com, and the apex domain google.com.

③ Exact Hostname (localHostOrDomainIs / host ===):
Matches single or multiple exact hostnames. For example, "api.github.com" will only match that exact host and will not affect raw.githubusercontent.com.

④ Hostname Wildcard (shExpMatch host):
Matches hostname patterns using "*" and "?". For example, "*.internal.net" or "git-*.company.com".

⑤ URL Wildcard (shExpMatch url):
Matches the complete request URL including scheme, port, and path. For example, "https://*.secure.bank/*" or "ftp://*".

⑥ Target IPv4 Address / Subnet (isInNet):
Matches destination IPv4 addresses. Supports both single host IPs (e.g. "192.168.1.1", matched with a /32 subnet mask) and CIDR subnets (e.g. "10.0.0.0/8", "172.16.0.0/12", "192.168.1.0/24"). Matches both direct IP access and DNS-resolved addresses. Supports multi-line input.

⑦ Target IPv6 Address / Subnet (isInNetEx):
Uses the modern isInNetEx() function for native IPv6 matching. Supports single IPv6 addresses (e.g. "2001:db8::1", auto-padded with /128) and CIDR subnets (e.g. enterprise ULA subnets "fc00::/7" or "2001:db8::/32").

⑧ Client Local IPv4 Subnet (myIpAddress):
Matches the client machine's own local IPv4 address (e.g. "10.1.0.0/16"). Essential for multi-branch corporate networks to steer employees in branch A to Proxy Cluster 1 and branch B to Cluster 2.

⑨ Client Local IPv6 Subnet (myIpAddressEx):
Matches the client device's local IPv6 network interface address for dual-stack branch steering.

⑩ URL Protocol:
Matches transfer protocols such as http:, https:, ftp:, ws:, and wss: for scheme-level proxy steering.

⑪ Destination Port:
Matches target network ports (e.g. 80, 443, 8080, 8443) for service-specific forwarding.

⑫ Weekday Range (weekdayRange):
Dynamically switches proxy policies based on day of the week (e.g. MON-FRI for workdays or SAT-SUN for weekends).

⑬ Daily Time Range (timeRange):
Applies routing rules during specific hours of the day (e.g. 9-18 for standard business hours).

⑭ Regular Expression (RegExp.test):
Provides maximum flexibility to test the entire URL against custom regular expressions.`,
      },
      {
        q: 'Can I route traffic by a single IPv4 or IPv6 address? How does it differ from Exact Hostname?',
        a: `Yes! In fact, using the "IPv4 / IPv6 Address / Subnet" condition is strongly recommended for routing specific IP addresses:

① Key Difference: Single IP vs. Exact Hostname:
• If you enter 192.168.1.1 under "Exact Hostname", the script generates host === "192.168.1.1". This matches ONLY if the user explicitly types http://192.168.1.1/ in their browser. If they browse to api.local whose DNS resolves to 192.168.1.1, the rule will NOT trigger.
• In contrast, entering 192.168.1.1 under "IPv4 Address / Subnet" generates isInNet(host, "192.168.1.1", "255.255.255.255"). This function matches BOTH literal IP visits and hostnames resolving to that physical IP address!

② Automatic IPv6 /128 Prefix Completion:
If you input 2001:db8::1 without a prefix, this generator automatically appends /128 (generating isInNetEx(host, "2001:db8::1/128")), ensuring full compliance with RFC and browser engine standards.

③ Real-time Format Validation:
As you type IP addresses, the editor validates syntax on the fly (octets between 0-255, hexadecimal groups, prefix ranges). An amber warning will display immediately if syntax errors are detected, preventing invalid PAC scripts.`,
      },
      {
        q: 'What is the difference with "Resolve Host IP Before Subnet Check (dnsResolve)", and when should I enable it?',
        a: `This setting controls whether the PAC script forces a synchronous DNS lookup before evaluating IP subnet rules (isInNet / isInNetEx):

① Disabled (Default & Recommended for Performance):
The script outputs isInNet(host, ...).
When target URLs are IP literals (e.g., http://192.168.1.1/ or http://[fc00::1]/), subnets are matched immediately. When given standard domain names (e.g., google.com), modern browser engines handle lookups internally without triggering blocking synchronous DNS stalls.

② Enabled (Forced DNS Resolution):
The script outputs isInNet(dnsResolve(host), ...).
The browser is forced to pause and synchronously resolve every hostname to an IP address before evaluating subnet rules.

When to use:
Enable this ONLY if you are deploying to legacy runtimes (such as older WinINet components or embedded WebViews) where isInNet fails to evaluate domain names automatically. In modern environments, keep it disabled for maximum browsing speed.`,
      },
      {
        q: 'What is a PAC (Proxy Auto-Config) file and how does it work?',
        a: `A PAC (Proxy Auto-Config) file is a standard introduced by Netscape in 1996.

At its core, a PAC file contains a JavaScript function named FindProxyForURL(url, host). Whenever the operating system or browser (Chrome, Edge, Safari, Firefox) initiates a network request, it invokes this function:

① Parameters: The target request URL (url) and destination hostname (host).
② Evaluation: Rules inside the script check domains, IP subnets, or host types.
③ Return Value: A routing instruction such as "DIRECT" (bypass proxy) or "PROXY 10.0.0.1:8080" (route through proxy).

This enables seamless switching between intranet direct connections and external secure proxy channels automatically.`,
      },
      {
        q: 'How do I load a PAC file in various operating systems and browsers?',
        a: `Setup steps across common platforms:

① Windows 10 / 11:
Open Settings ➔ Network & internet ➔ Proxy ➔ In "Automatic proxy setup", toggle "Use setup script" to ON, enter your PAC URL or Data URI, and click Save.

② macOS (Sequoia / Sonoma / Ventura):
Open System Settings ➔ Network ➔ Select your active connection ➔ Details... ➔ Proxies tab ➔ Toggle "Automatic Proxy Configuration" ON ➔ Enter the PAC URL.

③ iOS / iPadOS:
Go to Settings ➔ Wi-Fi ➔ Tap the "i" info icon next to your network ➔ Scroll down to "Configure Proxy" ➔ Choose "Automatic" ➔ Paste the URL.

④ Mozilla Firefox:
Open Settings ➔ General ➔ Network Settings ➔ Click "Settings..." ➔ Select "Automatic proxy configuration URL" ➔ Enter URL and confirm.

⑤ Browser Extensions (e.g. SwitchyOmega):
Create a new "PAC Profile", paste the generated script into the code box or point to the PAC URL for immediate switching.`,
      },
      {
        q: 'What is the difference between IPv6 isInNetEx and legacy isInNet in PAC?',
        a: `The legacy PAC specification only supported 32-bit IPv4 functions (isInNet, dnsResolve, myIpAddress). Passing IPv6 addresses into traditional isInNet() will fail or throw errors in many modern browsers.

To support IPv6 dual-stack environments, Microsoft and major browser engines introduced the IPv6 PAC extensions:

① isInNetEx(host, "2001:db8::/32"): Natively supports IPv6 CIDR prefix notation as well as IPv4 subnets.
② dnsResolveEx(host): Resolves hostnames and returns a semicolon-delimited list of all IPv4 and IPv6 addresses.
③ myIpAddressEx(): Returns all IPv4 and IPv6 network interface addresses of the client.

This generator natively supports isInNetEx syntax to accommodate modern dual-stack environments.`,
      },
      {
        q: 'How do DIRECT, PROXY, and SOCKS failover fallback chains work?',
        a: `PAC allows returning multiple proxy options separated by semicolons for automatic failover:

Example: "PROXY 10.0.0.1:8080; PROXY 10.0.0.2:8080; DIRECT"

① Primary Attempt: The browser first tries to route traffic through 10.0.0.1:8080.
② Automatic Failover: If the primary proxy is unresponsive or times out, the browser transparently tries 10.0.0.2:8080.
③ Final Safeguard: If all proxies are unavailable, the browser falls back to DIRECT connection.

This ensures high availability without breaking Internet access during proxy maintenance.`,
      },
      {
        q: 'Why are certain domains still bypassing or hitting the wrong proxy?',
        a: `Common pitfalls include:

① Evaluation Order: PAC rules execute sequentially from top to bottom and exit on the first match (short-circuit). If a broad wildcard rule is placed first, subsequent specific rules will never be evaluated.
② Subdomain Matching Nuances: dnsDomainIs(host, ".google.com") only matches subdomains (like mail.google.com), not the apex domain google.com. This tool automatically accounts for apex domains in suffix rules.
③ Excessive DNS Lookups: Overusing dnsResolve() forces synchronous DNS lookups for every request. If your DNS is slow, browsing performance degrades noticeably.
④ Browser Cache: Browsers cache PAC results. After modifying rules, restart your browser or visit chrome://net-internals/#proxy to clear proxy caches.`,
      },
      {
        q: 'What scenarios does this visual editor fit? Should I hand-write the script for complex logic instead?',
        a: `This tool's data model is "a list of rules, evaluated top to bottom, return on first match" — which maps to a chain of if (condition) { return proxy; } statements in the generated PAC script. That's semantically identical to an if / else if chain, since a return always exits the function immediately, so there's no observable difference from having an else branch — you never need to write else yourself.

Good fit: any number of independent matching rules, e.g. "domain A goes through this proxy, domain B through that one, everything else DIRECT" — a rule list scales fine to dozens of entries. You can also stack "AND conditions" within a single rule (e.g. protocol is https AND domain is x) for more precise matching.

Not a good fit: scenarios that need branching, loops, or dynamic string logic *inside* a single match's outcome (for example, deciding whether to add another proxy hop based on the IP a lookup just resolved). That's beyond what a flat rule list can express — hand-write the JavaScript instead, or drop raw logic into a rule's "Custom String" field, then paste the full script into the PAC tester to verify actual behavior.`,
      },
      {
        q: 'How can I use Data URI format without hosting a web server?',
        a: `Traditionally, a PAC file had to be hosted on an HTTP server with the MIME type application/x-ns-proxy-autoconfig.

Modern operating systems (macOS and certain Windows builds) as well as browser extensions support RFC 2397 Data URIs:
data:application/x-ns-proxy-autoconfig;base64,....

Click the "Copy Data URI" button to encode the entire PAC script into a single string. You can paste this directly into the system proxy URL box without maintaining an external server.`,
      },
    ],
  },
};

export type PacGeneratorTranslation = typeof TRANSLATIONS['zh-TW'];
