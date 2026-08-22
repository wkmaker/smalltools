import type { Metadata } from 'next';
import LiarsDiceClient from './LiarsDiceClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
  description:
    '專為酒吧派對與好友聚會打造的吹牛骰子搖骰器！具備防作弊計時器，精確顯示距離最後一次搖骰過多久的分跟秒，並支援歷史前 5 次搖骰紀錄與骰杯遮擋功能。',
  keywords: '吹牛骰子,搖骰器,吹牛,骰子,防作弊,計時器,酒吧遊戲,派對遊戲,Liar\'s Dice,骰杯遮擋',
  alternates: {
    canonical: 'https://tools.cjkuo.net/liars-dice/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/liars-dice/',
      en: 'https://tools.cjkuo.net/liars-dice/en/',
      'x-default': 'https://tools.cjkuo.net/liars-dice/en/',
    },
  },
  openGraph: {
    title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
    description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
    url: 'https://tools.cjkuo.net/liars-dice/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
    description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '吹牛骰子搖骰器',
  url: 'https://tools.cjkuo.net/liars-dice/',
  description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是「防作弊計時器 (Anti-Cheat Timer)」？它如何杜絕二次重搖？',
    a: '專為派對聚會打造的公正防作弊機制：\n\n① 即時累計流逝秒數：\n每次按下搖骰後，頂部計時器會瞬間歸零並精準跳秒（如「剛剛搖骰 (00:05)」）。\n\n② 杜絕重搖爭議：\n在吹牛遊戲中，若有玩家趁他人不注意偷偷重搖，計時器會立刻重置為 0 秒，其他玩家一目了然即可抓包作弊，維護聚會公平性。',
  },
  {
    q: '吹牛骰子（Liar\'s Dice）的基本遊戲規則與叫牌喊點邏輯是什麼？',
    a: '派對經典吹牛玩法規則：\n\n① 遊戲開局：\n每人各有 5 顆骰子，搖骰後各自看自己的點數並蓋上骰杯。\n\n② 順時針叫牌：\n由莊家開始叫點（例如「3 個 4」），下一位玩家必須「加顆數（如 4 個 4）」或「喊更大點數（如 3 個 5）」；若不信上一家喊的數量，可喊「開！」。\n\n③ 結算輸贏：\n全場所有人開蓋計算總顆數，若實際顆數 ≥ 叫牌顆數則開牌者輸，否則叫牌者輸。',
  },
  {
    q: '什麼是「1 點為萬能骰 (Wild Card)」？在何種情況下 1 點會失效（變回純 1 點）？',
    a: '萬能骰判定規則速查：\n\n① 萬能替換規則：\n在一般局中，1 點可代表任何點數（例如自己有兩個 1 點和一個 5 點，計算 5 點時相當於有三個 5 點）。\n\n② 叫 1 點後失效（齋）：\n只要全場有任何一位玩家叫過 1 點（例如「3 個 1」），則本局 1 點立即失去萬能效果，僅能代表 1 點本身。',
  },
  {
    q: '「骰杯遮蓋 (Cover Cup)」與「按住窺視 (Peek)」功能在線下聚會時該如何使用？',
    a: '保護個人底牌防偷窺設計：\n\n① 自動遮蓋：\n搖骰後系統可自動蓋上磨砂金屬骰杯，防止身旁朋友斜眼偷看。\n\n② 按住窺視 (Peek)：\n在手機螢幕上「按住窺視按鈕」時骰杯會半透明顯示，鬆開手指即刻重新蓋上，隱密性極佳。',
  },
  {
    q: '「歷史前 5 次搖骰紀錄」在遊戲爭議或抓作弊時有何作用？',
    a: '可追溯的遊戲存證看板：\n\n① 紀錄時間與點數：\n系統會完整保留最近 5 次的搖骰時間與 5 顆骰子點數排列。\n\n② 爭議裁決：\n當發生「剛才開蓋是否為上一局點數」或「是否不小心手滑搖到」時，可隨時點開歷史紀錄調閱核對。',
  },
  {
    q: '本工具是否具備真隨機數產生器 (RNG)？點數分佈是否絕對公平？',
    a: '採用現代瀏覽器密碼學隨機數標準：\n\n① Crypto API 高度隨機：\n底層採用 Web Cryptography API 或高精度 Math.random() 隨機數引擎，確保 1 到 6 點出現之機率嚴格均等（各約 16.67%）。\n\n② 零演算法偏誤：\n絕無固定套路或預先排定的點數組合。',
  },
  {
    q: '在酒吧派對、KTV 或平板大螢幕上如何開啟全螢幕模式？',
    a: '點擊介面右上角的「全螢幕展示」按鈕，系統將自動隱藏頂部導航與雜項元素，切換為超大字體計時器與動態 3D 搖骰舞台，極適合放置於桌面中央供全場檢視。',
  },
  {
    q: '本吹牛骰子工具是否支援多人線上連線對戰？',
    a: '本工具主要為「線下面對面派對輔助搖骰器」，專為現場聚會設計（省去攜帶實體骰盅與骰子的麻煩，並透過防作弊計時器與遮杯功能杜絕爭議）。\n\n若您與異地好友想玩「多人即時線上連線吹牛遊戲」，歡迎使用我們另外提供的專屬線上派對遊戲服務【Drink Games】（https://dgames.cjkuo.net/），支援跨裝置開房連線、線上叫牌與輸贏自動結算！',
  },
]);

export default function LiarsDicePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <LiarsDiceClient lang="zh-TW" />
    </>
  );
}
