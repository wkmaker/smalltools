import type { Metadata } from 'next';
import LuckyWheelClient from './LuckyWheelClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
  description:
    '免費線上幸運轉盤抽獎小工具，支援靈活自訂獎項名稱、數量、機率權重與扇區顏色。提供全螢幕抽獎舞台、真實物理減速動畫與中獎歷史紀錄。',
  keywords: '轉盤抽獎,線上抽獎工具,幸運大轉盤,機率抽獎,全螢幕抽獎,尾牙抽獎,會議抽獎,免費轉盤',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
      'x-default': 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
    description: '免費線上轉盤抽獎工具，支援自訂獎項數量、權重比例與色彩，附帶真實物理旋轉動畫。',
    url: 'https://tools.cjkuo.net/lucky-wheel/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
    description: '免費線上轉盤抽獎工具，支援自訂獎項數量、權重比例與色彩，附帶真實物理旋轉動畫。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '幸運轉盤抽獎小工具',
  url: 'https://tools.cjkuo.net/lucky-wheel/',
  description: '免費線上幸運轉盤抽獎小工具，支援靈活自訂獎項名稱、數量、權重與扇區顏色。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '幸運轉盤的抽獎演算法是如何運作的？真的完全公平隨機嗎？',
    a: `100% 公平且完全隨機！本工具採用瀏覽器底層的密碼學級安全亂數產生器（Web Cryptography API - crypto.getRandomValues）與高隨機度亂數演算法，確保每一次旋轉的落點角度均具備極高的熵值（Entropy），徹底杜絕任何人工操控或規律預測。`,
  },
  {
    q: '獎項的「權重 (Weight)」是如何影響中獎機率與扇區面積的？',
    a: `每個獎項的中獎機率由該獎項的「權重值」除以「所有未抽完獎項的權重總和」決定：

① 扇區面積視覺連動：在幸運轉盤模式中，每個獎項所佔據的圓弧角度與其權重比例嚴格呈正比（角度 = 360° × 該獎項權重 / 總權重）。

② 浮動機率再平衡：當特定獎項數量抽完（或被手動標記為抽完）時，系統會動態剔除該項目，並將其機率比例無損平攤給剩餘所有可抽獎項。`,
  },
  {
    q: '「幸運轉盤」與「擬真拉霸機 (Slot Machine)」兩種模式有何不同？',
    a: `兩者共享同一套獎項清單與機率設定，但提供截然不同的視覺與活動氛圍：

① 幸運轉盤 (Lucky Wheel)：經典圓形轉盤，具備指針停靠與動態扇區視覺，適合聚會、懲罰遊戲與快速做決定。

② 擬真拉霸機 (Slot Machine)：霓虹三滾輪動態旋轉與跑馬燈音效，帶來沉浸刺激感，特別適合公司尾牙、展覽攤位抽獎或大型發表會。`,
  },
  {
    q: '如何設定「數量限制」？「展場無限抽模式」適用於什麼情境？',
    a: `本工具支援彈性的庫存扣減機制：

① 啟用數量限制：可針對每個獎項設定總數量（例如頭獎 1 台、二獎 3 台）。抽中時自動扣減庫存，扣至 0 時自動標記為已抽完並移出轉盤，防止重複抽出超額大獎。

② 關閉數量限制 (展場無限抽)：所有項目均無數量上限，抽中後不會扣減庫存，適合展覽現場發放宣傳品、無限次互動遊戲或輪盤日常決策。`,
  },
  {
    q: '如何快速匯入大量人員名單或自訂獎項？支援什麼檔案格式？',
    a: `點擊「匯入 TXT/名單」按鈕，支援以下兩種便捷格式：

① 單純人員名單：每行輸入一個姓名或編號（如「王小明」），系統會自動以相同權重批次生成名單項目。

② 完整獎項格式 (CSV/TXT)：每行以逗號分隔「獎項名稱, 權重, 數量」（例如「iPad, 2, 3」），即可一次性匯入完整權重與數量設定。

同時可點擊「匯出 TXT」隨時備份目前設定，便於跨電腦或未來活動重複載入。`,
  },
  {
    q: '在公司尾牙或大型活動中，如何配合大螢幕投影機進行「全螢幕抽獎」？',
    a: `點擊右上角的「全螢幕」按鈕即可切換至專屬的抽獎舞台模式：

① 獨立沉浸舞台：自動隱藏所有設定面板與邊框，僅保留高畫質轉盤/拉霸機、即時可抽獎項列表以及「上一位中獎者」名牌。

② 歡慶彩帶與音效：抽中大獎時會自動播放慶祝音效，並在全螢幕觸發滿版五彩碎紙彩帶動畫（Confetti），將現場氣氛推至最高潮！`,
  },
  {
    q: '我輸入的員工名單或獎項資料會被上傳到伺服器嗎？網頁關閉後資料會遺失嗎？',
    a: `絕不上傳，100% 隱私安全！

① 本地純前端運算：所有名單、中獎紀錄與機率運算均 100% 於您的瀏覽器本機記憶體處理，甚至無網路狀態下也能順暢抽獎。

② 自動持久化儲存：系統會自動將您的最新獎項清單與中獎歷史保存在瀏覽器的 localStorage 中，即使重新整理或關閉網頁，下次開啟依然能完整還原所有設定。`,
  },
]);

export default function LuckyWheelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <LuckyWheelClient lang="zh-TW" />
    </>
  );
}
