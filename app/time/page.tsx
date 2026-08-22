import type { Metadata } from 'next';
import TimeClient from './TimeClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '線上目標計時器 - 免費倒數計時與時間累計工具',
  description:
    '唯美精緻的線上目標計時器與倒數工具！支援自訂事件標題、時分秒與年月日時顯示格式、全螢幕播放與一鍵複製分享連結。適用於考試倒數、紀念日與時間管理。',
  keywords: '目標計時器,倒數計時器,線上倒數,時間累計,考試倒數,紀念日倒數,時間管理工具,全螢幕計時器',
  alternates: {
    canonical: 'https://tools.cjkuo.net/time/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/time/',
      en: 'https://tools.cjkuo.net/time/en/',
      'x-default': 'https://tools.cjkuo.net/time/en/',
    },
  },
  openGraph: {
    title: '線上目標計時器 - 免費倒數計時與時間累計工具',
    description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
    url: 'https://tools.cjkuo.net/time/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '線上目標計時器 - 免費倒數計時與時間累計工具',
    description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '線上目標計時器',
  url: 'https://tools.cjkuo.net/time/',
  description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '目標計時器的「倒數計時」與「時間累計」雙向運作邏輯為何？',
    a: '智能雙向時間流轉機制：\n\n① 未來目標（倒數計時 Remaining Time）：\n當設定的目標時間在當前時刻之後時，系統會自動啟動即時倒數，精準顯示距離目標尚餘幾天幾小時幾分幾秒。\n\n② 過去目標（時間累計 Time Elapsed）：\n當目標時間已過（如結婚紀念日、戒菸天數、專案上線日），計時器會無縫自動切換為時間累計模式，統計自該日起已累積流逝的時光。',
  },
  {
    q: '如果設定的目標日期在過去，計時器會如何呈現？',
    a: '自動切換為里程碑累計器：\n\n① 狀態標記：\n上方狀態列會由「REMAINING TIME」動態轉換為「TIME ELAPSED（時間累計中）」。\n\n② 適用情境：\n非常適合用來追蹤生活里程碑（例如：寶寶出生至今第幾天、已戒菸/健身幾個月、感情紀念日等）。',
  },
  {
    q: '如何自訂計時器顯示的時間單位（年、月、日、時、分、秒）？',
    a: '彈性的多單位自由組合：\n\n① 自由勾選單位：\n在設定面板中，您可以自由勾選欲呈現的時間維度（如僅勾選「天/時/分/秒」或「年/月/日」）。\n\n② 自動進位換算：\n系統會依據您勾選的單位組合，自動動態換算數值分配，確保時間總長度精確無誤。',
  },
  {
    q: '如何將自訂的倒數計時器透過 URL 分享給朋友、學生或工作團隊？',
    a: '零伺服器儲存的純參數分享技術：\n\n① 一鍵複製專屬連結：\n點擊「複製分享連結」，系統會將事件標題、目標時間與選用單位即時編碼至 URL 參數中。\n\n② 即開即用：\n接收者開啟連結後無需再次設定即可直接載入相同計時器畫面，甚至可加到瀏覽器書籤或設為儀表板首頁。',
  },
  {
    q: '在大型電視螢幕、會議投影機或活動現場使用「全螢幕模式」有何特點？',
    a: '專業沉浸式大螢幕體驗：\n\n① 沉浸視覺佈局：\n進入全螢幕後，系統會隱藏所有操作選單與捲軸，數字採用自適應 Fluid Typography 大字體動態縮放。\n\n② 亮暗主題切換：\n支援暗黑星空模式與清新亮色模式，滿足發表會、研討會、尾牙倒數或跨年活動之投影需求。',
  },
  {
    q: '跨時區使用者開啟同一個分享連結時，倒數時間是否會自動校準？',
    a: '精確的 UTC 時間絕對同步：\n\n① 絕對時間錨定：\n計時器分享連結記錄的是精確的時間戳記（ISO 8601 或 UTC 毫秒數）。\n\n② 當地時區轉換：\n無論對方身在台北、東京、倫敦或紐約，計時器皆會對齊同一個物理瞬間同步歸零，絕不因時區設定不同而產生時差倒數誤差。',
  },
  {
    q: '在瀏覽器背景執行或切換分頁時，計時器是否會保持精準？',
    a: '精確依賴系統時鐘校正：\n\n① 免除計時器漂移：\n本工具並非單純依賴 `setInterval` 累加計數，而是每次更新皆直接比對瀏覽器核心與目標時間的絕對時間差。\n\n② 喚醒即時校正：\n即使手機螢幕休眠或分頁切換至背景，在重新喚醒畫面時會瞬間精準同步至當下正確時間。',
  },
]);

export default function TimePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <TimeClient />
    </>
  );
}
