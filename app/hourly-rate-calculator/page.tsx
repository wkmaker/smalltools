import type { Metadata } from 'next';
import HourlyRateCalculatorClient from './HourlyRateCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
  description:
    '免費線上真實時薪計算器！扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益，並對照台灣最新薪資 PR 統計與合規判定。',
  keywords: '真實時薪計算器,時薪計算,最低時薪,薪資PR,打工人,通勤時間,隱形加班,薪資排行,計算機',
  alternates: {
    canonical: 'https://tools.cjkuo.net/hourly-rate-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/hourly-rate-calculator/',
      en: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    },
  },
  openGraph: {
    type: 'website',
    title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
    description: '扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益，並對照全台薪資 PR 排行。',
    url: 'https://tools.cjkuo.net/hourly-rate-calculator/',
    images: [{ url: '/support.svg', width: 1200, height: 630, alt: '真實時薪計算器 - 全台打工人 PR 排行榜' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
    description: '扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '真實時薪計算器',
  url: 'https://tools.cjkuo.net/hourly-rate-calculator/',
  description: '專業免費的線上真實時薪與 PR 排行計算工具。',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是「真實時薪」？為什麼不能直接用「月薪 ÷ 法定工時」來計算？',
    a: '許多人習慣直接以「月薪 ÷ 176 小時」推算時薪，但這種計算法忽略了勞動生活中的各項隱形成本：\n\n① 呈現薪資扣除隱形成本後的真實樣態：\n雖然政府與官方公布的薪資調查數據並不包含通勤、隱形待命或自費工作支出等樣態，但透過本工具的客觀對比，能讓您深刻理解自己目前的「實際收入產出」與生活時間成本。\n\n② 隱形時間與必要支出：\n每天往返公司的通勤時間、無酬待命/假日回訊，以及交通油錢、外食溢價、工作治裝等工作衍生開銷，都會實質侵蝕每小時的生命價值。\n\n③ 真實淨效益公式：\n真實時薪 =（實領薪資 - 工作衍生支出）÷（法定契約工時 + 隱形加班 + 通勤時間），幫助您在轉職、加薪談判與生活平衡上做出最佳決策。',
  },
  {
    q: '「通勤時間與隱形加班」對真實時薪的稀釋效應有多嚴重？',
    a: '隱形工時對時薪的侵蝕遠超直覺想像：\n\n① 實例分析：\n若月薪為 50,000 元（以每月 22 個工作天、每日 8 小時 = 176 小時計算），表面時薪約為 284 元。\n\n② 加上通勤與待命：\n若每日往返通勤需 2 小時（每月 44 小時），且常態性無酬待命 1 小時（每月 22 小時），每月總投入工時暴增至 242 小時。即便完全不扣除交通油錢，真實時薪立即驟降至 206 元，時薪直接蒸發近 27.5%！',
  },
  {
    q: '台灣全體受僱員工的「薪資 PR 排行榜」數據來源與統計依據為何？',
    a: '本工具的台灣薪資百分位數 (PR, Percentile Rank) 排行係依據中華民國官方大數據精密建構：\n\n① 官方權威數據：\n資料同步自行政院主計總處（DGBAS）歷年發布之「薪資中位數及分佈統計」與「受僱員工薪資調查」公告數據。\n\n② 分段線性插值法 (Piecewise Linear Interpolation)：\n採用分段數學插值演算法，在各分位數（如 D1 至 D9、P10 至 P90）之間進行平滑且精確的連續曲線擬合，確保換算出的所得 PR 排行具有高度統計代表性。',
  },
  {
    q: '什麼是「全球購買力平價 (PPP)」？真實時薪在不同國家生活圈代表什麼意義？',
    a: '各國薪資不能單純依據外匯匯率換算，必須考量當地的「實質生活購買力」：\n\n① PPP 購買力平價概念：\n依據經濟合作暨發展組織 (OECD) 與世界銀行 (World Bank) 公告之購買力平價指數（PPP, Purchasing Power Parity）及 Numbeo 全球物價資料庫，校正各國食衣住行等實質生活成本。\n\n② 跨國生活圈對照：\n本計算機能將您的真實時薪與全球主要國家（如美、日、英、德、新、加等）薪資水準進行購買力等值換算，提供海外求職、跨國遠端工作 (Remote Work) 或移居規劃之客觀決策參考。',
  },
  {
    q: '月薪制勞工若換算出來的「真實時薪低於法定最低時薪」，雇主是否違法？',
    a: '需釐清「法定工時時薪」與「通勤時間」的法律界線：\n\n① 法定工時底線（勞基法第 21 條）：\n雇主發給之基本工資，在扣除契約約定工作時間後，換算之時薪不得低於當年度法定最低時薪標準。若雇主未依法給付加班費（前 2 小時加給 1/3、後 2 小時加給 2/3），致使實際工作工時換算低於基本時薪，即屬違法行為。\n\n② 通勤時間界定：\n純上下班通勤時間在勞動法規上不計入受雇工作時間，但若屬於「雇主指派之出差行程或工作待命」，則應依法計入工作時間給薪。',
  },
  {
    q: '接案自由工作者 (Freelancer / Project-based) 如何利用真實時薪進行精準報價？',
    a: '自由接案者常陷入「表面報價高，實質時薪極低」的陷阱：\n\n① 專案隱形成本：\n包含前期提案溝通時數、客戶反覆修改審查工時，以及外包軟體授權、打樣設備等自負成本。\n\n② 精準報價法：\n透過本計算機之專案模式，將「（專案總酬勞 - 實體開銷）÷（實際開發時數 + 溝通修訂時數）」，即可算出專案實質時薪，確保報價具備合理的利潤率與生存空間。',
  },
  {
    q: '本真實時薪計算器與 PR 排名數據是否具備官方效力？（統計與免責聲明）',
    a: '本線上真實時薪計算器所提供之淨時薪、全台薪資 PR 百分位數與全球購買力模擬，均為依據主計總處、OECD、WID 等公開大數據進行數學模型估算之理論統計指標，僅供個人職涯評估與工作價值量化參考。\n\n實際薪資給付、工時認定與勞動條件權利義務，均應以勞資雙方簽訂之正式聘僱契約及勞動基準法主管機關之法規判定為準。',
  },
]);

export default function HourlyRateCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HourlyRateCalculatorClient />
    </>
  );
}
