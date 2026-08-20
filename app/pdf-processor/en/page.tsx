import type { Metadata } from 'next';
import PdfProcessorClient from '../PdfProcessorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'What core features does PDF Page Composer support? How do I merge PDFs?',
    a: `PDF Page Composer is an all-in-one client-side editor supporting:

1. Multi-file Merge & Image Import: Drag and drop multiple PDF files and PNG/JPG images to automatically split into individual page tiles.
2. Visual Drag & Drop Reorder: Freely adjust page sequence using drag-and-drop or move buttons.
3. Rotate & Delete: Rotate pages by 90° or remove unwanted pages.
4. Lossless Export: Reassemble all arranged pages into a single new PDF document.`,
  },
  {
    q: 'Can I insert PNG or JPG images and convert them into PDF pages?',
    a: `Yes! You can drag and drop PNG, JPG, or WebP images directly into the workspace. The tool automatically wraps them into crisp PDF pages, allowing seamless mixing and sorting alongside other PDF documents.`,
  },
  {
    q: 'How can I zoom in to inspect page details closely?',
    a: `Click the 'Preview' button on any page tile (or double click) to open the Full-Viewport Lightbox.

The lightbox renders the page in Just-In-Time high resolution, complete with mouse-wheel zoom, pan dragging, rotation, and keyboard arrow navigation.`,
  },
  {
    q: 'Will text become rasterized or lose quality after merging or rotating?',
    a: `Never! The tool directly manipulates the PDF's native object tree, preserving all original vector fonts, text streams, and high-res assets without any lossy rasterization. Text remains crisp, selectable, and searchable.`,
  },
  {
    q: 'Can I rotate individual sideways or upside-down pages?',
    a: `Yes! Click the 'Rotate 90°' button on any page tile to rotate clockwise (90°, 180°, 270°). The exported PDF embeds the exact /Rotate metadata to correct page orientations.`,
  },
  {
    q: 'How does the tool handle password-protected PDF files during merge?',
    a: `When you load a password-protected PDF, an unlock dialog will appear. Entering the correct password unlocks the document locally in memory, allowing all pages to be loaded onto the canvas for merging.`,
  },
  {
    q: 'Is it safe to process confidential documents or contracts?',
    a: `100% safe and confidential! The composer operates completely on the client side. All splitting, reordering, rotation, and rendering happen inside your browser memory with zero server uploads, working 100% offline.`,
  },
]);

export default function PdfProcessorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PdfProcessorClient lang="en" />
    </>
  );
}
