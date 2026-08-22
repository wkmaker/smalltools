import type { Metadata } from 'next';
import EpochClient from './EpochClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
  description:
    '專業免費的線上 Unix Epoch 時間戳記轉換工具！支援秒/毫秒自動判定、即時雙向轉換、台北時間/UTC/美西時間(PST)等多時區比較與歷史紀錄。',
  keywords: 'Epoch轉換器,Unix時間戳記,Timestamp轉換,時間戳記,Unix Epoch,時間轉換,秒轉日期,毫秒轉日期',
  alternates: {
    canonical: 'https://tools.cjkuo.net/epoch/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/epoch/',
      en: 'https://tools.cjkuo.net/epoch/en/',
      'x-default': 'https://tools.cjkuo.net/epoch/en/',
    },
  },
  openGraph: {
    title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
    description: '專業免費的 Unix 時間戳記轉換工具，支援雙向即時轉換、多時區比較與歷史紀錄。',
    url: 'https://tools.cjkuo.net/epoch/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
    description: '專業免費的 Unix 時間戳記轉換工具，支援雙向即時轉換、多時區比較與歷史紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Epoch 萬年時間戳記轉換器',
  url: 'https://tools.cjkuo.net/epoch/',
  description: '專業免費的線上 Unix Epoch 時間戳記轉換工具，支援秒與毫秒自動判定及多時區比較。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 Unix Epoch 時間戳記？為什麼伺服器日誌 (Log) 與系統都廣泛採用它？',
    a: 'Unix 時間戳記（Unix Timestamp / POSIX Time）是電腦系統追蹤時間的統一數值標準：\n\n① 起點定義：\n以「世界協調時間 (UTC) 1970 年 1 月 1 日 00:00:00」為原點（稱為 Unix Epoch），計算自該基準點以來所累積流逝的總秒數（不計閏秒）。\n\n② 系統與 Log 紀錄廣泛採用之原因：\n許多伺服器與資料庫 LOG 紀錄時間會優先採取 Unix Epoch 戳記，因為它完全不受伺服器所在時區、夏令時間影響。純整數既節省儲存空間、利於高速索引排序，更能方便隨時無歧義地轉換成全球各地區的當地時間，大幅簡化跨國日誌關聯與問題排查。',
  },
  {
    q: '時間戳記「秒 (10 位數)」與「毫秒 (13 位數)」有何差別？本工具如何自動識別？',
    a: '精確度級別與數值長度不同：\n\n① 10 位數時間戳記（秒級，例如 `1700000000`）：\n多數後端語言（如 Python 的 `time.time()`、PHP 的 `time()`、Linux 系統指令 `date +%s`）預設輸出 10 位整數秒。\n\n② 13 位數時間戳記（毫秒級，例如 `1700000000000`）：\nJavaScript（`Date.now()`）與 Java（`System.currentTimeMillis()`）預設精準至毫秒。\n\n③ 智能自動判定：\n本工具根據輸入數值位數與合理年份區間自動判斷單位，無須手動切換。',
  },
  {
    q: '什麼是「2038 年問題 (Year 2038 Problem / Y2K38)」？會對系統造成什麼影響？',
    a: '經典的 32 位元整數溢位危機：\n\n① 溢位臨界點：\n在傳統 32 位元有符號整數（Signed 32-bit Integer）架構中，最大可表示秒數為 `2,147,483,647`，該時刻將在 **UTC 2038 年 1 月 19 日 03:14:07** 到達。\n\n② 溢位後果：\n若未升級，下 1 秒數值將翻轉為負數 `-2,147,483,648`（即回到 1901 年 12 月 13 日），導致舊型嵌入式系統與資料庫計算混亂。現代 64 位元系統已將上限推進至 2920 億年後。',
  },
  {
    q: '為什麼不同程式語言獲取當前時間戳記的指令與語法不同？',
    a: '常見程式語言時間戳記語法速查：\n\n① JavaScript / TypeScript：`Date.now()`（輸出 13 位毫秒）或 `Math.floor(Date.now() / 1000)`（輸出 10 位秒）。\n\n② Python：`import time; int(time.time())`（輸出 10 位秒）。\n\n③ PHP：`time()`（輸出 10 位秒）。\n\n④ Go：`time.Now().Unix()`（輸出 10 位秒）。\n\n⑤ Java：`System.currentTimeMillis()`（輸出 13 位毫秒）。',
  },
  {
    q: '時區 (Timezone) 與日光節約時間 (DST) 如何影響時間戳記的解讀？',
    a: '時間戳記本身與時區無關，但換算為人類日期時會產生時差：\n\n① UTC 絕對值：\n同一個 Unix Timestamp 在全球任何角落都是同一個絕對時間點。\n\n② 當地日期呈現：\n當轉換為具體年月日時間時，需加上當地時區偏移（例如台北為 UTC+8、美西為 UTC-8 / 夏令時間 UTC-7）。本工具提供即時多時區對照。',
  },
  {
    q: '什麼是 ISO 8601 與 RFC 3339 日期標準格式？',
    a: '全球統一的文字日期格式規範：\n\n① 標準結構：\n格式如 `2026-08-22T08:30:00Z`（UTC 時間）或 `2026-08-22T16:30:00+08:00`（帶時區偏移）。\n\n② 優點：\n具備字串自然排序（Lexicographical Order）與零歧義特性，是 JSON Payload 與 OpenAPI 規範的推薦標準。',
  },
  {
    q: '本 Epoch 時間戳記轉換器支援哪些實用操作與進階功能？',
    a: '全方位時間工具箱：\n\n① 即時動態時鐘：\n提供秒級與毫秒級即時流動時間戳記，支援隨時暫停與一鍵複製。\n\n② 雙向雙向試算：\n支援時間戳記轉日期時間，以及自訂日期時間（含毫秒）反推時間戳記，並自動計算星期幾、當年第幾天與閏年判定。',
  },
]);

export default function EpochPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <EpochClient />
    </>
  );
}
