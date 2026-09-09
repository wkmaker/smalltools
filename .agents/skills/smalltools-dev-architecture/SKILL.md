---
name: smalltools-dev-architecture
description: Smalltools 專案專屬的 Next.js App Router 路徑慣例、網址參數雙向狀態連動與 isMountedRef 防護、中央工具註冊與 404 動態推薦、歷史紀錄「呼吸留白」與持續性拖曳上傳 UX。
---

# Smalltools 核心架構與狀態連動規範

> 通用規範見 `C:\PG\skills\frontend-architecture-ui`：三層分離架構、大型模組六分拆解法、**效能與主執行緒防護**（預覽/導出分離、分塊 yield、切片渲染、零拷貝索引、GPU 節流）、**彈出層 Portal 隔離與 JIT 渲染**、**非同步競態防護（AbortController / 8 秒逾時）**。本手冊只列 Smalltools 專屬細節。

---

## 一、 Next.js App Router 檔案組織（專案落地）

通用「三層分離」見全域規範。本專案慣例：

```text
app/[tool-name]/
├── page.tsx                 # SSR：SEO Metadata、Canonical、Schema.org FAQPage JSON-LD
├── en/page.tsx              # 英文語系獨立子路由
├── [ToolName]Client.tsx     # 'use client'，接收 lang?: 'zh-TW' | 'en'
├── [tool-name].module.css   # 亮暗模式特化、Sticky 佈局
└── config/                  # (選用) 靜態 JSON 規則大表
```

* **canonical 網域**：`alternates.canonical` 一律 `https://tools.cjkuo.net/[tool-name]/`；`app/layout.tsx` 設 `metadataBase: new URL('https://tools.cjkuo.net')`，確保相對路徑自動轉絕對網址。
* **靜態資產**：全站圖片與根資產放 `public/`，保證 `output: 'export'` 時 100% 複製到 `out/`。
* **舊版歸檔**：重構完成的舊版獨立 HTML/JS 統一歸檔至根目錄 `legacy/`。
* `page.tsx` 禁止混入 Client 互動狀態。

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
* **選擇性不啟用**：純單向輸入輸出、文件/文字轉換、一次性密碼生成或大檔案處理工具（如 Base64、URL 編解碼、密碼產生器、JSON 格式化、SSL 轉換器），應選擇性不啟用 URL 參數雙向連動，保持網址潔淨並消除無謂的同步負擔。

---

## 三、 UI 細部防護大原則

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

---

## 四、 大型複雜工具的專屬單元測試套件 (`tests/test-[tool]-*.mjs`)

大型工具的六分拆解法見全域規範。本專案要求：拆解後必須於 `tests/` 目錄建立獨立單元測試腳本（如 `tests/test-og-translations.mjs`、`tests/test-og-constants.mjs`）：

* 測試範疇必須包含：雙語鍵值 100% 對稱性、FAQ 結構格式正確性、色碼 Hex 與尺寸規範完整性。
* 整合至 `package.json` 的 `npm run test` 與 `prebuild` 管線，確保每次 CI/CD 與部署前 100% 通過。
