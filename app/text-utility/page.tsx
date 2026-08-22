import type { Metadata } from 'next';
import TextUtilityClient from './TextUtilityClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
  description:
    '專業免費的線上文字處理助手！支援即時中英文/字元數/行數統計、大小寫轉換、去除重複行與多餘空白、正則替換等極速線上文字排版。',
  keywords: '字數統計,文字處理,大小寫轉換,文字排版,去除空白,去除重複行,線上文字工具,正則替換',
  alternates: {
    canonical: 'https://tools.cjkuo.net/text-utility/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/text-utility/',
      en: 'https://tools.cjkuo.net/text-utility/en/',
      'x-default': 'https://tools.cjkuo.net/text-utility/en/',
    },
  },
  openGraph: {
    title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
    description: '即時進行文字大小寫轉換、空白字元處理，與多維度中英文統計。',
    url: 'https://tools.cjkuo.net/text-utility/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
    description: '即時進行文字大小寫轉換、空白字元處理，與多維度中英文統計。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '文字處理助手',
  url: 'https://tools.cjkuo.net/text-utility/',
  description: '專業免費的線上文字處理與排版工具，支援大小寫轉換、空白清理與字數統計。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '中文字數與英文字詞數 (Word Count) 的計算標準與統計規則為何？',
    a: '多語系文字統計採行業界標準演算法：\n\n① 中文字數統計：\n依據 Unicode CJK 統一表意文字編碼區間（`\\u4e00-\\u9fa5`），每一個漢字獨立計為 1 個中文字。\n\n② 英文單詞統計：\n以連續英文字母、數字或連字號構成的完整詞彙（`\\b[a-zA-Z0-9_-]+\\b`）作為獨立單詞計算，不受詞間多重空白影響。',
  },
  {
    q: '「總字元數」與「不含空白字元數」有何差異？在投稿或論文中如何參照？',
    a: '兩者的計算範圍與常見用途如下：\n\n① 總字元數 (Total Characters)：\n包含所有中英文字母、數字、標點符號、換行符號（`\\n`）與空格。\n\n② 不含空白字元數 (Excl. Spaces)：\n完全剔除半形空格、全形空格、Tab 縮排與換行符號。許多學術論文、出版稿費計酬或社群貼文（如 Twitter/Threads）皆以不含空白之實體字元或英文字詞作為嚴格上限基準。',
  },
  {
    q: '文字大小寫轉換（UPPERCASE, lowercase, Title Case）的運作邏輯為何？',
    a: '支援常見的三種大小寫規格：\n\n① 全大寫 (UPPERCASE)：\n將所有英文英文字母轉換為大寫形式（如 `hello world` → `HELLO WORLD`）。\n\n② 全小寫 (lowercase)：\n將所有英文英文字母轉換為小寫形式。\n\n③ 首字大寫 (Title Case)：\n將每個英文單詞的首字母轉換為大寫、其餘字母轉換為小寫（如 `hello world` → `Hello World`），適合文章標題排版。',
  },
  {
    q: '「去除重複行 (Remove Duplicates)」是否會打亂原始文字的先後排序？',
    a: '不會打亂原始先後順序：\n\n① 保持首次出現順序 (Stable Order)：\n本工具採用 Set 集合過濾機制，僅移除後續重複出現的多餘行，嚴格保留每筆唯一資料首次出現的相對位置。\n\n② 適用場景：\n非常適合清理整理名單、電話列表、Email 清單、關鍵字列表與資料庫匯出資料。',
  },
  {
    q: '在線上貼上大量文字或機密文章時是否有隱私外洩疑慮？',
    a: '完全零隱私風險！本工具為 100% 純前端（Client-Side）本地瀏覽器運算架構：\n\n① 零後端傳輸：\n所有字數統計、大小寫轉換與排版清理皆在您電腦本地的 JavaScript 引擎中完成。\n\n② 零伺服器儲存：\n不會向任何伺服器發送或備份您的文字內容，即使離線斷網亦能流暢使用。',
  },
  {
    q: '「移除空行」與「修剪首尾空白 (Trim)」對資料清洗有何實質幫助？',
    a: '排版與資料預處理的高效輔助：\n\n① 移除空行：\n自動過濾純換行與僅包含空白字元的無效空白行，大幅壓縮文件篇幅。\n\n② 修剪首尾空白：\n自動移除每行開頭與結尾多餘的半形/全形空格，消除從 PDF 或網頁複製時夾帶的排版雜訊，便於後續匯入 Excel 或資料庫。',
  },
  {
    q: '本文字處理助手是否支援超長篇小說或數十萬字的大型文本？',
    a: '完美支援！本工具採用高度優化的正則表達式與原生 String API 運算，處理 50 萬字以上的超長文稿或大型資料集僅需數毫秒即可完成即時統計與批次排版。',
  },
]);

export default function TextUtilityPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <TextUtilityClient />
    </>
  );
}
