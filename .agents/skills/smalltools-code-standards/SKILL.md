---
name: smalltools-code-standards
description: 適用於 Smalltools 專案的 Tailwind v4 樣式規範、W3C 無障礙 (A11y)、React useId()、行動端 RWD (表格轉直式卡片) 與表單輸入格式化編碼細節。
---

# Smalltools 編碼細節、無障礙與行動端 RWD 規範 (Coding & Accessibility Standards)

本文件定義 Smalltools 工具庫專案在 Tailwind v4 CSS 架構、W3C 無障礙標籤、行動端流體響應（包含多欄表格轉直式卡片）以及表單輸入格式化等前端編碼標準。

---

## 一、 Tailwind v4 CSS-First 與 Cascade Layer 避坑原則 (CRITICAL)

1. **Cascade Layer 優先原則**：專案採用 Tailwind v4 `@import 'tailwindcss';` 與 `@theme` 宣告。
2. **全域 Reset 禁忌**：
   - **嚴禁在 CSS 頂層撰寫 unlayered 全域重設（如 `*, ::before, ::after { margin: 0; padding: 0; }`）**。
   - 在 Tailwind v4 的 Cascade Layers 機制中，未宣告 Layer 的頂層重設權重高於 Utilities Layer，會導致全站 `.p-8`、`.p-6` 等 Utility padding 被強制歸零並引發「文字貼邊死擠」Bug。
   - **所有全域重設必須包裹於 `@layer base { ... }` 內**。

---

## 二、 W3C 無障礙 (Accessibility) 與 React `useId()` 規範

### 1. Label 與 Input 嚴格成對
* 所有表單控制項之 `<label>` 必須設置 `htmlFor={inputId}`，且對應的 `<input>` / `<select>` / `<textarea>` 必須宣告 `id={inputId}`。
* 為防範 SSR 與 React Client Hydration 時產生 ID 不一致警告，必須統一使用 React 的 `useId()` 鉤子生成唯一元素 ID：
  ```typescript
  const inputId = useId();
  ```

### 2. `<label>` 語意嚴格性防錯
* `<label>` 必須且只能搭配具備對應 `id` 的輸入控制項。
* 若區域僅為標籤標題、按鈕組（如多選模式切換、預設 Preset 按鈕、Checkbox 列表），**嚴禁使用 `<label>` 包裹無 `id` 的區塊**，否則會破壞 DOM accessibility 樹。應統一改用 `<span>` 或 `<legend>`，並配置字色 `text-text-sub`。

### 3. 無障礙隱藏標籤規範 (`sr-only` Label Pattern)
* 若卡片或工具列為保持極簡 UI 未顯示視覺文字標籤（如表格列內動態下拉選單、縮放控制鈕）：
  ```tsx
  const selectId = useId();
  // ...
  <label htmlFor={selectId} className="sr-only">選擇操作類型</label>
  <select id={selectId} ...>
  ```
* 兼顧極簡視覺設計與 W3C Accessibility 螢幕閱讀器友善標準。

---

## 三、 行動端流體響應、橫向滾動與「表格轉直式卡片」規範

### 1. 容器防強行撐開 (Min-Width 0)
* 所有 Grid Item、Flex 容器或結果區塊必須顯式設定 `min-width: 0`，防止內部長字串或等寬 Monospace 數據在窄螢幕上強行撐破父容器版面。

### 2. 手機版「表格轉直式卡片」大原則 (Responsive Table-to-Card Standard)
* **電腦 / 平板端 (`sm:` 斷點以上)**：採用標準多欄語意表格 (`<table className="hidden sm:table w-full...">`)，提供宏觀完整的數據對照。
* **手機窄螢幕端 (`<sm`)**：**轉為垂直直式小卡片清單** (`<div className="block sm:hidden space-y-2">`)，將「欄位名稱 / 類型徽章 / 數值內容 / 操作按鈕」改為由上而下直式堆疊排列。
* **優點**：徹底免除手機使用者在窄螢幕上必須反覆左右滑動多欄表格的挫折感，提供單手即可自然下滑瀏覽的極致行動端體驗。

### 3. 大型固定表格橫向滾動與首欄凍結
若特定大型複雜報表必須維持表格結構：
* **包裹容器**：外層必須宣告 `width: 100%; max-width: 100%; overflow-x: auto;`。
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
* **亮色模式凍結欄與 `th` 置頂色特化**：
  ```css
  :global([data-theme='light']) .customTable th,
  :global([data-theme='light']) .stickyPeriod {
    background-color: #f1f5f9 !important; /* Slate 100 */
    color: #334155 !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  ```
  嚴禁寫死暗色背景，防範亮色模式橫向捲動時出現深黑影子切斷版面。

### 4. 欄位「原地切換查看與單項微型複製」原則 (In-Place Peek & Copy Pattern)
* 凡介面中呈現被遮罩、脫敏、截斷或格式化之數據欄位，應於該列或卡片右側整合「原地切換檢視」與「獨立微型複製按鈕」。
* 點擊複製後觸發 1.8 秒的輕量文字切換提示（如 `複製` ➔ `已複製`），給予即時操作回饋。

---

## 四、 表單輸入控制項細節與即時格式化規範

### 1. 金額與貨幣輸入框即時千分位格式化 (Formatted Currency Input Standard)
* 凡涉及金額、本金、貸款額度、定期定額、薪資或資金輸入框，統一採用 `type="text"` 搭配 `inputMode="numeric"`。
* **即時視覺千分位**：`value={amount === '' ? '' : amount.toLocaleString('zh-TW')}`，使數字在輸入時即時呈現千分位逗號（如 `1,000,000`）。
* **防呆解析與輸入處理**：
  ```typescript
  onChange={(e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setAmount(raw === '' ? '' : parseInt(raw, 10));
  }}
  ```
  兼顧無縫輸入、全選清空與剪貼簿貼上。

### 2. `number | ''` 輸入框狀態型態與清空防卡 0 原則 (Clean Input State Pattern)
* 表單輸入框 state 狀態型態統一宣告為 `number | ''`（例如 `const [amount, setAmount] = useState<number | ''>(50000)`）。
* 當使用者全選刪除文字時，state 設為 `''`，輸入框維持乾淨清空狀態（不會強行補 `0` 在最前面）。
* 於計算邏輯中防呆轉譯為 `0`：`const numAmount = amount === '' ? 0 : amount;`，避免產生 `NaN` 錯誤。

### 3. 下拉選單與日期選擇器語意化適配
* 所有 `<select>` 與 `<option>` 控制項背景統一套用語意類別 **`bg-select-bg`**（連動 `--select-bg`）與文字 `var(--text-primary)`，全站嚴禁在組件中硬編碼寫死色碼。
* 原生日期與時間輸入框 `input[type="date"]` 與 `input[type="datetime-local"]` 必須宣告 **`[color-scheme:dark]`**，確保彈出的 Date Picker 自動連動暗色系。

---

## 五、 全站 Typography 字級階層與 iOS Auto-Zoom 防護

1. **表單輸入框 14px 規範 (iOS Safari Auto-Zoom 防護)**：
   - 所有表單輸入框 (`<input>` / `<textarea>`)、下拉選單、Monospace 代碼字級一律保持 **14px (`text-sm` / `0.875rem`)**。
   - **嚴禁將輸入框字級設為 `< 13px`**，防範 iOS Safari 聚焦輸入框時觸發視埠自動強行放大 (Auto-zoom Bug)。
2. **表單標籤 (Form Labels)**：
   - 統一採用 **`text-sm font-medium text-text-sub`** (14px)，符合 WCAG 2.1 行動端可讀性標準。
3. **指標看板標題 (Stat Card Titles)**：
   - 核心數據或統計看板之卡片標題一律採用 **`text-sm font-semibold text-text-sub`** (14px 粗體醒目化)，嚴禁使用 12px 微縮字級。
4. **按鈕與模式切換 (Buttons & Tabs)**：
   - 操作按鈕、模式切換鈕與語系切換鈕一律維持 **13px~14px (`0.8125rem`~`0.875rem` / `text-sm font-semibold` 或 `font-medium`)**，提升觸碰熱區。
5. **描述文案與次要備註**：
   - 頁面說明文案採用 **16px (`text-base text-text-sub`)**；次要備註至少保持 **12px (`text-xs text-text-sub`)**。
6. **時鐘與 Monospace 動態數據防爆框**：
   - 父層容器宣告 `min-width: 0`；文字包裹 `truncate`，防止窄螢幕橫向爆框。

---

## 六、 金融計算求解演算法與 Windows 編碼防護

### 1. 金融/計算工具求解標準 (APR Bisection Solver)
* 凡包含手續費/開辦費攤提之貸款試算，必須提供實質年利率 (APR) 試算。採用 **二分搜尋法 (Bisection Method)** 求解折現淨現值 (NPV = 0) 之內含報酬率 (IRR)。
* 本息/本金均攤模擬計算時，最後一期期末餘額需手動強制設定為 `0`，消弭 JS 底層浮點數殘留誤差。

### 2. Windows UTF-8 編碼保護避坑原則
* 在 Windows 環境下避免使用 PowerShell 預設管道（如 `Get-Content | Set-Content`），防止將 TypeScript/JSX 中的繁體中文字串轉為 ANSI/OEM 亂碼 (`?`)。必須確保所有原始碼檔案儲存為無 BOM 之 UTF-8 編碼。
