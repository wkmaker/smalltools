import type { Metadata } from 'next';
import PdfCompressorClient from '../PdfCompressorClient';

export const metadata: Metadata = {
  title: 'PDF Compressor Master - Free Online PDF Compression & Privacy Protection',
  description:
    'Free online PDF Compressor Master! Deeply compresses & downsamples embedded bitmap images while preserving 100% original crisp text & vector graphics. Supports multi-file batch processing and ZIP export.',
  keywords: 'PDF compressor, compress PDF, PDF image compression, reduce PDF size, online PDF compressor, free PDF tool, client-side PDF compression',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pdf-compressor/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pdf-compressor/',
      en: 'https://tools.cjkuo.net/pdf-compressor/en/',
    },
  },
  openGraph: {
    title: 'PDF Compressor Master - Free Online PDF Compression & Privacy Protection',
    description: '100% Client-side PDF Compressor Master! Supports multi-file batch processing, instant structure inspection, and ZIP download.',
    url: 'https://tools.cjkuo.net/pdf-compressor/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Compressor Master - Free Online PDF Compression & Privacy Protection',
    description: '100% Client-side PDF Compressor Master! Supports multi-file batch processing, instant structure inspection, and ZIP download.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF Compressor Master',
  url: 'https://tools.cjkuo.net/pdf-compressor/en/',
  description: 'Free online PDF Compressor Master with 100% client-side execution, multi-file batch processing, and structure inspection.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PdfCompressorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PdfCompressorClient lang="en" />
    </>
  );
}
