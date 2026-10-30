import type { Metadata } from 'next';
import ScreenCaptureClient from '../ScreenCaptureClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { TRANSLATIONS } from '../translations';

export const metadata: Metadata = {
  title: 'Free Online Screen Recorder - Screen Capture with Audio, No Install & No Watermark',
  description:
    'Free, minimalist, zero-install, and watermark-free online screen recorder running 100% locally in your browser. Real-time audio mixing for system sound and microphone voiceover, with direct download and PRV5 private sharing.',
  keywords:
    'online screen recorder screen capture with audio no install screen recorder no watermark in-browser video recorder webm recorder client-side audio mixing',
  alternates: {
    canonical: 'https://tools.cjkuo.net/screen-capture/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/screen-capture/',
      en: 'https://tools.cjkuo.net/screen-capture/en/',
      'x-default': 'https://tools.cjkuo.net/screen-capture/en/',
    },
  },
  openGraph: {
    title: 'Free Online Screen Recorder - Screen Capture with Audio, No Install & No Watermark',
    description:
      'Minimalist in-browser screen recorder with simultaneous system & mic audio mixing, high quality encoding, zero watermark, and secure PRV5 sharing.',
    url: 'https://tools.cjkuo.net/screen-capture/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Screen Recorder - Screen Capture with Audio, No Install & No Watermark',
    description:
      'Minimalist in-browser screen recorder with simultaneous system & mic audio mixing, high quality encoding, zero watermark, and secure PRV5 sharing.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free Online Screen Recorder',
  url: 'https://tools.cjkuo.net/screen-capture/en/',
  description:
    'Pure client-side screen recording tool with real-time audio mixing, WebM/MKV/MP4 encoding, and zero server storage.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS.en.faqItems);

export default function ScreenCaptureEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ScreenCaptureClient lang="en" />
    </>
  );
}
