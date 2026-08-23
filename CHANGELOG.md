# 更新日誌 (Changelog)

本專案遵循 [Semantic Versioning (語意化版本 2.0.0)](https://semver.org/lang/zh-TW/) 與 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

---

## [1.7.1] - 2026-08-23

### 🐛 修復 (Fixed)

- **PDF 頁面組合器 (`/pdf-processor/`)**：
  - **修復 ArrayBuffer 記憶體 Detached 問題**：修復在傳遞二進位緩衝區至 PDF.js Web Worker 進行預覽拆解時，因瀏覽器 Transferable Objects 機制導致主執行緒 State 中 ArrayBuffer 被轉移清空（Detached Buffer），造成後續點擊「匯出合併 PDF」拋出 `TypeError: Cannot perform Construct on a detached ArrayBuffer` 且下載無反應之問題。
  - **新增 300 DPI 超高清備用方案 (Fallback)**：在合成階段若遇特殊編碼、損毀字型或特殊加密權限的 PDF 頁面，系統自動無縫降級調用 300 DPI 渲染引擎，保證 100% 能順利重組並觸發下載。
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
