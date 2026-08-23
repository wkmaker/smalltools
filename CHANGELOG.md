# 更新日誌 (Changelog)

本專案遵循 [Semantic Versioning (語意化版本 2.0.0)](https://semver.org/lang/zh-TW/) 與 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

---

## [1.0.1] - 2026-08-23

### 🐛 修復 (Fixed)

- **PDF 頁面組合器 (`/pdf-processor/`)**：
  - **修復 ArrayBuffer 記憶體 Detached 問題**：修復在傳遞二進位緩衝區至 PDF.js Web Worker 進行預覽拆解時，因瀏覽器 Transferable Objects 機制導致主執行緒 State 中 ArrayBuffer 被轉移清空（Detached Buffer），造成後續點擊「匯出合併 PDF」拋出 `TypeError: Cannot perform Construct on a detached ArrayBuffer` 且下載無反應之問題。
  - **新增 300 DPI 超高清備用方案 (Fallback)**：在合成階段若遇特殊編碼、損毀字型或特殊加密權限的 PDF 頁面，系統自動無縫降級調用 300 DPI 渲染引擎，保證 100% 能順利重組並觸發下載。
  - **增強頁面旋轉相容性**：優化無 `/Rotate` 標籤頁面的旋轉角度解析防呆邏輯。

- **SSL 憑證格式轉換器 (`/ssl-converter/`)**：
  - **AIA 中繼憑證下載連結自動升級 HTTPS**：自動將 X.509 憑證擴充欄位中解析出的 `Authority Information Access` (AIA) 官方 CA 下載網址從 `http://` 重寫升級為 `https://`。
  - **解決 Mixed Content 阻擋**：徹底解決現代瀏覽器在 HTTPS 頁面下因混合內容（Mixed Content）安全政策而靜默阻擋非安全 HTTP 檔案下載的問題。

---

## [1.0.0] - 2026-08-23

### ✨ 新增功能 (Added)

- **全站 31 款純前端高效能實用工具上線**：
  - **文件與圖片工具**：PDF 頁面組合器、PDF 壓縮大師、萬能圖片處理大師、兩份文件比對工具、文字處理助手、Google Calendar ICS 切割助手。
  - **開發與編解碼工具**：JSON 格式化與驗證器、Base64 編解碼器、URL 編碼解碼器、高強度密碼產生器、SSL 憑證格式轉換器、HAR 敏感資訊清理器、Unix 時間戳 (Epoch) 轉換器。
  - **網路維運工具**：DNS Dig 查詢、本機 IP 檢測、HTTPS 專用 DNS 產生器、IP 子網路計算機。
  - **生活與娛樂工具**：Designer QR Code 產生器、目標倒數計時器、幸運轉盤抽獎、吹牛骰子搖骰器、產假/育嬰假計算機。
  - **金融與薪資計算**：房貸計算機、信貸計算機、車貸計算機、複利試算、股票質押計算機、期貨保證金計算機、台灣實領薪資計算機、時薪與所得 PR 值計算機、離職預告期計算機。
- **全站 3D 毛玻璃科技風 OpenGraph (OG) 專屬 WebP 預覽圖**。
- **全站 31 款工具頂欄三合一控制列 (ToolLayout) 統一重構**。
- **100% 瀏覽器本地運算 (Zero-Server Architecture)**，保護使用者資料安全與隱私。
