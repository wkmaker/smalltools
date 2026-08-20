import type { Metadata } from 'next';
import PdfCompressorClient from '../PdfCompressorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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
      'x-default': 'https://tools.cjkuo.net/pdf-compressor/en/',
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

const faqJsonLd = generateFaqSchema([
  {
    q: 'How does PDF Compressor Master reduce file size? Will text and tables become blurry?',
    a: `100% crisp and clear! Large PDF files are usually bloated by high-resolution embedded photos and scanned images. This tool specifically targets embedded bitmap images for intelligent downsampling and recompression, while leaving all native text, vector shapes, fonts, and table structures 100% untouched and lossless.`,
  },
  {
    q: 'What is the difference between Light, Balanced, and Maximum modes? How do I customize DPI?',
    a: `We provide 3 preset modes plus advanced fine-tuning:

1. Light: Quality 0.85 / 200 DPI, moderate reduction with print-ready crispness.
2. Balanced (Recommended): Quality 0.70 / 144 DPI, shrinks file size by ~60%, ideal for email attachments and office sharing.
3. Maximum: Quality 0.50 / 96 DPI, shrinks size by up to ~80%, perfect for web publishing and screen viewing.

You can also toggle 'Advanced Settings' to manually adjust compression quality and DPI thresholds.`,
  },
  {
    q: 'Can I compress multiple PDF files at once? Is ZIP batch download supported?',
    a: `Yes! You can drag and drop multiple PDF files to process in batch queue. Once completed, you can download each compressed file individually or click 'Download All ZIP' to export all compressed PDFs into a single ZIP archive.`,
  },
  {
    q: "What is 'Structure Inspection' and why are some images marked as 'Protected'?",
    a: `Before compressing, the engine inspects the PDF structure to detect image resolutions, dimensions, and color profiles.

If an image is already below the target DPI, extremely small, or serves as a transparency mask, the system flags it as 'Protected' and skips recompression to prevent file inflation or visual artifacts.`,
  },
  {
    q: 'Can password-protected PDF files be compressed?',
    a: `Yes. If an uploaded PDF is password-encrypted, a prompt will appear asking for the open password. Once verified locally, the tool unlocks and compresses the file normally.`,
  },
  {
    q: 'How effective is compression on text-only PDFs without any images?',
    a: `If a PDF consists solely of vector text and embedded fonts, compression gains will be modest (5%-15% structural optimization) because we strictly preserve 100% text readability and copyability. The most dramatic size reduction (50%-80%) occurs on PDFs containing photos, scanned pages, or embedded illustrations.`,
  },
  {
    q: 'Is it safe to compress confidential documents? Are files uploaded to external servers?',
    a: `100% private and secure! Operating on a Zero-Server Architecture, all parsing, downsampling, and repackaging occur entirely within your browser's local memory. No files or data ever leave your device, and the tool works completely offline.`,
  },
]);

export default function PdfCompressorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PdfCompressorClient lang="en" />
    </>
  );
}
