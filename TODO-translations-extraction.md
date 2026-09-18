# TODO：把各工具的 `TRANSLATIONS` 抽成獨立 `translations.ts`

## 狀態：✅ 全部完成（2026-09-18）

30 個標準案例 + 2 個特殊案例（`hourly-rate-calculator`、`har-cleaner`）皆已抽離完成，
分 8 個 commit 依批次送出，每批皆完整跑過 `tsc --noEmit`、`eslint`、`test:engine`
（205 條）、`test:ui`、`test:faq`、`npm run build` 後才提交。這份文件保留作為施工
紀錄與下次類似重構的參考範本，不用再依此清單動作。

## 背景與範圍

使用者確認範圍是「全部檔案」。這份清單只處理**文案抽離**這一件事（把 `const TRANSLATIONS = {...}` 從
`XxxClient.tsx` 抽到同目錄下的 `translations.ts`），**不包含**元件拆解（例如 `pac-generator` 今天做的
`RuleCard.tsx` React.memo 拆分屬於效能修復，是另一件事，不在這份清單範圍內）。

**重要澄清（給下一次執行者）**：語言「切換機制」本身（右上角 English/繁體中文 按鈕）在全站是統一的，
由 `app/components/ToolLayout.tsx:90-105` 根據目前網址路徑自動推導，跟 `TRANSLATIONS` 放在哪個檔案
完全無關。這份 TODO 純粹是程式碼組織一致性（呼應 `AGENTS.md` 第 10 條：單檔逼近 800~1000 行前應物理
拆解），不是修 bug。

已完成：`app/og-generator`（原本就有）、以下 32 個工具（本次完成，依批次分組）。

## 完成紀錄

- **批次 1**（commit `6318096`）：qr-generator、lucky-wheel、pregnancy-calculator、
  resignation-calculator、mortgage-loan。
- **批次 2**（commit `95090e5`）：ssl-converter、image-processor、pdf-compressor、
  pdf-processor、cert-generator。
- **批次 3**（commit `5bc92ca`）：epoch、ip-calculator、car-loan、liars-dice、
  https-dns-generator。
- **批次 4**（commit `3cbeb31`）：futures-calculator、time、diff-checker、
  calendar-split、pledge-calculator。
- **批次 5**（commit `b4c6567`）：dns-dig、checksum-verifier、base64、
  compound-interest、ip-detector。
- **批次 6**（commit `4789a04`）：my-salary-calculator、password、url、json、
  personal-loan、text-utility。
- **特殊案例 - har-cleaner**（commit `0d7962a`）：`TRANSLATIONS` 從混雜的
  `constants.ts` 拆到獨立 `translations.ts`；`generateSampleHar` 等資料產生邏輯
  維持留在 `constants.ts`（採用文件原提議的選項 B）。
- **特殊案例 - hourly-rate-calculator**（commit `acc173c`）：67 處行內
  `isEn ? 'English' : '中文'` 三元運算子重構為結構化 `TRANSLATIONS['zh-TW' | 'en']`
  後再抽離。刻意保留兩類不搬移：① 含 JSX 標籤（`<a>`、`<strong>`、`<code>` 等）的
  區塊，屬排版而非純文案；② 依賴 JSON 資料本身既有雙語欄位（如
  `matchedCountry.name_en`）的條件選值，屬資料層既有 i18n 機制。已用瀏覽器實測
  zh-TW / en 兩語版、月薪與專案兩種計算模式、年份下拉選單、計算機制說明提示框、
  分享卡片連結導向 rank 頁面，畫面與文案皆正確。

## 標準流程（每個檔案照這個做，供未來類似重構參考）

1. 讀 `app/<tool>/<Tool>Client.tsx`，確認 `const TRANSLATIONS = {` 到對應的頂層 `};` 範圍，用
   `grep -n "^const TRANSLATIONS"` 起頭，往下找同縮排層級的 `};`。
2. 建立 `app/<tool>/translations.ts`：
   ```ts
   /**
    * <工具中文名> 頁面中英文案（從 <Tool>Client.tsx 抽離，避免單檔過長）。
    */
   export const TRANSLATIONS = {
     // ...原本整個物件內容原封不動搬過來...
   };
   ```
   （只搬內容，不要順手改文字措辭；這是純粹的檔案搬移重構。）
3. 從 `<Tool>Client.tsx` 刪掉原本那段 `const TRANSLATIONS = {...};`。
4. 在 `<Tool>Client.tsx` 加入 `import { TRANSLATIONS } from './translations';`（放在其他同目錄 import
   旁邊，例如 `styles`、`engine` 之後）。
5. `npx tsc --noEmit -p tsconfig.json`：必須零錯誤。若報 unused import，代表某個型別/函式只在被搬走的
   TRANSLATIONS 區塊內用到，一併從 `<Tool>Client.tsx` 的 import 移除。
6. `npx eslint app/<tool>`：不能有新增的錯誤（原本就有的既有警告，例如 `react-hooks/set-state-in-effect`
   這種跟本次改動無關的，可以忽略，但要先確認是「本來就有」而不是新增的）。
7. 每處理完 **5～8 個工具**做一次批次驗證：
   - `npm run test:engine`（205 條要全過）
   - `npm run test:ui`
   - `npm run test:faq`
   - `npm run build`（正式 Turbopack 靜態匯出建置；建置完記得 `rm -rf out .next` 清掉，並用
     `git status --short` 確認沒有 `next-env.d.ts` / `tsconfig.tsbuildinfo` 之類建置雜訊被誤動到）
8. 抽完一批後，`git diff --stat` 檢查：`<Tool>Client.tsx` 應該只有大量刪除、`translations.ts` 是新增，
   不應該有其他行被動到。這是確保「只搬家、沒改內容」的最後把關。

## 遇到非標準案例時的處理原則（本次踩過的經驗）

- **文案散落成行內三元運算子（無 TRANSLATIONS 物件）**：像 `hourly-rate-calculator` 那樣，先重構成
  結構化物件再抽離，風險比純搬移高很多，務必先問過使用者是否要做、做完務必用瀏覽器實測互動功能，
  不能只看 tsc/eslint 過。含 JSX 標籤的內容、依賴資料本身既有雙語欄位的條件選值，不用勉強塞進文案
  字典，保留在原地即可。
- **文案已抽到不同慣例的檔名（如 `constants.ts`）**：只搬文案本身，其他非文案的資料/函式留在原檔，
  避免檔名與內容從此對不上。

## 已知風險 / 注意事項（施工中踩過的坑）

- 抽完 `TRANSLATIONS` 後，要重新檢查 import 清單有沒有變成多餘（某個型別只在被搬走的區塊內用到）。
- `dns-dig` / `checksum-verifier` / `base64` 批次曾手誤打出 `export const const TRANSLATIONS`
  （重複 `const`），被 `tsc` 立即抓到，之後批次都會先檢查開頭是否只有一個 `const`。
- `next build` 用的是 Turbopack；本機測試發現 Turbopack 在**這個專案的靜態匯出模式**下，對
  `new Worker(new URL(...))` 這種 pattern 支援不完整（詳見 `public/pac-tester-worker.js` 開頭註解），
  但這跟「搬 TRANSLATIONS 物件」這種單純資料搬移完全無關。
- 每處理完一批，記得 `git status` 檢查有沒有 `next-env.d.ts`、`tsconfig.tsbuildinfo` 這類建置產生的
  雜訊被誤動到，跑完 build 記得 `rm -rf out .next`。
