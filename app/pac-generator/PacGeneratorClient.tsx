'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import styles from './pac-generator.module.css';
import {
  ConditionType,
  ProxyNode,
  ProxyType,
  RoutingRule,
} from './types';
import {
  formatProxyString,
  generatePacDataUrl,
  generatePacScript,
  parsePacScript,
  PRESET_TEMPLATES,
  validateRuleValue,
} from './engine';

interface PacGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
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
        q: 'How can I use Data URI format without hosting a web server?',
        a: `Traditionally, a PAC file had to be hosted on an HTTP server with the MIME type application/x-ns-proxy-autoconfig.

Modern operating systems (macOS and certain Windows builds) as well as browser extensions support RFC 2397 Data URIs:
data:application/x-ns-proxy-autoconfig;base64,....

Click the "Copy Data URI" button to encode the entire PAC script into a single string. You can paste this directly into the system proxy URL box without maintaining an external server.`,
      },
    ],
  },
};

export default function PacGeneratorClient({ lang = 'zh-TW' }: PacGeneratorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const isEn = lang === 'en';

  // 主題色動態注入
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.5)');
  }, []);

  // 狀態管理
  const [selectedPreset, setSelectedPreset] = useState<string>('corporate-bypass');
  const [proxies, setProxies] = useState<ProxyNode[]>(PRESET_TEMPLATES[0].proxies);
  const [rules, setRules] = useState<RoutingRule[]>(PRESET_TEMPLATES[0].rules);
  const [defaultAction, setDefaultAction] = useState<string>(PRESET_TEMPLATES[0].defaultAction);
  const [enableIpv6, setEnableIpv6] = useState<boolean>(true);
  const [resolveIpFirst, setResolveIpFirst] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 匯入彈窗與狀態
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importContent, setImportContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [importError, setImportError] = useState<string | null>(null);

  // 規則拖曳重排狀態與虛擬插入指示框位置
  const [draggedRuleIndex, setDraggedRuleIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleReorderRule = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setRules((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleDropAtIndex = (targetIndex: number) => {
    if (draggedRuleIndex === null) return;
    let finalIndex = targetIndex;
    if (draggedRuleIndex < targetIndex) {
      finalIndex = targetIndex - 1;
    }
    if (finalIndex !== draggedRuleIndex) {
      handleReorderRule(draggedRuleIndex, finalIndex);
    }
    setDraggedRuleIndex(null);
    setDropTargetIndex(null);
  };

  // 套用範本
  const handleApplyPreset = (presetId: string) => {
    const found = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPreset(presetId);
    setProxies(JSON.parse(JSON.stringify(found.proxies)));
    setRules(JSON.parse(JSON.stringify(found.rules)));
    setDefaultAction(found.defaultAction);
    setEnableIpv6(found.enableIpv6);
    setResolveIpFirst(found.resolveIpFirst);
  };

  // 產生 PAC 腳本
  const generatedScript = useMemo(() => {
    return generatePacScript({
      proxies,
      rules,
      defaultAction,
      enableIpv6,
      resolveIpFirst,
      title: isEn ? 'Custom Proxy Auto-Config' : '自訂代理自動配置腳本',
    });
  }, [proxies, rules, defaultAction, enableIpv6, resolveIpFirst, isEn]);

  // 複製回饋 Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    showToast(t.copiedToast);
  };

  const handleCopyDataUrl = () => {
    const dataUrl = generatePacDataUrl(generatedScript);
    navigator.clipboard.writeText(dataUrl);
    showToast(t.copiedToast);
  };

  const handleDownloadPac = () => {
    const blob = new Blob([generatedScript], { type: 'application/x-ns-proxy-autoconfig;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proxy.pac';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 匯出 JSON 備份設定檔
  const handleExportConfig = () => {
    const projectConfig = {
      version: 1,
      proxies,
      rules,
      defaultAction,
      enableIpv6,
      resolveIpFirst,
    };
    const jsonStr = JSON.stringify(projectConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pac-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(isEn ? 'Config exported!' : '設定已成功匯出！');
  };

  // 執行智能匯入
  const handleDoImport = () => {
    setImportError(null);
    const res = parsePacScript(importContent);
    if (!res.success) {
      setImportError(isEn ? res.messageEn : res.messageZh);
      return;
    }

    if (importMode === 'replace') {
      setProxies(res.proxies);
      setRules(res.rules);
      setDefaultAction(res.defaultAction);
      setEnableIpv6(res.enableIpv6);
      setResolveIpFirst(res.resolveIpFirst);
    } else {
      // 追加模式：合併節點並追加規則
      setProxies((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.type}_${p.host}_${p.port}_${p.customString || ''}`));
        const newNodes = res.proxies.filter(
          (p) => !existingKeys.has(`${p.type}_${p.host}_${p.port}_${p.customString || ''}`)
        );
        return [...prev, ...newNodes];
      });
      setRules((prev) => [...prev, ...res.rules]);
    }

    setIsImportModalOpen(false);
    setImportContent('');
    showToast(isEn ? res.messageEn : res.messageZh);
  };

  // 讀取上傳檔案
  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportContent(text);
      }
    };
    reader.readAsText(file);
  };

  // 跨工具連動：傳送到 PAC 測試器
  const handleGoToTester = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pac_transfer_code', generatedScript);
      const targetUrl = isEn ? '/pac-tester/en/' : '/pac-tester/';
      window.location.href = targetUrl;
    }
  };

  // Proxy 節點增刪改
  const handleAddProxy = () => {
    const newId = `p_${Date.now()}`;
    setProxies((prev) => [
      ...prev,
      { id: newId, name: isEn ? 'New Proxy' : '新代理節點', type: 'PROXY', host: '127.0.0.1', port: 8080 },
    ]);
  };

  const handleAddChain = () => {
    const newId = `p_${Date.now()}`;
    const nonChainProxies = proxies.filter((p) => p.type !== 'CHAIN');
    const initialHops = nonChainProxies.length > 0 ? [nonChainProxies[0].id, 'DIRECT'] : ['DIRECT'];
    setProxies((prev) => [
      ...prev,
      {
        id: newId,
        name: isEn ? `Failover Chain ${prev.length + 1}` : `備援代理鏈 ${prev.length + 1}`,
        type: 'CHAIN',
        host: 'cluster',
        port: 8080,
        chainHops: initialHops,
        isConcatFormat: true,
      },
    ]);
  };

  const handleUpdateProxy = (id: string, updates: Partial<ProxyNode>) => {
    setProxies((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDeleteProxy = (id: string) => {
    setProxies((prev) => prev.filter((p) => p.id !== id));
    if (defaultAction === id) {
      setDefaultAction('DIRECT');
    }
  };

  // 規則增刪改與排序
  const handleAddRule = () => {
    const newId = `r_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id: newId,
        name: isEn ? 'New Rule' : '新分流規則',
        enabled: true,
        conditionType: 'domainSuffix',
        value: '.example.com',
        targetProxy: 'DIRECT',
      },
    ]);
  };

  const handleUpdateRule = (id: string, updates: Partial<RoutingRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rules.length - 1) return;
    const newRules = [...rules];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newRules[index];
    newRules[index] = newRules[targetIdx];
    newRules[targetIdx] = temp;
    setRules(newRules);
  };

  const presetId = useId();

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className={styles.container}>
        {/* 頂部操作列：常用範本選擇與匯入 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3" role="region" aria-label={t.presetLabel}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-sub mr-2">{t.presetLabel}：</span>
            {PRESET_TEMPLATES.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`${styles.presetChip} ${isActive ? styles.presetChipActive : ''}`}
                >
                  <span>{isEn ? preset.nameEn : preset.nameZh}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className={`${styles.actionButton} ${styles.primaryButton}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <span>{t.importBtn}</span>
          </button>
        </div>

        {/* 左右雙欄 Grid */}
        <div className={styles.layoutGrid}>
          {/* 左欄：代理池與規則排程 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 代理節點池 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />
                  </svg>
                  <span>{t.proxyPoolTitle}</span>
                </div>

                <div className="flex items-center gap-2">
                  {proxies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm(t.clearProxiesConfirm)) {
                          setProxies([]);
                        }
                      }}
                      className={styles.ghostButton}
                      title={t.clearProxiesBtn}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                      <span>{t.clearProxiesBtn}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddProxy}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{t.addProxyBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddChain}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                    </svg>
                    <span>{t.addChainBtn}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {proxies.map((proxy) => (
                  <div
                    key={proxy.id}
                    className={`${styles.ruleCard} ${proxy.type === 'CHAIN' ? styles.chainCard : ''}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <input
                        type="text"
                        value={proxy.name}
                        onChange={(e) => handleUpdateProxy(proxy.id, { name: e.target.value })}
                        placeholder={t.proxyName}
                        className="text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                      />
                      <select
                        value={proxy.type}
                        onChange={(e) => {
                          const newType = e.target.value as ProxyType;
                          const updates: Partial<ProxyNode> = { type: newType };
                          if (newType === 'CHAIN' && (!proxy.chainHops || proxy.chainHops.length === 0)) {
                            const others = proxies.filter((p) => p.id !== proxy.id && p.type !== 'CHAIN');
                            updates.chainHops = others.length > 0 ? [others[0].id, 'DIRECT'] : ['DIRECT'];
                            updates.isConcatFormat = true;
                          }
                          handleUpdateProxy(proxy.id, updates);
                        }}
                        className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                      >
                        <option value="PROXY">PROXY (HTTP)</option>
                        <option value="HTTPS">HTTPS</option>
                        <option value="SOCKS5">SOCKS5</option>
                        <option value="SOCKS">SOCKS</option>
                        <option value="DIRECT">DIRECT</option>
                        <option value="CHAIN">{t.chainTypeLabel}</option>
                      </select>
                      {proxy.type === 'CHAIN' ? (
                        <div className="sm:col-span-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-text-sub font-mono truncate">
                            {formatProxyString(proxy, proxies)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteProxy(proxy.id)}
                            aria-label={`${t.delete} ${proxy.name}`}
                            className="p-2 text-text-sub hover:text-red-400 transition-colors shrink-0"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                      ) : proxy.type !== 'DIRECT' ? (
                        <>
                          <input
                            type="text"
                            value={proxy.host}
                            onChange={(e) => handleUpdateProxy(proxy.id, { host: e.target.value })}
                            placeholder={t.proxyHost}
                            className="text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={proxy.port}
                              onChange={(e) =>
                                handleUpdateProxy(proxy.id, {
                                  port: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                                })
                              }
                              placeholder={t.proxyPort}
                              className="w-full text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteProxy(proxy.id)}
                              aria-label={`${t.delete} ${proxy.name}`}
                              className="p-2 text-text-sub hover:text-red-400 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="sm:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteProxy(proxy.id)}
                            aria-label={`${t.delete} ${proxy.name}`}
                            className="p-2 text-text-sub hover:text-red-400 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 備援代理鏈展開建構器 */}
                    {proxy.type === 'CHAIN' && (
                      <div className={`mt-3 ${styles.chainBuilder}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-text-sub">
                            {t.chainBuilderTitle}
                          </span>
                          <label className={styles.chainToggle}>
                            <input
                              type="checkbox"
                              checked={proxy.isConcatFormat !== false}
                              onChange={(e) =>
                                handleUpdateProxy(proxy.id, { isConcatFormat: e.target.checked })
                              }
                            />
                            <span>{t.chainConcatToggle}</span>
                          </label>
                        </div>

                        {/* 順位標籤列表 */}
                        <div className={styles.chainHopsList}>
                          {(proxy.chainHops || ['DIRECT']).map((hopId, hopIdx) => {
                            const matched = proxies.find((p) => p.id === hopId);
                            const hopName =
                              hopId === 'DIRECT'
                                ? 'DIRECT'
                                : matched
                                ? `${matched.name} (${formatProxyString(matched, proxies)})`
                                : hopId;

                            return (
                              <React.Fragment key={hopIdx}>
                                <span className={styles.chainBadge}>
                                  <span className="opacity-70 font-mono">#{hopIdx + 1}</span>
                                  <span>{hopName}</span>
                                  {(proxy.chainHops || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (proxy.chainHops || []).filter((_, i) => i !== hopIdx);
                                        handleUpdateProxy(proxy.id, { chainHops: updated });
                                      }}
                                      className={styles.chainBadgeRemove}
                                      title={t.delete}
                                      aria-label={`${t.delete} ${hopName}`}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </span>
                                {hopIdx < (proxy.chainHops || []).length - 1 && (
                                  <span className={styles.chainArrow}>➔</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* 追加順位控制區 */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                          <select
                            id={`select_hop_${proxy.id}`}
                            className="text-xs bg-select-bg border border-white/10 rounded-lg px-2.5 py-1.5 text-text-main focus:outline-none"
                            defaultValue="DIRECT"
                          >
                            {proxies
                              .filter((p) => p.id !== proxy.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatProxyString(p, proxies)})
                                </option>
                              ))}
                            <option value="DIRECT">DIRECT (直連保底)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById(
                                `select_hop_${proxy.id}`
                              ) as HTMLSelectElement | null;
                              const val = selectEl?.value || 'DIRECT';
                              const currentHops = proxy.chainHops || [];
                              handleUpdateProxy(proxy.id, { chainHops: [...currentHops, val] });
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-text-main transition-colors font-medium flex items-center gap-1 border border-white/10"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            <span>{t.chainAddHop}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 規則清單 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span>{t.rulesTitle} ({rules.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {rules.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm(t.clearRulesConfirm)) {
                          setRules([]);
                        }
                      }}
                      className={styles.ghostButton}
                      title={t.clearRulesBtn}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                      <span>{t.clearRulesBtn}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{t.addRuleBtn}</span>
                  </button>
                </div>
              </div>

              <div
                className="flex flex-col gap-3"
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropTargetIndex(null);
                  }
                }}
              >
                {rules.map((rule, idx) => {
                  const validation = validateRuleValue(rule.conditionType, rule.value);
                  const validationMsg = isEn ? validation.messageEn : validation.messageZh;

                  const showDropAbove =
                    draggedRuleIndex !== null &&
                    dropTargetIndex === idx &&
                    draggedRuleIndex !== idx &&
                    draggedRuleIndex !== idx - 1;

                  const showDropBelow =
                    idx === rules.length - 1 &&
                    draggedRuleIndex !== null &&
                    dropTargetIndex === rules.length &&
                    draggedRuleIndex !== rules.length - 1;

                  return (
                    <React.Fragment key={rule.id}>
                      {showDropAbove && (
                        <div className={styles.dropIndicator} aria-hidden="true">
                          <div className={styles.dropIndicatorBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            <span>{isEn ? `Drop to insert at #${idx + 1}` : `放開以移至第 ${idx + 1} 位`}</span>
                          </div>
                        </div>
                      )}

                      <div
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggedRuleIndex(idx);
                          setDropTargetIndex(null);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midY = rect.top + rect.height / 2;
                          const targetPos = e.clientY < midY ? idx : idx + 1;
                          if (dropTargetIndex !== targetPos) {
                            setDropTargetIndex(targetPos);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dropTargetIndex !== null) {
                            handleDropAtIndex(dropTargetIndex);
                          } else if (draggedRuleIndex !== null && draggedRuleIndex !== idx) {
                            handleReorderRule(draggedRuleIndex, idx);
                            setDraggedRuleIndex(null);
                            setDropTargetIndex(null);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedRuleIndex(null);
                          setDropTargetIndex(null);
                        }}
                        className={`${styles.ruleCard} ${!rule.enabled ? styles.ruleCardDisabled : ''} ${
                          draggedRuleIndex === idx ? styles.ruleCardDragging : ''
                        }`}
                      >
                        {/* 上排：拖曳手柄、規則編號、名稱、開關與刪除 */}
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div
                              className={styles.dragHandle}
                              title={isEn ? 'Drag to reorder' : '按住拖曳以調整順序'}
                              aria-label={isEn ? 'Drag to reorder' : '按住拖曳以調整順序'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 3H7v2h2V3zm4 0h-2v2h2V3zm4 0h-2v2h2V3zM9 7H7v2h2V7zm4 0h-2v2h2V7zm4 0h-2v2h2V7zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                              </svg>
                            </div>
                            <span className="shrink-0 text-xs font-mono font-semibold text-text-sub px-2 py-0.5 rounded bg-white/5 border border-white/10">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={rule.name}
                              onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                              placeholder={t.ruleName}
                              className="flex-1 min-w-0 text-sm font-medium bg-transparent border-b border-white/10 px-2 py-1 text-text-main focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                            />
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateRule(rule.id, { enabled: !rule.enabled })}
                              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                                rule.enabled ? styles.ruleToggleActive : styles.ruleToggleInactive
                              }`}
                            >
                              {rule.enabled ? t.enable : t.disable}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              aria-label={`${t.delete} ${rule.name}`}
                              className="p-1 text-text-sub hover:text-red-400 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* 中排：條件型態、值、目標動作 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="sr-only">{t.conditionType}</label>
                            <select
                              value={rule.conditionType}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, { conditionType: e.target.value as ConditionType })
                              }
                              className="w-full text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                            >
                              <option value="domainSuffix">{t.conditionTypes.domainSuffix}</option>
                              <option value="plainHost">{t.conditionTypes.plainHost}</option>
                              <option value="domainExact">{t.conditionTypes.domainExact}</option>
                              <option value="wildcardHost">{t.conditionTypes.wildcardHost}</option>
                              <option value="wildcardUrl">{t.conditionTypes.wildcardUrl}</option>
                              <option value="ipv4Cidr">{t.conditionTypes.ipv4Cidr}</option>
                              <option value="ipv6Cidr">{t.conditionTypes.ipv6Cidr}</option>
                              <option value="clientIpv4">{t.conditionTypes.clientIpv4}</option>
                              <option value="clientIpv6">{t.conditionTypes.clientIpv6}</option>
                              <option value="protocol">{t.conditionTypes.protocol}</option>
                              <option value="port">{t.conditionTypes.port}</option>
                              <option value="weekday">{t.conditionTypes.weekday}</option>
                              <option value="timeRange">{t.conditionTypes.timeRange}</option>
                              <option value="regex">{t.conditionTypes.regex}</option>
                            </select>
                          </div>

                          <div>
                            {rule.conditionType !== 'plainHost' ? (
                              <textarea
                                rows={rule.value.includes('\n') ? Math.min(Math.max(rule.value.split('\n').length, 2), 6) : 1}
                                value={rule.value}
                                onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                                placeholder={t.conditionPlaceholders[rule.conditionType] || t.matchValue}
                                className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none transition-colors font-mono resize-y placeholder:text-text-sub/50 ${
                                  !validation.isValid
                                    ? styles.inputWarning
                                    : 'bg-black/20 border border-white/10 focus:border-[var(--theme-color)]'
                                }`}
                              />
                            ) : (
                              <div className="text-xs text-text-sub px-3 py-2.5 italic border border-dashed border-white/10 rounded-lg truncate" title={t.conditionPlaceholders.plainHost}>
                                {t.conditionPlaceholders.plainHost}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="sr-only">{t.targetAction}</label>
                            <select
                              value={rule.targetProxy}
                              onChange={(e) => handleUpdateRule(rule.id, { targetProxy: e.target.value })}
                              className="w-full text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                            >
                              <option value="DIRECT">{t.directOption}</option>
                              {proxies.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatProxyString(p, proxies)})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 卡片底端通欄：即時語法告警 或 溫和輔助提示 */}
                        {!validation.isValid && validationMsg ? (
                          <div className={styles.ruleWarningBar} role="alert">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className={styles.ruleWarningIcon}
                              aria-hidden="true"
                            >
                              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                            </svg>
                            <span className={styles.ruleWarningText}>{validationMsg}</span>
                          </div>
                        ) : rule.conditionType !== 'plainHost' ? (
                          <div className={styles.ruleInfoBar}>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className={styles.ruleInfoIcon}
                              aria-hidden="true"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                            <span className={styles.ruleInfoText}>{t.multiValueHint}</span>
                          </div>
                        ) : null}
                      </div>

                      {showDropBelow && (
                        <div className={styles.dropIndicator} aria-hidden="true">
                          <div className={styles.dropIndicatorBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            <span>{isEn ? `Drop to insert at #${rules.length}` : `放開以移至第 ${rules.length} 位`}</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 預設行為 */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-main">{t.defaultActionTitle}：</span>
                <select
                  value={defaultAction}
                  onChange={(e) => setDefaultAction(e.target.value)}
                  className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)] sm:max-w-xs"
                >
                  <option value="DIRECT">{t.directOption}</option>
                  {proxies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatProxyString(p, proxies)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 進階選項 */}
            <div className={styles.panel}>
              <div className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                <span>{t.optionsTitle}</span>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableIpv6}
                    onChange={(e) => setEnableIpv6(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
                  />
                  <span className="text-sm text-text-sub">{t.enableIpv6Label}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolveIpFirst}
                    onChange={(e) => setResolveIpFirst(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
                  />
                  <span className="text-sm text-text-sub">{t.resolveIpFirstLabel}</span>
                </label>
              </div>
            </div>
          </div>

          {/* 右欄：產出預覽與設定指引 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 預覽與下載面板 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                  </svg>
                  <span>{t.previewTitle}</span>
                </div>
              </div>

              {/* 代碼預覽區 */}
              <div className={styles.codeBox}>{generatedScript}</div>

              {/* 核心操作按鈕群 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  <span>{t.copyScript}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPac}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  <span>{t.downloadPac}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyDataUrl}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </svg>
                  <span>{t.copyDataUrl}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportConfig}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                  </svg>
                  <span>{t.exportConfigBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToTester}
                  className={`${styles.actionButton} ${styles.secondaryButton} ${styles.testerLinkButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{t.testInTester}</span>
                </button>
              </div>

              {/* 複製成功提示 */}
              {toastMessage && (
                <div className={`text-center text-xs font-semibold py-2 px-3 rounded-lg ${styles.toastSuccess} animate-fade-in`}>
                  {toastMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 匯入 PAC 腳本或專案設定彈窗 Modal */}
        {isImportModalOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
          >
            <div className={styles.modalCard}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={styles.themeAccentText}>
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <h2 id="import-modal-title" className="text-base font-bold text-text-main">
                    {t.importModalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-text-sub hover:text-text-main hover:bg-white/10 transition-colors"
                  aria-label={t.cancelBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-text-sub leading-relaxed">
                {t.importModalDesc}
              </p>

              {/* 檔案上傳列 */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-text-main cursor-pointer transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                  </svg>
                  <span>{t.uploadFileBtn}</span>
                  <input
                    type="file"
                    accept=".pac,.js,.txt,.json"
                    onChange={handleImportFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 代碼貼入文字框 */}
              <textarea
                value={importContent}
                onChange={(e) => {
                  setImportContent(e.target.value);
                  if (importError) setImportError(null);
                }}
                placeholder={t.importPlaceholder}
                className={styles.modalTextarea}
              />

              {/* 錯誤提示 */}
              {importError && (
                <div className={styles.ruleWarningBar} role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={styles.ruleWarningIcon}>
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span className={styles.ruleWarningText}>{importError}</span>
                </div>
              )}

              {/* 匯入模式選擇與送出按鈕 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4 text-xs text-text-sub">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-[var(--theme-color)]"
                    />
                    <span>{t.importModeReplace}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-[var(--theme-color)]"
                    />
                    <span>{t.importModeAppend}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleDoImport}
                    disabled={!importContent.trim()}
                    className={`${styles.actionButton} ${styles.primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t.parseAndApplyBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ 常見問題 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#00f5a0"
        />
      </div>
    </ToolLayout>
  );
}
