import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeClient from '../HomeClient';

export const metadata: Metadata = {
  title: 'Online Toolbox | Free Developer & Daily Utilities - Calculators, JSON, Image, Password, SSL',
  description:
    'Free, ad-free online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
  keywords:
    'free online tools, mortgage calculator, personal loan, JSON formatter, Base64 encoder, SSL converter, password generator, image compressor, futures margin, compound interest',
  alternates: {
    canonical: 'https://tools.cjkuo.net/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/',
      en: 'https://tools.cjkuo.net/en/',
      'x-default': 'https://tools.cjkuo.net/en/',
    },
  },
  openGraph: {
    title: 'Online Toolbox | Free Developer & Daily Utilities - 20+ Utilities',
    description:
      'Free, ad-free online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
    url: 'https://tools.cjkuo.net/en/',
    siteName: 'Online Toolbox',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/img/StockSnap_00F7DB5857.webp',
        width: 1200,
        height: 630,
        alt: 'Online Toolbox - Free Web Utilities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online Toolbox | Free Developer & Daily Utilities - 20+ Utilities',
    description:
      'Free, ad-free online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
    images: ['/img/StockSnap_00F7DB5857.webp'],
  },
};

const schemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Online Toolbox',
  url: 'https://tools.cjkuo.net/en/',
  description:
    'Free, ad-free online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://tools.cjkuo.net/en/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function EnglishHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-text-sub">
            Loading...
          </div>
        }
      >
        <HomeClient lang="en" />
      </Suspense>
    </>
  );
}
