# Smalltools 專案開發準則 (Project Rules & Definition of Done)

本專案**完整遵循** `C:\PG\AGENTS.md` 的「永遠適用鐵則」與「任務交付閉環 (DoD)」，以及 `C:\PG\skills\` 底下 8 份深入細則（繁中純淨介面、前端分層架構與六分拆解、零原生 Emoji、雙模色彩控制項、A11y 對稱綁定、效能與主執行緒防護、彈出層 Portal 隔離、非同步競態防護、測試架構、Web 安全與 OWASP Top 10、SEO 與可發現性等）。

本檔**只列 Smalltools 專屬的補充與差異**，不重複上層已涵蓋的通用規範。細節見 `.agents/skills/` 四份專案手冊：

| 專案手冊 | 內容 |
| :--- | :--- |
| [`smalltools-design-system`](.agents/skills/smalltools-design-system/SKILL.md) | 毛玻璃美學與語意 Token、亮暗雙主題 (`data-theme`) 架構、Tailwind `dark:` 變體陷阱、WCAG AA 霓虹色降階對照表、粒子星網背景、`ToolLayout` 版面。 |
| [`smalltools-code-standards`](.agents/skills/smalltools-code-standards/SKILL.md) | Tailwind v4 Cascade Layer 避坑、行動端「表格轉直式卡片」與首欄凍結、表單即時千分位與 `number \| ''` 狀態、字級階層與 iOS Auto-Zoom 防護、APR 二分求解、Windows UTF-8 編碼防護。 |
| [`smalltools-dev-architecture`](.agents/skills/smalltools-dev-architecture/SKILL.md) | 網址參數雙向狀態連動與 `isMountedRef` 防護、中央工具註冊 `app/config/tools.tsx` 與 404 動態推薦、歷史紀錄「呼吸留白」、持續性拖曳上傳 UX。 |
| [`smalltools-i18n-seo`](.agents/skills/smalltools-i18n-seo/SKILL.md) | 雙語子路由 `app/[tool]/en/`、`tools.cjkuo.net` canonical/hreflang、`ToolLayout` 語系自動感應、`TRANSLATIONS` 100% 覆蓋清單、FAQPage JSON-LD 雙架構、`app/sitemap.ts` 與 AWS S3 部署。 |

---

## 一、 頂欄與版面（專案專屬）

1. **`ToolLayout` 全站共用頂欄**：所有工具頁一律用 `app/components/ToolLayout.tsx` 作最外層容器。它已內建「⟵ 返回首頁」「🔍 搜尋 ⌘K」「🌐 語系切換（地球圖示、手機自適應）」「🌓 亮暗主題切換」，並依路由自動推導 `/[tool]/` ↔ `/[tool]/en/` 雙語連結。
2. **嚴禁手動注入語系連結**：**嚴禁**在 `extraHeaderControls` 傳入 `<Link href="/.../en/">`，會覆寫並隱藏內建語系切換鈕、破壞全站頂欄一致性。`extraHeaderControls` 僅用於工具專屬選單（如計時器全螢幕設定）。
3. **主體內容全寬響應**：工具主體（雙欄 Grid、輸入面板、結果看板、Dropzone）必須隨螢幕自然延伸，嚴禁在主體容器寫死 `max-w-[xxxxpx]`，一律 `w-full` + 斷點 Grid。

---

## 二、 檔案與路徑慣例（專案專屬）

通用「三層分離」與「六分拆解法」見 `C:\PG\skills\frontend-architecture-ui`。本專案落地慣例：

1. **工具目錄**：`app/[tool-name]/` 下為 `page.tsx`（SSR）、`[ToolName]Client.tsx`（`'use client'`，接收 `lang?: 'zh-TW' | 'en'`）、`[tool-name].module.css`（亮暗特化）、選用 `config/`。
2. **canonical 網域**：`page.tsx` 的 `alternates.canonical` 一律 `https://tools.cjkuo.net/[tool-name]/`；`app/layout.tsx` 設 `metadataBase: new URL('https://tools.cjkuo.net')`。
3. **中央註冊**：每個工具的路由、分類、主題 SVG 圖示、簡介、`cardClass` 統一收錄 `app/config/tools.tsx`。
4. **靜態資產**：全站圖片與根資產放 `public/`，確保 `output: 'export'` 時複製到 `out/`；重構後的舊版 HTML/JS 歸檔 `legacy/`。
5. **大型工具測試**：六分拆解的工具需在 `tests/` 建立專屬套件 `tests/test-[tool]-*.mjs`（雙語鍵值對稱、FAQ 結構、色碼/尺寸規範）。

---

## 三、 任務交付閉環（DoD，覆寫上層第 2~4 步的落地方式）

上層 DoD 四步照走；本專案的具體落地：

1. **`CHANGELOG.md`**：Keep a Changelog 格式（Added / Changed / Fixed / Security），同步更新 `package.json` 版本號（SemVer）。
2. **`README.md`**：同步更新收錄工具清單、分類連結與功能簡介。
3. **技能沉澱**：本次踩到的專案專屬雷 / 模式，寫回 **`.agents/skills/`** 對應手冊（跨專案通用的則沉澱回 `C:\PG\skills\`）。
4. **`npm run test` 完整驗證**：`test:ui`（UI 規範 + WCAG 亮暗對比）+ `test:seo`（SEO 深度審計）+ `test:faq`（FAQ 結構化資料）+ `test:og`（雙語字典 / 常數）四套件 100% 通過。`npm run build` 會先跑 `prebuild` 執行同一批檢查，任何工具遺漏 SEO 標記、未配置 FAQ 或違反 UI 規範將**自動中斷建置**。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
