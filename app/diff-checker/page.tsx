import type { Metadata } from 'next';
import DiffCheckerClient from './DiffCheckerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '線上文字與程式碼比對工具 - 免費文件／檔案 Diff 差異比對',
  description:
    '免費線上文字、程式碼與文件比對工具！支援左右雙欄對照、單欄差異合併與檔案拖曳匯入，100% 瀏覽器本地運算，機密合約與原始碼絕不上傳。',
  keywords:
    '程式碼比對,線上文字比對,線上文件比對工具,線上比對,文件比對,檔案比對,文字比對,文本比對,Diff工具,Diff Checker',
  alternates: {
    canonical: 'https://tools.cjkuo.net/diff-checker/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/diff-checker/',
      en: 'https://tools.cjkuo.net/diff-checker/en/',
      'x-default': 'https://tools.cjkuo.net/diff-checker/en/',
    },
  },
  openGraph: {
    title: '線上文字與程式碼比對工具 - 免費文件／檔案 Diff 差異比對',
    description:
      '免費線上文字、程式碼與文件比對工具，支援左右雙欄對照與單欄合併，100% 瀏覽器本地運算，機密合約與原始碼絕不上傳。',
    url: 'https://tools.cjkuo.net/diff-checker/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '線上文字與程式碼比對工具 - 免費文件／檔案 Diff 差異比對',
    description:
      '免費線上文字、程式碼與文件比對工具，支援左右雙欄對照與單欄合併，100% 瀏覽器本地運算，機密合約與原始碼絕不上傳。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '線上文字與程式碼比對工具',
  url: 'https://tools.cjkuo.net/diff-checker/',
  description:
    '免費線上文字、程式碼與文件比對工具，支援左右雙欄與單欄混合差異比對，100% 瀏覽器本地運算。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是文字與程式碼比對 (Diff Checker)？它的底層運作原理是什麼？',
    a: 'Diff 比對工具用於精確識別兩份文字或原始碼版本之間的「新增 (Added)」、「刪除 (Removed)」與「未變更 (Unchanged)」差異：\n\n① 經典 Myers 差分演算法：\n本工具基於 Git 與各大版本控制系統廣泛採用的 Myers Diff Algorithm，以最短編輯路徑 (Shortest Edit Script) 精準計算出最小變更集合。\n\n② 視覺化逐行與字元高亮：\n清楚標註具體修改的行號與內容區塊，大幅提升程式碼審查 (Code Review)、法律合約修訂與文稿校對的效率。',
  },
  {
    q: '「左右雙欄 (Split Mode)」與「單欄混合 (Unified Mode)」比對模式有何不同？',
    a: '兩種視圖模式分別適合不同的使用場景：\n\n① 左右雙欄 (Split View)：\n將原始版本 (Original) 與修改後版本 (Modified) 左右並排呈現，並鎖定雙欄同步滾動，便於直觀對照前後版本的結構佈局變化。\n\n② 單欄混合 (Unified View)：\n將所有變更融合在單一視圖中，以紅色標示刪除行、綠色標示新增行（類似 GitHub PR 與 Git Patch 格式），適合專注於行級細節差異。',
  },
  {
    q: '在線上貼上商業機密原始碼、合約或包含個資之文件進行比對是否安全？',
    a: '絕對安全！本比對工具為 100% 純前端（Client-Side）本地運算架構：\n\n① 零後端傳輸：\n所有文字解析、Diff 矩陣運算與高亮渲染皆完全在您的電腦瀏覽器記憶體中執行。\n\n② 零雲端留存：\n系統不會向任何伺服器發送或備份您的輸入文本與拖曳檔案，即使在斷網離線狀態下亦可正常運作。',
  },
  {
    q: '什麼是「忽略大小寫 (Ignore Case)」？在何種比對情境下建議開啟？',
    a: '功能作用與應用場景如下：\n\n① 忽略字母大小寫差異：\n開啟後，系統會將 `apple` 與 `Apple` 視為相同文字，不列入差異統計。\n\n② 適用情境：\n適合用於比對不區分大小寫的 SQL 查詢語句、HTML 標籤、設定檔關鍵字或單純注重文字語意的文稿校對。',
  },
  {
    q: '本工具支援哪些檔案格式匯入比對？是否有檔案大小限制？',
    a: '支援彈性的檔案拖曳匯入工作流：\n\n① 支援檔案型態：\n支援各類純文字格式（`.txt`, `.md`, `.json`, `.csv`, `.xml`, `.yaml`）以及所有主流程式語言源碼（`.js`, `.ts`, `.py`, `.java`, `.go`, `.cpp`, `.css`, `.html` 等）。\n\n② 瀏覽器效能建議：\n建議單一檔案大小小於 10MB（約數十萬行文字），以確保瀏覽器 DOM 渲染保持 60fps 流暢度。',
  },
  {
    q: 'Unified 模式下的「逐行合併決策 (Merge Diff)」功能如何操作？',
    a: '強大的互動式版本合併功能：\n\n① 自訂採納變更：\n在 Unified 視圖中，您可以點擊任一差異行切換「保留 (Active)」或「略過 (Skipped)」狀態，客製化決定最終保留的內容。\n\n② 即時匯出合併結果：\n完成決策後可點擊「複製合併結果」或「匯出合併檔案」，快速產出融合後的最新版本文件。',
  },
  {
    q: '如何快速在兩份文件間交換比對方向或清除重置？',
    a: '提供全方位快捷工具列：\n\n① 一鍵交換 (Swap)：\n點擊「交換左右」按鈕即可瞬間對調 Original 與 Modified 內容，無需手動剪貼。\n\n② 專注模式與清空：\n支援「隱藏編輯器 (Show Diff Only)」全螢幕沉浸式審閱比對結果，以及一鍵清空重置。',
  },
]);

export default function DiffCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <DiffCheckerClient lang="zh-TW" />
    </>
  );
}
