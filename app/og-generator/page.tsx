import type { Metadata } from 'next';
import OgGeneratorClient from './OgGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'OG 圖片產生器 - 免費線上 Open Graph 社群卡片設計、模板與多格式下載工具',
  description:
    '專業免費的線上 OG (Open Graph) 圖片產生器！提供現代極簡、科技光流、雜誌專欄與醒目大字四種模板，支援自訂文字、Logo/特色圖片上傳與 2x 視網膜超採樣，快速匯出 PNG、JPEG、WebP 與 SVG 格式。',
  keywords:
    'OG圖片產生器,Open Graph產生器,社群分享圖製作,Twitter Card產生器,Facebook分享圖,社交媒體縮圖,網頁封面圖設計,免費OG Image Generator',
  alternates: {
    canonical: 'https://tools.cjkuo.net/og-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/og-generator/',
      en: 'https://tools.cjkuo.net/og-generator/en/',
      'x-default': 'https://tools.cjkuo.net/og-generator/en/',
    },
  },
  openGraph: {
    title: 'OG 圖片產生器 - 免費線上 Open Graph 社群卡片設計、模板與多格式下載工具',
    description:
      '即時設計專屬 Open Graph 社群圖片。提供四款精美模板、自訂文字排版、Logo 內嵌與 PNG/JPEG/WEBP/SVG 多格式匯出。',
    url: 'https://tools.cjkuo.net/og-generator/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OG 圖片產生器 - 免費線上 Open Graph 社群卡片設計、模板與多格式下載工具',
    description:
      '即時設計專屬 Open Graph 社群圖片。提供四款精美模板、自訂文字排版、Logo 內嵌與 PNG/JPEG/WEBP/SVG 多格式匯出。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'OG 圖片產生器',
  url: 'https://tools.cjkuo.net/og-generator/',
  description:
    '專業免費的 Open Graph 與社群封面圖片產生器，支援 4 種模板、Logo 嵌入與 PNG/JPEG/WEBP/SVG 匯出。',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 Open Graph (OG) 圖片？為什麼每個網頁都必須具備？',
    a: 'Open Graph (簡稱 OG) 協定是由 Facebook 於 2010 年推出的社交中繼標籤標準。當您在 Facebook、Twitter / X、LinkedIn、LINE、Slack 或 Discord 等平台分享網址時，爬蟲會自動抓取頁面中的 `<meta property="og:image" ...>` 標籤，並將其渲染為一張大型視覺卡片。\n\n根據社群數據統計，具備精美 OG 圖片的連結點擊率 (CTR) 比純文字連結高出 180% 以上！是提升網頁 SEO 與品牌曝光不可或缺的關鍵利器。',
  },
  {
    q: '社群平台推薦的 OG 圖片尺寸與長寬比為何？',
    a: '目前各大主流平台的黃金標準尺寸為 1200 x 630 像素 (長寬比約為 1.91:1)。\n\n① Facebook / LinkedIn / Discord：完美支援 1200 x 630。\n② Twitter / X：支援 1200 x 675 (16:9) 大圖卡片 (summary_large_image)。\n③ Instagram 貼文：標準正方形 1080 x 1080 (1:1)。\n④ 限時動態 / 手機全螢幕：垂直直式 1080 x 1920 (9:16)。\n\n本工具已內建上述所有比例，可一鍵切換並即時重新排版！',
  },
  {
    q: '本工具提供的四種模板分別適合應用在什麼情境？',
    a: '我們精心打磨了四款涵蓋各類應用情境的設計模板：\n\n① 現代極簡 (Modern Minimal)：乾淨留白、幾何點陣與細緻邊框，非常適合技術部落格、官方公告、開源專案與設計展示。\n② 科技光流 (Cyber Gradient)：霓虹漸層與流動光暈，適合 SaaS 產品、AI 開發工具與 Web3 科技新聞。\n③ 雜誌專欄 (Split Showcase)：經典左文右圖排版，可上傳自訂產品截圖或成果照片，適合深度評測、電子報與專案報導。\n④ 醒目大字 (Bold Impact)：超大粗體與醒目色條，文字張力極強，最適合社群快訊、金句短語與促銷活動。',
  },
  {
    q: '產生的圖片可以在商業專案中使用嗎？是否有版權或浮水印限制？',
    a: '100% 免費且可用於任何商業或個人專案！本工具完全不添加任何浮水印，產生的所有圖像版權 100% 歸您所有。\n\n此外，本工具運作於 100% 純前端 (Client-side 瀏覽器環境)，您上傳的 Logo、背景圖片及輸入的文字均不會上傳至任何後端伺服器，完全守護您的資料隱私與商業機密。',
  },
  {
    q: '為什麼提供多種匯出格式 (PNG / JPEG / WebP / SVG)？該如何選擇？',
    a: '不同格式適用於不同社群與伺服器部署情境：\n\n① PNG：無損高清壓縮，文字邊緣最為銳利，是各大社群平台 OG Image 最推薦的通用格式。\n② JPEG：適合包含複雜攝影照片的背景，檔案體積比 PNG 小 50% 以上，適合伺服器頻寬有限的網站。\n③ WebP：新一代高壓縮網頁格式，在保持高畫質的同時兼具極小體積。\n④ SVG：向量封裝檔，方便設計師於 Figma 或 Illustrator 中進行二次編修。',
  },
  {
    q: '如何將產生的 OG 圖片整合至 HTML 或 Next.js 專案中？',
    a: '下載圖片並上傳至網站的 public 目錄或 CDN 後，在 HTML `<head>` 中加入以下標準標籤：\n\n```html\n<meta property="og:title" content="您的網頁標題" />\n<meta property="og:description" content="您的網頁描述" />\n<meta property="og:image" content="https://yourdomain.com/og-image.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />\n```\n\nNext.js App Router 則可直接在 `app/page.tsx` 的 `export const metadata` 中宣告 `openGraph` 與 `twitter` 物件！',
  },
]);

export default function OgGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <OgGeneratorClient lang="zh-TW" />
    </>
  );
}
