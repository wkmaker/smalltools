---
name: smalltools-i18n-seo
description: Smalltools 專案專屬的雙語子路由 app/[tool]/en/、tools.cjkuo.net canonical/hreflang、ToolLayout 語系自動感應、TRANSLATIONS 100% 覆蓋清單、FAQPage JSON-LD 雙架構與專業領域免責聲明、app/sitemap.ts 與 AWS S3 部署規範。
---

# Smalltools 雙語、FAQ 結構化資料與 SEO 規範

> 通用在地化規範（繁中純淨介面、消除英文冗餘括號、`{key}` 具名插值、範例深度在地化、子組件語系 Context 隔離）見 `C:\PG\skills\localization-polyglot-standards`。本手冊只列 Smalltools 專屬的路由、字典與 SEO 落地細節。

---

## 一、 多語言 (i18n) 路由架構與目錄規範

專案採用 Next.js App Router 原生子路由實現全站雙語：

```text
app/[tool-name]/
├── page.tsx                 # 繁體中文預設語系路由 (zh-TW)
├── en/page.tsx              # 英文語系獨立子路由 (en)
├── [ToolName]Client.tsx     # 雙語共享客戶端組件 (接收 lang prop)
└── [tool-name].module.css   # 共享樣式模組
```

### 1. SSR 頁面語系分流
* **繁中頁 (`page.tsx`)**：渲染 `<ToolNameClient lang="zh-TW" />`，配置繁中 `Metadata`、OpenGraph 與 JSON-LD。
* **英文頁 (`en/page.tsx`)**：渲染 `<ToolNameClient lang="en" />`，配置英文 `Metadata`、OpenGraph 與英文 JSON-LD。

### 2. SEO Canonical 與 Hreflang 宣告
`page.tsx` 與 `en/page.tsx` 的 `metadata.alternates` 必須配置雙向 `languages` 對照：

```typescript
alternates: {
  canonical: 'https://tools.cjkuo.net/[tool-name]/',
  languages: {
    'zh-TW': 'https://tools.cjkuo.net/[tool-name]/',
    en: 'https://tools.cjkuo.net/[tool-name]/en/',
  },
},
```

---

## 二、 `TRANSLATIONS` 雙語字典結構與 100% 覆蓋率規範

* **字典集中管理**：共享 Client 組件文案統一收錄於檔案頂層的 `TRANSLATIONS` 物件，明確劃分 `zh-TW` 與 `en` 兩套。嚴禁在 JSX 內散落 `lang === 'en' ? '...' : '...'` 三元判斷，統一由頂層解構 `const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];` 取用。
* **範例預載雙語在地化**：具備 Presets / 預設填入值的工具，中文版提供道地繁中內容、英文版提供標準英文範例，**嚴禁英文版預載中文（或反之）**。

### 字典 100% 覆蓋率清單
`TRANSLATIONS` 必須完全覆蓋該工具的所有介面元素，嚴禁在任何子頁籤或彈窗 JSX 遺留硬編碼中英文字串：
* **控制項**：子頁籤切換標籤 (Tabs)、輸入框 Placeholder、密碼顯示/隱藏切換文字、檔案拖曳提示 (Dropzone)。
* **動作與反饋**：送出/計算按鈕、複製/下載按鈕、Toast 成功提示、告警 Banner、格式化錯誤提示。
* **數據呈現**：結果指標標題、明細表格欄位標題、動態格式化函式文案。
* **常見問題**：FAQ 標題、副標題及完整問答清單。

---

## 三、 `ToolLayout` 語系切換與全站頂部導航共用規範

### 1. 嚴禁手動覆寫語系按鈕 (Use Built-in ToolLayout Toolbar)
* `ToolLayout` 已內建完整頂部功能列（「⟵ 返回首頁」「🔍 搜尋 ⌘K」「🌐 語系切換（地球向量圖示、手機自適應）」「🌓 亮暗主題切換」）。
* **嚴禁**在 `ToolLayout` 的 `extraHeaderControls` 手動傳入 `<Link href="/.../en/">`，這會導致內建的標準語系切換按鈕被隱藏並破壞全站頂欄一致性。
* `ToolLayout` 會依當前 URL 自動推導 `/en/` 雙向切換路徑 (`resolvedLangSwitchHref`) 並渲染標準地球圖示按鈕。標準呼叫：
```tsx
<ToolLayout
  title={t.title}
  subtitle={t.subtitle}
  description={t.description}
  accentColor="#6366f1"
  accentGlow="rgba(99, 102, 241, 0.6)"
>
  {/* 工具主體內容 */}
</ToolLayout>
```

### 2. `ToolLayout` 外圍 UI 語系自動感應
全站共用 `ToolLayout` 內部自動讀取 `usePathname()`。當路徑包含 `/en/` 時，頁面外圍 UI 自動切換：
* 返回首頁按鈕 ➔ **`Back to Home`**
* 頁尾贊助疑問句 ➔ **`Enjoying this tool?`**
* 頁尾贊助按鈕 ➔ **`Sponsor the Author ☕`**

繁體中文版面則自動維持 `返回首頁`、`喜歡這個小工具嗎？` 及 `贊助支持作者 ☕`。

---

## 四、 全站 FAQ 常見問題與 Schema.org `FAQPage` JSON-LD 規範

### 1. 雙重 FAQ 架構 (Dual FAQ Architecture)
為兼顧 Google Rich Snippets SEO 與使用者體驗，全站工具統一實作雙重 FAQ 架構：
1. **SSR 端結構化資料 (`page.tsx` & `en/page.tsx`)**：引用通用工具函式 `generateFaqSchema`（`@/app/utils/faqSchema`）生成標準 Schema.org `FAQPage` JSON-LD 物件，注入 `<script type="application/ld+json">`。
2. **Client 端互動介面 (`[ToolName]Client.tsx`)**：於 `TRANSLATIONS` 宣告 `faqTitle`、`faqSubtitle` 及 `faqItems`（繁中與英文各 6~8 題），傳入全站通用組件 `<FaqSection>` 提供手風琴展示。
3. **100% 內容同步**：`page.tsx` / `en/page.tsx` 的 JSON-LD 題目與答案陣列，必須與 `TRANSLATIONS` 的 `faqItems` 保持 100% 文字同步。

### 2. `<FaqSection>` 佈局與排版標準
* **放置位置**：`<FaqSection>` 必須放在 `ToolLayout` 內部、工具主體左右雙欄 Grid 容器下方（獨立於 Grid 之外），讓 FAQ 於全寬自然延伸。
* **清晰段落排版**：答題區預設套用 `white-space: pre-line`。子項目（如 `① 項目一` 與 `② 項目二`）、算例說明或警示段落之間，**必須使用雙空行 (`\n\n`) 獨立分隔**，嚴禁擠成單一密集段落。
* **禁止原生 Emoji**：FAQ 題目與解答內文嚴禁寫入原生 Emoji；警示標頭用中括號或純文字標號（如 `【風險警示】` 或 `[Important Notice]`），圖示由 SVG 負責。

### 3. 專業領域必備免責聲明與風險警示
凡涉及法律（如離職預告/勞基法）、稅務、金融借貸（房貸/信貸/車貸/薪資）、股票質押或期貨交易等專業領域工具：
* **法定免責條款**：必須明確宣告計算結果僅供投資、參考與學習使用，實際數字以政府官方公告、法院判決、券商/銀行公告或會計師核算為主。
* **雨天收傘與斷頭風險**：涉及槓桿、貸款、期貨或股票質押的工具，FAQ 必須明確涵蓋大跌風險、斷頭追繳機制，以及金融機構「雨天收傘（到期拒絕展延或調升借款利率）」之隱藏風險。
* **極端行情滑價與超額虧損 (Over-Loss)**：期貨與槓桿交易工具必須警示「在劇烈行情、跳空或漲跌停鎖死下，市價砍倉單仍可能因無人承接或成交在不利價位，導致實際虧損超過本金」。

---

## 五、 Next.js App Router 靜態 Sitemap 生成與 AWS 部署規範

### 1. `app/sitemap.ts` 原生動態生成
* 全站統一採用 App Router 原生 `app/sitemap.ts` 定義 `MetadataRoute.Sitemap`。`next build` 靜態導出 (`output: 'export'`) 時 Next.js 會自動於 `out/sitemap.xml` 產出。
* **強制宣告靜態導出**：`app/sitemap.ts` 頂層**必須顯式加入 `export const dynamic = 'force-static';`**，防止靜態導出模式下中斷編譯。

### 2. 多語言獨立路由與 `lastModified` 即時同步
* **英文路由註冊**：新增工具的多語言獨立路由（如 `/my-salary-calculator/en/`）時，**必須同步將英文路由網址更新至 `app/sitemap.ts` 的清單陣列**。
* **變更即時同步時間戳記**：凡對任何工具進行程式碼重構、功能新增、UI 修正、文案調整或 SEO 擴充，**必須同步將 `app/sitemap.ts` 中該工具對應的所有路由（含繁中與英文）之 `lastModified` 更新為最新修改日期**。

### 3. Sitemap 網址規範化 (Canonical URL)
* 搭配 `trailingSlash: true`，Sitemap 內所有 `<loc>` 網址必須採用目錄結尾斜線（如 `https://tools.cjkuo.net/time/`），嚴禁帶 `/index.html`。
* 部署至 AWS S3（搭配 CloudFront Rewrite）時，無檔名目錄路徑即可自動對應至 `[tool-name]/index.html`。
* 啟用 `app/sitemap.ts` 後，需確認 `public/sitemap.xml` 已刪除，避免靜態資源覆蓋 Next.js 自動生成之 Sitemap。
