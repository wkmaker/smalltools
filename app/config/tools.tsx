import { ReactNode } from 'react';

export type Category = 'finance' | 'developer' | 'network' | 'text' | 'utility';

export interface Tool {
  name: string;
  subtitle: string;
  description: string;
  href: string;
  cardClass: string;
  category: Category;
  keywords: string;
  svg: ReactNode;
}

export interface CategorySection {
  id: Category;
  label: string;
  emoji: string;
  tools: Tool[];
}

export const CATEGORIES: CategorySection[] = [
  {
    id: 'finance',
    label: '金融理財',
    emoji: '🏦',
    tools: [
      {
        name: '複利計算機',
        subtitle: 'COMPOUND INTEREST CALCULATOR',
        description: '精緻且專業的複利計算工具，支援年/月利率與定期定額，透過動態堆疊圖表直觀呈現財富增長軌跡。',
        href: '/compound-interest/',
        cardClass: 'interestCard',
        category: 'finance',
        keywords: '複利計算機 compound interest 定期定額 財富 增長',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
          </svg>
        ),
      },
      {
        name: '信貸計算機',
        subtitle: 'PERSONAL LOAN CALCULATOR',
        description: '專業的個人信貸試算工具，支援本息/本金平均攤還與實質年利率 (APR) 估算，助您精準掌握還款明細與利息支出。',
        href: '/personal-loan/',
        cardClass: 'loanCard',
        category: 'finance',
        keywords: '信貸計算機 personal loan 本息均攤 本金均攤 實質年利率 apr 還款',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        ),
      },
      {
        name: '車貸計算機',
        subtitle: 'CAR LOAN CALCULATOR',
        description: '貼心的車貸試算工具，支援車價與自備款成數試算、寬限期設定，並提供詳細的月付金額與實質年利率分析。',
        href: '/car-loan/',
        cardClass: 'carCard',
        category: 'finance',
        keywords: '車貸計算機 car loan 自備款 寬限期 月付金 apr 還款',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
            <circle cx="7.5" cy="14.5" r="1.5" />
            <circle cx="16.5" cy="14.5" r="1.5" />
          </svg>
        ),
      },
      {
        name: '房貸計算機',
        subtitle: 'MORTGAGE LOAN CALCULATOR',
        description: '專業的房貸試算工具，支援自備款與貸款成數雙向連動、寬限期試算、多段式階梯利率設定，並提供詳細的月付本息明細與實質年利率分析。',
        href: '/mortgage-loan/',
        cardClass: 'mortgageCard',
        category: 'finance',
        keywords: '房貸計算機 mortgage loan 自備款 寬限期 階梯利率 多段式利率 apr 還款',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        ),
      },
      {
        name: '股票質押與維持率壓力測試器',
        subtitle: 'STOCK PLEDGING & RISK CALCULATOR',
        description: '台股資產活化與槓桿風險管理利器。支援個股股價與張數雙向市值連動、自訂追繳門檻、大跌幅壓力測試模擬，並精確計算追繳臨界股價與安全回補保證金。',
        href: '/pledge-calculator/',
        cardClass: 'pledgeCard',
        category: 'finance',
        keywords: '股票質押 維持率 壓力測試 stock pledging risk calculator 追繳 臨界',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
        ),
      },
      {
        name: '台股期貨槓桿與逆風點數估算器',
        subtitle: 'FUTURES MARGIN & LEVERAGE CALCULATOR',
        description: '期貨交易者風控防斷頭神器。即時計算大台/小台/微台實質資金槓桿倍數，並模擬逆風行情下之帳面損益、風控指標指針，以及追繳與強平臨界指數點數。',
        href: '/futures-calculator/',
        cardClass: 'futuresCard',
        category: 'finance',
        keywords: '台股期貨 槓桿 逆風 點數 futures margin leverage calculator 斷頭 追繳 臨界',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 15.66z" />
          </svg>
        ),
      },
      {
        name: '薪資、勞保、健保、預扣稅計算機',
        subtitle: 'SALARY & INSURANCES CALCULATOR',
        description: '精準且唯美的台灣薪資與保費試算工具。一鍵查表比對勞保、健保、勞退與預扣稅金額，清晰呈現員工薪資扣項明細與雇主總勞務營運成本。',
        href: '/my-salary-calculator/',
        cardClass: 'salaryCard',
        category: 'finance',
        keywords: '薪資與勞健保計算機 薪資 勞保 健保 勞退 實領薪水 雇主成本 salary calculator',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'developer',
    label: '開發輔助',
    emoji: '💻',
    tools: [
      {
        name: 'Base64 編碼/解碼',
        subtitle: 'BASE64 ENCODER & DECODER',
        description: '精緻的 Base64 轉換工具，支援文字即時雙向編解碼（UTF-8 不亂碼）、檔案拖曳編碼與多媒體預覽，並可解碼還原下載。',
        href: '/base64/',
        cardClass: 'base64Card',
        category: 'developer',
        keywords: 'base64 編碼 解碼 encoder decoder 檔案 拖曳 轉換',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
        ),
      },
      {
        name: 'URL 編碼/解碼',
        subtitle: 'URL ENCODER & DECODER',
        description: '專業的網址編解碼工具，支援 URI/URIComponent 模式，並具備強大的 Query 參數表格即時解析與雙向編輯功能。',
        href: '/url/',
        cardClass: 'urlCard',
        category: 'developer',
        keywords: 'url 編碼 解碼 encoder decoder query 參數 網址 轉換',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        ),
      },
      {
        name: '安全密碼生成器',
        subtitle: 'PASSWORD GENERATOR (CSPRNG)',
        description: '密碼學安全強隨機數密碼生成工具（CSPRNG），支援排除易混淆字元、強制每種字元分佈、即時強度評估與生成歷史記錄。',
        href: '/password/',
        cardClass: 'passwordCard',
        category: 'developer',
        keywords: '安全密碼生成器 password generator csprng 強度 隨機',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
        ),
      },
      {
        name: 'JSON 格式化與美化器',
        subtitle: 'JSON FORMATTER & MINIFIER',
        description: '精緻且功能齊全的 JSON 處理小工具，支援即時語法 lint 驗證定位、多縮排格式美化、樹狀摺疊檢視與單行緊湊壓縮，並可拖曳檔案上傳與下載匯出。',
        href: '/json/',
        cardClass: 'jsonCard',
        category: 'developer',
        keywords: 'json 格式化 美化器 formatter minifier lint 驗證 壓縮',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff00aa]">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
        ),
      },
      {
        name: 'SSL 憑證格式轉換器',
        subtitle: 'SSL CERTIFICATE CONVERTER',
        description: '專業的安全 SSL 憑證格式轉換工具。支援 PFX/P12, PEM, DER 雙向轉換，具備私鑰/憑證金鑰雜湊匹配檢查與證書到期動態警示。',
        href: '/ssl-converter/',
        cardClass: 'sslConverterCard',
        category: 'developer',
        keywords: 'ssl certificate converter pfx p12 pem der key crt ca-bundle x509 pkcs12 憑證 格式 轉換 密鑰 雜湊',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ffaa]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'network',
    label: '網路工具',
    emoji: '🌐',
    tools: [
      {
        name: 'DIG 網路診斷工具',
        subtitle: 'DNS DIG WEB TOOL',
        description: '工程師必備的線上 DNS 診斷工具。支援 Cloudflare / Google 加密 DoH 伺服器切換、網域/網址自動解析清理，即時發送 DIG 請求查詢 A, CNAME, MX, TXT 各項記錄。',
        href: '/dns-dig/',
        cardClass: 'digCard',
        category: 'network',
        keywords: 'dig 網路診斷工具 dns web tool cloudflare google doh 查詢',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-2h6v2h-6zm-10-7l3.5-3.5L7 10l-2.5 2.5L2 10l2.5-2.5L3 6l-3.5 3.5L3 13z" />
          </svg>
        ),
      },
      {
        name: 'IP 檢測助手',
        subtitle: 'IP DIAGNOSTIC TOOL',
        description: '專業的網路與 IP 連線診斷工具。支援即時 IPv4/IPv6 雙棧偵測、Cloudflare 與 Mullvad 隱私節點查詢，以及公有雲服務連線延遲診斷。',
        href: '/ip-detector/',
        cardClass: 'digCard',
        category: 'network',
        keywords: 'ip detector diagnostic trace ping check ipv4 ipv6 cloudflare mullvad aws gcp azure apple 檢測 診斷 延遲',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        ),
      },
      {
        name: 'DNS HTTPS 紀錄設定產生器',
        subtitle: 'DNS HTTPS (TYPE 65) GENERATOR',
        description: '免費線上 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生器與對照指南。透過視覺化勾選與填空即時生成 ALPN、IP Hint 等參數，並提供各大 DNS 代管商 4 大欄位填寫教學。',
        href: '/https-dns-generator/',
        cardClass: 'httpsDnsCard',
        category: 'network',
        keywords: 'dns https record type 65 rfc 9460 svcb cloudflare route53 alpn ipv4hint ipv6hint 設定 產生器 教學',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z" />
          </svg>
        ),
      },
      {
        name: 'IP 子網段計算器',
        subtitle: 'IP SUBNET CALCULATOR',
        description: '快速計算 IPv4 / CIDR 的網段資訊，精確列出網路位址、廣播位址與可用 IP 位址列表與數量，支援大網段極速 TXT/CSV 下載。',
        href: '/ip-calculator/',
        cardClass: 'ipCalculatorCard',
        category: 'network',
        keywords: 'ip calculator subnet subnet mask cidr usable ip network broadcast total ips 位址 計算器 網段 遮罩 可用IP 廣播位址 網路位址',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'text',
    label: '文字編輯',
    emoji: '✍️',
    tools: [
      {
        name: '文字處理助手',
        subtitle: 'TEXT PROCESSING UTILITY',
        description: '精緻且實用的文字排版助手。支援大小寫轉換、空白字元處理，並即時統計字元數、單字數、中文字數與總行數。',
        href: '/text-utility/',
        cardClass: 'textUtilityCard',
        category: 'text',
        keywords: '文字處理 轉大寫 轉小寫 刪除空白 字數統計 英文 中文 word count uppercase lowercase trim',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff007f]">
            <path d="M5 4v3h5v12h3V7h5V4H5zm11 7H9v2h7v-2z" />
          </svg>
        ),
      },
      {
        name: 'Designer QR Code 產生器',
        subtitle: 'DESIGNER QR CODE GENERATOR',
        description: '專業的藝術二維碼設計生成工具。支援碼體與定位點液態化自訂、霓虹漸層色調整、置中頭像/Logo 拖曳上傳與自動安全容錯防禦。',
        href: '/qr-generator/',
        cardClass: 'httpsDnsCard',
        category: 'text',
        keywords: 'qrcode qr code generator designer style gradient logo 產生器 二維碼 漸層 賽博綠',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm1 2h2v2h-2v-2zm-3 2h2v2h-2v-2zm3 2h2v2h-2v-2z" />
          </svg>
        ),
      },
      {
        name: '兩份文件比對工具',
        subtitle: 'DOCUMENT DIFF CHECKER',
        description: '極致安全的本地文本差異比對工具。支援左右雙窗格對齊（Split Mode）與 GitHub 混合比對（Unified Mode），純本機運算保障資安不外洩。',
        href: '/diff-checker/',
        cardClass: 'diffCheckerCard',
        category: 'text',
        keywords: 'diff checker document comparison text code comparison split unified jsdiff 比對 兩份文件 差異 減 增 變更 電光紫',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
            <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm9 0h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'utility',
    label: '實用小工具',
    emoji: '🔧',
    tools: [
      {
        name: '目標計時器',
        subtitle: 'TARGET TIMER',
        description: '唯美精緻的目標計時器，清楚顯示倒數與累計時間，支援多種時間顯示格式與自訂主題色。',
        href: '/time/',
        cardClass: 'httpsDnsCard',
        category: 'utility',
        keywords: '目標計時器 target timer 倒數 累計',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        ),
      },
      {
        name: 'Epoch 時間戳記轉換',
        subtitle: 'EPOCH TIMESTAMP CONVERTER',
        description: '專業的 Epoch Unix 時間戳記轉換工具，支援秒與毫秒自動判定，並即時在台北時間、UTC、美西時間（PST/PDT）及自訂時區之間進行雙向轉換，並附帶歷史轉換紀錄。',
        href: '/epoch/',
        cardClass: 'interestCard',
        category: 'utility',
        keywords: 'epoch unix 時間戳記 timestamp converter 時區 台北 utc pst',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff99]">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
        ),
      },
      {
        name: '幸運轉盤抽獎小工具',
        subtitle: 'LUCKY WHEEL SPINNER',
        description: '彈性、直覺且視覺效果豐富的轉盤抽獎工具。支援自訂獎項名稱、數量、權重比例與色彩，提供全螢幕舞台、物理緩動動畫、音效與中獎歷史紀錄。',
        href: '/lucky-wheel/',
        cardClass: 'interestCard',
        category: 'utility',
        keywords: '幸運轉盤 抽獎 小工具 lucky wheel prize raffle 全螢幕 權重 機率 音效 尾牙',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm0-15.86v2.06c-1.1 0-2 .9-2 2v1H9v-3c0-.55-.45-1-1-1H7.1c.91-1.31 2.36-2.28 4.05-2.62z" />
          </svg>
        ),
      },
      {
        name: '光影裁剪 - 萬能圖片處理大師',
        subtitle: 'UNIVERSAL IMAGE PROCESSOR',
        description: '精緻且功能齊全的圖片處理解決方案。支援 Cropper.js v2 視覺化裁切、自訂尺寸調整 (Resize)、jSquash 高速 WebAssembly 轉檔與壓縮品質調整，並支援多檔批次處理一鍵打包 ZIP 下載。',
        href: '/image-processor/',
        cardClass: 'jsonCard',
        category: 'utility',
        keywords: 'image processor crop resize compress jsquash cropper zip batch 圖片 裁切 尺寸 調整 壓縮 轉檔 批次',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#d946ef]">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        ),
      },
      {
        name: 'PDF 頁面組合器',
        subtitle: 'PDF PAGE COMPOSER',
        description: '強大且安全的純前端 PDF 處理神器。支援多檔 PDF 與圖片合併、拖曳頁面任意排序、單頁 90° 旋轉、頁面刪除與無失真匯出，100% 瀏覽器本機運算。',
        href: '/pdf-processor/',
        cardClass: 'carCard',
        category: 'utility',
        keywords: 'pdf processor page composer merge sort rotate delete pdf-lib pdfjs sortablejs 頁面組合器 合併 排序 旋轉 刪除 圖片轉檔 轉檔 珊瑚紅',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ef4444]">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
        ),
      },
      {
        name: 'PDF 壓縮大師',
        subtitle: 'PDF COMPRESSOR MASTER',
        description: '專針對 PDF 內嵌點陣圖進行深度壓縮與降採樣！100% 瀏覽器本地極速運算，保持原生文字與向量 100% 清晰可選取，達成 30%~80% 極致瘦身。',
        href: '/pdf-compressor/',
        cardClass: 'httpsDnsCard',
        category: 'utility',
        keywords: 'pdf compressor master image compression dpi quality pdf-lib pdfjs 壓縮大師 圖片壓縮 瘦身 降採樣 減小體積 零伺服器',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#eab308]">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        ),
      },
    ],
  },
];

// 展平後的全站工具清單
export const ALL_TOOLS: Tool[] = CATEGORIES.flatMap(cat => cat.tools);
