import type { Metadata } from 'next';
import PdfProcessorClient from '../PdfProcessorClient';

export const metadata: Metadata = {
  title: 'PDF Page Composer - Free Online PDF Merge, Sort, Rotate & Delete Pages',
  description:
    'Free online PDF Page Composer! Auto split & preview multi-file PDFs, combine images, drag-and-drop reorder, 90° rotation, single-page deletion, and high-res PDF export. 100% client-side execution.',
  keywords: 'PDF page composer, merge PDF, split PDF, rotate PDF, delete PDF page, convert image to PDF, PNG to PDF, JPG to PDF',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pdf-processor/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pdf-processor/',
      en: 'https://tools.cjkuo.net/pdf-processor/en/',
      'x-default': 'https://tools.cjkuo.net/pdf-processor/en/',
    },
  },
  openGraph: {
    title: 'PDF Page Composer - Free Online PDF Merge, Sort, Rotate & Delete Pages',
    description: '100% Client-side PDF Page Composer! Supports multi-file PDF merging, drag-and-drop page sorting, rotation, deletion, and image conversion.',
    url: 'https://tools.cjkuo.net/pdf-processor/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Page Composer - Free Online PDF Merge, Sort, Rotate & Delete Pages',
    description: '100% Client-side PDF Page Composer! Supports multi-file PDF merging, drag-and-drop page sorting, rotation, deletion, and image conversion.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF Page Composer',
  url: 'https://tools.cjkuo.net/pdf-processor/en/',
  description: 'Free online PDF Page Composer supporting multi-file PDF merge, page drag-and-drop reorder, rotation, deletion, and image-to-PDF export.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PdfProcessorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PdfProcessorClient lang="en" />
    </>
  );
}
