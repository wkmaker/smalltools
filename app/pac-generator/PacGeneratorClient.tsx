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
  PRESET_TEMPLATES,
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
    addProxyBtn: '新增節點',
    proxyName: '節點名稱',
    proxyType: '類型',
    proxyHost: '主機 / IP',
    proxyPort: '埠號',
    proxyCustom: '自訂字串 (選填)',
    rulesTitle: '分流規則編排 (Routing Rules)',
    addRuleBtn: '新增規則',
    ruleName: '規則名稱',
    conditionType: '比對條件',
    matchValue: '比對目標值',
    targetAction: '目標動作',
    ruleDescription: '說明備註',
    moveUp: '上移',
    moveDown: '下移',
    delete: '刪除',
    enable: '啟用',
    disable: '停用',
    defaultActionTitle: '未命中規則時的預設路由',
    directOption: 'DIRECT (直連不經代理)',
    previewTitle: '生成的 PAC 腳本 (JavaScript)',
    copyScript: '複製代碼',
    downloadPac: '下載 .pac 檔案',
    copyDataUrl: '複製 Data URI',
    testInTester: '前往 PAC 測試器驗證',
    copiedToast: '已複製到剪貼簿！',
    optionsTitle: '進階輸出設定',
    enableIpv6Label: '啟用 IPv6 擴充支援 (isInNetEx)',
    resolveIpFirstLabel: '比對 IP 前先行解析主機網域名稱 (dnsResolve)',
    guideTitle: '各平台 PAC 設定快速指南',
    guideWindows: 'Windows 11 / 10：設定 ➔ 網路和網際網路 ➔ Proxy ➔ 使用安裝程式碼 (開啟) ➔ 貼上腳本網址或 Data URL。',
    guideMac: 'macOS：系統設定 ➔ 網路 ➔ 點擊連線中的介面 ➔ 詳細資訊 ➔ 代理伺服器 ➔ 開啟「自動代理伺服器設定 (PAC)」➔ 輸入 URL。',
    guideIos: 'iOS / iPadOS：設定 ➔ Wi-Fi ➔ 點擊已連線 Wi-Fi 右側「i」➔ 設定代理伺服器 ➔ 選擇「自動」➔ 貼入 URL。',
    guideFirefox: 'Firefox：設定 ➔ 一般 ➔ 網路設定 ➔ 選擇「自動代理設定網址 (PAC)」➔ 貼入 URL。',
    conditionTypes: {
      plainHost: '純主機名稱 (無點號，如 intranet/)',
      domainSuffix: '網域後綴 (如 .google.com)',
      domainExact: '完整網域名稱 (精確相符)',
      wildcardHost: '主機名萬用字元 (*.internal.*)',
      wildcardUrl: '完整 URL 萬用字元 (https://*)',
      ipv4Cidr: 'IPv4 網段 / CIDR (如 10.0.0.0/8)',
      ipv6Cidr: 'IPv6 網段 / CIDR (如 fc00::/7)',
      regex: '正則表達式 (RegEx)',
    },
    faqTitle: '常見問題與技術解析',
    faqSubtitle: '深入瞭解 PAC 規格、瀏覽器相容性、IPv6 與備援鏈機制',
    faqItems: [
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

④ 瀏覽器外掛 (如 SwitchyOmega)：
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
    proxyName: 'Node Name',
    proxyType: 'Type',
    proxyHost: 'Host / IP',
    proxyPort: 'Port',
    proxyCustom: 'Custom String (Optional)',
    rulesTitle: 'Routing Rules Pipeline',
    addRuleBtn: 'Add Rule',
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
    copiedToast: 'Copied to clipboard!',
    optionsTitle: 'Advanced Output Options',
    enableIpv6Label: 'Enable IPv6 Extended Support (isInNetEx)',
    resolveIpFirstLabel: 'Resolve Host IP Before Subnet Check (dnsResolve)',
    guideTitle: 'Quick OS PAC Setup Guide',
    guideWindows: 'Windows 11 / 10: Settings ➔ Network & Internet ➔ Proxy ➔ Use setup script (Turn ON) ➔ Paste script URL or Data URI.',
    guideMac: 'macOS: System Settings ➔ Network ➔ Active Interface ➔ Details ➔ Proxies ➔ Enable "Automatic Proxy Configuration (PAC)" ➔ Enter URL.',
    guideIos: 'iOS / iPadOS: Settings ➔ Wi-Fi ➔ Tap "i" icon on active Wi-Fi ➔ Configure Proxy ➔ Select Automatic ➔ Paste URL.',
    guideFirefox: 'Firefox: Settings ➔ General ➔ Network Settings ➔ Select "Automatic proxy configuration URL" ➔ Paste URL.',
    conditionTypes: {
      plainHost: 'Plain Hostname without dots (e.g. intranet/)',
      domainSuffix: 'Domain Suffix (e.g. .google.com)',
      domainExact: 'Exact Hostname (e.g. example.com)',
      wildcardHost: 'Hostname Wildcard (*.internal.*)',
      wildcardUrl: 'URL Wildcard (https://*)',
      ipv4Cidr: 'IPv4 Subnet / CIDR (e.g. 10.0.0.0/8)',
      ipv6Cidr: 'IPv6 Subnet / CIDR (e.g. fc00::/7)',
      regex: 'Regular Expression (RegEx)',
    },
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'In-depth guide to PAC specifications, IPv6 extensions, failover chains, and browser behavior',
    faqItems: [
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

④ Browser Extensions (e.g. SwitchyOmega):
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
        {/* 常用範本選擇列 */}
        <div className="mb-6 flex flex-wrap items-center gap-2" role="region" aria-label={t.presetLabel}>
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

        {/* 左右雙欄 Grid */}
        <div className={styles.layoutGrid}>
          {/* 左欄：代理池與規則排程 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 代理節點池 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zM6 4h2v1H6V4zm0 8h2v1H6v-1zm0 8h2v1H6v-1z" />
                  </svg>
                  <span>{t.proxyPoolTitle}</span>
                </div>
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
              </div>

              <div className="flex flex-col gap-3">
                {proxies.map((proxy) => (
                  <div key={proxy.id} className={styles.ruleCard}>
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
                        onChange={(e) => handleUpdateProxy(proxy.id, { type: e.target.value as ProxyType })}
                        className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                      >
                        <option value="PROXY">PROXY (HTTP)</option>
                        <option value="HTTPS">HTTPS</option>
                        <option value="SOCKS5">SOCKS5</option>
                        <option value="SOCKS">SOCKS</option>
                        <option value="DIRECT">DIRECT</option>
                      </select>
                      {proxy.type !== 'DIRECT' ? (
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

              <div className="flex flex-col gap-3">
                {rules.map((rule, idx) => {
                  return (
                    <div
                      key={rule.id}
                      className={`${styles.ruleCard} ${!rule.enabled ? styles.ruleCardDisabled : ''}`}
                    >
                      {/* 上排：規則名稱、排序、開關與刪除 */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-text-sub px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                            placeholder={t.ruleName}
                            className="text-sm font-medium bg-transparent border-b border-white/10 px-1 py-0.5 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveRule(idx, 'up')}
                            disabled={idx === 0}
                            aria-label={t.moveUp}
                            className="p-1 text-text-sub hover:text-text-main disabled:opacity-30"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRule(idx, 'down')}
                            disabled={idx === rules.length - 1}
                            aria-label={t.moveDown}
                            className="p-1 text-text-sub hover:text-text-main disabled:opacity-30"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateRule(rule.id, { enabled: !rule.enabled })}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${
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
                            <option value="regex">{t.conditionTypes.regex}</option>
                          </select>
                        </div>

                        <div>
                          {rule.conditionType !== 'plainHost' ? (
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                              placeholder={t.matchValue}
                              className="w-full text-sm bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                            />
                          ) : (
                            <div className="text-xs text-text-sub px-3 py-2.5 italic border border-dashed border-white/10 rounded-lg">
                              isPlainHostName (無須指定值)
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
                                {p.name} ({formatProxyString(p)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
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
                      {p.name} ({formatProxyString(p)})
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

            {/* 系統設定速查 */}
            <div className={styles.panel}>
              <div className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                </svg>
                <span>{t.guideTitle}</span>
              </div>
              <div className="flex flex-col gap-2.5 text-xs text-text-sub leading-relaxed">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <strong className="text-text-main block mb-1">Windows</strong>
                  {t.guideWindows}
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <strong className="text-text-main block mb-1">macOS</strong>
                  {t.guideMac}
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <strong className="text-text-main block mb-1">iOS / iPadOS</strong>
                  {t.guideIos}
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <strong className="text-text-main block mb-1">Firefox</strong>
                  {t.guideFirefox}
                </div>
              </div>
            </div>
          </div>
        </div>

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
