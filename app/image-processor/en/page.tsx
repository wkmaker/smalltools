import type { Metadata } from 'next';
import ImageProcessorClient from '../ImageProcessorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'Why is converting web images to WebP recommended over JPG/PNG?',
    a: 'WebP is a modern next-generation image format developed by Google:\n\n① Significant File Size Reductions:\nWebP images are typically 25% to 35% smaller than comparable JPEGs and over 26% smaller than lossless PNGs.\n\n② Alpha Transparency & Animation Support:\nWebP supports transparent backgrounds (Alpha Channel) alongside rich color palettes, drastically speeding up page load speeds and improving Core Web Vitals.',
  },
  {
    q: 'Is it safe to process personal portraits, ID cards, or commercial product photos online?',
    a: '100% Private & Secure! The tool operates strictly client-side inside your local browser runtime:\n\n① Zero Cloud Uploads:\nAll image decodings, Canvas pixel operations, and compression algorithms execute in your computer memory.\n\n② Zero Server Storage:\nYour images are never transmitted to or archived on remote servers. It functions reliably even without an internet connection.',
  },
  {
    q: 'What is the recommended compression quality setting for optimal results?',
    a: 'Balanced recommendations based on deployment targets:\n\n① Web & Social Media (75% ~ 85%):\nAt around 80% quality, the human eye cannot detect compression artifacts while file sizes are reduced by 60% to 80%.\n\n② High-Res Print & Showcase (90% ~ 95%):\nPreserves maximum texture details and color gradation.\n\n③ Real-Time Comparison Slider:\nUse our built-in split-view comparison slider to inspect fine details before exporting.',
  },
  {
    q: 'What is "Keep Aspect Ratio" and how do I specify custom pixel dimensions?',
    a: 'Flexible dimension management tools:\n\n① Keep Aspect Ratio:\nWhen checked, modifying width or height automatically calculates the opposite dimension proportionally without distortion.\n\n② Freeform & Presets:\nUncheck to unlock arbitrary width/height dimensions, or select standard aspect ratio presets (1:1, 4:3, 16:9, 9:16).',
  },
  {
    q: 'What input formats are supported? Can I batch-process multiple images into a ZIP archive?',
    a: 'Broad format support with batch workflow:\n\n① Supported File Types:\nAccepts PNG, JPG/JPEG, WebP, GIF, SVG, AVIF, BMP, and more.\n\n② Batch ZIP Packaging:\nDrag and drop multiple images at once, apply unified resizing and compression parameters, and download a bundled ZIP file with one click.',
  },
  {
    q: 'How do the Crop and Rotate / Flip tools integrate with the editing pipeline?',
    a: 'Visual interactive canvas suite:\n\n① Rotation & Mirroring:\nPerform 90° clockwise/counter-clockwise rotations and horizontal/vertical flips instantaneously.\n\n② Interactive Cropping Box:\nDrag handles across the canvas to frame your subject; the geometric transformations and crop boundaries are combined cleanly upon export.',
  },
  {
    q: 'What should I do when alerted that "Target resolution exceeds original, upscaling may cause blur"?',
    a: 'Raster upscaling considerations:\n\n① Interpolation Limitations:\nEnlarging raster bitmap pixels beyond native sensor resolution forces browser algorithms to generate synthetic pixels, potentially causing softness.\n\n② Best Practices:\nPrioritize downscaling or preserving native resolution; for vector artwork, use SVG assets when infinite scalability is required.',
  },
]);

export default function ImageProcessorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ImageProcessorClient lang="en" />
    </>
  );
}
