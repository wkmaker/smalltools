'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

// ── 工具資料定義 ──────────────────────────────────────────────

type Category = 'finance' | 'developer' | 'network' | 'text' | 'utility';
type Tab = 'all' | Category;

interface Tool {
  name: string;
  subtitle: string;
  description: string;
  href: string;
  cardClass: string;
  category: Category;
  keywords: string;
}

interface CategorySection {
  id: Category;
  label: string;
  emoji: string;
  tools: Tool[];
}

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z" />
  </svg>
);

const CATEGORIES: CategorySection[] = [
  {
    id: 'finance',
    label: '金融理財',
    emoji: '🏦',
    tools: [
      { name: '複利計算機', subtitle: 'COMPOUND INTEREST CALCULATOR', description: '精緻且專業的複利計算工具，支援年/月利率與定期定額，透過動態堆疊圖表直觀呈現財富增長軌跡。', href: '/compound-interest/', cardClass: 'interestCard', category: 'finance', keywords: '複利計算機 compound interest 定期定額 財富 增長' },
      { name: '信貸計算機', subtitle: 'PERSONAL LOAN CALCULATOR', description: '專業的個人信貸試算工具，支援本息/本金平均攤還與實質年利率 (APR) 估算，助您精準掌握還款明細與利息支出。', href: '/personal-loan/', cardClass: 'loanCard', category: 'finance', keywords: '信貸計算機 personal loan 本息均攤 本金均攤 實質年利率 apr 還款' },
      { name: '車貸計算機', subtitle: 'CAR LOAN CALCULATOR', description: '貼心的車貸試算工具，支援車價與自備款成數試算、寬限期設定，並提供詳細的月付金額與實質年利率分析。', href: '/car-loan/', cardClass: 'carCard', category: 'finance', keywords: '車貸計算機 car loan 自備款 寬限期 月付金 apr 還款' },
      { name: '房貸計算機', subtitle: 'MORTGAGE LOAN CALCULATOR', description: '專業的房貸試算工具，支援自備款與貸款成數雙向連動、寬限期試算、多段式階梯利率設定，並提供詳細的月付本息明細與實質年利率分析。', href: '/mortgage-loan/', cardClass: 'mortgageCard', category: 'finance', keywords: '房貸計算機 mortgage loan 自備款 寬限期 階梯利率 多段式利率 apr 還款' },
      { name: '股票質押與維持率壓力測試器', subtitle: 'STOCK PLEDGING & RISK CALCULATOR', description: '台股資產活化與槓桿風險管理利器。支援個股股價與張數雙向市值連動、自訂追繳門檻、大跌幅壓力測試模擬，並精確計算追繳臨界股價與安全回補保證金。', href: '/pledge-calculator/', cardClass: 'pledgeCard', category: 'finance', keywords: '股票質押 維持率 壓力測試 stock pledging risk calculator 追繳 臨界' },
      { name: '台股期貨槓桿與逆風點數估算器', subtitle: 'FUTURES MARGIN & LEVERAGE CALCULATOR', description: '期貨交易者風控防斷頭神器。即時計算大台/小台/微台實質資金槓桿倍數，並模擬逆風行情下之帳面損益、風控指標指針，以及追繳與強平臨界指數點數。', href: '/futures-calculator/', cardClass: 'futuresCard', category: 'finance', keywords: '台股期貨 槓桿 逆風 點數 futures margin leverage calculator 斷頭 追繳 臨界' },
      { name: '薪資、勞保、健保、預扣稅計算機', subtitle: 'SALARY & INSURANCES CALCULATOR', description: '精準且唯美的台灣薪資與保費試算工具。一鍵查表比對勞保、健保、勞退與預扣稅金額，清晰呈現員工薪資扣項明細與雇主總勞務營運成本。', href: '/my-salary-calculator/', cardClass: 'salaryCard', category: 'finance', keywords: '薪資與勞健保計算機 薪資 勞保 健保 勞退 實領薪水 雇主成本 salary calculator' },
    ],
  },
  {
    id: 'developer',
    label: '開發輔助',
    emoji: '💻',
    tools: [
      { name: 'Base64 編碼/解碼', subtitle: 'BASE64 ENCODER & DECODER', description: '精緻的 Base64 轉換工具，支援文字即時雙向編解碼（UTF-8 不亂碼）、檔案拖曳編碼與多媒體預覽，並可解碼還原下載。', href: '/base64/', cardClass: 'base64Card', category: 'developer', keywords: 'base64 編碼 解碼 encoder decoder 檔案 拖曳 轉換' },
      { name: 'URL 編碼/解碼', subtitle: 'URL ENCODER & DECODER', description: '專業的網址編解碼工具，支援 URI/URIComponent 模式，並具備強大的 Query 參數表格即時解析與雙向編輯功能。', href: '/url/', cardClass: 'urlCard', category: 'developer', keywords: 'url 編碼 解碼 encoder decoder query 參數 網址 轉換' },
      { name: '安全密碼生成器', subtitle: 'PASSWORD GENERATOR (CSPRNG)', description: '密碼學安全強隨機數密碼生成工具（CSPRNG），支援排除易混淆字元、強制每種字元分佈、即時強度評估與生成歷史記錄。', href: '/password/', cardClass: 'passwordCard', category: 'developer', keywords: '安全密碼生成器 password generator csprng 強度 隨機' },
      { name: 'JSON 格式化與美化器', subtitle: 'JSON FORMATTER & MINIFIER', description: '精緻且功能齊全的 JSON 處理小工具，支援即時語法 lint 驗證定位、多縮排格式美化、樹狀摺疊檢視與單行緊湊壓縮，並可拖曳檔案上傳與下載匯出。', href: '/json/', cardClass: 'jsonCard', category: 'developer', keywords: 'json 格式化 美化器 formatter minifier lint 驗證 壓縮' },
      { name: 'SSL 憑證格式轉換器', subtitle: 'SSL CERTIFICATE CONVERTER', description: '專業的安全 SSL 憑證格式轉換工具。支援 PFX/P12, PEM, DER 雙向轉換，具備私鑰/憑證金鑰雜湊匹配檢查與證書到期動態警示。', href: '/ssl-converter/', cardClass: 'sslConverterCard', category: 'developer', keywords: 'ssl certificate converter pfx p12 pem der key crt ca-bundle x509 pkcs12 憑證 格式 轉換 密鑰 雜湊' },
    ],
  },
  {
    id: 'network',
    label: '網路工具',
    emoji: '🌐',
    tools: [
      { name: 'DIG 網路診斷工具', subtitle: 'DNS DIG WEB TOOL', description: '工程師必備的線上 DNS 診斷工具。支援 Cloudflare / Google 加密 DoH 伺服器切換、網域/網址自動解析清理，即時發送 DIG 請求查詢 A, CNAME, MX, TXT 各項記錄。', href: '/dns-dig/', cardClass: 'digCard', category: 'network', keywords: 'dig 網路診斷工具 dns web tool cloudflare google doh 查詢' },
      { name: 'IP 檢測助手', subtitle: 'IP DIAGNOSTIC TOOL', description: '專業的網路與 IP 連線診斷工具。支援即時 IPv4/IPv6 雙棧偵測、Cloudflare 與 Mullvad 隱私節點查詢，以及公有雲服務連線延遲診斷。', href: '/ip-detector/', cardClass: 'digCard', category: 'network', keywords: 'ip detector diagnostic trace ping check ipv4 ipv6 cloudflare mullvad aws gcp azure apple 檢測 診斷 延遲' },
      { name: 'DNS HTTPS 紀錄設定產生器', subtitle: 'DNS HTTPS (TYPE 65) GENERATOR', description: '免費線上 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生器與對照指南。透過視覺化勾選與填空即時生成 ALPN、IP Hint 等參數，並提供各大 DNS 代管商 4 大欄位填寫教學。', href: '/https-dns-generator/', cardClass: 'httpsDnsCard', category: 'network', keywords: 'dns https record type 65 rfc 9460 svcb cloudflare route53 alpn ipv4hint ipv6hint 設定 產生器 教學' },
      { name: 'IP 子網段計算器', subtitle: 'IP SUBNET CALCULATOR', description: '快速計算 IPv4 / CIDR 的網段資訊，精確列出網路位址、廣播位址與可用 IP 位址列表與數量，支援大網段極速 TXT/CSV 下載。', href: '/ip-calculator/', cardClass: 'ipCalculatorCard', category: 'network', keywords: 'ip calculator subnet subnet mask cidr usable ip network broadcast total ips 位址 計算器 網段 遮罩 可用IP 廣播位址 網路位址' },
    ],
  },
  {
    id: 'text',
    label: '文字編輯',
    emoji: '✍️',
    tools: [
      { name: '文字處理助手', subtitle: 'TEXT PROCESSING UTILITY', description: '精緻且實用的文字排版助手。支援大小寫轉換、空白字元處理，並即時統計字元數、單字數、中文字數與總行數。', href: '/text-utility/', cardClass: 'textUtilityCard', category: 'text', keywords: '文字處理 轉大寫 轉小寫 刪除空白 字數統計 英文 中文 word count uppercase lowercase trim' },
      { name: 'Designer QR Code 產生器', subtitle: 'DESIGNER QR CODE GENERATOR', description: '專業的藝術二維碼設計生成工具。支援碼體與定位點液態化自訂、霓虹漸層色調整、置中頭像/Logo 拖曳上傳與自動安全容錯防禦。', href: '/qr-generator/', cardClass: 'httpsDnsCard', category: 'text', keywords: 'qrcode qr code generator designer style gradient logo 產生器 二維碼 漸層 賽博綠' },
      { name: '兩份文件比對工具', subtitle: 'DOCUMENT DIFF CHECKER', description: '極致安全的本地文本差異比對工具。支援左右雙窗格對齊（Split Mode）與 GitHub 混合比對（Unified Mode），純本機運算保障資安不外洩。', href: '/diff-checker/', cardClass: 'diffCheckerCard', category: 'text', keywords: 'diff checker document comparison text code comparison split unified jsdiff 比對 兩份文件 差異 減 增 變更 電光紫' },
    ],
  },
  {
    id: 'utility',
    label: '實用小工具',
    emoji: '🔧',
    tools: [
      { name: '目標計時器', subtitle: 'TARGET TIMER', description: '唯美精緻的目標計時器，清楚顯示倒數與累計時間，支援多種時間顯示格式與自訂主題色。', href: '/time/', cardClass: 'httpsDnsCard', category: 'utility', keywords: '目標計時器 target timer 倒數 累計' },
      { name: 'Epoch 時間戳記轉換', subtitle: 'EPOCH TIMESTAMP CONVERTER', description: '專業的 Epoch Unix 時間戳記轉換工具，支援秒與毫秒自動判定，並即時在台北時間、UTC、美西時間（PST/PDT）及自訂時區之間進行雙向轉換，並附帶歷史轉換紀錄。', href: '/epoch/', cardClass: 'interestCard', category: 'utility', keywords: 'epoch unix 時間戳記 timestamp converter 時區 台北 utc pst' },
      { name: '幸運轉盤抽獎小工具', subtitle: 'LUCKY WHEEL SPINNER', description: '彈性、直覺且視覺效果豐富的轉盤抽獎工具。支援自訂獎項名稱、數量、權重比例與色彩，提供全螢幕舞台、物理緩動動畫、音效與中獎歷史紀錄。', href: '/lucky-wheel/', cardClass: 'interestCard', category: 'utility', keywords: '幸運轉盤 抽獎 小工具 lucky wheel prize raffle 全螢幕 權重 機率 音效 尾牙' },
      { name: '光影裁剪 - 萬能圖片處理大師', subtitle: 'UNIVERSAL IMAGE PROCESSOR', description: '精緻且功能齊全的圖片處理解決方案。支援 Cropper.js v2 視覺化裁切、自訂尺寸調整 (Resize)、jSquash 高速 WebAssembly 轉檔與壓縮品質調整，並支援多檔批次處理一鍵打包 ZIP 下載。', href: '/image-processor/', cardClass: 'jsonCard', category: 'utility', keywords: 'image processor crop resize compress jsquash cropper zip batch 圖片 裁切 尺寸 調整 壓縮 轉檔 批次' },
      { name: 'PDF 頁面組合器', subtitle: 'PDF PAGE COMPOSER', description: '強大且安全的純前端 PDF 處理神器。支援多檔 PDF 與圖片合併、拖曳頁面任意排序、單頁 90° 旋轉、頁面刪除與無失真匯出，100% 瀏覽器本機運算。', href: '/pdf-processor/', cardClass: 'carCard', category: 'utility', keywords: 'pdf processor page composer merge sort rotate delete pdf-lib pdfjs sortablejs 頁面組合器 合併 排序 旋轉 刪除 圖片轉檔 轉檔 珊瑚紅' },
      { name: 'PDF 壓縮大師', subtitle: 'PDF COMPRESSOR MASTER', description: '專針對 PDF 內嵌點陣圖進行深度壓縮與降採樣！100% 瀏覽器本地極速運算，保持原生文字與向量 100% 清晰可選取，達成 30%~80% 極致瘦身。', href: '/pdf-compressor/', cardClass: 'httpsDnsCard', category: 'utility', keywords: 'pdf compressor master image compression dpi quality pdf-lib pdfjs 壓縮大師 圖片壓縮 瘦身 降採樣 減小體積 零伺服器' },
    ],
  },
];

const ALL_TABS: Tab[] = ['all', 'finance', 'developer', 'network', 'text', 'utility'];
const TAB_LABELS: Record<Tab, string> = {
  all: '全部工具', finance: '金融理財', developer: '開發輔助',
  network: '網路工具', text: '文字編輯', utility: '實用小工具',
};

const schemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '工具庫',
  url: 'https://tools.cjkuo.net/',
  description: '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具。',
};

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cat = searchParams.get('category') as Tab | null;
    const q = searchParams.get('search') || '';
    if (cat && ALL_TABS.includes(cat)) setActiveTab(cat);
    setSearchQuery(q);
    if (searchInputRef.current) searchInputRef.current.value = q;
  }, [searchParams]);

  const syncURL = useCallback((tab: Tab, q: string, immediate = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const update = () => {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('category', tab);
      if (q) params.set('search', q);
      const url = params.toString() ? `/?${params.toString()}` : '/';
      router.replace(url, { scroll: false });
    };
    if (immediate) update();
    else debounceRef.current = setTimeout(update, 300);
  }, [router]);

  const isToolVisible = useCallback((tool: Tool, sectionId: Category, q: string, tab: Tab): boolean => {
    if (tab !== 'all' && sectionId !== tab) return false;
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      tool.name.toLowerCase().includes(lower) ||
      tool.description.toLowerCase().includes(lower) ||
      tool.keywords.toLowerCase().includes(lower)
    );
  }, []);

  const handleTabClick = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    syncURL(tab, searchQuery, true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    syncURL(activeTab, q);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.value = '';
    syncURL(activeTab, '', true);
    searchInputRef.current?.focus();
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    (e.currentTarget as HTMLElement).style.setProperty('--x', `${e.clientX - rect.left}px`);
    (e.currentTarget as HTMLElement).style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  let totalVisible = 0;
  CATEGORIES.forEach(s => s.tools.forEach(t => { if (isToolVisible(t, s.id, searchQuery, activeTab)) totalVisible++; }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }} />

      <div className={styles.homeContainer}>
        <h1 className={styles.homeTitle}>工具庫</h1>
        <div className={styles.subtitleTop}>MY TOOLBOX</div>
        <p className={styles.pageDescription}>
          免費、無廣告、精緻的線上工具庫。涵蓋房貸/信貸/車貸計算機、JSON格式化、Base64/URL編碼解碼、
          密碼生成器、SSL憑證轉換、DNS診斷等 20+ 開發與理財工具，免下載即用。
        </p>

        {/* 搜尋與 Tab 控制面板 */}
        <div className={styles.controlPanel}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜尋工具... (e.g. loan, json, base64)"
              autoComplete="off"
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={handleSearchClear} title="清除搜尋">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.tabGroup}>
            {ALL_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* 分類區段 */}
        {CATEGORIES.map(section => {
          const visibleTools = section.tools.filter(t => isToolVisible(t, section.id, searchQuery, activeTab));
          if (visibleTools.length === 0) return null;

          return (
            <div key={section.id} className={styles.categorySection} data-section={section.id}>
              <h2 className={styles.sectionTitle}>
                {section.emoji} {section.label}
              </h2>

              <div className={styles.toolsGrid}>
                {visibleTools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`${styles.toolCard} ${styles[tool.cardClass] || ''}`}
                    onMouseMove={handleCardMouseMove}
                  >
                    <div>
                      <h3>{tool.name}</h3>
                      <span className={styles.subtitle}>{tool.subtitle}</span>
                      <p>{tool.description}</p>
                    </div>
                    <div className={styles.cardAction}>
                      開啟工具 {ARROW_SVG}
                    </div>
                  </Link>
                ))}

                {section.id === 'utility' && activeTab === 'all' && !searchQuery && (
                  <div className={`${styles.toolCard} ${styles.placeholderCard}`} onMouseMove={handleCardMouseMove}>
                    <div>
                      <h3>敬請期待</h3>
                      <span className={styles.subtitle}>COMING SOON</span>
                      <p>更多實用、唯美的工具正在開發中，敬請期待下一次的更新與功能推出。</p>
                    </div>
                    <div className={styles.cardAction}>規劃中</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {totalVisible === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 w-full py-16 text-text-sub">
            <p className="text-lg">沒有找到符合的工具，請嘗試其他關鍵字</p>
          </div>
        )}

        <div className="text-center mt-14 pt-6 border-t border-white/[.05] text-sm text-text-sub w-full">
          Powered by{' '}
          <a href="https://www.cjkuo.net/" target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] font-medium no-underline hover:text-white">
            CJKuo
          </a>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-text-sub">載入中...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
