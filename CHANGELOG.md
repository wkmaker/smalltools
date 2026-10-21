# 更新日誌 (Changelog)

本專案遵循 [Semantic Versioning (語意化版本 2.0.0)](https://semver.org/lang/zh-TW/) 與 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

## [1.28.6] - 2026-10-22

### Fixed
- **憑證鏈尋訪死迴圈、FileReader 異常捕獲與上傳狀態重置全面修復（#90）**：
  - **SSL 憑證轉換器（ssl-converter）環狀參照防護**：`buildUnifiedCertAnalysis` 引入 `visited = new Set()` 憑證造訪追蹤與 `MAX_CHAIN_DEPTH = 10` 最大深度防護，徹底解決交叉簽署（Cross-Signed）或相互簽發的中繼 CA 引發 `while (!isRootCertificate)` 無窮迴圈與分頁當機問題。
  - **全站檔案讀取器（FileReader / Image）異常捕獲**：`qr-generator`, `diff-checker`, `json`, `har-cleaner`, `image-processor`, `og-generator`, `pac-tester`, `pac-generator` 等模組全面補齊 `reader.onerror`、`reader.onabort` 與 `img.onerror` 回呼，防範檔案被系統鎖定或格式損毀時介面掛起與 Loading 骨架屏無限懸掛。
  - **多模組上傳控制項重複選取修復**：10 個工具模組在 `onChange` 處理完畢後立即執行 `e.target.value = ''`，徹底根除清空佇列或上傳失敗後無法再次選取相同名稱檔案的操作死胡同。
  - **Base64 工具 DataURL 格式健全驗證**：`app/base64` 增加 `includes(',')` 格式校驗與空值回退，防止異常或空檔案切出 `undefined` 引發後續 `substring` 的 `TypeError`。
  - **元件卸載計時器與全站 Toast 防抖清理**：`liars-dice` 0.9 秒手甩延遲受 `shakeTimerRef` 追蹤並於卸載時清理；`epoch`, `diff-checker`, `qr-generator`, `text-utility`, `resignation-calculator`, `pdf-compressor`, `pdf-processor` 等模組引入 `toastTimerRef`，解決連續操作時新 Toast 被前次定時器提早清除的體驗缺陷。

---

## [1.28.5] - 2026-10-22

### Fixed
- **程式碼運算效能優化、DOM 爆炸防護與記憶體溢出根除（#96）**：
  - **PDF 頁面處理器（pdf-processor）記憶體洩漏與主執行緒卡頓根除**：
    - 將數十 MB 的二進位 `ArrayBuffer` 自 React State 逐頁項目徹底抽離，改以 `fileBuffersRef` 外部 Map 快取管理，避免卡片拖曳與選取時反覆深拷貝引發記憶體飆升與瀏覽器 OOM 崩潰。
    - 檔案批次解析由「逐頁 `setPages(prev => [...prev, page])`」重構為「整批檔案單次更新」，消弭 50 頁文件觸發 50 次全量組件 re-render 的 $O(N^2)$ 主執行緒嚴重卡死。
    - 刪除頁面時引入引用計數垃圾回收，當關聯檔案所有頁面皆被移除或點擊清空時，主動自 Map 快取釋放二進位記憶體。
  - **文字差異比對（diff-checker）萬行虛擬滾動與切片渲染**：
    - Split 與 Unified 雙視窗全面引入動態虛擬滾動（Virtual Scrolling），當行數超過 120 行自動啟動可見視窗切片運算，上下保留 25 行 overscan 緩衝，透過佔位 Spacer 撐開原生滾動條高度。
    - 解決萬行程式碼或龐大日誌比對時產出 2 萬個原生 DOM 節點導致頁面凍結、滾動掉幀（0~5 FPS）與記憶體耗盡問題，維持恆定 80 個以內 DOM 節點的高效流暢操作（60 FPS）。
  - **HAR 封包清洗器（har-cleaner）記憶體快取與超大文字截斷防護**：
    - Detail Modal 中的 Request/Response Payload 格式化全面引入 `useMemo` 快取，避免每次點選頁籤或複製時在主執行緒重複執行 `JSON.stringify` 耗時運算。
    - 脫敏與命中高亮渲染器引入 10 萬字元安全截斷防護，防止超大字串解析產生數千個 `<mark>` 標籤節點造成渲染線程凍結。
  - **純文字工具（text-utility）單次巡訪統計演算法**：
    - 建立 `computeTextStatistics` 單次巡訪（Single Pass）$O(N)$ 零記憶體配置演算法，將原本多次全量正則與陣列切片整併為單次碼點掃描，並以 `useMemo` 綁定。
    - 10 萬字大文本字數、行數、中英文字符、空白統計耗時由 120ms+ 降至 2.4ms，CPU 耗時降低 98%。

---

## [1.28.4] - 2026-10-22

### Fixed
- **活動流程、操作中斷、狀態殘留與多步驟依賴失效全面修復（#92）**：
  - **PDF 壓縮器參數變更狀態重置**：`app/pdf-compressor` 於使用者調整壓縮預設模式、品質滑桿或 DPI 時，自動將佇列中已完成（`done`）與錯誤（`error`）檔案狀態重置為 `ready`，徹底解決調整參數後再次批次壓縮直接跳過並導出舊檔案的操作陷阱。
  - **DNS 診斷工具 8 秒超時明確引導**：`app/dns-dig` 區分使用者主動中斷與定時超時，當 DoH 查詢超過 8 秒未回應時，明確於介面顯示紅色錯誤警示與重試指引，終結超時靜默白屏缺陷。
  - **HAR 封包清洗器重置狀態殘留修復**：`app/har-cleaner` 於「重置/清空」與「載入範例」中補齊 `setErrorMessage(null)`，防止先前損壞檔案的錯誤警示在工作台清空後持續殘留。
  - **PAC 測試器過期成果與報表無效化**：`app/pac-tester` 於編輯 PAC 腳本、拖曳上傳或切換範例時，自動清空過期的單次與批次測試成果，防範使用者導出舊腳本分析報告。
  - **SSL 憑證產生器 CA 狀態重置與產物失效連動**：`app/cert-generator` 清空表單時完整重置自簽 Root CA 與複用狀態；於簽發核心參數（模式、演算法、CN、SAN、天數）變動時自動清空產物卡片，防止上下介面資料不一致。

---
## [1.28.3] - 2026-10-22

### Fixed
- **資料流極值防護、Storage 反序列化安全與非同步競態全面修復（#93）**：
  - **房貸與車貸 URL 極值防護**：
    - `mortgage-loan` 與 `car-loan` 嚴格採用 `Number.isFinite` 進行參數解析，徹底杜絕 `Infinity` 穿透判定引發的階梯利率展開死迴圈（主執行緒凍結）與記憶體溢出崩潰。
    - 房貸期數放寬設定物理上限至 70 年（840 期），車貸期數放寬上限至 30 年（360 期），保留因應政策彈性修改之空間並絕對防止無窮迴圈。
  - **本地儲存反序列化健全防護**：
    - `app/HomeClient`、`app/lucky-wheel`、`app/epoch` 與 `app/components/ToolLayout` 全面加入 `Array.isArray` 型別守衛校驗，防止本機快取損毀或異常結構引發全站首頁或工具頁 `.map()` / `.filter()` 白畫面崩潰（TypeError）。
  - **全站 Storage 安全存取防護**：
    - 新建 `app/utils/storage.ts` 封裝 `safeLocalStorage` 與 `safeSessionStorage`，修復全站「⟵ 返回首頁」按鈕與 PAC 工具在 Safari 隱私模式或受限 WebView 下觸發 `SecurityError` 阻斷跳轉的缺陷。
  - **非同步網路請求競態防護**：
    - `app/ip-detector`：在所有檢測回呼（IPv4 / IPv6 / Cloudflare Trace / GeoIP）賦值前補齊 `parentSignal.aborted` 取消檢查，防止慢速請求反向覆蓋最新檢測結果。
    - `app/dns-dig`：在 `finally` 載入指示器狀態還原與結果賦值中加入 Controller 同一性檢查（`activeAbortControllerRef.current === controller`），防止併發查詢時前次請求提早關閉 Loading 骨架屏。
  - **JSON 格式化工具大整數精度遺失防護**：
    - 新增 `detectUnsafeLargeIntegers` 純函數與單元測試，精準偵測超出 JavaScript 安全整數範圍（超過 2^53 - 1）的 64 位元整數（如 Snowflake ID）。
    - 格式化面板整合雙語 WCAG AA 對比警示橫幅，主動提醒使用者排版可能造成的精度遺失風險。

---
## [1.28.2] - 2026-10-21

### Fixed
- **外部訪問與網路請求健壯性缺陷全面修復（#94）**：
  - **Service Worker 同源防護**：`public/sw.js` fetch 監聽器加入 `url.origin !== self.location.origin` 同源判定，徹底根除 Service Worker 誤攔跨站第三方 API 請求並在離線/失敗時回傳本站 `offline.html` 假資料引發 JSON 解析拋錯問題。
  - **IP 偵測器連線與卸載防護**：`app/ip-detector` 全面引入 `fetchWithTimeout` 與 `AbortController` 生命週期管理，支援元件卸載即時中止請求；所有第三方 API 回應強制校驗 `res.ok`，防止 429/403 等 HTTP 錯誤回傳 HTML 頁面導致語法解析崩潰；重新檢測時自動取消前次未完成連線，防範舊數據反向覆蓋。
  - **DNS 查詢器請求清理**：`app/dns-dig` 補齊元件卸載（Unmount）時的 `activeAbortControllerRef`、防抖定時器與 Toast 定時器清理機制。
  - **SSL 憑證轉換器 AIA 端點與下載修復**：
    - 移除 AIA URL 將 `http://` 強制改寫為 `https://` 的非標準行為，遵循 RFC 5280 規範保留 CA 原始宣告端點，避免伺服器未開啟 443 埠導致下載失敗。
    - 放寬 AIA URL 正則表達式匹配範圍，支援如 Let's Encrypt 等結尾無 `.cer` 副檔名的標準 CA 端點。
    - 結果卡片新增「複製網址」按鈕與明確的「右鍵另存連結為...」指引，有效避免現代瀏覽器針對跨協定下載之混合內容 (Mixed Content) 攔截。
  - **時薪計算機外部引用連結安全升級**：將 Numbeo 參考鏈結由明文 `http://` 修正為加密安全的 `https://`。

---

## [1.28.1] - 2026-10-21

### Fixed
- **UI 與無障礙 A11y 審查缺失全面修復（#91）**：
  - 補齊房貸計算機單一與雙軌寬限期滑桿之語意 `label` / `aria-label`。
  - 修復密碼產生器滑桿進度條於亮色模式下的高對比色差。
  - 修復圖片壓縮工具在亮色模式下的深色卡片背景遺失與邊框不可見問題。
  - PAC 產生器多規則模式補齊專屬卡片序號 `aria-label`。
  - HAR 封包清洗器深色模式下 JSON 鍵名對比度提升至 WCAG AA 規範（#38bdf8）。
  - 大話骰自訂懲罰清單亮色模式下白底白字修復。
  - 憑證檢視器深層巢狀屬性白底灰字不可讀問題修復。
  - QR Code 產生器 Logo 上傳拖放區補齊純文字 Accessible Name。
  - 胎動計時器歷史紀錄深色卡片背景遺失修復。

### Performance
- **介面流暢性與主執行緒防護優化（#97）**：
  - **ParticleCanvas 全站背景**：以 MutationObserver 快取主題色彩與狀態，徹底消滅每幀逐粒子調用 `getComputedStyle` 造成的 Layout Thrashing；整合 Page Visibility API 實現分頁背景自動休眠與前景喚醒；支援 `prefers-reduced-motion` 及小螢幕微粒密度自適應。
  - **JsonFormatter**：輸入與編輯加入 250ms 防抖，並透過 React 18 `useTransition` 進行低優先級解析排程，消滅大文字鍵入時主執行緒卡頓。
  - **ImageProcessor**：原圖 DataURL 改為僅於載入時計算，消除每次滑桿拖動重複產生 canvas 與 `toDataURL`；預覽渲染加入 120ms 防抖。
  - **LuckyWheel**：旋轉動畫改以 Ref 維護角度並在 RAF 內直接重繪 Canvas，旋轉過程整樹 Re-render 次數降為 0；彩帶動畫補齊 RAF ID 追蹤與元件卸載取消機制。
  - **QrGenerator**：輸入與滑桿變更加入 150ms 防抖，並在 QRCodeStyling 實例存在時優先呼叫 `update()` 原地更新，消滅反覆銷毀重掛 DOM 樹。
  - **EpochClient**：將 20fps 高頻即時看板抽出為 `LiveClockBanner` 獨立子組件，整頁不再每秒 20 次 Re-render，並加入 `visibilitychange` 背景智慧暫停。

---

## [1.28.0] - 2026-10-20

### Changed
- **部署搬到靜態網站共用 AWS 帳號**：改用與 cj-blog、pdways 相同的 bootstrap 模式。`infra/bootstrap.yml` 建立 OIDC 部署角色與 CloudFormation 執行角色，以 `site-stack` 標籤與堆疊名稱前綴把權限限制在本站；`infra/site.yml` 取代 `template.yml`，正式站 `smalltools-site`、測試站 `smalltools-staging` 各自獨立。
- **Workflow 拆成三支**：`deploy.yml`（main → 正式站）、`deploy-staging.yml`（其他分支 → 測試站）共用 `deploy-site.yml`。建置與 S3 同步規則沿用原本設定；`NEXT_PUBLIC_SITE_URL` 改由堆疊輸出決定。
- **ACM 憑證改由堆疊申請**，不再寫死 ARN；新增 `AttachDomain` 參數，網域從舊帳號搬入前可以先完成憑證驗證；新增 `CertificateDomain` 參數（儲存庫變數 `SITE_CERT_DOMAIN`），填根網域時改申請「根網域 + 萬用子網域」，和 cj-blog 共用同一筆驗證 CNAME，不必重複驗證。
- **安全標頭**：正式站改用本站自訂的回應標頭政策（內容與原本的 `Managed-SecurityHeadersPolicy` 相同：HSTS 一年、nosniff、SAMEORIGIN、strict-origin-when-cross-origin），測試站另加 noindex。
- **S3 儲存區政策加上 `ListBucket`**，不存在的路徑直接回 404；另外拒絕非 HTTPS 存取。

### Removed
- **WAF**：靜態網站不再掛 WAF web ACL。
- **舊的孤兒資源清理步驟**：測試站改為固定的獨立堆疊，不再需要。

### Added
- **回歸測試**：`tests/engine/cloudfront-infra.test.mjs` 檢查部署角色的權限隔離、安全標頭政策一律套用、`site-stack` 標籤與網域掛載條件（取代 `cloudfront-response-headers.test.mjs`）；新增開發依賴 `js-yaml`，用來解析 CloudFormation 範本。

---

## [1.27.8] - 2026-10-20

### Security
- **正式站補上安全標頭（#77）**：CloudFront `ResponseHeadersPolicyId` 在非 NoIndex 環境原為 `AWS::NoValue`，正式站完全沒有安全標頭；改為套用 AWS 託管 `Managed-SecurityHeadersPolicy`，提供 HSTS（`max-age=31536000`，不含 includeSubdomains / preload）、`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy: strict-origin-when-cross-origin`。CSP 尚未處理。

### Added
- **回歸測試**：`tests/engine/cloudfront-response-headers.test.mjs` 確認 `ResponseHeadersPolicyId` 不再落到 `AWS::NoValue`，且 NoIndex policy 保有完整安全標頭。

---

## [1.27.7] - 2026-10-20

### Security
- **密碼產生器不再退回 Math.random()（#81）**：環境不支援 `crypto.getRandomValues` 時，`secureRandomInt` 改為拋出 `CsprngUnavailableError`，介面顯示繁中錯誤並停止產生密碼。
- **PAC 測試器沙盒強化（#80）**：執行前先做靜態檢查，拒絕 `import`、`importScripts`、`eval`、`constructor` 等關鍵字，`lintPacScript` 也會同步提示；遮蔽清單補上 `self`、`importScripts`、`Function`、計時器等全域；Worker 載入時移除網路與程式碼載入 API，並切斷函式原型上的 `constructor`，封住原型鏈逃逸路徑。CSP 隔離依賴 #77，尚未處理。

### Fixed
- **Lint error（#85）**：宮縮計時器與胎動紀錄改為不在 render 期間呼叫 `Date.now()`，`npm run lint` 恢復 0 error。
- **測試換行相容**：`cloudfront-viewer-request.test.mjs` 讀取 `template.yml` 時先統一換行，修正 Windows CRLF 簽出時測試失敗的問題。

### Added
- **回歸測試**：補上 CSPRNG 不可用時的測試，以及 PAC 沙盒逃逸、禁用關鍵字與主機名稱不誤判的測試。

---

## [1.27.6] - 2026-10-20

### Security
- **S3 源站封閉（#78 階段 B）**：移除可由公開 Stack 名稱與 Account ID 推算的 User-Agent 讀取條目與 S3 靜態網站設定，Bucket Policy 收緊為僅限本 Distribution ARN 經 OAC 讀取，並開啟完整的 S3 公開存取封鎖，外部已無法繞過 CloudFront 與 WAF 直接存取源站。

---

## [1.27.5] - 2026-10-20

### Security
- **S3 源站改走 OAC（#78 階段 A）**：CloudFront Origin 由 S3 靜態網站端點改為 REST 端點 + Origin Access Control（SigV4），Bucket Policy 新增僅限 CloudFront 服務主體的讀取條目。舊版可推算的 User-Agent 條目與靜態網站設定暫時保留以確保切換不中斷，將於階段 B 移除。

### Changed
- **CloudFront Function 合併**：測試環境 Basic Auth 與目錄索引改寫（`/` 結尾補 `index.html`、無副檔名路徑 301 補斜線、排除 `opengraph-image`）合併為單一 `viewer-request` Function，正式與測試環境皆掛載。
- **錯誤頁**：S3 REST 端點對不存在物件回應的 403 統一導向 `/404.html`。

### Added
- **回歸測試**：`tests/engine/cloudfront-viewer-request.test.mjs` 直接從 `template.yml` 取出 Function 原始碼驗證改寫與 Basic Auth 行為。

---

## [1.27.4] - 2026-10-20

### Security
- **測試環境預設帳密（#79）**：移除 `deploy.yml` 中寫死的 Basic Auth 預設帳密，未設定 `STAGING_BASIC_AUTH_USER` / `STAGING_BASIC_AUTH_PASS` Secret 時直接中斷部署。
- **sharp 依賴漏洞（#74）**：`next` 間接依賴的 `sharp` 由 0.35.4 升至 0.35.5，修補 librsvg 漏洞 CVE-2026-96889。

---

## [1.27.3] - 2026-10-20

### Changed
- **PDF 壓縮器 ZIP 打包（#66）**：移除內建逐位元 CRC32 的重複 ZIP 實作，改用共用 `image-processor/utils/zipBuilder`（查找表 CRC32、Zip Slip 防護、UTF-8 檔名旗標）。

### Fixed
- **OG 圖片產生器 Emoji 亂碼（#67）**：`wrapText` 改以 `Array.from` 依 code point 切分，避免拆裂 UTF-16 代理對。
- **圖片處理器 Render 期間變異 Ref（#68）**：`batchItemsRef` 改於 `useEffect` 同步。
- **AudioContext 未釋放（#69）**：吹牛骰子與幸運轉盤卸載時關閉 `AudioContext`。

---

## [1.27.2] - 2026-10-20

### Fixed
- **幸運轉盤動畫卸載洩漏（#61）**：拉霸機 `requestAnimationFrame` ID 納入 `animFrameIdRef` 追蹤，逐輪排程改由 `scheduleSpinTimeout` 管理，元件卸載時取消動畫與所有待執行排程。
- **QR 產生器活動時區未重繪（#62）**：QR 繪製與網址同步 effect 補上 `eventTimezone` 依賴。
- **PDF 處理器圖片讀取永久卡住（#63）**：`FileReader` 補上 `onerror` / `onabort`，失敗時顯示提示並繼續處理，處理中狀態可正常復原。
- **SSL 轉換器 AIA 補完崩潰（#64）**：憑證鏈為空時直接提示錯誤，並於處理結束後重置檔案選擇以便重新選取同一檔案。
- **檔案下載偶發失敗（#65）**：`downloadBlob` 預設延後 1 秒回收 Object URL。

---

## [1.27.1] - 2026-10-20

### Fixed
- **HAR 清理工具 Raw JSON 凍結（#58）**：`RawJsonTab` 以 `useMemo` 快取字串化結果，超過 1,000,000 字元僅預覽前段並提示改用複製 / 下載；脫敏引擎以 `cloneEntryForSanitize` 最小拷貝取代每筆 entry 的 `JSON.parse(JSON.stringify())` 全量深拷貝，降低 GC 壓力。
- **JSON 格式化樹狀檢視卡死（#59）**：深度 ≥ 2 或子節點 > 50 的節點預設收合，展開後每次僅渲染 100 筆並提供「顯示更多」。
- **差異比對輸入卡頓（#60）**：合計超過 20,000 字元時比對改為 400ms 防抖執行。

---

## [1.27.0] - 2026-10-18

### ☕ 樂捐贊助轉換與芳名錄系統 (Sponsorship & Sponsor Wall System)
- **首頁贊助芳名錄 (Sponsor Wall Section)**：於首頁底部導入獨立芳名錄模組 `app/components/SponsorWallSection.tsx`，具備「創始人空狀態」激勵設計（目前累積 0 筆贊助時主動邀請成為第一位支持創作者的創始支持者），支援靜態名單擴充、雙語切換與 WCAG AA 亮暗色彩對稱。
- **高光場景化贊助小卡 (Contextual Sponsor Card)**：
  - 新增通用場景化贊助呼籲組件 `app/components/ContextualSponsorCard.tsx` 與專屬樣式模組 `app/components/sponsor.module.css`。
  - **離職預告期計算機**：於最後離職工具與交接清單下方嵌入「順利交接，展開職涯新篇章」場景化贊助小卡。
  - **股票質押計算機**：於壓力測試與保證金回補方案下方嵌入「掌握風險，安心投資」場景化贊助小卡。
  - **期貨風險與保證金計算機**：於壓力測試、逆風點數與保證金回補方案下方嵌入「嚴控槓桿，安心交易」場景化贊助小卡。
- **全站贊助常數與靜態配置**：新增 `app/config/sponsors.ts`，統一收納 Stripe 贊助連結、芳名錄資料介面與中英文辭典，維持 100% 純靜態無伺服器架構。
- **UI 與雙語規範 100% 通過**：嚴格遵守零原生 Emoji（全數使用 SVG 向量圖示）、雙主題語意 Token、無障礙標籤對稱與雙語辭典對稱驗證。

---

## [1.26.2] - 2026-10-18

### 👶 胎動計數器衛教出處與臨床定義精確化 (Clinical Definition & Debounce Clarity)
- **精準切分臨床指引與軟體門檻**：修訂 `app/kick-counter/translations.ts`（中英文）與 `engine.ts` 註解。釐清台灣國健署與美國婦產科醫學會（ACOG）臨床指引僅原則性規範「連續動作算一次、靜止停頓後才算下一次」而未明定秒數；明確標示「2 分鐘」為本工具防誤觸與分波時間窗（Debounce Window）之軟體設計，避免讀者查證時產生出處混淆。

---

## [1.26.1] - 2026-10-18

### 👶 胎動計數器演算法優化 (Kick Counter & Clinical Episode Protection)
- **連鎖連環踢保護（錨定本波起點）**：針對寶寶極度活潑、每隔 1~2 分鐘頻繁揮拳的邊界情境，修復滾動間隔導致連鎖連環踢無限續約的演算法陷阱。引入 `getLastEpisodeStartTime` 錨定機制，設定單波連續活動上限為 2 分鐘；距離本波起點超過 2 分鐘之踢擊自動晉級為新一波有效胎動，徹底避免超時卡死。
- **單元測試補齊**：`tests/engine/kick-counter.test.mjs` 新增 `getLastEpisodeStartTime` 與「連續 90 秒踢擊（19 拳 27 分鐘達標 10 波）」完整場景回歸測試。
- **雙語 FAQ 擴充**：於 `app/kick-counter/translations.ts` 中英文常見問題增補「防卡死時窗保護 (Active Window Protection)」臨床原理解析。
- **CI 依賴修復 (GitHub Actions Build Fix)**：恢復 `package.json` 中的 `reflect-metadata` 依賴，修復 `@peculiar/x509` 底層 `tsyringe` 依賴的 reflect polyfill，解決 GitHub Actions 在乾淨環境下執行憑證生成器單元測試時的 `ERR_MODULE_NOT_FOUND` 錯誤。
- **AWS CloudFormation Free Plan 相容性修復**：移除 `template.yml` 中 production 環境附加的自訂 `SecurityResponseHeadersPolicy`。因 CloudFront 帳戶為 Free pricing plan，AWS API 限制不允許掛載自訂 Response Headers Policy（報錯 400 `InvalidRequest: Distributions with the Free pricing plan can't have custom response headers policy`），還原為由應用層與 CloudFront 預設行為防護。

---

## [1.26.0] - 2026-10-18

### 🏗️ 巨型組件模組化拆解 (Architecture & Component Decomposition)
- **全面落實「六分拆解法」與「三層分離」**：針對專案中 8 個千行以上巨型 Client/Modal 組件進行架構重構，平均單一檔案程式碼行數減少 60%~82%，大幅提升程式碼可讀性、維護性與渲染效能：
  1. `app/qr-generator/QrGeneratorClient.tsx`：1925 行 ➔ 642 行（-66.6%），抽出獨立 `engine.ts`、`QrParamsPanel`、`QrHistoryDrawer`。
  2. `app/har-cleaner/components/EntryDetailModal.tsx`：1582 行 ➔ 274 行（-82.7%），抽出 `components/detail/` 6 個分頁面板與標頭組件。
  3. `app/lucky-wheel/LuckyWheelClient.tsx`：1686 行 ➔ 532 行（-68.4%），抽出 `components/` 4 個核心設定、獎項機率清單與歷史統計卡片。
  4. `app/pregnancy-calculator/PregnancyCalculatorClient.tsx`：1395 行 ➔ 396 行（-71.6%），抽出 `components/` 6 個模式輸入、超音波換算、津貼試算與臨床產檢看板。
  5. `app/mortgage-loan/MortgageLoanClient.tsx`：1267 行 ➔ 432 行（-65.9%），抽出 `components/` 5 個貸款試算輸入、提前還款試算與還款時程卡片。
  6. `app/og-generator/OgGeneratorClient.tsx`：1260 行 ➔ 393 行（-68.8%），抽出 `components/` 7 個樣式面板、即時預覽、社群模擬與批次抽屜組件。
  7. `app/ssl-converter/SslConverterClient.tsx`：1191 行 ➔ 404 行（-66.1%），抽出 `types.ts` 與 `components/` 6 個拖曳上傳、格式轉換與憑證鏈視覺化看板。
  8. `app/resignation-calculator/ResignationCalculatorClient.tsx`：1283 行 ➔ 484 行（-62.3%），抽出 `components/` 5 個預告警示橫幅、參數側邊欄、里程碑指標、離職時間軸與財務結算卡片。
- **全站 295 個單元測試與 208/208 個靜態頁面 SSG 100% 通過**，功能行為、雙語鍵值與無障礙標籤無任何回歸。

---

## [1.25.0] - 2026-10-18

### ♿ 無障礙與語意標籤 (Accessibility & A11y)
- **修復非法 HTML5 巢狀互動結構**：首頁工具卡片移除 `<Link>` 內部嵌套釘選 `<button>`，改用 `.toolCardWrapper` 平級佈局，符合 W3C 標準。
- **表單標籤對稱綁定**：修復行事曆切割器、PAC 規則產生器、PAC 測試器等 13 處缺少 `htmlFor` 與 `id` 的表單控制項，並為 CommandPalette 搜尋框、時間戳單位選單等補齊 `aria-label`。

### 🔢 數值精度與金融防護 (Financial Precision)
- **全面改用 BigNumber.js**：全面消除離職特休折現、健保眷屬加乘、房貸/車貸/信貸頭期款換算、股票質押維持率與期貨本金倍數計算等處的殘留原生浮點數乘除，防止浮點誤差。

### 🛡️ 零靜默失敗與安全標頭 (Error Handling & Security)
- **消除靜默失敗**：針對剪貼簿複製失敗、HAR 檔案解析異常、PAC Web Worker 降級、PDF 圖片替換等情境補齊明確的可追溯日誌 (`console.error`/`console.warn`) 與使用者反饋 Banner。
- **CloudFront OWASP 安全回應標頭**：在 `template.yml` 新增 Production 與 Staging 通用的安全回應標頭 Policy（含 `HSTS`、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`）。

### 🧪 核心引擎抽離與單元測試 (Unit Tests & Refactoring)
- **核心演算法抽離獨立引擎 (`engine.ts`)**：
  - `app/calendar-split/icsSplitter.ts` ➔ 新增 `tests/engine/calendar-split.test.mjs`。
  - `app/dns-dig/dnsDecoder.ts` ➔ 新增 `tests/engine/dns-dig.test.mjs`。
  - `app/image-processor/utils/zipBuilder.ts` ➔ 新增 `tests/engine/zip-builder.test.mjs`。
  - `app/https-dns-generator/engine.ts` ➔ 新增 `tests/engine/https-dns-generator.test.mjs`。
  - `app/liars-dice/engine.ts` ➔ 新增 `tests/engine/liars-dice.test.mjs`。
  - `app/password/engine.ts` ➔ 新增 `tests/engine/password.test.mjs`。
  - `app/qr-generator/engine.ts` ➔ 新增 `tests/engine/qr-generator.test.mjs`。
- **全站 295 個單元測試 100% 通過**，納入 `npm run test` 與 `prebuild` 守門員。

### 📦 依賴與文檔維護 (Dependencies & Documentation)
- **清理 package.json**：移除未使用的 `reflect-metadata`，將 `@types/diff` 與 `@types/node-forge` 歸入 `devDependencies`。
- **同步全站文檔與徽章**：全站頁面描述、Sitemap、README 統一同步為 `36+` 工具，徽章更新至 `Next.js-16.3.8` 與 `React-19.3.0`。

---

## [1.24.3] - 2026-10-18

### 🌐 多語系與純淨繁中化 (i18n & Localization)

- **批次 C 深度修復（補齊英文版翻譯、收斂三元判斷、純淨繁中化與全站字典對稱守門員）**：
  - **補齊英文版 (`/en/`) 殘留的硬編碼中文**：
    - **SSL 憑證轉換器 (`/ssl-converter/en/`)**：為 60+ 處 UI 字串、憑證鏈分析狀態網格、下載選單與 AIA 自動修復提示補齊英文字典；修復解析錯誤訊息的繁中寫死問題。
    - **HAR 清理器 (`/har-cleaner/en/`)**：`SummaryTab` 脫敏分佈明細與檔案壓縮成效指標全數改為 `{t.xxx}` 雙語結構。
    - **房貸計算機 (`/mortgage-loan/en/`)**：方案 A 多階段利率設定全面對齊方案 B，抽離硬編碼中文。
    - **行事曆切割器 (`/calendar-split/en/`)**：統計面板、活動數量單位、前五筆活動預覽與錯誤提示全面雙語化。
    - **零星工具漏翻補齊**：修復 `ThemeToggle` 懸浮提示、圖片壓縮錯誤提示、IP 網段過大警示、吹牛骰點數標籤、PAC 產生器直連預設選項、PAC 測試器狀態提示、個人信貸分享提示、QR 產生器圖片上傳錯誤提示等。
  - **移除繁中 UI 標籤與常見問題中的冗餘英文括號（全域鐵則 2）**：
    - 全站 28 個工具的 `faqTitle` 中殘留的 ` (FAQ)` 全數清除，呈現優雅純淨的繁中介面（如「常見問題與專業指南」）。
    - 清理 Base64、Diff 對比、DNS Dig、HAR 清理、真實時薪、HTTPS DNS、IP 計算機、PAC 測試器、密碼產生器、QR 產生器、文字處理、時間轉換、URL 編碼等工具中繁中標籤冗餘的英文括號（如 ` (JSON)`、`(Headers)` 等）。
  - **收斂 JSX 散落的三元判斷**：
    - 收斂 PAC 規則產生器與規則卡片中散落的 `isEn ? ... : ...` 判斷，統整至 `translations.ts`。
  - **新增全站雙語字典對稱自動測試守門員**：
    - 新增 `tests/test-all-translations.mjs`，自動掃描全站 39 個 `translations.ts`（包含根目錄與 38 個工具目錄），遞迴驗證 `zh-TW` 與 `en` 深度鍵值 100% 完全對稱。
    - 在 `package.json` 加入 `test:i18n` 腳本，並正式納入 `npm run test` 與 `npm run prebuild` 流程，確保未來的任何翻譯新增或修改都不會發生語系鍵值脫節。

---

## [1.24.2] - 2026-10-18

### ⚡ 效能優化與 UI 設計規範 (Performance & UI Standards)

- **批次 B 深度修復（薪資設定檔瘦身、檔案上限防護、Tailwind 主題變體與 UI 守門員強化）**：
  - **薪資計算機 JSON 體積縮減 91.5%**：
    - 將 `2024.json`, `2025.json`, `2026.json` 總計 42,328 行薪資扣繳稅表抽離為緊湊矩陣 `taxTables.json`，並在 `salaryConfig.ts` 改為 $O(1)$ 常數級查表，大幅減輕 Initial Client Bundle 與記憶體佔用。
  - **14 處檔案上傳工具補齊檔案大小上限防護（全域鐵則 36）**：
    - 為 HAR 清理器 (150MB)、ICS 行事曆分割器 (100MB)、SSL 憑證轉換器 (5MB)、PDF 頁面組合器 (100MB)、PDF 壓縮大師 (150MB)、萬能圖片處理大師 (50MB)、JSON 格式化美化器 (50MB) 補齊大小上限檢查與友善雙語錯誤 Toast，防止使用者誤丟巨大檔案癱瘓瀏覽器與記憶體。
  - **修復 Tailwind v4 `dark:` 主題變體脫節問題**：
    - 在 `app/globals.css` 明確宣告 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`，使全站所有 `dark:` utility 嚴格跟隨 `<html data-theme="...">` 手動切換，不再與系統原生配色產生衝突。
    - 修復 `app/not-found.tsx` 中無效的 `light:` 變體，以及 `app/https-dns-generator/HttpsDnsGeneratorClient.tsx` 中未自適應亮暗模式的主題文字色彩。
  - **修復 18 處微縮字級與裸露 Emoji 符號（全域鐵則 16, 18）**：
    - 將全站 11 處 TSX 與 7 處 `.module.css` 中的 `< 12px` 微縮字級（如 `text-[0.65rem]`, `text-[0.7rem]`, `font-size: 0.7rem;` 等）全數提升至 `text-xs` (`0.75rem` / 12px)。
    - 全面移除 `ServiceWorkerRegister.tsx` 的裸露 `🎉`、`ToolLayout.tsx` 的贊助重複 `☕`、`tools.tsx` 首頁與 404 分類 Emoji（全面改為雙主題自適應 SVG 向量圖示）。
    - 移除 `hourly-rate-calculator` 中在 Windows 系統易發生字體撕裂破圖的國旗 Emoji 與卡片 Emoji（💳, 💬, ⚖️）。
  - **強化 UI 守門員單元測試**：
    - `tests/check-ui-standards.mjs` 擴充涵蓋 `components/` 目錄並移除對 `ToolLayout` 的全域豁免；`tests/ui-rules/no-undersized-font.mjs` 擴充支援攔截 `0.75rem` 以下的微縮 rem 字級語法。

---

## [1.24.1] - 2026-10-18

### 🐛 問題修復與效能優化 (Fixed & Performance)

- **批次 A 深度修復（線上 Bug、記憶體洩漏、首頁 SSG 預渲染、CI/CD 部署）**：
  - **修復 PDF 壓縮器 Render 期 Blob URL 記憶體洩漏**：
    - 將 `app/pdf-compressor/PdfCompressorClient.tsx` 單檔下載連結由 `<a href={URL.createObjectURL(...)}>` 改為按鈕點擊動態呼叫 `downloadBlob`，消除每次組件 re-render 重新生成新 ObjectURL 導致的記憶體堆積。
  - **修復圖片處理器 Blob Object URLs 生命週期管理**：
    - 在 `app/image-processor/ImageProcessorClient.tsx` 中透過 `batchItemsRef` 追蹤縮圖，組件 Unmount、重置清空或非追加重新載入檔案時確實回收 ObjectURL，並避免追加圖片時對既有檔案重複建立縮圖 URL。
  - **修復 SSL 憑證轉換器日期時區混用跨日錯亂**：
    - 修正 `app/ssl-converter/engine.ts` 的 `formatValidityDate`，消除前半段 UTC 日期與後半段本地時間混用導致台灣時間凌晨相差一整天的 Bug，全程使用使用者本地時區格式化。
  - **新增共用本地日期格式化工具函式**：
    - 新增 `app/utils/dateUtils.ts` 的 `getLocalDateString()`，全面取代 LuckyWheel、PdfCompressor、PdfProcessor 等匯出檔名誤用 `toISOString().slice(0, 10)`（UTC 前一天）的寫法。
  - **修復首頁靜態匯出 SSG 首屏空白問題**：
    - 移除 `app/HomeClient.tsx` 的 `useSearchParams()`，改於 Client 掛載後讀取網址參數與本地儲存；移除 `app/page.tsx` 與 `app/en/page.tsx` 的 `<Suspense fallback={<div>載入中...</div>}>` 包裹，使靜態匯出的 `out/index.html` 完整預渲染 36 個工具卡片，大幅提升 SEO 與無 JS 環境可讀性。
  - **補齊 CI/CD 路徑過濾**：
    - 在 `.github/workflows/deploy.yml` 的 `paths-filter` 補齊根目錄 `components/**`，防止修改全站共用元件時漏觸發建置與部署。

---

## [1.24.0] - 2026-10-18

### ✨ 新增功能 (Added)

- **全新上線「胎動計數器（`/kick-counter/`）」孕期胎兒活力觀測與智能連環踢統計工具**：
  - **寶寶有動就按，智能連環踢（Combo）自動標記**：
    - 依婦產科醫學指引，點擊間隔 ＜ 2 分鐘自動歸為「連環踢 (Combo)」，與上一波合併為同一次有效胎動，不需孕婦在原地苦等 1 分鐘才敢按。
    - 點擊間隔 ≥ 2 分鐘自動劃分為新的一波「有效胎動波數 (Episode)」，即時呈現「有效波數」與「點擊總數」雙指標。
  - **數滿 10 次法 (Cardiff) 與 1 小時定時法 (Sadovsky) 雙模式切換**：
    - **數滿 10 次法**：紀錄達標 10 次有效胎動耗時（標準 2 小時內達標），達標時播放提示並自動歸檔該輪紀錄。
    - **1 小時定時法**：倒數 60 分鐘內統計有效胎動次數（標準 1 小時內 ≥ 3~5 次）。
  - **達標耗時活力評定與 ECharts 趨勢圖表**：
    - 自動統計歷史回合達標耗時與平均活動強度，評定活力狀態。
    - 繪製歷史回合達標耗時柱狀圖與有效波數趨勢圖，支援亮暗主題自適應。
  - **醫護與伴侶溝通口述小抄（防慌照唸守則）**：
    - 支援一鍵複製格式化報備小抄（包含目前週數、記錄模式、有效波數、總下數、耗時與狀態評定）。
    - 提供即時懸浮預覽按鈕，讓準媽媽或伴侶致電產房或婦產科診所時能清晰照唸、不慌亂。
  - **螢幕保持常亮（Screen Wake Lock API）**：支援計數中防止手機螢幕暗屏休眠，便於側臥或休息時計數。
  - **隱私零上傳與本地儲存**：紀錄全數保留於本機瀏覽器 `localStorage`，不連線任何雲端伺服器；首條 FAQ 特別標註醫學免責聲明與緊急就醫紅旗警訊。

---

## [1.23.0] - 2026-10-18

### ✨ 新增功能 (Added)

- **全新上線「宮縮計時器（`/contraction-timer/`）」母嬰待產陣痛紀錄與規律運算工具**：
  - **單鍵直覺計時**：提供大面積高對比圓形計時按鈕，點擊立即開始計時並呈現秒數與脈衝呼吸光暈，再次點擊即刻結算單次宮縮；支援計時中單鍵取消防呆。
  - **滑動視窗抗雜訊統計（最近 5 次中位數）**：
    - 自動統計「多久痛一次（本次開始 − 上次開始）」與「一次痛多久（持續秒數）」之中位數，避免偶發漏按或手滑離群值扭曲平均。
    - 滿 3 次即顯示初步指標，滿 5 次完整收斂；兩次宮縮間隔超過 30 分鐘自動判斷為中斷，僅統計最新連續段落。
  - **規律程度與持續時間自動回溯**：
    - 依間隔變異係數（CV = 標準差 ÷ 平均）評定「規律 / 大致規律 / 不規律」，並提示區間範圍。
    - 規律形成後自最新一筆往回逐筆比對容許範圍（間隔 ±25% 且至少 ±1.5 分鐘、持續 ±30% 且至少 ±15 秒），容許 1 筆離群抗漏按，精準推算「此規律已維持 X.x 小時」。
  - **趨勢比對與多維次數統計**：比對當前 5 次視窗與前一視窗之中位數，變化達 15% 即標示「變密集／趨緩」與「變長／變短」；即時顯示「最近 10 分鐘」與「最近 1 小時」宮縮次數。
  - **狀態小卡與一鍵複製小抄**：一鍵將格式化摘要（含時間戳記、頻率、持續秒數、維持時長、趨勢與次數）複製至剪貼簿，方便產婦或準爸爸即時傳送至通訊軟體告知家人。
  - **ECharts 6 雙軸時間趨勢圖**：動態繪製近 6 小時時間軸走勢，左軸呈現間隔與滾動中位數曲線、右軸呈現單次痛感持續秒數散點，跟隨主題自動切換亮暗色彩。
  - **隱私零上傳與 6 小時自動過期**：100% 本地 `localStorage` 運作、跨分頁同步，不連線任何後端伺服器；超過 6 小時之紀錄自動清理過期，並支援各筆刪除與一鍵清空。
  - **螢幕保持常亮（Screen Wake Lock API）**：支援計時期間防止手機自動暗屏休眠，便於待產過程中隨時單手操作。

---

## [1.22.0] - 2026-10-18

### ✨ 新增功能 (Added)

- **幸運轉盤與拉霸抽獎小工具（`/lucky-wheel/`）尾牙活動、直播抽獎與日常決策體驗全面升級**：
  - **尾牙雙抽模式（獎項池 × 人員轉盤）**：新增「尾牙雙抽模式」開關與獨立獎項池管理器，支援預先設定「特等獎、頭獎、二獎、普獎」等名額，於轉盤上方直接指定當前抽取的獎項再轉動人員名單，自動綁定「得獎人 — 所屬獎項」並於該獎項抽完時自動切換至下一順位的可用獎項。
  - **多人連抽與三段轉速控制**：支援選擇「單抽 1 名 / 連抽 3 名 / 連抽 5 名 / 連抽 10 名」批次連抽（逐筆即時扣減庫存並動態重分配機率），並提供「極速 1.8 秒 / 標準 4.8 秒 / 懸念 7.8 秒」三段轉速切換。
  - **連抽逐輪自動轉動與即時揭曉**：連抽 N 名時，轉盤／拉霸機會真實轉動 N 輪、每輪指針停靠於該位得主並播放提示音，於「即時揭曉卡」與全螢幕舞台逐一顯示 `#1、#2…` 與進度條，最後一輪結束才觸發彩帶與得獎總覽彈窗；已抽完名額的扇區於下一輪前自動自轉盤移除。
  - **不在場放棄重抽（無損回補庫存）与歷史紀錄匯出**：於得獎歡呼彈窗與歷史紀錄視窗新增「不在場放棄（回補庫存重抽）/ 撤銷並回補」功能，一鍵作廢不在場得主並將項目與獎項名額無損加回轉盤；歷史紀錄新增「匯出 CSV 報表（含 UTF-8 BOM 與防公式注入）」与「複製得獎名單」。
  - **免傳檔「快速貼上名單」批次編輯器與名單整理工具**：新增「逐項設定 / 快速貼上名單」雙頁籤，支援從 Excel、Line 直接貼上純姓名清單或 `名稱, 權重, 數量` 批次生成轉盤，並內建一鍵「隨機打亂順序」與「去除重複名稱」。
  - **專屬網址分享（URL Share）與多組本地存檔槽**：支援將目前轉盤項目與獎項池編碼為 `?wheel=...` 分享連結，以及在瀏覽器本地保存多組命名轉盤配置（如早場活動、晚場尾牙）隨時一鍵切換。
  - **全螢幕舞台空白鍵盲按與指針物理彈動視覺**：支援按鍵盤 `Space`（空白鍵）直接啟動抽獎或關閉得獎彈窗，方便主持人配合簡報筆操作；轉盤旋轉經過扇區邊界時新增頂部指針物理彈動（Deflection）動畫與瀏覽器原生全螢幕（`requestFullscreen`）切換。

### 🐛 問題修正與架構重構 (Fixed & Changed)

- **幸運轉盤與拉霸抽獎小工具（`/lucky-wheel/`）演算法、定位與模組化重構**：
  - **落實 `crypto.getRandomValues` 密碼學安全亂數與扇區內隨機偏移落點**：將抽獎亂數全面升級為 Web Cryptography API 無偏差浮點亂數（`secureRandomFloat`），並於轉盤停靠角度加入扇區寬度 `±36%` 內的安全隨機偏移（`computeTargetSpinAngle`），消除每次必停扇區正中央的機械感。
  - **修復拉霸機（Slot Machine）中獎項目未對準紅線之偏移 Bug**：修正拉霸機滾輪帶目標索引計算與全螢幕視窗高度不一致問題，精準鎖定中獎卡片停靠於紅線（Payline）正中央（`92 - winIdx * 76`）。
  - **修復「管理獎項池」切換模板後持續卡住顯示、連抽被靜默截斷為 1 名**：切換快速模板或重新整理時預設關閉尾牙雙抽模式並新增一鍵關閉按鈕；連抽人數不再因單一獎項剩餘名額而被強制截斷。
  - **iOS Safari 輸入框防自動放大與六分拆解**：將所有表單輸入框字級由 `text-xs`（12px）升級為 `text-sm`（14px），並將單檔 1,475 行的 `LuckyWheelClient.tsx` 物理拆解為 `types.ts`、`constants.ts`、`engine.ts`、`translations.ts`、`PrizeEditorPanel.tsx`、`FullscreenStageModal.tsx` 與 `Modals.tsx`。

---

## [1.21.0] - 2026-10-18

### ✨ 新增功能 (Added)

- **離職時間與預告期計算機（`/resignation-calculator/`）勞基法實務與互動體驗全面升級**：
  - **2025–2027 台灣國定假日與補班日整合（`holidays.ts`）**：排休特休與倒推「實際最後到辦公室出勤日」時，自動跳過國定假日（如春節、228、清明、五一勞動節、端午、中秋、教師節、國慶、光復節、行憲紀念日）不消耗特休，並支援識別週六補班日，即時列出預告期內涵蓋的國定假日清單。
  - **非自願離職（資遣）完整財務試算**：
    - 新增依《勞工退休金條例》第 12 條計算之「勞退新制資遣費」（每滿 1 年發給 0.5 個月平均工資，未滿 1 年依年、月、日比例計給，最高以 6 個月為限）。
    - 新增「雇主提前終止未足額預告天數」輸入與「預告期間工資」試算，並匯總「離職結算預估領取總額（特休不休假代金＋資遣費＋預告工資）」。
  - **視覺化「預告期排休互動月曆」（`NoticeCalendarCard.tsx`）**：以月曆格視覺化標示「提出預告」「出勤工作日」「特休排休」「國定假日」「週末例休」「最後出勤」「退保生效」，支援點擊預告期內任意工作日手動切換特休排休，即時重算最後出勤日與折現代金。
  - **離職當月破月薪資與健保結算建議**：自動試算最後在職日當月之破月在職薪資，解析「月底最後一天在保 vs 破月退保」之全民健保當月保費扣繳歸屬，並在最後在職日落於週五或週六時提供「一鍵順延最後在職日至週日（多領 1~2 天例假日薪資與年資）」提示。
  - **`.ics` 關鍵時程行事曆匯出與多情境離職信範本（`icsExport.ts`）**：支援一鍵匯出包含「提出預告、最後進辦公室交接、契約最後在職、退保生效」四大節點的 `.ics` 行事曆檔；離職信產生器擴充「標準正式版」「溫和感謝版」「資遣交接與權益確認版」三種情境，並支援填入署名與交接對象。
  - **互動式離職手續與權益檢核表（`OffboardingToolsSection.tsx`）**：升級為支援勾選進度條、`localStorage` 持久化記憶與一鍵重置的互動清單，並於非自願離職模式動態載入「非自願離職證明書」與「資遣通報確認」必備項目。

### 🐛 問題修正與架構重構 (Fixed & Changed)

- **離職時間與預告期計算機（`/resignation-calculator/`）工程規範對齊**：
  - **修復 URL Query 雙向同步遺漏**：補齊 `officeMode`、`customOffice`、`holidays` 與 `shortDays` 參數之網址寫回與邊界清洗，確保分享連結可 100% 還原自訂最後出勤日與資遣參數。
  - **金額定點數化與大型組件拆解**：`engine.ts` 內所有金額（日均薪、特休代金、資遣費、預告工資、破月薪資）全面改用 `BigNumber.js`（`app/utils/decimal.ts`）定點數運算；將原本 1,093 行的 `ResignationCalculatorClient.tsx` 物理拆解為 `holidays.ts`、`icsExport.ts`、`NoticeCalendarCard.tsx` 與 `OffboardingToolsSection.tsx`，並消除所有 JSX 內聯雙語三元判斷，達成 `TRANSLATIONS` 100% 鍵值對稱。

---

## [1.20.0] - 2026-10-17

### ✨ 新增功能 (Added)

- **台股期貨槓桿計算機（`/futures-calculator/`）實務風控模型與互動體驗全面升級**：
  - **座艙雙欄式風險指標儀表板**：
    - 左側升級為極座標動態 SVG 半圓儀表（`0% ~ 200%+`），精準劃分 `<25% 強制砍倉區`、`25%–維持率% 盤後追繳區`、`維持率%–100% 警戒緩衝區` 與 `≥100% 原始保證金區` 四段色弧，隨商品維持保證金比例動態伸縮，並附內圈 10 等分精密刻度線、四區圖例與 `role="meter"` 無障礙屬性。
    - 右側整合「目前風險指標 (%)」大字讀數，以及「超額可用保證金」、「距追繳線空間（點）」與「距砍倉線 25% 空間（點）」三項即時風控緩衝指標。
  - **臨界點位容許逆風幅度 (%) 與漲跌停板天數複利換算**：新增 `calculateLimitMoveDays` 純函數（多單以 10% 跌停 `0.9^n`、空單以 10% 漲停 `1.1^n` 複利推算），於追繳警示點位與強制平倉點位同步顯示容許逆風百分比與相當於可承受幾根漲/跌停板。
  - **快速實戰情境範本 (Scenarios) 與壓力測試快捷鍵**：
    - 左欄新增「穩健波段 (微台 2 口・3 倍金)」、「標準配置 (小台 1 口・2 倍金)」與「高槓桿警戒 (大台 1 口・1.2 倍金)」三組一鍵載入情境；本金快捷按鈕擴充為 `1.0x` / `1.5x` / `2.0x` / `3.0x` 四檔。
    - 逆風壓力測試滑桿新增 `重設 0%`、`逆風 5%`、`逆風 10% (1 根停板)`、`逆風 20% (波段重挫)` 快捷 Chip。
  - **保證金回補與減倉雙方案試算（方案 A 入金 / 方案 B 平倉減碼）**：當模擬權益低於原始保證金或維持保證金時，除試算「方案 A：補足至 100% 原始保證金所需入金（並附距維持保證金差額）」外，新增「方案 B：不入金・平倉減碼口數試算」，自動計算需平倉減少幾口才能讓剩餘部位恢復 100% 原始保證金水位。
  - **分析摘要文字複製與風險用語嚴謹化**：新增「複製分析摘要文字」按鈕一鍵產出結構化風控報告；全面移除「部位完全安全」「安全風控等級」「無須補繳」等絕對保證字眼，改為客觀風險描述。

### 🐛 問題修正 (Fixed)

- **台股期貨槓桿計算機（`/futures-calculator/`）多項既有 Bug 修復**：
  - **修復「空頭 (看跌 做空)」切換按鈕選中樣式遺失問題**：原 `FuturesCalculatorClient.tsx` 引用了不存在於 CSS Module 的 `styles.tabBtnActive`，導致點擊空頭按鈕時完全無高亮邊框與底色。現補齊符合台股紅多綠空慣例且通過亮暗雙模 WCAG AA 對比度的 `.longBtnActive` 與 `.shortBtnActive`。
  - **修復分享連結載入小台/微台時保證金未同步更新之問題**：原 URL Query 解析僅切換 `selectedPreset` 而未同步更新對應商品之預設原始/維持保證金，且未將自訂保證金（`im`、`mm`）與壓力測試幅度（`d`）寫入網址。現已補齊完整參數雙向同步與非負邊界清洗。
  - **修復低槓桿（本金大於合約總價值）時多單追繳/斷頭臨界點位顯示為負數之問題**：當本金大於合約總規模（如微台 1 口配 30 萬本金）時，理論臨界點位會小於 0 點，現於 UI 明確標示「`0 點 (指數歸零前不觸發)`」，並對已低於門檻之部位標示「`0 點 (已低於門檻)`」。
  - **修復亮色模式狀態徽章對比度與 `<12px` 字級違規**：將儀表板狀態徽章改為亮暗雙主題 WCAG AA 4.5:1 樣式，並將模擬損益標籤 `text-[0.7rem]` 修正為 `text-xs`。

---

## [1.19.0] - 2026-10-17

### ✨ 新增功能 (Added)

- **複利計算機（`/compound-interest/`）理財分析與互動體驗擴充**：
  - **快速預設情境（Presets）**：新增一鍵帶入「穩健存股 6%」、「大盤指數 10%」與「保守定存 2%」三種常見理財試算情境（中英雙語深度在地化預設金額）。
  - **預期通貨膨脹率與實質購買力試算**：支援設定預期年通膨率（附 `0%` / `2%` / `3%` 快捷切換），以 `BigNumber.js` 逐月折現精算期末資產之「實質購買力」，並於通膨率 `> 0%` 時在歷期明細表同步顯示「實質購買力」專欄。
  - **次要財務指標摘要列**：於三大指標看板下方新增「總投資報酬率 (ROI)」、「複利利息佔比」與「72 法則翻倍時間」三項即時財務指標。
  - **歷期明細表 CSV 匯出**：支援一鍵將歷年或歷月本利和明細表（含 UTF-8 BOM 防 Excel 亂碼）匯出為 `.csv` 檔案。

### 🐛 問題修正 (Fixed)

- **複利計算機（`/compound-interest/`）計算邊界、亮色模式對比度與英文版排版修復**：
  - **修復按「月」計算上限被靜默截斷在 100 個月之問題**：將月期間上限擴展至 `1,200` 個月（對齊 100 年上限），並修復非整數年期間（如 `1.5` 年）尾期月份本息遺失問題。
  - **修復英文版內嵌單位切換鈕遮擋輸入框數字**：將英文版報酬率與期間內嵌切換鈕調整為 `Yr / Mo` 並加大右側內距（`pr-20`），小螢幕自動轉為單欄。
  - **修復亮色模式 WCAG AA 對比度與橫向表格標題滾動問題**：將分段控制器、分享按鈕與 Toast 通知抽離至 CSS Module，於亮色模式下自動降階為深琥珀金（`#b45309` / `#d97706`）；將明細表標題與匯出按鈕移出橫向滾動容器外，避免手機滑動表格時標題跟著捲走。
  - **移除冗餘二次渲染與補齊 URL 防抖清洗**：改以 `useMemo` 同步衍生試算結果，支援 SSR 首屏直接輸出預設試算值；URL Query 參數補齊負數/白名單清洗與 300ms 防抖更新。

---

## [1.18.0] - 2026-10-17

### ✨ 新增功能 (Added)

- **股票質押與維持率壓力測試計算機（`/pledge-calculator/`）實務模型與互動體驗全面升級**：
  - **台股跌停板天數換算**：新增以台股單日 10% 跌停板複利推算模型（`calculateLimitDownDays`），在追繳臨界價與安全線下方直接標註「相當於可承受 X 根跌停板」，將抽象的容許跌幅百分比轉化為投資人直觀的跌停耐受天數。
  - **質押利息與現金流試算**：支援輸入質押年利率（預設 2.5% 並附 2.2% / 2.5% / 3.0% 快捷按鈕），即時精確試算每月應付利息與半年結算利息支出，協助投資人評估槓桿持有成本與股息覆蓋率。
  - **補救方案 C：追加現股擔保品（劃撥現股）**：針對追繳警戒情境，除原有的償還本金（方案 A）與補繳現金（方案 B）外，新增「方案 C：追加現股擔保品」，支援使用者指定現股單價（預設為質押股票單價），自動計算拉回 160% 安全維持率所需的追加股數與張數（無條件進位）。
  - **壓力測試快捷鍵與情境範本 (Presets)**：
    - 新增情境範本一鍵載入：「台積電滿額（借 6 成）」、「高股息低成數（借 4 成）」與「警戒體驗（維持率 132%）」。
    - 壓力測試滑桿增加常用跌幅快捷 Chip：`重設 0%`、`-10% (1 根跌停)`、`-20% (回檔修正)`、`-30% (空頭崩盤)`。
  - **座艙雙欄式風險儀表板與極座標動態比例重構**：
    - 修正 SVG 半圓弧極座標端點計算，解決舊版固定分割點偏離圓周造成的圓弧扭曲問題，使紅、黃、綠三段圓弧完美貼合軌道並隨自訂門檻即時伸縮。
    - 將儀表板右端滿刻度上限動態設為「目標緩衝維持率 × 1.3 倍」（如目標 `160%` 時上限為 `208%+`，目標 `200%` 時自動擴展為 `260%+`），搭配內圈 10 等分精密刻度線與三色區間圖例。
    - 右側整合「借款佔市值比 (LTV)」、「距目標線空間」與「距追繳線空間」三項即時風控距離指標；補齊 `role="meter"` 無障礙屬性與 WCAG AA 4.5:1 亮暗模式狀態徽章。
  - **金融風險用語嚴謹化**：全面移除「極度安全」「安全健康」「無須補繳」等可能造成投資人鬆懈的保證字眼，改為「高於目標維持率」「目標緩衝維持率」「仍須留意極端行情與流動性風險」等客觀風險描述。
  - **分析摘要文字複製與完整網址參數同步**：新增「複製分析摘要文字」按鈕，一鍵產出結構化文字報告方便社群分享；網址雙向同步補齊 `d`（壓力跌幅）與 `r`（借款年利率）。
  - **單元測試全覆蓋**：在 `tests/engine/pledge-calculator.test.mjs` 新增跌停板複利換算、利息支出、追加擔保品數量與零借款邊界條件測試。

---

## [1.17.3] - 2026-10-17

### 🔄 重構變更 (Changed)

- **孕期與產檢假計算機（`/pregnancy-calculator/`）40 週產檢時間軸手機版重新排版與 9 大階段內容升級**：
  - **手機端三層式卡片排版**：行動裝置（`< 640px`）移除左側時間軸軌道縮排，改為全寬卡片搭配左側 4px 狀態色條（已完成綠、當前粉紅、即將到來琥珀黃），並將卡片分為「頂欄（週數膠囊 + 日期區間 + 狀態徽章）」「中欄（16px 階段標題 + 摘要）」「底欄（雙欄結構化檢查細項清單）」三層，解決窄螢幕標題擠壓與斷行零碎問題。
  - **9 大關鍵產檢階段與公費/自費標記**：將產檢時間軸細化為 `5~8 週`（確認著床、胚胎數、心跳、領媽媽手冊）、`8~12 週`（第一次完整產檢抽血驗尿與第一次公費超音波）、`11~14 週`（初唐、頸部透明帶、NIPT/NIPS）、`16~20 週`（二唐篩檢與羊膜穿刺評估）、`20~24 週`（高層次超音波與第二次公費超音波）、`24~28 週`（75g 妊娠糖尿病篩檢與貧血檢驗）、`28~32 週`（第三次公費超音波、胎位評估與自費百日咳 Tdap 疫苗接種）、`33~37 週`（乙型鏈球菌 GBS 篩檢、自費 RSV 疫苗評估與確認生產方式）、`38~40 週`（足月胎音監測與內診評估），並為各細項標註「公費補助」與「自費選做」雙語標籤。
  - **新增產檢項目選擇與經驗分享 FAQ**：「產檢的檢查項目這麼多，我真的每一個都要做嗎？」結合尊重醫師專業判斷、衡量自身經濟負擔，以及如同買保險般及早發現問題的親身經驗分享（同步更新中英雙語 FAQ 與 JSON-LD 結構化資料）。
  - **孕期自我準備與待產包 Check List 改為 5 階段（扣除前 4 週，5~36 週每 8 週一單位 + 最後 4 週）**：專注於準爸媽自行準備事項（不重複醫院產檢排程），劃分為 `5~12 週`、`13~20 週`（含健保洗牙與托育規劃）、`21~28 週`（實地試推與挑選定案嬰兒推車、汽車安全座椅、後座遮陽簾/隔熱紙與後座寶寶觀察鏡、嬰兒床、消毒鍋與溫奶器，並預先構思寶寶名字與預約孕婦寫真）、`29~36 週`（待產包打包、新生兒衣物清洗、拍攝孕婦寫真、彌月試吃與規劃新生兒保險）及 `37~40 週（最後一個月）`（正式採購/安排到貨前期選定之大型育兒設備，完成嬰兒床組裝與汽車安全座椅、隔熱紙/遮陽簾及後視觀察鏡安裝待命）。
  - **純函數資料抽離**：將 9 大階段里程碑結構與日期推算抽離為 [`engine.ts`](app/pregnancy-calculator/engine.ts) 的 `CLINICAL_MILESTONE_DEFS` 與 `buildClinicalMilestones`，並同步更新單元測試。

---

## [1.17.2] - 2026-10-08

### 🐛 問題修正 (Fixed)

- **PAC 測試與除錯器（`/pac-tester/`）點「執行模擬」完全沒反應**：部署流程同步 S3 時以 `--exclude "*.js"` 排除根目錄 JS，只另外上傳 `sw.js` 與 `_next/static`，導致 `public/pac-tester-worker.js` 從未上傳、線上回 404，Worker 載入失敗。`deploy.yml` 新增步驟上傳根目錄非雜湊 JS（短快取）。
- **PAC 測試與除錯器 Worker 載入失敗時靜默吞錯**：原本只處理逾時錯誤，其他例外直接被忽略，畫面毫無提示。現在記錄 `console.error` 並顯示「模擬執行環境載入失敗」錯誤橫幅（單次與批量測試皆適用）。

---

## [1.17.1] - 2026-10-07

### 🐛 問題修正 (Fixed)

- **PAC 產生器（`/pac-generator/`）匯入彈窗在長頁面看不到輸入框**：彈窗位於含 `backdrop-filter` 的祖先容器內，該屬性會讓 `position: fixed` 改為相對祖先定位，導致遮罩撐滿整個頁面、輸入框置中於頁面中段而落在可視範圍外。改用 `createPortal` 掛到 `document.body`，彈窗固定置中於視窗。

---

## [1.17.0] - 2026-10-07

### ✨ 新增功能 (Added)

- **PAC 產生器（`/pac-generator/`）新增「網路環境偵測」條件（`dnsProbe`）**：以「探測主機名=預期 IPv4」格式（如 `dns2.corp.local=10.10.10.10`）產生 `dnsResolve("dns2.corp.local") === "10.10.10.10"`，用於判斷是否位於公司內網並切換代理。格式不符時輸出 `false`，不把原始輸入拼進腳本。匯入 PAC 時可自動辨識此寫法（左右對調、`==` 皆可）。FAQ 條件清單同步更新為 15 種。

### 🐛 問題修正 (Fixed)

- **PAC 產生器（`/pac-generator/`）匯入含內嵌輔助函式的 PAC（如 Menlo Security 雲端代理）解析錯誤**：
  - `FindProxyForURL` 內以 `var hostOrDomainIs = function(...) { return ... }` 定義的輔助函式，其 `return` 被誤當成代理節點（產生 `.`、`(host === val)` 等垃圾節點）。現在只分析 `FindProxyForURL` 本體並排除輔助函式。
  - `hostOrDomainIs(host, "x")` 等自訂輔助函式無法辨識、被轉成錯誤的 URL 萬用比對規則。現在依**函式本體**判斷語意（不看函式名稱）：`return h === v || dnsDomainIs(h, '.' + v)` 視為網域後綴、`return h === v` 視為精確主機，其他寫法不猜測、照常產生警告；內建 `localHostOrDomainIs` 近似為精確主機，若腳本重新定義則以腳本為準。
  - 註解中出現「IPv6」字樣會誤開啟 IPv6 模式；旗標偵測改為排除註解後再判斷。
  - 同一個 `if` 內混合精確主機（`hostIs` / `host ===`）與網域後綴（`dnsDomainIs`）時，精確主機被整批併入後綴規則，導致 `x.go.microsoft.com` 等子網域也被誤判命中。現在拆成「網域後綴」與「精確主機」兩條規則，已被後綴涵蓋的主機不重複列出。

---

## [1.16.3] - 2026-10-07

### 🐛 問題修正 (Fixed)

- **檔案雜湊計算工具（`/checksum-verifier/`）、圖片處理工具（`/image-processor/`）拖入一個檔案會變成兩個**：拖放區的 `onDrop` 加入檔案後，事件冒泡到 `window` 的全域 `drop` 監聽又加入一次。全域監聽改為先檢查 `e.defaultPrevented`，已由拖放區處理的事件不再重複加入。

### 🔄 重構變更 (Changed)

- UI 規範檢查（`tests/check-ui-standards.mjs`）新增選用的整檔檢查介面 `checkFile`，並新增規則 `no-duplicate-drop-handling`：同時有全域 `drop` 監聽與 `onDrop` 拖放區、卻未檢查 `defaultPrevented` 的檔案會中斷建置。

---

## [1.16.2] - 2026-10-06

### 🐛 問題修正 (Fixed)

- **檔案雜湊計算工具（`/checksum-verifier/`）無法計算大型檔案**：拖入數 GB（如 8GB）檔案時出現 `計算失敗: NotReadableError`。原因是整檔 `file.arrayBuffer()` 一次載入記憶體，超過瀏覽器單一緩衝區上限；且 `crypto.subtle.digest` 不支援分段計算。
  - 引擎新增 `computeAllHashesFromSource`：以 16MB 區塊串流讀檔，一次讀檔同時計算 MD5 / SHA-1 / SHA-256 / SHA-512 / CRC32，記憶體用量固定、與檔案大小無關。
  - 讀檔失敗改拋 `ChecksumReadError`，UI 顯示可操作的雙語提示（檔案被移動 / 修改、外接或網路磁碟中斷），並以 `console.error` 記錄檔名與大小。
  - 移除檔案或清除全部時以 `AbortController` 中止進行中的計算，不再於背景空轉。
  - 進度改為整體讀取百分比，五種演算法同步推進。

### 🔒 安全性 (Security)

- **`next` 升級至 16.3.8**（`package.json` 下限 `^16.3.8`，`eslint-config-next` 同步）：修補嚴重等級 RCE 漏洞 [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)（`next/og` ImageResponse，本站 OG 圖有使用）。屬安全急件，不受「發布未滿 3 個月暫緩」限制。
- `npm audit fix` 一併更新 `brace-expansion`、`source-map-js`（DoS 類，僅建置／Lint 工具鏈）。
- **已知未修、經評估暫不處理**：
  - `braces`（經 `eslint-config-next` → `fast-glob` → `micromatch`）：上游所有版本皆受影響、無修補版；`npm audit fix --force` 會把 `eslint-config-next` 降回 14.x，不可接受。僅存在於開發期 Lint，輸入為專案自身的 glob，無外部攻擊面。
  - `node-forge`（GHSA-86w9-cpqp-85rv，RSA PKCS#1 v1.5 簽章驗證）：無修補版。本站僅用於憑證／金鑰格式轉換與 DN、AKI/SKI 比對，簽章驗證走 `@peculiar/x509`，不會呼叫 node-forge 的簽章驗證。

### 🔄 重構變更 (Changed)

- 新增依賴 `hash-wasm@^4.12.0`（WebAssembly 漸進式雜湊），大型檔案的 MD5 速度大幅提升。既有 `md5Hex` / `crc32Hex` / `computeHashHex` / `computeAllHashes` 保留不變。
- 更新雙語 FAQ（含 JSON-LD）：「MD5 為何較慢」改為「可以計算多大的檔案」，隱私說明改述為 File API 與 WebAssembly。
- 新增回歸測試：分塊邊界未對齊、空檔案、進度單調、逐塊讀取、讀取失敗錯誤型別、中止行為。

---

## [1.16.1] - 2026-10-01

### ✨ 新增功能 (Added)

- **孕期計算機（`/pregnancy-calculator/`）新增「即時產檢階段引導卡」與「空檔期狀態導航」**：
  - 產檢時間軸新增動態 Stage Banner，即時定位孕媽咪當前週數所處階段，破除週數區間空檔的疑慮。
  - 當處於臨床重大排檢空檔（如 9~10 週胚胎穩定期、14~15 週舒適期過渡、33~34 週產前準備期）時，清楚標示【生理平穩過渡期】、具體過渡期衛教指引，並即時倒數計算距離下一項重大篩檢的尚餘天數與週數。
  - 時間軸節點新增【即將到來】（Next Upcoming）動態視覺標籤，已過期項目優化為【已完成】。
  - 時間軸頂部新增醫學衛教小註解，說明時間軸聚焦於「黃金檢查窗口」，非連續日曆切塊，讓準爸媽安心。

### 🔄 重構變更 (Changed)

- **產檢階段計算邏輯抽離至核心引擎（`engine.ts`）**：
  - 新增 `getClinicalStageStatus` 純函數與完整型別定義，支援全孕期 13 個階段區間（含未滿 6 週早期著床、8 大重大檢查窗口、3 大平穩空檔期、40+ 週過期妊娠）。
  - 中英雙語字典（`translations.ts`）100% 對稱補齊相關文案。
  - 新增單元測試 `tests/engine/pregnancy-calculator.test.mjs`，覆蓋所有邊界天數與週數。

---

## [1.16.0] - 2026-09-19

### ✨ 新增功能 (Added)

- **首頁新增「分享」功能**：主動點擊分享按鈕才會把目前分類／搜尋字詞組成帶參數網址並複製到剪貼簿（比照 `Base64Client.tsx` 的 toast 提示慣例），對方開啟分享連結後會套用該狀態。

### 🔄 重構變更 (Changed)

- **首頁 (`app/HomeClient.tsx`) Tab／搜尋狀態管理重構**：
  - 平常點 Tab、輸入搜尋不再呼叫 `router.replace()` 弄髒網址列，只更新本地 state。
  - 新增本地記憶：分類分頁改存進 `localStorage`（`smalltools_active_tab`），下次沒帶網址參數重新造訪時會沿用；搜尋字詞維持不記憶（分類記得、關鍵字不記得，符合多數工具網站慣例，且已有「最近使用」「常用釘選」涵蓋復原需求）。
  - 網址參數（分享連結帶入）優先於本地記憶，命中時視為一次變更寫回本地。
  - `activeTab`／`searchQuery` 初始值改用 `useState` lazy initializer 同步決定，移除原本用來同步網址參數的 `effect`。

### 🐛 問題修復 (Fixed)

- **修復 PAC 規則產生器 Hydration Mismatch**：`engine.ts` 的 `generatePacScript` 預設移除動態產生的毫秒時間戳記（改為選填參數），確保 SSR 伺服器渲染與 Client 端水合字串 100% 一致，徹底消滅 React Hydration 崩潰報錯。
- **消滅 React 19 Script 標籤警告**：`app/layout.tsx` 根版面注入的主題腳本改用 Next.js 官方 `<Script strategy="beforeInteractive">`，避免客戶端渲染時觸發 `Encountered a script tag while rendering React component` 警告。

## [1.15.0] - 2026-09-18

### ✨ 新增功能 (Added)

- **新增「PAC 規則產生器」（`/pac-generator/`）**：
  - 專為自動代理配置 (Proxy Auto-Config) 腳本打造的視覺化編排生產工具。
  - 支援代理伺服器池 (Proxy Pool) 定義（DIRECT、PROXY、HTTPS、SOCKS、SOCKS5、自訂字串）與故障轉移 Fallback 容錯鏈。
  - 支援多種分流條件（純主機名、網域後綴、完全比對、萬用字元、IPv4 CIDR、IPv6 CIDR、正則表達式）。
  - 內建 4 大常用情境範本（企業內網繞行、開發者本機除錯、指定雲端服務白名單代理、空白自訂）。
  - 支援一鍵複製標準 JavaScript PAC 代碼、下載 `.pac` 檔案（MIME: `application/x-ns-proxy-autoconfig`）、複製 Data URI（RFC 2397）、以及跨工具「前往 PAC 測試器驗證」的一鍵轉移功能。
- **PAC 規則產生器功能重大升級**：
  - **單一分流規則支援多值輸入與 `||` 串聯**：輸入欄位升級為可伸縮文字框，支援同時輸入多組網域、主機、IP 網段、協定或埠號（每行一個，或以逗號/分號分隔），腳本自動以高效 `||` 條件塊合併產出。
  - **全新「智能匯入 (Import)」功能**：內建括號深度平衡解析引擎（`importer.ts`），支援直接貼上現有 PAC 腳本（JavaScript）或上傳 `.pac` / `.js` / `.json` 檔案，自動逆向提取 Proxy 池、各類分流規則（自動解開 `isResolvable` 等 wrapper）與預設兜底行為，亦支援備份設定檔匯出匯入。
  - **全面實現 MDN PAC 官方規範條件**：擴增為 14 種條件比對模式（新增用戶端本機 IP 分流 `myIpAddress`、`myIpAddressEx`、傳輸協定 `protocol`、通訊埠號 `port`、工作日/週末排程 `weekdayRange`、時段範圍 `timeRange`）。
  - **視覺化「多重備援代理鏈」建構器**：Proxy Pool 新增「+ 組合備援鏈」與 `CHAIN` 類型，使用者可自由挑選節點序列（如 `[Proxy 1] ➔ [Proxy 2] ➔ [DIRECT]`），一鍵切換「標準單行」或「JavaScript 多行字串拼接 (+)」排版輸出。
  - **卡片間「虛擬插入指示框」拖曳體驗 (Drop Insertion Indicator)**：拖曳規則卡片時，不再全框高亮個別卡片，改於卡片與卡片間隙即時展開帶有脈衝光暈的「放開以移至此處」虛擬插槽，排序意圖精準直覺。
  - **狀態提示與錯誤警告橫條優化**：多值輸入提示移至卡片底端通欄（無錯誤時展示輔助說明，有語法問題時即時切換為高對比告警橫條），避免擠壓輸入框。
  - **企業級字串拼接備援代理鏈支援**：逆向解析引擎與模擬沙盒完美支援 JavaScript 字串拼接（如 `"PROXY wcg1:8080; " + "PROXY wcg2:8080"`）與引號內分號處理。
  - **已停用規則註解保留**：關閉之規則於產出腳本中以註解方式留存，方便追蹤與手工調整。
  - **節點與規則一鍵清空**：Proxy Pool 與 Routing Rules 新增安全確認之清空按鈕。

- **PAC 測試與除錯器功能升級**：
  - **沙盒標準函式庫全面補齊**：完整實現 MDN 官方標準函式 `weekdayRange`、`timeRange`、`dateRange`、`sortIpAddressList`、`getClientVersion`。
  - **深度網路解析看板**：單次測試結果新增主機型態（IPv4 / IPv6 / Domain）、DNS 解析實體 IP、通訊協定與端口、客戶端 IP 五重狀態卡片。
  - **時間與排程模擬 (Time Simulation)**：Mock Context 新增當前星期與 24 小時時段模擬，便於測試時間分流策略。
  - **按鈕整合與無障礙字級優化**：合併「清空全部」按鈕，字級與亮暗色彩全面達標 WCAG AA。

- **新增「PAC 測試與除錯器」（`/pac-tester/`）**：
  - 專為 PAC 腳本深度審計與除錯打造的純前端沙盒執行環境。
  - **單一網址深度除錯 (Single URL Trace)**：即時模擬 `FindProxyForURL(url, host)` 執行，輸出決策走向、回傳代理字串、毫秒級耗時與完整的逐步條件判定軌跡 (Trace Steps)。
  - **批量網址回歸測試 (Batch Regression Test)**：一次貼入多組 URL 進行批量分流驗證，支援狀態篩選（全部、直連、代理、錯誤）與一鍵匯出 CSV 稽核報表。
  - **虛擬網路環境模擬 (Mock Context)**：支援自訂模擬客戶端本機 IPv4 (`myIpAddress`)、IPv6 (`myIpAddressEx`) 以及靜態 Mock DNS 主機映射字典。
  - **語法與相容性診斷 (Static Linter)**：即時檢驗 `FindProxyForURL` 進入點、return 語句，並主動提示 IPv6 在傳統 `isInNet` 中的潛在相容性陷阱。
  - 純前端安全沙盒隔離執行，遮蔽全域物件並具備逾時防護機制，100% 零伺服器隱私保護。

### 🔧 重構 (Changed)

- **PAC 測試器改在獨立 Web Worker 執行 PAC 腳本**：使用者貼上的腳本內容不受控，原本在主執行緒同步 `new Function()` eval 執行，一旦卡住（無窮迴圈等）會凍結整個分頁；改由 `public/pac-tester-worker.js` 獨立執行緒執行並加上逾時保護，超時直接 `terminate()`，主執行緒維持可回應狀態。
- **PAC 產生器規則卡片拆出 `RuleCard.tsx` 並以 `React.memo` 優化**：避免編輯單一規則時整份規則列表重新渲染。
- **抽出共用 IPv4 / IPv6 位址解析工具 `app/utils/ipUtils.ts`**：`ip-calculator`、`pac-generator`、`pac-tester` 三處原本各自重複實作字串轉整數 / BigInt 的邏輯，統一抽到共用模組維護。
- **全站 32 個工具的 `TRANSLATIONS` 文案物件抽離為獨立 `translations.ts`**：延續既有的模組化拆分慣例（呼應 `og-generator` 已採用的做法），讓 `XxxClient.tsx` 保持在合理行數以內，純粹的檔案搬移不變更文案內容。其中 `har-cleaner` 原本混雜於 `constants.ts` 中的文案也一併拆出；`hourly-rate-calculator` 原本是 67 處行內 `isEn ? 'English' : '中文'` 三元運算子，先重構為結構化 `TRANSLATIONS['zh-TW' | 'en']` 物件後再抽離（含 JSX 標籤內容與資料層既有雙語欄位選值刻意保留原樣，未強行納入文案字典）。

---

## [1.14.0] - 2026-09-16

### ✨ 新增功能 (Added)

- **檔案雜湊計算與校驗工具新增「下載校驗清單」**：可選擇 MD5 / SHA-1 / SHA-256 /
  SHA-512 / CRC32 其中一種演算法，將目前已計算完成的所有檔案一次匯出成
  GNU coreutils 相容格式（`<hash>  <filename>`）的校驗清單檔（`SHA256SUMS.txt`
  等慣用命名），開頭附上 `# Generated: <UTC 時間>`、`# Algorithm`、
  `# Created by tools.cjkuo.net` 註解行，方便分享給他人用 `sha256sum -c` 等
  指令核對，也可再次拖回本工具驗證（已用 `sha256sum -c` 實際交叉驗證輸出格式）。
  - `engine.ts` 新增純函數 `buildChecksumManifest`、`checksumManifestFileName`，
    並補上對應單元測試（含輸出可被自身 `parseChecksumText` 正確解析的往返測試）。

### 🔧 變更 (Changed)

- **「解析結果」比對清單改為單筆彙總徽章**：無檔名限制的通用雜湊（貼上單一雜湊
  字串比對）原本會對「每一個」已上傳檔案各自列出一個比對徽章，檔案一多就變成
  一筆項目後面跟著一堆不相符徽章，雜訊過多。改為每筆校驗項目只顯示一個彙總
  徽章（任何檔案相符即顯示相符並標註符合的檔名，否則才顯示不符／計算中／
  不支援比對）。
- **「全部清除」一併清空「驗證雜湊值」文字框**：原本只清空檔案清單，換一批
  檔案時容易誤用到殘留的舊校驗內容；且改用醒目的危險色按鈕（含垃圾桶圖示），
  取代原本不顯眼的灰色文字按鈕。
- **「拖曳更多檔案」入口固定於清單最上方**：原本置於檔案清單最下方，檔案一多
  需捲動到底才找得到；改置於清單標題正下方，隨時可見。
- **修正多處低於全站字級規範下限的過小字體**：解析結果的雜湊預覽、比對徽章、
  演算法標籤、驗證雜湊值輸入框等處字級低於 `smalltools-code-standards` 規範
  的 12px／14px 下限（部分以 `text-[0.68rem]` 等 rem 單位寫法躲過現有僅偵測
  `px` 單位的過小字體檢測腳本），全數提升至合規字級；主要雜湊值改採
  `text-sm`（14px）monospace，次要參考用途（如清單預覽截斷後的雜湊）維持
  `text-xs`（12px）。

---

## [1.13.0] - 2026-09-16

### ✨ 新增功能 (Added)

- **新增「檔案雜湊計算與校驗工具」（`/checksum-verifier`）**：純前端拖曳檔案即可計算
  MD5、SHA-1、SHA-256、SHA-512、CRC32，並可直接把官方提供的校驗清單檔案（`.sha256`、
  `.md5`、`.sfv`、`SHA256SUMS`、`CHECKSUMS` 等常見命名）一起拖進同一個拖放區，自動判斷
  為校驗清單而非目標檔案，解析後與已上傳檔案逐一比對是否相符。
  - `engine.ts` 提供純函數：`md5Hex`（RFC 1321 純 JS 實作）、`crc32Hex`（CRC-32/ISO-HDLC，
    與 zlib/ZIP/PNG/SFV 相同變體）兩者處理大檔案時皆定期讓出主執行緒避免卡頓；
    `computeHashHex` / `computeAllHashes`（SHA 系列透過 Web Crypto SubtleCrypto 原生計算）、
    `parseChecksumText`（支援 GNU coreutils `<hash>  <filename>`、BSD/OpenSSL
    `SHA256 (filename) = <hash>`、SFV `<filename> <crc32hex>`、純雜湊字串共四種格式）、
    `matchEntryAgainstFile` / `entryAppliesToFileName`（比對邏輯，遇到本工具未提供的
    演算法如 SHA-384 會誠實標示「不支援比對」而非給出誤導結果）。
  - 支援多檔同時拖曳、每個檔案獨立顯示計算進度與四種演算法結果，並保留「持續性拖曳」
    入口與全域拖曳浮層，可隨時追加新檔案或新的校驗清單。
  - 已補上 `tests/engine/checksum-verifier.test.mjs`（含 RFC 標準測試向量交叉驗證）、
    雙語 FAQ 與 SEO Metadata，並登記於 `app/config/tools.tsx` 中央工具註冊表。

---

## [1.12.1] - 2026-09-13

### 🐛 修復 (Fixed)

- **憑證產生器：「CA + 伺服器憑證」模式每次產生都會建立一組新 CA**：先前每按一次「產生憑證」，
  即使只是想再簽發一張新的伺服器憑證，`handleGenerate` 都會呼叫 `generateCaCertificate`
  產生全新根 CA（新金鑰、新序號），導致先前已匯入作業系統/瀏覽器信任清單的 CA 立刻失效，
  每張新憑證都要重新安裝一次 CA 才會被信任。
  - 現在會在記憶體中保留第一次產生的 CA（`savedCa`），CA 設定面板新增「沿用目前這組 CA
    簽發」勾選框（有 CA 時預設勾選），沿用時會停用 CA 名稱／組織／國別欄位並顯示目前
    沿用中的 CA 名稱與到期日；取消勾選才會依畫面上的設定重新產生一組新 CA。
  - 沿用狀態僅存在於當前分頁的記憶體中，重新整理頁面後仍會清空（與既有「重新整理即清空」
    行為一致）。

### ✨ 新增功能 (Added)

- **國別代碼欄位改為下拉選單**：`/cert-generator/` 的「國別代碼」欄位由純文字輸入改為
  66 國常用國家的下拉選單（依當前語系排序顯示），選擇「其他（自行輸入代碼）」可切回
  文字輸入任意 2 碼代碼，並可一鍵「改回下拉選單」。
- **匯入既有 CA**：CA 設定面板新增「匯入既有 CA（貼上先前產生並下載的憑證與私鑰）」，
  貼上 CA 憑證 PEM 與私鑰 PEM 即可重建可簽發用的 CA bundle 並自動切換為沿用狀態，
  解決重新整理頁面、換分頁或跨 session 後想繼續用同一顆 CA 簽發卻無法沿用的問題。
  - `engine.ts` 新增 `importCaCertificate`：驗證憑證 `basicConstraints.ca === true`、
    以憑證公鑰演算法重建 PKCS#8 私鑰的 import 參數（RSA 額外補上 SHA-256 hash），
    並簽發一張短期探測憑證交叉驗證私鑰與憑證公鑰確實成對，避免貼錯組合卻悄悄簽出
    無效憑證鏈；`toBundle` 同步簡化為直接接受 `privateKey`。
  - 補上 3 組回歸測試：三種演算法（RSA/ECDSA/Ed25519）匯入後皆可正常簽發新憑證、
    非 CA 憑證應拋出明確錯誤、私鑰與憑證不成對時應拋出明確錯誤而非靜默簽出壞憑證鏈。
- **FAQ 新增 PQC（後量子密碼）支援說明**：新增一則「是否支援 ML-DSA / Dilithium 等
  後量子演算法」的問答，說明目前受限於瀏覽器 Web Crypto API 尚未實作 PQC 簽章演算法、
  X.509 對 PQC 的簽章格式也仍在標準化中，故暫不支援。

---

## [1.12.0] - 2026-09-13

### ✨ 新增功能 (Added)

- **新工具：CA / 伺服器憑證產生器（`/cert-generator/`）**：純前端自簽憑證產生工具，
  支援「純自簽（不經過 CA）」與「CA + 伺服器憑證」兩種模式、RSA 2048/4096、
  ECDSA P-256/P-384、Ed25519 金鑰演算法，以及 PEM、DER、PKCS#12（RSA 限定）
  三種輸出格式，可自訂多組 DNS / IP SAN 與有效天數，適合本地開發與內部測試
  HTTPS 環境。
  - 底層改採 `@peculiar/x509`（Web Crypto API）取代 node-forge 產生金鑰與簽署憑證
    ——node-forge 的憑證簽署寫死僅支援 RSA，無法產生 ECDSA/Ed25519 憑證；
    PKCS#12 打包仍沿用 node-forge（僅 RSA，橋接 WebCrypto 匯出的 PKCS#8 私鑰）。
  - `engine.ts` 提供純函數 `generateSelfSignedCertificate`、`generateCaCertificate`、
    `generateServerCertificate`、`buildPkcs12`、`parseSanInput`，並補上 8 組涵蓋
    憑證擴充欄位正確性（basicConstraints / keyUsage）、簽發鏈驗證、SAN 解析、
    自簽模式、Ed25519 全流程與 PKCS#12 演算法限制的單元測試。
  - 已登記於 `app/config/tools.tsx` 註冊表（developer 分類），sitemap 與首頁自動
    衍生收錄；FAQ（8 則）、SEO Metadata、OG 圖片、繁中／英文頁面皆已補齊。

### 📦 依賴 (Dependencies)

- 新增 `@peculiar/x509` `^2.1.0`、`reflect-metadata` `^0.2.2`。

---

## [1.11.0] - 2026-09-13

### ✨ 新增功能 (Added)

- **IP 子網段計算器新增「網段搜尋：IP 是否在範圍內」功能**：於既有 `/ip-calculator`
  頁面加入搜尋欄位，輸入目標 IP 後即時比對是否落在上方已計算網段的網路位址／廣播位址
  範圍內（含邊界），顯示「位於此網段範圍內」或「不在此網段範圍內」，不另開新頁。
  - `engine.ts` 新增純函數 `isIpInRange(targetIpInt, networkInt, broadcastInt)`，補上
    對應單元測試（含網路位址、廣播位址邊界與範圍外案例）。
  - FAQ 常見問題新增一則對應說明（`IpCalculatorClient.tsx` 與 `page.tsx`／`en/page.tsx`
    的 JSON-LD FAQPage 結構化資料同步更新，繁中／英文皆補上）。
- **CIDR 輸入支援省略末尾 Octet 的縮寫寫法**：「CIDR 標記法」欄位允許輸入
  `192.168.20/24`、`192.168/16` 這類常見縮寫（比照 ipcalc 慣例），缺少的 Octet
  自動補 0 再計算。`engine.ts` 新增純函數 `normalizeIpOctets`，並補上對應單元測試
  （合法縮寫、超過 4 段、非數字、前導零、超出範圍等邊界案例）。

### 🔧 變更 (Changed)

- **「可用 IP 位址列表」與「網段搜尋：IP 是否在範圍內」整合為單一區塊**：移除獨立的
  範圍搜尋卡片，改為同一個搜尋框身兼兩種功能——輸入部分字串（如 `.100`）過濾清單，
  輸入形似完整 IPv4（四段數字）則同時顯示是否落在網段範圍內的判定結果，減少版面
  重複與操作步驟。
- **大網段提示文字修正亮色模式對比度**：可用 IP 列表上方的「目前網段包含 N 個可用
  IP…」提示原本在亮色模式下沿用暗色模式的霓虹青色文字（`#00f0ff`），對比度不足；
  改用既有 `styles.accentText`（亮色模式 `#0284c7` Sky 600），與頁面其餘強調色元件
  一致。

### 🐛 修復 (Fixed)

- **合併後的搜尋框無法用子網 CIDR 查詢範圍包含關係**：例如網段為
  `192.168.0.0/20` 時輸入 `192.168.3.0/24`，先前的範圍搜尋只認得單一完整 IPv4，
  遇到帶 `/` 的子網會被判斷為「查無符合關鍵字的可用 IP」且不顯示任何範圍搜尋結果。
  - `engine.ts` 新增純函數 `isRangeWithin(subNetworkInt, subBroadcastInt, networkInt,
    broadcastInt)`，判斷子網範圍是否完整落在外層網段內（兩端皆須介於邊界內，含
    邊界；比外層更大的「父網段」不算包含於內）。
  - 搜尋框輸入 `IP/CIDR`（可省略末尾 Octet）時改為計算該子網的網路/廣播位址，
    並用 `isRangeWithin` 判定是否完整落在目前網段內，同時該輸入不再誤觸清單的
    子字串過濾。
  - 原本這段「判斷輸入框內容是單一 IP、IP/CIDR 或一般過濾字」的解析邏輯只寫在
    `IpCalculatorClient.tsx` 的 `useMemo` 裡、未受測試覆蓋；抽成 `engine.ts` 的
    純函數 `parseRangeQuery`，並補上單元測試（完整 IP、含縮寫的 IP/CIDR、格式合法
    但數值不合法、一般過濾字與空字串），避免日後修改時再次回歸。

---

## [1.10.1] - 2026-09-11

### 🐛 修復 (Fixed)

- **貸款試算工具（房貸、車貸、個人信貸）在「開辦費 ≥ 貸款金額」無效輸入下的靜默失敗**：
  三支工具共用的 APR 求解函式 `app/utils/finance.ts` 的 `solveApr`，遇到淨撥款金額
  （貸款金額 − 開辦費）小於等於 0 時會直接回傳 `0`，`mortgage-loan`／`car-loan` 因此
  會顯示一個看似合理實則錯誤的「APR 0%」；`personal-loan` 更嚴重——自己重複實作了
  一份幾乎相同的 `calculateAPR`，外層再把「算不出來（0）」偷偷退回「表面年利率」，
  導致使用者把開辦費調到遠大於貸款金額時，APR 完全沒有變化、看起來一切正常
  （違反鐵則 12「零靜默失敗」）。
  - `solveApr` 改為在無法求解時回傳 `null`，與「真的收斂到 0%」的合法結果區分開來
    （例如年利率與手續費皆為 0 的情境，本來就該顯示 0%，不受影響）。
  - `personal-loan/engine.ts` 移除本地重複的 `calculateAPR`，改為共用 `solveApr`
    （比照 `mortgage-loan`／`car-loan` 既有寫法），不再有遮蓋邏輯。
  - 三支工具的 UI 在 `aprPercent`/`apr` 為 `null` 時顯示「—」並附上明確警示文字
    （「開辦費不可大於或等於貸款金額，實質年利率無法計算」），`mortgage-loan` 的
    雙貸款組合模式（`fee1`+`fee2`）一併涵蓋。
  - `tests/engine/{personal-loan,mortgage-loan,car-loan}.test.mjs` 補上對應邊界測試。

---

## [1.10.0] - 2026-09-11

### ✨ 新增功能 (Added)

- **金融試算趨勢圖改用 ECharts，補上 hover 顯示數值**：房貸、車貸、個人信貸、複利
  4 支工具原本的歷期走勢圖是自製 HTML5 Canvas 手繪（漸層填色 + `ctx.fillText` 手刻座標軸），
  滑鼠移到圖表上完全不會顯示任何數值。新增共用元件 `app/components/TrendChart.tsx`，
  改用 `echarts`（動態 import + tree-shaking，只裝 `LineChart` / `GridComponent` /
  `TooltipComponent` / `CanvasRenderer`），取得原生 hover tooltip；複利試算的本金／
  利息堆疊區域圖以 ECharts `stack` 機制重繪，視覺效果與原本一致。
  - **順手修正一個小缺陷**：原本 Canvas 版本只在 `schedule` 變動時才重讀
    `data-theme` 屬性，使用者切換亮暗模式若沒同時改輸入值，圖表配色不會即時更新；
    新元件改用 `MutationObserver` 監聽 `data-theme` 變化即時重繪，切換亮暗模式立即生效。
  - `pledge-calculator` 與 `futures-calculator` 的維持率／槓桿儀表是靜態 SVG 半圓
    儀表板（顯示當下單一數值，非時間序列），不在本次改動範圍內。

### 📦 依賴 (Dependencies)

- 新增 `echarts` `^6.1.0`。

---

## [1.9.0] - 2026-09-11

### 🔧 變更 (Changed)

- **金融試算全面改用 BigNumber.js 定點數，並抽離為無副作用純函數引擎**：
  8 支金融 / 職場工具（複利、信貸、車貸、房貸、股票質押、台指期、薪資勞健保、
  真實時薪）原本在 `*Client.tsx` 內以原生浮點運算子累加金額，長攤還迴圈會累積
  分位以下誤差、且散見 `Math.round(x + 1e-9)` 之類的修正 hack（違反全域鐵則 5、6）。
  - 每支工具的計算邏輯抽離至 `app/[tool]/engine.ts`（薪資與時薪併入既有
    `salaryConfig.ts` / `utils.ts`），全部金額加減乘除改走 `bignumber.js` 鏈式運算，
    UI 顯示前才落地為 `number`（鐵則 9 領域邏輯與 UI 分層）。
  - 新增共用模組 `app/utils/decimal.ts`（BigNumber 全域組態與換算入口）與
    `app/utils/finance.ts`（APR 二分求解：折現因子逐期遞乘、收斂提前結束）。
  - 業務層級數值（元、APR%、投保級距金額）與重構前完全一致；僅修正原本
    浮點累加造成的分位以下漂移。
- **日期敏感工具抽離純函數引擎並修正時區地雷**：離職預告期（`resignation-calculator`）
  與孕期試算（`pregnancy-calculator`）原本在 `*Client.tsx` 內以 `new Date('YYYY-MM-DD')`
  解析純日期字串（UTC 解析，UTC+8 以外時區會退一天，違反鐵則 7、8），且約 200 行
  日期計算內嵌於元件本體。
  - 新增 `app/resignation-calculator/engine.ts`（勞基法第 16 / 38 條預告與特休、
    正反向推算、逾期判定、特休折現、謀職假）與 `app/pregnancy-calculator/engine.ts`
    （LMP / EDD / 超音波 / IVF 四模式 EDD 推算、CRL Hadlock 換算、當前週數、
    產假 56 天區間與勞保生育給付 / 育嬰津貼）。
  - 日期字串一律以 `parseYmd` 依「本地零時」建構；`today` 可注入以利測試；
    孕期津貼金額改走 BigNumber.js。
- **`tsconfig.json`**：開啟 `allowImportingTsExtensions`，引擎以 `.ts` 副檔名互相引入，
  供 Node 原生 `node:test` 直接載入 TypeScript。
- **正規化全站 29 支原始碼檔案的換行符**：既有檔案含殘留 lone CR（`\r\r\n`），
  Git 判定為二進位、任何一行修改都產生整檔 diff；統一收斂為乾淨 CRLF
  （`git diff --ignore-all-space` 驗證零內容變動）。
- **`.gitignore`**：新增 `tsconfig.tsbuildinfo`（TS 增量建置快取，改為不追蹤）。

### ✨ 新增功能 (Added)

- **`npm run test:engine` 引擎單元測試套件**（`node:test`，73 項）：涵蓋各金融引擎的
  歷期攤還表、總額、APR、投保級距與稅額（對「凍結的浮點基準演算法」批次交叉驗證，
  確保定點數改寫在整數元層級零回歸），以及離職 / 孕期引擎的法定天數級距、日期
  推算與時區安全。併入 `npm test` 與 `prebuild` 阻斷關卡。

### 📦 依賴 (Dependencies)

- 新增 `bignumber.js` `^9`。

---

## [1.8.2] - 2026-09-11

### 🔧 變更 (Changed)

- **建置工具鏈改用 ESLint Flat Config**：Next 16 已移除 `next lint`（原 `npm run lint` 靜默失效、回傳退出碼 0），改新增 `eslint.config.mjs`（`eslint-config-next/core-web-vitals` 原生扁平設定），`npm run lint` 改為 `eslint .`。`eslint` 暫鎖 `^9`：`eslint-config-next@16.3` 內建的 `eslint-plugin-react` 尚未相容 ESLint 10（`context.getFilename` 已移除會直接 crash）。
- **`app/sitemap.ts` 改為註冊表推導**：所有工具 URL 一律由中央工具註冊表 `app/config/tools.tsx`（`ALL_TOOLS`）衍生，`lastModified` 取建置當下時間；移除原先逐條手工維護的 64 筆網址與早已過期的固定日期。新增工具不再需要同步改 sitemap。
- **CI／部署 Node.js 由 22 升至 24**（`.github/workflows/deploy.yml`），並於 `package.json` 補上 `engines.node >= 22`。
- **依賴升級**：`next` / `eslint-config-next` `16.3.0 → 16.3.4`、`react` / `react-dom` `19.2 → 19.3`、`@types/react` / `@types/react-dom` `→ 19.3`、`@types/node` `26 → 24`（對齊部署 runtime 大版本）。`typescript` 維持 `6.x`（7.x 發布未滿觀察期）。升級後 `npm audit` 由 2 項（1 high、1 critical）降為 0。
- **`tests/audit-seo.mjs`**：sitemap 涵蓋率檢查改為驗證「工具是否登記於中央註冊表 `app/config/tools.tsx`」，配合上述 sitemap 重構。
- **Lint 現存告警**：啟用 lint 後尚有 56 條 warning（絕大多數為 `'use client'` 工具頁於 `useEffect` 內同步 `window` / `localStorage` / 動態 `import` 狀態，即 `isMountedRef` 既有慣例）。已將 `eslint-plugin-react-hooks` v7 新增的 React Compiler 建議規則（`set-state-in-effect`、`immutability`）降為 warning，並關閉不適用於靜態匯出的 `@next/next/no-img-element`；`eslint .` 現為 0 error，不阻斷 CI。

### 🐛 修復 (Fixed)

- **`/.well-known/security.txt` 404**：該檔先前置於專案根目錄 `.well-known/` 而非 `public/`，`output: 'export'` 靜態匯出未包含，導致檔案自身宣告的 `Canonical: https://tools.cjkuo.net/.well-known/security.txt` 實際無法存取（違反 RFC 9116）。已移至 `public/.well-known/security.txt`。
- 移除專案根目錄未被部署流程使用的重複 `robots.txt` 與 `security.txt`（實際服務的為 `public/robots.txt`）。
- 修正 `react/no-unescaped-entities`（JSON 樹狀檢視的引號、時薪計算機資料來源標註）與 4 支 UI 規範測試模組（`tests/ui-rules/*.mjs`）的匿名預設匯出。

---

## [1.8.1] - 2026-09-10

### 🐛 修復 (Fixed)

- **首頁 (`/`)**：修復手機版右上角功能按鈕組（搜尋、語言、亮暗模式）因絕對定位脫離文件流、而 `.homeContainer` 在 `max-width: 600px` 斷點的頂部內距不足，導致按鈕與「工具庫」主標題重疊、遮住標題文字的問題。將手機版容器頂部內距由 `2.5rem` 提高至 `5rem`，讓按鈕組完整位於標題上方。

---

## [1.8.0] - 2026-08-25

### ✨ 新增功能 (Added)

- **全新上線：Open Graph (OG) 社群封面圖片產生器 (`/og-generator/`)**：
  - **4 大專業設計模板**：現代極簡 (Modern Minimal)、科技光流 (Cyber Glow)、雜誌專欄 (Split Showcase) 與醒目大字 (Bold Impact)。
  - **純前端極速 Canvas 2D 渲染引擎**：無後端延遲、零個資隱私洩漏風險，支援純前端 2x 視網膜 (Retina) 超高清採樣輸出。
  - **多社群長寬比一鍵自適應重排**：標準 OG (1200×630)、Twitter 16:9 (1200×675)、Square 1:1 (1080×1080)、Stories / Mobile 9:16 (1080×1920) 與 LinkedIn Post (1200×627)。
  - **多格式高速匯出**：支援 PNG（無損清晰）、JPEG（高壓縮）、WebP（現代網頁）與 SVG（向量封裝）一鍵下載，以及直接複製圖片至系統剪貼簿。
  - **高畫質 Lightbox 大圖檢視視窗**：點擊畫布即刻透過 React Portal 呼叫高解析度全螢幕檢視彈窗，支援 ESC 鍵與彈窗內直接複製/下載。
  - **主題配色與自訂雙模色彩**：提供 6 大雙語主題色、支援雙色線性漸層與單色純底切換、Hex 色碼鍵盤直接輸入與 8 款發光 Accent 快捷色票。
  - **高度自由媒體自訂**：支援自訂 Logo/頭像上傳（外框形狀與尺寸自訂，具備自動留白防貼邊安全距離）、自訂特色背景圖上傳（可調節不透明度與模糊度）或自由一鍵關閉。
  - **4 組雙語實用預設範例 (Presets)**：技術專欄、產品發表、開發日誌與社群快訊，預設輸入值全面深度在地化。
  - **雙語中英文路由與 6 組深度 FAQ 結構化資料 (`FAQPage` JSON-LD)**。

### 🏗️ 架構與工程規範 (Architecture & Standards)

- **大型複雜工具 6 大模組化拆分架構**：`types.ts`、`constants.ts`、`translations.ts`、`canvasRenderer.ts`、`exportHelpers.ts`、`OgGeneratorClient.tsx`。
- **專屬自動化測試套件**：建立 `tests/test-og-translations.mjs` 與 `tests/test-og-constants.mjs`，並整合至 `npm run test` CI 管線。
- **更新專案 3 大開發標準技能文件 (SKILLS)**：`smalltools-i18n-seo`（ToolLayout 共用頂欄規範、繁中純淨在地化）、`smalltools-dev-architecture`（大型工具模組化拆分與測試標準）、`smalltools-code-standards`（色彩輸入雙模交互標準、Canvas 排版留白）。

---

## [1.7.1] - 2026-08-23

### 🐛 修復與功能增強 (Fixed & Enhanced)

- **PDF 頁面組合器 (`/pdf-processor/`)**：
  - **全新 300 DPI 所見即所得 (WYSIWYG) 雙軌匯出引擎**：徹底解決多檔案合併時因註解層（`/Annots`）、電子簽名、公文印章、表單欄位（AcroForm）或掃描器 CropBox 裁切框偏移導致部分頁面匯出後變空白的問題。以出版級 300 DPI 超高清畫質（A4 達 2480×3508 像素）完整捕獲預覽圖層，保證「預覽看到什麼，下載出來就 100% 是什麼」。
  - **介面新增雙軌引擎切換**：控制列提供「300 DPI 所見即所得（推薦・防空白頁）」與「原生向量模式（保留文字選取）」供使用者自由切換。
  - **標準 A4 點數尺寸對齊**：精確校準嵌入頁面之 PDF 點數尺寸（`595.28 × 841.89 pt`），確保在任何 PDF 閱讀器中開啟或實體列印皆為 100% 標準 A4 紙張大小。
  - **修復 ArrayBuffer 記憶體 Detached 問題**：修復在傳遞二進位緩衝區至 PDF.js Web Worker 進行預覽拆解時，因瀏覽器 Transferable Objects 機制導致主執行緒 State 中 ArrayBuffer 被轉移清空（Detached Buffer），造成後續點擊「匯出合併 PDF」拋出 `TypeError: Cannot perform Construct on a detached ArrayBuffer` 且下載無反應之問題。
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
