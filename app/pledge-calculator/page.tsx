import type { Metadata } from 'next';
import PledgeCalculatorClient from './PledgeCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
  description:
    '專業免費的線上台股股票質押借款與維持率試算工具！支援多檔股票質押成數試算、130% 斷頭追繳臨界股價計算、大盤大跌壓力測試與補繳保證金評估。',
  keywords: '股票質押,維持率計算機,斷頭價,追繳股價,股票貸款,維持率130,股票借款,台股槓桿',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pledge-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pledge-calculator/',
      en: 'https://tools.cjkuo.net/pledge-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pledge-calculator/en/',
    },
  },
  openGraph: {
    title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
    description: '台股投資人的槓桿守護者。即時模擬大盤跌幅、維持率指針儀表板、追繳臨界價與補繳保證金試算。',
    url: 'https://tools.cjkuo.net/pledge-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
    description: '台股投資人的槓桿守護者。即時模擬大盤跌幅、維持率指針儀表板、追繳臨界價與補繳保證金試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '股票質押與維持率壓力測試器',
  url: 'https://tools.cjkuo.net/pledge-calculator/',
  description: '專業免費的台股股票質押借款與維持率試算工具，支援 130% 追繳臨界股價與大跌壓力測試。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是股票質押？成數與維持率公式如何計算？',
    a: `股票質押（擔保品貸款）是將手中持有的股票向券商或銀行抵押借出現金。

公式如下：
① 借款金額上限：
股票總市值 × 質押成數（台股常規最高成數為 60%）。

② 維持率 (%) 算式：
維持率 = (股票當前總市值 ÷ 總借款金額) × 100%。

例如借款 60 萬元買 100 萬股票，起始維持率即為 166.7%。`,
  },
  {
    q: '股票質押維持率低於 130% 會發生什麼事？什麼是「追繳通知」與「斷頭賣出」？',
    a: `追繳與斷頭機制如下：

① 追繳通知 (Margin Call)：
當台股大跌導致質押股票總市值下滑，使整戶維持率低於 130% 時，券商或銀行會發出追繳通知，要求借款人在 2 個營業日內補繳現金或追加股票擔保品至維持率恢復至 166% 以上。

② 斷頭處分：
若未在期限內補繳，券商將於第 3 個營業日開盤時，以市價強行賣出質押股票抵償借款，稱為「斷頭」。`,
  },
  {
    q: '如何精準計算股票質押的「斷頭追繳臨界股價」？',
    a: `追繳臨界股價即為維持率降至 130% 時的股票價格算式：

① 追繳臨界股價算式：
追繳臨界股價 = (總借款金額 × 1.3) ÷ 持有總股數。

② 算例說明：
例如您借款 60 萬元，持有 1,000 股，追繳臨界股價即為 (600,000 × 1.3) ÷ 1,000 = 780 元。本工具會自動試算並在地圖儀表板上醒目標示。`,
  },
  {
    q: '當維持率面臨追繳警告時，有哪些補救與提升維持率的方法？',
    a: `提升維持率有三大常見策略：

① 直接償還部分本金：
還款可立即降低分母（借款金額），迅速拉高維持率。

② 追加劃撥擔保股票：
將名下其他優質現股劃撥質押至同一個質押帳戶，增加分子（總市值）。

③ 補繳現金保證金：
依券商規定存入保證金專戶。`,
  },
  {
    q: '股票質押有哪些隱藏槓桿風險？為什麼說券商可能「雨天收傘」？',
    a: `股票質押本質上是利用既有股票開槓桿。在市場多頭時可放大資金效率，但在股市暴跌時，擔保品市值急遽縮水，維持率會加速逼近 130% 追繳門檻。

此外，特別需要注意券商「雨天收傘」風險：
① 拒絕展延或強制要求還款：
質押借款期限多為 6 個月，到期時若適逢市場大跌或券商內部質押總額度用盡，券商有權拒絕申請展延，要求您一次還清本金。

② 機動調升借款利率：
券商得依市場資金成本隨時調整質押利率。

因此建議切勿將槓桿開滿，隨時預留足夠的流動性備用金。`,
  },
  {
    q: '本工具的試算結果是否適用於所有券商與銀行？（免責警語與計算差異）',
    a: `本工具計算結果僅供投資參考，實際數字請務必以各券商或銀行官方公告為主。

各家券商與銀行在細節規範上可能有所差異，例如：
① 維持率計算基準價：
部分券商採用「前一日收盤價」，部分採用「盤中即時價」或「當日收盤價」。

② 個別股票成數上限：
部分中小型股或高波動股質押成數可能低於 60%（如 50% 或 40%）。

③ 費用與手續費：
撥款手續費、開戶規費與跨行轉帳費用未列入本工具利息估算。`,
  },
  {
    q: '股票質押發放的「股利與股息」歸誰所有？會被券商扣走嗎？',
    a: `股利與股息完全歸借款人所有！

在股票質押期間，股票所有權人仍為借款人本人。除權息時產生的現金股利會直接匯入您的交割帳戶，股票股利亦會劃撥入戶。`,
  },
  {
    q: '股票質押利息如何計算？借款期限多長？',
    a: `利息計算與借款期限說明：

① 利息算式：
股票質押利息按天計算（年利率 ÷ 365 × 借款天數），每半年結算一次利息。

② 借款與展延期限：
常規質押期限為 6 個月，到期前若維持率維持良好且付清利息，得申請展延 6 個月，最長可連續展延至 1.5 年至 2 年，無須強制賣股還款。`,
  },
]);

export default function PledgeCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PledgeCalculatorClient />
    </>
  );
}
