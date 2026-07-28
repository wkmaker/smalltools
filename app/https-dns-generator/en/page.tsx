import type { Metadata } from 'next';
import HttpsDnsGeneratorClient from '../HttpsDnsGeneratorClient';

export const metadata: Metadata = {
  title: 'DNS HTTPS Record (Type 65) Generator & Tutorial | Free Online DNS Tool',
  description:
    'Free online DNS HTTPS (Type 65) record generator based on RFC 9460. Visually generate Service Mode and Alias Mode records with ALPN, IP hints, port, and step-by-step DNS provider tutorials.',
  keywords: 'DNS HTTPS record generator, Type 65, RFC 9460, SVCB, Cloudflare HTTPS record, Route53 HTTPS record, ALPN, ipv4hint, ipv6hint',
  alternates: {
    canonical: 'https://tools.cjkuo.net/https-dns-generator/en/',
  },
  openGraph: {
    title: 'DNS HTTPS Record (Type 65) Generator & Tutorial',
    description: 'Visually generate RFC 9460 compliant DNS HTTPS (Type 65) records and get step-by-step guides for Cloudflare, AWS Route53, and Google Cloud DNS.',
    url: 'https://tools.cjkuo.net/https-dns-generator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS HTTPS Record (Type 65) Generator & Tutorial',
    description: 'Visually generate RFC 9460 compliant DNS HTTPS (Type 65) records and get step-by-step guides for Cloudflare, AWS Route53, and Google Cloud DNS.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DNS HTTPS Record (Type 65) Generator & Tutorial',
  url: 'https://tools.cjkuo.net/https-dns-generator/en/',
  description: 'Visual online DNS HTTPS (Type 65 / RFC 9460) record builder and step-by-step DNS management guide.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function HttpsDnsGeneratorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HttpsDnsGeneratorClient lang="en" />
    </>
  );
}
