# 🛠️ Smalltools - 現代化極簡線上工具庫

[![Online Tools](https://img.shields.io/badge/Online%20Tools-tools.cjkuo.net-00f0ff?style=for-the-badge&logo=vercel)](https://tools.cjkuo.net/)
[![Donate Stripe](https://img.shields.io/badge/Donate-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**Smalltools** 是一個集結金融理財試算、網路與安全診斷、文件圖片處理、開發者實用工具及生活時間應用的免費線上工具庫。

👉 **正式線上部署網站：[https://tools.cjkuo.net/](https://tools.cjkuo.net/)**

---

## ✨ 專案特色

* 🎨 **亮暗雙主題與毛玻璃 UI 美學 (Light/Dark Mode & Glassmorphism)**：全面支援深色與明亮模式切換（支援手動切換與隨系統自動同步）。深色模式採用質感極致純黑背景（`#030305`）結合霓虹微光；明亮模式提供清爽高對比的極簡毛玻璃視覺，兼具視覺美感與長時閱讀舒適度。
* 🔒 **零隱私疑慮 (Client-side Privacy First)**：所有運算（含 PDF 壓縮、圖片轉檔處理、密碼產生、憑證轉換與金融計算）100% 於使用者瀏覽器端本地完成，檔案與敏感數據絕不上傳至任何伺服器。
* ⚡ **靜態超速載入與非阻塞運算 (SSG & Non-Blocking Yielding)**：使用 Next.js App Router `output: 'export'` 靜態導出，結合 AWS S3 + CloudFront CDN 全球加速；高負載運算採用非同步時間片釋放與防抖技術，確保介面 60fps 滑順不卡死。
* 🔗 **網址參數雙向同步 (URL State Sync)**：輸入資料即時無感同步至 URL Query 參數，方便複製網址隨時分享、備份計算結果或加入書籤。
* 🌐 **多語言支援 (i18n Ready)**：全站支援繁體中文（預設）與英文介面動態切換，兼具 SEO 結構化資料與語意標籤。
* 📱 **全平台響應式設計 (Responsive Design)**：針對桌面端、平板與行動裝置深度優化，支援手機版「多欄表格自動自適應為直式小卡片」、橫向凍結表格與手勢互動，打造零橫向捲動的行動端流暢體驗。

---

## 🛠️ 收錄工具一覽
 
### 🏦 金融理財 (Finance)
* **[複利計算機](https://tools.cjkuo.net/compound-interest/)** (`/compound-interest`) - 支援年/月利率與定期定額，透過動態堆疊圖表呈現財富增長軌跡。
* **[信貸計算機](https://tools.cjkuo.net/personal-loan/)** (`/personal-loan`) - 支援本息/本金平均攤還與實質年利率 (APR) 估算。
* **[車貸計算機](https://tools.cjkuo.net/car-loan/)** (`/car-loan`) - 支援車價與自備款成數試算、寬限期設定與月付金分析。
* **[房貸計算機](https://tools.cjkuo.net/mortgage-loan/)** (`/mortgage-loan`) - 支援自備款連動、寬限期試算與多段式階梯利率設定。
* **[股票質押與維持率壓力測試器](https://tools.cjkuo.net/pledge-calculator/)** (`/pledge-calculator`) - 支援股價與張數雙向連動、追繳門檻與大跌幅壓力測試模擬。
* **[台股期貨槓桿與逆風點數估算器](https://tools.cjkuo.net/futures-calculator/)** (`/futures-calculator`) - 即時計算大台/小台/微台實質槓桿倍數，模擬逆風損益與追繳強平臨界點。

### 💼 職場與生活 (Workplace & Life)
* **[薪資、勞保、健保、預扣稅計算機](https://tools.cjkuo.net/my-salary-calculator/)** (`/my-salary-calculator`) - 查表比對勞健保、勞退與預扣稅金額，呈現員工實領薪資與雇主總營運成本。
* **[真實時薪計算器](https://tools.cjkuo.net/hourly-rate-calculator/)** (`/hourly-rate-calculator`) - 扣除通勤時間、無酬加班與額外支出，精準計算每小時生命真實淨收益並對照全台薪資 PR 排行。
* **[離職時間與預告期計算機](https://tools.cjkuo.net/resignation-calculator/)** (`/resignation-calculator`) - 依台灣勞基法第 16 條與 38 條精準計算法定預告天數、離職生效日、最後在職日與特休排休/折現代金試算，並一鍵產生離職預告範本。
* **[孕期與產檢假計算機](https://tools.cjkuo.net/pregnancy-calculator/)** (`/pregnancy-calculator`) - 支援 LMP、預產期、超音波 CRL 與試管推算，精算 40 週產檢里程碑、胎兒成長尺寸，並整合台灣勞基法試算 8 天產檢假、8 週產假、育嬰留停 8 成薪與勞保生育給付。

### 💻 開發輔助 (Developer Tools)
* **[Base64 編碼/解碼](https://tools.cjkuo.net/base64/)** (`/base64`) - 支援文字即時雙向編解碼（UTF-8 不亂碼）、檔案拖曳編碼與多媒體預覽。
* **[URL 編碼/解碼](https://tools.cjkuo.net/url/)** (`/url`) - 支援 URI/URIComponent 模式，具備 Query 參數表格即時解析與雙向編輯。
* **[安全密碼生成器](https://tools.cjkuo.net/password/)** (`/password`) - 密碼學安全強隨機數生成工具 (CSPRNG)，支援排除易混淆字元與強度評估。
* **[JSON 格式化與美化器](https://tools.cjkuo.net/json/)** (`/json`) - 支援即時語法 Lint 驗證定位、多縮排格式美化、樹狀檢視與單行壓縮。
* **[SSL 憑證格式轉換器](https://tools.cjkuo.net/ssl-converter/)** (`/ssl-converter`) - 支援 PFX/P12, PEM, DER 雙向轉換、金鑰雜湊匹配檢查與到期警示。
* **[HAR 敏感資料清理工具](https://tools.cjkuo.net/har-cleaner/)** (`/har-cleaner`) - 專業純前端 HAR 封包脫敏與瘦身神器！支援自動清除 Cookie、Authorization 標頭、Bearer JWT、API 密鑰、敏感 Query 與 POST Payload，並可精準清理肥大二進位媒體酬載，100% 本地記憶體運算不外傳。
* **[Epoch 時間戳記轉換](https://tools.cjkuo.net/epoch/)** (`/epoch`) - 支援秒與毫秒自動判定，即時在台北時間、UTC、美西時區之間雙向轉換。

### 🌐 網路維運 (Network Utilities)
* **[DIG 網路診斷工具](https://tools.cjkuo.net/dns-dig/)** (`/dns-dig`) - 支援 Cloudflare / Google 加密 DoH 切換、即時發送 DIG 請求查詢 A, CNAME, MX, TXT 等記錄。
* **[IP 檢測助手](https://tools.cjkuo.net/ip-detector/)** (`/ip-detector`) - 支援 IPv4/IPv6 雙棧偵測、Cloudflare / Mullvad 節點查詢與公有雲連線延遲診斷。
* **[DNS HTTPS 紀錄設定產生器](https://tools.cjkuo.net/https-dns-generator/)** (`/https-dns-generator`) - 線上 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生器與 DNS 代管商填寫對照指南。
* **[IP 子網段計算器](https://tools.cjkuo.net/ip-calculator/)** (`/ip-calculator`) - 快速計算 IPv4 / CIDR 網段資訊、可用 IP 列表與極速 TXT/CSV 導出。

### 📄 圖片與文件 (Media & Documents)
* **[光影裁剪 - 萬能圖片處理大師](https://tools.cjkuo.net/image-processor/)** (`/image-processor`) - 支援視覺化裁切、尺寸調整、jSquash WebAssembly 轉檔壓縮與多檔批次打包。
* **[PDF 頁面組合器](https://tools.cjkuo.net/pdf-processor/)** (`/pdf-processor`) - 純前端 PDF 合併、拖曳頁面排序、單頁 90° 旋轉與頁面刪除。
* **[PDF 壓縮大師](https://tools.cjkuo.net/pdf-compressor/)** (`/pdf-compressor`) - 針對 PDF 內嵌點陣圖深度壓縮與降採樣，保持向量文字清晰並大幅減少檔案體積。
* **[兩份文件比對工具](https://tools.cjkuo.net/diff-checker/)** (`/diff-checker`) - 純本機文本差異比對工具，支援 Split 雙窗格與 Unified 混合比對模式。
* **[文字處理助手](https://tools.cjkuo.net/text-utility/)** (`/text-utility`) - 支援大小寫轉換、空白字元清理，並即時統計字元數、中英文字數與總行數。

### 🎲 生活娛樂 (Life & Entertainment)
* **[Designer QR Code 產生器](https://tools.cjkuo.net/qr-generator/)** (`/qr-generator`) - 支援碼體與定位點樣式自訂、漸層色彩設定與置中 Logo 嵌入。
* **[目標計時器](https://tools.cjkuo.net/time/)** (`/time`) - 全螢幕極簡數位時鐘與目標計時器，支援多種時間格式與主題色設定。
* **[幸運轉盤抽獎小工具](https://tools.cjkuo.net/lucky-wheel/)** (`/lucky-wheel`) - 支援自訂獎項、權重與色彩，提供全螢幕舞台、物理動畫與音效。
* **[吹牛骰子搖骰器](https://tools.cjkuo.net/liars-dice/)** (`/liars-dice`) - 專為酒吧派對吹牛遊戲打造！具備防作弊計時器、中央手勢窺視、歷史 5 次紀錄、全螢幕舞台、擬真物理音效與手機觸覺震動。

---

## 💻 技術棧 (Tech Stack)

* **核心框架**：[Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
* **樣式與 UI**：[Tailwind CSS v4 (CSS-first 模式)](https://tailwindcss.com/) + Vanilla CSS Custom Tokens（具備完整的亮暗模式 CSS 變數與主題切換機制）
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

## ☕ 贊助與支持 (Support & Donation)

如果您覺得 **Smalltools** 對您的工作或生活有所幫助，歡迎透過 Stripe 贊助支持作者，您的支持是持續維護與開發更多精緻小工具的最大動力！

👉 **[透過 Stripe 贊助支持作者 ☕](https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools)**

---

## 📄 授權條款 (License)

本專案採用 **GNU General Public License v3.0 (GPL-3.0)** 條款開源，版權所有 © 2026 CJ Kuo (Plume Intel LLC)。

你可以自由使用、修改與分發本專案，惟任何基於本專案之衍生作品或公開部署服務，皆必須以同等的 GPL-3.0 條款完整公開原始碼，並保留原始作者之版權宣告與出處。

完整授權內容請參閱專案根目錄之 [LICENSE](./LICENSE) 檔案或 [GNU 官方網站](https://www.gnu.org/licenses/gpl-3.0.html)。

---

## ⚠️ 免責聲明 (Disclaimer)

本專案提供之各項工具（包含但不限於財務、薪資、房貸、網路與檔案處理工具）及其數據結果僅供技術交流與個人參考，不構成任何專業財務、法律或工程建議。

使用者於實際決策前應自行核對權威機構數據，原作者與 Plume Intel LLC 不對任何因使用本服務所生之直接或間接損失承擔法律責任。
