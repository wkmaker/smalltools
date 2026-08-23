import type { Metadata } from 'next';
import CalendarSplitClient from './CalendarSplitClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '日曆切割助手 - Google 行事曆 .ics 檔案自動分割與匯入工具',
  description:
    '免費線上 iCalendar (.ics) 日曆切割工具！解決 Google 行事曆 1MB 匯入限制，自動將大型日曆檔案智慧切割為小於 1MB 的多個合法檔案，100% 瀏覽器本地運算，支援 ZIP 一鍵打包下載。',
  keywords: '日曆切割,行事曆分割,ics分割,Google行事曆匯入限制,iCalendar切割,Google日曆匯出過大,行事曆備份,ics splitter',
  alternates: {
    canonical: 'https://tools.cjkuo.net/calendar-split/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/calendar-split/',
      en: 'https://tools.cjkuo.net/calendar-split/en/',
      'x-default': 'https://tools.cjkuo.net/calendar-split/en/',
    },
  },
  openGraph: {
    title: '日曆切割助手 - Google 行事曆 .ics 檔案自動分割與匯入工具',
    description: '免費線上 iCalendar (.ics) 日曆切割工具，解決 Google 行事曆 1MB 匯入限制，支援 ZIP 一鍵打包下載。',
    url: 'https://tools.cjkuo.net/calendar-split/',
    images: [
      {
        url: '/img/og-calendar-split.webp',
        width: 1200,
        height: 630,
        alt: '日曆切割助手 - Google 行事曆 .ics 檔案自動分割',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '日曆切割助手 - Google 行事曆 .ics 檔案自動分割與匯入工具',
    description: '免費線上 iCalendar (.ics) 日曆切割工具，解決 Google 行事曆 1MB 匯入限制，支援 ZIP 一鍵打包下載。',
    images: ['/img/og-calendar-split.webp'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '日曆切割助手',
  url: 'https://tools.cjkuo.net/calendar-split/',
  description: '專業免費的線上 iCalendar (.ics) 日曆切割工具，突破 Google 日曆 1MB 匯入大小上限限制。',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '為什麼 Google 行事曆匯出後無法直接匯入？匯入時跳出錯誤？',
    a: 'Google 日曆網頁版的「匯入」功能有嚴格的單一檔案大小上限（通常限制在 1MB 至 1.8MB 以內，過大時會直接跳出「檔案太大」或伺服器逾時錯誤）。\n\n然而當您從 Google 日曆「匯出」包含數年歷史紀錄的行事曆時，產生的 `.ics` 檔案往往高達 5MB ~ 20MB。透過本工具將檔案切割為多個小於 1MB 的獨立合法 `.ics` 檔，即可分批順暢匯入。',
  },
  {
    q: '切割後的 .ics 檔案是否會遺失時區資訊或重複活動 (Recurring Events)？',
    a: '完全不會！\n\n① 完整保留全域定義：\n本工具在切割時，會將原始檔案開頭的 `VCALENDAR` 全域屬性與所有的 `VTIMEZONE`（時區宣告）完整複製並嵌入到每一個分割檔案的檔頭中。\n\n② 保持活動完整性：\n每一個 `VEVENT`（包含重複規則 `RRULE`、鬧鐘提醒 `VALARM`、詳細說明與地點）皆以完整區塊保留，絕不破壞格式。',
  },
  {
    q: '上傳包含個人行程、公司會議等隱私資料是否安全？',
    a: '100% 絕對安全！\n\n① 零伺服器傳輸：\n本工具採用 100% 純前端（Client-Side）技術，透過瀏覽器內部的 JavaScript 引擎在您的本機記憶體中直接完成文字解析、分割與 ZIP 打包。\n\n② 支援離線運作：\n即便在開啟飛航模式或斷網狀態下，本工具依然能完全正常運作，任何行程與個人隱私資料絕不會離開您的電腦。',
  },
  {
    q: '我應該選擇 900 KB 還是 950 KB 作為切割上限？',
    a: '建議選擇預設的「950 KB」或更安全的「900 KB」：\n\n① 安全邊際考量：\nGoogle 日曆的 1MB 限制是以位元組計算，選擇 900KB ~ 950KB 能預留檔頭與封包餘裕，確保 100% 順利通過 Google 的驗證。\n\n② 筆數平衡：\n此大小通常可在每個檔案容納 500 至 1,200 筆活動，既減少總檔案個數，又能確保極速上傳。',
  },
  {
    q: '除了 Google 日曆外，本工具是否支援 Apple 行事曆或 Outlook？',
    a: '完美支援！\n\n本工具嚴格遵循國際 iCalendar RFC 5545 標準規格生成標準 `.ics` 檔案，切割後的檔案亦相容於 Apple Calendar（macOS / iOS）、Microsoft Outlook、Mozilla Thunderbird 等所有支援 iCalendar 格式的應用程式。',
  },
]);

export default function CalendarSplitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <CalendarSplitClient lang="zh-TW" />
    </>
  );
}
