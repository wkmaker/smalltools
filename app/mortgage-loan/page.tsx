import type { Metadata } from 'next';
import MortgageLoanClient from './MortgageLoanClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
  description:
    '專業免費的線上房屋貸款計算機！支援房屋總價與自備款成數雙向連動、寬限期、多段式階梯利率、本息/本金均攤、開辦手續費攤提與 APR 實質年利率試算。',
  keywords: '房貸計算機,房屋貸款試算,房貸月付額,寬限期,階梯利率,新青安房貸,本息平均攤還,本金平均攤還,房貸首期',
  alternates: {
    canonical: 'https://tools.cjkuo.net/mortgage-loan/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/mortgage-loan/',
      en: 'https://tools.cjkuo.net/mortgage-loan/en/',
      'x-default': 'https://tools.cjkuo.net/mortgage-loan/en/',
    },
  },
  openGraph: {
    title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
    description: '專業免費的線上房屋貸款計算機，支援寬限期、多段式利率與實質年利率試算。',
    url: 'https://tools.cjkuo.net/mortgage-loan/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
    description: '專業免費的線上房屋貸款計算機，支援寬限期、多段式利率與實質年利率試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '房貸計算機',
  url: 'https://tools.cjkuo.net/mortgage-loan/',
  description: '專業免費的線上房屋貸款計算機，支援寬限期、多段階梯利率與 APR 實質年利率評估。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '「本息平均攤還」與「本金平均攤還」有何差異？哪一種還款方式比較划算？',
    a: '房貸常見的兩大還款方式計算原理與適用情境如下：\n\n① 本息平均攤還（最普及）：\n將整個貸款年限內的本金與總利息加總，平均分攤至每個月。每月還款金額固定不變，前期利息佔比較高、後期本金佔比較高。優點是每月支出固定，便於上班族與家庭編列穩定預算。\n\n② 本金平均攤還（省息首選）：\n將貸款本金平均分攤至每一期，利息則依剩餘本金按月計算。前期每月還款金額最高，隨後逐月遞減。總利息支出通常比本息均攤少約 15%~25%，適合前期還款能力充足、希望極大化節省利息的借款人。',
  },
  {
    q: '什麼是「房貸寬限期」？使用寬限期有哪些潛在風險？',
    a: '房貸寬限期是指在約定期限內（通常為 1~5 年），借款人「只繳利息、不還本金」的還款機制：\n\n① 適用優勢：\n寬限期間每月支出極低，適合購屋初期需要充裕現金流進行裝潢、添購家具或保留週轉金的買方。\n\n② 攤提壓縮風險：\n寬限期結束後，剩餘本金必須在「縮短的剩餘年限」內攤還完畢。例如 30 年房貸使用 5 年寬限期，第 6 年起必須在 25 年內攤還全部本金，每月還款金額可能瞬間暴增 40% ~ 70%，若未提前規劃收入現金流，容易引發繳款斷鏈危機。',
  },
  {
    q: '什麼是「多段式階梯利率」與「新青安房貸」組合貸款方案？',
    a: '階梯利率與政策組合貸款是台灣房貸市場常見的形式：\n\n① 多段式階梯利率：\n貸款期間分成 2 段或 3 段不同利率，常見為前期 1~2 年提供低利優惠吸引申辦，隨後各段依基準利率加碼逐步調升。\n\n② 組合貸款（如新青安 1,000 萬 + 一般房貸）：\n政府新青安貸款優惠額度上限為 1,000 萬元。若購屋總貸款額達 1,500 萬元，超出之 500 萬元需搭配承貸銀行的自營房貸專案。本計算機支援雙筆貸款獨立設定年限、寬限期與利率，精確計算合併月付負擔。',
  },
  {
    q: '什麼是「實質總費用年率 (APR)」？為什麼房貸不能只看表面利率？',
    a: '總費用年率（APR, Annual Percentage Rate）是將借款期間內的所有借貸成本納入折現計算出的真實年化負擔：\n\n① 包含相關規費與開辦費：\n包含銀行開辦手續費、徵信查詢費、帳管費及房屋鑑價設定費等前期支出。透過將前期固定費用攤提至各期還款現金流中，計算出實質年化利率。\n\n② 方案客觀比較：\n比較不同銀行的房貸專案時，以 APR 為統一標準，才能精確判斷「表面低利率但高額開辦費」與「表面利率略高但免手續費」哪一個更具成本效益。',
  },
  {
    q: '房貸成數與自備款一般如何估算？影響銀行核貸成數的關鍵因素有哪些？',
    a: '房貸成數與自備款通常依據銀行鑑價而非買賣合約價計算：\n\n① 一般成數標準：\n目前市場常態首購成數約為 7 ~ 8 成，購屋者需準備至少 2 ~ 3 成自備款，並預留約 30~50 萬元的契稅、印花稅、代書費、規費與裝修保證金。\n\n② 關鍵審核因素：\n包含房屋地段與屋齡、借款人聯徵信用分數、收支負債比（DTI 建議維持在 60% 以下）、在職公司規模與穩定財力證明，以及央行最新信用管制規定（如名下第二戶以上之成數限制）。',
  },
  {
    q: '房貸可以提前大額還款或提前結清嗎？會有違約金嗎？',
    a: '提前清償房貸之規定依各家銀行房貸合約而定：\n\n① 限制清償期（綁約期）：\n銀行常態綁約期約為 2 ~ 3 年。若在綁約期內提前大額還本或全額結清轉貸，銀行通常會依提前償還金額收取 0.5% ~ 1.5% 的提前清償違約金。\n\n② 滿期塗銷流程：\n綁約期滿後可隨時提前清償且免違約金。全額清償後，請向銀行申請「抵押權塗銷同意書」及「他項權利證明書」，並至地政事務所辦理抵押權塗銷登記。',
  },
  {
    q: '本房貸計算機試算結果是否具備法律效力？（免責條款聲明）',
    a: '本線上房屋貸款計算機所提供之各期月付額、本息攤還明細、利息總額與 APR 數值，均為依據標準金融複利數學公式所產出之理論估算結果，僅供消費者購屋財務規劃與比較參考，不構成任何融資承諾或法律要約。\n\n實際核貸金額、可貸成數、適用利率、寬限期年限、開辦手續費與最終每月繳款金額，均以各承貸銀行依申請人財務條件、信用評等與房屋鑑價審核之正式貸款合約為準。',
  },
]);

export default function MortgageLoanPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <MortgageLoanClient />
    </>
  );
}
