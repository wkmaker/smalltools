import type { Metadata } from 'next';
import IpCalculatorClient from './IpCalculatorClient';

export const metadata: Metadata = {
  title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 子網遮罩運算工具',
  description:
    '專業免費的線上 IP 子網段與可用 IP 計算器！支援 CIDR 標記與點分十進制切換，精確計算網路位址、廣播位址、子網遮罩、可用 IP 範圍與數量。',
  keywords: 'IP計算器,子網計算器,IP Subnet Calculator,CIDR計算,子網遮罩,網路位址,廣播位址,可用IP範圍,IPv4',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-calculator/',
      en: 'https://tools.cjkuo.net/ip-calculator/en/',
    },
  },
  openGraph: {
    title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 計算工具',
    description: '毫秒級精確計算 IPv4 / CIDR 子網段、網路位址、廣播位址與可用 IP 列表。',
    url: 'https://tools.cjkuo.net/ip-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 計算工具',
    description: '毫秒級精確計算 IPv4 / CIDR 子網段、網路位址、廣播位址與可用 IP 列表。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IP 子網段與可用 IP 計算器',
  url: 'https://tools.cjkuo.net/ip-calculator/',
  description: '專業免費的線上 IP 子網段與可用 IP 計算器，支援 CIDR 標記法與標準 IP/Subnet Mask 計算。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function IpCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IpCalculatorClient lang="zh-TW" />
    </>
  );
}
