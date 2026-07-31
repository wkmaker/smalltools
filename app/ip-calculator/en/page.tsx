import type { Metadata } from 'next';
import IpCalculatorClient from '../IpCalculatorClient';

export const metadata: Metadata = {
  title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range & Usable Host Calculator',
  description:
    'Free online IPv4 & CIDR subnet calculator! Calculate network address, broadcast address, subnet mask, wildcard mask, usable IP range, and export full IP lists to TXT or CSV.',
  keywords: 'IP Subnet Calculator, CIDR Calculator, IPv4 Calculator, Subnet Mask, Network Address, Broadcast Address, Usable Host Range',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-calculator/',
      en: 'https://tools.cjkuo.net/ip-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/ip-calculator/en/',
    },
  },
  openGraph: {
    title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range Calculator',
    description: 'Accurately calculate IPv4 / CIDR subnets, network & broadcast IPs, usable host ranges, and export TXT/CSV lists.',
    url: 'https://tools.cjkuo.net/ip-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPv4 Subnet & CIDR Calculator - Free Online IP Range Calculator',
    description: 'Accurately calculate IPv4 / CIDR subnets, network & broadcast IPs, usable host ranges, and export TXT/CSV lists.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IPv4 Subnet & CIDR Calculator',
  url: 'https://tools.cjkuo.net/ip-calculator/en/',
  description: 'Free online IPv4 & CIDR subnet calculator supporting notation and standard subnet mask math with TXT/CSV export.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function IpCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IpCalculatorClient lang="en" />
    </>
  );
}
