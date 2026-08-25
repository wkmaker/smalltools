import type { Metadata } from 'next';
import OgGeneratorClient from '../OgGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'OG Image Generator - Free Online Open Graph & Social Card Creator',
  description:
    'Free online Open Graph (OG) image generator. Create social share cards with 4 modern templates, custom typography, logo and feature image upload, 2x Retina supersampling, and PNG/JPEG/WebP/SVG multi-format export.',
  keywords:
    'OG image generator, open graph generator, twitter card generator, facebook share image creator, social media cover maker, free og image builder',
  alternates: {
    canonical: 'https://tools.cjkuo.net/og-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/og-generator/',
      en: 'https://tools.cjkuo.net/og-generator/en/',
      'x-default': 'https://tools.cjkuo.net/og-generator/en/',
    },
  },
  openGraph: {
    title: 'OG Image Generator - Free Online Open Graph & Social Card Creator',
    description:
      'Instantly generate custom Open Graph social cards with 4 templates, logo embed, custom colors, and PNG/JPEG/WEBP/SVG exports.',
    url: 'https://tools.cjkuo.net/og-generator/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OG Image Generator - Free Online Open Graph & Social Card Creator',
    description:
      'Instantly generate custom Open Graph social cards with 4 templates, logo embed, custom colors, and PNG/JPEG/WEBP/SVG exports.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'OG Image Generator',
  url: 'https://tools.cjkuo.net/og-generator/en/',
  description:
    'Professional client-side Open Graph and social media cover generator supporting 4 templates, logo embedding, and PNG/JPEG/WEBP/SVG export.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is an Open Graph (OG) image? Why is it crucial for every webpage?',
    a: 'The Open Graph protocol was introduced by Facebook in 2010 to standardize social metadata. When a URL is shared on Facebook, Twitter/X, LinkedIn, Discord, Slack, or messaging apps, crawlers look for `<meta property="og:image" ...>` to render a rich link preview card.\n\nStatistical data shows that links with custom OG images receive over 180% higher click-through rates (CTR) compared to plain links, making it essential for SEO and brand visibility.',
  },
  {
    q: 'What are the recommended dimensions and aspect ratios for social platforms?',
    a: 'The universal golden standard is 1200 x 630 pixels (~1.91:1 aspect ratio).\n\n① Facebook / LinkedIn / Discord: Native 1200 x 630.\n② Twitter / X: Native 1200 x 675 (16:9) large image summary card.\n③ Instagram Post: Square 1080 x 1080 (1:1).\n④ Stories / Mobile: Vertical 1080 x 1920 (9:16).\n\nThis tool supports all standard dimensions with instant responsive redraw!',
  },
  {
    q: 'When should I use each of the four design templates?',
    a: 'Each template is tailored for distinct content styles:\n\n① Modern Minimal: Clean negative space and subtle geometric borders, ideal for tech blogs, release notes, and open-source repos.\n② Cyber Glow: Futuristic dark neon glow, ideal for SaaS products, AI platforms, and developer utilities.\n③ Split Showcase: Side-by-side layout featuring your uploaded product screenshot or illustration, ideal for in-depth reviews and portfolios.\n④ Bold Impact: Ultra-bold typography and high-contrast accent blocks, ideal for social headlines, quotes, and announcements.',
  },
  {
    q: 'Can I use the generated images in commercial projects? Are there watermarks?',
    a: '100% free with complete commercial rights! There are zero watermarks, and you retain 100% ownership of all exported assets.\n\nFurthermore, this tool runs entirely on the client-side (inside your browser). Your text, logos, and uploaded images are never uploaded to any remote server, guaranteeing complete privacy.',
  },
  {
    q: 'Why are multiple export formats (PNG / JPEG / WebP / SVG) supported?',
    a: 'Each format excels in specific use cases:\n\n① PNG: Lossless quality with crisp text edges, the industry standard for OG social cards.\n② JPEG: Great for photo-heavy backgrounds, reducing file sizes by over 50%.\n③ WebP: Modern web format balancing superior compression with high visual fidelity.\n④ SVG: Vector XML container for easy embedding or secondary tweaking in design tools like Figma.',
  },
  {
    q: 'How do I embed the generated OG image in HTML or Next.js?',
    a: 'After exporting and placing the image in your public directory or CDN, add these meta tags to your HTML `<head>`:\n\n```html\n<meta property="og:title" content="Your Page Title" />\n<meta property="og:description" content="Your Page Description" />\n<meta property="og:image" content="https://yourdomain.com/og-image.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />\n```\n\nIn Next.js App Router, simply declare `openGraph` and `twitter` inside `export const metadata` in `app/page.tsx`!',
  },
]);

export default function OgGeneratorEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <OgGeneratorClient lang="en" />
    </>
  );
}
