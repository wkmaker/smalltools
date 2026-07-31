import type { Metadata } from 'next';
import ImageProcessorClient from '../ImageProcessorClient';

export const metadata: Metadata = {
  title: 'Universal Image Processor - Free Online Image Crop, Resize, Compress & WebP Batch Convert',
  description:
    'Free professional online image processing tool! Supports image cropping, proportional resizing, quality compression (PNG/JPG/WebP), side-by-side comparison slider, and multi-file batch ZIP download.',
  keywords: 'image processor, crop image, compress image, image resizer, webp converter, batch image compression, online image editor',
  alternates: {
    canonical: 'https://tools.cjkuo.net/image-processor/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/image-processor/',
      en: 'https://tools.cjkuo.net/image-processor/en/',
      'x-default': 'https://tools.cjkuo.net/image-processor/en/',
    },
  },
  openGraph: {
    title: 'Universal Image Processor - Free Online Image Crop, Resize & Compress',
    description: 'Pure client-side image editor supporting cropping, resizing, quality compression, and batch ZIP export.',
    url: 'https://tools.cjkuo.net/image-processor/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Image Processor - Free Online Image Crop, Resize & Compress',
    description: 'Pure client-side image editor supporting cropping, resizing, quality compression, and batch ZIP export.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Universal Image Processor',
  url: 'https://tools.cjkuo.net/image-processor/en/',
  description: 'Free online image processing tool for cropping, resizing, quality compression, and WebP batch conversion.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function ImageProcessorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ImageProcessorClient lang="en" />
    </>
  );
}
