---
name: smalltools-code-standards
description: Smalltools 專案專屬的 Tailwind v4 Cascade Layer 避坑、行動端「表格轉直式卡片」與首欄凍結、表單即時千分位與 number|'' 狀態、字級階層與 iOS Auto-Zoom 防護、APR 二分求解與 Windows UTF-8 編碼防護、Canvas 排版留白。
---

# Smalltools 編碼細節、行動端 RWD 與工具運算規範

> 通用規範（A11y `useId()` 對稱綁定、零原生 Emoji、雙模色彩控制項、防禦性程式設計、效能與主執行緒防護）見 `C:\PG\AGENTS.md` 與 `C:\PG\skills\frontend-architecture-ui`。本手冊只列 Smalltools 專屬細節。

---

## 一、 Tailwind v4 CSS-First 與 Cascade Layer 避坑原則 (CRITICAL)

1. **Cascade Layer 優先原則**：專案採用 Tailwind v4 `@import 'tailwindcss';` 與 `@theme` 宣告。
2. **全域 Reset 禁忌**：
   - **嚴禁在 CSS 頂層撰寫 unlayered 全域重設（如 `*, ::before, ::after { margin: 0; padding: 0; }`）**。
   - 在 Tailwind v4 的 Cascade Layers 機制中，未宣告 Layer 的頂層重設權重高於 Utilities Layer，會導致全站 `.p-8`、`.p-6` 等 Utility padding 被強制歸零並引發「文字貼邊死擠」Bug。
   - **所有全域重設必須包裹於 `@layer base { ... }` 內**。

---

## 二、 A11y `<label>` 語意嚴格性（專案補充）

通用的 `useId()` + `<label htmlFor>` 對稱綁定、圖示按鈕 `aria-label` / `.sr-only` 見全域規範。本專案額外注意：

* `<label>` 必須且只能搭配具備對應 `id` 的輸入控制項。**若區域僅為標籤標題、按鈕組（多選模式切換、Preset 按鈕、Checkbox 列表），嚴禁用 `<label>` 包裹無 `id` 的區塊**，否則破壞 DOM accessibility 樹；統一改用 `<span>` 或 `<legend>`，字色 `text-text-sub`。
* 極簡 UI 未顯示視覺文字標籤時（表格列內動態下拉、縮放控制鈕），用 `sr-only` label：`<label htmlFor={selectId} className="sr-only">選擇操作類型</label>`。

---

## 三、 行動端流體響應、橫向滾動與「表格轉直式卡片」規範

### 1. 容器防強行撐開 (Min-Width 0)
* 所有 Grid Item、Flex 容器或結果區塊必須顯式設定 `min-width: 0`，防止內部長字串或等寬 Monospace 數據在窄螢幕上強行撐破父容器版面。

### 2. 手機版「表格轉直式卡片」大原則 (Responsive Table-to-Card Standard)
* **電腦 / 平板端 (`sm:` 斷點以上)**：採用標準多欄語意表格 (`<table className="hidden sm:table w-full...">`)，提供宏觀完整的數據對照。
* **手機窄螢幕端 (`<sm`)**：**轉為垂直直式小卡片清單** (`<div className="block sm:hidden space-y-2">`)，將「欄位名稱 / 類型徽章 / 數值內容 / 操作按鈕」改為由上而下直式堆疊排列。
* **優點**：徹底免除手機使用者在窄螢幕上反覆左右滑動多欄表格的挫折感，提供單手下滑瀏覽的行動端體驗。

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

### 5. 手機版「垂直時間軸轉全寬三層式卡片」原則 (Responsive Timeline-to-Card Standard)
* **手機窄螢幕端 (`< 640px`)**：隱藏左側時間軸軌道與圓點（`padding-left: 0`、`.timeline::before { display: none }`），改為全寬卡片搭配**左側 4px 狀態色條**（`border-left-width: 4px`，依已完成、當前、即將到來變色），釋放 32px+ 水平可視空間。
* **電腦 / 平板端 (`>= 640px`)**：恢復左側時間軸垂直導線與圓形節點（`padding-left: 2.25rem`）。
* **卡片內部三層式結構**：
  1. **頂欄（Metadata Row）**：左側放「週數 / 階段膠囊標籤」與「等寬日期區間」，右側放「狀態徽章」，嚴禁與長標題混排於同一行。
  2. **中欄（Title & Summary）**：主標題維持 `16px` (`text-base font-bold`) 獨立成行不擠壓，下方搭配精簡說明。
  3. **底欄（Checkpoints Grid）**：將長段落拆解為結構化細項網格（手機單欄滿版、平板以上 `sm:grid-cols-2` 雙欄），右側可附帶高對比屬性小標籤（如公費 / 自費）。

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

### 4. URL 參數數值解析與物理上限防護 (Number.isFinite & Upper Bounds)
* **嚴禁僅用 `!isNaN(Number(val))` 判定 URL 數字參數**：在 JavaScript 中 `Number('Infinity') === Infinity` 且 `!isNaN(Infinity)` 為真！若未過濾，將導致還款展開迴圈 `for (let k = 0; k < totalMonths; k++)` 條件永遠成立，主執行緒永久凍結崩潰。
* 數值轉換一律強制使用 `Number.isFinite(n)`，並配合業務邏輯加上合理的物理上限（例如房貸 70 年 / 840 期、車貸 30 年 / 360 期），保留因應條文調整之彈性，同時根除極值死迴圈。

### 5. Web Storage 安全存取與反序列化 Array.isArray 守衛 (Safe Storage Pattern)
* **全站 Storage 安全存取**：在 Safari 隱私模式或受限 WebView 中，調用 `sessionStorage.setItem` / `localStorage` 會直接拋出 `SecurityError`。全站應使用 `app/utils/storage.ts` 封裝的 `safeLocalStorage` 與 `safeSessionStorage`，避免點擊返回等操作中斷報錯。
* **反序列化型別守衛**：從 Storage 取得資料並以 `JSON.parse()` 還原後，**必須先以 `Array.isArray(parsed)` 進行型別校驗**，防止使用者端快取損毀或被寫入非陣列物件時，在渲染層執行 `.map()` / `.filter()` 引發未捕獲之 TypeError 導致整頁白畫面。

---

## 五、 全站 Typography 字級階層與 iOS Auto-Zoom 防護

1. **表單輸入框 14px 規範 (iOS Safari Auto-Zoom 防護)**：
   - 所有表單輸入框 (`<input>` / `<textarea>`)、下拉選單、Monospace 代碼字級一律保持 **14px (`text-sm` / `0.875rem`)**。
   - **嚴禁將輸入框字級設為 `< 13px`**，防範 iOS Safari 聚焦輸入框時觸發視埠自動強行放大 (Auto-zoom Bug)。
2. **表單標籤 (Form Labels)**：統一採用 **`text-sm font-medium text-text-sub`** (14px)，符合 WCAG 2.1 行動端可讀性標準。
3. **指標看板標題 (Stat Card Titles)**：一律採用 **`text-sm font-semibold text-text-sub`** (14px 粗體醒目化)，嚴禁使用 12px 微縮字級。
4. **按鈕與模式切換 (Buttons & Tabs)**：一律維持 **13px~14px (`0.8125rem`~`0.875rem` / `text-sm font-semibold` 或 `font-medium`)**，提升觸碰熱區。
5. **描述文案與次要備註**：頁面說明文案採用 **16px (`text-base text-text-sub`)**；次要備註至少保持 **12px (`text-xs text-text-sub`)**。
6. **時鐘與 Monospace 動態數據防爆框**：父層容器宣告 `min-width: 0`；文字包裹 `truncate`，防止窄螢幕橫向爆框。

---

## 六、 金融計算求解演算法與 Windows 編碼防護

### 1. 金融/計算工具求解標準 (APR Bisection Solver)
* 凡包含手續費/開辦費攤提之貸款試算，必須提供實質年利率 (APR) 試算。採用 **二分搜尋法 (Bisection Method)** 求解折現淨現值 (NPV = 0) 之內含報酬率 (IRR)。
* 本息/本金均攤模擬計算時，最後一期期末餘額需手動強制設定為 `0`，消弭 JS 底層浮點數殘留誤差。
* 金額運算依全域規範走 `bignumber.js` 鏈式運算，見 `C:\PG\skills\precision-finance-timezone`。

### 2. Windows UTF-8 編碼保護避坑原則
* 在 Windows 環境下避免使用 PowerShell 預設管道（如 `Get-Content | Set-Content`），防止將 TypeScript/JSX 中的繁體中文字串轉為 ANSI/OEM 亂碼 (`?`)。必須確保所有原始碼檔案儲存為無 BOM 之 UTF-8 編碼。
* 測試若要用 regex 解析簽出的文字檔（如 `infra/site.yml`），讀檔後先 `.replace(/\r\n/g, '\n')`：Windows 的 `core.autocrlf` 會把檔案簽出成 CRLF，只寫 `\n` 的 regex 在 CI 會過、在本機卻會失敗。
* 在 Bash 工具裡用 heredoc 或 `sed` 寫入含反斜線的 regex（`\b`、`\n`、`\`）時，反斜線常被吃掉或轉成控制字元（如 `\b` 變成 0x08）。這類內容要用檔案編輯工具寫，或用 `String.raw` 寫成獨立的 Node 腳本。

### 3. 股票質押連續跌停板複利推算與擔保品追加整數標準
* **台股單日 10% 跌停板複利天數換算**：
  - 容許跌幅 $D$（百分比）換算為可承受跌停板天數 $n$，採複利模型 $(1 - 0.1)^n = 1 - D / 100$：
  - 算式：$n = \frac{\ln(1 - D / 100)}{\ln(0.9)}$。當 $D \le 0$ 時 $n = 0$；$D \ge 99.9$ 時夾在安全上限 99，結果精確保留一位小數（如 2.4 根跌停板）。
* **追加擔保品整數進位防護**：
  - 當整戶維持率低於安全門檻需追加現股擔保品時，計算需追加股數與張數必須採 **無條件進位 (ROUND_CEIL)**：
    `cashAmount.div(collateralPrice).integerValue(BigNumber.ROUND_CEIL)`
  - 確保投資人追加該數量股票後，市值必定能拉回安全門檻，絕不因浮點捨去而產生 $159.99\%$ 差一股告急的風險。

---

## 七、 Canvas / 動態圖形排版安全呼吸留白 (Canvas Safe Margins)

* 在 Canvas 2D / SVG 等動態排版場景中，頁尾元素（如 Logo、作者署名、發布日期）：
  - 必須動態依據 Logo 尺寸與畫布高度計算安全底邊距：`Math.max(innerPad * 0.75, logoSize * 0.5 + 32)`。
  - **嚴禁使用靜態微縮邊距**（如 5px~10px），防範大尺寸 Logo 或頭像貼齊外框邊界造成視覺擁擠。
* **轉盤扇區安全隨機落點與拉霸機 Payline 固定步進對齊**：
  - 圓形轉盤計算目標旋轉角度時，應於命中扇區中心角基礎上加入 `±36%` 扇區寬度內之安全隨機偏移（`jitterOffset = (unit - 0.5) * 0.72 * angleSpan`），兼顧真實擦邊物理感與不壓線無爭議性。
  - 拉霸機（Slot Machine）滾輪帶在一般視窗與全螢幕舞台必須維持同一套內部像素座標系（如視窗高 `270px`、卡片高 `66px` + 間距 `10px` = 步進 `76px`），以 `targetTranslateY = windowHalf - (firstCardCenter + winIdx * stride)` 精準停靠於紅線正中央，嚴禁讓全螢幕容器改用 `vh` 動態高度卻沿用固定像素位移常數。

---

## 八、 巨量資料與高效運算效能規範 (High Performance & Anti-Lag Guidelines)

### 1. 二進位大型 Buffer 自 React State 抽離 (Binary Buffer Isolation)
* 處理 PDF、音訊、高解析度圖檔等二進位大型資料時，**嚴禁將數十 MB 的 `ArrayBuffer` 或 `Uint8Array` 直接存入 React State**（如 `pages: { buffer: ArrayBuffer }[]`）。
* React State 在卡片拖曳排序、勾選、選取時會反覆觸發 shallow copy 或 clone，造成記憶體成倍飆升，極易引發行動端或低階裝置瀏覽器 OOM 閃退。
* **標準實作**：以 `useRef<Map<string, ArrayBuffer>>(new Map())` 作為外部記憶體池，State 僅儲存輕量的純資料元數據（`fileId`, `pageIndex`, `rotation`, `thumbnailUrl`）；當項目被刪除或重置時，主動自 Map 快取釋放（GC）對應二進位快取。

### 2. 批次處理單次狀態提交 (Batch Dispatching)
* 多頁文件解析（如 100 頁 PDF 或千筆日誌匯入）時，**嚴禁在非同步迴圈內逐項呼叫 `setState(prev => [...prev, item])`**。
* 逐項 setState 會觸發 $O(N^2)$ 的組件全量 re-render，導致主執行緒在解析期間完全凍結死鎖。
* **標準實作**：在迴圈中收集於本地陣列，解析完成或依檔案為單位整批單次派發 `setPages(prev => [...prev, ...newItemsBatch])`。

### 3. 萬行文字比對與日誌虛擬滾動 (Virtualization & Spacer Fallback)
* 當表格、日誌或代碼差異比對行數超過 120 行時，**嚴禁一次性向 DOM 注入數千至數萬個 `<tr>` / `<div>` 節點**。
* 採用輕量切片虛擬滾動演算法（Virtual Scrolling）：
  - 依據固定行高（如 24px）與目前 `scrollTop`，計算可見視窗行索引並保留上下 25 行 overscan 緩衝。
  - 上下各以單一 `<tr style={{ height: spacer }}>` 撐開滾動軸，既能保留 100% 原生滾動條外觀與手感，又能將活體 DOM 節點恆定壓制在 80 個以內，維持 60 FPS 流暢度。

### 4. 單次巡訪（Single Pass）零記憶體配置文字統計
* 純文字分析工具（如字數、中文字元、英文字母、數字、符號、空白、行數統計），**嚴禁串列呼叫 10 次全文本正則匹配**（如 `text.match(/.../g)?.length`）或 `text.split()`。
* 這類操作在大文本（10 萬字以上）下會瞬間產出數十萬個短暫字串物件，觸發頻繁 Garbage Collection 與 100ms+ 主執行緒卡頓。
* **標準實作**：採用單次 `for...of` 或字元碼點巡訪（Single Pass $O(N)$），以計數器整併所有統計維度，達成零記憶體中介配置，運算耗時壓制在 3ms 以內。

### 5. 巨量文本高亮與標記安全截斷
* 在封包清洗器（HAR Cleaner）或 JSON/文字搜尋高亮中，若遭遇數十萬字元之 Payload，**嚴禁無上限向全文字串執行正則切割並生成 `<mark>` 標籤**。
* 必須設定可見字符長度防護（如超過 10 萬字元只高亮前半段，其餘直接渲染或提示過長截斷），防範成千上萬個 DOM 節點導致瀏覽器排版引擎當機。

---

## 九、 檔案讀取、上傳控制項與計時器生命週期規範 (File Handling & Timer Lifecycle)

### 1. FileReader 與 Image 異常捕獲對稱性 (Error Handling Symmetry)
* 瀏覽器端使用 `new FileReader()` 時，**嚴禁僅監聽 `onload`**。
* 當檔案權限受限、被其他系統處理序鎖定、中途被拔除 USB 或讀取中斷時，`onload` 永遠不會被觸發，導致元件的 `loading` 骨架屏或狀態旗標永久懸掛。
* **標準實作**：凡宣告 `reader.onload`，必須同時宣告 `reader.onerror` 與 `reader.onabort`，向使用者顯示清晰錯誤 Toast 並重置 Loading 狀態。同理，使用 `new Image()` 解析 DataURL 或圖片 Blob 時，亦必須對稱監聽 `img.onerror`。

### 2. `<input type="file">` 處理後即刻重置 `e.target.value = ''`
* 原生 HTML 檔案上傳輸入框在選取相同檔案時，不會觸發 `onChange` 事件。
* 若使用者清空檔案佇列或遭遇解析錯誤後，試圖重新選取同名檔案，將直接進入「點選無反應」的操作死胡同。
* **標準實作**：在 `onChange` 事件回呼的結尾，強制將 `e.target.value = ''` 清空，確保下一次選取同名檔案時依然能順利觸發變更事件。

### 3. 圖狀結構與憑證鏈尋訪之有界防護 (Bounded Graph Traversal)
* 尋訪父子相依結構（如 X.509 憑證鏈尋找發證者、組織樹、相依套件）時，**嚴禁僅依賴終止狀態（如 `isRoot`）作為唯一跳出條件**。
* 當遭遇交叉簽署憑證（Cross-Signed Certificates）或相互參照時，狀態會在多個節點間反覆跳躍引發無窮迴圈（UI 凍結死鎖）。
* **標準實作**：
  1. 宣告 `visited = new Set()` 追蹤造訪歷史，已納入鏈條的節點嚴禁二度拜訪。
  2. 設定實務合理的物理上限門檻（如 `chain.length < MAX_CHAIN_DEPTH = 10`）。

### 4. Toast 與動態計時器防抖及卸載清理 (Timer Debouncing & Cleanup)
* 宣告 Toast 提示或動畫延遲時，**嚴禁直接呼叫 `setTimeout` 而未由 `useRef` 追蹤**。
* 連續觸發時，前次計時器若未被清除，會導致後續剛彈出的新 Toast 在數毫秒內被舊的定時器強制關閉。
* **標準實作**：使用 `toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`，在 `showToast` 開頭 `if (toastTimerRef.current) clearTimeout(toastTimerRef.current);`，並在元件卸載生命週期（`useEffect` return）中清空所有進行中的定時器。

---

## 十、 套件升級相容性與生態系鎖定原則 (Package Upgrade & Ecosystem Compatibility)

在執行全站依賴升級（如 `ncu -u`）時，必須遵守以下生態系約束，嚴禁破壞建置與型別檢查閉環：

### 1. ESLint 9 vs 10 跨版本 Peer 衝突防護
* `eslint-config-next` 內建的官方/社群外掛（如 `eslint-plugin-react`、`eslint-plugin-jsx-a11y`、`eslint-plugin-import`）通常落後於 ESLint 頂層大版本。
* 升級套件時若將 `eslint` 盲目升至 10.x，會引發多個 Peer Dependency ERESOLVE 衝突與執行期崩潰。應鎖定在最新穩定分支（如 `^9.39.x`）。

### 2. TypeScript 6 vs 7 與 `typescript-eslint` 支援度
* `eslint-config-next` 內嵌之 `typescript-eslint` 核心對 TypeScript 主版號有剛性邊界限制。
* 升級至 TS 7.0 會在 ESLint 階段擲出 `Error: typescript-eslint does not support TS 7.0` 致命錯誤。TypeScript 版本需維持在 `^6.0.x`，待官方支援釋出後再平滑升級。

### 3. React Compiler 建議規則在 `eslint.config.mjs` 的降階防禦
* 升級 `eslint-config-next` v16 之後，React Compiler 規則（如 `react-hooks/preserve-manual-memoization`）可能預設升級為 Error。
* 當手動 `useCallback` 依賴項未列入無害的 `setState` 時，編譯器會報錯阻斷 CI。
* **標準實作**：在 `eslint.config.mjs` 中將 React Compiler 建議性規則（`react-hooks/set-state-in-effect`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`）降為 `'warn'`，保留檢查訊號但不中斷打包。

### 4. `js-yaml` v4 與 v5 破壞性 API 重構避坑
* `js-yaml` v5 移除了 `yaml.DEFAULT_SCHEMA.extend` 與 `new yaml.Type`，亦取消了預設匯出（Default Export）。
* 專案內針對 CloudFormation（`!Sub`, `!Ref` 等標籤）之自訂 Schema 契約需維持在 `js-yaml: "^4.3.2"` 穩定分支。
