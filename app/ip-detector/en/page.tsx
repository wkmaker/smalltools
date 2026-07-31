import type { Metadata } from 'next';
import IpDetectorClient from '../IpDetectorClient';

export const metadata: Metadata = {
  title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
  description:
    'Free online IP address detector & network diagnostic tool! Instant lookup for public IPv4/IPv6 address, IP geolocation, Cloudflare Trace, and latency tests for AWS, GCP, Azure, and CDNs.',
  keywords: 'My IP Address, IP Lookup, IPv4 Lookup, IPv6 Test, IP Geolocation, Network Diagnostics, Cloud Latency Test, Cloudflare Trace',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-detector/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-detector/',
      en: 'https://tools.cjkuo.net/ip-detector/en/',
      'x-default': 'https://tools.cjkuo.net/ip-detector/en/',
    },
  },
  openGraph: {
    title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
    description: 'Instant public IPv4/IPv6 lookup, Cloudflare Trace analysis, IP geolocation, and cloud latency diagnostics.',
    url: 'https://tools.cjkuo.net/ip-detector/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
    description: 'Instant public IPv4/IPv6 lookup, Cloudflare Trace analysis, IP geolocation, and cloud latency diagnostics.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'My IP Address & Diagnostics Tool',
  url: 'https://tools.cjkuo.net/ip-detector/en/',
  description: 'Free online IP address detector supporting dual-stack IPv4/IPv6 lookup, geolocation, and latency testing for major cloud providers.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function IpDetectorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IpDetectorClient lang="en" />
    </>
  );
}
