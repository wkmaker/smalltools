---

name: toolbox-design-standards

description: 適用於小型工具庫（smalltools）Next.js App Router 與 Tailwind v4 架構的毛玻璃 UI 風格規範、核心開發大原則與編碼細節規範。

---



# 工具庫專案 UI/UX 設計與 Next.js / Tailwind v4 開發規範



本文件為「Smalltools 工具庫專案」的專屬 Skill 指南。全站已全面規範以下設計標準與開發原則：

## 一、 視覺與設計美學標準 (Aesthetics Standards)



1. **毛玻璃擬物化 (Glassmorphism) 與語意化 Token (Semantic Tokens)**

   * **背景與模糊**：主要玻璃容器統一使用 `ToolLayout` 元件，套用 Tailwind v4 語意化背景 `bg-surface-glass` (連動 `--glass-bg`)，搭配 `backdrop-blur-[24px]` 與 `-webkit-backdrop-filter: blur(24px)`。

   * **細緻邊框與陰影**：邊框採用語意化類別 `border-border-glass` (連動 `--card-border`)，陰影採用 `shadow-[var(--glass-shadow)]`。

   * **文字語意類別**：主要標題統一採用 `text-text-main` (連動 `--text-primary`)，次要說明與標籤採用 `text-text-sub` (連動 `--text-secondary`)。全站嚴禁在組件中硬編碼寫死色標，以利雙向切換亮暗主題。

   * **亮色模式雙層不透明度避坑 (Glass Stacked Opacity Rule)**：亮色模式下外層容器 `.homeContainer` / `.glass-container` 背景不透明度上限為 `0.38~0.45`，內部卡片 `.toolCard` 背景不透明度上限為 `0.25~0.35`。嚴禁內外層同時設定 0.6+ 不透明白，防範因半透明白雙重疊加引發純白死鎖 (`#ffffff`) 破壞透光折射感。

   * **亮色模式大範圍斜向流光 (Sweeping Ambient Light Ribbons)**：亮色模式大背景採用大角度斜向線形流光漸層 (`linear-gradient(135deg...)`)，嚴禁使用小範圍圓形發散斑點 (`radial-gradient`)，徹底防範視覺上產生「發霉/霉斑」心理聯想。



2. **配色與主題霓虹發光 (Neon Theme Colors) 與全站工具清冊**

   * **全站極黑與亮色氛圍**：暗色模式使用純極黑 `#030305` 凸顯霓虹發光；亮色模式使用純淨鈦白與柔和藍紫流光。

   * **全站 28 個小工具雙主題色與 `cardClass` 完整對照表 (Full Tool Registry Table)**：
     全站所有工具於首頁設定檔 (`app/config/tools.tsx`)、首頁樣式檔 (`app/page.module.css`) 及工具內部客戶端 (`[ToolName]Client.tsx`) 必須 100% 嚴格遵守下表宣告之專屬 `cardClass` 命名、暗色霓虹主題色與亮色模式 WCAG AA 高對比深色階 Hex：

     | 工具名稱 | 路由路徑 (`href`) | 專屬 `cardClass` | 暗色模式主題色 (Glow) | 亮色模式高對比深色階 (WCAG AA) |
     | :--- | :--- | :--- | :--- | :--- |
     | **複利計算機** | `/compound-interest/` | `interestCard` | 財富金黃 `#ffb800` (`rgba(255,184,0,0.6)`) | 深琥珀金 `#d97706` (Amber 600) |
     | **信貸計算機** | `/personal-loan/` | `loanCard` | 薄荷翡翠綠 `#00f5a0` (`rgba(0,245,160,0.6)`) | 深翠綠 `#059669` (Emerald 600) |
     | **車貸計算器** | `/car-loan/` | `carCard` | 霓虹赤紅 `#ff3b30` (`rgba(255,59,48,0.6)`) | 深紅 `#dc2626` (Red 600) |
     | **房貸計算機** | `/mortgage-loan/` | `mortgageCard` | 水晶藍綠 `#00ffaa` (`rgba(0,255,170,0.6)`) | 深藍綠 `#0d9488` (Teal 600) |
     | **股票質押壓力測試器** | `/pledge-calculator/` | `pledgeCard` | 耀眼金黃 `#eab308` (`rgba(234,179,8,0.6)`) | 深金黃 `#ca8a04` (Yellow 600) |
     | **期貨槓桿點數估算器** | `/futures-calculator/` | `futuresCard` | 珊瑚艷紅 `#ff5252` (`rgba(255,82,82,0.6)`) | 深鮮紅 `#b91c1c` (Red 700) |
     | **真實時薪計算器** | `/hourly-rate-calculator/` | `hourlyRateCard` | 科技冰藍 `#00f0ff` (`rgba(0,240,255,0.6)`) | 深海天藍 `#0284c7` (Sky 600) |
     | **薪資與勞健保計算機** | `/my-salary-calculator/` | `salaryCard` | 活力火焰橘 `#ff7300` (`rgba(255,115,0,0.6)`) | 深橘 `#ea580c` (Orange 600) |
     | **離職時間與預告期** | `/resignation-calculator/` | `resignationCard` | 賽博極光綠 `#00ff66` (`rgba(0,255,102,0.6)`) | 深翠綠 `#16a34a` (Green 600) |
     | **Base64 編碼/解碼** | `/base64/` | `base64Card` | 活力火焰橘 `#ff7300` (`rgba(255,115,0,0.6)`) | 深橘 `#ea580c` (Orange 600) |
     | **URL 編碼/解碼** | `/url/` | `urlCard` | 深度靛藍 `#6366f1` (`rgba(99,102,241,0.6)`) | 深靛藍 `#4338ca` (Indigo 700) |
     | **安全密碼生成器** | `/password/` | `passwordCard` | 賽博極光綠 `#00ff66` (`rgba(0,255,102,0.6)`) | 深翠綠 `#16a34a` (Green 600) |
     | **JSON 格式化美化器** | `/json/` | `jsonCard` | 霓虹粉桃 `#ff00aa` (`rgba(255,0,170,0.6)`) | 深洋紅 `#c026d3` (Fuchsia 600) |
     | **SSL 憑證格式轉換器** | `/ssl-converter/` | `sslConverterCard` | 水晶藍綠 `#00ffaa` (`rgba(0,255,170,0.6)`) | 深藍綠 `#0d9488` (Teal 600) |
     | **DIG 網路診斷工具** | `/dns-dig/` | `digCard` | 電光紫羅蘭 `#8b5cf6` (`rgba(139,92,246,0.6)`) | 深紫 `#7c3aed` (Violet 600) |
     | **IP 檢測助手** | `/ip-detector/` | `ipDetectorCard` | 科技冰藍 `#00f0ff` (`rgba(0,240,255,0.6)`) | 深海天藍 `#0284c7` (Sky 600) |
     | **DNS HTTPS 紀錄產生器** | `/https-dns-generator/` | `httpsDnsCard` | 深度靛藍 `#6366f1` (`rgba(99,102,241,0.6)`) | 深靛藍 `#4338ca` (Indigo 700) |
     | **IP 子網段計算器** | `/ip-calculator/` | `ipCalculatorCard` | 極客黃綠 `#a3e635` (`rgba(163,230,53,0.6)`) | 深黃綠 `#65a30d` (Lime 600) |
     | **文字處理助手** | `/text-utility/` | `textUtilityCard` | 霓虹粉紅 `#ff007f` (`rgba(255,0,127,0.6)`) | 深紫紅 `#be185d` (Pink 700) |
     | **Designer QR Code 產生器** | `/qr-generator/` | `qrCard` | 賽博極光綠 `#00ff66` (`rgba(0,255,102,0.6)`) | 深翠綠 `#16a34a` (Green 600) |
     | **兩份文件比對工具** | `/diff-checker/` | `diffCheckerCard` | 電光紫羅蘭 `#8b5cf6` (`rgba(139,92,246,0.6)`) | 深紫 `#7c3aed` (Violet 600) |
     | **目標計時器** | `/time/` | `timerCard` | 科技冰藍 `#00f0ff` (`rgba(0,240,255,0.6)`) | 深海天藍 `#0284c7` (Sky 600) |
     | **Epoch 時間戳記** | `/epoch/` | `epochCard` | 薄荷翡翠綠 `#00f5a0` (`rgba(0,245,160,0.6)`) | 深翠綠 `#059669` (Emerald 600) |
     | **幸運轉盤抽獎** | `/lucky-wheel/` | `luckyWheelCard` | 財富金黃 `#ffb800` (`rgba(255,184,0,0.6)`) | 深琥珀金 `#d97706` (Amber 600) |
     | **萬能圖片處理大師** | `/image-processor/` | `imageProcessorCard` | 霓虹桃粉 `#d946ef` (`rgba(217,70,239,0.6)`) | 深洋紅 `#c026d3` (Fuchsia 600) |
     | **PDF 頁面組合器** | `/pdf-processor/` | `pdfProcessorCard` | 霓虹赤紅 `#ff3b30` (`rgba(255,59,48,0.6)`) | 深紅 `#dc2626` (Red 600) |
     | **PDF 壓縮大師** | `/pdf-compressor/` | `pdfCompressorCard` | 耀眼金黃 `#eab308` (`rgba(234,179,8,0.6)`) | 深金黃 `#ca8a04` (Yellow 600) |
     | **吹牛骰子搖骰器** | `/liars-dice/` | `liarsDiceCard` | 珊瑚艷紅 `#ff5252` (`rgba(255,82,82,0.6)`) | 深鮮紅 `#b91c1c` (Red 700) |

   * **卡片 Class 共用禁忌**：新增小工具時，**嚴禁在 `app/config/tools.tsx` 中隨意共用其他工具之 `cardClass`** (例如錯把 QR Code 產生器設為 `httpsDnsCard`)。必須宣告獨立 `cardClass` 命名，並同步於 `app/page.module.css` 註冊對應的 Hover、Glow 及亮色模式對比度樣式。

   * **互動狀態**：輸入框聚焦 (`focus:border-[var(--theme-color)]`) 與按鈕懸停 (`hover:shadow-[0_0_15px_var(--theme-color)]`) 時，必須亮起對應主題色的發光與陰影。



3. **`ToolLayout` 與 `ThemeToggle` 全站共用外框與主題切換規範**

   * 所有工具頁面統一引用 `app/components/ToolLayout.tsx` 作為最外層容器。

   * 右上方統一整合 `ThemeToggle` 元件，提供太陽 (☀️) 與月亮 (🌙) 向量 SVG 雙向切換微動畫。

   * **呼吸留白 (Breathing Room)**：容器寬度維持 `max-w-[90%]`（電腦版），標題下方自帶發光橫線與漸層。

   * **工具主體內容區寬度規範（Full-Width Responsive Rule）**：工具主體內容（如左右雙欄 Grid、輸入面板、結果看板）必須讓寬度隨螢幕自然延伸，
     **嚴禁在主體 `<div>` 上加寫死 `max-w-xxx` 或固定寬度**，應改以 `w-full` + 斷點 Grid 響應式排版（如 `grid-cols-[1.1fr_1.9fr] max-[1024px]:grid-cols-1`），確保在任何寬度螢幕上都能充分利用畫面空間。



4. **背景晶體幾何連線星網與動態主題連動 (Constellation Network & Particle Canvas)**

   * 全站粒子背景 (`ParticleCanvas.tsx`) 啟用動態連線星網 `connectParticles()`：

     - 暗色模式：粒子點與雷射線段動態連動各小工具之 signature `getActiveThemeColor()` 霓虹主題發光色 (`rgba(themeColor, 0.20)`)。

     - 亮色模式：採用高對比 2.0px 湛藍水晶點 (`#0284c7`) 與 1.2px 幾何細線段 (`rgba(2,132,199,0.28)`)，呈現立體精緻之神經網絡美學。

   * 客戶端組件 (`[ToolName]Client.tsx`) 在 `useEffect` 掛載時，必須動態寫入主題色至 `:root`（變數名稱必須嚴格為 `--theme-color` 與 `--accent-glow`）：

     ```typescript

     useEffect(() => {

       document.documentElement.style.setProperty('--theme-color', '#ff0055');

       document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 85, 0.6)');

     }, []);

     ```



5. **向量 SVG 圖示替代 Emoji 規範 (SVG Icons over Emojis)**

   * **禁用系統預設 Emoji 作為 UI 主要 Icon**：嚴禁在按鈕、區塊標題、上傳 Dropzone、標籤或控制介面中直接使用 OS 原生 Emoji。

   * **採用極量向量 Inline SVG**：介面圖示一律採用精簡原生 Inline SVG 或 Lucide/Heroicons 規格 SVG。

   * **主題色動態連動與發光 (Theme-aware SVG)**：SVG 之 `fill` 或 `stroke` 屬性統一採用 `currentColor`（或連動主題色 `text-[var(--theme-color)]`）。



6. **零閃爍 (Zero FOUC) 防護與 Next.js `suppressHydrationWarning` 規範**

   * 在 `app/layout.tsx` 的 HTML `<head>` 注入同步 `themeScript` 以在 React Hydration 前即時讀取 `localStorage` 並鎖定 DOM 主題。

   * 在 `app/layout.tsx` 的 `<html ...>` 標籤必須顯式宣告 **`suppressHydrationWarning`** 屬性，防止 head 腳本動態設定 `<html data-theme="...">` 時觸發 React SSR / Client Hydration Mismatch 警告。

---

7. **亮暗雙色系 (Light/Dark Theme) 架構與語意 Token 設計規範**

   ### ① 主態架構與 Hydration 安全機制
   * **`ThemeProvider` 全域狀態同步**：透過 `ThemeProvider` 統一管理 `'dark' | 'light'` 狀態，同步寫入 `localStorage` 與 HTML 根元素屬性 `<html data-theme="dark|light">`。
   * **Hydration 防護 (`mounted`)**：所有依賴主題狀態的 Client 端組件（如 `ThemeToggle`），必須包含 `mounted` 狀態判斷（於 `useEffect` 設置 `setMounted(true)`），防範 SSR 與 Client 初次渲染屬性不一致引發 Hydration 報錯。

   ### ② Tailwind v4 與語意 Token 規範 (Semantic Tokens)
   * **全站語意 Token 優先原則**：頁面與組件一律採用 `globals.css` 定義的語意類別，嚴禁硬編碼 `#000000` 或 `#ffffff`：
     - **容器背景**：`bg-surface-glass` (連動 `--glass-bg`)、`bg-select-bg` (連動 `--select-bg`)
     - **精細邊框**：`border-border-glass` (連動 `--card-border`)
     - **主要文字**：`text-text-main` (連動 `--text-primary`：暗色 `#ffffff` / 亮色 `#0f172a`)
     - **次要標籤**：`text-text-sub` (連動 `--text-secondary`：暗色 `#94a3b8` / 亮色 `#334155`)
   * **全站 CSS 變數別名防錯 (CRITICAL - Invalid CSS Variable Fallback Trap)**：
     在 CSS Module (`*.module.css`) 中引用全域文字變數時，**必須嚴格對齊 `:root` 所宣告之 `var(--text-primary)` 與 `var(--text-secondary)`**。嚴禁使用未於 `:root` 定義的 `var(--text-main)` 或 `var(--text-sub)`，否則在亮色模式下會因變數未命中而繼續套用白字 fallback，引發淺色背景下文字隱形之死鎖 Bug。
   * **Tailwind `dark:` 變體失效陷阱 (CRITICAL - Dark Variant Trap)**：
     - 專案全站由 `<html data-theme="...">` 驅動主題，**嚴禁在 JSX 中直接使用 Tailwind 預設的 `dark:` 類別**（例如 `bg-white/40 dark:bg-black/20`）。在未宣告自訂 `@variant dark` 時，Tailwind 在亮色模式下會無視 `dark:` 條件而誤套用黑底，在淺色背景上疊加出巨幅沉重、髒灰色的「泥塊障礙區」。
     - **正確特化做法**：組件專屬樣式統一寫於對應 CSS Module (`*.module.css`)，使用 `:global([data-theme='light']) .className` 與 `:global([data-theme='dark']) .className` 做亮暗特化。

   ### ③ 亮色模式高奢毛玻璃與防泥灰規範 (Apple Liquid Glassmorphism)
   * **卡片與面板**：亮色模式下採用透光玻璃質感 (`background: rgba(255, 255, 255, 0.25~0.35)` 搭配 `backdrop-filter: blur(16px~24px)` 與亮玻璃頂內光 `inset 0 1px 0 rgba(255, 255, 255, 0.75~0.85)`)，嚴禁設定生硬純白 (`#ffffff`) 或殘留深黑半透明。
   * **表單輸入框 (`<input>`)**：亮色模式下預設為 65% 半透明白 `rgba(255, 255, 255, 0.65)`，僅在對焦 (`:focus`) 時呈現純白 `#ffffff` 並亮起主題發光環，兼顧透光與質感。
   * **表格首欄凍結 (`.stickyPeriod`)**：亮色模式下採用 Slate-100 (`#f1f5f9`) 柔和藍灰作為固定欄背景，徹底防範黑區遮擋與文字隱形。

   ### ④ Canvas 動態圖表主題感知 (Theme-Aware Canvas Charts)
   * Canvas 繪圖邏輯必須動態讀取 `document.documentElement.getAttribute('data-theme') === 'light'` 屬性：
     - **暗色模式**：採用極黑霓虹發光與半透明藍灰/黃金漸層。
     - **亮色模式**：自動切換為清亮水晶色彩（如水藍色 `#0284c7` 投入本金區與虛線、琥珀耀金 `#d97706` 收益頂線），網格刻度線使用輕盈 Slate 灰 `rgba(203, 213, 225, 0.8)` 與軸文字 `#475569`，避免在淺色背景下線條隱形或色彩沉重。

   ### ⑤ 原生 UI 與表單元件適配
   * 原生選擇器（如 `input[type='date']`）必須宣告 `color-scheme: var(--color-scheme, dark)`，確保彈出的 Date Picker 自動連動深/淺模式。

   ### ⑥ 亮色模式高對比度文字、按鈕與數據色階降階規範 (WCAG AA Accent & Button Contrast Rule)
   * 亮色模式下，**嚴禁將暗色高彩度/高亮度的霓虹主題色（如薄荷綠 `#00f5a0`、赤紅 `#ff3b30`、財富金黃 `#ffb800`、科技冰藍 `#00f0ff`）直接作為文字、數據數字標籤或按鈕文字顏色**，否則會因對比度不足（< 2:1）違反 WCAG 2.1 AA 規範並引發嚴重視覺閱讀障礙。
   * **預設情境按鈕與主題發光按鈕 (`.accentBtn` / `.exampleBtn`) 亮色適配**：在暗色模式下使用霓虹發光之按鈕，於 CSS Module 必須顯式宣告 `:global([data-theme='light'])` 切換為同色系 **高對比深色階 (600/700 色階)**，配合 8%~12% 輕度透明背景與 35% 柔和邊框。
   * 必須於對應 CSS Module (`*.module.css`) 在 `:global([data-theme='light'])` 下降階切換為同色系之 **高對比深色階 (600/700 色階)**：
     - **科技冰藍/賽博藍 (`#00f0ff` / `#0077ff`)** ➔ 亮色模式文字/按鈕降階為 **深海天藍 `#0284c7` (Sky 600) / `#0369a1` (Sky 700)**
     - **霓虹粉桃/桃粉 (`#ff00aa` / `#ff007f`)** ➔ 亮色模式文字降階為 **深洋紅/紫紅 `#c026d3` (Fuchsia 600) / `#be185d` (Pink 700)**
     - **亮翠綠/薄荷綠 (`#00ffaa` / `#00f5a0`)** ➔ 亮色模式文字降階為 **深藍綠/翡翠綠 `#0d9488` (Teal 600) / `#059669` (Emerald 600)**
     - **賽博極光綠 (`#00ff66`)** ➔ 亮色模式文字降階為 **深翠綠 `#059669` (Emerald 600)**
     - **活力橘 (`#ff7300`)** ➔ 亮色模式文字降階為 **深橘 `#ea580c` (Orange 600)**
     - **赤紅/霓虹紅粉 (`#ff3b30` / `#ff0055`)** ➔ 亮色模式文字降階為 **深紅 `#dc2626` (Red 600)**
     - **財富金黃 (`#ffb800`)** ➔ 亮色模式文字降階為 **深琥珀金 `#d97706` (Amber 600)**
     - **綠色數據標籤 (`#4ade80`)** ➔ 亮色模式文字降階為 **森林鮮綠 `#16a34a` (Green 600)**

   ### ⑦ SVG 儀表盤 (Gauge Meter) 與 Range Slider 的雙主題適配規範
   * **SVG 風險儀表盤**：背景灰弧線在暗色模式為 `rgba(255, 255, 255, 0.06)`，亮色模式必須切換為 `rgba(148, 163, 184, 0.2)` (Slate-400)；指針與中心圓點必須動態連動高對比主題色 (`currentColor` / `styles.accentText`) 與適應背景。
   * **Range Slider (`input[type="range"]`)**：滑塊軌道在亮色模式下切換為 `rgba(0, 0, 0, 0.1)` 淺灰背景，`::-webkit-slider-thumb` 滑塊顏色在亮色模式連動高對比深色階，並保有亮白邊框。

   ### ⑧ 分段控制器與按鈕組 (Segmented Controls & Toggle Buttons) 狀態規範
   * 分段選單按鈕未選中時，Hover 狀態必須使用 `hover:text-text-main`（嚴禁寫死 `hover:text-white`，防範亮色模式下 Hover 導致文字變白隱形）。
   * 選中狀態按鈕 (Active) 於亮色模式下須套用 12% 透明度深色背景與 40% 邊框（例如：`bg-[#0284c7]/12 border-[#0284c7]/40 text-[#0284c7]`，不可寫死淺色霓虹文字）。
   * 建議抽離專屬 `.toggleBtnActive` 與 `.toggleBtnInactive` 至 CSS Module 中中控，統一管理雙主題切換。

   ### ⑨ 試算分享連結 (Share Link Button) 與 Toast 反饋介面規範
   * 金融與試算類工具於輸入面板上方或底部應統一提供「複製試算分享連結」按鈕，並於點擊複製後觸發淡入 Toast 彈出視窗（`animate-fade-in` 搭配雙主題半透明底與主題光點），提示使用者連結已複製。
   * **Toast 雙主題高對比度降階規範**：
     - 暗色模式：`bg-[themeColor]/20 border border-[themeColor]/40 text-[#ffffff] backdrop-blur-md`
     - 亮色模式：`bg-white/95 border border-[darkThemeColor]/40 text-[darkThemeColor]` (例如黃色主題切換為 Amber 600 `#d97706`，極客綠切換為 Emerald 600 `#059669`，紅色主題切換為 Red 600 `#dc2626`)，確保彈窗在淺色背景上文字對比度高於 4.5:1。

   ### ⑩ 全子頁籤/內層組件雙主題適配防盲區規範 (Deep Sub-Tab & Inner Component Rule)
   * 具備多子頁籤 (Sub-Tabs)、多步驟彈窗 (Wizard Modal) 或複雜子表單 (如 SSL 憑證轉換器、PDF 頁面處理器) 的工具組件，**絕不能僅改寫最外層 ToolLayout 與頁頭樣式**。
   * 必須逐一檢查每個子頁籤面板 (`activeTab === '...'`)、隱藏浮層、上傳 Dropzone、密碼輸入框、結果評估明細卡片及複製/下載按鈕。
   * 徹底清理所有硬編碼黑底 (如 `bg-black/20`, `bg-black/40`)、硬編碼邊框 (如 `border-white/[.08]`)、硬編碼白字 (`text-white`) 及未降階之霓虹主題色 (`text-[#00ffaa]`)，全數改為語意 Token 或對應 CSS Module 的 `:global([data-theme='light'])` 特化類別。

   ### ⑪ 動態 Props 主題色組件防錯規範 (Dynamic Accent Component Rule)
   * 凡建立接收 `accentColor` 屬性的通用 UI 組件（如 `<MetricCard>`、`<FaqSection>`），**嚴禁在 JSX 中直接將暗色霓虹 Hex 以行內樣式 `style={{ color: accentColor }}` 直接渲染**。
   * **必須於組件內部封裝 `getLightModeAccentColor(accentColor)` 轉譯函式**，或透過 CSS 變數配合 `:global([data-theme='light'])`。在亮色模式下必須自動將 `#00ff66` / `#00f0ff` / `#ffb800` 等霓虹 Hex 降階轉為高對比度深色階（如 `#059669` / `#0284c7` / `#d97706`），100% 符合 WCAG 2.1 AA 標準。

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

   * **`isMountedRef` 初始化防護 (Hydration Safety)**：初次掛載讀取 `window.location.search` 時，必須在讀取與 setState 後將 `isMountedRef.current` 標記為 `true`；正向連動 `useEffect` 必須確認 `isMountedRef.current === true` 才進行 `replaceState`，徹底防範初次渲染預設 state 反向覆蓋 URL Query 參數。

   * **反向解析與安全 Fallback**：讀取 `window.location.search` 時，必須使用 `safeParse` 或防呆校驗。若參數非法或超出邊界，必須安全回退至預設值，絕不能導致 React Hydration 崩潰。

   * **工具類型選擇性排除原則 (Selective Exclusion for Non-Parameterized Tools)**：
     - 包含複雜多欄位參數試算/模擬器的金融理財類工具 (如房貸/信貸/薪資/複利試算)，必須實作 URL 雙向狀態同步。
     - 針對純單向輸入輸出、文件/文字處理或一次性密碼生成工具 (如 Base64、URL 編解碼、密碼產生器、JSON 格式化、SSL 憑證轉換器)，**應選擇性不啟用 URL 參數雙向連動與 Hydration 網址解析**，保持網址潔淨並避免無謂的狀態同步負擔。

   * **結構化資料與 URL 拆解完整性規範 (Structured Parser Completeness)**：
     凡提供網址或結構化資料拆解/連動編輯功能的工具，解析器必須 100% 完整拆解與展示該資料結構之所有標準組成要素（例如 URL 結構必須涵蓋 Protocol, Host Domain, Pathname, Query Parameters 以及 Fragment / Anchor Hash `#`），防止組件拆解時遺漏重要欄位。



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

   * **`TRANSLATIONS` 雙語字典結構與全介面覆蓋率**：

     - 共享 Client 組件文案統一寫於檔案頂層 `TRANSLATIONS` 物件字典中控，包含 `zh-TW` 與 `en` 兩套完整文案，禁止將語系判斷散落於 JSX 邏輯中。
     - **字典 100% 覆蓋率規範**：`TRANSLATIONS` 字典必須完全覆蓋子頁籤切換鈕、輸入框 Placeholder、密碼顯示/隱藏切換鈕、檔案上傳拖曳提示、送出按鈕、結果明細標題、告警 banner、複製/下載按鈕及動態格式化函式，嚴禁在子頁籤 JSX 中遺留硬編碼的中英文 UI 字串。

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

   * **介面無縫切換鈕**：在 Client 試算面板右上方放置雙語切換開關，以 Next.js `<Link>` 連結至對應網址，字體統一採用 **14px (`text-sm font-medium rounded-xl`)**，樣式套用語意類別 `bg-select-bg border-border-glass text-text-sub hover:text-text-main transition-colors`，擴大行動端觸碰熱區。

   * **`ToolLayout` 全域共用組件頁尾與返回鈕 i18n 自動感應規範**：
     全站共用 `ToolLayout` 必須自動讀取 `usePathname()`。當路徑包含 `/en/`（英文語系路由）時，頁面外圍 UI 必須無感自動轉換：
     - 返回首頁按鈕 ➔ **`Back to Home`**
     - 頁尾贊助疑問句 ➔ **`Enjoying this tool?`**
     - 頁尾贊助按鈕 ➔ **`Sponsor the Author ☕`**
      繁體中文版面則自動維持 `返回首頁`、`喜歡這個小工具嗎？` 及 `贊助支持作者 ☕`。

   * **語系切換按鈕統一放置規範（extraHeaderControls）**：

     全站所有具備多語系版本（含 `/en/` 子路由）的工具，語系切換按鈕必須統一放置於 `ToolLayout` 的 **`extraHeaderControls`** prop 中，使其固定顯示於 Header 右側控制區（與深色/淺色模式切換按鈕同排）。

     **嚴禁**將語系切換按鈕以 inline `<div>` 形式放置於頁面主要內容區頂部（如 `<div className="flex justify-end mb-4">` 或 `<div className="flex justify-between items-center">`）。

     標準用法如下：

     ```tsx
     <ToolLayout
       title={t.title}
       subtitle={t.subtitle}
       description={t.description}
       accentColor="#00f5a0"
       accentGlow="rgba(0, 245, 160, 0.6)"
       extraHeaderControls={
         <Link
           href={t.langToggleUrl}
           className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
         >
           {t.langToggleLabel}
         </Link>
       }
     >
     ```

     **特殊情境**：若同一 `extraHeaderControls` 位置需要放多個控制項（如倒數計時工具在計時啟動時顯示設定選單，平時顯示語系切換），可使用條件三元運算式：

     ```tsx
     extraHeaderControls={
       timerActive ? (
         <button ...>{/* 設定選單 */}</button>
       ) : (
         <Link href={t.switchLangHref} className="...">{t.switchLangText}</Link>
       )
     }
     ```

     **工具列內附加動作按鈕**：若工具有其他功能按鈕原本與語系切換同排（如全螢幕按鈕、複製連結按鈕），語系切換移出後，剩餘按鈕保留在工具內容區自行排列（`flex justify-end`）；`extraHeaderControls` 只放語系切換按鈕本身，不包含其他功能按鈕。


4. **金融與專業領域必備免責條款**
   * 凡涉及法律、稅務、金融借貸（如房貸/信貸/車貸/薪資）、股票質押或期貨交易等專業領域之工具與 FAQ，**必須明確附上免責條款與聲明**（提醒使用者本工具計算與試算結果僅供投資、參考與學習使用，實際數字、法規適用與最終結算請務必以政府官方公告、法院判決、券商/銀行公告或專業律師/會計師核算為主）。

5. **全站禁止 Emoji 規範**
   * FAQ 題目、解答內文及所有介面顯示文字，**嚴禁使用任何原生 Emoji 圖示**（如 ⚠️, 📈, ⚡）。必須使用工具提供的 SVG 向量圖示替代，確保 UI 一致性且符合打包單元測試標準。

6. **Next.js App Router 靜態 Sitemap 生成與 AWS 部署避坑規範 (Sitemap & AWS Deployment)**

   * **`app/sitemap.ts` 原生動態生成**：全站統一採用 App Router 原生 `app/sitemap.ts` 定義 `MetadataRoute.Sitemap`。當執行 `next build` 進行靜態導出 (`output: 'export'`) 時，Next.js 會自動於 `out/sitemap.xml` 產出對應的 XML。

   * **多語言獨立路由與 `lastModified` 時間戳記即時同步原則**：
     - 新增工具之多語言獨立路由（如 `/my-salary-calculator/en/`、`/pdf-compressor/en/`）時，除了宣告 Metadata，**必須同步將英文路由網址更新至 `app/sitemap.ts` 的 `pages` 清單陣列**。
     - **全站變更即時同步**：不限於 FAQ 變更——凡對任何工具進行程式碼重構、功能新增、UI 修正、文案調整或 SEO 擴充，**必須同步將 `app/sitemap.ts` 中該工具對應的所有路由網址（包含繁中與英文）之 `lastModified` 時間戳記更新為最新修改日期**，確保靜態導出產出之 `out/sitemap.xml` 精準覆蓋全站頁面最新狀態。

   * **必須顯式宣告靜態導出 (`export const dynamic = 'force-static'`)**：在 `app/sitemap.ts` 檔案頂層**必須顯式加入 `export const dynamic = 'force-static';`**。若未宣告，Next.js 在 `output: export` 靜態導出模式下執行 `next build` 會拋出 `/sitemap.xml` 路由未設置靜態導出而中斷編譯的錯誤。

   * **Sitemap 網址規範化 (Canonical URL)**：搭配 `trailingSlash: true`，Sitemap 內的所有 `<loc>` 網址必須採用目錄結尾斜線（如 `https://tools.cjkuo.net/time/`），嚴禁帶有 `/index.html`，以符合 SEO 規範網址。

   * **清理 `public/` 重複檔案**：啟用 `app/sitemap.ts` 後，需確認 `public/sitemap.xml` 及根目錄 `sitemap.xml` 已刪除，避免編譯時靜態資源覆蓋 Next.js 自動生成之 `sitemap.xml`。

   * **AWS 託管與相容性**：部署至 AWS S3 (開啟 Index document: `index.html`) 或搭配 CloudFront Rewrite 時，無檔名目錄路徑（`/time/`）即可自動對應至 `time/index.html`，無需於 Sitemap 標註副檔名。



10. **全站中央工具清單設定檔與 404 動態推薦規範 (Central Tool Registry & 404 Recommendation)**

    * **中央單一資料源 (`app/config/tools.tsx`)**：全站所有小工具清單、分類 (`category`)、主題向量 SVG 圖示 (`svg`)、簡介與關鍵字統一收錄於 `app/config/tools.tsx`，嚴禁在多個頁面中重複硬編碼全站工具清單。未來新增工具時僅需編輯此檔。

    * **首頁與 404 自動同步連動**：

      - 首頁 (`app/page.tsx`) 直接導入 `CATEGORIES` 進行選單與卡片渲染。

      - 404 頁面 (`app/not-found.tsx`) 導入 `ALL_TOOLS`，並根據 404 URL 請求路徑關鍵字自動判斷分類，優先推薦同類型工具，若少於 6 個則隨機打亂補充其餘工具填滿至 6 個。11. **持續性與無縫互動上傳大原則 (Persistent & Seamless Drag-and-Drop UX)**

    * 凡具備檔案處理能力的小工具，載入初始檔案後**絕不可將 Drag & Drop 互動入口完全刪除**。

    * 必須支援「全域拖曳感應 Overlay」與「列表底部輕量擴充 Dropzone」，保證使用者在任何操作階段皆能無縫拖曳追加新檔案。

    * **多層級拖曳隔離**：當組件同時具備「檔案上傳」與「內部卡片排序」時，必須透過 DataTransfer 類型嚴格隔離，防止排序操作誤觸上傳浮層。



12. **高負載運算之「UI 線程非阻塞 (Non-Blocking Yielding)」、「漸進式串流呈現 (Progressive Streaming)」與「大數據 CSV/TXT 匯出」大原則**

    * 凡涉及多檔案、高解析度圖像或大數據處理的密集運算，**嚴禁連續霸佔 JavaScript 主執行緒 (Main Thread)** 引發 UI 畫面凍結或懸停動畫卡頓 (Frame Drop)。

    * **時間片釋放 (Yielding Chunk Export)**：當處理或匯出大數據（如 IP 計算器產生 >10,000 筆可用 IP）時，必須採用非同步分塊處理（如每 20,000 筆透過 `setTimeout(processChunk, 0)` 釋放 Main Thread 時間片），維持 60fps 滑順響應與動態進度提示。

    * **Excel 相容性 (UTF-8 BOM)**：CSV 匯出檔首行必須顯式寫入 `\uFEFF` (UTF-8 BOM) 標頭，確保 Microsoft Excel 在 Windows 環境下開啟時無亂碼。

    * **漸進式即時呈現 (Incremental Rendering)**：採用「單項處理完成即時連動畫面」的串流體驗，無須死等整體批次完成，大幅降低使用者感知等待時間。

    * **預覽畫質降採樣**：列表縮圖一律適度降採樣 (Downsampling)，節省記憶體與渲染負載。



13. **彈出檢視視窗之「頂層 Portal 隔離」與「雙階動態畫質 JIT」大原則 (Full-Viewport Lightbox & JIT)**

    * **視圖獨立性 (DOM Portal)**：所有彈出式 Lightbox / Modal / 大圖檢視器統一使用 React Portal 渲染至 `document.body` 頂層，徹底擺脫外層容器邊界與 CSS 堆疊上下文 (Stacking Context) 之邊界限制與遮擋。

    * **視埠動態適應 (Full-Viewport Responsive)**：檢視視窗必須隨螢幕視埠動態放大適應 (Viewport-Aware)，最大化擴展顯示區域，避免固定微縮小框。

    * **雙階動態畫質 (Two-Tier JIT Rendering)**：預覽縮圖採用低維度以極速載入；僅在點擊展開檢視時才動態觸發 JIT (Just-In-Time) 高解析度無損渲染，兼顧首屏載入速度與極致細節呈現。

    * **無跳動控制介面 (Non-Shifting Controls)**：Modal 內部控制項（如縮放、重置、操作鈕）佈局必須絕對靜態固定，嚴禁隨狀態產生 Layout Shift 導致滑鼠連擊時誤觸。



14. **非同步任務與 API 請求競態防護 (Async Race & Abort Standard)**

    * 凡涉及非同步檔案讀取 (`FileReader`) 或網路 DoH / HTTP API 查詢 (`fetch`) 的工具，必須宣告 `activeReaderRef` / `activeAbortControllerRef`。

    * 在發起新任務或使用者高頻打字/切換條件前，必須自動呼叫 `.abort()` 中斷前次連線，並針對 API 請求加上 8 秒 Timeout 逾時防護 (`AbortSignal.timeout`)，徹底消弭舊連線慢返回反向覆蓋最新視圖的 Race Condition。



15. **Textarea 動態自適應高度零 Layout Shift 規範 (Zero Jank Auto-height Standard)**

    * 動態計算 `<textarea>` 自適應高度時，嚴禁先將 `style.height = 'auto'` 重置後呼叫 `window.scrollTo`，防範 DOM 瞬間塌陷引發全頁面閃爍與 Layout Shift。應直接讀取 `scrollHeight` 並平滑更新高度。



16. **巨量數據與高負載演算法主執行緒凍結防護 (Main-Thread Frozen Safeguard)**

    * 針對文字比對 (Diff)、大檔案編解碼 (Base64) 或高複雜度運算，必須設定字串長度與檔案大小上限（如 10MB 或 3,000,000 字元）。超出時給予截斷或分區預覽，兼顧 100% 完整複製匯出與極速 60fps UI 渲染。



17. **全站工具 FAQ 常見問題區塊與 Schema.org `FAQPage` JSON-LD 規範 (Universal FAQ & FAQPage JSON-LD Standard)**

    * **雙重 FAQ 架構 (Dual FAQ Architecture)**：
      - **SSR 端 (`app/[tool-name]/page.tsx` & `en/page.tsx`)**：必須引用 `generateFaqSchema` 工具函式 (`@/app/utils/faqSchema`) 產生 Schema.org `FAQPage` JSON-LD 結構化資料，並在 `<script type="application/ld+json">` 中渲染，顯著提升 Google 搜尋引擎之 Rich Snippets 搜尋曝光與 SEO 排名。
      - **Client 端 (`app/[tool-name]/[ToolName]Client.tsx`)**：於 `TRANSLATIONS` 雙語字典中宣告 `faqTitle`、`faqSubtitle` 及 `faqItems` (繁中與英文各 6~8 題)，傳入全站通用元件 `<FaqSection>` 展示流暢可手動展開/收合的手風琴問答介面。
      - **雙語與內容 100% 一致性**：`page.tsx` / `en/page.tsx` 的 JSON-LD 陣列與 `TRANSLATIONS` 的 `faqItems` 內容必須 100% 保持文字與題目完全同步。

    * **`<FaqSection>` 放置佈局規範 (Layout Positioning)**：
      - `<FaqSection>` 必須放置於 `ToolLayout` 內部、工具主體左右雙欄 Grid 容器下方（但獨立於 Grid 容器之外），讓 FAQ 於全寬自然延伸，帶來流暢優雅的下滑閱讀體驗。
      - 傳入之 `accentColor` 在亮色模式下會由組件內部自動呼叫 `getLightModeAccentColor` 降階轉為高對比深色階（如 Amber 600 / Red 600 / Emerald 600），確保 WCAG AA 可讀性。

    * **FAQ 內文清晰換行與排版規範 (FAQ Formatting & Line-Breaks Standard)**：
      - `<FaqSection>` 答題區預設套用 `white-space: pre-line`。
      - **清晰段落與標點排版**：答題內文中的子項目（如 `① 原始保證金` 與 `② 維持保證金`）、算例說明、救急策略或警示段落之間，**必須使用雙空行 (`\n\n`) 獨立分隔**，嚴禁將大量文字擠成一整團密集的單一行段落。

    * **法律、稅務、金融借貸與專業領域必備免責條款 (Mandatory Legal, Financial & Professional Disclaimers)**：
      - 凡涉及法律（如離職預告/勞基法）、稅務、金融借貸（如房貸/信貸/車貸/薪資）、股票質押或期貨交易等專業領域之工具與 FAQ，**必須明確附上免責條款與聲明**（提醒使用者本工具計算與試算結果僅供投資、參考與學習使用，實際數字、法規適用與最終結算請務必以政府官方公告、法院判決、券商/銀行公告或專業律師/會計師核算為主）。
      - **槓桿與雨天收傘風險**：涉及槓桿、貸款、期貨或股票質押的金融工具，FAQ 必須明確涵蓋大跌風險、斷頭追繳機制，以及券商/銀行「雨天收傘（到期拒絕展延或機動調升借款利率）」之隱藏風險。
      - **極端行情滑價與超額虧損警示 (Over-Loss / 穿價風險)**：期貨與槓桿交易工具必須明確警示「在劇烈行情、跳空、滑價或漲跌停鎖死下，即使達到砍倉門檻，市價砍倉單仍可能因無人承接或成交在極度不利價位，導致實際虧損超過全部本金 (Over-Loss 追繳負債)」，提示交易者切勿將強制砍倉視為安全防線。

    * **遵循全站「向量 SVG 圖示替代 Emoji 規範」 (Strict No-Emoji Compliance in FAQ)**：
      - FAQ 題目與解答內文必須嚴格遵守全站禁止裸露 Emoji 規範（避免觸發 prebuild 單元測試 `check-ui-standards.mjs` 硬性攔截並中斷打包）。
      - 答題文字內**嚴禁寫入原生 Emoji**（如 ⚠️, 📈, ⚡）；警示段落與標頭應採用中括號或純文字標號（如 `【極端行情滑價與超額虧損警示】` 或 `[Extreme Volatility Risk]`），圖示由向量 SVG 負責展示。



---



## 三、 Tailwind v4 樣式與編碼細節規範 (Tailwind v4 & Code Details)



1. **Tailwind v4 CSS-First 與 Cascade Layer 避坑原則 (CRITICAL)**

   * 專案採用 Tailwind v4 `@import 'tailwindcss';` 與 `@theme` 宣告。

   * **全域 Reset 禁忌**：**嚴禁在 CSS 頂層撰寫 unlayered 全域重設（如 `*, ::before, ::after { margin: 0; padding: 0; }`）**。在 Tailwind v4 的 Cascade Layers 機制中，未宣告 Layer 的頂層重設權重高於 Utilities Layer，會導致全站 `.p-8`、`.p-6` 等 Utility padding 被強制歸零並引發「文字貼邊死擠」Bug。所有全域重設必須包裹於 `@layer base { ... }` 內。



2. **W3C 無障礙標籤對應與 React `useId()` 規範**

   * 所有表單控制項之 `<label>` 必須設置 `htmlFor={inputId}`，且對應的 `<input>` 必須宣告 `id={inputId}`。

   * 為防範 SSR與 React Client Hydration 時產生 ID 不一致警告，必須統一使用 React 的 `useId()` 鉤子生成唯一元素 ID：

     ```typescript

     const carPriceInputId = useId();

     ```

    * **`<label>` 語意嚴格性防錯**：`<label>` 必須且只能搭配具備對應 `id` 的輸入控制項（如 `<input>`、`<select>`、`<textarea>`）。若區域僅為標籤標題、按鈕組（如多選模式切換、預設 Preset 按鈕、Checkbox 列表），**嚴禁使用 `<label>` 包裹無 `id` 的區塊**，否則會破壞 DOM accessibility 樹。應統一改用 `<span>` 或 `<legend>`，並配置適當字色 `text-text-sub`。

    * **無障礙隱藏標籤規範 (`sr-only` Label Pattern)**：若卡片或工具列為保持極簡 UI 未顯示文字標籤（如表格列內動態下拉選單、縮放控制鈕），必須透過 `useId()` 生成唯一的 `inputId`，並搭配 `<label htmlFor={inputId} className="sr-only">說明文字</label>`（螢幕閱讀器專用隱藏標籤），兼顧視覺設計質感與 W3C Accessibility 規範。



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

   * **表格標頭與凍結欄亮色模式置頂色規範 (Sticky Header & Frozen Column Rule)**：
     `th` 置頂標頭 (`position: sticky; top: 0;`) 與首欄凍結欄 (`position: sticky; left: 0;`) 在暗色模式下採用 `#0b0b0e` / `var(--card-bg-solid)`。**於亮色模式下必須顯式宣告 `:global([data-theme='light'])` 切換背景**：
     ```css
     :global([data-theme='light']) .ipTable th {
       background-color: #f1f5f9 !important; /* Slate 100 置頂背景 */
       color: #334155 !important;
       border-bottom: 1px solid rgba(0, 0, 0, 0.08);
     }
     ```
     嚴禁寫死暗色背景，否則橫向/縱向捲動表格時會出現深黑色影子區塊切斷亮色版面。

   * **表格標頭與數據字級**：還款明細表、數據統計表之標頭 (`<thead> <th>`) 與列數據 (`<tbody> <td>`) 一律採用 14px (`text-sm`) 標註，確保數據可讀性。



4. **輸入控制項與格式化細節與金額千分位規範**

   * **金額與貨幣輸入框即時千分位格式化 (Formatted Currency Input Standard)**：
     - 凡涉及金額、本金、貸款額度、定期定額、薪資、合約價值或股票質押金額等貨幣輸入框（如房貸、信貸、車貸、複利、算薪水、期貨槓桿、質押計算機），統一採用 `type="text"` 搭配 `inputMode="numeric"`。
     - **即時視覺千分位**：`value={amount === '' ? '' : amount.toLocaleString('zh-TW')}`，使數字在輸入時即時呈現千分位逗號（如 `1,000,000`），顯著提升大額金融數據的可讀性。
     - **防呆解析與輸入處理**：於 `onChange` 透過非數字正則過濾 `const raw = e.target.value.replace(/[^\d]/g, '')` 並安全解析寫回狀態 `setAmount(raw === '' ? '' : parseInt(raw, 10))`，兼顧無縫輸入、全選清空與剪貼簿貼上。

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

   * **表單輸入框與 Monospace 數據 14px 規範 (Input & Monospace Font Size Standard)**：所有表單輸入框 (`<input>` / `<textarea>`)、動態表格輸入欄位、Monospace 代碼與數據卡片，字級一律保持 **14px (`text-sm` / `0.875rem` / `0.9rem`)**。控制與操作按鈕一律維持 **13px~14px (`0.8125rem`~`0.875rem`)**。嚴禁將輸入框字級設為 `< 13px` (`0.75rem`)，以防範行動裝置 (iOS Safari) 聚焦輸入框時觸發視埠自動強行放大 (Auto-zoom Bug) 及視覺閱讀障礙。

   * **指標看板標題醒目化 (Stat Card Titles)**：核心數據或統計看板之卡片標題（如「首期月付額」、「實質年利率」、「總還款金額」、「總字元數」等）一律採用 **`text-sm font-semibold text-text-sub`** (14px 粗體醒目化)，嚴禁使用 12px 微縮字級。

   * **模式切換與功能按鈕 (Toggle Buttons & Tabs)**：模式切換鈕、語系切換鈕及快捷操作按鈕，一律統一升級為 **14px (`text-sm font-semibold` / `font-medium`)**，以提升行動端點擊觸碰範圍與視覺識別度。

    * **描述文案與次要備註**：頁面描述文案採用 **16px (`text-base text-text-sub`)** 最佳閱讀字級；次要備註與對應級距小字說明至少保持 **12px (`text-xs text-text-sub`)**，避免使用 10~11px 過小微縮字體。

    * **時鐘與 Monospace 動態數據防爆框規範 (Live Clock & Monospace Overflow Safeguard)**：高頻更新看板、UNIX 時間戳或 Monospace 等寬數據（如 `/epoch`），在行動端視埠 (320px~375px) 容易產生擠壓斷行或強行撐開卡片。父層容器必須顯式宣告 `min-width: 0`；數據文字本身必須包裹 `truncate` (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`)，配合醒目化 14px/16px 階層，防止橫向爆框。



9. **`number | ''` 輸入框狀態型態與清空防卡 0 原則 (Clean Input State Pattern)**

   * 表單輸入框 state 狀態型態統一宣告為 `number | ''`（例如 `const [amount, setAmount] = useState<number | ''>(50000)`）。

   * 當使用者全選刪除文字時，state 設為 `''`，輸入框維持乾淨清空狀態（不會強行補 `0` 在最前面）。

   * 於計算邏輯中防呆轉譯為 `0`：`const numAmount = amount === '' ? 0 : amount;`，避免產生 `NaN` 錯誤。



10. **舊版 JSON 資料檔完整性與動態選單擴充原則 (JSON Configuration & Dynamic Dropdown)**

    * 包含多年份法規級距或扣繳大表（如勞健保/所得稅扣繳稅額表）的小工具，必須將原始 JSON 設定檔拷貝至 `app/[tool-name]/config/` 與 `public/[tool-name]/config/`，並於模組中直接導入，保證算薪與試算數據與官方 100% 精準對照無偏差。

    * 適用年份或法規版本選擇器統一使用深色下拉選單 (`<select>`)，並與 `SUPPORTED_YEARS` 降冪陣列動態連動。未來新增新年份 JSON 檔時只需宣告導入，UI 下拉選單將自動感應顯示，無須重修頁面按鈕版面。

