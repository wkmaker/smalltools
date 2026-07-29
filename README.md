# 🛠️ Smalltools - 現代化極簡線上工具庫

[![Online Tools](https://img.shields.io/badge/Online%20Tools-tools.cjkuo.net-00f0ff?style=for-the-badge&logo=vercel)](https://tools.cjkuo.net/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**Smalltools** 是一個集結金融理財試算、網路與安全診斷、文件圖片處理、開發者實用工具及生活時間應用的免費線上工具庫。

👉 **正式線上部署網站：[https://tools.cjkuo.net/](https://tools.cjkuo.net/)**

---

## ✨ 專案特色

* 🎨 **毛玻璃極致 UI 美學 (Glassmorphism & Neon Themes)**：採用現代暗色系純極黑背景（`#030305`），結合半透明毛玻璃容器與各工具專屬的動態霓虹發光色彩，提供視覺絕佳的視覺體驗。
* 🔒 **零隱私疑慮 (Client-side Privacy First)**：所有運算（含 PDF 壓縮、圖片轉檔處理、密碼產生、憑證轉換與金融計算）100% 於使用者瀏覽器端本地完成，檔案與敏感數據絕不上傳至任何伺服器。
* ⚡ **靜態超速載入 (Static Export SSG)**：使用 Next.js App Router `output: 'export'` 靜態導出，結合 AWS S3 + CloudFront CDN 全球加速，實現零等待的極速載入。
* 🔗 **網址參數雙向同步 (URL State Sync)**：輸入資料即時無感同步至 URL Query 參數，方便複製網址隨時分享、備份計算結果或加入書籤。
* 🌐 **多語言支援 (i18n Ready)**：全站支援繁體中文（預設）與英文介面動態切換，兼具 SEO 結構化資料與語意標籤。
* 📱 **全平台響應式設計 (Responsive Design)**：針對桌面端、平板與行動裝置深度優化，支援手機版橫向凍結表格與手勢互動。

---

## 🛠️ 收錄工具一覽

### 🧮 金融與理財試算
* **[信貸試算](https://tools.cjkuo.net/personal-loan/)** (`/personal-loan`) - 提供本息均攤、本金均攤試算，支援二分搜尋法極速求解實質年利率 (APR)。
* **[房貸試算](https://tools.cjkuo.net/mortgage-loan/)** (`/mortgage-loan`) - 支援寬限期設定、年限試算與完整還款明細導出。
* **[車貸計算器](https://tools.cjkuo.net/car-loan/)** (`/car-loan`) - 汽車貸款與手續費攤提試算。
* **[複利計算機](https://tools.cjkuo.net/compound-interest/)** (`/compound-interest`) - 投資複利增長與定期定額模擬。
* **[股票質押試算](https://tools.cjkuo.net/pledge-calculator/)** (`/pledge-calculator`) - 股票質押貸款利息與維持率試算。
* **[薪資與扣繳計算器](https://tools.cjkuo.net/my-salary-calculator/)** (`/my-salary-calculator`) - 實收薪資、勞健保及所得稅扣繳金額快速算。
* **[期貨槓桿計算機](https://tools.cjkuo.net/futures-calculator/)** (`/futures-calculator`) - 期貨保證金、槓桿倍數與損益點位計算。

### 🌐 網路與安全工具
* **[IP 計算機](https://tools.cjkuo.net/ip-calculator/)** (`/ip-calculator`) - IPv4 子網路遮罩 (CIDR)、網段範圍與可用 host 試算。
* **[IP 檢測器](https://tools.cjkuo.net/ip-detector/)** (`/ip-detector`) - 本地與對外 IP 位址、地理位置與 ISP 資訊查詢。
* **[DNS DIG 查詢](https://tools.cjkuo.net/dns-dig/)** (`/dns-dig`) - 線上 DNS 紀錄 (A, AAAA, CNAME, MX, TXT, NS) 查詢。
* **[HTTPS DNS 記錄生成器](https://tools.cjkuo.net/https-dns-generator/)** (`/https-dns-generator`) - 生成相容 RFC 9460 的 HTTPS / SVCB DNS 記錄。
* **[SSL 憑證格式轉換器](https://tools.cjkuo.net/ssl-converter/)** (`/ssl-converter`) - PEM, DER, PFX/P12, PKCS7 憑證互相轉換與憑證鏈修補。
* **[安全密碼產生器](https://tools.cjkuo.net/password/)** (`/password`) - 高強度強密碼自訂字元集中產生與強度檢測。

### 📄 文件與開發者工具
* **[PDF 壓縮大師](https://tools.cjkuo.net/pdf-compressor/)** (`/pdf-compressor`) - 純前端 PDF 檔案瘦身壓縮與畫質調整。
* **[PDF 頁面組合器](https://tools.cjkuo.net/pdf-processor/)** (`/pdf-processor`) - PDF 頁面分割、合併、旋轉與重新排序。
* **[萬能圖片處理大師](https://tools.cjkuo.net/image-processor/)** (`/image-processor`) - 圖片轉檔 (WebP/PNG/JPG/AVIF)、裁剪、壓縮與浮水印處理。
* **[QR Code 產生器](https://tools.cjkuo.net/qr-generator/)** (`/qr-generator`) - 自訂顏色、樣式與嵌入 Logo 的高解析度 QR Code 生成。
* **[Base64 編碼 / 解碼器](https://tools.cjkuo.net/base64/)** (`/base64`) - 文字與檔案之 Base64 雙向轉換。
* **[JSON 格式化與壓縮器](https://tools.cjkuo.net/json/)** (`/json`) - JSON 美化、壓縮、語法檢查與樹狀檢視。
* **[文字處理助手](https://tools.cjkuo.net/text-utility/)** (`/text-utility`) - 全半形轉換、字數統計、大小寫轉換與空行清理。
* **[文件比對 Diff Checker](https://tools.cjkuo.net/diff-checker/)** (`/diff-checker`) - 兩段文本或程式碼差異即時行級比對與亮顯。

### ⏱️ 時間與生活實用
* **[倒數計時與全螢幕時鐘](https://tools.cjkuo.net/time/)** (`/time`) - 全螢幕極簡數位時鐘、倒數計時器與響鈴提醒。
* **[Epoch 時間戳記轉換器](https://tools.cjkuo.net/epoch/)** (`/epoch`) - Unix Timestamp 與各國時區日期時間雙向轉換。
* **[幸運轉盤](https://tools.cjkuo.net/lucky-wheel/)** (`/lucky-wheel`) - 自訂選項隨機抽籤與主題轉盤。

---

## 💻 技術棧 (Tech Stack)

* **核心框架**：[Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
* **樣式與 UI**：[Tailwind CSS v4 (CSS-first 模式)](https://tailwindcss.com/) + Vanilla CSS Custom Tokens
* **客戶端運算庫**：`node-forge` (密碼/SSL 憑證處理)、`diff` (文字比對)、`qr-code-styling` (向量 QR 生成)
* **佈署架構**：AWS S3 + CloudFront CDN + CloudFormation (`template.yml`) + GitHub Actions OIDC 自動化部署 workflow

---

## 🚀 本地開發與建置指南 (Getting Started)

### 前置需求
* Node.js >= 18.0.0
* npm >= 9.0.0

### 1. 安裝套件依賴
```bash
npm install
```

### 2. 啟動本地開發伺服器
```bash
npm run dev
```
開啟瀏覽器訪問 `http://localhost:3000` 即可預覽網站與即時熱重載 (HMR)。

### 3. 建置靜態導出 (SSG Export)
```bash
npm run build
```
建置完成後，靜態網頁資產將自動生成於 `out/` 目錄中，可直接託管於任何靜態網頁伺服器（如 AWS S3、GitHub Pages、Cloudflare Pages 等）。

### 4. 執行代碼檢查 (Linter)
```bash
npm run lint
```

---

## 🏗️ 部署說明 (Deployment)

本專案正式環境部署於 **Cloudflare + AWS CloudFront + AWS S3** 高性能託管架構，自動對應網域 **[https://tools.cjkuo.net/](https://tools.cjkuo.net/)**。

* **架構流向**：`Cloudflare (Edge CDN / DNS)` ➔ `AWS CloudFront (CDN)` ➔ `AWS S3 (源站)`
* **自動化 CI/CD**：每次 Push 或 Merge 至 `main` 分支時，透過 GitHub Actions 觸發靜態建置，將產出之 `out/` 自動同步更新至 AWS S3 Bucket。
* **智慧過濾部署**：具備智慧檔案變動偵測 (`dorny/paths-filter`) 與 `paths-ignore` 機制。若僅修改說明文件或程式碼完全未變動，會自動跳過打包與 AWS 快取刷新，大幅提升部署效率並減少不必要的回源請求。

---

## 📄 授權條款 (License)

本專案採用 **GNU General Public License v3.0 (GPL-3.0)** 條款開源，版權所有 © 2026 CJ Kuo (Plume Intel LLC)。

你可以自由使用、修改與分發本專案，惟任何基於本專案之衍生作品或公開部署服務，皆必須以同等的 GPL-3.0 條款完整公開原始碼，並保留原始作者之版權宣告與出處。

完整授權內容請參閱專案根目錄之 [LICENSE](./LICENSE) 檔案或 [GNU 官方網站](https://www.gnu.org/licenses/gpl-3.0.html)。

---

## ⚠️ 免責聲明 (Disclaimer)

本專案提供之各項工具（包含但不限於財務、薪資、房貸、網路與檔案處理工具）及其數據結果僅供技術交流與個人參考，不構成任何專業財務、法律或工程建議。

使用者於實際決策前應自行核對權威機構數據，原作者與 Plume Intel LLC 不對任何因使用本服務所生之直接或間接損失承擔法律責任。
