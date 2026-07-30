import type { Metadata } from 'next';
import SslConverterClient from '../SslConverterClient';

export const metadata: Metadata = {
  title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
  description:
    'Free online SSL certificate converter tool! Convert PFX/P12, PEM, and DER certificates bi-directionally with client-side privacy, key matching hash check, and expiration warnings.',
  keywords: 'SSL Certificate Converter,PFX to PEM,PEM to PFX,DER to PEM,P12 converter,SSL cert chain fix,private key converter',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ssl-converter/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ssl-converter/',
      en: 'https://tools.cjkuo.net/ssl-converter/en/',
    },
  },
  openGraph: {
    title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
    description: 'Secure client-side SSL certificate format converter tool with certificate chain fixing and expiration analysis.',
    url: 'https://tools.cjkuo.net/ssl-converter/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
    description: 'Secure client-side SSL certificate format converter tool with certificate chain fixing and expiration analysis.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SSL Certificate Converter',
  url: 'https://tools.cjkuo.net/ssl-converter/en/',
  description: 'Free online SSL certificate format converter tool supporting PFX, P12, PEM, and DER.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function SslConverterEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SslConverterClient lang="en" />
    </>
  );
}
