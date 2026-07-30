import type { Metadata } from 'next';
import DiffCheckerClient from './DiffCheckerClient';

export const metadata: Metadata = {
  title: '兩份文件比對工具 - 免費線上 Text Diff Checker 與程式碼文字差異分析工具',
  description:
    '專業免費的線上文件比對工具 (Text Diff Checker)！支援左右雙窗格對比與單窗格混合比對，精確解析程式碼與文字差異，純前端私密安全。',
  keywords: '文件比對,文字比對,Diff Checker,程式碼比對,Text Diff,差異分析,文本比對',
  alternates: {
    canonical: 'https://tools.cjkuo.net/diff-checker/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/diff-checker/',
      en: 'https://tools.cjkuo.net/diff-checker/en/',
    },
  },
  openGraph: {
    title: '兩份文件比對工具 - 免費線上 Text Diff Checker 與程式碼文字差異分析工具',
    description: '純前端安全文本比對工具，提供 Split 與 Unified 模式，支援大文字與忽略大小寫設定。',
    url: 'https://tools.cjkuo.net/diff-checker/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '兩份文件比對工具 - 免費線上 Text Diff Checker 與程式碼文字差異分析工具',
    description: '純前端安全文本比對工具，提供 Split 與 Unified 模式，支援大文字與忽略大小寫設定。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '兩份文件比對工具',
  url: 'https://tools.cjkuo.net/diff-checker/',
  description: '專業免費的前端文件比對工具 (Document Diff Checker)，支援左右雙窗格與單窗格 PR 混合比對。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function DiffCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DiffCheckerClient />
    </>
  );
}
