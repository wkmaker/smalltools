import type { Metadata } from 'next';
import DnsDigClient from './DnsDigClient';

export const metadata: Metadata = {
  title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
  description:
    '專業免費的線上 DNS DIG 網路診斷工具！支援 Cloudflare 與 Google DNS over HTTPS (DoH) API，即時檢索 A, AAAA, CNAME, MX, TXT, NS 等紀錄。',
  keywords: 'DNS查詢,DIG工具,DNS Lookup,DNS記錄,Cloudflare DoH,Google DoH,網域診斷,MX記錄查詢',
  alternates: {
    canonical: 'https://tools.cjkuo.net/dns-dig/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/dns-dig/',
      en: 'https://tools.cjkuo.net/dns-dig/en/',
    },
  },
  openGraph: {
    title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
    description: '工程師的線上 DNS 診斷利器。支援 Cloudflare/Google DoH 自由切換、自動網域清理與記錄檢索。',
    url: 'https://tools.cjkuo.net/dns-dig/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
    description: '工程師的線上 DNS 診斷利器。支援 Cloudflare/Google DoH 自由切換、自動網域清理與記錄檢索。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DIG 網路診斷工具 (DNS Lookup)',
  url: 'https://tools.cjkuo.net/dns-dig/',
  description: '專業免費的線上 DNS DIG 網路診斷工具，利用 Cloudflare 與 Google DoH API 即時查詢各類 DNS 記錄。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function DnsDigPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DnsDigClient lang="zh-TW" />
    </>
  );
}
