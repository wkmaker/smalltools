---
name: toolbox-design-standards
description: 適用於小型工具庫（smalltools）Next.js App Router 與 Tailwind v4 架構的毛玻璃 UI 風格規範、核心開發大原則與編碼細節規範。
---

# 工具庫專案 UI/UX 設計與 Next.js / Tailwind v4 開發規範

本文件為「Smalltools 工具庫專案」的專屬 Skill 指南。全站已全域移轉至 **Next.js App Router + Tailwind v4 (CSS-first 模式) + React 18+** 架構。在開發、修改或重構任何小工具時，必須嚴格遵守以下視覺美學、核心開發原則與編碼細節，以確保專案的一體性與頂級使用者體驗。

---

## 一、 視覺與設計美學標準 (Aesthetics Standards)

1. **毛玻璃擬物化 (Glassmorphism) 與語意化 Token (Semantic Tokens)**
   * **背景與模糊**：主要玻璃容器統一使用 `ToolLayout` 元件，套用 Tailwind v4 語意化背景 `bg-surface-glass` (連動 `--glass-bg`)，搭配 `backdrop-blur-[12px]` 與 `-webkit-backdrop-filter: blur(12px)`。
   * **細緻邊框與陰影**：邊框採用語意化類別 `border-border-glass` (連動 `--card-border`)，陰影採用 `shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]`。
   * **文字語意類別**：主要標題統一採用 `text-text-main` (連動 `--text-primary`)，次要說明與標籤採用 `text-text-sub` (連動 `--text-secondary`)。全站嚴禁在組件中硬編碼寫死色標，以利未來雙向切換亮暗主題。

2. **配色與主題霓虹發光 (Neon Theme Colors)**
   * **全站極黑背景**：使用純極黑 `#030305`，凸顯半透明玻璃與發光元素。
   * **工具主題色定義**：
     - **倒數計時 / 網路診斷 / DNS HTTPS 產生器**：科技冰藍 `#00f0ff` (`rgba(0,240,255,0.6)`)
     - **複利計算機 / 股票質押 / 金融理財**：財富金黃 `#ffb800` (`rgba(255,184,0,0.6)`)
     - **信貸試算 / 房貸試算 / 薪資算薪水**：薄荷翡翠綠 `#00f5a0` (`rgba(0,245,160,0.6)`)
     - **安全密碼 / QR Code 產生器**：賽博極光綠 `#00ff66` (`rgba(0,255,102,0.6)`)
     - **Epoch 時間戳記**：極客綠 `#00ff99` (`rgba(0,255,153,0.6)`)
     - **SSL 憑證轉換器**：亮翠綠 `#00ffaa` (`rgba(0,255,170,0.6)`)
     - **文件比對 (Diff Checker) / DNS DIG 查詢**：紫羅蘭色 `#8b5cf6` (`rgba(139,92,246,0.6)`)
     - **萬能圖片處理大師**：霓虹桃粉 `#d946ef` (`rgba(217,70,239,0.6)`)
     - **車貸計算器 / 期貨槓桿計算機**：霓虹紅 / 赤紅 `#ff3b30` (`rgba(255,59,48,0.6)`)
     - **PDF 頁面組合器**：經典紅 `#ef4444` (`rgba(239,68,68,0.6)`)
     - **PDF 壓縮大師**：耀眼黃 `#eab308` (`rgba(234,179,8,0.6)`)
     - **Base64 處理器**：活力橘 `#ff7300` (`rgba(255,115,0,0.6)`)
     - **JSON 格式化**：霓虹粉桃 `#ff00aa` (`rgba(255,0,170,0.6)`)
     - **文字處理助手**：霓虹粉紅 `#ff007f` (`rgba(255,0,127,0.6)`)
   * **互動狀態**：輸入框聚焦 (`focus:border-[var(--theme-color)]`) 與按鈕懸停 (`hover:shadow-[0_0_15px_var(--theme-color)]`) 時，必須亮起對應主題色的發光與陰影。

3. **`ToolLayout` 全站共用外框規範**
   * 所有工具頁面統一引用 `app/components/ToolLayout.tsx` 作為最外層容器。
   * 必須傳入 `title` (中文大寫)、`subtitle` (英文大寫)、`description` (說明段落)、`accentColor` (主題色) 與 `accentGlow` (發光色)。
   * **呼吸留白 (Breathing Room)**：容器寬度維持 `max-w-[90%]`（電腦版），標題下方自帶發光橫線與漸層。

4. **背景粒子與動態主題連動 (Dynamic Particle Canvas)**
   * 客戶端組件 (`[ToolName]Client.tsx`) 在 `useEffect` 掛載時，必須動態寫入主題色至 `:root`（變數名稱必須嚴格為 `--theme-color` 與 `--accent-glow`，不可帶有動態語法例如 `--theme-[#8b5cf6]`）：
     ```typescript
     useEffect(() => {
       document.documentElement.style.setProperty('--theme-color', '#ff0055');
       document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 85, 0.6)');
     }, []);
     ```
5. **向量 SVG 圖示替代 Emoji 規範 (SVG Icons over Emojis)**
   * **禁用系統預設 Emoji 作為 UI 主要 Icon**：嚴禁在按鈕、區塊標題、上傳 Dropzone、標籤或控制介面中直接使用 OS 原生 Emoji（如 ⚙️, 📄, 📑, 📦, ⚡）。原生 Emoji 在不同作業系統 (Windows, macOS, iOS, Android) 渲染樣式極度不一且無法縮放色標，破壞毛玻璃極簡美學。
   * **採用極量向量 Inline SVG**：介面圖示一律採用精簡原生 Inline SVG 或 Lucide/Heroicons 規格 SVG，保持零額外套件負載與極速渲染。
   * **主題色動態連動與發光 (Theme-aware SVG)**：SVG 之 `fill` 或 `stroke` 屬性統一採用 `currentColor`（或連動主題色 `text-[#ef4444]` / `text-[var(--theme-color)]`），確保在懸停 (hover) 與聚焦 (focus) 時能精準發光。

---

## 二、 核心架構與效能開發大原則 (Core Architecture & Performance Principles)

1. **Next.js App Router 檔案組織結構規範**
   * **`app/[tool-name]/page.tsx`**：伺服器端渲染 (SSR)。配置 `Metadata`（包含 `alternates.canonical` 設定為 `https://tools.cjkuo.net/[tool-name]/`）、OpenGraph、Twitter Card 與 Schema.org JSON-LD 結構化資料。
   * **`app/[tool-name]/[ToolName]Client.tsx`**：客戶端渲染 (`'use client'`)。負責 UI 狀態、事件處理、動態計算、Canvas 繪製與 URL 雙向同步。
   * **`app/[tool-name]/[tool-name].module.css`**：放置工具專屬的 CSS Module 樣式（如 Sticky 明細欄、專屬 Toggle 按鈕）。

2. **歷史紀錄初始載入與「呼吸留白」原則 (Breathing Room)**
   * 頁面初次載入時，試算看板需即時呈現在畫面上，但**歷史紀錄區塊（若有）預設必須保持隱藏 (空陣列)**。
   * **嚴禁在初次掛載的 `useEffect` 中將初始生成結果推送進歷史陣列**，必須僅在使用者手動點擊「重新生成/計算」按鈕時才紀錄舊資料，確保頁面剛開啟時右側保有超過 60% 的清爽留白。

3. **網址參數雙向狀態連動與防呆解析原則**
   * **正向連動（無感更新網址）**：嚴禁使用 `window.location.href`。必須使用 `window.history.replaceState(null, '', '?' + params.toString())` 更新網址。打字輸入時使用 300ms 防抖更新，切換按鈕即時同步。
   * **反向解析與安全 Fallback**：讀取 `window.location.search` 時，必須使用 `safeParse` 或防呆校驗。若參數非法或超出邊界，必須安全回退至預設值，絕不能導致 React Hydration 崩潰。

4. **高負載運算與大檔案處理的「預覽與導出分離」原則**
   * 執行運算密集任務時（如高解析圖片處理、大檔 Base64 轉換），參數調整時進行低解析度降級預覽 (更新 < 100ms)。僅在點擊「下載」或「匯出」時執行 JIT 高負載真實運算並展現 Loading 狀態。

5. **高頻重繪 UI 的「GPU 加速與動畫幀節流」原則**
   * 隨游標拖曳或頻繁變更的 DOM 樣式，使用 CSS `will-change: transform` 與 `transform: translateZ(0)` 創建獨立 GPU 圖層。將樣式更新放入 `requestAnimationFrame` 進行節流。

6. **靜態資產與 `output: 'export'` 靜態導出規範**
   * 所有靜態圖片與根目錄資產（`support.svg`、`img/`、`robots.txt`、`security.txt`）必須統一存放於 `public/` 目錄，確保 Next.js 編譯導出時 100% 複製至 `out/`。
   * `app/layout.tsx` 必須配置 `metadataBase: new URL('https://tools.cjkuo.net')`，使相對路徑（如 `/support.svg`）自動轉換為完整絕對 URL，確保 OpenGraph 與 Twitter Cards 預覽正確。

7. **舊版 HTML 歸檔規範 (Legacy Archiving)**
   * 重構完成的舊版獨立 HTML/CSS/JS 資料夾統一歸檔至根目錄 `legacy/`，維護專案根目錄純淨。

8. **多語言 (i18n) 路由與雙語切換設計規範**
   * **路由與目錄命名**：
     - 預設語系 (繁體中文)：`app/[tool-name]/page.tsx`
     - 英文語系：`app/[tool-name]/en/page.tsx`
     - 共享 Client 組件：`app/[tool-name]/[ToolName]Client.tsx`，接收 `lang?: 'zh-TW' | 'en'` 屬性傳入。
   * **SEO Metadata & Hreflang 宣告**：
     在語系頁面的 `metadata.alternates` 必須配置 `languages` 對照，確保搜尋引擎抓取：
     ```typescript
     alternates: {
       canonical: 'https://tools.cjkuo.net/[tool-name]/',
       languages: {
         'zh-TW': 'https://tools.cjkuo.net/[tool-name]/',
         en: 'https://tools.cjkuo.net/[tool-name]/en/',
       },
     }
     ```
   * **介面無縫切換鈕**：在 Client 試算面板右上方放置雙語切換開關，以 Next.js `<Link>` 連結至對應網址，並連動切換組件內部文案語系。

9. **Next.js App Router 靜態 Sitemap 生成與 AWS 部署避坑規範 (Sitemap & AWS Deployment)**
   * **`app/sitemap.ts` 原生動態生成**：全站統一採用 App Router 原生 `app/sitemap.ts` 定義 `MetadataRoute.Sitemap`。當執行 `next build` 進行靜態導出 (`output: 'export'`) 時，Next.js 會自動於 `out/sitemap.xml` 產出對應的 XML。
   * **必須顯式宣告靜態導出 (`export const dynamic = 'force-static'`)**：在 `app/sitemap.ts` 檔案頂層**必須顯式加入 `export const dynamic = 'force-static';`**。若未宣告，Next.js 在 `output: export` 靜態導出模式下執行 `next build` 會拋出 `/sitemap.xml` 路由未設置靜態導出而中斷編譯的錯誤。
   * **Sitemap 網址規範化 (Canonical URL)**：搭配 `trailingSlash: true`，Sitemap 內的所有 `<loc>` 網址必須採用目錄結尾斜線（如 `https://tools.cjkuo.net/time/`），嚴禁帶有 `/index.html`，以符合 SEO 規範網址。
   * **清理 `public/` 重複檔案**：啟用 `app/sitemap.ts` 後，需確認 `public/sitemap.xml` 及根目錄 `sitemap.xml` 已刪除，避免編譯時靜態資源覆蓋 Next.js 自動生成之 `sitemap.xml`。
   * **AWS 託管與相容性**：部署至 AWS S3 (開啟 Index document: `index.html`) 或搭配 CloudFront Rewrite 時，無檔名目錄路徑（`/time/`）即可自動對應至 `time/index.html`，無需於 Sitemap 標註副檔名。

---

## 三、 Tailwind v4 樣式與編碼細節規範 (Tailwind v4 & Code Details)

1. **Tailwind v4 CSS-First 與 Cascade Layer 避坑原則 (CRITICAL)**
   * 專案採用 Tailwind v4 `@import 'tailwindcss';` 與 `@theme` 宣告。
   * **全域 Reset 禁忌**：**嚴禁在 CSS 頂層撰寫 unlayered 全域重設（如 `*, ::before, ::after { margin: 0; padding: 0; }`）**。在 Tailwind v4 的 Cascade Layers 機制中，未宣告 Layer 的頂層重設權重高於 Utilities Layer，會導致全站 `.p-8`、`.p-6` 等 Utility padding 被強制歸零並引發「文字貼邊死擠」Bug。所有全域重設必須包裹於 `@layer base { ... }` 內。

2. **W3C 無障礙標籤對應與 React `useId()` 規範**
   * 所有表單控制項之 `<label>` 必須設置 `htmlFor={inputId}`，且對應的 `<input>` 必須宣告 `id={inputId}`。
   * 為防範 SSR 與 React Client Hydration 時產生 ID 不一致警告，必須統一使用 React 的 `useId()` 鉤子生成唯一元素 ID：
     ```typescript
     const carPriceInputId = useId();
     ```
   * **`<label>` 語意嚴格性防錯**：`<label>` 必須且只能搭配具備對應 `id` 的輸入控制項（如 `<input>`、`<select>`、`<textarea>`）。若區域僅為標籤標題、按鈕組（如多選模式切換、預設 Preset 按鈕、Checkbox 列表），**嚴禁使用 `<label>` 包裹無 `id` 的區塊**，否則會破壞 DOM accessibility 樹。應統一改用 `<span>` 或 `<legend>`，並配置適當字色 `text-text-sub`。

3. **行動端防撐寬與手機版 Sticky 橫向滾動表格**
   * **防止強行撐開**：Grid Item 或結果區塊必須設定 `min-width: 0`。
   * **手機版橫向滾動容器**：`width: 100%; max-width: 100%; overflow-x: auto;`。
   * **首欄凍結與重疊防護**：表格最左側凍結欄（如「期數」）必須於 CSS Module 配置：
     ```css
     .stickyPeriod {
       position: sticky;
       left: 0;
       background-color: var(--card-bg-solid, #0b0b0e) !important;
       color: var(--text-primary) !important;
       z-index: 5;
       box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
     }
     ```
     確保橫向滑動時右側數據不會與凍結欄文字重疊。
   * **表格標頭與數據字級**：還款明細表、數據統計表之標頭 (`<thead> <th>`) 與列數據 (`<tbody> <td>`) 一律採用 14px (`text-sm`) 標註，確保數據可讀性。

4. **輸入控制項與格式化細節**
   * **隱藏預設 Number Spinners**：`app/globals.css` 已內建隱藏 `input[type='number']` 之上下箭頭。
   * **活動輸入框格式化**：僅對使用者正在打字的活動輸入框 (active input) 修正游標定位 `setSelectionRange`，連動欄位由程式動態格式化。

5. **下拉選單與日期時間選擇器暗色系與語意 Token 支援**
   * 所有 `<select>` 與 `<option>` 控制項背景統一套用語意類別 **`bg-select-bg`**（連動 `--select-bg`）與文字 `var(--text-primary)`，全站嚴禁在組件中硬編碼寫死 `#121218` 色值，防止瀏覽器預設白底白字或主題切換失效。
   * 日期與時間輸入框 `input[type="date"]` 與 `input[type="datetime-local"]` 必須強制宣告 **`[color-scheme:dark]`**（例如在 Tailwind 類別寫入 `[color-scheme:dark]`），確保 Chrome / Edge 等瀏覽器彈出的原生 Date/Time Picker 呈現暗色系並保持標示可讀性。

6. **金融/計算工具求解標準 (APR Bisection Solver)**
   * 凡包含手續費/開辦費攤提之貸款試算，必須提供實質年利率 (APR) 試算。採用 **二分搜尋法 (Bisection Method)** 求解折現淨現值 (NPV = 0) 之內含報酬率 (IRR)。
   * 本息/本金均攤模擬計算時，最後一期期末餘額需手動強制設定為 `0`，消弭 JS 底層浮點數殘留誤差。

7. **Windows UTF-8 編碼保護避坑原則**
   * 在 Windows 環境下避免使用 PowerShell 預設管道（如 `Get-Content | Set-Content`），防止將 TypeScript/JSX 中的繁體中文字串轉為 ANSI/OEM 亂碼 (`?`)。必須確保所有原始碼檔案儲存為無 BOM 之 UTF-8 編碼。

8. **全站字體可讀性與視覺高對比度規範 (Typography & Accessibility)**
   * **Form Label 高對比度與字級**：表單標籤禁止使用過暗之 Slate-400 (`text-[#94a3b8]`) 或過小字體 (`text-xs` / 12px)。統一升級採用語意化類別 **`text-sm font-medium text-text-sub`** (14px)，符合 WCAG 2.1 行動端可讀性標準與 Google Mobile SEO 規範。
   * **指標看板標題醒目化 (Stat Card Titles)**：核心數據或統計看板之卡片標題（如「首期月付額」、「實質年利率」、「總還款金額」、「總字元數」等）一律採用 **`text-sm font-semibold text-text-sub`** (14px 粗體醒目化)，嚴禁使用 12px 微縮字級。
   * **模式切換與功能按鈕 (Toggle Buttons & Tabs)**：模式切換鈕、語系切換鈕及快捷操作按鈕，一律統一升級為 **14px (`text-sm font-semibold` / `font-medium`)**，以提升行動端點擊觸碰範圍與視覺識別度。
   * **描述文案與次要備註**：頁面描述文案採用 **16px (`text-base text-text-sub`)** 最佳閱讀字級；次要備註與對應級距小字說明至少保持 **12px (`text-xs text-text-sub`)**，避免使用 10~11px 過小微縮字體。

9. **`number | ''` 輸入框狀態型態與清空防卡 0 原則 (Clean Input State Pattern)**
   * 表單輸入框 state 狀態型態統一宣告為 `number | ''`（例如 `const [amount, setAmount] = useState<number | ''>(50000)`）。
   * 當使用者全選刪除文字時，state 設為 `''`，輸入框維持乾淨清空狀態（不會強行補 `0` 在最前面）。
   * 於計算邏輯中防呆轉譯為 `0`：`const numAmount = amount === '' ? 0 : amount;`，避免產生 `NaN` 錯誤。

10. **舊版 JSON 資料檔完整性與動態選單擴充原則 (JSON Configuration & Dynamic Dropdown)**
    * 包含多年份法規級距或扣繳大表（如勞健保/所得稅扣繳稅額表）的小工具，必須將原始 JSON 設定檔拷貝至 `app/[tool-name]/config/` 與 `public/[tool-name]/config/`，並於模組中直接導入，保證算薪與試算數據與官方 100% 精準對照無偏差。
    * 適用年份或法規版本選擇器統一使用深色下拉選單 (`<select>`)，並與 `SUPPORTED_YEARS` 降冪陣列動態連動。未來新增新年份 JSON 檔時只需宣告導入，UI 下拉選單將自動感應顯示，無須重修頁面按鈕版面。
