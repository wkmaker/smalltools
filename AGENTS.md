# Smalltools 專案開發與交付準則 (Project Rules & Definition of Done)

本文件定義 Smalltools 專案的通用開發原則、UI 設計標準與任務交付閉環（Definition of Done）。所有在專案中工作的 Agent / Subagent 皆必須 100% 嚴格遵守本準則。

---

## 一、 語言與在地化原則 (Localization Standards)

1. **繁體中文為主**：對話輸出、程式碼註解、UI 預設文案、FAQ 與文件內容一律以繁體中文 (`zh-TW`) 為主。
2. **繁中介面純淨規範 (No Redundant Parentheses)**：
   - 繁體中文 UI 標籤與按鈕**嚴禁附加冗餘的英文括號註釋**（例如：一律採用 `主標題`、`網站名稱或網域`、`強調發光色`，嚴禁使用 `主標題 (Title)`、`網站名稱 / 網域 (Site Name / Domain)`）。
3. **範例預載 (Sample Presets) 深度在地化**：
   - 任何工具的預設填入值、展示標題與範本（Presets）在中文版必須提供道地的繁體中文內容。

---

## 二、 頂部導航與 UI 設計規範 (UI & Navigation Rules)

1. **ToolLayout 全站共用頂欄**：
   - 全站工具頁面一律使用 `ToolLayout` 內建的功能列（包含「⟵ 返回首頁」、「🔍 搜尋 ⌘K」、「🌐 語系切換 (帶地球向量圖示與手機自適應)」及「🌓 亮暗主題切換」）。
   - **嚴禁手動在 `extraHeaderControls` 注入語系 `<Link>`**，避免覆寫全站共用頂欄。
2. **顏色輸入雙模標準**：
   - 色彩控制項統一採用「左側色彩方塊 (點擊呼叫原生調色盤) + 右側等寬字文字輸入框 (支援 `#xxxxxx` 手動輸入/貼上)」並搭配常用快捷色票。
3. **零原生 Emoji 規範**：
   - 元件與按鈕一律使用向量 SVG 圖示，嚴禁在 JSX 中散落硬編碼的原生 Emoji。
4. **無障礙 A11y 嚴格對稱**：
   - 所有表單輸入框必須使用 React `useId()` 與對應的 `<label htmlFor={id}>` 綁定。

---

## 三、 架構與模組化標準 (Architecture Standards)

1. **三層分離架構**：
   - `app/[tool-name]/page.tsx` (SSR)：SEO Metadata、Canonical、Schema.org JSON-LD。
   - `app/[tool-name]/[ToolName]Client.tsx` (Client)：UI 互動、狀態管理。
   - `app/[tool-name]/[tool-name].module.css` (CSS Module)：專屬亮暗模式樣式。
2. **大型複雜工具模組化拆分（> 1,000 行代碼）**：
   - 拆分為 6 大獨立模組：`types.ts`、`constants.ts`、`translations.ts`、`[canvas/engine]Renderer.ts`、`exportHelpers.ts`、`[ToolName]Client.tsx`。
   - 於 `tests/` 建立專屬的獨立單元測試套件（如 `tests/test-[tool]-*.mjs`）。

---

## 四、 任務交付完成閉環 (Definition of Done)

每當完成新功能開發、新增工具、修復重大 Bug 或進行大規模架構重構時，**必須主動且自動完成以下 4 項交付閉環動作**：

1. 📑 **更新 `CHANGELOG.md`**：依據 Keep a Changelog 格式記錄新增 (Added)、修復 (Fixed) 或最佳化 (Optimized) 內容，並視版本等級更新 `package.json` 版本號。
2. 📖 **更新 `README.md`**：同步更新收錄工具清單、分類連結與功能簡介。
3. 📚 **沉澱並維護 `.agents/skills/`**：將本次任務中沉澱的新模式、架構規範或避坑指南同步寫入對應的 SKILL 手冊。
4. 🧪 **執行 `npm run test` 完整驗證**：確保 UI 規範檢查 (`test:ui`)、SEO 深度審計 (`test:seo`)、FAQ 結構驗證 (`test:faq`) 與單元測試 (`test:og`) 100% 全部通過。
