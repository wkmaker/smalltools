# 🛠️ Smalltools 全專案深度健檢與改進待辦清單 (Todo List)

> **建立日期**：2026-10-17  
> **基準版本**：`v1.17.2`（共 36 個工具模組、290+ 個原始碼檔案）  
> **對照準則**：全域規範 `C:\PG\AGENTS.md` + 專案四份手冊 `.agents/skills/smalltools-*`  
> **格式說明**：每一項待辦皆列出 **① 目標檔案與精確行號（點擊可直接跳轉至該行）**、**② ❌ 問題程式碼現況 (Before)**、以及 **③ ✅ 具體修復目標 (After)**。

---

## 📌 優先級總覽與建議執行批次

| 批次 | 優先級 | 核心主題 | 預估改動範圍 | 效益與影響 |
| :--- | :--- | :--- | :--- | :--- |
| **批次 A** | **P0** | **線上 Bug、記憶體洩漏、CI/CD 漏監聽與首頁 SSG 修復** | 8 個檔案 | 消除渲染期 Blob 洩漏、跨日時區錯亂、CI 漏觸發部署，並讓首頁靜態 HTML 完整預渲染 36 個工具卡片（非僅「載入中...」） |
| **批次 B** | **P1** | **薪資 JSON 瘦身 96%、檔案大小上限防護、主題 `dark:` 與 UI 守門員** | 約 25 個檔案 | 薪資計算機設定檔從 42,328 行 (496 KB) 降至約 1,100 行 (< 25 KB)；防大檔撐爆記憶體；修復亮暗切換色偏與 `< 12px` 微縮字體 |
| **批次 C** | **P1** | **多語系 (i18n) 英文版漏翻補齊、三元判斷收斂與繁中純淨化** | 約 22 個檔案 | 修復 `/ssl-converter/en/`、`/har-cleaner/en/`、`/mortgage-loan/en/` 等大面積顯示中文的問題，建立全站 36 工具雙語字典對稱自動化測試 |
| **批次 D** | **P2 / P3** | **A11y 表單對稱綁定、浮點數轉 BigNumber、零靜默失敗、千行組件拆解與單元測試** | 分階段推進 | 補齊 16 個工具的單元測試、拆解 8 個破千行組件、消除 ESLint 58 個 warnings、CloudFront 補齊 OWASP 安全標頭 |

---

## 🚨 批次 A（P0）：立即修復項目（線上 Bug、記憶體洩漏、SEO 首屏 SSG、CI/CD）

### A-1. 修復 JSX Render 期直接呼叫 `URL.createObjectURL` 造成的嚴重記憶體洩漏

- [ ] **目標 1**：[`app/pdf-compressor/PdfCompressorClient.tsx:848-857`](app/pdf-compressor/PdfCompressorClient.tsx#L848-L857)
  - **問題根因**：直接在 JSX render 屬性中呼叫 `URL.createObjectURL(item.compressedBlob)`。只要組件發生任何 re-render（例如其他檔案壓縮進度更新、滑桿變動、Toast 顯示），React 就會對每個已完成的 PDF Blob 重新建立一個新的 ObjectURL，且舊 URL 永遠不會呼叫 `URL.revokeObjectURL`。
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/pdf-compressor/PdfCompressorClient.tsx:848-857
    <a
      href={URL.createObjectURL(item.compressedBlob)}
      download={`${item.name.replace(/\.pdf$/i, '')}_compressed.pdf`}
      className={`${styles.actionBtn} text-xs flex items-center gap-1.5`}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
      {t.downloadPdf}
    </a>
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```tsx
    <button
      type="button"
      onClick={() =>
        item.compressedBlob &&
        downloadBlob(item.compressedBlob, `${item.name.replace(/\.pdf$/i, '')}_compressed.pdf`)
      }
      className={`${styles.actionBtn} text-xs flex items-center gap-1.5 cursor-pointer`}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
      {t.downloadPdf}
    </button>
    ```

- [ ] **目標 2**：[`app/image-processor/ImageProcessorClient.tsx:148-169, 300`](app/image-processor/ImageProcessorClient.tsx#L148-L169)
  - **問題根因**：上傳圖片時建立 `thumbUrl: URL.createObjectURL(file)`，雖然 `removeBatchItem` (`L300`) 有呼叫 `URL.revokeObjectURL(item.thumbUrl)`，但當組件 Unmount（離開頁面）或清空時，未釋放尚在列表中的 `thumbUrl`。
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/image-processor/ImageProcessorClient.tsx:150 & L163
    thumbUrl: URL.createObjectURL(f),
    ```
  - **✅ 修復目標程式碼 (After)**：
    新增 `batchItemsRef` 追蹤當前項目，並在 Unmount `useEffect` 中逐一釋放：
    ```tsx
    const batchItemsRef = useRef<BatchItem[]>([]);
    batchItemsRef.current = batchItems;
    useEffect(() => {
      return () => {
        batchItemsRef.current.forEach((item) => URL.revokeObjectURL(item.thumbUrl));
      };
    }, []);
    ```

---

### A-2. 修復日期與時區混用 Bug（違反全域鐵則 7 & 8）

- [ ] **目標 1（嚴重跨日錯亂 Bug）**：[`app/ssl-converter/engine.ts:46-48`](app/ssl-converter/engine.ts#L46-L48)
  - **問題根因**：前半段日期使用 `date.toISOString().split('T')[0]`（取 **UTC 日期**），後半段時間卻使用 `date.toTimeString().split(' ')[0]`（取**使用者本地時區時間**）！當憑證時間落在台灣時間（UTC+8）`00:00:00 ~ 07:59:59` 時，UTC 日期還在昨天，拼出來的字串會差整整一天。
  - **❌ 問題程式碼現況 (Before)**：
    ```ts
    // app/ssl-converter/engine.ts:46-48
    function formatDate(date: Date): string {
      if (isNaN(date.getTime())) return '未知';
      return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
    }
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```ts
    function formatDate(date: Date): string {
      if (isNaN(date.getTime())) return '未知';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    }
    ```

- [ ] **目標 2（匯出檔名誤用 UTC 日期）**：
  - [`app/lucky-wheel/LuckyWheelClient.tsx:769`](app/lucky-wheel/LuckyWheelClient.tsx#L769)
  - [`app/pdf-compressor/PdfCompressorClient.tsx:432`](app/pdf-compressor/PdfCompressorClient.tsx#L432)
  - [`app/pdf-processor/PdfProcessorClient.tsx:388`](app/pdf-processor/PdfProcessorClient.tsx#L388)
  - **❌ 問題程式碼現況 (Before)**：
    ```ts
    // LuckyWheelClient.tsx:769
    downloadBlob(blob, `LuckyWheel_Prizes_${new Date().toISOString().slice(0, 10)}.txt`);
    // PdfCompressorClient.tsx:432
    downloadBlob(zipBlob, `PDF_Compressed_Batch_${new Date().toISOString().slice(0, 10)}.zip`, 5000);
    // PdfProcessorClient.tsx:388
    downloadBlob(pdfBlob, `Combined_PDF_${new Date().toISOString().slice(0, 10)}.pdf`, 5000);
    ```
  - **✅ 修復目標程式碼 (After)**：
    改用本地年月日組出 `YYYY-MM-DD`，防止台灣時間凌晨 00:00~07:59 下載檔案時檔名日期退回昨天。

---

### A-3. 修復首頁因 `<Suspense>` 包裹 `useSearchParams()` 導致靜態匯出 HTML 只有「載入中...」的問題（全域鐵則 26）

- [ ] **目標檔案**：
  - [`app/page.tsx:60-68`](app/page.tsx#L60-L68)
  - [`app/en/page.tsx:60-68`](app/en/page.tsx#L60-L68)
  - [`app/HomeClient.tsx:5, 62-75`](app/HomeClient.tsx#L62-L75)
  - **問題根因**：`HomeClient.tsx` 呼叫了 `useSearchParams()`，導致 `app/page.tsx` 與 `app/en/page.tsx` 把整個 `<HomeClient />` 包在 `<Suspense fallback={<div>載入中...</div>}>` 內。在 `output: 'export'` 靜態匯出時，產出的 `out/index.html` 首屏內容只有 `載入中...` 三個字，爬蟲在不執行 JS 時看不到任何工具卡片。
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/page.tsx:60-68
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-text-sub">
          載入中...
        </div>
      }
    >
      <HomeClient lang="zh-TW" />
    </Suspense>
    ```
    ```tsx
    // app/HomeClient.tsx:62-75
    const searchParams = useSearchParams();
    const urlCat = searchParams.get('category');
    ```
  - **✅ 修復目標程式碼 (After)**：
    移除 `useSearchParams()` 與 `<Suspense>`，比照其他 35 個工具在 `HomeClient.tsx` 的 `useEffect` 讀取 `new URLSearchParams(window.location.search)`，使 `out/index.html` 與 `out/en/index.html` 在建置期 100% 靜態渲染所有 36 個工具卡片。

---

### A-4. 修補 CI/CD `.github/workflows/deploy.yml` 路徑過濾遺漏根目錄 `components/**`

- [ ] **目標檔案**：[`.github/workflows/deploy.yml:45-54`](.github/workflows/deploy.yml#L45-L54)
  - **問題根因**：根目錄 `components/` 下有 `CommandPalette.tsx`、`ThemeProvider.tsx`、`ThemeToggle.tsx`、`ParticleCanvas.tsx`、`ServiceWorkerRegister.tsx`，但 `dorny/paths-filter` 只列了 `app/**`，漏列 `components/**`。
  - **❌ 問題程式碼現況 (Before)**：
    ```yaml
    # .github/workflows/deploy.yml:45-54
    filters: |
      build_and_deploy:
        - 'app/**'
        - 'public/**'
        - 'package.json'
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```yaml
    filters: |
      build_and_deploy:
        - 'app/**'
        - 'components/**'
        - 'public/**'
        - 'package.json'
    ```

---

## ⚡ 批次 B（P1）：效能、Bundle 瘦身、檔案大小防護與主題/UI 規範

### B-1. 薪資計算機 42,328 行 JSON 結構重構（縮減 96.5% Bundle 體積）

- [ ] **目標檔案**：
  - [`app/my-salary-calculator/salaryConfig.ts:4-6, 93-111`](app/my-salary-calculator/salaryConfig.ts#L93-L111)
  - [`app/my-salary-calculator/config/2024.json`](app/my-salary-calculator/config/2024.json)（14,091 行）
  - [`app/my-salary-calculator/config/2025.json`](app/my-salary-calculator/config/2025.json)（14,116 行）
  - [`app/my-salary-calculator/config/2026.json`](app/my-salary-calculator/config/2026.json)（14,121 行）
  - **問題根因**：
    1. 三份 JSON 共 **42,328 行（496 KB）** 靜態 `import` 進初始 Client Bundle，其中 92% 體積是 `withholding_tax_table`（840 列 × 14 欄）。
    2. `2024.json` 與 `2025.json` 的 `withholding_tax_table` **100% 相同**卻存了兩份。
    3. 每列前兩欄 `[row[0], row[1]]` 永遠是固定等差數列 `[80001 + i * 500, 80500 + i * 500]`，卻重複存了 5,040 個 6 位數整數並用 `.find()` 線性掃描。
  - **❌ 問題程式碼現況 (Before)**：
    ```ts
    // app/my-salary-calculator/salaryConfig.ts:99-103
    if (config.withholding_tax_table) {
      const match = config.withholding_tax_table.find(row => taxSalary >= row[0] && taxSalary <= row[1]);
      if (match) {
        const depIndex = Math.min(11, taxDependents);
        return match[2 + depIndex];
      }
      ...
    ```
  - **✅ 修復目標程式碼 (After)**：
    1. 將 `withholding_tax_table` 抽離為緊湊矩陣（移除每列前兩欄 `[min, max]`，且 2024 與 2025 共用同一張表），三個 JSON 各自從 **14,100 行降至約 380 行（5.7 KB）**。
    2. 查表改為 O(1) 索引：
       ```ts
       if (taxSalary < 80001) return 0;
       const rowIndex = Math.floor((taxSalary - 80001) / 500);
       const row = taxTable[rowIndex];
       if (row) {
         return row[Math.min(11, taxDependents)];
       }
       ```

---

### B-2. 為一次讀入記憶體的檔案上傳工具補齊 `file.size` 上限檢查（全域鐵則 36）

- [ ] **對照範本**：目前僅 [`app/base64/Base64Client.tsx:192`](app/base64/Base64Client.tsx#L192) 與 [`app/diff-checker/DiffCheckerClient.tsx:278`](app/diff-checker/DiffCheckerClient.tsx#L278) 有檢查大小，以下 14 個工具直接呼叫 `readAsText` / `arrayBuffer()` 無上限防護：
  1. [`app/har-cleaner/HarCleanerClient.tsx:167`](app/har-cleaner/HarCleanerClient.tsx#L167)：
     - **❌ Before**：`const reader = new FileReader(); ... reader.readAsText(file);`（無大小檢查）
     - **✅ After**：在 `L165` 檢查 `if (file.size > 150 * 1024 * 1024) { showErrorToast(t.fileTooLarge); return; }`
  2. [`app/calendar-split/CalendarSplitClient.tsx:63-92`](app/calendar-split/CalendarSplitClient.tsx#L63-L92)：
     - **❌ Before**：`const reader = new FileReader(); ... reader.readAsText(file, 'utf-8');`（無輸入大小檢查，且 `L81` 與 `L89` 錯誤文字寫死中文）
     - **✅ After**：檢查 `file.size > 100 * 1024 * 1024`，並將 `L81` `'解析檔案時發生錯誤...'` 與 `L89` `'讀取檔案失敗'` 改用 `t.parseError` / `t.readError` 雙語字典。
  3. [`app/ssl-converter/SslConverterClient.tsx:203, 250, 290, 444`](app/ssl-converter/SslConverterClient.tsx#L203)：限制憑證檔 `<= 5 MB`（避免誤丟大檔進 ASN.1 解析器卡死主執行緒）。
  4. [`app/pdf-processor/PdfProcessorClient.tsx:213, 254`](app/pdf-processor/PdfProcessorClient.tsx#L213)（上限 100 MB）、[`app/pdf-compressor/PdfCompressorClient.tsx:251`](app/pdf-compressor/PdfCompressorClient.tsx#L251)（上限 150 MB）、[`app/image-processor/ImageProcessorClient.tsx:148, 171`](app/image-processor/ImageProcessorClient.tsx#L148)（上限 50 MB）、[`app/json/JsonFormatterClient.tsx:237, 302`](app/json/JsonFormatterClient.tsx#L237)（上限 50 MB）。

---

### B-3. 修復 Tailwind v4 `dark:` 變體與 `<html data-theme="...">` 脫節問題

- [ ] **目標 1**：[`app/globals.css:6-8`](app/globals.css#L6-L8)
  - **問題根因**：未定義 `@custom-variant dark`，導致全站 18 處 `dark:` 跟隨作業系統 `@media (prefers-color-scheme: dark)` 而非 `<html data-theme="dark">`。
  - **❌ 問題程式碼現況 (Before)**：
    ```css
    /* app/globals.css:6 */
    @import 'tailwindcss';
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```css
    @import 'tailwindcss';
    @custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
    ```

- [ ] **目標 2**：[`app/not-found.tsx:29, 63`](app/not-found.tsx#L29) 與 [`app/https-dns-generator/HttpsDnsGeneratorClient.tsx:215`](app/https-dns-generator/HttpsDnsGeneratorClient.tsx#L215)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/not-found.tsx:29 & L63（light: 為無效變體，導致亮色模式仍顯示刺眼霓虹 #ff0055）
    <span className="text-[#ff0055] dark:text-[#ff0055] light:text-[#dc2626] ...">
    // app/https-dns-generator/HttpsDnsGeneratorClient.tsx:215（亮暗皆寫死 #00f0ff，亮色模式對比度不足）
    <div className="flex items-center gap-2 text-xs font-semibold text-[#00f0ff] dark:text-[#00f0ff] ...">
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```tsx
    // app/not-found.tsx:29 & L63
    <span className="text-[#dc2626] dark:text-[#ff0055] ...">
    // app/https-dns-generator/HttpsDnsGeneratorClient.tsx:215
    <div className={`flex items-center gap-2 text-xs font-semibold ${styles.themeAccentText} ...`}>
    ```

---

### B-4. 修復 18 處 `< 12px` (`0.75rem`) 微縮字級與裸露 Emoji，並強化守門員腳本（全域鐵則 16, 18）

- [ ] **目標 1（11 處 TSX 微縮字級改為 `text-xs`）**：
  1. [`app/not-found.tsx:91`](app/not-found.tsx#L91)：`text-[0.7rem]` ➔ `text-xs`
  2. [`app/not-found.tsx:111`](app/not-found.tsx#L111)：`text-[0.65rem]` ➔ `text-xs`
  3. [`app/epoch/EpochClient.tsx:458`](app/epoch/EpochClient.tsx#L458)：`text-[0.65rem]` ➔ `text-xs`
  4. [`app/futures-calculator/FuturesCalculatorClient.tsx:484`](app/futures-calculator/FuturesCalculatorClient.tsx#L484)：`text-[0.7rem]` ➔ `text-xs`
  5. [`app/image-processor/ImageProcessorClient.tsx:915`](app/image-processor/ImageProcessorClient.tsx#L915)：`text-[0.7rem]` ➔ `text-xs`
  6. [`app/mortgage-loan/MortgageLoanClient.tsx:722, 744, 751, 832, 942, 1036`](app/mortgage-loan/MortgageLoanClient.tsx#L722)：6 處 `text-[0.7rem]` ➔ `text-xs`

- [ ] **目標 2（7 處 `.module.css` 微縮字級改為 `0.75rem`）**：
  1. [`app/calendar-split/calendar-split.module.css:443`](app/calendar-split/calendar-split.module.css#L443)：`font-size: 0.72rem;` ➔ `font-size: 0.75rem;`
  2. [`app/cert-generator/cert-generator.module.css:394`](app/cert-generator/cert-generator.module.css#L394)：`font-size: 0.7rem;` ➔ `font-size: 0.75rem;`
  3. [`app/har-cleaner/har-cleaner.module.css:261, 282, 844`](app/har-cleaner/har-cleaner.module.css#L261)：`0.72rem` / `0.7rem` ➔ `0.75rem`
  4. [`app/liars-dice/liars-dice.module.css:465`](app/liars-dice/liars-dice.module.css#L465)：`font-size: 0.625rem;` ➔ `font-size: 0.75rem;`
  5. [`app/pac-generator/pac-generator.module.css:488`](app/pac-generator/pac-generator.module.css#L488)：`font-size: 0.6875rem;` ➔ `font-size: 0.75rem;`

- [ ] **目標 3（移除裸露原生 Emoji，改用 SVG 圖示）**：
  1. [`components/ServiceWorkerRegister.tsx:92`](components/ServiceWorkerRegister.tsx#L92)：
     - **❌ Before**：`<p className="font-semibold text-cyan-300">🎉 已檢測到全新內容</p>`
     - **✅ After**：移除 `🎉`，並支援英文版與亮暗雙主題配色。
  2. [`app/components/ToolLayout.tsx:371`](app/components/ToolLayout.tsx#L371)：
     - **❌ Before**：`{isEn ? 'Sponsor the Author ☕' : '贊助支持作者 ☕'}`（左側 `L368` 已有愛心 `<svg>`，末尾卻重複帶了裸露 `☕`）
     - **✅ After**：`{isEn ? 'Sponsor the Author' : '贊助支持作者'}`
  3. [`app/config/tools.tsx:34, 158, 242, 423, 545, 667`](app/config/tools.tsx#L34)、[`app/HomeClient.tsx:455`](app/HomeClient.tsx#L455)、[`app/not-found.tsx:85`](app/not-found.tsx#L85)：將分類 `emoji: '🏦' | '💼' | '💻' | '🌐' | '📄' | '🎲'` 替換為主題色向量 `icon: ReactNode`（SVG）。
  4. [`app/hourly-rate-calculator/utils.ts:229-265`](app/hourly-rate-calculator/utils.ts#L229-L265) & [`HourlyRateCalculatorClient.tsx:289-292`](app/hourly-rate-calculator/HourlyRateCalculatorClient.tsx#L289-L292)：移除國旗 Emoji（Windows 會撕裂顯示為雙字母 `TH`/`VN`/`JP`）與卡片 Emoji `💳, 💬, ⚖️`。

- [ ] **目標 4（修補 UI 守門員腳本漏洞）**：
  - [`tests/check-ui-standards.mjs:8, 37`](tests/check-ui-standards.mjs#L8)：將 `components/` 加入掃描目錄，並移除 `relPath.includes('ToolLayout')` 的豁免。
  - [`tests/ui-rules/no-undersized-font.mjs:2`](tests/ui-rules/no-undersized-font.mjs#L2)：將正則擴充為同時攔截 `text-[0.6...rem]` / `text-[0.7...rem]`。

---

## 🌐 批次 C（P1）：多語系 (i18n) 英文版漏翻補齊、三元判斷收斂與純淨繁中化

### C-1. 補齊英文版 (`/en/`) 殘留的硬編碼中文

- [ ] **目標 1**：[`app/ssl-converter/SslConverterClient.tsx:48-84, 207-537, 570-1112`](app/ssl-converter/SslConverterClient.tsx#L48-L84) & [`app/ssl-converter/engine.ts:12, 36, 42, 46, 161, 374-377`](app/ssl-converter/engine.ts#L374-L377)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/ssl-converter/SslConverterClient.tsx:52-73（未傳入 t，英文版 /ssl-converter/en/ 全顯示中文）
    const meta: MetaItem[] = [
      { label: '域名主機 (CN)', value: analysis.cn },
      { label: '金鑰與簽章演算法', value: analysis.certAlgo, className: styles.statusSuccess },
      { label: '發行機構 (Issuer)', value: analysis.issuer },
      { label: '生效時間 (Not Before)', value: analysis.notBeforeStr },
      { label: '到期時間 (Not After)', value: analysis.notAfterStr, ... },
      {
        label: '憑證鏈完整度 (Chain Status)',
        value: analysis.isComplete
          ? '完整 (包含 Trust Root / Intermediate CA)'
          : analysis.nextAiaUrl
          ? '缺中繼憑證 (可點擊下載 AIA 自動修復)'
          ...
    ```
  - **✅ 修復目標 (After)**：將 `SslConverterClient.tsx` 共 60+ 處 UI 字串與 `engine.ts` 的狀態文字完整抽入 `app/ssl-converter/translations.ts` 的 `zh-TW` 與 `en`。

- [ ] **目標 2**：[`app/har-cleaner/components/SummaryTab.tsx:25-98`](app/har-cleaner/components/SummaryTab.tsx#L25-L98)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/har-cleaner/components/SummaryTab.tsx:25-42（雖然已接收 t prop，但除了 L44/L48 外全部寫死中文！）
    <h3 className="text-sm font-semibold text-text-main">脫敏項目分佈明細 (Sanitization Breakdown)</h3>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
        <span className="text-text-sub">認證與請求/回應標頭 (Headers):</span>
        <span className="font-mono font-bold text-text-main">{stats.redactedHeaders}</span>
      </div>
      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
        <span className="text-text-sub">Cookie 與 Session 憑證:</span>
    ...
    // L68-98 亦全部寫死中文：
    <h3 className="text-sm font-semibold text-text-main">HAR 檔案瘦身成果 (Archive Compression)</h3>
    ```
  - **✅ 修復目標 (After)**：在 `app/har-cleaner/translations.ts` 補齊 `SummaryTab` 所需的 12 個雙語鍵值，將 `SummaryTab.tsx:25-98` 全部改為 `{t.xxx}`。

- [ ] **目標 3**：[`app/mortgage-loan/MortgageLoanClient.tsx:834-919`](app/mortgage-loan/MortgageLoanClient.tsx#L834-L919)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/mortgage-loan/MortgageLoanClient.tsx:834-919（方案 B L1038-1120 已用 {t.xxx}，但方案 A 漏改！）
    L834: 移除
    L843: placeholder="期間"
    L852: <span className="text-xs text-text-sub ml-1">年</span>
    L855: <div className="flex items-center text-xs text-text-sub px-2">直至期滿</div>
    L861: placeholder="利率"
    L882: ＋ 新增利率段落
    L890: <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">還款方式</span>
    L901: 本息平均攤還
    L912: 本金平均攤還
    L919: <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">開辦手續費 (元)</span>
    ```
  - **✅ 修復目標 (After)**：比照方案 B (`L1038-1120`) 改為 `{t.removeStage}`、`{t.stageDuration}`、`{t.unitYear}`、`{t.untilMaturity}`、`{t.stageRate}`、`{t.addRateStage}`、`{t.repayMethod}`、`{t.equalTotal}`、`{t.equalPrincipal}`、`{t.setupFee}`。

- [ ] **目標 4**：[`app/calendar-split/CalendarSplitClient.tsx:81, 89, 280, 286, 292, 479, 564, 580-588`](app/calendar-split/CalendarSplitClient.tsx#L280-L292)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    L81:  setErrorMessage('解析檔案時發生錯誤，請確認檔案格式是否正確。');
    L89:  setErrorMessage('讀取檔案失敗');
    L280: {parsedData.calendarName || '預設行事曆 (Default)'}
    L286: {parsedData.timezone || '未指定 (UTC/Local)'}
    L292: {parsedData.events.length.toLocaleString()} 筆
    L479: ({chunk.eventCount.toLocaleString()} 筆活動)
    L580: 以下顯示此切割檔案包含的前 5 筆活動預覽：
    L587: 開始時間: {ev.dtStart || '無指定時間'}
    ```
  - **✅ 修復目標 (After)**：全數移入 `app/calendar-split/translations.ts` 並改用 `{t.xxx}`。

- [ ] **目標 5（其餘零星硬編碼中文定位）**：
  - [`components/ThemeToggle.tsx:24, 25, 84`](components/ThemeToggle.tsx#L24-L25)：`title={isLight ? '切換為暗色模式' : '切換為亮色模式'}`、`{mounted ? (isLight ? '亮色' : '暗色') : '主題'}`
  - [`app/image-processor/ImageProcessorClient.tsx:459`](app/image-processor/ImageProcessorClient.tsx#L459)：`showToast(t.zipFailed('無有效圖片可供打包'))`
  - [`app/ip-calculator/IpCalculatorClient.tsx:234`](app/ip-calculator/IpCalculatorClient.tsx#L234)：`showToast('網段 IP 數量較大 ... 請點擊「匯出 TXT/CSV」')`
  - [`app/liars-dice/LiarsDiceClient.tsx:589`](app/liars-dice/LiarsDiceClient.tsx#L589)：`<span>{num} 點:</span>`
  - [`app/pac-generator/PacGeneratorClient.tsx:582`](app/pac-generator/PacGeneratorClient.tsx#L582)：`<option value="DIRECT">DIRECT (直連保底)</option>`
  - [`app/pac-tester/PacTesterClient.tsx:329, 813-819, 835`](app/pac-tester/PacTesterClient.tsx#L329) & [`app/pac-tester/engine.ts:449`](app/pac-tester/engine.ts#L449)
  - [`app/personal-loan/PersonalLoanClient.tsx:167`](app/personal-loan/PersonalLoanClient.tsx#L167)：`title="複製分享連結"`
  - [`app/qr-generator/QrGeneratorClient.tsx:745`](app/qr-generator/QrGeneratorClient.tsx#L745)：`showToast('請上傳有效的圖片檔案 (PNG, JPG, SVG, etc.)')`

---

### C-2. 收斂 JSX 內散落的 `isEn ? ... : ...` 三元判斷、消除繁中冗餘英文括號，並建立全站 36 工具雙語對稱測試

- [ ] **目標 1（收斂散落三元判斷至 `translations.ts`）**：
  - [`app/hourly-rate-calculator/RankHeroBanner.tsx`](app/hourly-rate-calculator/RankHeroBanner.tsx)（68 處 `isEn ?`）
  - [`app/resignation-calculator/ResignationCalculatorClient.tsx`](app/resignation-calculator/ResignationCalculatorClient.tsx)（52 處 `lang === 'en' ?`）
  - [`app/har-cleaner/engine/sanitizer.ts`](app/har-cleaner/engine/sanitizer.ts)（47 處）& [`EntryDetailModal.tsx`](app/har-cleaner/components/EntryDetailModal.tsx)（42 處）
  - [`app/og-generator/OgGeneratorClient.tsx`](app/og-generator/OgGeneratorClient.tsx)（26 處）
  - [`app/pregnancy-calculator/PregnancyCalculatorClient.tsx`](app/pregnancy-calculator/PregnancyCalculatorClient.tsx)（13 處）
  - [`app/pac-generator/PacGeneratorClient.tsx`](app/pac-generator/PacGeneratorClient.tsx)（10 處）& [`RuleCard.tsx`](app/pac-generator/RuleCard.tsx)（6 處）

- [ ] **目標 2（移除繁中 UI 標籤冗餘英文括號，全域鐵則 2）**：
  - [`app/components/FaqSection.tsx:110`](app/components/FaqSection.tsx#L110)：`'常問問題與專業指南 (FAQ)'` ➔ `'常見問題與專業指南'`
  - 以及 [`app/base64/translations.ts:14-33`](app/base64/translations.ts#L14)、[`app/diff-checker/translations.ts:14-26`](app/diff-checker/translations.ts#L14)、[`app/dns-dig/translations.ts:20-30`](app/dns-dig/translations.ts#L20)、[`app/har-cleaner/translations.ts:33-83`](app/har-cleaner/translations.ts#L33)、[`app/hourly-rate-calculator/translations.ts:44-65`](app/hourly-rate-calculator/translations.ts#L44)、[`app/https-dns-generator/translations.ts:16-22`](app/https-dns-generator/translations.ts#L16)、[`app/ip-calculator/translations.ts:19-25`](app/ip-calculator/translations.ts#L19)、[`app/pac-tester/translations.ts:18-70`](app/pac-tester/translations.ts#L18)、[`app/password/translations.ts:12-30`](app/password/translations.ts#L12)、[`app/qr-generator/translations.ts:62-113`](app/qr-generator/translations.ts#L62)、[`app/text-utility/translations.ts:20-22`](app/text-utility/translations.ts#L20)、[`app/time/translations.ts:11-14`](app/time/translations.ts#L11)、[`app/url/translations.ts:12-30`](app/url/translations.ts#L12)。

- [ ] **目標 3（擴充雙語對稱測試至全站 36 個工具）**：
  - 將 [`app/hourly-rate-calculator/translations.ts:154`](app/hourly-rate-calculator/translations.ts#L154) 的 `FAQ_DATA` 併入 `TRANSLATIONS[lang].faqItems`，並擴充 [`tests/test-og-translations.mjs`](tests/test-og-translations.mjs)（或新增 `tests/test-all-translations.mjs`）自動測試全站 36 個工具的 `translations.ts`。

---

## 🧱 批次 D（P2 / P3）：A11y 對稱綁定、數值精度、零靜默失敗、千行組件拆解與測試擴充

### D-1. A11y `<label htmlFor>` 對稱綁定與 HTML 語意修正（全域鐵則 17 & `smalltools-code-standards` 第二節）

- [ ] **目標 1（修復 `<Link>` 內嵌 `<button>` 非法 HTML 結構）**：[`app/HomeClient.tsx:408-428, 468-492`](app/HomeClient.tsx#L408-L428)
  - **❌ 問題程式碼現況 (Before)**：
    ```tsx
    // app/HomeClient.tsx:408-428（<a> 內部直接包了 <button>，違反 HTML5 互動元素不得互嵌規範）
    <Link
      key={`pinned-${tool.href}`}
      href={targetHref}
      className={`${styles.toolCard} ${styles[tool.cardClass] || ''}`}
      ...
    >
      <button
        type="button"
        onClick={(e) => togglePinTool(tool.href, e)}
        className={`${styles.pinBtn} ${isPinned ? styles.pinBtnActive : ''}`}
      >
        {STAR_ICON(isPinned)}
      </button>
      ...
    </Link>
    ```
  - **✅ 修復目標程式碼 (After)**：
    將釘選 `<button>` 抽離至 `<Link>` 外部，共用外層相對定位容器，消除 `<a>` 嵌 `<button>`。

- [ ] **目標 2（修復 13 處未包裹控制項且無 `htmlFor` 的 `<label>`）**：
  - [`app/calendar-split/CalendarSplitClient.tsx:372-415`](app/calendar-split/CalendarSplitClient.tsx#L372-L415)：
    - **❌ Before**：
      ```tsx
      <label className="text-xs text-text-sub">{t.customSizeLabel}:</label>
      <input type="number" ... />
      ```
    - **✅ After**：使用 `useId()` 產生確定性 ID 並同時綁定 `<label htmlFor={...}>` 與 `<input id={...}>`。
  - [`app/pac-generator/RuleCard.tsx:186-187, 219-220`](app/pac-generator/RuleCard.tsx#L186-L187)：
    - **❌ Before**：`<label className="sr-only">{t.conditionType}</label><select value={rule.conditionType} ...>`（漏寫 `htmlFor` 與 `id`）
    - **✅ After**：補上 `htmlFor={`cond-type-${rule.id}`}` 與 `id={`cond-type-${rule.id}`}`。
  - [`app/pac-tester/PacTesterClient.tsx:411, 584, 760, 772, 785, 804, 824`](app/pac-tester/PacTesterClient.tsx#L411)：7 處 `<label>` 補齊 `htmlFor` 並於對應 `<input>` / `<textarea>` / `<select>` (`L415, 587, 763, 775, 788, 807, 827`) 補上 `id`。

- [ ] **目標 3（為無 `<label>` 的輸入框補齊 `aria-label` 或 `htmlFor`）**：
  - [`components/CommandPalette.tsx:296-308`](components/CommandPalette.tsx#L296-L308)（Spotlight 搜尋 `<input>` 補上 `aria-label`）
  - 有 `id` 但漏綁 `<label htmlFor>` 的 6 處：[`EpochClient.tsx:382`](app/epoch/EpochClient.tsx#L382)、[`ImageProcessorClient.tsx:992`](app/image-processor/ImageProcessorClient.tsx#L992)、[`OgGeneratorClient.tsx:677, 1007`](app/og-generator/OgGeneratorClient.tsx#L677)、[`PacGeneratorClient.tsx:570`](app/pac-generator/PacGeneratorClient.tsx#L570)、[`QrGeneratorClient.tsx:1892`](app/qr-generator/QrGeneratorClient.tsx#L1892)。

---

### D-2. 金融與職場工具殘留原生浮點運算改用 `BigNumber`（全域鐵則 6）

- [ ] **目標 1**：[`app/resignation-calculator/engine.ts:246-248`](app/resignation-calculator/engine.ts#L246-L248)
  - **❌ 問題程式碼現況 (Before)**：
    ```ts
    // app/resignation-calculator/engine.ts:246-248
    const salaryNum = Math.max(0, Number(input.monthlySalary) || 0);
    const dailyAvgSalary = Math.round(salaryNum / 30);
    const estimatedLeavePayout = Math.round(dailyAvgSalary * payoutDaysTotal);
    ```
  - **✅ 修復目標程式碼 (After)**：
    ```ts
    const salaryD = D(Math.max(0, Number(input.monthlySalary) || 0));
    const dailyAvgSalary = roundInt(salaryD.div(30));
    const estimatedLeavePayout = roundInt(D(dailyAvgSalary).times(payoutDaysTotal));
    ```

- [ ] **目標 2**：[`app/my-salary-calculator/engine.ts:70`](app/my-salary-calculator/engine.ts#L70)
  - **❌ Before**：`const empHealth = singleHealth * (1 + dependents);`
  - **✅ After**：`const empHealth = roundInt(D(singleHealth).times(1 + dependents));`

- [ ] **目標 3（Client 端頭期款/成數/保證金換算）**：
  - [`app/car-loan/CarLoanClient.tsx:103, 172, 185, 197, 211`](app/car-loan/CarLoanClient.tsx#L172)
  - [`app/mortgage-loan/MortgageLoanClient.tsx:171, 194, 217, 334, 346`](app/mortgage-loan/MortgageLoanClient.tsx#L171) & [`app/mortgage-loan/engine.ts:44`](app/mortgage-loan/engine.ts#L44)
  - [`app/personal-loan/PersonalLoanClient.tsx:111`](app/personal-loan/PersonalLoanClient.tsx#L111)
  - [`app/pledge-calculator/PledgeCalculatorClient.tsx:136`](app/pledge-calculator/PledgeCalculatorClient.tsx#L136)
  - [`app/futures-calculator/FuturesCalculatorClient.tsx:173`](app/futures-calculator/FuturesCalculatorClient.tsx#L173)

---

### D-3. 零靜默失敗：補齊例外處理的可追溯日誌與使用者反饋（全域鐵則 12）

- [ ] **目標清單**：
  1. [`app/pregnancy-calculator/PregnancyCalculatorClient.tsx:303, 559`](app/pregnancy-calculator/PregnancyCalculatorClient.tsx#L303)：
     - **❌ Before**：`try { await navigator.clipboard.writeText(url); showToast(...); } catch { // fallback }`（完全靜默，無錯誤提示）
     - **✅ After**：`catch (err) { console.warn('[PregnancyCalculator] Clipboard write failed:', err); showToast(t.copyFailed); }`
  2. [`app/har-cleaner/HarCleanerClient.tsx:180-182`](app/har-cleaner/HarCleanerClient.tsx#L180-L182)：移除原生阻塞式 `alert()`，改用頁內錯誤提示並補上 `console.error('[HarCleaner] Parse failed:', err)`。
  3. [`app/pac-tester/pacWorkerClient.ts:107, 126`](app/pac-tester/pacWorkerClient.ts#L107)：Worker 異常回退主執行緒時補上 `console.warn('[PacTester] Worker fallback to main thread:', err)`。
  4. [`app/utils/pdfHelper.ts:618`](app/utils/pdfHelper.ts#L618)：單張內嵌圖片壓縮替換失敗補上 `console.warn`。
  5. 補齊 `console.error`：[`CalendarSplitClient.tsx:80`](app/calendar-split/CalendarSplitClient.tsx#L80)、[`ImageProcessorClient.tsx:422, 467`](app/image-processor/ImageProcessorClient.tsx#L422)、[`PdfCompressorClient.tsx:266, 320`](app/pdf-compressor/PdfCompressorClient.tsx#L266)、[`PdfProcessorClient.tsx:103, 321`](app/pdf-processor/PdfProcessorClient.tsx#L103)、[`DnsDigClient.tsx:206`](app/dns-dig/DnsDigClient.tsx#L206)、[`IpDetectorClient.tsx:104-240`](app/ip-detector/IpDetectorClient.tsx#L104)、[`CertGeneratorClient.tsx:228, 295, 359`](app/cert-generator/CertGeneratorClient.tsx#L228)、[`SslConverterClient.tsx:242-535`](app/ssl-converter/SslConverterClient.tsx#L242)、[`ChecksumVerifierClient.tsx:141`](app/checksum-verifier/ChecksumVerifierClient.tsx#L141)。

---

### D-4. 補齊 16 個工具的核心引擎 (`engine.ts`) 抽離與單元測試（全域鐵則 9）

- [ ] **第一階段（已拆出純邏輯模組但目前 0 測試，可直接新增測試檔）**：
  1. 新增 `tests/engine/calendar-split.test.mjs` ➔ 測試 [`app/calendar-split/icsSplitter.ts`](app/calendar-split/icsSplitter.ts)（410 行）
  2. 新增 `tests/engine/dns-dig.test.mjs` ➔ 測試 [`app/dns-dig/dnsDecoder.ts`](app/dns-dig/dnsDecoder.ts)（218 行）
  3. 新增 `tests/engine/zip-builder.test.mjs` ➔ 測試 [`app/image-processor/utils/zipBuilder.ts`](app/image-processor/utils/zipBuilder.ts)（97 行）
- [ ] **第二階段（從 `*Client.tsx` 抽離 `engine.ts` 並補齊測試）**：
  1. [`app/https-dns-generator/HttpsDnsGeneratorClient.tsx:85-185`](app/https-dns-generator/HttpsDnsGeneratorClient.tsx#L85-L185)（RFC 9460 SVCB Wire-format 二進位 Hex 編碼器）
  2. [`app/liars-dice/LiarsDiceClient.tsx:60-140`](app/liars-dice/LiarsDiceClient.tsx#L60-L140)（二項分佈組合數學機率計算）
  3. [`app/qr-generator/QrGeneratorClient.tsx:480-620`](app/qr-generator/QrGeneratorClient.tsx#L480-L620)（TWQR 台灣支付 URI、Wi-Fi、vCard 3.0 組裝）
  4. [`app/password/PasswordGeneratorClient.tsx:65-190`](app/password/PasswordGeneratorClient.tsx#L65-L190)（字元池過濾與資訊熵 / 破解時間估算）
  5. [`app/base64/Base64Client.tsx`](app/base64/Base64Client.tsx)、[`app/url/UrlEncoderClient.tsx`](app/url/UrlEncoderClient.tsx)、[`app/json/JsonFormatterClient.tsx`](app/json/JsonFormatterClient.tsx)、[`app/diff-checker/DiffCheckerClient.tsx`](app/diff-checker/DiffCheckerClient.tsx)、[`app/text-utility/TextUtilityClient.tsx`](app/text-utility/TextUtilityClient.tsx)。

---

### D-5. 超過 1,000 行的巨型組件物理拆解（全域鐵則 10）

- [ ] **8 個超過 1,000 行的目標檔案清單**：
  1. [`app/qr-generator/QrGeneratorClient.tsx`](app/qr-generator/QrGeneratorClient.tsx)（**1,921 行**）
  2. [`app/har-cleaner/components/EntryDetailModal.tsx`](app/har-cleaner/components/EntryDetailModal.tsx)（**1,531 行**）
  3. [`app/lucky-wheel/LuckyWheelClient.tsx`](app/lucky-wheel/LuckyWheelClient.tsx)（**1,328 行**）
  4. [`app/pregnancy-calculator/PregnancyCalculatorClient.tsx`](app/pregnancy-calculator/PregnancyCalculatorClient.tsx)（**1,300 行**）
  5. [`app/mortgage-loan/MortgageLoanClient.tsx`](app/mortgage-loan/MortgageLoanClient.tsx)（**1,265 行**）
  6. [`app/og-generator/OgGeneratorClient.tsx`](app/og-generator/OgGeneratorClient.tsx)（**1,201 行**）
  7. [`app/ssl-converter/SslConverterClient.tsx`](app/ssl-converter/SslConverterClient.tsx)（**1,062 行**）
  8. [`app/resignation-calculator/ResignationCalculatorClient.tsx`](app/resignation-calculator/ResignationCalculatorClient.tsx)（**1,014 行**）

---

### D-6. 清理 ESLint 58 個 Warnings、CloudFront 安全標頭、依賴與文檔同步

- [ ] **目標 1（ESLint Warnings 修復定位）**：
  - [`app/lucky-wheel/LuckyWheelClient.tsx:563, 666`](app/lucky-wheel/LuckyWheelClient.tsx#L563)：`triggerConfetti` 在宣告前被 `useCallback` 呼叫（將 `triggerConfetti` 移至 `L520` 之前並用 `useCallback` 包裹，同時將 `playWinFanfare` 加入 `L565` 依賴陣列）。
  - [`app/image-processor/ImageProcessorClient.tsx:235`](app/image-processor/ImageProcessorClient.tsx#L235)、[`app/pac-tester/PacTesterClient.tsx:248`](app/pac-tester/PacTesterClient.tsx#L248)、[`app/pdf-compressor/PdfCompressorClient.tsx:159`](app/pdf-compressor/PdfCompressorClient.tsx#L159)：補齊 `react-hooks/exhaustive-deps` 缺少的依賴。
  - [`app/og-generator/OgGeneratorClient.tsx:1245`](app/og-generator/OgGeneratorClient.tsx#L1245)：刪除無用的 `// eslint-disable-next-line @next/next/no-img-element`。
- [ ] **目標 2（CloudFront 安全標頭）**：[`template.yml:121-133, 164`](template.yml#L121-L133)
  - **❌ 問題程式碼現況 (Before)**：
    ```yaml
    # template.yml:164（正式環境 IsNoIndexEnabled 為 false，未掛載任何安全回應標頭）
    ResponseHeadersPolicyId: !If [IsNoIndexEnabled, !Ref NoIndexResponseHeadersPolicy, !Ref "AWS::NoValue"]
    ```
  - **✅ 修復目標程式碼 (After)**：新增包含 `StrictTransportSecurity`、`ContentTypeOptions`、`FrameOptions`、`ReferrerPolicy` 的 `SecurityHeadersConfig`，讓 Prod 與 Dev 均掛載安全回應標頭。
- [ ] **目標 3（清理 `package.json` 依賴分類）**：[`package.json:25-26, 38`](package.json#L25-L26)
  - 將 `"@types/diff": "^8.0.0"`、 `"@types/node-forge": "^1.3.14"` 移至 `devDependencies`，並移除未使用的 `"reflect-metadata": "^0.2.2"`。
- [ ] **目標 4（文檔與工具數量同步）**：
  - [`README.md:5-6`](README.md#L5-L6)：徽章更新為 `Next.js-16.3.8`、`React-19.3.0`。
  - [`app/layout.tsx:27, 47, 49`](app/layout.tsx#L27)、[`app/page.tsx:8, 20, 22, 30, 32, 42`](app/page.tsx#L8)、[`app/en/page.tsx:8, 20, 22, 30, 32, 42`](app/en/page.tsx#L8)、[`app/translations.ts:41, 77`](app/translations.ts#L41)：將 `20+` 工具更新為 `36+` 工具。
  - [`.agents/skills/smalltools-i18n-seo/SKILL.md:112-115`](.agents/skills/smalltools-i18n-seo/SKILL.md#L112-L115)：更新 `app/sitemap.ts` 自動推導說明。
