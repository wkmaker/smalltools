# 更新日誌 (Changelog)

本專案遵循 [Semantic Versioning (語意化版本 2.0.0)](https://semver.org/lang/zh-TW/) 與 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 規範。

---

## [1.15.0] - 2026-09-18

### ✨ 新增功能 (Added)

- **新增「PAC 規則產生器」（`/pac-generator/`）**：
  - 專為自動代理配置 (Proxy Auto-Config) 腳本打造的視覺化編排生產工具。
  - 支援代理伺服器池 (Proxy Pool) 定義（DIRECT、PROXY、HTTPS、SOCKS、SOCKS5、自訂字串）與故障轉移 Fallback 容錯鏈。
  - 支援多種分流條件（純主機名、網域後綴、完全比對、萬用字元、IPv4 CIDR、IPv6 CIDR、正則表達式）。
  - 內建 4 大常用情境範本（企業內網繞行、開發者本機除錯、指定雲端服務白名單代理、空白自訂）。
  - 支援一鍵複製標準 JavaScript PAC 代碼、下載 `.pac` 檔案（MIME: `application/x-ns-proxy-autoconfig`）、複製 Data URI（RFC 2397）、以及跨工具「前往 PAC 測試器驗證」的一鍵轉移功能。
  - 完整支援 IPv6 擴展規範（`isInNetEx`），並附有各作業系統 (Windows, macOS, iOS, Firefox) 之 PAC 設定圖文指引。

- **新增「PAC 測試與除錯器」（`/pac-tester/`）**：
  - 專為 PAC 腳本深度審計與除錯打造的純前端沙盒執行環境。
  - **單一網址深度除錯 (Single URL Trace)**：即時模擬 `FindProxyForURL(url, host)` 執行，輸出決策走向、回傳代理字串、毫秒級耗時與完整的逐步條件判定軌跡 (Trace Steps)。
  - **批量網址回歸測試 (Batch Regression Test)**：一次貼入多組 URL 進行批量分流驗證，支援狀態篩選（全部、直連、代理、錯誤）與一鍵匯出 CSV 稽核報表。
  - **虛擬網路環境模擬 (Mock Context)**：支援自訂模擬客戶端本機 IPv4 (`myIpAddress`)、IPv6 (`myIpAddressEx`) 以及靜態 Mock DNS 主機映射字典。
  - **語法與相容性診斷 (Static Linter)**：即時檢驗 `FindProxyForURL` 進入點、return 語句，並主動提示 IPv6 在傳統 `isInNet` 中的潛在相容性陷阱。
  - 純前端安全沙盒隔離執行，遮蔽全域物件並具備逾時防護機制，100% 零伺服器隱私保護。

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
