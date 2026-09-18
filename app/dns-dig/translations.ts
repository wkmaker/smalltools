/**
 * 線上 DNS DIG 網路診斷工具頁面中英文案（從 DnsDigClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '線上 DNS DIG 網路診斷工具',
    subtitle: 'ONLINE DNS LOOKUP & DIAGNOSTICS',
    description:
      '專業免費的線上 DNS DIG 網路診斷工具！串接 Cloudflare, Google 與 阿里雲 DoH (DNS over HTTPS) API，支援 A, CNAME, MX, TXT, HTTPS 等全紀錄類型即時檢索與 RFC 9460 轉譯。',
    settingsTitle: 'DNS 查詢設定',
    shareBtn: '複製查詢連結',
    shareToast: '已複製 DNS 查詢分享連結',
    domainLabel: '查詢網域名稱 (Domain / URL)',
    domainPlaceholder: '例如：cjkuo.net 或貼上網址',
    providerLabel: 'DNS 查詢伺服器 (DoH)',
    providerCloudflare: 'Cloudflare DNS (1.1.1.1)',
    providerGoogle: 'Google DNS (8.8.8.8)',
    providerAliDNS: '阿里雲 DNS (AliDNS)',
    providerAliDnsNotice: '查詢的網域名稱將直接送往中國大陸第三方（阿里雲）DNS 伺服器，請留意跨境資料流向。',
    typeLabel: '查詢紀錄類型 (Type)',
    queryBtn: '進行 DIG 查詢',
    querying: '請求中...',
    resultTitle: '解析診斷成果看板',
    statusLabel: '響應狀態 (Status)',
    durationLabel: '查詢耗時 (Duration)',
    answerTitle: '答覆紀錄 (Answer)',
    colName: '網域名稱',
    colType: '類型',
    colTTL: 'TTL',
    colData: '記錄值 (Data)',
    noRecords: '查無對應的紀錄或該網域未設定解析。',
    enterDomainToast: '請輸入欲查詢的網域名稱！',
    typeSwitchedToast: '已切換紀錄類型，請進行查詢',
    rawJsonTitle: '檢視完整 DoH JSON 數據',
    copyJsonBtn: '複製 JSON',
    copyJsonToast: '已複製 JSON 數據',
    copyCellToast: '已複製',
    queryErrorMsg: '查詢 DNS 發生連線錯誤，請檢查網域或 API 回應。',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 DNS Over HTTPS (DoH) 加密運作、DNS 紀錄類型與 RFC 9460 解碼',
    faqItems: [
      {
        q: '什麼是 DNS Over HTTPS (DoH)？與傳統 UDP 53 埠 DNS 查詢有何不同？',
        a: '傳統 DNS 查詢透過 UDP/TCP Port 53 以明文發送，容易遭 ISP 電信業者、公共 Wi-Fi 監聽或中間人竄改 (DNS Hijacking)。DoH (RFC 8484) 將 DNS 查詢封裝在 TLS 加密通道中 (HTTPS 443 埠)，不僅大幅提升網路隱私防護，更能繞過企業防火牆對 53 埠的干擾限制。本工具預設支援 Cloudflare (1.1.1.1)、Google (8.8.8.8) 與 AliDNS 即時切換查詢。',
      },
      {
        q: '常見的 DNS 紀錄類型 (A, AAAA, CNAME, MX, TXT, NS, CAA) 代表什麼意思？',
        a: `常見 DNS 紀錄功能如下：

① A 紀錄：將網域名稱指向 IPv4 位址（如 192.0.2.1）。
② AAAA 紀錄：將網域名稱指向 IPv6 位址（如 2001:db8::1）。
③ CNAME 紀錄：網域別名，將網域指向另一個目標網域名稱。
④ MX 紀錄：郵件伺服器紀錄，指定接收該網域 Email 的 Mail Server 及其優先權 (Priority)。
⑤ TXT 紀錄：文字紀錄，常用於 SPF、DKIM、DMARC 郵件防偽認證及網域所有權驗證。
⑥ NS 紀錄：指定託管該網域 DNS 解析的權威名稱伺服器 (Name Server)。
⑦ CAA 紀錄：指定僅允許哪些 CA 憑證頒發機構為該網域簽發 SSL 憑證。`,
      },
      {
        q: '什麼是 DNS 全球快取生效時間 (DNS Propagation) 與 TTL？',
        a: 'TTL (Time To Live) 代表 DNS 紀錄在各級 DNS 伺服器中的「快取快照有效秒數」（例如 TTL=300 代表快取 5 分鐘）。當您修改網域 IP 或 DNS 紀錄時，全球 ISP 電信業者與 DNS 快取伺服器需要數分鐘至 48 小時逐步更新舊快取，此過程稱為 DNS 擴散 (Propagation)。本工具查詢結果會精準顯示目前各紀錄剩餘的 TTL 秒數。',
      },
      {
        q: '為什麼在設定網域指向時，A 紀錄與 CNAME 不能同時共存在 Root 網域（@ 裸網域）？',
        a: '依據 RFC 1034 規範，CNAME 紀錄代表「全權移交」，任何設定 CNAME 的網域名稱不得再共存其他紀錄類型 (如 MX, TXT)。由於 Root 網域 (example.com) 必須包含 NS 與 SOA 紀錄，因此傳統上 Root 網域不能設 CNAME。解決方案是使用 Cloudflare 的 CNAME Flattening 或 ALIAS 紀錄技術。',
      },
      {
        q: '什麼是最新 RFC 9460 HTTPS / SVCB 紀錄？為什麼傳統 DIG 查詢看不懂？',
        a: 'HTTPS (TYPE 65) 與 SVCB (TYPE 64) 是網際網路工程任務組 (IETF) 推出的最新 DNS 規格，允許瀏覽器在發出 HTTP/3 或 QUIC 請求前，直接透過 DNS 取得目標伺服器的 ALPN (HTTP/2 / HTTP/3 協定)、ECH (Encrypted Client Hello 隱私防護) 與自訂 Port。由於這是二進位 Wire Format，傳統命令列 dig 工具若版本過舊會顯示為 TYPE65 原生十六進位，本工具內建 RFC 9460 解碼引擎，能自動解析為易讀的格式。',
      },
      {
        q: '在本工具查詢 DNS 紀錄，結果會被快取嗎？與其他第三方 DNS 網站有何不同？',
        a: `本工具 100% 由您的瀏覽器直接發起 HTTP/2 連線連至官方 DoH 端點 (Cloudflare 1.1.1.1 / Google 8.8.8.8)，全程絕不經過任何第三方中繼代理伺服器 (No Third-Party Proxy Server)！

這帶來三大核心優勢：
① 100% 直連零轉手：查詢請求由您自己的瀏覽器直連官方 DNS 伺服器，絕無中間伺服器截留或記錄。
② 零快取即時反應：不經過第三方網站伺服器快取，只要上游 DNS 完成更新，即可立即查驗最新數據。
③ 極致隱私保護：本伺服器完全不收集、不紀錄您的查詢目標網域或 IP 歷程，確保診斷時的絕對隱私。`,
      },
      {
        q: '為什麼我在 DNS 代管商 (如 GoDaddy, Cloudflare, Namecheap) 修改了紀錄，查詢結果卻顯示舊的 IP 或沒有生效？',
        a: `網域 DNS 修改未即時生效，通常由以下 4 大關鍵原因造成：

① TTL (快取時間) 尚未過期：
在您修改之前，舊的 DNS 紀錄已經被全球 ISP 電信業者（如中華電信、遠傳）或您的電腦/手機快取。必須等待舊紀錄的 TTL 秒數倒數歸零（例如 300 秒或 86400 秒），快取伺服器才會向權威 DNS 抓取新資料。

② 本機電腦或瀏覽器 DNS 快取殘留：
您的作業系統或瀏覽器（如 Chrome/Edge）會建立本機快取。可嘗試執行 ipconfig /flushdns (Windows) 或清空瀏覽器快取，並切換手機行動網路 (4G/5G) 測試。

③ 名稱伺服器 (NS 紀錄) 指向錯誤或修改中：
若您剛更換 DNS 代管商（如將 NS 改為 Cloudflare），NS 轉移屬於頂級網域 (TLD) 層級的異動，全球廣播擴散需要 24 至 48 小時才能完整生效。

④ 權威 DNS 伺服器同步延遲：
部分 DNS 代管平台在您點擊「儲存」後，內部叢集伺服器之間需要數秒至數分鐘進行資料同步。您可以透過本工具切換 Cloudflare DoH 或 Google DoH 交叉比對最新解析狀況！`,
      },
    ],
  },
  en: {
    title: 'Online DNS DIG Tool',
    subtitle: 'ONLINE DNS LOOKUP & DIAGNOSTICS',
    description:
      'Free online DNS DIG diagnostic tool! Query Cloudflare, Google, and AliDNS over HTTPS (DoH) APIs for instant lookup of A, AAAA, CNAME, MX, TXT, NS, and HTTPS records with RFC 9460 decoding.',
    settingsTitle: 'DNS Settings',
    shareBtn: 'Copy Share Link',
    shareToast: 'DNS lookup link copied to clipboard',
    domainLabel: 'Target Domain Name (Domain / URL)',
    domainPlaceholder: 'e.g., cjkuo.net or paste URL',
    providerLabel: 'DNS Provider (DoH)',
    providerCloudflare: 'Cloudflare DNS (1.1.1.1)',
    providerGoogle: 'Google DNS (8.8.8.8)',
    providerAliDNS: 'Alibaba Cloud DNS (AliDNS)',
    providerAliDnsNotice: 'The queried domain name will be sent directly to a third-party DNS server in mainland China (Alibaba Cloud) — please be aware of this cross-border data flow.',
    typeLabel: 'Record Type',
    queryBtn: 'Execute DIG Lookup',
    querying: 'Querying...',
    resultTitle: 'Diagnostic Results Dashboard',
    statusLabel: 'Response Status',
    durationLabel: 'Query Duration',
    answerTitle: 'Answer Records',
    colName: 'Domain Name',
    colType: 'Type',
    colTTL: 'TTL',
    colData: 'Record Data',
    noRecords: 'No matching records found for this domain.',
    enterDomainToast: 'Please enter a target domain name!',
    typeSwitchedToast: 'Record type switched, ready to query',
    rawJsonTitle: 'View Full DoH JSON Response',
    copyJsonBtn: 'Copy JSON',
    copyJsonToast: 'JSON data copied to clipboard',
    copyCellToast: 'Copied',
    queryErrorMsg: 'DNS query connection error. Please check domain or API availability.',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about DNS Over HTTPS (DoH), record types, TTL propagation, and RFC 9460 decoding.',
    faqItems: [
      {
        q: 'What is DNS over HTTPS (DoH), and how does it differ from traditional DNS?',
        a: 'Traditional DNS queries use unencrypted UDP/TCP port 53 in plaintext, vulnerable to ISP eavesdropping and DNS spoofing/hijacking. DoH (RFC 8484) encrypts DNS queries inside TLS tunnels over HTTPS (port 443), dramatically enhancing privacy while bypassing firewalls blocking port 53. Our tool supports switching between Cloudflare (1.1.1.1), Google (8.8.8.8), and AliDNS endpoints instantly.',
      },
      {
        q: 'What do common DNS record types (A, AAAA, CNAME, MX, TXT, NS, CAA) mean?',
        a: `Common DNS record types and functions:

① A Record: Maps a domain name to an IPv4 address (e.g. 192.0.2.1).
② AAAA Record: Maps a domain name to an IPv6 address (e.g. 2001:db8::1).
③ CNAME Record: Canonical Name alias pointing one domain to another target domain.
④ MX Record: Mail Exchange record specifying email servers and priority for the domain.
⑤ TXT Record: Text record used for SPF, DKIM, DMARC email authentication, and domain verification.
⑥ NS Record: Identifies the authoritative name servers hosting DNS for the domain.
⑦ CAA Record: Certificate Authority Authorization specifying which CAs can issue SSL certs for the domain.`,
      },
      {
        q: 'What is DNS Propagation and TTL?',
        a: 'TTL (Time To Live) is the number of seconds DNS resolvers cache a record (e.g. TTL=300 means 5 minutes). When updating DNS records, global ISPs and resolvers gradually refresh old cached data over 5 minutes to 48 hours—a process known as DNS Propagation. Our tool displays the remaining TTL seconds for every query response.',
      },
      {
        q: 'Why can\'t A and CNAME records coexist on the apex/root domain (@)?',
        a: 'According to RFC 1034, a CNAME record claims full alias authority over a node, prohibiting coexisting records of any other type (such as MX or SOA). Since root domains (example.com) must contain SOA and NS records, CNAME cannot exist at the root. Solution: Use Cloudflare CNAME Flattening or ALIAS records.',
      },
      {
        q: 'What is the new RFC 9460 HTTPS / SVCB record, and why don\'t legacy dig tools display it properly?',
        a: 'HTTPS (TYPE 65) and SVCB (TYPE 64) are modern IETF specifications enabling browsers to retrieve HTTP/3, QUIC, ALPN protocols, and Encrypted Client Hello (ECH) parameters directly from DNS before establishing HTTP connections. Legacy command-line dig tools output raw hexadecimal TYPE65 blobs, whereas our tool includes a built-in RFC 9460 binary decoder to render human-readable parameters.',
      },
      {
        q: 'How does this tool query DNS records? Does it use intermediate third-party servers?',
        a: `Queries are sent 100% directly from your own browser via HTTP/2 to official DoH endpoints (Cloudflare 1.1.1.1 or Google 8.8.8.8), completely bypassing any intermediate third-party proxy servers (No Third-Party Proxy Server)!

Key advantages:
① Direct Browser-to-DNS Connection: Queries travel straight from your client IP to official DNS servers without intermediate interception or data logging.
② Zero Proxy Caching: No intermediate server caching, allowing you to verify DNS changes immediately after saving them at your registrar.
③ Complete Privacy Guarantee: Our servers never store, log, or track your queried domains or IP history.`,
      },
      {
        q: 'Why didn\'t my DNS update take effect immediately after updating records at my registrar (GoDaddy, Cloudflare, Namecheap)?',
        a: `Delayed DNS updates are typically caused by four primary factors:

① Unexpired TTL (Cache Timeout):
Before your change, the old DNS record was cached by global ISPs and resolvers. You must wait until the old TTL seconds count down to zero (e.g. 300s or 86400s) before resolvers request fresh records.

② Local OS & Browser DNS Caching:
Your local operating system and browser (Chrome/Safari) maintain their own DNS cache:
- Windows: Run ipconfig /flushdns in Command Prompt.
- Mac: Run sudo dscacheutil -flushcache in Terminal.
- Try opening an Incognito window or testing via mobile cellular network (4G/5G).

③ Nameserver (NS) Delegation Changes:
If you recently changed your DNS provider (e.g. updating NS records to Cloudflare), TLD-level delegation updates take 24 to 48 hours to fully propagate globally.

④ Authoritative Cluster Synchronization:
Some DNS providers require a few seconds to minutes for changes to sync across all internal cluster nodes after saving. You can switch between Cloudflare DoH and Google DoH in this tool to cross-verify propagation status!`,
      },
    ],
  },
};
