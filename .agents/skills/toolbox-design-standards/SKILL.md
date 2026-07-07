---
name: toolbox-design-standards
description: 適用於小型工具庫（smalltools）專案的毛玻璃 UI 風格規範、行動端響應式防重疊設計、即時計算與表格水平滾動的開發標準。
---

# 工具庫專案 UI/UX 設計與開發規範

本文件為「Smalltools 工具庫專案」的專屬 Skill 指南。在修改或新增任何小工具（例如目標計時器、複利計算機等）時，必須嚴格遵守以下設計美學與開發細節，以確保專案的一體性與頂級使用者體驗。

---

## 一、 視覺與設計美學標準 (Aesthetics)

1. **毛玻璃擬物化 (Glassmorphism)**
   * **背景與模糊**：主要玻璃容器（`.glass-container`）使用半透明背景 `rgba(255, 255, 255, 0.02)`，搭配 `backdrop-filter: blur(20px)`。
   * **細緻邊框**：邊框寬度為 `1px`，顏色為半透明白 `rgba(255, 255, 255, 0.05)`。
   * **陰影**：使用柔和的深色投影，例如 `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8)`。

2. **配色與主題霓虹發光 (Neon Theme Colors)**
   * **主背景色**：使用純極黑 `#030305`，以凸顯半透明玻璃與發光元素。
   * **倒數計時器**：冰藍色科技主題，發光色採用 `#00f0ff`。
   * **複利計算機**：財富金黃色主題，發光色採用 `#ffb800`。
   * **信貸計算機**：信貸/財務信任主題，發光色採用薄荷綠/翠綠色 `#00f5a0`。
   * **車貸計算器**：運動與速度主題，發光色採用霓虹紅 `#ff0055`。
   * **互動狀態**：輸入框聚焦 (focus) 與按鈕懸停 (hover) 時，必須亮起對應主題色的發光效果與陰影。

3. **背景粒子氣泡動效**
   * 背景應配備一個 Canvas，持續繪製緩慢向上飄動的微透明金黃或冰藍或翠綠粒子。
   * 點選 Selector 切換按鈕時，需在滑鼠點擊座標觸發一小撮粒子的「氣泡爆炸效果」做為微動效反饋。

---

## 二、 必須遵守的開發與 UX 細節 (UX & Coding Standards)

1. **防撐寬響應式佈局 (Mobile Stacking & Overflow Protection)**
   * **Bug 防範**：在 CSS Grid 佈局中，如果子元素具有較大最小寬度（如 650px 的 table），會強行撐開 Grid Item。
   * **修復標準**：
     - 在 Grid Item（如 `.results-section`）上必須加上 `min-width: 0;`。
     - 表格容器（`.table-container`）必須配置 `width: 100%; max-width: 100%; overflow-x: auto;`。
     - 行動端媒體查詢的 Grid 容器應使用 `grid-template-columns: minmax(0, 1fr);`。

2. **手機版 Sticky 橫向滾動表格 (Responsive Tables)**
   * 為了在手機上舒適顯示多個千分位數據欄位，表格應限制最低防擠壓寬度（如 `min-width: 650px`）並啟用水平滾動。
   * **首欄凍結**：最左側的「時間 (年度/月份/期數)」欄必須利用 `position: sticky; left: 0;` 進行固定。
   * **遮擋與陰影**：Sticky 欄位必須配置與頁面相近的「實底深色背景」（如 `#0b0b0e`）與微弱側邊陰影，防止橫向滑動時，右側滑過的數值與時間欄文字重疊。

3. **隱藏預設微調按鈕 (No Native Spinners)**
   * 當輸入框為 `<input type="number">` 且右側塞有我們自訂的單位切換按鈕（如「年」、「月」）時，必須隱藏瀏覽器預設的 Spinners 上下箭頭，防止兩者重疊：
     ```css
     input::-webkit-outer-spin-button,
     input::-webkit-inner-spin-button {
         -webkit-appearance: none;
         margin: 0;
     }
     input[type=number] {
         -moz-appearance: textfield;
     }
     ```

4. **返回導覽按鈕手機防重疊**
   * 「回工具庫首頁」按鈕在電腦版為 `position: absolute` 定位在左上角。
   * **行動端覆蓋**：在小視窗媒體查詢下，必須覆蓋為：
     ```css
     .back-btn {
         position: static;
         display: inline-flex;
         margin-bottom: 1.5rem;
     }
     ```
     將返回按鈕排在標題的最上方單獨一行，徹底防範其與標題文字重合。

5. **改即算響應式計算 (Real-time Calculation)**
   * 不強求使用者手動點擊按鈕，必須為所有的 Inputs、Selects 和切換按鈕綁定即時監聽事件（`input` 和 `change`）。
   * 只要數據變動，就在瀏覽器端以毫秒級效率完成模擬並即時刷新圖表與數據。
   * **防呆回退**：當輸入框被刪空（`value = ''`）的打字中間狀態下，代碼中必須做好回退處理（使用 `0` 計算或保留上一狀態），不能觸發報錯或導致介面死當。

6. **千分位逗號輸入格式化 (Formatted Inputs)**
   * 金額輸入框在鍵入數字時需動態以逗號格式化，且必須用 JS 計算逗號增加數量並修正游標 `setSelectionRange`，避免游標跳動到最右側。

7. **Favicon 與 Open Graph 標籤規範**
   * 每個 HTML 頁面必須加入 Open Graph (og:type, og:title, og:description, og:url, og:image) 與 favicon 設定。
   * 必須使用絕對路徑以確保轉傳時圖片與圖示的正確性。Favicon 必須指派正確的 MIME 類型：
     ```html
     <link rel="icon" href="https://tools.cjkuo.net/support.svg" type="image/svg+xml">
     ```

8. **實質年利率 (APR) 求解標準**
   * 凡是包含「開辦費/手續費」攤提的財務貸款工具，必須提供實質年利率 (APR) 試算。
   * **計算演算法**：使用 **二分搜尋法 (Bisection Method)** 求解內含報酬率 (IRR)。設定月折現率區間，通過迭代求解折現值淨額 (NPV) 趨近於 0 取得月折現率，進而換算為 APR。這能提供業界公認的高精度試算。

9. **還款模擬的浮點誤差微調**
   * 在進行按月「本息均攤」或「本金均攤」貸款模擬計算時，最後一期 (m === totalMonths) 的「期末餘額」必須手動將其強設為 `0`。這能有效防止 JavaScript 底層浮點數運算造成的些微殘留誤差。

10. **部署 CI/CD 安全排除**
    * 開發工具庫的配置設定與本地 Skill 定義（即 `.agents/` 目錄）切勿同步至生產環境。
     * 必須在部署腳本（如 `.github/workflows/deploy.yml` 中的 `aws s3 sync`）中強制配置 `--exclude ".agents*"` 以防止內部檔案外流。

11. **雙向連動輸入框格式化規範 (Formatted Synced Inputs)**
    * 當多個金額欄位存在依存關係（如車價、自備款、貸款金額）且需雙向連動時，應僅對使用者正在鍵入的活動輸入框 (active input) 修正游標定位 (`setSelectionRange`)，其他連動欄位則由程式直接格式化填值，避免多重更新觸發游標亂跳或循環計算。
    * 對於輸入框被刪空的打字中間狀態，應有防呆回退處理，確保即時計算不會報錯或介面死當。

12. **多方案金流之實質年利率 (APR) 二分法計算**
    * 當試算工具支援多種還款方案（如寬限期、低首付、尾款保留等）時，實質年利率 (APR) 應基於實際產生的月付金流陣列 (paymentArray) 作為參數帶入二分搜尋法求解，避免為各方案寫死不同的 IRR 公式，以維持擴充性與高精度。

13. **多段式利率動態增減段落 (Dynamic Multi-Stage Rate Management)**
    * 具備多段式（階梯式）利率功能的計算工具，不應使用固定數量的靜態 HTML 段落（如寫死 3 段），必須改以 **JS 動態渲染 `stages` 陣列**，讓使用者可以自由新增（`addStage()`）與移除（`removeStage(idx)`）段落。
    * **最少段數保護**：最少需保留 2 段（防止刪到只剩 1 段導致邏輯崩壞）。
    * **最大段數限制**：預設上限為 6 段，超過時「新增段落」按鈕應 `disabled`。
    * **最終段固定為剩餘期數**：最後一段永遠是「剩餘期數」適用段，只需填利率，不需填期間。移除時提示標籤文字應有所區別。
    * **每段期間均需年/月切換**：使用 `stage-unit-selector` 微型版本的年/月切換按鈕，確保使用者可輸入「2 年」或「24 個月」而非只有月份數字。
    * **JS 計算邏輯**：計算時將 `stages` 陣列展開為與總期數等長的 `stageRates[]` 陣列（每期對應的年利率），最後一段補滿剩餘期數。這樣可確保任意段數的計算邏輯完全通用，無需為不同段數寫不同判斷式。

14. **自備款分開兩行顯示 (Down-Payment Inputs Stacked)**
    * 在房貸計算機等含有「自備款成數 (%)」與「自備款金額 (元)」雙向連動的介面中，當兩者數字較大、並排時容易被截斷，必須將兩個欄位**分開為各自獨立的 `input-group` 行**（不能並排在同一個 `stage-row` 中），確保在所有螢幕尺寸下數值均能完整顯示。

15. **全站容器寬度規範 (Max-Width Standard)**
    * 所有計算機與首頁的 `.glass-container` 必須使用 `max-width: 90%`（而非固定像素值如 1100px 或 1000px），確保在大螢幕（如 1920px 寬的顯示器）上也有足夠的展示空間，同時在小螢幕上仍保持適當的左右留白。

16. **Sitemap 維護規範 (Sitemap Maintenance)**
    * 專案根目錄必須維護一份 `sitemap.xml`，遵循 `http://www.sitemaps.org/schemas/sitemap/0.9` 標準，列出所有工具頁面的完整 URL、最後修改日期 (`lastmod`)、更新頻率 (`changefreq`) 與優先度 (`priority`)。
    * 每次新增工具頁面後，必須同步更新 `sitemap.xml`，並更新所有現有頁面的 `lastmod` 日期。
    * 首頁 (`index.html`) 的 `priority` 設為 `1.0`，其餘工具頁面設為 `0.8`，`changefreq` 一般設為 `monthly`。

17. **下拉選單顏色與可見性規範 (Dropdown Select Visibility)**
    * **問題**：在毛玻璃暗黑 UI 之下，下拉選單 `<select>` 若繼承全域亮色字體，但在各瀏覽器預設的選單展開背景（可能是白色或系統預設色）下，會產生白底白字的「文字隱形消失」Bug。
    - **修復標準**：必須強制為所有 `<select>` 及 `<option>` 設定明確的深色背景（如 `background-color: #121218 !important`）與亮白色文字色（如 `color: #ffffff !important`），確保選單選項在任何平台均能清晰閱讀。

18. **日期時間選擇器暗色系支援 (Dark-Scheme Datetime Picker)**
    - **修復標準**：為所有 `input[type="datetime-local"]`、`input[type="date"]` 等輸入框明確套用 CSS 屬性 `color-scheme: dark;`。這能指示現代瀏覽器將彈出的月曆與時間選擇面板自動轉為深色模式，與整體的毛玻璃暗黑風格保持視覺一致。

19. **文字輸入框對比度清晰度標準 (Text Input Contrast & Clarity)**
    - **修復標準**：為了在半透明毛玻璃背景下提供極佳的文字清晰度：
      - 文字框容器（`.input-wrapper`）的背景透明度應維持在 `0.035` 以上，且非聚焦邊框的不透明度應至少為 `0.15`（如 `rgba(255,255,255,0.15)`），提供明顯輪廓。
      - 輸入文字（`.styled-input`）必須使用明亮的純白（`#ffffff`），字型大小建議 `1.1rem` 以上且適度加粗（如 `font-weight: 500`）。
      - 占位符提示字（`::placeholder`）透明度不可太低，建議在 `0.35` 以上。

20. **時區選單優化設計 (Timezone Selection Simplification)**
    - **優化標準**：對於非特定指名的時區轉換，時區下拉選單不宜列出長串的全球城市名稱。應改用乾淨直觀的 **「UTC 數值偏移量」**（如 `UTC -08:00 (PST)`、`UTC +08:00`）。這能簡化下拉選單長度，並可在 JS 中直接進行簡單的數值加減（`ms = date.getTime() + offset * 3600 * 1000`），避免複雜的反向時區逼近計算，使代碼更高效、更不易出錯。

21. **網址參數雙向狀態連動 (URL State Sync)**
    * 所有計算工具的輸入狀態均應雙向連動至瀏覽器網址列，使配置可直接分享。

    * **細節一 — 正向連動（無感更新網址）**：
      - **絕對禁止** 使用 `window.location.href = ...`（會導致頁面重新整理）。必須使用 `history.replaceState(null, '', '?' + params.toString())` 在不刷新頁面的前提下更新網址列。
      - **防抖處理**：千分位金額輸入框在「打字中」狀態下，應使用 300ms 防抖延遲（`clearTimeout` + `setTimeout`）後再更新 URL，並在 `blur` 事件時立即同步。`select` 與單位切換按鈕應在 `change` / `click` 後**即時**同步，無需防抖。

    * **細節二 — 反向連動（防呆解析）**：
      - 在 `window.addEventListener('load', ...)` 最開始，呼叫 `initFromURL()` 讀取 `window.location.search`。
      - 若網址有帶參數，則覆蓋 HTML 的預設值；若無參數，則維持 HTML 原有預設值（靜默跳過）。
      - **防呆 Fallback**：使用 `safeParseFloat(val, fallback)` 與 `safeParseInt(val, allowed, fallback)` 工具函數進行解析，任何格式錯誤（如 `?rate=abc`）或超出白名單的值，必須安全回退到預設安全數值，絕不能導致頁面報錯或死當。

    * **細節三 — 逗號過濾與格式化**：
      - **同步到 URL 前**，金額欄位必須去除千分位逗號：`input.value.replace(/,/g, '')`，確保 URL 中為純數字（如 `?p=1000000`，而非 `?p=1,000,000`）。
      - **反向解析填回 UI 時**，從 URL 取得的純數字必須先通過 `toLocaleString('zh-TW')` 格式化後，再設定到輸入框的 `value`。
      - 僅對正在輸入的「活動輸入框」執行游標修正（`setSelectionRange`），其他連動欄位直接設值，避免游標亂跳。

    * **細節四 — 「複製查詢連結」分享按鈕**：
      - 在結果輸出區右上角放置一個精美的分享按鈕（參考各工具的主題色）。
      - 點擊時呼叫 `syncToURL()` 確保 URL 最新，再以 `navigator.clipboard.writeText(url)` 複製連結。
      - 複製成功後，按鈕應切換為「✓ 已複製！」的視覺回饋（變色 + 圖示改為勾選圖示），2.2 秒後自動恢復原狀。
      - **Fallback**：若 Clipboard API 不可用，改以 `window.prompt(...)` 呈現 URL 讓使用者手動複製。
