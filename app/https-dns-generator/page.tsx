import type { Metadata } from 'next';
import HttpsDnsGeneratorClient from './HttpsDnsGeneratorClient';

export const metadata: Metadata = {
  title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學 - 免費線上 DNS 產生工具',
  description:
    '免費線上 DNS HTTPS (Type 65) 紀錄產生器與設定教學。支援 RFC 9460 規範之服務模式 (Service Mode) 與別名模式 (Alias Mode)，透過勾選與填空即時生成 ALPN、ipv4hint、ipv6hint、port 等參數。',
  keywords: 'DNS HTTPS record generator, Type 65, RFC 9460, SVCB, Cloudflare HTTPS record, ALPN, ipv4hint, ipv6hint, DNS 設定教學',
  alternates: {
    canonical: 'https://tools.cjkuo.net/https-dns-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/https-dns-generator/',
      en: 'https://tools.cjkuo.net/https-dns-generator/en/',
    },
  },
  openGraph: {
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
    description: '視覺化勾選與填空即時產生符合 RFC 9460 規範的 DNS HTTPS (Type 65) 紀錄。',
    url: 'https://tools.cjkuo.net/https-dns-generator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
    description: '視覺化勾選與填空即時產生符合 RFC 9460 規範的 DNS HTTPS (Type 65) 紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
  url: 'https://tools.cjkuo.net/https-dns-generator/',
  description: '線上可視化 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生與設定指南小工具。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function HttpsDnsGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HttpsDnsGeneratorClient lang="zh-TW" />
    </>
  );
}
