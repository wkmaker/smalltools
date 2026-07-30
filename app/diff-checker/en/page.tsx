import type { Metadata } from 'next';
import DiffCheckerClient from '../DiffCheckerClient';

export const metadata: Metadata = {
  title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
  description:
    'Free online Document Diff Checker tool! Supports side-by-side split view, unified line-by-line comparison, Myers algorithm diff parsing, and local privacy security.',
  keywords:
    'document diff, text comparison, diff checker, code comparison, text diff, diff analysis, online diff tool',
  alternates: {
    canonical: 'https://tools.cjkuo.net/diff-checker/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/diff-checker/',
      en: 'https://tools.cjkuo.net/diff-checker/en/',
    },
  },
  openGraph: {
    title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
    description: '100% private and secure text diff tool supporting Split and Unified view modes.',
    url: 'https://tools.cjkuo.net/diff-checker/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
    description: '100% private and secure text diff tool supporting Split and Unified view modes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Document Diff Checker',
  url: 'https://tools.cjkuo.net/diff-checker/en/',
  description: 'Free online document diff checker supporting side-by-side split view and interactive unified merge.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function DiffCheckerEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DiffCheckerClient lang="en" />
    </>
  );
}
