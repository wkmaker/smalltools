import type { Metadata } from 'next';
import QrGeneratorClient from '../QrGeneratorClient';

export const metadata: Metadata = {
  title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
  description:
    'Free online Designer QR Code Generator! Supports custom dot styles, dual gradients, center logo embedding, automatic 30% error correction, and PNG/SVG/WEBP vector export.',
  keywords:
    'QR Code Generator, Designer QR Code, Art QR Code, QR Code with Logo, Vector QR Code, SVG QR Code, Free QR Code',
  alternates: {
    canonical: 'https://tools.cjkuo.net/qr-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/qr-generator/',
      en: 'https://tools.cjkuo.net/qr-generator/en/',
    },
  },
  openGraph: {
    title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
    description: 'Instantly design your artistic QR Code. Supports dot styles, gradients, center logo, and vector SVG output.',
    url: 'https://tools.cjkuo.net/qr-generator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
    description: 'Instantly design your artistic QR Code with custom gradients, center logo, and vector SVG output.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Designer QR Code Generator',
  url: 'https://tools.cjkuo.net/qr-generator/en/',
  description: 'Free professional designer QR Code generator supporting liquid dot styles, gradients, and center logo embedding.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function QrGeneratorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <QrGeneratorClient lang="en" />
    </>
  );
}
