import type { Metadata } from 'next';
import FuturesCalculatorClient from './FuturesCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
  description:
    '專業免費的線上台指期 (大台/小台/微台) 槓桿與維持率計算器！支援多空部位切換、實質本金槓桿試算、逆風壓力點數模擬與追繳斷頭臨界點估算。',
  keywords: '期貨槓桿計算機,台指期計算機,大台保證金,小台保證金,微台保證金,期貨斷頭點數,期貨維持率,期貨保證金',
  alternates: {
    canonical: 'https://tools.cjkuo.net/futures-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/futures-calculator/',
      en: 'https://tools.cjkuo.net/futures-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/futures-calculator/en/',
    },
  },
  openGraph: {
    title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
    description: '期貨交易者的風控警示器。即時模擬大盤逆風、實質資金槓桿、追繳與斷頭臨界點試算。',
    url: 'https://tools.cjkuo.net/futures-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
    description: '期貨交易者的風控警示器。即時模擬大盤逆風、實質資金槓桿、追繳與斷頭臨界點試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '台股期貨槓桿與逆風點數估算器',
  url: 'https://tools.cjkuo.net/futures-calculator/',
  description: '專業免費的台指期 (大台/小台/微台) 槓桿與維持率計算器，支援逆風壓力點數與斷頭臨界估算。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是期貨交易的「原始保證金」與「維持保證金」？',
    a: `期貨採用保證金交易制度 (Margin Trading)：

① 原始保證金 (Initial Margin)：
建立期貨部位（開倉）時，期貨帳戶內必須具備的最少資金門檻。

② 維持保證金 (Maintenance Margin)：
持有部位期間，帳戶權益數（權益總值）必須維持的最低警戒金額。若權益數低於維持保證金，將觸發盤後追繳通知。`,
  },
  {
    q: '大台 (TX)、小台 (MTX) 與微台 (TMF) 每點契約價值與保證金有何差別？',
    a: `台指期貨三大合約對照如下：

① 大台 (TX)：
每點 200 元。原始保證金約 241,000 元。

② 小台 (MTX)：
每點 50 元 (大台的 1/4)。原始保證金約 60,250 元。

③ 微台 (TMF)：
每點 10 元 (小台的 1/5)。原始保證金約 12,050 元。

投資人可依自身資金規模與風險承受度，靈活選擇適合的槓桿合約。`,
  },
  {
    q: '什麼是期貨「追繳 (Margin Call)」與「砍倉 / 斷頭 (Liquidation)」？在劇烈行情下砍倉能保證止損嗎？',
    a: `期貨風控與極端行情穿價風險如下：

① 期貨追繳 (Margin Call)：
盤後結算時，若帳戶權益數低於「維持保證金」，期貨商會發出追繳通知，要求在下個交易日中午 12:00 前補足至「原始保證金」。

② 盤中強制砍倉 (斷頭)：
盤中交易時，若行情劇烈逆風導致帳戶風險指標降至 25% 以下，期貨商系統將不經通知自動以市價委託單強行平倉（砍倉）所有部位。

③ 【極端行情滑價與超額虧損警示 (Over-Loss / 穿價風險)】：
請特別注意！即使觸發砍倉門檻，並不代表就能在該價位「完美止損」！

在市場發生暴跌、跳空、滑價 (Slippage) 或漲跌停鎖死等極端劇烈行情時，期貨商的市價砍倉單可能遭遇無人承接或成交在極度不利的價位，導致實際虧損遠超過帳戶內的全部本金（產生超額虧損 Over-Loss，需追繳負債現金）！

交易者切勿將強制砍倉當成安全防線，務必嚴格控制槓桿與風控。`,
  },
  {
    q: '如何計算期貨部位的「實質槓桿倍數」？高槓桿有何風險？',
    a: `計算方式與槓桿風險說明：

① 實質槓桿倍數算式：
實質槓桿倍數 = 期貨部位總名目價值 ÷ 帳戶實際投入總資金。

② 算例說明：
以台指期在 22,000 點為例，一口大台總名目價值為 22,000 × 200 = 4,400,000 元。若您帳戶僅存入最低原始保證金 241,000 元，實質槓桿即高達 18.25 倍！大盤僅需反向波動 5.4% 即可能導致帳戶本金全數歸零。

③ 建議：
建議帳戶保留 2 至 3 倍以上的原始保證金，以有效降低槓桿與爆倉風險。`,
  },
  {
    q: '什麼是期貨的「逆風承受點數 (Adverse Movement Range)」？',
    a: `逆風承受點數代表在部位觸發追繳或斷頭前，大盤指數最多允許反向波動的點數。

① 多單算式：
多單逆風點數 = (帳戶當前權益數 - 維持保證金) ÷ 每點價值。

② 空單算式：
空單逆風點數 = (帳戶當前權益數 - 維持保證金) ÷ 每點價值。

本工具能精準算出多單與空單在不同資金配置下的耐受點數，協助交易者掌握停損與補繳警戒線。`,
  },
  {
    q: '期貨留倉過夜有哪些風險？如何預防跳空開高 / 開低？',
    a: `留倉過夜面臨國際股市（如美股、台指夜盤）劇烈波動帶來的「隔日跳空風險」。

預防措施包含：
① 避開重大事件：避開美聯儲利率決議、重大財報日過夜。
② 降低槓桿：適度降低持倉口數與槓桿倍數。
③ 設定停損單：掛好停損單 (Stop-Loss Order) 或利用停損限價單保護部位。
④ 微台避險：利用微台指 (TMF) 進行精細化的部位對沖。`,
  },
]);

export default function FuturesCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <FuturesCalculatorClient />
    </>
  );
}
