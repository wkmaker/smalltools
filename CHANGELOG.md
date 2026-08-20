# 📝 更新日誌 (Changelog)

本專案的所有重要變更皆會記錄於此檔案中。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

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