import type { Metadata } from 'next';
import DnsDigClient from '../DnsDigClient';

export const metadata: Metadata = {
  title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
  description:
    'Free online DNS DIG lookup tool! Query A, AAAA, CNAME, MX, TXT, NS, HTTPS records instantly using Cloudflare, Google, and AliDNS over HTTPS (DoH) APIs.',
  keywords: 'DNS Lookup, DIG Tool, DNS Records, Cloudflare DoH, Google DoH, Domain Diagnostics, MX Record Lookup',
  alternates: {
    canonical: 'https://tools.cjkuo.net/dns-dig/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/dns-dig/',
      en: 'https://tools.cjkuo.net/dns-dig/en/',
    },
  },
  openGraph: {
    title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
    description: 'Essential online DNS lookup tool for engineers. Supports Cloudflare/Google DoH, domain parsing, and RFC 9460 decoding.',
    url: 'https://tools.cjkuo.net/dns-dig/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
    description: 'Essential online DNS lookup tool for engineers. Supports Cloudflare/Google DoH, domain parsing, and RFC 9460 decoding.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Online DNS DIG Tool',
  url: 'https://tools.cjkuo.net/dns-dig/en/',
  description: 'Free online DNS DIG diagnostic tool querying DNS over HTTPS (DoH) APIs for instant domain record lookup.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function DnsDigEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DnsDigClient lang="en" />
    </>
  );
}
