import { ReactNode } from 'react';

export type Category = 'finance' | 'workplace' | 'developer' | 'network' | 'media' | 'utility';

export interface Tool {
  name: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  description: string;
  descriptionEn: string;
  href: string;
  hrefEn: string;
  cardClass: string;
  category: Category;
  keywords: string;
  keywordsEn: string;
  svg: ReactNode;
}

export interface CategorySection {
  id: Category;
  label: string;
  labelEn: string;
  emoji: string;
  tools: Tool[];
}

export const CATEGORIES: CategorySection[] = [
  {
    id: 'finance',
    label: '金融理財',
    labelEn: 'Finance & Wealth',
    emoji: '🏦',
    tools: [
      {
        name: '複利計算機',
        nameEn: 'Compound Interest Calculator',
        subtitle: 'COMPOUND INTEREST CALCULATOR',
        subtitleEn: 'COMPOUND INTEREST CALCULATOR',
        description: '精緻且專業的複利計算工具，支援年/月利率與定期定額，透過動態堆疊圖表直觀呈現財富增長軌跡。',
        descriptionEn: 'Professional compound interest calculator supporting annual/monthly rates and recurring deposits, visually illustrating wealth growth with dynamic stacked charts.',
        href: '/compound-interest/',
        hrefEn: '/compound-interest/en/',
        cardClass: 'interestCard',
        category: 'finance',
        keywords: '複利計算機 compound interest 定期定額 財富 增長',
        keywordsEn: 'compound interest calculator recurring deposits investment wealth growth',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
          </svg>
        ),
      },
      {
        name: '信貸計算機',
        nameEn: 'Personal Loan Calculator',
        subtitle: 'PERSONAL LOAN CALCULATOR',
        subtitleEn: 'PERSONAL LOAN CALCULATOR',
        description: '專業的個人信貸試算工具，支援本息/本金平均攤還與實質年利率 (APR) 估算，助您精準掌握還款明細與利息支出。',
        descriptionEn: 'Professional personal loan calculator supporting equal principal/equal installment amortizations and APR estimation to manage payment schedules and interest costs.',
        href: '/personal-loan/',
        hrefEn: '/personal-loan/en/',
        cardClass: 'loanCard',
        category: 'finance',
        keywords: '信貸計算機 personal loan 本息均攤 本金均攤 實質年利率 apr 還款',
        keywordsEn: 'personal loan calculator apr equal installment principal amortization payment',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        ),
      },
      {
        name: '車貸計算機',
        nameEn: 'Car Loan Calculator',
        subtitle: 'CAR LOAN CALCULATOR',
        subtitleEn: 'CAR LOAN CALCULATOR',
        description: '貼心的車貸試算工具，支援車價與自備款成數試算、寬限期設定，並提供詳細的月付金額與實質年利率分析。',
        descriptionEn: 'Intuitive auto loan calculator supporting down payment ratios, grace periods, and providing detailed monthly payment and APR analysis.',
        href: '/car-loan/',
        hrefEn: '/car-loan/en/',
        cardClass: 'carCard',
        category: 'finance',
        keywords: '車貸計算機 car loan 自備款 寬限期 月付金 apr 還款',
        keywordsEn: 'car loan calculator auto loan down payment grace period apr monthly installment',
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
        nameEn: 'Mortgage Loan Calculator',
        subtitle: 'MORTGAGE LOAN CALCULATOR',
        subtitleEn: 'MORTGAGE LOAN CALCULATOR',
        description: '專業的房貸試算工具，支援自備款與貸款成數雙向連動、寬限期試算、多段式階梯利率設定，並提供詳細的月付本息明細與實質年利率分析。',
        descriptionEn: 'Professional mortgage calculator supporting down payment ratios, grace periods, multi-tier interest rates, and detailed monthly amortization breakdown.',
        href: '/mortgage-loan/',
        hrefEn: '/mortgage-loan/en/',
        cardClass: 'mortgageCard',
        category: 'finance',
        keywords: '房貸計算機 mortgage loan 自備款 寬限期 階梯利率 多段式利率 apr 還款',
        keywordsEn: 'mortgage loan calculator home loan grace period multi-tier interest rate apr',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ffaa]">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        ),
      },
      {
        name: '股票質押與維持率壓力測試器',
        nameEn: 'Stock Pledging & Risk Calculator',
        subtitle: 'STOCK PLEDGING & RISK CALCULATOR',
        subtitleEn: 'STOCK PLEDGING & RISK CALCULATOR',
        description: '台股資產活化與槓桿風險管理利器。支援個股股價與張數雙向市值連動、自訂追繳門檻、大跌幅壓力測試模擬，並精確計算追繳臨界股價與安全回補保證金。',
        descriptionEn: 'Stock collateralized loan & risk management simulator. Calculate margin maintenance ratios, simulate market crash stress tests, and determine margin call thresholds.',
        href: '/pledge-calculator/',
        hrefEn: '/pledge-calculator/en/',
        cardClass: 'pledgeCard',
        category: 'finance',
        keywords: '股票質押 維持率 壓力測試 stock pledging risk calculator 追繳 臨界',
        keywordsEn: 'stock pledging loan risk calculator maintenance ratio margin call stress test',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#eab308]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
        ),
      },
      {
        name: '台股期貨槓桿與逆風點數估算器',
        nameEn: 'Futures Margin & Leverage Calculator',
        subtitle: 'FUTURES MARGIN & LEVERAGE CALCULATOR',
        subtitleEn: 'FUTURES MARGIN & LEVERAGE CALCULATOR',
        description: '期貨交易者風控防斷頭神器。即時計算大台/小台/微台實質資金槓桿倍數，並模擬逆風行情下之帳面損益、風控指標指針，以及追繳與強平臨界指數點數。',
        descriptionEn: 'Essential risk control tool for futures traders. Calculate leverage ratios, simulate drawdown losses, and pinpoint margin call & liquidation price points.',
        href: '/futures-calculator/',
        hrefEn: '/futures-calculator/en/',
        cardClass: 'futuresCard',
        category: 'finance',
        keywords: '台股期貨 槓桿 逆風 點數 futures margin leverage calculator 斷頭 追繳 臨界',
        keywordsEn: 'futures calculator margin leverage liquidation margin call risk management',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff5252]">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 15.66z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'workplace',
    label: '職場與生活',
    labelEn: 'Workplace & Life',
    emoji: '💼',
    tools: [
      {
        name: '薪資、勞保、健保、預扣稅計算機',
        nameEn: 'Salary, Tax & Insurance Calculator',
        subtitle: 'SALARY & INSURANCES CALCULATOR',
        subtitleEn: 'SALARY & INSURANCES CALCULATOR',
        description: '精準且唯美的台灣薪資與保費試算工具。一鍵查表比對勞保、健保、勞退與預扣稅金額，清晰呈現員工薪資扣項明細與雇主總勞務營運成本。',
        descriptionEn: 'Precise Taiwan salary and social insurance calculator. Look up labor insurance, health insurance, pension, and withholding tax with transparent breakdown.',
        href: '/my-salary-calculator/',
        hrefEn: '/my-salary-calculator/en/',
        cardClass: 'salaryCard',
        category: 'workplace',
        keywords: '薪資與勞健保計算機 薪資 勞保 健保 勞退 實領薪水 雇主成本 salary calculator',
        keywordsEn: 'salary calculator taiwan labor insurance health insurance pension net take-home pay',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        ),
      },
      {
        name: '真實時薪計算器',
        nameEn: 'Real Hourly Rate Calculator',
        subtitle: 'REAL HOURLY RATE CALCULATOR',
        subtitleEn: 'REAL HOURLY RATE CALCULATOR',
        description: '扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益，並對照全台打工人薪資 PR 排行榜。',
        descriptionEn: 'Deduct commute hours, unpaid overtime, and hidden work expenses to calculate your true hourly earnings and benchmark against salary percentiles.',
        href: '/hourly-rate-calculator/',
        hrefEn: '/hourly-rate-calculator/en/',
        cardClass: 'hourlyRateCard',
        category: 'workplace',
        keywords: '真實時薪計算器 hourly rate calculator 時薪 最低時薪 PR 排行 通勤 加班',
        keywordsEn: 'real hourly rate calculator true wage commute overtime salary percentile benchmark',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
          </svg>
        ),
      },
      {
        name: '離職時間與預告期計算機',
        nameEn: 'Resignation & Notice Period Calculator',
        subtitle: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
        subtitleEn: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
        description: '依台灣勞基法第 16 條精準計算法定預告天數、離職生效日、最後在職日與特休排休/折現試算。並可一鍵產生離職預告通知範本。',
        descriptionEn: 'Calculate statutory notice periods, effective resignation dates, and annual leave encashment under Taiwan Labor Standards Act with one-click notice templates.',
        href: '/resignation-calculator/',
        hrefEn: '/resignation-calculator/en/',
        cardClass: 'resignationCard',
        category: 'workplace',
        keywords: '離職計算機 離職預告期 勞基法第16條 離職生效日 最後在職日 特休折現 離職預告範本 謀職假 resignation calculator',
        keywordsEn: 'resignation calculator notice period labor standards act last working day leave encashment',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        ),
      },
      {
        name: '孕期與產檢假計算機',
        nameEn: 'Pregnancy & Maternity Leave Calculator',
        subtitle: 'PREGNANCY & MATERNITY LEAVE',
        subtitleEn: 'PREGNANCY & MATERNITY LEAVE',
        description: '專業精準的孕產時程規劃工具。支援最後月經 (LMP)、預產期 (EDD)、超音波與試管植入推算，精算 40 週產檢里程碑、胎兒成長尺寸，並整合台灣勞基法試算 8 天產檢假、8 週產假、育嬰留停 8 成薪與勞保生育給付。',
        descriptionEn: 'Professional timeline planner for pregnancy and prenatal care. Calculate 40-week milestones, statutory prenatal leave, 8-week maternity leave, and childcare allowance.',
        href: '/pregnancy-calculator/',
        hrefEn: '/pregnancy-calculator/en/',
        cardClass: 'pregnancyCard',
        category: 'workplace',
        keywords: '孕期計算機 預產期計算 產檢假 產假 育嬰留停津貼 勞保生育給付 高層次超音波 唐氏症 懷孕週數 待產包 pregnancy due date maternity',
        keywordsEn: 'pregnancy calculator due date prenatal leave maternity leave childcare allowance milestones',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff4081]">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'developer',
    label: '開發輔助',
    labelEn: 'Developer Tools',
    emoji: '💻',
    tools: [
      {
        name: 'Base64 編碼/解碼',
        nameEn: 'Base64 Encoder & Decoder',
        subtitle: 'BASE64 ENCODER & DECODER',
        subtitleEn: 'BASE64 ENCODER & DECODER',
        description: '精緻的 Base64 轉換工具，支援文字即時雙向編解碼（UTF-8 不亂碼）、檔案拖曳編碼與多媒體預覽，並可解碼還原下載。',
        descriptionEn: 'Fast Base64 converter with UTF-8 support, file drag-and-drop encoding, multimedia preview, and instant binary file download.',
        href: '/base64/',
        hrefEn: '/base64/en/',
        cardClass: 'base64Card',
        category: 'developer',
        keywords: 'base64 編碼 解碼 encoder decoder 檔案 拖曳 轉換',
        keywordsEn: 'base64 encoder decoder utf8 file drag drop converter data uri',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
        ),
      },
      {
        name: 'URL 編碼/解碼',
        nameEn: 'URL Encoder & Decoder',
        subtitle: 'URL ENCODER & DECODER',
        subtitleEn: 'URL ENCODER & DECODER',
        description: '專業的網址編解碼工具，支援 URI/URIComponent 模式，並具備強大的 Query 參數表格即時解析與雙向編輯功能。',
        descriptionEn: 'Professional URL encoder/decoder supporting URI/URIComponent modes, real-time query parameter parsing, and interactive visual table editing.',
        href: '/url/',
        hrefEn: '/url/en/',
        cardClass: 'urlCard',
        category: 'developer',
        keywords: 'url 編碼 解碼 encoder decoder query 參數 網址 轉換',
        keywordsEn: 'url encoder decoder uri component query params parse encode decode',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#6366f1]">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        ),
      },
      {
        name: '安全密碼生成器',
        nameEn: 'Secure Password Generator',
        subtitle: 'PASSWORD GENERATOR (CSPRNG)',
        subtitleEn: 'PASSWORD GENERATOR (CSPRNG)',
        description: '密碼學安全強隨機數密碼生成工具（CSPRNG），支援排除易混淆字元、強制每種字元分佈、即時強度評估與生成歷史記錄。',
        descriptionEn: 'Cryptographically secure random password generator (CSPRNG) with character exclusion, entropy strength evaluation, and generation history.',
        href: '/password/',
        hrefEn: '/password/en/',
        cardClass: 'passwordCard',
        category: 'developer',
        keywords: '安全密碼生成器 password generator csprng 強度 隨機',
        keywordsEn: 'password generator csprng secure random entropy strength history',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
        ),
      },
      {
        name: 'JSON 格式化與美化器',
        nameEn: 'JSON Formatter & Minifier',
        subtitle: 'JSON FORMATTER & MINIFIER',
        subtitleEn: 'JSON FORMATTER & MINIFIER',
        description: '精緻且功能齊全的 JSON 處理小工具，支援即時語法 lint 驗證定位、多縮排格式美化、樹狀摺疊檢視與單行緊湊壓縮，並可拖曳檔案上傳與下載匯出。',
        descriptionEn: 'Clean JSON utility featuring syntax linting, error line highlight, tree view folding, compact minification, and file drag-and-drop export.',
        href: '/json/',
        hrefEn: '/json/en/',
        cardClass: 'jsonCard',
        category: 'developer',
        keywords: 'json 格式化 美化器 formatter minifier lint 驗證 壓縮',
        keywordsEn: 'json formatter minifier beautifier lint tree view parser validate',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff00aa]">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
        ),
      },
      {
        name: 'SSL 憑證格式轉換器',
        nameEn: 'SSL Certificate Converter',
        subtitle: 'SSL CERTIFICATE CONVERTER',
        subtitleEn: 'SSL CERTIFICATE CONVERTER',
        description: '專業的安全 SSL 憑證格式轉換工具。支援 PFX/P12, PEM, DER 雙向轉換，具備私鑰/憑證金鑰雜湊匹配檢查與證書到期動態警示。',
        descriptionEn: 'Secure SSL certificate format converter. Convert between PFX/P12, PEM, and DER with private key hash matching and expiration alerts.',
        href: '/ssl-converter/',
        hrefEn: '/ssl-converter/en/',
        cardClass: 'sslConverterCard',
        category: 'developer',
        keywords: 'ssl certificate converter pfx p12 pem der key crt ca-bundle x509 pkcs12 憑證 格式 轉換 密鑰 雜湊',
        keywordsEn: 'ssl certificate converter pfx p12 pem der x509 crt key pkcs12',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ffaa]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z" />
          </svg>
        ),
      },
      {
        name: 'HAR 敏感資料清理工具',
        nameEn: 'HAR Sanitizer & Privacy Cleaner',
        subtitle: 'HAR SANITIZER & PRIVACY CLEANER',
        subtitleEn: 'HAR SANITIZER & PRIVACY CLEANER',
        description: '專業純前端 HAR 封包脫敏與瘦身神器！一鍵清除 Cookie、授權 Token、JWT、API 密鑰與敏感個資，並可自動刪除肥大二進位媒體酬載，100% 本機運算守護資安。',
        descriptionEn: 'Zero-server client-side HAR desensitization tool. Strip cookies, auth tokens, JWT, API keys, and bloated binary payloads with 100% local privacy.',
        href: '/har-cleaner/',
        hrefEn: '/har-cleaner/en/',
        cardClass: 'harCleanerCard',
        category: 'developer',
        keywords: 'har cleaner sanitizer privacy cookie token jwt api key redacted 敏感資料 脫敏 封包 清理 瘦身',
        keywordsEn: 'har cleaner sanitizer privacy cookie token jwt api key redact security',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#06b6d4]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        ),
      },
      {
        name: 'Epoch 時間戳記轉換',
        nameEn: 'Epoch Timestamp Converter',
        subtitle: 'EPOCH TIMESTAMP CONVERTER',
        subtitleEn: 'EPOCH TIMESTAMP CONVERTER',
        description: '專業的 Epoch Unix 時間戳記轉換工具，支援秒與毫秒自動判定，並即時在台北時間、UTC、美西時間（PST/PDT）及自訂時區之間進行雙向轉換，並附帶歷史轉換紀錄。',
        descriptionEn: 'Epoch Unix timestamp converter with auto second/millisecond detection and bi-directional conversion between Taipei, UTC, and US Pacific (PST/PDT) times.',
        href: '/epoch/',
        hrefEn: '/epoch/en/',
        cardClass: 'epochCard',
        category: 'developer',
        keywords: 'epoch unix 時間戳記 timestamp converter 時區 台北 utc pst 開發',
        keywordsEn: 'epoch unix timestamp converter timezone utc pst pdt datetime',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'network',
    label: '網路維運',
    labelEn: 'Network & DevOps',
    emoji: '🌐',
    tools: [
      {
        name: 'DIG 網路診斷工具',
        nameEn: 'DNS DIG Web Tool',
        subtitle: 'DNS DIG WEB TOOL',
        subtitleEn: 'DNS DIG WEB TOOL',
        description: '工程師必備的線上 DNS 診斷工具。支援 Cloudflare / Google 加密 DoH 伺服器切換、網域/網址自動解析清理，即時發送 DIG 請求查詢 A, CNAME, MX, TXT 各項記錄。',
        descriptionEn: 'Online DNS diagnostic tool powered by encrypted DNS over HTTPS (DoH) from Cloudflare & Google. Query A, CNAME, MX, TXT, and NS records instantly.',
        href: '/dns-dig/',
        hrefEn: '/dns-dig/en/',
        cardClass: 'digCard',
        category: 'network',
        keywords: 'dig 網路診斷工具 dns web tool cloudflare google doh 查詢',
        keywordsEn: 'dns dig web tool doh cloudflare google doh lookup dns records',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-2h6v2h-6zm-10-7l3.5-3.5L7 10l-2.5 2.5L2 10l2.5-2.5L3 6l-3.5 3.5L3 13z" />
          </svg>
        ),
      },
      {
        name: 'IP 檢測助手',
        nameEn: 'IP & Connection Diagnostic Tool',
        subtitle: 'IP DIAGNOSTIC TOOL',
        subtitleEn: 'IP DIAGNOSTIC TOOL',
        description: '專業的網路與 IP 連線診斷工具。支援即時 IPv4/IPv6 雙棧偵測、Cloudflare 與 Mullvad 隱私節點查詢，以及公有雲服務連線延遲診斷。',
        descriptionEn: 'Dual-stack IPv4/IPv6 detection, privacy node check via Cloudflare & Mullvad, and latency benchmarks to major public cloud providers.',
        href: '/ip-detector/',
        hrefEn: '/ip-detector/en/',
        cardClass: 'ipDetectorCard',
        category: 'network',
        keywords: 'ip detector diagnostic trace ping check ipv4 ipv6 cloudflare mullvad aws gcp azure apple 檢測 診斷 延遲',
        keywordsEn: 'ip detector diagnostic trace ping check ipv4 ipv6 cloudflare latency',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        ),
      },
      {
        name: 'DNS HTTPS 紀錄設定產生器',
        nameEn: 'DNS HTTPS Record Generator',
        subtitle: 'DNS HTTPS (TYPE 65) GENERATOR',
        subtitleEn: 'DNS HTTPS (TYPE 65) GENERATOR',
        description: '免費線上 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生器與對照指南。透過視覺化勾選與填空即時生成 ALPN、IP Hint 等參數，並提供各大 DNS 代管商 4 大欄位填寫教學。',
        descriptionEn: 'Online DNS HTTPS (Type 65 / RFC 9460) record builder. Visually generate ALPN and IP Hint parameters with step-by-step provider config tutorials.',
        href: '/https-dns-generator/',
        hrefEn: '/https-dns-generator/en/',
        cardClass: 'httpsDnsCard',
        category: 'network',
        keywords: 'dns https record type 65 rfc 9460 svcb cloudflare route53 alpn ipv4hint ipv6hint 設定 產生器 教學',
        keywordsEn: 'dns https record type 65 rfc 9460 svcb alpn ipv4hint ipv6hint generator',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#6366f1]">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z" />
          </svg>
        ),
      },
      {
        name: 'IP 子網段計算器',
        nameEn: 'IP Subnet Calculator',
        subtitle: 'IP SUBNET CALCULATOR',
        subtitleEn: 'IP SUBNET CALCULATOR',
        description: '快速計算 IPv4 / CIDR 的網段資訊，精確列出網路位址、廣播位址與可用 IP 位址列表與數量，支援大網段極速 TXT/CSV 下載。',
        descriptionEn: 'Fast IPv4 CIDR subnet calculator. List network address, broadcast address, and usable IP ranges with high-speed TXT/CSV export.',
        href: '/ip-calculator/',
        hrefEn: '/ip-calculator/en/',
        cardClass: 'ipCalculatorCard',
        category: 'network',
        keywords: 'ip calculator subnet subnet mask cidr usable ip network broadcast total ips 位址 計算器 網段 遮罩 可用IP 廣播位址 網路位址',
        keywordsEn: 'ip subnet calculator cidr subnet mask usable ip broadcast network range',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#a3e635]">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'media',
    label: '圖片與文件',
    labelEn: 'Images & Documents',
    emoji: '📄',
    tools: [
      {
        name: '光影裁剪 - 萬能圖片處理大師',
        nameEn: 'Universal Image Processor',
        subtitle: 'UNIVERSAL IMAGE PROCESSOR',
        subtitleEn: 'UNIVERSAL IMAGE PROCESSOR',
        description: '精緻且功能齊全的圖片處理解決方案。支援 Cropper.js v2 視覺化裁切、自訂尺寸調整 (Resize)、jSquash 高速 WebAssembly 轉檔與壓縮品質調整，並支援多檔批次處理一鍵打包 ZIP 下載。',
        descriptionEn: 'Complete client-side image processing suite. Cropper.js visual cropping, resize, jSquash WebAssembly compression, and multi-file batch ZIP download.',
        href: '/image-processor/',
        hrefEn: '/image-processor/en/',
        cardClass: 'imageProcessorCard',
        category: 'media',
        keywords: 'image processor crop resize compress jsquash cropper zip batch 圖片 裁切 尺寸 調整 壓縮 轉檔 批次',
        keywordsEn: 'image processor crop resize compress jsquash wasm batch zip',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#d946ef]">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        ),
      },
      {
        name: 'PDF 頁面組合器',
        nameEn: 'PDF Page Composer',
        subtitle: 'PDF PAGE COMPOSER',
        subtitleEn: 'PDF PAGE COMPOSER',
        description: '強大且安全的純前端 PDF 處理神器。支援多檔 PDF 與圖片合併、拖曳頁面任意排序、單頁 90° 旋轉、頁面刪除與無失真匯出，100% 瀏覽器本機運算。',
        descriptionEn: 'Secure client-side PDF utility. Merge multiple PDFs & images, drag-and-drop page reordering, 90-degree rotation, page deletion, and lossless export.',
        href: '/pdf-processor/',
        hrefEn: '/pdf-processor/en/',
        cardClass: 'pdfProcessorCard',
        category: 'media',
        keywords: 'pdf processor page composer merge sort rotate delete pdf-lib pdfjs sortablejs 頁面組合器 合併 排序 旋轉 刪除 圖片轉檔 轉檔 珊瑚紅',
        keywordsEn: 'pdf processor page composer merge sort rotate delete pdf-lib client side',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
        ),
      },
      {
        name: 'PDF 壓縮大師',
        nameEn: 'PDF Compressor Master',
        subtitle: 'PDF COMPRESSOR MASTER',
        subtitleEn: 'PDF COMPRESSOR MASTER',
        description: '專針對 PDF 內嵌點陣圖進行深度壓縮與降採樣！100% 瀏覽器本地極速運算，保持原生文字與向量 100% 清晰可選取，達成 30%~80% 極致瘦身。',
        descriptionEn: 'Deep bitmap compression and downsampling for PDFs. 100% local in-browser processing while preserving crisp native vector text, saving 30%-80% size.',
        href: '/pdf-compressor/',
        hrefEn: '/pdf-compressor/en/',
        cardClass: 'httpsDnsCard',
        category: 'media',
        keywords: 'pdf compressor master image compression dpi quality pdf-lib pdfjs 壓縮大師 圖片壓縮 瘦身 降採樣 減小體積 零伺服器',
        keywordsEn: 'pdf compressor master image compression dpi downsampling shrink pdf local',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#eab308]">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        ),
      },
      {
        name: '兩份文件比對工具',
        nameEn: 'Document Diff Checker',
        subtitle: 'DOCUMENT DIFF CHECKER',
        subtitleEn: 'DOCUMENT DIFF CHECKER',
        description: '極致安全的本地文本差異比對工具。支援左右雙窗格對齊（Split Mode）與 GitHub 混合比對（Unified Mode），純本機運算保障資安不外洩。',
        descriptionEn: 'Secure text and code comparison tool. Supports side-by-side split view and unified diff modes with 100% local processing to keep your data safe.',
        href: '/diff-checker/',
        hrefEn: '/diff-checker/en/',
        cardClass: 'diffCheckerCard',
        category: 'media',
        keywords: 'diff checker document comparison text code comparison split unified jsdiff 比對 兩份文件 差異 減 增 變更 電光紫',
        keywordsEn: 'diff checker document comparison text code split unified jsdiff local',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
            <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm9 0h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
        ),
      },
      {
        name: '文字處理助手',
        nameEn: 'Text Processing Utility',
        subtitle: 'TEXT PROCESSING UTILITY',
        subtitleEn: 'TEXT PROCESSING UTILITY',
        description: '精緻且實用的文字排版助手。支援大小寫轉換、空白字元處理，並即時統計字元數、單字數、中文字數與總行數。',
        descriptionEn: 'Practical text formatting helper. Case conversion, whitespace trimming, and real-time word, character, Chinese character, and line counts.',
        href: '/text-utility/',
        hrefEn: '/text-utility/en/',
        cardClass: 'textUtilityCard',
        category: 'media',
        keywords: '文字處理 轉大寫 轉小寫 刪除空白 字數統計 英文 中文 word count uppercase lowercase trim',
        keywordsEn: 'text utility case convert uppercase lowercase word count trim lines',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff007f]">
            <path d="M5 4v3h5v12h3V7h5V4H5zm11 7H9v2h7v-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'utility',
    label: '生活娛樂',
    labelEn: 'Life & Utilities',
    emoji: '🎲',
    tools: [
      {
        name: 'Designer QR Code 產生器',
        nameEn: 'Designer QR Code Generator',
        subtitle: 'DESIGNER QR CODE GENERATOR',
        subtitleEn: 'DESIGNER QR CODE GENERATOR',
        description: '專業的藝術二維碼設計生成工具。支援碼體與定位點液態化自訂、霓虹漸層色調整、置中頭像/Logo 拖曳上傳與自動安全容錯防禦。',
        descriptionEn: 'Artistic QR code creator with custom liquid shapes, eye styling, neon gradients, centered avatar/logo drag-and-drop, and high error correction.',
        href: '/qr-generator/',
        hrefEn: '/qr-generator/en/',
        cardClass: 'qrCard',
        category: 'utility',
        keywords: 'qrcode qr code generator designer style gradient logo 產生器 二維碼 漸層 賽博綠',
        keywordsEn: 'qr code generator designer style neon gradient custom logo avatar',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm1 2h2v2h-2v-2zm-3 2h2v2h-2v-2zm3 2h2v2h-2v-2z" />
          </svg>
        ),
      },
      {
        name: '目標計時器',
        nameEn: 'Target Timer',
        subtitle: 'TARGET TIMER',
        subtitleEn: 'TARGET TIMER',
        description: '唯美精緻的目標計時器，清楚顯示倒數與累計時間，支援多種時間顯示格式與自訂主題色。',
        descriptionEn: 'Clean target timer displaying countdown and elapsed time, supporting multiple formatting styles, presets, and customized themes.',
        href: '/time/',
        hrefEn: '/time/en/',
        cardClass: 'timerCard',
        category: 'utility',
        keywords: '目標計時器 target timer 倒數 累計 時鐘',
        keywordsEn: 'target timer countdown stopwatch clock pomodoro',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        ),
      },
      {
        name: '幸運轉盤抽獎小工具',
        nameEn: 'Lucky Wheel Spinner',
        subtitle: 'LUCKY WHEEL SPINNER',
        subtitleEn: 'LUCKY WHEEL SPINNER',
        description: '彈性、直覺且視覺效果豐富的轉盤抽獎工具。支援自訂獎項名稱、數量、權重比例與色彩，提供全螢幕舞台、物理緩動動畫、音效與中獎歷史紀錄。',
        descriptionEn: 'Customizable lucky prize wheel. Set custom item weights, colors, full-screen stage mode, physics easing animation, sound effects, and winner history.',
        href: '/lucky-wheel/',
        hrefEn: '/lucky-wheel/en/',
        cardClass: 'luckyWheelCard',
        category: 'utility',
        keywords: '幸運轉盤 抽獎 小工具 lucky wheel prize raffle 全螢幕 權重 機率 音效 尾牙',
        keywordsEn: 'lucky wheel spinner prize raffle random picker party game sound',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm0-15.86v2.06c-1.1 0-2 .9-2 2v1H9v-3c0-.55-.45-1-1-1H7.1c.91-1.31 2.36-2.28 4.05-2.62z" />
          </svg>
        ),
      },
      {
        name: '吹牛骰子搖骰器',
        nameEn: "Liar's Dice Roller",
        subtitle: "LIAR'S DICE ROLLER",
        subtitleEn: "LIAR'S DICE ROLLER",
        description: '專為派對酒吧吹牛遊戲打造！具備防作弊計時器（精確顯示距離上次搖骰過了多久）與歷史 5 次紀錄，支援搖骰音效與杯蓋遮擋。',
        descriptionEn: "Party game dice roller designed for Liar's Dice. Features an anti-cheat timer (elapsed time since last roll), 5-roll history, sound effects, and cup cover.",
        href: '/liars-dice/',
        hrefEn: '/liars-dice/en/',
        cardClass: 'interestCard',
        category: 'utility',
        keywords: '吹牛骰子 搖骰器 吹牛 骰子 防作弊 計時器 酒吧遊戲 派對遊戲 liars dice anti cheat timer',
        keywordsEn: 'liars dice roller anti cheat timer party game bar game dice shake',
        svg: (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
          </svg>
        ),
      },
    ],
  },
];

// 展平後的全站工具清單
export const ALL_TOOLS: Tool[] = CATEGORIES.flatMap(cat => cat.tools);
