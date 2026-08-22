---
name: smalltools-design-system
description: 適用於 Smalltools 專案的視覺設計系統、毛玻璃 (Glassmorphism) 美學、亮暗雙主題 (Light/Dark Theme)、WCAG AA 高對比降階規範與 SVG 向量圖示標準。
---

# Smalltools 視覺設計系統與主題規範 (Design System & Theme Standards)

本文件定義 Smalltools 工具庫專案的視覺美學、毛玻璃擬物化設計、雙主題切換架構與無障礙色彩對比度規範。所有前端工具頁面與通用組件皆必須 100% 嚴格遵循本標準。

---

## 一、 毛玻璃擬物化美學 (Apple Liquid Glassmorphism)

全站採用高質感透光毛玻璃風格，結合語意化 Token 與細緻的光影折射效果。

### 1. 核心容器與語意 Token (Semantic Tokens)
* **主要玻璃容器**：頁面統一使用 `ToolLayout` 元件，套用 Tailwind v4 語意化背景 `bg-surface-glass`（連動 CSS 變數 `--glass-bg`），搭配 `backdrop-blur-[24px]` 與 `-webkit-backdrop-filter: blur(24px)`。
* **細緻邊框與陰影**：邊框採用語意化類別 `border-border-glass`（連動 `--card-border`），陰影採用 `shadow-[var(--glass-shadow)]`。
* **文字語意類別**：
  - 主要文字 / 標題：`text-text-main`（連動 `--text-primary`：暗色 `#ffffff` / 亮色 `#0f172a`）。
  - 次要文字 / 標籤：`text-text-sub`（連動 `--text-secondary`：暗色 `#94a3b8` / 亮色 `#334155`）。
  - **全站嚴禁在組件或 JSX 中硬編碼寫死 `#000000` 或 `#ffffff`**，以確保亮暗主題無縫切換。

### 2. 亮色模式雙層不透明度避坑原則 (Glass Stacked Opacity Rule)
* **疊加不透明度上限**：亮色模式下外層容器（如 `.homeContainer` / `.glass-container`）背景不透明度上限為 `0.38 ~ 0.45`，內部卡片（如 `.toolCard`）背景不透明度上限為 `0.25 ~ 0.35`。
* **嚴禁雙重 0.6+ 疊加**：嚴禁內外層同時設定 0.6+ 不透明白，防範因半透明白雙重疊加引發「純白死鎖 (`#ffffff`)」，徹底破壞透光折射感。
* **亮色模式大範圍斜向流光 (Sweeping Ambient Light Ribbons)**：亮色模式大背景採用大角度線形流光漸層（`linear-gradient(135deg, ...)`），**嚴禁使用小範圍圓形發散斑點 (`radial-gradient`)**，徹底防範視覺上產生「發霉/霉斑」之心理聯想。

### 3. 亮色模式高奢防泥灰規範
* **卡片與面板**：亮色模式下採用透光玻璃質感（`background: rgba(255, 255, 255, 0.25~0.35)` 搭配 `backdrop-filter: blur(16px~24px)` 與亮玻璃頂內光 `inset 0 1px 0 rgba(255, 255, 255, 0.75~0.85)`），嚴禁設定生硬純白或殘留深黑半透明。
* **表單輸入框 (`<input>`)**：亮色模式下預設為 65% 半透明白 `rgba(255, 255, 255, 0.65)`，僅在對焦 (`:focus`) 時呈現純白 `#ffffff` 並亮起主題發光環，兼顧透光與質感。
* **表格首欄凍結 (`.stickyPeriod`)**：亮色模式下採用 Slate-100 (`#f1f5f9`) 柔和藍灰作為固定欄背景，徹底防範黑區遮擋與文字隱形。

---

## 二、 配色、主題霓虹發光與工具註冊規範

### 1. 全站雙模式基調
* **暗色模式**：使用純極黑 `#030305` 背景，最大化凸顯各工具專屬的霓虹主題發光色。
* **亮色模式**：使用純淨鈦白配合柔和藍紫斜向流光，展現高雅俐落的科技感。

### 2. 工具卡片獨立 `cardClass` 命名機制
全站所有小工具皆具備專屬的視覺色彩識別。新增任何小工具時：
* **中央註冊**：於 `app/config/tools.tsx` 宣告獨立且具辨識度的 `cardClass`（如 `interestCard`、`qrCard`、`harCleanerCard` 等）。
* **樣式實作**：於首頁樣式檔 (`app/page.module.css`) 註冊對應卡片的 Hover、霓虹 Glow 發光及亮色模式對比度樣式。
* **嚴禁共用 Class 禁忌**：嚴禁為求省事而複製套用其他工具既有的 `cardClass`，必須維持各工具獨立的視覺識別。

### 3. 動態主題色注入與互動狀態連動
* **Client 端主題色注入**：客戶端組件 (`[ToolName]Client.tsx`) 在 `useEffect` 掛載時，必須動態寫入主題色至 `:root`（變數名稱嚴格為 `--theme-color` 與 `--accent-glow`）：
  ```typescript
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);
  ```
* **互動狀態發光**：輸入框聚焦 (`focus:border-[var(--theme-color)]`) 與按鈕懸停 (`hover:shadow-[0_0_15px_var(--theme-color)]`) 時，必須動態亮起對應主題色的發光與外暈。

---

## 三、 亮暗雙主題架構與 WCAG AA 色階降階標準

### 1. 主題架構與 Hydration 安全機制
* **`ThemeProvider` 全域狀態同步**：透過 `ThemeProvider` 統一管理 `'dark' | 'light'` 狀態，同步寫入 `localStorage` 與 HTML 根元素屬性 `<html data-theme="dark|light">`。
* **Hydration 防護 (`mounted`)**：所有依賴主題狀態的 Client 端組件（如 `ThemeToggle`），必須包含 `mounted` 狀態判斷（於 `useEffect` 設置 `setMounted(true)`），防範 SSR 與 Client 初次渲染屬性不一致引發 Hydration 報錯。
* **Zero FOUC 零閃爍防護**：
  - 在 `app/layout.tsx` 的 HTML `<head>` 注入同步 `themeScript`，在 React Hydration 前即時讀取 `localStorage` 並鎖定 DOM 主題。
  - `<html ...>` 標籤必須顯式宣告 **`suppressHydrationWarning`**，防止 head 腳本動態設定 `<html data-theme="...">` 時觸發 React SSR / Client Hydration Mismatch 警告。

### 2. Tailwind `dark:` 變體失效陷阱 (CRITICAL)
* 專案全站由 `<html data-theme="...">` 驅動主題，**嚴禁在 JSX 中直接使用 Tailwind 預設的 `dark:` 類別**（例如 `bg-white/40 dark:bg-black/20`）。在未宣告自訂 `@variant dark` 時，Tailwind 在亮色模式下會無視 `dark:` 條件而誤套用黑底，在淺色背景上疊加出巨幅沉重、髒灰色的「泥塊障礙區」。
* **正確特化做法**：組件專屬樣式統一寫於對應 CSS Module (`*.module.css`)，使用 `:global([data-theme='light']) .className` 與 `:global([data-theme='dark']) .className` 進行亮暗特化。

### 3. CSS 變數別名防錯 (Invalid CSS Variable Fallback Trap)
在 CSS Module (`*.module.css`) 中引用全域文字變數時，**必須嚴格對齊 `:root` 所宣告之 `var(--text-primary)` 與 `var(--text-secondary)`**。嚴禁使用未於 `:root` 定義的 `var(--text-main)` 或 `var(--text-sub)`，否則在亮色模式下會因變數未命中而繼續套用白字 fallback，引發淺色背景下文字隱形之死鎖 Bug。

### 4. 亮色模式高對比度文字、按鈕與數據色階降階標準 (WCAG AA)
亮色模式下，**嚴禁將暗色高彩度/高亮度的霓虹主題色直接作為文字、數據數字標籤或按鈕文字顏色**，否則會因對比度不足（< 2:1）違反 WCAG 2.1 AA 規範並引發嚴重視覺閱讀障礙。

必須於對應 CSS Module (`*.module.css`) 在 `:global([data-theme='light'])` 下降階切換為同色系之 **高對比深色階 (600/700 色階)**：

| 霓虹色系 | 暗色模式主題色 (Glow) | 亮色模式高對比深色階 (WCAG AA 規範) |
| :--- | :--- | :--- |
| **科技冰藍 / 賽博藍** | `#00f0ff` / `#0077ff` | **深海天藍 `#0284c7` (Sky 600) / `#0369a1` (Sky 700)** |
| **霓虹粉桃 / 桃粉** | `#ff00aa` / `#ff007f` / `#ff4081` | **深洋紅 `#c026d3` (Fuchsia 600) / 深玫瑰紅 `#e11d48` (Rose 600)** |
| **亮翠綠 / 薄荷綠** | `#00ffaa` / `#00f5a0` | **深藍綠 `#0d9488` (Teal 600) / 深翠綠 `#059669` (Emerald 600)** |
| **賽博極光綠** | `#00ff66` / `#a3e635` | **深翠綠 `#059669` (Emerald 600) / 深黃綠 `#65a30d` (Lime 600)** |
| **活力火焰橘** | `#ff7300` | **深橘 `#ea580c` (Orange 600)** |
| **霓虹赤紅 / 珊瑚紅** | `#ff3b30` / `#ff5252` | **深紅 `#dc2626` (Red 600) / 深鮮紅 `#b91c1c` (Red 700)** |
| **財富金黃 / 耀眼金** | `#ffb800` / `#eab308` | **深琥珀金 `#d97706` (Amber 600) / 深金黃 `#ca8a04` (Yellow 600)** |
| **綠色數據標籤** | `#4ade80` | **森林鮮綠 `#16a34a` (Green 600)** |

### 5. 通用動態 Props 主題色組件防錯 (Dynamic Accent Component Rule)
凡建立接收 `accentColor` 屬性的通用 UI 組件（如 `<MetricCard>`、`<FaqSection>`）：
* **嚴禁在 JSX 中直接將暗色霓虹 Hex 以行內樣式 `style={{ color: accentColor }}` 直接渲染**。
* **必須於組件內部封裝 `getLightModeAccentColor(accentColor)` 轉譯函式**，或透過 CSS 變數配合 `:global([data-theme='light'])`，在亮色模式下自動將霓虹 Hex 降階為高對比度深色階（符合 WCAG 2.1 AA）。

---

## 四、 版面外框、粒子背景與微元件規範

### 1. `ToolLayout` 外框與全寬響應規範
* 所有工具頁面統一引用 `app/components/ToolLayout.tsx` 作為最外層容器。
* 右上方整合 `ThemeToggle` 元件，提供太陽 (☀️) 與月亮 (🌙) 向量 SVG 雙向切換微動畫。
* **呼吸留白 (Breathing Room)**：外層容器寬度維持 `max-w-[90%]`（電腦版），標題下方自帶發光橫線與漸層。
* **主體內容區寬度規範 (Full-Width Responsive Rule)**：工具主體內容（左右雙欄 Grid、輸入面板、結果看板）必須隨螢幕自然延伸，**嚴禁在主體 `<div>` 上寫死 `max-w-xxx` 或固定寬度**，改以 `w-full` + 斷點 Grid 響應式排版（如 `grid-cols-[1.1fr_1.9fr] max-[1024px]:grid-cols-1`）。

### 2. 背景晶體幾何星網 (Constellation Network & Particle Canvas)
全站粒子背景 (`ParticleCanvas.tsx`) 啟用動態連線星網 `connectParticles()`：
* **暗色模式**：粒子點與雷射線段動態連動各小工具之 signature `getActiveThemeColor()` 霓虹主題發光色 (`rgba(themeColor, 0.20)`)。
* **亮色模式**：採用高對比 2.0px 湛藍水晶點 (`#0284c7`) 與 1.2px 幾何細線段 (`rgba(2,132,199,0.28)`)，呈現立體精緻之神經網絡美學。

### 3. 微元件雙主題適配細則
* **SVG 儀表盤 (Gauge Meter)**：背景灰弧線暗色模式為 `rgba(255, 255, 255, 0.06)`，亮色模式切換為 `rgba(148, 163, 184, 0.2)` (Slate-400)；指針與中心點連動高對比主題色。
* **Range Slider (`input[type="range"]`)**：軌道在亮色模式切換為 `rgba(0, 0, 0, 0.1)` 淺灰背景，滑塊顏色連動高對比深色階並帶亮白邊框。
* **分段控制器 (Segmented Controls)**：未選中 Hover 採用 `hover:text-text-main`（嚴禁寫死 `hover:text-white`）；選中狀態於亮色模式套用 12% 透明度深色背景與 40% 邊框。
* **Toast 彈窗反饋**：暗色模式 `bg-[themeColor]/20 border-[themeColor]/40 text-white`；亮色模式 `bg-white/95 border-[darkThemeColor]/40 text-[darkThemeColor]`，確保對比度 > 4.5:1。
* **Canvas 動態圖表**：動態偵測 `document.documentElement.getAttribute('data-theme') === 'light'`，暗色模式使用極黑霓虹漸層，亮色模式切換為清亮水晶色與 Slate 灰網格刻度線 (`rgba(203, 213, 225, 0.8)`)。
* **多層子組件全面覆蓋 (Deep Sub-Tab Rule)**：多子頁籤 (Sub-Tabs)、Modal 彈窗或複雜子表單，必須逐一適配子頁面與 Dropzone，嚴禁殘留任何寫死的黑底或未降階霓虹字。

---

## 五、 向量 SVG 圖示標準 (SVG Icons over Emojis)

1. **全面禁用原生 Emoji**：
   - 嚴禁在按鈕、區塊標題、上傳 Dropzone、標籤、控制介面或 FAQ 內文中直接使用作業系統原生 Emoji（如 ⚠️, 📈, ⚡, ☕, ☀️, 🌙 等）。
   - 原生 Emoji 在不同 OS（Windows、macOS、iOS、Android）呈現效果不一，且無法適配主題發光與顏色連動。
2. **採用極簡向量 Inline SVG**：
   - 介面圖示一律採用精簡原生 Inline SVG 或 Lucide/Heroicons 規格之向量圖示。
3. **主題色動態連動 (Theme-aware SVG)**：
   - SVG 之 `fill` 或 `stroke` 屬性統一採用 `currentColor` 或連動主題色 `text-[var(--theme-color)]`，使其能自動隨主題色與亮暗模式流暢變換。
