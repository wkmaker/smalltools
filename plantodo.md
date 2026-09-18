# 計畫：首頁 Tab／搜尋狀態管理重構（URL 分享 + 本地記憶）

## 狀態：📝 規劃中（尚未動工，下次執行前請重新確認本文件與程式碼現況一致）

本文件只做規劃，**沒有改動任何程式碼**。這是應使用者要求，把討論定案的方向寫成詳細施工清單，
供下次執行時直接照做。量體不大（單一檔案），但涉及狀態管理行為改變，需要仔細驗證，故先落地成文件。

---

## 一、背景與動機

目前 `app/HomeClient.tsx` 的 tab／搜尋框狀態管理有兩個問題：

1. **每次互動都會把網址弄髒**：點 tab 或打字時會呼叫 `syncURL()` → `router.replace()`，
   把 `?category=xxx&search=yyy` 寫回網址列（`app/HomeClient.tsx:139-154`、`:170-187`）。
   使用者的本意其實是「網址平常應該保持乾淨，只有『主動分享』時才產生帶參數的連結」。
2. **沒有本地記憶**：目前完全沒有把 tab／搜尋狀態存進 `localStorage`，所以下次打開首頁
   （沒帶網址參數時）永遠回到預設的「全部工具、空搜尋」，跟已經做本地記憶的
   `pinnedHrefs`／`recentHrefs`（`app/HomeClient.tsx:57-70`）不一致。

使用者確認的目標行為：

- **讀取優先序**：網址參數存在 → 用網址參數（且視為一次「變更」，順便寫回本地）；
  網址參數不存在 → 用本地 `localStorage`；本地也沒有 → 用預設值（`activeTab='all'`、`searchQuery=''`）。
- **平常操作不寫網址**：點 tab、打字搜尋時，只更新本地 state + `localStorage`，**不**呼叫
  `router.replace()`，網址列維持乾淨。
- **明確的「分享」動作**：新增一個分享按鈕/連結，使用者主動點擊時才組出帶參數的網址並複製到剪貼簿
  （比照 `app/base64/Base64Client.tsx:179-188` 的 `copyValue` + `showToast` 慣例）。
- **對方打開分享連結後，也要存回對方的本地**：讓對方之後不帶參數重新造訪時，也停在分享當下的狀態。

## 二、現況程式碼盤點（`app/HomeClient.tsx`）

| 內容 | 行號 | 說明 |
|---|---|---|
| `activeTab`/`searchQuery` state 宣告 | 48-49 | 保留，但初始值來源要改 |
| `isMounted` + 讀 `pinnedHrefs`/`recentHrefs` 的 effect | 57-70 | **不動**，這是純 client-only 資料，維持現況 |
| 從 `searchParams` 同步進 `activeTab`/`searchQuery` 的 effect | 93-99 | **整段移除**，改用 lazy initial state |
| `syncURL`（debounce + `router.replace`） | 139-154 | **整段移除** |
| `debounceRef` ref 宣告 | 55 | 隨 `syncURL` 一起移除（除非分享輸入框需要 debounce，見邊緣案例） |
| `handleTabClick` 呼叫 `syncURL` | 170-174 | 改成只 `setActiveTab` + 寫 localStorage |
| `handleSearchChange` 呼叫 `syncURL` | 176-180 | 改成只 `setSearchQuery` + 寫 localStorage |
| `handleSearchClear` 呼叫 `syncURL` | 182-187 | 改成只清空 state + 寫 localStorage |
| tab 按鈕 UI（`ALL_TABS.map`） | 298-310 | 不動，新增分享按鈕放旁邊或搜尋框旁 |
| 搜尋框（uncontrolled，用 `searchInputRef` 賦值） | 264-296 | 初始值要能反映 lazy init 結果（見下方「搜尋框初始值」） |

## 三、關鍵架構判斷：這個元件本來就是純 Client-Only Render

`next.config.ts:5` 是 `output: 'export'`（完全靜態匯出，無伺服器）。`app/page.tsx:60-68` 和
`app/en/page.tsx` 都把 `<HomeClient>`包在 `<Suspense fallback={<div>載入中...</div>}>` 裡——這是因為
`useSearchParams()` 在靜態匯出模式下無法在建置期知道網址參數，所以**建置出來的靜態 HTML 內容其實
是「載入中...」這行字，不是首頁真正的內容**；真正的首頁內容是瀏覽器載入 JS 後才第一次 client render
出來的，不是「hydrate 一份已存在的 SSR HTML」。

**這個事實推翻了原本「要用 effect 避免 hydration mismatch」的顧慮**：因為根本沒有需要對齊的
伺服器內容，`activeTab`/`searchQuery` 的初始值可以直接用 `useState(() => {...})` 的 lazy
initializer 同步讀 `searchParams` 或 `localStorage`，不需要额外一個 effect 事後補值、也不會有
`react-hooks/set-state-in-effect` warning。這比原本討論的「effect 補值」方案更乾淨。

（附註：這代表首頁目前對「停用 JS 仍可見」「首屏內容 SSR/SSG」這條 SEO 原則其實本來就不滿足——
但這是既有狀況，不在這次任務範圍內，僅記錄供未來參考，不在本次一併處理。）

## 四、詳細變更步驟

### 4.1 新增 localStorage 讀寫工具函式

在 `HomeClient` 內（或抽成檔案內小函式即可，不需要獨立檔案）新增安全讀寫 helper，比照
`togglePinTool`（`:73-83`）已有的 `try/catch` 慣例：

```ts
const ACTIVE_TAB_KEY = 'smalltools_active_tab';
const SEARCH_QUERY_KEY = 'smalltools_search_query'; // 是否要存搜尋字詞，見邊緣案例 5.3

function readLocalTab(): Tab | null {
  try {
    const v = localStorage.getItem(ACTIVE_TAB_KEY);
    return v && (ALL_TABS as string[]).includes(v) ? (v as Tab) : null;
  } catch {
    return null;
  }
}

function writeLocalTab(tab: Tab) {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch {}
}
```

`searchQuery` 若決定要存（見 5.3），比照同樣寫法，但不需要白名單驗證，只需型別是 string。

### 4.2 lazy initial state 取代 effect

```ts
const searchParams = useSearchParams();

const [activeTab, setActiveTab] = useState<Tab>(() => {
  const urlCat = searchParams.get('category');
  if (urlCat && (ALL_TABS as string[]).includes(urlCat)) return urlCat as Tab;
  return readLocalTab() ?? 'all';
});

const [searchQuery, setSearchQuery] = useState<string>(() => {
  const urlQ = searchParams.get('search');
  if (urlQ) return urlQ;
  return readLocalQuery() ?? ''; // 若決定不存 search，這裡固定回傳 ''
});
```

**重要**：`useState` 的 lazy initializer 只在**第一次 render** 執行一次，之後 `searchParams`
若因為使用者按瀏覽器上一頁/下一頁而變動，不會自動反映到 state——這是**預期行為**（使用者已明確
表示平常操作不需要網址同步），但要在程式碼註解寫清楚，避免未來被誤認為 bug 而加回 effect。

### 4.3 網址參數命中時，視為一次「變更」寫回本地

在同一輪 render（例如用一個 `useRef` 記錄「這次初始化是不是吃到網址參數」，掛載後開一個
**只執行一次**的 effect 把它 flush 進 localStorage）：

```ts
const initialFromUrlRef = useRef<{ tab: Tab; q: string } | null>(null);
// 在上面兩個 lazy initializer 判斷「有吃到網址參數」的分支順便寫入 initialFromUrlRef.current

useEffect(() => {
  if (initialFromUrlRef.current) {
    writeLocalTab(initialFromUrlRef.current.tab);
    if (initialFromUrlRef.current.q) writeLocalQuery(initialFromUrlRef.current.q);
  }
}, []); // 掛載後執行一次即可，純粹是「把這次的初始值同步進 storage」，不是狀態衍生
```

這是唯一新增的 effect，且只在掛載時跑一次、不依賴任何後續變化，語意上跟現有
`:57-70` 那個讀 pinned/recent 的 effect同一類（一次性初始化副作用），不會被
`react-hooks/set-state-in-effect` 判定為問題（這裡也沒有呼叫 `setState`，只是寫 storage）。

### 4.4 事件處理常式改為「本地 state + 本地儲存」，移除網址同步

```ts
const handleTabClick = (tab: Tab) => {
  if (tab === activeTab) return;
  setActiveTab(tab);
  writeLocalTab(tab);
};

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const q = e.target.value;
  setSearchQuery(q);
  writeLocalQuery(q); // 若決定要存；若不存，這行拿掉，只留 setSearchQuery
};

const handleSearchClear = () => {
  setSearchQuery('');
  if (searchInputRef.current) searchInputRef.current.value = '';
  writeLocalQuery(''); // 同上，視 5.3 決策
  searchInputRef.current?.focus();
};
```

移除：`syncURL` 函式本體（`:139-154`）、`debounceRef`（`:55`，若分享輸入不需要 debounce）、
`useRouter()` 的 `router` 變數如果拿掉分享時改用純字串組合則可能不再需要 import（要跑
`tsc`/`eslint` 確認有沒有變成 unused import）。

### 4.5 搜尋框初始值

目前搜尋框是 uncontrolled input（用 `ref` 賦值，`:268-275`），原本靠 `:93-99` 那個 effect
把 `searchInputRef.current.value = q` 同步進去。effect 移除後，改成直接給 `defaultValue`：

```tsx
<input
  ref={searchInputRef}
  type="text"
  defaultValue={searchQuery}
  ...
/>
```

因為 `searchQuery` 現在的初始值已經在 `useState` lazy init 階段就決定好了，`defaultValue`
足夠反映第一次 render 的內容，不需要額外同步。

### 4.6 新增「分享」功能

**UI 位置**：建議放在搜尋框控制面板（`:263` `controlPanel` 區塊）右側，或比照右上角按鈕群組
（`:218-256`）新增一顆圖示按鈕。與現有「搜尋 ⌘K」「語言切換」按鈕並排。

**行為**：

```ts
const handleShare = () => {
  const params = new URLSearchParams();
  if (activeTab !== 'all') params.set('category', activeTab);
  if (searchQuery) params.set('search', searchQuery);
  const qs = params.toString();
  const url = `${window.location.origin}${basePath}${qs ? `?${qs}` : ''}`;
  navigator.clipboard
    .writeText(url)
    .then(() => showToast(t.shareCopied))
    .catch(() => showToast(t.shareCopyFailed));
};
```

- 若 `activeTab==='all'` 且 `searchQuery===''`（等於預設狀態），分享出去的連結就是網站首頁本身——
  這是合理行為，**不需要特別擋掉分享按鈕**，但文案或 UI 可考慮讓使用者知道「目前是預設狀態」
  （非必要，可選）。
- 需要新增 `showToast`／`toast` state／`toastTimer` ref，比照 `app/base64/Base64Client.tsx:81,89-93`
  的既有寫法（首頁目前完全沒有 toast 機制，要新增）。
- 需要在畫面上加對應的 toast UI 元素（顯示 `toast.msg`，2.5 秒後消失），比照 base64 頁面的
  toast 渲染區塊（需另外去該檔案找 JSX 渲染部分，複製排版慣例，不要自創一套新樣式）。

**新增文案**（`app/translations.ts`，`zh-TW`／`en` 都要補）：

- `shareBtn`：按鈕文字/aria-label，例如「複製分享連結」
- `shareCopied`：toast 成功文案，例如「已複製分享連結」
- `shareCopyFailed`：toast 失敗文案，例如「複製失敗，請手動複製網址」

### 4.7 `Tool`／`Category` 型別匯入是否還需要 `router`

移除 `syncURL` 之後檢查 `useRouter()` 的 `router` 變數還有沒有其他用途（目前掃過的程式碼看起來
`router` 只在 `syncURL` 裡用到）。若真的沒有其他用途，`import { useRouter, useSearchParams } from
'next/navigation'` 要改成只留 `useSearchParams`，避免 `tsc`/`eslint` 噴 unused import。

## 五、邊緣案例清單（務必逐項確認）

1. **localStorage 存的 tab 值已不存在**（未來拿掉某個分類）：`readLocalTab()` 已用
   `ALL_TABS.includes()` 白名單驗證，無效值會 fallback 到 `'all'`，不會讓畫面空白或壞掉。
   實作時務必保留這個驗證，不要偷懶直接 cast。

2. **localStorage 被瀏覽器封鎖或拋錯**（無痕模式、隱私設定、容量滿）：所有讀寫都要包
   `try/catch`，讀取失敗回傳 `null`（視為「沒有本地值」），寫入失敗靜默忽略——比照現有
   `togglePinTool`（`:78-80`）的既有慣例，不要噴出未捕捉例外。

3. **網址參數存在但值不合法**（例如 `?category=xxxx` 打錯字、或 `?search=`空字串）：
   `category` 一樣要做 `ALL_TABS.includes()` 白名單檢查，不合法就當作沒有網址參數處理
   （fallback 到 localStorage → 預設值），不能直接 cast 成 `Tab` 塞進 state（現有程式碼
   `:96` `cat as Tab | null` 這個 cast 寫法本身就不夠嚴謹，這次重構要順便修正掉，改成
   `ALL_TABS.includes(urlCat)` 通過才採用）。

4. **是否要一併驗證/清理 `search` 參數**：例如超長字串、只有空白字元——建議至少
   `trim()` 一次，避免存進 localStorage 或塞進網址的是純空白。

5. **要不要把 `searchQuery` 也存進本地？**——這是本文件唯一還沒定案、需要使用者
   下次執行前先決定的產品行為問題：
   - **存**：使用者上次搜尋「json」離開，下次不帶網址參數重新打開首頁，會直接看到
     搜尋「json」後的結果，而不是完整工具列表。好處是「完全復原上次畫面」；壞處是
     使用者可能覺得「我明明沒搜尋，怎麼自動幫我濾掉大部分工具」，造成困惑，且低頻率
     使用者可能忘記自己上次搜過什麼。
   - **不存**（只存 `activeTab`，`searchQuery` 永遠預設為空字串，除非來自網址參數）：
     行為更像多數電商/工具網站的慣例（分類記得、搜尋詞不記得）。
   - 建議：**只存 `activeTab`，不存 `searchQuery`**（比較符合直覺、風險較低），但這是
     產品決策，本文件先列出兩個選項，執行前跟使用者確認一次即可，不要自己決定後直接刻。

6. **分享連結產生的時機值是否該用「防抖後的最終值」**：因為拿掉 `syncURL` 的 debounce，
   `handleShare` 用的是點擊當下的 `activeTab`/`searchQuery`（React state，一定是最新值），
   不需要額外 debounce，原本的 `debounceRef` 純粹是「避免打字時狂打網址列」的考量，
   分享是離散的單次點擊動作，不受影響。

7. **多分頁同時開啟**：目前設計不做跨分頁即時同步（不監聽 `storage` 事件）。使用者在
   分頁 A 切到「金融理財」，分頁 B 不會自動跟著變。這是**明確排除範圍**，不在這次
   實作內，除非使用者之後另外要求。

8. **從分享連結進站後，使用者馬上又手動切換 tab**：此時應該正常呼叫 `handleTabClick`
   走 4.4 的新邏輯（`setActiveTab` + `writeLocalTab`），不需要特殊處理——因為 4.3 的
   「網址參數 flush 進本地」只在掛載時跑一次，之後的手動操作走正常路徑，兩者不會衝突。

9. **`window.location.hash`／`sessionStorage.lastVisitedTool` 捲動定位邏輯**
   （`:101-137`）**完全不受影響**，這段跟 tab/search 狀態無關，不要動到。

10. **靜態匯出 + Suspense fallback 的既有限制**：見第三節附註，這次不處理，只記錄。

11. **`handleShare` 用 `navigator.clipboard`**：跟 `base64` 頁面一樣，若瀏覽器環境不支援
    `navigator.clipboard`（例如非 HTTPS 環境、極舊瀏覽器），`.catch()` 要顯示
    `shareCopyFailed` 文案，不要讓例外整個炸掉頁面（`base64/Base64Client.tsx:184-188`
    已有現成寫法可以直接抄）。

12. **`ALL_TABS.includes(urlCat)` 的 TypeScript 型別**：`Array<Tab>.includes(x: string)`
    在型別上會需要 `as string[]` 轉型（因為 `includes` 的參數型別預設收斂成 `Tab`），
    這點在 4.1/5.3 的範例程式碼裡已經用 `(ALL_TABS as string[]).includes(...)` 寫法，
    避免 `tsc` 報型別不符。

## 六、驗證計畫（照 `AGENTS.md`／既有慣例，不能省）

1. `npx tsc --noEmit -p tsconfig.json`：零錯誤。
2. `npx eslint app/HomeClient.tsx app/translations.ts`：不能有新增的 error；
   確認原本兩個 `react-hooks/set-state-in-effect` warning（第 58、96 行附近，
   實際行號會因改動位移）是否消失或減少——這次改動預期會讓「網址同步 activeTab」
   那個 warning 消失（因為改用 lazy init），「讀 pinned/recent」那個維持不變。
3. `npm run test:engine`（205 條全過）、`npm run test:ui`、`npm run test:faq`
   （這三個不太可能被影響，但照既有 SOP 全部跑一次）。
4. `npm run build`（Turbopack 靜態匯出），完成後 `rm -rf out .next`，
   `git status --short` 確認沒有 `next-env.d.ts`／`tsconfig.tsbuildinfo` 雜訊。
5. **瀏覽器手測（這次改動涉及互動行為，不能只看 tsc/build，比照
   `hourly-rate-calculator` 那次特殊案例的驗收方式）**：
   - 空白網址進站：預設『全部工具』、空搜尋（或本地有值則套用本地值）。
   - 手動點不同 tab、輸入搜尋字：確認網址列**不會**改變。
   - 點分享按鈕：確認剪貼簿內容正確（`?category=xxx&search=yyy`），且 toast 有跳出來。
   - 用剛剛複製的分享連結開新分頁：確認畫面套用網址參數的 tab/搜尋狀態。
   - 從分享連結進站後，把網址列參數手動清掉重新整理：確認這次會套用「剛剛分享連結
     帶入」被存進本地的狀態（驗證 4.3 的 flush 邏輯有效）。
   - 清除瀏覽器 localStorage 後空白網址進站：確認乾淨回到預設狀態，不會壞掉或空白。
   - 中文版 `/` 與英文版 `/en/` 兩個路徑都要各測一次（`basePath` 邏輯）。

## 七、明確排除範圍（這次不做）

- 不處理 46 處 `react-hooks/set-state-in-effect` warning 中，跟這個頁面無關的其餘工具。
- 不做跨分頁（多視窗）即時同步。
- 不改動 `pinnedHrefs`／`recentHrefs`／捲動定位（`window.location.hash`）等既有邏輯。
- 不新增「分享時同時分享 pinned/recent 清單」之類的額外功能，分享範圍僅限
  `activeTab`／`searchQuery`。
