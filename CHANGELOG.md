# 更新日誌 (Changelog)

本專案遵循 [Semantic Versioning (語意化版本 2.0.0)](https://semver.org/lang/zh-TW/) 與 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

---

## [1.9.0] - 2026-09-11

### 🔧 變更 (Changed)

- **金融試算全面改用 BigNumber.js 定點數，並抽離為無副作用純函數引擎**：
  8 支金融 / 職場工具（複利、信貸、車貸、房貸、股票質押、台指期、薪資勞健保、
  真實時薪）原本在 `*Client.tsx` 內以原生浮點運算子累加金額，長攤還迴圈會累積
  分位以下誤差、且散見 `Math.round(x + 1e-9)` 之類的修正 hack（違反全域鐵則 5、6）。
  - 每支工具的計算邏輯抽離至 `app/[tool]/engine.ts`（薪資與時薪併入既有
    `salaryConfig.ts` / `utils.ts`），全部金額加減乘除改走 `bignumber.js` 鏈式運算，
    UI 顯示前才落地為 `number`（鐵則 9 領域邏輯與 UI 分層）。
  - 新增共用模組 `app/utils/decimal.ts`（BigNumber 全域組態與換算入口）與
    `app/utils/finance.ts`（APR 二分求解：折現因子逐期遞乘、收斂提前結束）。
  - 業務層級數值（元、APR%、投保級距金額）與重構前完全一致；僅修正原本
    浮點累加造成的分位以下漂移。
- **日期敏感工具抽離純函數引擎並修正時區地雷**：離職預告期（`resignation-calculator`）
  與孕期試算（`pregnancy-calculator`）原本在 `*Client.tsx` 內以 `new Date('YYYY-MM-DD')`
  解析純日期字串（UTC 解析，UTC+8 以外時區會退一天，違反鐵則 7、8），且約 200 行
  日期計算內嵌於元件本體。
  - 新增 `app/resignation-calculator/engine.ts`（勞基法第 16 / 38 條預告與特休、
    正反向推算、逾期判定、特休折現、謀職假）與 `app/pregnancy-calculator/engine.ts`
    （LMP / EDD / 超音波 / IVF 四模式 EDD 推算、CRL Hadlock 換算、當前週數、
    產假 56 天區間與勞保生育給付 / 育嬰津貼）。
  - 日期字串一律以 `parseYmd` 依「本地零時」建構；`today` 可注入以利測試；
    孕期津貼金額改走 BigNumber.js。
- **`tsconfig.json`**：開啟 `allowImportingTsExtensions`，引擎以 `.ts` 副檔名互相引入，
  供 Node 原生 `node:test` 直接載入 TypeScript。
- **正規化全站 29 支原始碼檔案的換行符**：既有檔案含殘留 lone CR（`\r\r\n`），
  Git 判定為二進位、任何一行修改都產生整檔 diff；統一收斂為乾淨 CRLF
  （`git diff --ignore-all-space` 驗證零內容變動）。
- **`.gitignore`**：新增 `tsconfig.tsbuildinfo`（TS 增量建置快取，改為不追蹤）。

### ✨ 新增功能 (Added)

- **`npm run test:engine` 引擎單元測試套件**（`node:test`，73 項）：涵蓋各金融引擎的
  歷期攤還表、總額、APR、投保級距與稅額（對「凍結的浮點基準演算法」批次交叉驗證，
  確保定點數改寫在整數元層級零回歸），以及離職 / 孕期引擎的法定天數級距、日期
  推算與時區安全。併入 `npm test` 與 `prebuild` 阻斷關卡。

### 📦 依賴 (Dependencies)

- 新增 `bignumber.js` `^9`。

---

## [1.8.2] - 2026-09-11

### 🔧 變更 (Changed)

- **建置工具鏈改用 ESLint Flat Config**：Next 16 已移除 `next lint`（原 `npm run lint` 靜默失效、回傳退出碼 0），改新增 `eslint.config.mjs`（`eslint-config-next/core-web-vitals` 原生扁平設定），`npm run lint` 改為 `eslint .`。`eslint` 暫鎖 `^9`：`eslint-config-next@16.3` 內建的 `eslint-plugin-react` 尚未相容 ESLint 10（`context.getFilename` 已移除會直接 crash）。
- **`app/sitemap.ts` 改為註冊表推導**：所有工具 URL 一律由中央工具註冊表 `app/config/tools.tsx`（`ALL_TOOLS`）衍生，`lastModified` 取建置當下時間；移除原先逐條手工維護的 64 筆網址與早已過期的固定日期。新增工具不再需要同步改 sitemap。
- **CI／部署 Node.js 由 22 升至 24**（`.github/workflows/deploy.yml`），並於 `package.json` 補上 `engines.node >= 22`。
- **依賴升級**：`next` / `eslint-config-next` `16.3.0 → 16.3.4`、`react` / `react-dom` `19.2 → 19.3`、`@types/react` / `@types/react-dom` `→ 19.3`、`@types/node` `26 → 24`（對齊部署 runtime 大版本）。`typescript` 維持 `6.x`（7.x 發布未滿觀察期）。升級後 `npm audit` 由 2 項（1 high、1 critical）降為 0。
- **`tests/audit-seo.mjs`**：sitemap 涵蓋率檢查改為驗證「工具是否登記於中央註冊表 `app/config/tools.tsx`」，配合上述 sitemap 重構。
- **Lint 現存告警**：啟用 lint 後尚有 56 條 warning（絕大多數為 `'use client'` 工具頁於 `useEffect` 內同步 `window` / `localStorage` / 動態 `import` 狀態，即 `isMountedRef` 既有慣例）。已將 `eslint-plugin-react-hooks` v7 新增的 React Compiler 建議規則（`set-state-in-effect`、`immutability`）降為 warning，並關閉不適用於靜態匯出的 `@next/next/no-img-element`；`eslint .` 現為 0 error，不阻斷 CI。

### 🐛 修復 (Fixed)

- **`/.well-known/security.txt` 404**：該檔先前置於專案根目錄 `.well-known/` 而非 `public/`，`output: 'export'` 靜態匯出未包含，導致檔案自身宣告的 `Canonical: https://tools.cjkuo.net/.well-known/security.txt` 實際無法存取（違反 RFC 9116）。已移至 `public/.well-known/security.txt`。
- 移除專案根目錄未被部署流程使用的重複 `robots.txt` 與 `security.txt`（實際服務的為 `public/robots.txt`）。
- 修正 `react/no-unescaped-entities`（JSON 樹狀檢視的引號、時薪計算機資料來源標註）與 4 支 UI 規範測試模組（`tests/ui-rules/*.mjs`）的匿名預設匯出。

---

## [1.8.1] - 2026-09-10

### 🐛 修復 (Fixed)

- **首頁 (`/`)**：修復手機版右上角功能按鈕組（搜尋、語言、亮暗模式）因絕對定位脫離文件流、而 `.homeContainer` 在 `max-width: 600px` 斷點的頂部內距不足，導致按鈕與「工具庫」主標題重疊、遮住標題文字的問題。將手機版容器頂部內距由 `2.5rem` 提高至 `5rem`，讓按鈕組完整位於標題上方。

---

## [1.8.0] - 2026-08-25

### ✨ 新增功能 (Added)

- **全新上線：Open Graph (OG) 社群封面圖片產生器 (`/og-generator/`)**：
  - **4 大專業設計模板**：現代極簡 (Modern Minimal)、科技光流 (Cyber Glow)、雜誌專欄 (Split Showcase) 與醒目大字 (Bold Impact)。
  - **純前端極速 Canvas 2D 渲染引擎**：無後端延遲、零個資隱私洩漏風險，支援純前端 2x 視網膜 (Retina) 超高清採樣輸出。
  - **多社群長寬比一鍵自適應重排**：標準 OG (1200×630)、Twitter 16:9 (1200×675)、Square 1:1 (1080×1080)、Stories / Mobile 9:16 (1080×1920) 與 LinkedIn Post (1200×627)。
  - **多格式高速匯出**：支援 PNG（無損清晰）、JPEG（高壓縮）、WebP（現代網頁）與 SVG（向量封裝）一鍵下載，以及直接複製圖片至系統剪貼簿。
  - **高畫質 Lightbox 大圖檢視視窗**：點擊畫布即刻透過 React Portal 呼叫高解析度全螢幕檢視彈窗，支援 ESC 鍵與彈窗內直接複製/下載。
  - **主題配色與自訂雙模色彩**：提供 6 大雙語主題色、支援雙色線性漸層與單色純底切換、Hex 色碼鍵盤直接輸入與 8 款發光 Accent 快捷色票。
  - **高度自由媒體自訂**：支援自訂 Logo/頭像上傳（外框形狀與尺寸自訂，具備自動留白防貼邊安全距離）、自訂特色背景圖上傳（可調節不透明度與模糊度）或自由一鍵關閉。
  - **4 組雙語實用預設範例 (Presets)**：技術專欄、產品發表、開發日誌與社群快訊，預設輸入值全面深度在地化。
  - **雙語中英文路由與 6 組深度 FAQ 結構化資料 (`FAQPage` JSON-LD)**。

### 🏗️ 架構與工程規範 (Architecture & Standards)

- **大型複雜工具 6 大模組化拆分架構**：`types.ts`、`constants.ts`、`translations.ts`、`canvasRenderer.ts`、`exportHelpers.ts`、`OgGeneratorClient.tsx`。
- **專屬自動化測試套件**：建立 `tests/test-og-translations.mjs` 與 `tests/test-og-constants.mjs`，並整合至 `npm run test` CI 管線。
- **更新專案 3 大開發標準技能文件 (SKILLS)**：`smalltools-i18n-seo`（ToolLayout 共用頂欄規範、繁中純淨在地化）、`smalltools-dev-architecture`（大型工具模組化拆分與測試標準）、`smalltools-code-standards`（色彩輸入雙模交互標準、Canvas 排版留白）。

---

## [1.7.1] - 2026-08-23

### 🐛 修復與功能增強 (Fixed & Enhanced)

- **PDF 頁面組合器 (`/pdf-processor/`)**：
  - **全新 300 DPI 所見即所得 (WYSIWYG) 雙軌匯出引擎**：徹底解決多檔案合併時因註解層（`/Annots`）、電子簽名、公文印章、表單欄位（AcroForm）或掃描器 CropBox 裁切框偏移導致部分頁面匯出後變空白的問題。以出版級 300 DPI 超高清畫質（A4 達 2480×3508 像素）完整捕獲預覽圖層，保證「預覽看到什麼，下載出來就 100% 是什麼」。
  - **介面新增雙軌引擎切換**：控制列提供「300 DPI 所見即所得（推薦・防空白頁）」與「原生向量模式（保留文字選取）」供使用者自由切換。
  - **標準 A4 點數尺寸對齊**：精確校準嵌入頁面之 PDF 點數尺寸（`595.28 × 841.89 pt`），確保在任何 PDF 閱讀器中開啟或實體列印皆為 100% 標準 A4 紙張大小。
  - **修復 ArrayBuffer 記憶體 Detached 問題**：修復在傳遞二進位緩衝區至 PDF.js Web Worker 進行預覽拆解時，因瀏覽器 Transferable Objects 機制導致主執行緒 State 中 ArrayBuffer 被轉移清空（Detached Buffer），造成後續點擊「匯出合併 PDF」拋出 `TypeError: Cannot perform Construct on a detached ArrayBuffer` 且下載無反應之問題。
  - **增強頁面旋轉相容性**：優化無 `/Rotate` 標籤頁面的旋轉角度解析防呆邏輯。

- **SSL 憑證格式轉換器 (`/ssl-converter/`)**：
  - **AIA 中繼憑證下載連結自動升級 HTTPS**：自動將 X.509 憑證擴充欄位中解析出的 `Authority Information Access` (AIA) 官方 CA 下載網址從 `http://` 重寫升級為 `https://`。
  - **解決 Mixed Content 阻擋**：徹底解決現代瀏覽器在 HTTPS 頁面下因混合內容（Mixed Content）安全政策而靜默阻擋非安全 HTTP 檔案下載的問題。

- **社群分享與 SEO 升級**：
  - 為 13 款熱門工具量身生成專屬 3D 毛玻璃科技風 OpenGraph (OG) 預覽圖，並以極小體積的 WebP 格式（50~80KB）全面取代通用圖檔。
  - 同步更新中英文共 26 個路由頁面之 `openGraph.images` 與 `twitter.images` Metadata。

---

## [1.7.0] - 2026-08-23

### ✨ 新增功能 (Added)

- **全新上線：Google Calendar ICS 切割助手 (`/calendar-split/`)**：
  - 專為解決匯入日曆遭遇「處理您的要求時發生錯誤，請稍後再試」與 1MB / 1,500 筆事件限制打造。
  - 支援智慧分卷切割（依事件筆數或檔案大小 MB）、按年份（Yearly）歸檔切割、按活動類別（Categories/Tags）自動分類。
  - 提供日曆健康診斷（遞迴重複事件、遺失 UID / DTSTAMP 自動補齊）、純前端 ZIP 壓縮打包。
- **全站 30 個工具 + 首頁頂欄三合一控制列統一重構 (`ToolLayout`)**：
  - 將全站頂欄統一整合為「主題切換（亮/暗/系統）」、「語系切換（中/英）」、「☕ 請我喝咖啡（贊助彈窗）」三合一控制組。
  - 統一支援 Command Palette（`⌘K` / `Ctrl+K`）快速搜尋導航、ESC 鍵與滑鼠點擊遮罩關閉。

---

## [1.6.0] - 2026-08-23

### ✨ 新增功能 (Added)

- **全站工具清單重構與分流融合 (Fusion)**：
  - 重構首頁工具卡片分類網格，劃分「文字處理」、「圖片視覺」、「開發輔助」、「網路維運」、「金融理財」與「職場生活」六大專屬領域。
  - 修復全站 Canonical URL 與多語言 Alternate hreflang 標籤。

---

## [1.5.0] - 2026-08-22

### ✨ 新增功能 (Added)

- **全新上線：英文版官方首頁 (`/en/`)**：
  - 提供全站 30+ 款實用工具之英文版分類導航與搜尋入口。
- **全新上線：HAR 敏感資訊清理器 (`/har-cleaner/`)**：
  - 純前端過濾 HTTP Archive (HAR) 檔案中的 Authorization Bearer Token、Cookie、API Keys 與敏感個資。

---

## [1.4.0] - 2026-08-22

### 🔍 最佳化 (Optimized)

- **全站工具深度 SEO 與 FAQ 結構化資料庫 (Schema.org)**：
  - 為全站 31 款工具的中英文頁面全面導入專業 FAQ 結構化資料 (`FAQPage` JSON-LD)。
  - 新增全自動化測試腳本：`npm run test:seo`、`npm run test:faq` 與 `npm run test:ui`，保障 CI/CD 品質。

---

## [1.3.0] - 2026-08-20

### ✨ 新增功能 (Added)

- **全新上線：產假與育嬰留停津貼計算機 (`/pregnancy-calculator/`)**：
  - 支援台灣勞基法 8 週全薪產假、產檢假、陪產檢及陪產假、8 成薪育嬰留職停薪津貼精準試算。

---

## [1.2.0] - 2026-08-14

### 🎨 最佳化 (Optimized)

- **UI 規範與無障礙對比度單元測試系統**：
  - 建立全站色彩對比度檢查機制，確保所有組件在亮色與暗色模式下均具備清晰可讀性。

---

## [1.1.0] - 2026-08-11

### 🛠️ 改善 (Changed)

- **SSL 憑證工具深度優化**：增強 PKCS#12 (PFX/P12) 3DES 與 AES 解密支援、公鑰 Modulus 雜湊比對。
- **URL 編碼解碼器**：支援查詢參數深度解析（Query Params Breakdown）。

---

## [1.0.0] - 2026-08-01

### 🎉 初版發布 (Initial Release)

- **Smalltools 實用線上工具箱正式上線**：
  - 支援全站亮色/暗色（Light/Dark）自適應模式切換。
  - 100% 純前端瀏覽器記憶體運算（Zero-Server Architecture），徹底杜絕資料外洩風險。
