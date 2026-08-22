# 📝 更新日誌 (Changelog)

本專案的所有重要變更皆會記錄於此檔案中。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

---

## [1.5.0] - 2026-08-22

### 🚀 新增功能 (Added)
- **全新小工具：HAR 封包敏感資料清理器 (HAR File Sanitizer & Cleaner)**：
  - 正式上線 `/har-cleaner/`（繁體中文）與 `/har-cleaner/en/`（英文）雙語版本。
  - **100% 純前端沙箱防護**：檔案與資料全程於瀏覽器端本地解析與遮罩，絕不上傳任何伺服器，嚴格保障網路日誌與機密連線安全。
  - **多維度智慧脫敏引擎 (Sanitizer Engine)**：
    - 自動偵測並遮罩 Authorization Header (Bearer, Basic)、Cookies (Session ID, JWT)、API Keys、Token、密碼及私鑰（RSA/EC PEM）。
    - 智慧識別個資與財務機密（身分證字號、信用卡號、電子郵件、手機電話等）。
    - 支援 URL Query Params 敏感參數清除與自訂 Regex / 自訂欄位遮罩規則。
  - **全功能封包檢視與審計套件**：
    - **MetricsDashboard**：即時呈現總請求數、敏感欄位清除數、體積縮減率。
    - **Header Audit**：全面審查並分級請求與回應標頭之資安風險。
    - **Inspector Tab**：請求清單過濾、狀態碼色標、HTTP Method 篩選與敏感標籤提示。
    - **Entry Detail Modal**：深層封包比對器（支援 Request / Response Headers、Cookies、Query String、POST Body JSON 樹狀摺疊與 Timing 瀑布流）。
    - **Raw JSON & Summary**：提供即時乾淨 JSON 預覽、一鍵複製與匯出清理報告摘要。
  - **完整 SEO 與結構化資料**：中英文頁面均配備 Schema.org `WebApplication` 與 `FAQPage` JSON-LD 結構化資料，並同步登錄至 `sitemap.ts`。
- **網站首頁獨立英文版 (`/en`) 與多語系體驗全面升級**：
  - 新增 `/en` 原生英文首頁路由（`app/en/page.tsx`），配置獨立英文 SEO Meta Tags 與語意化結構。
  - 首頁客戶端邏輯重構為獨立 `HomeClient.tsx` 元件，無縫支援 `zh` 與 `en` 雙語搜尋、篩選與毛玻璃主題切換。
  - `ToolLayout` 與 `not-found (404)` 頁面強化多語系路由記憶與導向體驗。

### 🎨 架構與工程重構 (Refactored & Architecture)
- **全站工具分類與多語系架構整合 (`app/config/tools.tsx`)**：
  - 工具清單結構化升級，完整支援多語系分類標籤（開發工具、日常計算、生活娛樂、文字處理、資安與網路、財務與薪資等）。
- **HAR 工具架構模組化分拆**：
  - 將龐大的單檔邏輯拆解為 `engine/sanitizer.ts`、`DropzoneSection`、`HeaderAuditSection`、`InspectorTab`、`EntryDetailModal`、`RuleConfigPanel`、`MetricsDashboard`、`SummaryTab`、`RawJsonTab` 與 `constants.ts`。
- **Agent 技能系統模組化解耦 (`.agents/skills`)**：
  - 將原單一龐大 `toolbox-design-standards` 拆解重構為 4 大專注技能規範：
    1. `smalltools-code-standards` (Tailwind v4、A11y、RWD)
    2. `smalltools-design-system` (毛玻璃美學、亮暗雙主題、WCAG AA)
    3. `smalltools-dev-architecture` (App Router、URL 同步、非阻塞運算)
    4. `smalltools-i18n-seo` (雙語架構、FAQPage JSON-LD、Sitemap 規範)

---

## [1.4.0] - 2026-08-22

### 🚀 新增功能與 SEO 升級 (Added & SEO)
- **全站 29 個工具 QA / FAQ 與 Google 結構化資料 100% 完整建置**：
  - 全站 29 個工具的中英文雙語頁面（共 58 條工具主路由 + 53 條子頁面）全面導入 Google `FAQPage` JSON-LD 結構化資料標記，大幅提升搜尋結果中的富文本摘要（Rich Snippets）展示機會與 SEO 權重。
  - 每個工具平均配置 7~9 則深入、專業且高實用價值的 FAQ 問答，涵蓋核心原理、操作技巧、產業法規、數學公式與資安防護說明。
- **互動式毛玻璃手風琴 (FaqSection) 全站無縫整合**：
  - 各工具依據獨立主題色（如金色、霓虹粉、青綠色、天藍色等）客製化外觀，支援流暢展開/收合、搜尋引擎友善語意結構與 WCAG AA 高對比度標準。
- **自動化測試與檢驗工具**：
  - 新增 `tests/verify-all-faqs.js` 單元檢驗腳本，自動掃描全站所有工具的 `page.tsx`、`en/page.tsx` 與客戶端組件，確保 FAQ 覆蓋率維持 100%。

### 💡 工具問答內容與體驗強化 (Enhanced)
- **信貸計算機 (`/personal-loan/`)**：
  - 新增業務話術拆解問答，解析電話行銷常見包裝名目、總費用年百分率 (APR) 與資訊對稱重要性。
- **薪資、勞保、健保、預扣稅計算機 (`/my-salary-calculator/`)**：
  - 新增「3,000 元伙食津貼」免稅額度法規解析，釐清經常性給付必須如實計入勞保、健保投保級距之規範。
- **真實時薪計算器 (`/hourly-rate-calculator/`)**：
  - 深化真實時薪定義，強調「扣除通勤與工作隱形成本後的真實收入樣態」，說明與政府官方公開統計數據之對比價值。
- **Unix Epoch 時間戳記轉換 (`/epoch/`)**：
  - 補充伺服器與分散式系統日誌 (LOG) 為何全面採用 Unix Epoch 戳記（零時區偏移、利於 B-Tree 索引、跨伺服器無歧義轉換當地時間）。
- **DNS HTTPS 紀錄設定產生器 (`/https-dns-generator/`)**：
  - 新增 RFC 9460 Wire Format 二進位解碼問答，詳解為何終端機或舊版 DNS 工具查詢出來像十六進位亂碼（RFC 3597 Unknown RR），而本工具能結構化還原易讀參數。
- **線上 IP 檢測助手 (`/ip-detector/`)**：
  - 強化公有雲（AWS, GCP, Azure, Cloudflare）單一儀表板檢測價值，並強調瀏覽器端直接發起請求、所有連線在 DevTools 中透明可見且無第三方代理轉發之安全性。
- **吹牛骰子搖骰器 (`/liars-dice/`)**：
  - 新增線上連線問答，引導想進行遠端跨裝置開房的玩家前往專屬多人線上平台【Drink Games】。
- **目標計時器 (`/time/`)**：
  - 優化 FAQ 寬度使之與上方設定卡片嚴格對齊，並在啟動計時大看板時自動隱藏 FAQ，維持純粹沉浸的視覺大螢幕體驗。

### ⚡ 網站地圖與規範同步 (Changed)
- **Sitemap 更新**：更新 `app/sitemap.ts` 全站所有變更的工具頁面 `lastModified` 日期為 `2026-08-22`。

---

## [1.3.0] - 2026-08-20

### 🚀 新增功能 (Added)
- **全新小工具：孕期與產檢假計算機 (Pregnancy & Maternity Leave Calculator)**：
  - 正式上線 `/pregnancy-calculator/`（繁體中文）與 `/pregnancy-calculator/en/`（英文）雙語版本。
  - **四大多向推算模式**：支援「最後月經首日 (LMP，可自訂週期)」、「醫師評估預產期 (EDD)」、「超音波週數 / CRL 頭臀長 (Hadlock 公式)」與「試管嬰兒 / 人工受孕 (IVF Day 5 囊胚 / Day 3 胚胎 / 取卵受精日)」精準推算。
  - **孕期健康與進度看板**：即時呈現距離預產期倒數天數、當前週數與天數、預估受孕日、孕期階段（第一/二/三孕期）與 40 週進度條。
  - **胎兒生長尺寸生動比喻**：依照當前週數動態展示對應的水果比喻（如覆盆莓、酪梨、木瓜、西瓜等）、預估身長 (cm) 與體重 (g)。
  - **40 週關鍵產檢與里程碑時間軸**：精準標註第一孕期唐氏症篩檢、羊膜穿刺/羊水晶片、高層次超音波 (Level II)、妊娠糖尿病耐糖試驗 (OGTT)、乙型鏈球菌 (GBS) 及足月待產等公費與自費黃金時程。
  - **台灣法定產檢假、產假與津貼試算**：
    - 依法試算 8 天有薪產檢假、8 週（56 日曆天）法定產假休假區間與預計產後復職日。
    - 試算配偶 7 天陪產檢及陪產假。
    - 輸入月投保薪資一鍵精算勞保生育給付（2 個月投保薪資）與育嬰留職停薪津貼（8 成薪最長 6 個月）。
  - **一鍵生成請假與交接範本**：提供一鍵複製至剪貼簿的完整 Email / 通訊軟體請假通知信與業務交接說明。
  - **孕期重要準備與待產包 Checklist**：涵蓋第一至第三孕期營養補充、高層次預約、證件準備、產褥衛生用品與新生兒出院必備用品清單，支援本機互動勾選記錄。
  - **50 週持久化儲存與動態分享連結**：支援 LocalStorage 50 週 (350天) TTL 狀態保存與自動刷新，並提供一鍵複製試算分享連結（動態組裝 Query String）。
  - **完整 SEO 結構化資料**：全面導入 Schema.org `WebApplication` 與 `FAQPage` JSON-LD 標記。

### 🎨 視覺與互動優化 (Changed)
- **首頁工具卡片與霓虹主題樣式**：於 `app/config/tools.tsx` 註冊獨立 `pregnancyCard`，並於 `app/page.module.css` 新增暗色霓虹主題色 (`#ff4081`) 與亮色模式 WCAG AA 高對比深玫瑰紅 (`#e11d48`)。
- **FAQ 元件圖示解析升級**：升級 `FaqSection` 支援題目標籤化向量 SVG 圖示解析。
- **Sitemap 同步**：`app/sitemap.ts` 已登錄繁中與英文新路由。

---

## [1.2.0] - 2026-08-20

### 🚀 新增功能 (Added)
- **全面注入 FAQ 結構化資料 (JSON-LD FAQPage Schema)**：
  - 為 **IP 計算器 (`/ip-calculator`)**、**幸運大轉盤 (`/lucky-wheel`)**、**PDF 壓縮器 (`/pdf-compressor`)**、**PDF 頁面組合器 (`/pdf-processor`)** 與 **吹牛骰子遊戲 (`/liars-dice`)** 等中英文雙語頁面，全面導入語意化 FAQPage Schema，強化 Google 搜尋引擎 rich snippets 索引與排名效益。
- **互動式 FAQ 手風琴元件 (FaqSection) 升級**：
  - 支援外層主折疊與展開機制，並附帶動態狀態徽章（Badge）與快速收合按鈕。
  - 採用 Glassmorphism 毛玻璃視覺風格與微交互動畫，維持工具主畫面清爽度。
  - 答案文字內嵌關鍵詞與工具內部鏈結（如子網路計算、PDF 壓縮等），強化站內權重流動。
- **ToolLayout 頁尾自訂插槽 (extraFooterContent)**：
  - 新增頁尾自訂補充內容插槽，支援各工具頁面靈活延伸額外導航或說明資訊。

### ⚡ 效能與體驗優化 (Changed)
- **Sitemap 更新頻率與時間同步**：
  - 更新 `sitemap.ts` 中完成 SEO 優化的工具頁面 `lastModified` 日期為 `2026-08-20`。

---

## [1.1.0] - 2026-08-04

### 🚀 新增功能 (Added)
- **真實時薪計算器 (Hourly Rate Calculator)**：正式上線全新小工具！扣除每日通勤時間、無酬隱形加班、交通開銷與工作相關花費，精準計算每小時生命的真實淨收益。
- **全台與全球薪資 PR 排行榜**：整合台灣主計處與全球最新薪資統計數據，利用分段線性插值演算法（Piecewise Linear Interpolation），精算年薪與真實時薪在全台及全球打工人中的 PR 百分位排名。
- **國家與生活型態適性配對**：依據真實時薪落點，自動推薦適合的海外居住、打工度假或數位遊牧國家與區域。
- **薪資 PR 排行榜動態 SEO 頁面**：新增 `/hourly-rate-calculator/rank/[slug]` 專屬排行榜頁面，支援 OpenGraph 社群分享卡片與語意化 JSON-LD 結構化資料。

---

## [1.0.1] - 2026-08-04

### 🚀 新增功能 (Added)
- **ECC / ECDSA 演算法支援**：SSL 憑證轉換器新增對 ECC 橢圓曲線金鑰與憑證（如 `P-256 / prime256v1`、`P-384`、`P-521`）的剖析、轉檔與 PFX 私鑰解密支援。
- **金鑰與簽章演算法自動感應**：憑證成果看板新增「金鑰與簽章演算法」標籤，可自動判定與標示 `RSA (2048/4096-bit)` 或 `ECDSA` 類型。

### ⚡ 效能與體驗優化 (Changed)
- **二進位檔案處理重構**：新增通用非同步 `readFileAsBinaryString` 讀取函式（利用 `node-forge` 原生編碼），大幅提升大型 PFX 與二進位 DER 檔案的轉換處理速度。
- **AIA CA 補鏈連結擴充**：升級 AIA 網址擷取正則表達式，支援 `https://` 協定與包含複雜路徑字元（如 `_` 或 URL 編碼）的中繼憑證下載連結。
- **憑證主體 (DN) 解析強化**：優化 Common Name (CN) 解析與發行機構比對邏輯，相容更多第三方 CA 產出的憑證格式。

### 🛠️ 問題修復 (Fixed)
- **非 RSA 金鑰比較防錯**：修正上傳 ECC 私鑰進行 Modulus 雜湊比較時存取 `undefined.n` 引發程式碼崩潰的問題。

---

## [1.0.0] - 2026-08-01

### 🚀 初始版本 (Initial Release)
- 工具庫正式發布。