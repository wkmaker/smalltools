---
name: smalltools-dev-architecture
description: 適用於 Smalltools 專案的 Next.js App Router 架構、狀態管理、URL 雙向同步、高效能運算 (JIT / 非阻塞時間片釋放) 與非同步競態防護規範。
---

# Smalltools 核心架構、狀態連動與效能規範 (Architecture, State & Performance)

本文件定義 Smalltools 工具庫專案的系統架構、Next.js App Router 檔案組織、URL 雙向狀態連動、高效能運算調優以及非同步安全防護標準。

---

## 一、 Next.js App Router 檔案組織三層架構規範

全站工具頁面統一採用嚴格的「三層分離架構」：

```text
app/[tool-name]/
├── page.tsx                 # 1. 伺服器端渲染 (SSR)：SEO Metadata、Canonical、Schema.org JSON-LD
├── [ToolName]Client.tsx     # 2. 客戶端渲染 ('use client')：UI 互動、狀態管理、Canvas、計算邏輯
├── [tool-name].module.css   # 3. 專屬樣式模組：CSS Module 亮暗模式特化、Sticky 佈局
└── config/                  # 4. (選用) 靜態 JSON 規則大表或配置檔
```

### 職責分工原則：
1. **`app/[tool-name]/page.tsx` (SSR)**：
   - 負責輸出完整的 SEO `Metadata`（包含 `alternates.canonical` 設定為 `https://tools.cjkuo.net/[tool-name]/`）、OpenGraph 與 Twitter Card。
   - 注入結構化資料 Schema.org `FAQPage` JSON-LD 腳本。
   - 伺服器端靜態預渲染，禁止在 `page.tsx` 混入 Client 互動狀態。
2. **`app/[tool-name]/[ToolName]Client.tsx` (Client)**：
   - 檔案頂部宣告 `'use client'`。
   - 接收 `lang?: 'zh-TW' | 'en'` 屬性，負責 UI 狀態、事件處理、動態計算、Canvas 圖表繪製與 URL 雙向同步。
3. **`app/[tool-name]/[tool-name].module.css` (CSS Module)**：
   - 集中管理該工具特有的排版樣式（如 Sticky 明細欄、專屬 Toggle 按鈕、表格置頂色）。
4. **靜態資產與導出規範**：
   - 所有全站靜態圖片與根目錄資產統一存放於 `public/` 目錄，保證 `output: 'export'` 靜態導出時 100% 複製至 `out/`。
   - `app/layout.tsx` 必須配置 `metadataBase: new URL('https://tools.cjkuo.net')`，確保相對路徑自動轉為絕對網址。
   - 重構完成的舊版獨立 HTML/JS 統一歸檔至根目錄 `legacy/`。

---

## 二、 網址參數雙向狀態連動與防呆解析原則

### 1. 正向連動（無感更新網址）
* **無感更新網址**：嚴禁使用會引發整頁重新載入的 `window.location.href`。必須使用 `window.history.replaceState(null, '', '?' + params.toString())` 更新網址 Query。
* **防抖同步**：文字輸入時使用 300ms 防抖更新；下拉選單、模式切換等即時事件則立即同步。

### 2. `isMountedRef` 初始化防護 (Hydration Safety)
* **避免覆蓋 URL 參數**：初次掛載讀取 `window.location.search` 進行反向解析與 `setState` 後，必須將 `isMountedRef.current` 標記為 `true`。
* **守衛更新**：正向連動的 `useEffect` 必須確認 `isMountedRef.current === true` 才執行 `replaceState`，徹底防範初次渲染的預設 state 反向覆蓋使用者在 URL 中帶入的 Query 參數。

### 3. 反向解析與安全 Fallback
* 讀取 `window.location.search` 時，必須使用 `safeParse` 或範圍邊界校驗。
* 若參數非法、缺失或超出合理邊界，必須安全回退至預設值，絕不能導致 React Client Hydration 崩潰。

### 4. 工具類型選擇性排除原則 (Selective Exclusion)
* **必須啟用**：包含多欄位參數試算、模擬器、過濾條件的金融理財與計算類工具，必須實作 URL 雙向狀態同步。
* **選擇性不啟用**：針對純單向輸入輸出、文件/文字轉換、一次性密碼生成或大檔案處理工具（如 Base64、URL 編解碼、密碼產生器、JSON 格式化、SSL 轉換器），應選擇性不啟用 URL 參數雙向連動，保持網址潔淨並消除無謂的同步負擔。

---

## 三、 高效能運算與主執行緒防卡死原則 (Main-Thread Safeguard)

凡涉及多檔案、高解析度圖像、文字 Diff、大數據處理或複雜運算，**嚴禁連續霸佔 JavaScript 主執行緒 (Main Thread)** 引發 UI 畫面凍結或動畫掉幀。

### 1. 預覽與導出分離原則 (Preview vs Export Separation)
* 參數即時調整時，採用低解析度或降級預覽（保證響應時間 `< 100ms`）。
* 僅在使用者明確點擊「下載」、「匯出」或「複製」按鈕時，才執行 JIT (Just-In-Time) 高負載真實運算，並在按鈕上展現 Loading 動畫。

### 2. 非阻塞時間片釋放 (Yielding Chunk Processing)
* 處理或生成大數據（如 IP 清冊、批量格式轉換、大量字串比對）時，必須採用非同步分塊處理。
* 例如每處理 10,000 ~ 20,000 筆數據，透過 `setTimeout(processChunk, 0)` 或 `requestIdleCallback` 釋放主執行緒時間片，維持畫面 60fps 滑順響應與動態進度回饋。

### 3. 巨量列表切片漸進式載入 (Paginated Chunked Rendering)
* 在檢視或渲染超過數百筆至數千筆數據/請求列表時，應採用切片分頁載入（如每頁 50 筆動態展開）。
* **嚴禁一次性將數千個 DOM 節點塞入畫面**，以大幅節省記憶體並消除捲動卡頓。

### 4. 高頻連動輸入防抖 (Debounced Input State)
* 凡使用者文字輸入框會連動觸發整頁重新計算、正規過濾、搜尋比對或非同步運算（如自訂關鍵字、字串替換），客戶端組件必須實作本地輸入緩存並搭配 300ms Debounce 防抖更新，防範每次擊鍵引發巨量重算卡死主執行緒。

### 5. 巨量數據與演算法上限保護
* 針對文字比對 (Diff)、大檔案編解碼 (Base64) 或高複雜度運算，必須設定字串長度與檔案大小上限（如 10MB 或 3,000,000 字元）。超出時給予截斷或分區預覽，兼顧 100% 完整匯出與極速 UI 渲染。
* **Excel 匯出相容性 (UTF-8 BOM)**：CSV 匯出檔首行必須顯式寫入 `\uFEFF` (UTF-8 BOM) 標頭，確保 Microsoft Excel 在 Windows 環境下開啟時無亂碼。

### 6. GPU 加速與動畫幀節流
* 隨游標拖曳或頻繁變更的 DOM 樣式，使用 CSS `will-change: transform` 與 `transform: translateZ(0)` 創建獨立 GPU 圖層。
* 將樣式更新放入 `requestAnimationFrame` 進行節流。

---

## 四、 檢視視窗 (Lightbox / Modal) 隔離與 JIT 規範

1. **DOM Portal 頂層隔離**：所有彈出式 Lightbox / Modal / 大圖檢視器統一使用 React Portal (`createPortal`) 渲染至 `document.body` 頂層，徹底擺脫外層容器邊界與 CSS 堆疊上下文 (Stacking Context) 之限制與遮擋。
2. **視埠動態適應 (Full-Viewport Responsive)**：檢視視窗必須隨螢幕視埠動態放大適應 (Viewport-Aware)，最大化擴展顯示區域，避免固定微縮小框。
3. **雙階動態畫質 (Two-Tier JIT Rendering)**：預覽縮圖採用低維度以極速載入；僅在點擊展開檢視時才動態觸發 JIT 高解析度無損渲染。
4. **無跳動控制介面 (Non-Shifting Controls)**：Modal 內部控制項（如縮放、重置、操作鈕）佈局必須絕對靜態固定，嚴禁隨狀態產生 Layout Shift 導致滑鼠連擊時誤觸。

---

## 五、 非同步任務與 API 請求競態防護 (Async Race & Abort Standard)

1. **宣告 Abort 引用**：凡涉及非同步檔案讀取 (`FileReader`) 或網路 HTTP/DoH API 查詢 (`fetch`) 的工具，組件內必須宣告 `activeReaderRef` / `activeAbortControllerRef`。
2. **中斷前次連線**：在發起新任務或使用者高頻打字/切換條件前，必須自動呼叫 `.abort()` 中斷前次連線，徹底消弭舊連線慢返回反向覆蓋最新視圖的 Race Condition。
3. **逾時防護**：針對 API 請求統一加上 8 秒 Timeout 逾時防護（`AbortSignal.timeout(8000)` 或使用 `AbortController` 結合 `setTimeout`）。

---

## 六、 UI 細部防護大原則

### 1. 歷史紀錄初始載入與「呼吸留白」原則 (Breathing Room)
* 頁面初次載入時，試算看板需即時呈現在畫面上，但**歷史紀錄區塊（若有）預設必須保持隱藏 (空陣列)**。
* **嚴禁在初次掛載的 `useEffect` 中將初始生成結果推送進歷史陣列**，必須僅在使用者手動點擊「重新生成/計算」按鈕時才紀錄舊資料，確保頁面剛開啟時右側保有超過 60% 的清爽留白。

### 2. Textarea 動態自適應高度零 Layout Shift 規範
* 動態計算 `<textarea>` 自適應高度時，嚴禁先將 `style.height = 'auto'` 重置後呼叫 `window.scrollTo`，防範 DOM 瞬間塌陷引發全頁面閃爍與 Layout Shift。應直接讀取 `scrollHeight` 並平滑更新高度。

### 3. 持續性與無縫拖曳上傳原則 (Persistent Drag-and-Drop UX)
* 凡具備檔案處理能力的小工具，載入初始檔案後**絕不可將 Drag & Drop 互動入口完全刪除**。
* 必須支援「全域拖曳感應 Overlay」與「列表底部輕量擴充 Dropzone」，保證使用者在任何操作階段皆能無縫拖曳追加新檔案。
* **多層級拖曳隔離**：當組件同時具備「檔案上傳」與「內部卡片排序」時，必須透過 DataTransfer 類型嚴格隔離，防止排序操作誤觸上傳浮層。

### 4. 中央工具註冊與 404 動態推薦機制
* 全站所有工具之路由、分類、主題向量 SVG 圖示與簡介統一收錄於 `app/config/tools.tsx`。
* 404 頁面 (`app/not-found.tsx`) 根據請求路徑自動判斷分類，優先推薦同類型工具，若不足 6 個則隨機補充填滿至 6 個。
