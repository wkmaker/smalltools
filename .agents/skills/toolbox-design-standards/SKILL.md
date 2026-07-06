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
