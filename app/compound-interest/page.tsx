import type { Metadata } from 'next';
import CompoundInterestClient from './CompoundInterestClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '複利試算器 - 免費線上定期定額、存股ETF與投資複利計算機',
  description:
    '專業免費的線上複利試算器！支援單筆投資與定期定額投入、年化報酬率設定，精算資產翻倍時間與投資資產成長曲線。',
  keywords: '複利試算器,定期定額計算機,存股複利試算,ETF定期定額,0050複利計算,投資複利,年化報酬率,資產翻倍,72法則,退休金試算,月複利計算,理財計算機',
  alternates: {
    canonical: 'https://tools.cjkuo.net/compound-interest/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/compound-interest/',
      en: 'https://tools.cjkuo.net/compound-interest/en/',
      'x-default': 'https://tools.cjkuo.net/compound-interest/en/',
    },
  },
  openGraph: {
    title: '複利試算器 - 免費線上定期定額、存股ETF與投資複利計算機',
    description: '精算定期定額與單筆投資複利效應，提供年度資產成長圖表與本金利息佔比分析。',
    url: 'https://tools.cjkuo.net/compound-interest/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '複利試算器 - 免費線上定期定額、存股ETF與投資複利計算機',
    description: '精算定期定額與單筆投資複利效應，提供年度資產成長圖表與本金利息佔比分析。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '複利試算器',
  url: 'https://tools.cjkuo.net/compound-interest/',
  description: '專業免費的投資複利試算器，支援單筆與定期定額計算資產成長。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是複利效應 (Compound Interest)？與單利有何不同？',
    a: `複利（Compound Interest）是指將每期獲得的利息或投資收益，滾入下一期的本金中繼續計算利息，即俗稱的「利滾利」。

與「單利（Simple Interest，利息僅依據最初本金計算且不滾入）」相比，複利在投資初期與單利差異不大，但隨著時間推移與期數增加，資產增長曲線會呈現指數級（Exponential）的暴發性飛躍。

愛因斯坦曾稱複利為「世界第八大奇蹟」，時間越長，複利所產生的利息佔比將遠遠超越您當初投入的原始本金。`,
  },
  {
    q: '什麼是 72 法則 (Rule of 72)？如何快速估算資產翻倍時間？',
    a: `72 法則是一項常用於心算資產翻倍所需年數的經驗公式：

計算公式為 資產翻倍年數 ≈ 72 / 年化報酬率(%)。

例如：
① 年化報酬率為 6% 時，資產翻倍約需 72 / 6 = 12 年。
② 年化報酬率為 12% 時，資產翻倍約需 72 / 12 = 6 年。

此法則能讓您在不使用計算機的情況下，快速評估不同報酬率下的資產翻倍效率。

延伸閱讀：[計算本金翻倍的72法!快速3秒內得解](https://www.cjkuo.net/72_double_answer/)`,
  },
  {
    q: '定期定額 (DCA) 與單筆投入 (Lump-Sum) 何者複利效果更好？',
    a: `兩者各有優劣，取決於市場趨勢與資金狀況：

① 單筆投入：若市場長期呈上升趨勢，越早將大筆資金一次性投入，享受複利的總時間最長，歷史回測的長期總報酬通常高於定期定額。

② 定期定額 (Dollar-Cost Averaging, DCA)：適合每月有穩定薪資收入的上班族。定期定額可以在市場下跌時自動買入更多單位數，平攤持股成本與波動風險，降低擇時入場心理壓力。

本試算器支援同時組合「初始本金」與「定期定額（月/年）」進行混合計算，精準呈現雙引擎驅動下的資產累積軌跡。`,
  },
  {
    q: '複利計息頻率（按月複利 vs 按年複利）對最終投資收益影響有多大？',
    a: `計息與滾利頻率越高，複利效應越顯著！

假設年利率為 8%、本金 100 萬元、投資 20 年：
① 按年複利（每年滾利 1 次）：期末本利和約為 466 萬元。
② 按月複利（每月滾利 12 次）：期末本利和約為 492 萬元（比按年複利多出約 26 萬元！）。

這是因為每月產生的微小利息會立刻投入下一個月繼續計息。本試算器提供「按月複利」、「按季複利」、「按年複利」與「單利」多種頻率供自由切換比對。`,
  },
  {
    q: '考慮通貨膨脹 (Inflation) 後，實質報酬率與複利該如何評估？',
    a: `名目報酬率（Nominal Return）並未扣除物價上漲幅度，若要計算未來的「實際購買力」，應參考費雪效果（Fisher Effect）評估實質報酬率（Real Rate of Return）：

計算公式為 實質報酬率 ≈ 名目年化報酬率 - 年通貨膨脹率。

例如預期投資名目年報酬率為 7%，若平均通膨率為 2.5%，則實質年化報酬率約為 4.5%。在試算長期退休金規劃時，建議將報酬率欄位適度扣除預期通膨率，以估算最具真實購買力的資產價值。`,
  },
  {
    q: '在線上使用複利試算器時，輸入的財務資料會被儲存或紀錄嗎？',
    a: `100% 不會！本試算器採用純前端客戶端 (Client-Side) 即時運算技術。

您輸入的所有初始本金、月扣金額、報酬率與試算結果，完全僅在您的瀏覽器記憶體中進行運算與 Canvas 圖表繪製。

全過程完全不透過網路傳送至伺服器 Log 或資料庫，亦無任何個人財務資料留存，您可以安心進行私密財務試算。`,
  },
  {
    q: '投資與理財試算免責聲明',
    a: `【理財試算免責聲明】

① 本工具提供之試算結果、年化報酬率與資產成長曲線僅供財務規劃、學習與模擬參考，不構成任何形式的投資建議、招攬或保證。

② 實際投資市場存在波動風險，歷史報酬率不代表未來績效，且實際收益受交易手續費、稅負、匯率波動與市場極端行情影響。

③ 進行任何實質投資決定前，請務必評估個人風險承受能力，並諮詢合格的專業財務顧問或金融機構。`,
  },
]);

export default function CompoundInterestPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <CompoundInterestClient />
    </>
  );
}

