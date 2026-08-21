import type { Metadata } from 'next';
import PregnancyCalculatorClient from './PregnancyCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '孕期與產檢假計算機 - 免費線上預產期、40週產檢時程與法定產假津貼試算工具',
  description:
    '專業免費的線上孕期與產檢假計算機！支援最後月經 (LMP)、預產期 (EDD)、超音波週數與試管 (IVF) 多向推算。精算 40 週關鍵產檢里程碑、胎兒生長尺寸比喻，並整合台灣勞基法與性平法試算 8 天產檢假、8 週產假、育嬰留停 8 成薪津貼與勞保生育給付。',
  keywords: '孕期計算機,預產期計算,產檢假,產假計算,育嬰留停津貼,勞保生育給付,高層次超音波,唐氏症篩檢,懷孕週數,待產包清單',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pregnancy-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pregnancy-calculator/',
      en: 'https://tools.cjkuo.net/pregnancy-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pregnancy-calculator/en/',
    },
  },
  openGraph: {
    title: '孕期與產檢假計算機 - 免費線上預產期、40週產檢時程與法定產假津貼試算工具',
    description: '一鍵精算預產期、懷孕週數、40 週產檢里程碑與台灣法定產假/產檢假/育嬰津貼。',
    url: 'https://tools.cjkuo.net/pregnancy-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '孕期與產檢假計算機 - 免費線上預產期與法定產假津貼試算',
    description: '一鍵精算預產期、懷孕週數、40 週產檢里程碑與台灣法定產假/產檢假/育嬰津貼。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '孕期與產檢假計算機',
  url: 'https://tools.cjkuo.net/pregnancy-calculator/',
  description: '專業免費的線上孕期與產檢假計算機，精算預產期、40 週產檢時程與法定產假津貼。',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '預產期 (EDD) 是如何計算的？為什麼跟實際生產日會有落差？',
    a: '醫學上最常用的標準公式為「奈格爾法則 (Naegele\'s Rule)」：以最後一次月經的第一天為基準，月份減 3 (或加 9)，日期加 7，並以 28 天月經週期計算（共 280 天 / 40 週）。\n\n由於每位女性排卵時間、受精卵著床時間及月經週期長短不同，只有約 5% 的孕婦會在預產期當天生產。通常在「懷孕滿 37 週至 41 週+6 天」之間生產皆屬正常足月分娩。婦產科醫師會在第 8~12 週產檢時透過超音波胎兒頭臀長 (CRL) 進行週數校正。',
  },
  {
    q: '台灣勞基法與性別平等工作法規定的「產檢假」有幾天？薪資如何計算？',
    a: '依《性別平等工作法》第 15 條規定：\n\n① 天數：女性受僱者妊娠期間，雇主應給予「產檢假 8 日」。\n② 給薪方式：產檢假期間「薪資照給 (全薪)」，且雇主不得視為缺勤而影響全勤獎金、考績或為其他不利處分。\n③ 彈性請假：產檢假可依勞工需求選擇以「半日」或「小時」為請假單位。雇主得向勞動部勞工保險局申請後 2 日之薪資補助。',
  },
  {
    q: '法定「產假 8 週 (56天)」包含例假日嗎？最晚何時必須開始請？',
    a: '依勞動基準法第 50 條規定：\n\n① 連續曆天計算：產假 8 星期係以「連續日曆天（Calendar Days）」計算，期間包含例假日、國定假日與休息日，非僅算工作日（共計 56 天）。\n② 請假時機：產假得在分娩前開始請，但「產前休假最多不得超過 4 週（28天）」，保留至少 4 週於分娩後休養。\n③ 給薪標準：在職工作滿 6 個月以上者「工資照給 (全薪)」；未滿 6 個月者「減半發給 (半薪)」。',
  },
  {
    q: '配偶的「陪產檢及陪產假」有幾天？請假期間與薪資規定為何？',
    a: '依性別平等工作法第 15 條第 5 項規定：\n\n① 天數：配偶享有「陪產檢及陪產假共 7 日」。\n② 薪資：7 日請假期間雇主應「全額照給薪資」。\n③ 請假期間：受僱者得於配偶妊娠產檢時、分娩當日及其前後合計 15 日之期間內，擇其中 7 日請假。',
  },
  {
    q: '勞保「生育給付」申請條件為何？可以領多少錢？',
    a: '女性參加勞工保險期間懷孕分娩，可向勞保局申請生育給付：\n\n① 資格條件：參加保險滿 280 日後分娩，或滿 181 日後早產。\n② 給付金額：按分娩當月起前 6 個月之平均月投保薪資，一次發給「2 個月（60日）」生育給付。\n③ 雙胞胎以上加倍：生雙胞胎發給 4 個月，三胞胎發給 6 個月，依此類推。',
  },
  {
    q: '育嬰留職停薪津貼（育嬰假）的 8 成薪如何發放？父母可以同時請領嗎？',
    a: '依性別平等工作法與就業保險法規定：\n\n① 請領資格：任職滿 6 個月且子女未滿 3 歲前，得申請育嬰留職停薪（最長至子女滿 3 歲止，合計不超過 2 年）。\n② 津貼金額：就業保險發給「60% 育嬰津貼」+ 政府加發「20% 育嬰留職停薪薪資補助」，合計達平均月投保薪資之「80% (8成薪)」，每一子女最長補助 6 個月。\n③ 父母同時請領：現行法規已開放父母「可以同時申請」育嬰留職停薪並同時請領 8 成津貼，大幅減輕育兒經濟壓力。',
  },
  {
    q: '本計算機的產假與津貼是依據哪裡的法律？非台灣地區適用嗎？',
    a: '本工具中的各項法定假別天數（8天產檢假、8週產假、7天陪產檢假）、勞保生育給付（2個月）及育嬰留職停薪津貼（8成薪），均是依據「台灣（中華民國）」現行之《勞動基準法》、《性別平等工作法》與《就業保險法》等法規進行設計與試算。\n\n【醫學計算部分】預產期推算、胎兒各週生長尺寸與關鍵產檢時程屬於國際通用之醫學常規，全球各地準爸媽皆可通用參考；\n\n【假別與津貼部分】若您身處香港、新加坡、馬來西亞、中國大陸、美加或歐洲等其他國家或地區，由於各地區之法定產假天數、育嬰留停政策與公部門津貼制度各有不同，假別與津貼試算結果僅供架構參考，具體權益請務必以您所在當地的勞動法規與社會保險制度為準。',
  },
  {
    q: '為什麼會開發這個「孕期計算機」？作者想對準爸媽說的話 [愛心]',
    a: '其實在剛接觸孕產這個領域時，面對繁複的醫學週數、檢查項目與法規津貼，我也常常感到手足無措、不懂具體該做些什麼。建立這個工具，就是希望能夠整理出清晰的時程與權益，幫助大家在懷孕與待產的這條路上一起安心成長。\n\n我也會隨著未來的自身經驗與各界回饋不斷修正與完善這個計算機。預祝全天下的夫妻都可以順利、平安、快樂地迎接一個健康可愛的寶貝！',
  },
]);

export default function PregnancyCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <PregnancyCalculatorClient lang="zh-TW" />
    </>
  );
}
